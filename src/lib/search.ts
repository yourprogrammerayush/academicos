import type { CatalogFile } from './types';
import { SUBJECT_SYNONYMS } from './catalog';

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function expandQuery(q: string): string[] {
  const tokens = tokenize(q);
  const expanded = new Set(tokens);
  for (const [code, syns] of Object.entries(SUBJECT_SYNONYMS)) {
    if (tokens.includes(code.toLowerCase())) {
      syns.forEach((s) => s.split(' ').forEach((t) => expanded.add(t)));
    }
  }
  // Hinglish / common aliases
  const alias: Record<string, string> = {
    notes: 'notes',
    note: 'notes',
    pyq: 'pyq',
    pyqs: 'pyq',
    'question': 'pyq',
    'questions': 'pyq',
    'important': 'notes',
    'imp': 'notes',
    'video': 'video',
    'lecture': 'video',
    'audio': 'audio',
    'podcast': 'audio',
    'syllabus': 'syllabus',
    'assignment': 'assignment',
    'slides': 'presentation',
    'ppt': 'presentation',
  };
  for (const t of tokens) if (alias[t]) expanded.add(alias[t]);
  return [...expanded];
}

function scoreFile(f: CatalogFile, qTokens: string[], raw: string): number {
  const name = f.name.toLowerCase();
  const path = f.path.join(' ').toLowerCase();
  const subject = (f.subject || '').toLowerCase();
  const type = f.type.toLowerCase();
  const hay = `${name} ${path} ${subject} ${type} ${(f.year || '').toLowerCase()} ${(f.semester || '').toLowerCase()}`;
  let score = 0;
  const rawLower = raw.toLowerCase();
  if (name.includes(rawLower) && rawLower.length > 2) score += 50;
  if (hay.includes(rawLower) && rawLower.length > 2) score += 20;
  for (const t of qTokens) {
    if (name.includes(t)) score += 12;
    if (subject.includes(t)) score += 10;
    if (type.includes(t)) score += 8;
    if (path.includes(t)) score += 4;
    if (hay.includes(t)) score += 2;
    // prefix match for typos / partial
    if (name.split(/[\s._-]+/).some((w) => w.startsWith(t) && t.length >= 3)) score += 5;
  }
  // Year/semester boosts
  const yearMap: Record<string, string> = {
    '1st': '1st year',
    '2nd': '2nd year',
    '3rd': '3rd year',
    '4th': '4th year',
    first: '1st year',
    second: '2nd year',
    third: '3rd year',
    fourth: '4th year',
  };
  for (const [k, v] of Object.entries(yearMap)) {
    if (rawLower.includes(k) && (f.year || '').toLowerCase() === v) score += 15;
  }
  const semMatch = rawLower.match(/sem(?:ester)?\s*(\d)/);
  if (semMatch && f.semester?.toLowerCase() === `sem ${semMatch[1]}`) score += 15;
  return score;
}

export function searchCatalog(files: CatalogFile[], query: string, limit = 30): CatalogFile[] {
  const q = query.trim();
  if (!q) return files;
  const tokens = expandQuery(q);
  return files
    .map((f) => ({ f, s: scoreFile(f, tokens, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.f);
}
