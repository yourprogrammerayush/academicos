import type { CatalogFile } from './types';
import { searchCatalog } from './search';

export const GROQ_MODELS = {
  primary: process.env.GROQ_MODEL_PRIMARY || 'openai/gpt-oss-120b',
  fast: process.env.GROQ_MODEL_FAST || 'openai/gpt-oss-20b',
};

export function catalogContext(files: CatalogFile[], max = 120): string {
  return files
    .slice(0, max)
    .map(
      (f) =>
        `- [${f.id}] ${f.name} | ${f.type} | ${f.year || ''} ${f.semester || ''} ${f.subject || ''} | ${f.path.join(' / ')}`
    )
    .join('\n');
}

export function systemPrompt(files: CatalogFile[]): string {
  return [
    'You are AcademicOS Study AI — a precise academic assistant for a CSE student.',
    'You are grounded ONLY in the catalog below. Recommend files by their exact [id] tag.',
    'When you recommend files, list them as: FILE: <id> (one per line). The app renders rich cards from these.',
    'Respond in the same language as the user (English, Hindi, Hinglish, Japanese, or any language).',
    'Be concise, structured, and actionable. Use Markdown. Use LaTeX for formulas. Never invent files.',
    '',
    'CATALOG:',
    catalogContext(files),
  ].join('\n');
}

/** Local heuristic responder — works with zero API keys. */
export function localAnswer(query: string, files: CatalogFile[]): { text: string; fileIds: string[] } {
  const q = query.toLowerCase();
  const hits = searchCatalog(files, query, 6);
  const fileIds = hits.map((h) => h.id);

  const wantsVideo = /video|lecture|watch|reel/.test(q);
  const wantsAudio = /audio|podcast|listen|mp3/.test(q);
  const wantsPyq = /pyq|question|paper|exam/.test(q);
  const wantsNotes = /note|important|imp|padhai|study/.test(q);

  let pool = hits;
  if (wantsVideo) pool = hits.filter((h) => h.kind === 'video');
  if (wantsAudio) pool = hits.filter((h) => h.kind === 'audio');
  if (wantsPyq) pool = hits.filter((h) => h.type === 'PYQ');
  if (wantsNotes) pool = hits.filter((h) => h.type === 'Notes' || h.kind === 'pdf');
  if (pool.length === 0) pool = hits;
  const ids = pool.slice(0, 4).map((h) => h.id);

  if (hits.length === 0) {
    return {
      text: `I couldn't find a match for **"${query}"** in your library yet.\n\nTry asking with a subject code (COA, DCN, OOP, DBMS…), a year/semester (e.g. *2nd year Sem 3*), or a resource type (notes, PYQ, video, audio). You can also browse the **Library** tab to explore folders.`,
      fileIds: [],
    };
  }

  const lines = pool.slice(0, 4).map((h) => {
    const meta = [h.year, h.semester, h.subject].filter(Boolean).join(' · ');
    return `- **${h.name}**${meta ? ` — ${meta}` : ''}`;
  });

  let intro = 'Here\'s what I found in your library:';
  if (wantsPyq) intro = 'Here are the most relevant question papers / PYQs:';
  if (wantsVideo) intro = 'Here are the best lecture videos for this:';
  if (wantsAudio) intro = 'Here are audio guides you can listen to:';
  if (wantsNotes) intro = 'Here are the key notes I recommend:';

  const text = `${intro}\n\n${lines.join('\n')}\n\nTap **Open** on any card to read/watch/listen inside AcademicOS, or **Download** to save it. Want a summary or practice questions? Open the file and use the AI tools in the viewer.`;

  return { text, fileIds: ids };
}

export function studyToolPrompt(tool: string, fileName: string, excerpt = ''): string {
  const base = `You are a study assistant. The student opened "${fileName}".`;
  const excerptPart = excerpt ? `\n\nDocument excerpt:\n${excerpt.slice(0, 6000)}` : '';
  switch (tool) {
    case 'explain':
      return `${base} Explain this material in simple language with a short analogy, then list 3 key takeaways.${excerptPart}`;
    case 'summary':
      return `${base} Generate a crisp exam-oriented summary: key definitions, important points, and likely exam questions.${excerptPart}`;
    case 'formulas':
      return `${base} Extract the most important formulas/concepts as a clean list with LaTeX where relevant.${excerptPart}`;
    case 'practice':
      return `${base} Generate 5 practice questions (mix of MCQ + short answer) with an answer key hidden at the end.${excerptPart}`;
    default:
      return `${base} Summarize this material.${excerptPart}`;
  }
}
