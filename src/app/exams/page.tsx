'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  FileText,
  GraduationCap,
  Headphones,
  PlayCircle,
  Sparkle,
  Target,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { MobileTopBar } from '@/components/mobile-nav';
import { FileTypeIcon } from '@/components/file-icon';
import { downloadFile } from '@/components/file-card';
import { useExamKits, type ExamKit } from '@/lib/exam-kit';

export default function ExamsPage() {
  const { catalog, loading } = useApp();
  const kits = useExamKits(catalog.files);
  const [active, setActive] = useState<string | null>(null);

  const ready = kits.filter((k) => k.examReady).length;
  const selected = useMemo(
    () => kits.find((k) => k.subject === active) ?? kits[0],
    [kits, active]
  );

  if (loading) {
    return (
      <>
        <MobileTopBar title="Exam kits" />
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10">
          <div className="h-8 w-52 rounded-lg skeleton" />
          <div className="mt-6 grid gap-3 lg:grid-cols-[280px_1fr]">
            <div className="h-80 rounded-2xl skeleton" />
            <div className="h-80 rounded-2xl skeleton" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileTopBar title="Exam kits" />
      <div className="mx-auto max-w-[1200px] px-4 pb-12 pt-5 sm:px-6 md:pt-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[27px] h-display text-fg sm:text-[32px]">Exam kits</h1>
            <p className="mt-1.5 max-w-[58ch] text-[13px] leading-relaxed text-muted">
              A revision order built from what you actually have. Each kit picks the best
              syllabus, notes, lecture and past paper for the subject — in the sequence that
              works.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Stat label="Subjects" value={kits.length} />
            <Stat label="Exam ready" value={ready} tone="ok" />
          </div>
        </div>

        {kits.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
            <GraduationCap size={22} className="mx-auto mb-3 text-faint" />
            <p className="text-[16px] font-bold text-fg">No subjects tagged yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-muted">
              Once files carry a subject, kits assemble themselves.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[268px_1fr] lg:items-start">
            {/* Subject rail */}
            <aside className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {kits.map((k) => {
                const isActive = selected?.subject === k.subject;
                return (
                  <button
                    key={k.subject}
                    onClick={() => setActive(k.subject)}
                    className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all lg:w-full lg:shrink ${
                      isActive ? 'bg-fg text-canvas shadow-card' : 'bg-elev shadow-hair hover:shadow-card'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10.5px] font-bold ${
                        isActive ? 'bg-white/12 text-white' : 'bg-mist text-muted'
                      }`}
                    >
                      {k.steps.length}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-[12.5px] font-semibold ${
                          isActive ? 'text-canvas' : 'text-fg'
                        }`}
                      >
                        {k.subject}
                      </span>
                      <span
                        className={`mt-0.5 flex items-center gap-1 text-[10px] ${
                          isActive ? 'text-white/60' : 'text-faint'
                        }`}
                      >
                        {k.counts.papers} papers · {k.counts.notes} notes
                      </span>
                    </span>
                    {k.examReady && (
                      <Check
                        size={12}
                        strokeWidth={3}
                        className={isActive ? 'text-amber-300' : 'text-ok'}
                      />
                    )}
                  </button>
                );
              })}
            </aside>

            {/* Kit detail */}
            {selected && <KitDetail kit={selected} />}
          </div>
        )}
      </div>
    </>
  );
}

function KitDetail({ kit }: { kit: ExamKit }) {
  return (
    <div className="min-w-0 animate-fade-up">
      <div className="overflow-hidden rounded-2xl bg-elev shadow-card">
        {/* Kit header */}
        <div className="border-b border-line px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">Revision plan</p>
              <h2 className="mt-1 text-[20px] h-title text-fg text-balance">{kit.subject}</h2>
            </div>
            <Link href={`/ai?ask=${encodeURIComponent(`Make me a 7-day revision plan for ${kit.subject} using my files`)}`} className="btn btn-primary btn-sm">
              <Sparkle size={13} strokeWidth={2.2} /> Ask for a plan
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${kit.coverage}%` }}
                />
              </div>
              <span className="tnum text-[11px] font-semibold text-muted">
                {kit.coverage}% covered
              </span>
            </div>
            <CountBadge icon={FileText} value={kit.counts.papers} label="papers" />
            <CountBadge icon={FileText} value={kit.counts.notes} label="notes" />
            {kit.counts.video > 0 && (
              <CountBadge icon={PlayCircle} value={kit.counts.video} label="video" />
            )}
            {kit.counts.audio > 0 && (
              <CountBadge icon={Headphones} value={kit.counts.audio} label="audio" />
            )}
          </div>
        </div>

        {/* Steps */}
        <ol className="divide-y divide-line">
          {kit.steps.map((step, i) => (
            <li key={step.id}>
              <div className="group flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-hover">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mist text-[10.5px] font-bold text-muted">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-fg">{step.role}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-faint">{step.hint}</p>
                  <Link
                    href={`/viewer/${step.file.id}`}
                    className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-sunken p-2.5 transition-colors hover:bg-mist"
                  >
                    <FileTypeIcon file={step.file} size={13} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-fg">
                        {step.file.name.replace(/\.pdf$/i, '')}
                      </span>
                      <span className="mt-0.5 block truncate text-[10.5px] text-faint">
                        {[step.file.type, step.file.semester].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <ArrowRight
                      size={13}
                      className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
                <button
                  onClick={() => downloadFile(step.file)}
                  aria-label={`Download ${step.file.name}`}
                  className="btn-icon mt-1 h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Download size={13} />
                </button>
              </div>
            </li>
          ))}
          {kit.steps.length === 0 && (
            <li className="px-5 py-12 text-center text-[12.5px] text-muted">
              Nothing filed under this subject yet.
            </li>
          )}
        </ol>

        {/* Gap note */}
        {!kit.examReady && (
          <div className="border-t border-line bg-warn-soft px-5 py-3">
            <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-warn">
              <Target size={13} className="mt-0.5 shrink-0" />
              You&apos;re missing {kit.counts.papers === 0 ? 'past papers' : 'notes'} for this
              subject — add them to the Drive folder and the kit fills in on the next sync.
            </p>
          </div>
        )}
      </div>

      <Link
        href={`/library?q=${encodeURIComponent(kit.subject)}`}
        className="mt-2.5 flex items-center justify-between rounded-xl bg-elev px-4 py-3 shadow-hair transition-shadow hover:shadow-card"
      >
        <span className="text-[12.5px] font-semibold text-fg">
          Browse everything in {kit.subject}
        </span>
        <ChevronRight size={14} className="text-faint" />
      </Link>
    </div>
  );
}

function CountBadge({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof FileText;
  value: number;
  label: string;
}) {
  if (value === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted">
      <Icon size={12} className="text-faint" strokeWidth={2} />
      <span className="tnum font-semibold text-fg">{value}</span> {label}
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' }) {
  return (
    <div className="rounded-xl bg-elev px-3 py-2 shadow-card">
      <p
        className={`tnum text-[18px] font-bold leading-none ${
          tone === 'ok' ? 'text-ok' : 'text-fg'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-faint">
        {label}
      </p>
    </div>
  );
}
