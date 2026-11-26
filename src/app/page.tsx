'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkle,
  ArrowRight,
  Clock3,
  TrendingUp,
  BookOpen,
  Film,
  Headphones,
  Library,
  Play,
  Compass,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { MobileTopBar } from '@/components/mobile-nav';
import { FileCard } from '@/components/file-card';
import { FileTypeIcon } from '@/components/file-icon';
import { searchCatalog } from '@/lib/search';
import { store } from '@/lib/store';
import type { CatalogFile } from '@/lib/types';

const FILTERS = ['All', 'Recent', 'Notes', 'PYQ', 'Syllabus', 'Video', 'Audio'] as const;
const YEARS = ['All years', '1st Year', '2nd Year', '3rd Year', '4th Year'] as const;

export default function HomePage() {
  const { catalog, loading, setPaletteOpen, setAuthOpen, signedIn, userName, driveConnected } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [year, setYear] = useState<(typeof YEARS)[number]>('All years');
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
    if (filter === 'Recent')
      list = [...list].sort((a, b) => (b.modifiedTime || '').localeCompare(a.modifiedTime || ''));
    if (year !== 'All years') list = list.filter((f) => f.year === year);
    if (q.trim()) list = searchCatalog(list, q, 60);
    return list;
  }, [files, filter, year, q]);

  const stats = useMemo(() => {
    const subjects = new Set(files.map((f) => f.subject).filter(Boolean));
    return {
      total: files.length,
      videos: files.filter((f) => f.kind === 'video').length,
      audio: files.filter((f) => f.kind === 'audio').length,
      subjects: subjects.size,
    };
  }, [files]);

  const featured = useMemo(() => files.filter((f) => f.type === 'Notes' || f.type === 'Syllabus').slice(0, 3), [files]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => {
    setRecentIds(store.getRecents().slice(0, 6).map((r) => r.id));
  }, []);
  const continueList = useMemo(
    () => recentIds.map((id) => files.find((f) => f.id === id)).filter(Boolean) as CatalogFile[],
    [files, recentIds]
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
      <MobileTopBar title={driveConnected ? 'Drive connected' : 'Demo catalog'} />

      <div className="mx-auto max-w-[1360px] px-4 pb-8 pt-5 sm:px-6 md:pt-7 lg:px-8">
        {/* Hero */}
        <section className="mb-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-eyebrow mb-2 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[var(--brand)]" />
                {catalog.rootName}
              </p>
              <h1 className="font-serif text-[27px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[33px]">
                {signedIn ? `Welcome back, ${userName.split(' ')[0]}.` : 'Your semester, in one place.'}
              </h1>
              <p className="mt-2 max-w-[560px] text-[13.5px] leading-relaxed text-[var(--fg-muted)]">
                Every note, paper, lecture and audio guide — indexed, searchable and playable without ever leaving the app.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!signedIn && (
                <button onClick={() => setAuthOpen(true)} className="btn btn-ghost text-[12.5px]">
                  Sign in
                </button>
              )}
              <Link href="/ai" className="btn btn-primary text-[12.5px]">
                <Sparkle size={14} />
                Ask Study AI
              </Link>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={submitSearch} className="mt-5 max-w-[720px]">
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] px-3.5 shadow-[var(--shadow-card)] transition-colors focus-within:border-[var(--line-strong)]">
              <Search size={17} className="shrink-0 text-[var(--fg-subtle)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notes, PYQs, subjects, or ask a question…"
                className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--fg-subtle)]"
                aria-label="Search library"
              />
              <kbd className="hidden rounded border border-[var(--line)] bg-[var(--bg-sub)] px-1.5 py-0.5 text-[10px] text-[var(--fg-subtle)] sm:block">⌘K</kbd>
            </div>
          </form>

          {/* Stats strip */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-[var(--fg-subtle)]">
            <span className="inline-flex items-center gap-1.5">
              <Library size={13} /> {stats.total} files
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={13} /> {stats.subjects} subjects
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Film size={13} /> {stats.videos} videos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Headphones size={13} /> {stats.audio} audio
            </span>
          </div>
        </section>

        {/* Filter chips */}
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'chip-active' : ''}`}>
              {f === 'All' && <Compass size={13} />}
              {f === 'Recent' && <Clock3 size={13} />}
              {f === 'Notes' && <BookOpen size={13} />}
              {f === 'PYQ' && <TrendingUp size={13} />}
              {f === 'Video' && <Film size={13} />}
              {f === 'Audio' && <Headphones size={13} />}
              {f}
            </button>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                year === y ? 'bg-[var(--brand-soft)] text-[var(--brand)] ring-1 ring-[color-mix(in_srgb,var(--brand)_28%,transparent)]' : 'text-[var(--fg-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg-muted)]'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Continue shelf */}
        {continueList.length > 0 && filter === 'All' && !q && (
          <section className="mb-7">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Continue</h2>
              <Link href="/workspace" className="text-[11.5px] text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:underline">
                All recent
              </Link>
            </div>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {continueList.map((f) => (
                <Link
                  key={f.id}
                  href={`/viewer/${f.id}`}
                  className="group flex w-[230px] shrink-0 items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] p-2.5 transition-colors hover:bg-[var(--bg-hover)]"
                >
                  <FileTypeIcon file={f} size={15} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">{f.name}</p>
                    <p className="truncate text-[10.5px] text-[var(--fg-subtle)]">{f.type} · {f.semester || 'Library'}</p>
                  </div>
                  <Play size={13} className="shrink-0 text-[var(--fg-subtle)] transition-colors group-hover:text-[var(--fg)]" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured strip */}
        {filter === 'All' && !q && featured.length > 0 && (
          <section className="mb-7">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Core reading</h2>
              <Link href="/library" className="inline-flex items-center gap-1 text-[11.5px] text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:underline">
                Browse all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {featured.map((f, i) => (
                <Link
                  key={f.id}
                  href={`/viewer/${f.id}`}
                  className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 transition-all hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-card)]"
                >
                  <span className="absolute right-3 top-3 font-serif text-[38px] font-bold leading-none text-[var(--bg-hover)]">
                    0{i + 1}
                  </span>
                  <p className="label-eyebrow">{f.type}</p>
                  <p className="mt-2 line-clamp-2 pr-8 font-serif text-[16px] font-bold leading-snug tracking-[-0.01em]">{f.name}</p>
                  <p className="mt-2 text-[11.5px] text-[var(--fg-subtle)]">{[f.subject, f.semester].filter(Boolean).join(' · ') || f.path.join(' / ')}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Grid */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
              {q ? `Results for “${q}”` : filter === 'All' ? 'All materials' : filter}
            </h2>
            <span className="text-[11.5px] text-[var(--fg-subtle)]">{filtered.length} items</span>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[132px] rounded-xl border border-[var(--line)] skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] px-6 py-14 text-center">
              <p className="font-serif text-[17px] font-bold">Nothing here yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-[var(--fg-muted)]">
                Try clearing the filters, or use the AI search to describe what you need in plain language.
              </p>
              <button
                onClick={() => {
                  setFilter('All');
                  setYear('All years');
                  setQ('');
                }}
                className="btn btn-ghost mt-4 text-[12px]"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
