import { NextResponse } from 'next/server';
import { GROQ_MODELS } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * TEMPORARY diagnostic endpoint. Deleted immediately after verification.
 * Never returns any part of the API key — only booleans, status codes and
 * the model name Groq resolved.
 */
export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ hasKey: false, ok: false }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const results: Record<string, unknown>[] = [];
  for (const model of [GROQ_MODELS.primary, GROQ_MODELS.fast]) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
          max_tokens: 8,
          temperature: 0,
        }),
      });
      const raw = await res.text();
      results.push({
        model,
        status: res.status,
        ok: res.ok,
        body: res.ok ? JSON.parse(raw).choices?.[0]?.message?.content : raw.slice(0, 180),
      });
    } catch (err) {
      results.push({ model, ok: false, error: String(err).slice(0, 180) });
    }
  }

  return NextResponse.json({
    hasKey: true,
    keyLength: apiKey.length,
    keyPrefix: apiKey.slice(0, 4),
    models: results,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
