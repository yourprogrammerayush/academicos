'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkle,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  BookOpen,
  Film,
  Headphones,
  Play,
  FileText,
  GraduationCap,
  FolderOpen,
  Command,
  Flame,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { MobileTopBar } from '@/components/mobile-nav';
import { SyncPill } from '@/components/sync-pill';
import { FileCard } from '@/components/file-card';
import { FileTypeIcon } from '@/components/file-icon';
import { searchCatalog } from '@/lib/search';
import { store } from '@/lib/store';
import type { CatalogFile } from '@/lib/types';

const KIND_FILTERS = [
  { id: 'All', label: 'Everything', icon: BookOpen },
  { id: 'Notes', label: 'Notes', icon: FileText },
  { id: 'PYQ', label: 'Past papers', icon: Flame },
  { id: 'Syllabus', label: 'Syllabus', icon: GraduationCap },
  { id: 'Video', label: 'Video', icon: Film },
  { id: 'Audio', label: 'Audio', icon: Headphones },
] as const;

export default function HomePage() {
  const { catalog, loading, setPaletteOpen } = useApp();
  const [filter, setFilter] = useState<(typeof KIND_FILTERS)[number]['id']>('All');
  const [q, setQ] = useState('');
  const router = useRouter();

  const files = catalog.files;

  const filtered = useMemo(() => {
    let list = files;
    if (filter === 'Notes') list = list.filter((f) => f.type === 'Notes');
    if (filter === 'PYQ') list = list.filter((f) => f.type === 'PYQ');
    if (filter === 'Syllabus') list = list.filter((f) => f.type === 'Syllabus');
    if (filter === 'Video') list = list.filter((f) => f.kind === 'video');
    if (filter === 'Audio') list = list.filter((f) => f.kind === 'audio');
    if (q.trim()) list = searchCatalog(list, q, 60);
    return list;
  }, [files, filter, q]);

  const stats = useMemo(() => {
    const subjects = new Set(files.map((f) => f.subject).filter(Boolean));
    return {
      total: files.length,
      videos: files.filter((f) => f.kind === 'video').length,
      audio: files.filter((f) => f.kind === 'audio').length,
      subjects: subjects.size,
      pyq: files.filter((f) => f.type === 'PYQ').length,
    };
  }, [files]);

  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  useEffect(() => {
    setRecentIds(store.getRecents().slice(0, 8).map((r) => r.id));
    setProgress(store.getProgress());
  }, []);
  const continueList = useMemo(
    () => recentIds.map((id) => files.find((f) => f.id === id)).filter(Boolean) as CatalogFile[],
    [files, recentIds]
  );

  const coreReading = useMemo(
    () => files.filter((f) => (f.type === 'Notes' || f.type === 'Syllabus') && f.kind === 'pdf').slice(0, 3),
    [files]
  );

  const latest = useMemo(
    () =>
      [...files]
        .filter((f) => f.kind === 'pdf' || f.kind === 'doc')
        .sort((a, b) => (b.modifiedTime || '').localeCompare(a.modifiedTime || ''))
        .slice(0, 4),
    [files]
  );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      store.pushSearch(q.trim());
      router.push(`/library?q=${encodeURIComponent(q.trim())}`);
    } else {
      setPaletteOpen(true);
    }
  };

  return (
    <>
      <MobileTopBar />

      <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-4 sm:px-6 md:pt-9 lg:px-10">
        {/* ── Masthead ───────────────────────────────────────────── */}
        <section className="animate-fade-up">
          <div className="flex items-center gap-2">
            <SyncPill />
            <span className="text-[11.5px] text-faint">2CSE-4 · 2026–30</span>
          </div>

          <h1 className="mt-4 max-w-[19ch] text-[34px] h-display text-balance text-fg sm:text-[46px] lg:text-[52px]">
            Everything you need,{' '}
            <span className="relative inline-block">
              <span className="relative z-10">one tap away.</span>
              <span className="absolute inset-x-0 bottom-[0.14em] -z-0 h-[0.28em] bg-gradient-to-r from-amber-300/70 via-ember-300/60 to-coral-300/50" />
            </span>
          </h1>
          <p className="mt-3.5 max-w-[54ch] text-[14.5px] leading-relaxed text-muted text-pretty">
            {stats.total} resources across {stats.subjects} subjects — notes, past papers, lectures and audio,
            indexed and playable without leaving the app.
          </p>

          {/* Search */}
          <form onSubmit={submitSearch} className="mt-6 max-w-[620px]">
            <div className="group flex items-center gap-3 rounded-2xl bg-elev px-4 shadow-lift transition-shadow focus-within:shadow-pop">
              <Search size={18} strokeWidth={2} className="shrink-0 text-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notes, papers, subjects…"
                className="h-[52px] flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-faint"
                aria-label="Search library"
              />
              {q ? (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="text-[11px] font-semibold text-faint hover:text-fg"
                >
                  Clear
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="hidden items-center gap-0.5 rounded-md bg-mist px-1.5 py-1 text-[10px] font-semibold text-faint sm:flex"
                >
                  <Command size={10} strokeWidth={2.5} />K
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ── Quick access tiles ─────────────────────────────────── */}
        <section className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <QuickTile
            href="/ai"
            label="Ask Study AI"
            meta="Grounded in your files"
            icon={Sparkle}
            tone="accent"
          />
          <QuickTile href="/library" label="Browse library" meta={`${stats.subjects} subjects`} icon={FolderOpen} />
          <QuickTile href="/video" label="Video lectures" meta={`${stats.videos} clips`} icon={Film} />
          <QuickTile href="/audio" label="Podcasts" meta={`${stats.audio} tracks`} icon={Headphones} />
        </section>

        {/* ── Continue ───────────────────────────────────────────── */}
        {continueList.length > 0 && (
          <Section
            title="Pick up where you left off"
            hint="Your last opened resources"
            action={{ href: '/workspace', label: 'See all' }}
          >
            <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {continueList.map((f) => {
                const pct = Math.round((progress[f.id] || 0) * 100);
                return (
                  <Link
                    key={f.id}
                    href={`/viewer/${f.id}`}
                    className="group flex w-[272px] shrink-0 flex-col rounded-xl bg-elev p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist">
                        <FileTypeIcon file={f} size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold leading-snug text-fg">
                          {f.name.replace(/\.pdf$/i, '')}
                        </span>
                        <span className="mt-0.5 block truncate text-[10.5px] text-faint">
                          {[f.type, f.subject || f.semester].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <Play
                        size={13}
                        fill="currentColor"
                        className="shrink-0 text-faint transition-colors group-hover:text-accent"
                      />
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-mist">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${pct || 2}%` }}
                        />
                      </span>
                      <span className="tnum text-[10px] font-semibold text-faint">
                        {pct ? `${pct}%` : 'New'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Core reading ───────────────────────────────────────── */}
        {coreReading.length > 0 && (
          <Section
            title="Core reading"
            hint="Start here for each subject"
            action={{ href: '/library', label: 'All materials' }}
          >
            <div className="grid gap-2.5 sm:grid-cols-3">
              {coreReading.map((f, i) => (
                <Link
                  key={f.id}
                  href={`/viewer/${f.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-elev p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-[3px] opacity-70"
                    style={{
                      background: [
                        'linear-gradient(90deg,#FCA800,#FC6000)',
                        'linear-gradient(90deg,#FC6000,#FC3A2C)',
                        'linear-gradient(90deg,#233047,#4A5C78)',
                      ][i % 3],
                    }}
                  />
                  <div className="mb-3 flex items-center justify-between">
                    <span className="chip">{f.type}</span>
                    <ArrowUpRight
                      size={15}
                      className="text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  </div>
                  <p className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.018em] text-fg">
                    {f.name.replace(/\.pdf$/i, '')}
                  </p>
                  <p className="mt-auto pt-3 text-[11.5px] text-faint">
                    {[f.subject, f.semester].filter(Boolean).join(' · ') || f.path.join(' / ')}
                  </p>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* ── Latest uploads ─────────────────────────────────────── */}
        {latest.length > 0 && (
          <Section title="Just added" hint="Newest in your Drive folder" action={{ href: '/library', label: 'Library' }}>
            <div className="divide-y divide-line overflow-hidden rounded-2xl bg-elev shadow-card">
              {latest.map((f) => (
                <Link
                  key={f.id}
                  href={`/viewer/${f.id}`}
                  className="group flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-hover"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist">
                    <FileTypeIcon file={f} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-fg">
                      {f.name.replace(/\.pdf$/i, '')}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-faint">
                      {[f.subject, f.semester, f.type].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-[11px] text-faint sm:flex">
                    <Clock3 size={11} />
                    {relativeDay(f.modifiedTime)}
                  </span>
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* ── Full catalogue ─────────────────────────────────────── */}
        <section className="mt-9">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[16px] h-title text-fg">
              {q ? `Results for “${q}”` : 'All materials'}
            </h2>
            <span className="tnum text-[11.5px] text-faint">{filtered.length} items</span>
          </div>

          <div className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {KIND_FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
                    active
                      ? 'bg-fg text-canvas shadow-card'
                      : 'bg-elev text-muted shadow-hair hover:text-fg'
                  }`}
                >
                  <f.icon size={13} strokeWidth={2.1} />
                  {f.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[126px] rounded-xl skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
              <p className="text-[16px] font-bold text-fg">Nothing matches</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted">
                Try a different filter, or ask Study AI in plain language — it knows every file in your library.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setFilter('All');
                    setQ('');
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Reset filters
                </button>
                <Link href="/ai" className="btn btn-accent btn-sm">
                  <Sparkle size={13} /> Ask AI
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((f) => (
                <FileCard key={f.id} file={f} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/* ── Small building blocks ─────────────────────────────────────── */

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] h-title text-fg">{title}</h2>
          {hint && <p className="mt-0.5 text-[11.5px] text-faint">{hint}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="group inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-muted transition-colors hover:text-fg"
          >
            {action.label}
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function QuickTile({
  href,
  label,
  meta,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  meta: string;
  icon: typeof BookOpen;
  tone?: 'accent';
}) {
  const accent = tone === 'accent';
  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-3.5 transition-all hover:-translate-y-0.5 ${
        accent
          ? 'bg-navy-950 text-white shadow-lift'
          : 'bg-elev text-fg shadow-card hover:shadow-lift'
      }`}
    >
      {accent && (
        <span
          className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-40 blur-2xl"
          style={{ background: 'radial-gradient(circle,#FC6000,transparent 70%)' }}
        />
      )}
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          accent ? 'bg-white/10 text-amber-300' : 'bg-mist text-fg'
        }`}
      >
        <Icon size={16} strokeWidth={2} />
      </span>
      <span className="mt-5 block">
        <span className="block text-[13px] font-semibold leading-tight tracking-[-0.015em]">{label}</span>
        <span className={`mt-0.5 block text-[11px] ${accent ? 'text-white/55' : 'text-faint'}`}>{meta}</span>
      </span>
    </Link>
  );
}

function relativeDay(iso?: string) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
