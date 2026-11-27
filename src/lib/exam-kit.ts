import { useMemo } from 'react';
import type { CatalogFile } from './types';

export interface KitStep {
  id: string;
  role: string;
  hint: string;
  file: CatalogFile;
}

export interface ExamKit {
  subject: string;
  steps: KitStep[];
  counts: { papers: number; notes: number; video: number; audio: number; other: number };
  coverage: number;
  examReady: boolean;
}

/** The order we want a student to work through material before an exam. */
const ROLE_ORDER: { role: string; hint: string; match: (f: CatalogFile) => boolean }[] = [
  {
    role: 'Know the scope',
    hint: 'Read the syllabus first so nothing surprises you in the paper.',
    match: (f) => f.type === 'Syllabus',
  },
  {
    role: 'Skim the notes',
    hint: 'Get the shape of the unit before touching questions.',
    match: (f) => f.type === 'Notes' && f.kind === 'pdf',
  },
  {
    role: 'Watch the walkthrough',
    hint: 'Lectures cover the derivations that notes leave out.',
    match: (f) => f.kind === 'video',
  },
  {
    role: 'Sit a past paper',
    hint: 'Do this timed, with no notes. It is the only honest test.',
    match: (f) => f.type === 'PYQ' && f.kind === 'pdf',
  },
  {
    role: 'Check against solutions',
    hint: 'Mark your attempt, then reread only what you got wrong.',
    match: (f) => f.type === 'PYQ' && /solution|ans/i.test(f.name),
  },
  {
    role: 'Drill the question bank',
    hint: 'Repeat questions that already appeared twice.',
    match: (f) => /question bank|\bqb\b/i.test(f.name),
  },
  {
    role: 'Listen on the move',
    hint: 'Play this while walking — passive recall still counts.',
    match: (f) => f.kind === 'audio',
  },
  {
    role: 'Practice the labs',
    hint: 'Lab files map closely to the applied questions.',
    match: (f) => f.type === 'Assignment',
  },
];

/**
 * Build one revision bundle for a subject: the best available file for each
 * revision step, in the order a student should actually use them.
 *
 * Deliberately deterministic — no scoring model, just priority rules, so the
 * same subject always produces the same kit.
 */
export function buildExamKit(subject: string, files: CatalogFile[]): ExamKit {
  const subjectFiles = files.filter((f) => f.subject === subject);

  const counts = {
    papers: subjectFiles.filter((f) => f.type === 'PYQ').length,
    notes: subjectFiles.filter((f) => f.type === 'Notes').length,
    video: subjectFiles.filter((f) => f.kind === 'video').length,
    audio: subjectFiles.filter((f) => f.kind === 'audio').length,
    other: subjectFiles.filter((f) => !['PYQ', 'Notes'].includes(f.type) && !['video', 'audio'].includes(f.kind)).length,
  };

  const used = new Set<string>();
  const steps: KitStep[] = [];

  for (const spec of ROLE_ORDER) {
    // Prefer the newest file that matches and hasn't already been picked.
    const candidate = subjectFiles
      .filter((f) => !used.has(f.id) && spec.match(f))
      .sort((a, b) => (b.modifiedTime || '').localeCompare(a.modifiedTime || ''))[0];

    if (candidate) {
      used.add(candidate.id);
      steps.push({
        id: `${spec.role}-${candidate.id}`,
        role: spec.role,
        hint: spec.hint,
        file: candidate,
      });
    }
  }

  const coverage = ROLE_ORDER.filter((spec) =>
    subjectFiles.some((f) => spec.match(f))
  ).length;

  return {
    subject,
    steps,
    counts,
    coverage: Math.round((coverage / ROLE_ORDER.length) * 100),
    examReady: counts.papers > 0 && counts.notes > 0,
  };
}

/** Every subject in the catalogue, with its kit, richest first. */
export function useExamKits(files: CatalogFile[]): ExamKit[] {
  return useMemo(() => {
    const subjects = Array.from(
      new Set(files.map((f) => f.subject).filter(Boolean) as string[])
    );
    return subjects
      .map((s) => buildExamKit(s, files))
      .sort((a, b) => b.steps.length - a.steps.length || a.subject.localeCompare(b.subject));
  }, [files]);
}
