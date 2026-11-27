import { NextRequest, NextResponse } from 'next/server';
import { SEED_CATALOG } from '@/data/seed-catalog';
import { GROQ_MODELS, localAnswer, systemPrompt } from '@/lib/ai';
import { getCatalog } from '@/lib/drive-cache';
import type { CatalogFile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Reads through the shared cache so the AI always sees the latest index. */
async function getCatalogFiles(): Promise<{ files: CatalogFile[]; rootName: string }> {
  const result = await getCatalog();
  return {
    files: result.catalog.files.length ? result.catalog.files : SEED_CATALOG.files,
    rootName: result.catalog.rootName || SEED_CATALOG.rootName,
  };
}

async function groqStream(messages: { role: string; content: string }[], model: string, apiKey: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, stream: true, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.body!;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    messages?: { role: string; content: string }[];
    query?: string;
  };
  const messages = body.messages || [];
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || body.query || '';
  const { files, rootName } = await getCatalogFiles();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const { text, fileIds } = localAnswer(lastUser, files);
    return NextResponse.json({ text, fileIds, engine: 'local', note: 'Add GROQ_API_KEY for full AI' });
  }

  const groqMessages = [
    { role: 'system', content: systemPrompt(files, rootName) },
    ...messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
  ];

  // Fallback chain: primary -> fast
  for (const model of [GROQ_MODELS.primary, GROQ_MODELS.fast]) {
    try {
      const stream = await groqStream(groqMessages, model, apiKey);
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let full = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith('data:')) continue;
              const payload = t.slice(5).trim();
              if (payload === '[DONE]') continue;
              try {
                const json = JSON.parse(payload);
                const delta = json.choices?.[0]?.delta?.content || '';
                if (delta) {
                  full += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
                }
              } catch {
                // ignore partial
              }
            }
          }
          // Extract FILE: ids for cards
          const ids = [...full.matchAll(/FILE:\s*([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
          const clean = full.replace(/FILE:\s*[A-Za-z0-9_-]+\n?/g, '').trim();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fileIds: ids, engine: model })}\n\n`));
          controller.close();
        },
      });
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (err) {
      console.error(`[chat] Groq ${model} failed:`, err);
      // try next model
    }
  }

  // All Groq models failed -> local fallback
  const { text, fileIds } = localAnswer(lastUser, files);
  return NextResponse.json({ text, fileIds, engine: 'local-fallback' });
}
