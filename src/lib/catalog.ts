import type { CatalogFile, FileKind, ResourceType } from './types';

export const SUBJECT_SYNONYMS: Record<string, string[]> = {
  COA: ['computer organization', 'computer organisation', 'coa', 'computer architecture'],
  DCN: ['data communication', 'dcn', 'data communication network'],
  DECO: ['digital electronics', 'deco', 'digital electronics and computer organization'],
  OOP: ['oop', 'oops', 'object oriented', 'object-oriented', 'java', 'cpp'],
  DSA: ['dsa', 'data structure', 'data structures'],
  DBMS: ['dbms', 'database', 'database management'],
  OS: ['operating system', 'operating systems'],
  CN: ['computer network', 'computer networks', 'cn'],
  DM: ['discrete math', 'discrete mathematics', 'discrete', 'dm'],
  AI: ['artificial intelligence', 'gen ai', 'generative ai', 'llm', 'ai'],
  DVA: ['data visualization', 'data analytics', 'dva', 'data visualisation'],
  SE: ['software engineering'],
  CC: ['cloud computing'],
  DEAI: ['data engineering'],
  ET: ['emerging technolog'],
  CCS: ['ccs', 'communication skills', 'communication skill'],
  NPTEL: ['nptel'],
  LTA: ['lta'],
  PALB: ['palb'],
  DMW: ['dmw'],
  EVS: ['evs', 'environmental'],
  PPS: ['programming for problem solving', 'pps'],
  ML: ['machine learning', 'ml'],
  TOC: ['theory of computation', 'toc', 'automata'],
  CO: ['computer organization', 'coa'],
};

const SUBJECT_CANONICAL: Record<string, string> = {
  COA: 'Computer Organization & Architecture',
  DCN: 'Data Communication & Networks',
  DECO: 'Digital Electronics',
  OOP: 'Object-Oriented Programming',
  DSA: 'Data Structures & Algorithms',
  DBMS: 'Database Management Systems',
  OS: 'Operating Systems',
  CN: 'Computer Networks',
  DM: 'Discrete Mathematics',
  AI: 'Artificial Intelligence',
  ML: 'Machine Learning',
  TOC: 'Theory of Computation',
  DVA: 'Data Visualization & Analytics',
  SE: 'Software Engineering',
  CC: 'Cloud Computing',
  DEAI: 'Data Engineering for AI',
  ET: 'Emerging Technologies',
  LTA: 'LTA',
  PALB: 'PALB',
  DMW: 'DMW',
  EVS: 'Environmental Studies',
  PPS: 'Programming for Problem Solving',
  CCS: 'Communication Skills',
  NPTEL: 'NPTEL Certification',
};

export function kindFromMime(mime: string, name: string): FileKind {
  const m = (mime || '').toLowerCase();
  const n = name.toLowerCase();
  if (m === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (m.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/.test(n)) return 'video';
  if (m.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|aac)$/.test(n)) return 'audio';
  if (m.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(n)) return 'image';
  if (m.startsWith('text/') || /\.(txt|md|csv|json|html)$/.test(n)) return 'text';
  if (
    m.includes('document') ||
    m.includes('presentation') ||
    m.includes('spreadsheet') ||
    /\.(docx?|pptx?|xlsx?|odt|odp)$/.test(n)
  )
    return 'doc';
  return 'other';
}

export function typeFromName(name: string, kind: FileKind, path: string[] = []): ResourceType {
  const n = name.toLowerCase();
  const p = path.join(' ').toLowerCase();
  const hay = `${n} ${p}`;
  if (kind === 'video') return 'Video';
  if (kind === 'audio') return 'Audio';
  if (kind === 'image') return 'Image';
  if (/syllabus|curriculum|scheme/.test(hay)) return 'Syllabus';
  if (/pyq|previous year|question bank|\bqb\b|question paper|past paper|exam paper|\bqp\b|\bete\b|\bmid ?term\b|\bend ?term\b|\bend ?sem\b/.test(hay)) return 'PYQ';
  if (/assignment|lab record|practical|lab manual|tutorial|solution/.test(hay)) return 'Assignment';
  if (/\.pptx?|presentation|slides|seminar/.test(hay)) return 'Presentation';
  if (/notes|handwritten|lecture|chapter|unit|module|material|guide|handbook|calendar|notice/.test(hay))
    return 'Notes';
  if (kind === 'pdf' || kind === 'doc') return 'Document';
  return 'Other';
}

