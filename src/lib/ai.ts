import type { CatalogFile } from './types';
import { searchCatalog } from './search';

export const GROQ_MODELS = {
  primary: process.env.GROQ_MODEL_PRIMARY || 'openai/gpt-oss-120b',
  fast: process.env.GROQ_MODEL_FAST || 'openai/gpt-oss-20b',
};

/* ────────────────────────────────────────────────────────────────────
   Knowledge map
   The model is only as good as the context it is handed. Rather than
   dumping 67 raw filenames, we give it a structured picture: what exists
   per subject, per semester, per resource type, plus coverage gaps.
   ──────────────────────────────────────────────────────────────────── */

export type KnowledgeSnapshot = {
  totalFiles: number;
  totalFolders: number;
  rootName: string;
  subjects: { name: string; files: number; types: string[]; semester?: string }[];
  semesters: { name: string; files: number; subjects: string[] }[];
  typeCounts: Record<string, number>;
  kindCounts: Record<string, number>;
  gaps: string[];
};

export function buildKnowledge(files: CatalogFile[], rootName = ''): KnowledgeSnapshot {
  const subjectMap = new Map<string, { files: number; types: Set<string>; semester?: string }>();
  const semesterMap = new Map<string, { files: number; subjects: Set<string> }>();
  const typeCounts: Record<string, number> = {};
  const kindCounts: Record<string, number> = {};

  for (const f of files) {
    const subject = f.subject || 'Unclassified';
    const s = subjectMap.get(subject) || { files: 0, types: new Set<string>(), semester: f.semester };
    s.files += 1;
    s.types.add(f.type);
    if (!s.semester && f.semester) s.semester = f.semester;
    subjectMap.set(subject, s);

    if (f.semester) {
      const sem = semesterMap.get(f.semester) || { files: 0, subjects: new Set<string>() };
      sem.files += 1;
      if (f.subject) sem.subjects.add(f.subject);
      semesterMap.set(f.semester, sem);
    }

    typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
    kindCounts[f.kind] = (kindCounts[f.kind] || 0) + 1;
  }

  const subjects = [...subjectMap.entries()]
    .map(([name, v]) => ({
      name,
      files: v.files,
      types: [...v.types].sort(),
      semester: v.semester,
    }))
    .sort((a, b) => b.files - a.files);

  const semesters = [...semesterMap.entries()]
    .map(([name, v]) => ({ name, files: v.files, subjects: [...v.subjects].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Honest coverage gaps the assistant should admit rather than invent around
  const gaps: string[] = [];
  const withPyq = new Set(files.filter((f) => f.type === 'PYQ' && f.subject).map((f) => f.subject!));
  const withNotes = new Set(files.filter((f) => f.type === 'Notes' && f.subject).map((f) => f.subject!));
  for (const s of subjects) {
    if (s.name === 'Unclassified') continue;
    if (!withPyq.has(s.name)) gaps.push(`${s.name}: no past papers uploaded`);
    if (!withNotes.has(s.name)) gaps.push(`${s.name}: no notes uploaded`);
  }

  return {
    totalFiles: files.length,
    totalFolders: new Set(files.flatMap((f) => f.path)).size,
    rootName,
    subjects,
    semesters,
    typeCounts,
    kindCounts,
    gaps: gaps.slice(0, 12),
  };
}

export function knowledgeDigest(knowledge: KnowledgeSnapshot): string {
  const lines: string[] = [];
  lines.push(`Library: ${knowledge.totalFiles} files across ${knowledge.subjects.length} subjects.`);
  lines.push(
    `Resource mix: ${Object.entries(knowledge.typeCounts)
      .map(([k, v]) => `${k} ${v}`)
      .join(', ')}.`
  );
  lines.push('');
  lines.push('SEMESTERS');
  for (const s of knowledge.semesters) {
    lines.push(`- ${s.name} — ${s.files} files — subjects: ${s.subjects.join(', ') || 'unclassified'}`);
  }
  lines.push('');
  lines.push('SUBJECTS');
  for (const s of knowledge.subjects) {
    if (s.name === 'Unclassified') continue;
    lines.push(`- ${s.name}${s.semester ? ` (${s.semester})` : ''} — ${s.files} files, has: ${s.types.join(', ')}`);
  }
  if (knowledge.gaps.length) {
    lines.push('');
    lines.push('KNOWN GAPS — say so plainly if asked; never invent a file to fill them');
    for (const g of knowledge.gaps) lines.push(`- ${g}`);
  }
  return lines.join('\n');
}

/** Compact per-file index. Kept under a token budget by trimming path noise. */
export function catalogContext(files: CatalogFile[], max = 200): string {
  return files
    .slice(0, max)
    .map((f) => {
      const meta = [f.year, f.semester, f.subject, f.type].filter(Boolean).join(' · ');
      return `[${f.id}] ${f.name.replace(/\.pdf$/i, '')} :: ${meta} :: ${f.kind}`;
    })
    .join('\n');
}

export function systemPrompt(files: CatalogFile[], rootName = ''): string {
  const knowledge = buildKnowledge(files, rootName);
  return [
    'You are Study AI inside AcademicOS, the personal academic workspace of Ayush Jha (2CSE-4, B.Tech CSE 2026–2030).',
    '',
    '## What you know',
    'You are grounded in the student\'s actual Drive library, summarised below. You may reason freely',
    'about the *content* of the subjects (you are a strong CSE tutor), but every *file* you reference',
    'must exist in the catalogue. Never invent a filename, paper year, or subject that is not listed.',
    '',
    '## How to answer',
    '- Lead with the direct answer in one or two sentences. No preamble, no "Great question".',
    '- Then give the substance: steps, comparisons, formulas, or a short worked example.',
    '- Use Markdown. Use $...$ for inline maths and $$...$$ for display maths.',
    '- Keep it scannable: short paragraphs, bullets only where a list is genuinely a list.',
    '- Match the user\'s language exactly — English, हिंदी, Hinglish, or 日本語.',
    '',
    '## Recommending files',
    'When a file in the catalogue would genuinely help, put it on its own line as:',
    'FILE: <id>',
    'at the end of your answer, one per line, maximum 4. Do not wrap it in backticks or a bullet.',
    'Only recommend files that actually answer the question. Recommending nothing is a valid answer.',
    '',
    '## Honesty',
    'If the library lacks a past paper or notes for a subject, say so and offer what does exist.',
    'If you are unsure, say what you would need to check.',
    '',
    '──── LIBRARY STRUCTURE ────',
    knowledgeDigest(knowledge),
    '',
    '──── FILES ────',
    'Format: [id] name :: year · semester · subject · type :: kind',
    catalogContext(files),
  ].join('\n');
}

/** Local heuristic responder — works with zero API keys. */
export function localAnswer(query: string, files: CatalogFile[]): { text: string; fileIds: string[] } {
  const q = query.toLowerCase();
  const hits = searchCatalog(files, query, 6);
  const knowledge = buildKnowledge(files);

  const wantsVideo = /video|lecture|watch|reel/.test(q);
  const wantsAudio = /audio|podcast|listen|mp3/.test(q);
  const wantsPyq = /pyq|question|paper|exam|past/.test(q);
  const wantsNotes = /note|important|imp|padhai|study/.test(q);

  let pool = hits;
  if (wantsVideo) pool = hits.filter((h) => h.kind === 'video');
  if (wantsAudio) pool = hits.filter((h) => h.kind === 'audio');
  if (wantsPyq) pool = hits.filter((h) => h.type === 'PYQ');
  if (wantsNotes) pool = hits.filter((h) => h.type === 'Notes' || h.kind === 'pdf');
  if (pool.length === 0) pool = hits;
  const ids = pool.slice(0, 4).map((h) => h.id);

  if (hits.length === 0) {
    const subjectList = knowledge.subjects
      .filter((s) => s.name !== 'Unclassified')
      .slice(0, 8)
      .map((s) => s.name)
      .join(', ');
    return {
      text: `I couldn't find anything matching **"${query}"** in your library.\n\nWhat's indexed right now: ${subjectList}.\n\nTry a subject name (Digital Electronics, Discrete Mathematics, OOPS), a resource type (*past papers*, *notes*), or a semester. Live AI answers switch on the moment a \`GROQ_API_KEY\` is configured.`,
      fileIds: [],
    };
  }

  const lines = pool.slice(0, 4).map((h) => {
    const meta = [h.year, h.semester, h.subject].filter(Boolean).join(' · ');
    return `- **${h.name.replace(/\.pdf$/i, '')}**${meta ? ` — ${meta}` : ''}`;
  });

  let intro = "Here's what's in your library for that:";
  if (wantsPyq) intro = 'Here are the past papers on this:';
  if (wantsVideo) intro = 'Here are the lecture videos for this:';
  if (wantsAudio) intro = 'Here is the audio you can listen to:';
  if (wantsNotes) intro = 'These are the notes I would start with:';

  return { text: `${intro}\n\n${lines.join('\n')}`, fileIds: ids };
}

export function studyToolPrompt(tool: string, fileName: string, excerpt = ''): string {
  const base = `You are a study assistant inside AcademicOS. The student has "${fileName}" open in the reader.`;
  const noExcerpt = `\n\nYou do not have the page text, only the filename. Be explicit that this is a general overview of what a document with this title usually covers, and invite them to select text in the reader for a precise answer.`;
  const excerptPart = excerpt
    ? `\n\n──── DOCUMENT TEXT ────\n${excerpt.slice(0, 12000)}`
    : noExcerpt;

  switch (tool) {
    case 'explain':
      return `${base} Explain the core idea in plain language, give one concrete analogy, then close with the three things most likely to be examined.${excerptPart}`;
    case 'summary':
      return `${base} Write an exam-oriented summary: what this document covers, the key definitions, and the five most likely exam questions. Use short headed sections.${excerptPart}`;
    case 'formulas':
      return `${base} Extract every formula, theorem or rule worth memorising. Present each as a LaTeX display equation followed by a one-line note on when to use it.${excerptPart}`;
    case 'practice':
      return `${base} Write 5 practice questions mixing MCQ and short answer, ordered easy to hard. Put the answer key in a separate section at the very end under "## Answers".${excerptPart}`;
    default:
      return `${base} Summarise this material clearly and concisely.${excerptPart}`;
  }
}
