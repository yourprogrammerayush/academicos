import { NextRequest, NextResponse } from 'next/server';
import { GROQ_MODELS, studyToolPrompt } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    tool?: string;
    fileName?: string;
    excerpt?: string;
  };
  const tool = body.tool || 'summary';
  const fileName = body.fileName || 'document';
  const excerpt = body.excerpt || '';
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      text: `**${tool.toUpperCase()} — ${fileName}**\n\nAdd \`GROQ_API_KEY\` in Vercel env vars to enable live AI study tools. Meanwhile, use the viewer controls (zoom, fullscreen, night mode) and the AI chat tab for catalog-grounded help.`,
      engine: 'local',
    });
  }

  const prompt = studyToolPrompt(tool, fileName, excerpt);
  for (const model of [GROQ_MODELS.primary, GROQ_MODELS.fast]) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });
      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = data.choices?.[0]?.message?.content || 'No response.';
      return NextResponse.json({ text, engine: model });
    } catch (err) {
      console.error(`[ai] ${model} failed:`, err);
    }
  }
  return NextResponse.json({ text: 'AI is temporarily unavailable. Please try again in a moment.', engine: 'fallback' });
}