export function yearFromPath(path: string[], name: string): string | undefined {
  const hay = [...path, name].join(' ').toUpperCase();
  // Explicit year statements win
  if (/\b1ST\s*YEAR|\bFIRST\s*YEAR|\bYEAR\s*1\b/.test(hay)) return '1st Year';
  if (/\b2ND\s*YEAR|\bSECOND\s*YEAR|\bYEAR\s*2\b/.test(hay)) return '2nd Year';
  if (/\b3RD\s*YEAR|\bTHIRD\s*YEAR|\bYEAR\s*3\b/.test(hay)) return '3rd Year';
  if (/\b4TH\s*YEAR|\bFOURTH\s*YEAR|\bYEAR\s*4\b/.test(hay)) return '4th Year';
  // B.Tech 8-semester layout: 1-2 → 1st year, 3-4 → 2nd year, 5-6 → 3rd year, 7-8 → 4th year
  const sem = hay.match(/SEM(?:ESTER)?\s*(\d)/);
  if (sem) {
    const n = Number(sem[1]);
    if (n <= 2) return '1st Year';
    if (n <= 4) return '2nd Year';
    if (n <= 6) return '3rd Year';
    return '4th Year';
  }
  return undefined;
}

export function semesterFromPath(path: string[], name: string): string | undefined {
  const hay = [...path, name].join(' ').toUpperCase();
  const m = hay.match(/SEM(?:ESTER)?\s*(\d)/);
  if (m) return `Sem ${m[1]}`;
  return undefined;
}

const GENERIC =
  /^(SEM\s*\d|SEMESTER|ACADEMIC CALENDAR|ASSESSMENT|NOTICES|STUDENT HANDBOOK|VIDEO GUIDES|AUDIO GUIDES|COURSES|PYQS?|QUESTION BANKS?|DATESHEET|TIMETABLE|GUIDES|NPTEL|EXAM MATERIALS|UNIVERSITY NOTES|OTHERS|ALL SYLLABUS|IILM LOGO PNGs)/i;

const SUBJECT_ORDER = [
  'CCS',
  'NPTEL',
  'DEAI', 'DECO', 'DBMS', 'PALB', 'PPS', 'DVA', 'DMW', 'LTA', 'EVS', 'SE', 'CC', 'TOC',
  'COA', 'DCN', 'DSA', 'OOP', 'DM', 'ET', 'AI', 'ML', 'OS', 'CN',
];

function matchSubject(hayRaw: string): string | undefined {
  const hay = hayRaw.toUpperCase();
  for (const code of SUBJECT_ORDER) {
    const syns = SUBJECT_SYNONYMS[code];
    if (!syns) continue;
    for (const s of syns) {
      const needle = s.toUpperCase();
      if (needle.length <= 3) {
        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`(^|[^A-Z])${escaped}(S|ES)?([^A-Z]|$)`).test(hay))
          return SUBJECT_CANONICAL[code] || code;
      } else if (hay.includes(needle)) {
        return SUBJECT_CANONICAL[code] || code;
      }
    }
  }
  return undefined;
}

export function subjectFromName(name: string, path: string[] = []): string | undefined {
  for (const part of [...path].reverse()) {
    const clean = part.trim();
    if (!clean || GENERIC.test(clean)) continue;
    const hit = matchSubject(clean);
    if (hit) return hit;
  }
  return matchSubject(name);
}

export function enrichFile(f: CatalogFile): CatalogFile {
  const kind = f.kind && f.kind !== 'other' ? f.kind : kindFromMime(f.mimeType, f.name);
  const type = f.type && f.type !== 'Other' ? f.type : typeFromName(f.name, kind, f.path);
  return {
    ...f,
    kind,
    type,
    year: f.year || yearFromPath(f.path, f.name),
    semester: f.semester || semesterFromPath(f.path, f.name),
    subject: f.subject || subjectFromName(f.name, f.path),
  };
}

export function formatSize(size?: string): string {
  if (!size) return '';
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function breadcrumb(path: string[]): string {
  return path.length ? path.join(' / ') : 'Root';
}
