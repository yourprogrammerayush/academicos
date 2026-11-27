'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  LayoutGrid,
  ListTree,
  Search,
  SlidersHorizontal,
  X,
  FileText,
  Rows3,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { MobileTopBar } from '@/components/mobile-nav';
import { SyncPill } from '@/components/sync-pill';
import { FileCard } from '@/components/file-card';
import { FileTypeIcon } from '@/components/file-icon';
import { searchCatalog } from '@/lib/search';
import { formatSize } from '@/lib/catalog';
import type { CatalogFile } from '@/lib/types';

function LibraryInner() {
  const { catalog, loading } = useApp();
  const params = useSearchParams();
  const [view, setView] = useState<'smart' | 'folders'>('smart');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [q, setQ] = useState(params.get('q') || '');
  const [year, setYear] = useState('All');
  const [subject, setSubject] = useState('All');
  const [type, setType] = useState('All');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [activeFolder, setActiveFolder] = useState('');

  const files = catalog.files;

  const years = useMemo(
    () => ['All', ...Array.from(new Set(files.map((f) => f.year).filter(Boolean) as string[]))],
    [files]
  );
  const subjects = useMemo(
    () => ['All', ...Array.from(new Set(files.map((f) => f.subject).filter(Boolean) as string[])).sort()],
    [files]
  );
  const types = useMemo(
    () => ['All', ...Array.from(new Set(files.map((f) => f.type))).sort()],
    [files]
  );

  const results = useMemo(() => {
    let list = files;
    if (year !== 'All') list = list.filter((f) => f.year === year);
    if (subject !== 'All') list = list.filter((f) => f.subject === subject);
    if (type !== 'All') list = list.filter((f) => f.type === type);
    if (q.trim()) list = searchCatalog(list, q, 150);
    return list;
  }, [files, year, subject, type, q]);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of files) {
      const key = f.path[0] || 'Root';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [files]);

  const folderFiles = useMemo(
    () => (activeFolder ? files.filter((f) => f.path[0] === activeFolder) : files),
    [files, activeFolder]
  );

  const activeFilterCount = [year, subject, type].filter((v) => v !== 'All').length;
  const clearFilters = () => {
    setYear('All');
    setSubject('All');
    setType('All');
    setQ('');
  };

  return (
    <>
      <MobileTopBar title="Library" />

      <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 sm:px-6 md:pt-8 lg:px-10">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[27px] h-display text-fg sm:text-[32px]">Library</h1>
              <SyncPill compact />
            </div>
            <p className="mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-muted">
              Every resource, two ways. Filter by year, subject and type — or browse the
              original Drive structure.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-xl bg-mist p-0.5">
              <SegBtn active={view === 'smart'} onClick={() => setView('smart')} icon={SlidersHorizontal}>
                Smart
              </SegBtn>
              <SegBtn active={view === 'folders'} onClick={() => setView('folders')} icon={ListTree}>
                Folders
              </SegBtn>
            </div>
            {view === 'smart' && (
              <div className="hidden items-center rounded-xl bg-mist p-0.5 sm:flex">
                <button
                  onClick={() => setLayout('grid')}
                  aria-label="Grid"
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    layout === 'grid' ? 'bg-elev text-fg shadow-hair' : 'text-faint hover:text-muted'
                  }`}
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  onClick={() => setLayout('list')}
                  aria-label="List"
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    layout === 'list' ? 'bg-elev text-fg shadow-hair' : 'text-faint hover:text-muted'
                  }`}
                >
                  <Rows3 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Search ────────────────────────────────────────────── */}
        <div className="mt-5 flex items-center gap-2.5 rounded-2xl bg-elev px-3.5 shadow-lift transition-shadow focus-within:shadow-pop">
          <Search size={16} strokeWidth={2} className="shrink-0 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={view === 'smart' ? 'Search within filters…' : 'Search every file…'}
            className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
            aria-label="Search library"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear" className="rounded-md p-1 text-faint hover:text-fg">
              <X size={15} />
            </button>
          )}
        </div>

        {view === 'smart' ? (
          <div className="mt-6 flex flex-col gap-6 lg:flex-row">
            {/* Filters */}
            <aside className="w-full shrink-0 lg:w-[226px]">
              <div className="space-y-5 lg:sticky lg:top-6">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent-soft py-2 text-[11.5px] font-semibold text-accent transition-colors hover:brightness-95"
                  >
                    <X size={12} strokeWidth={2.4} />
                    Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                  </button>
                )}
                <FilterGroup label="Year" options={years} value={year} onChange={setYear} />
                <FilterGroup label="Type" options={types} value={type} onChange={setType} />
                <div>
                  <p className="eyebrow mb-2.5">Subject</p>
                  <div className="no-scrollbar max-h-[268px] space-y-0.5 overflow-y-auto pr-1">
                    {subjects.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSubject(s)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                          subject === s
                            ? 'bg-fg font-semibold text-canvas'
                            : 'text-muted hover:bg-hover hover:text-fg'
                        }`}
                      >
                        <span className="truncate">{s}</span>
                        {subject === s && <ChevronRight size={12} className="shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Results */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                <span className="tnum text-[13px] font-bold text-fg">{results.length}</span>
                <span className="text-[12.5px] text-muted">
                  {results.length === 1 ? 'file' : 'files'}
                </span>
                {[year, subject, type].filter((v) => v !== 'All').length > 0 && (
                  <span className="text-[12px] text-faint">
                    · {[year, subject, type].filter((v) => v !== 'All').join(' · ')}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-[122px] rounded-xl skeleton" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <EmptyState onReset={clearFilters} />
              ) : layout === 'grid' ? (
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((f) => (
                    <FileCard key={f.id} file={f} />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-line overflow-hidden rounded-2xl bg-elev shadow-card">
                  {results.map((f) => (
                    <FileRow key={f.id} file={f} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[286px_1fr]">
            {/* Folder tree */}
            <aside className="self-start overflow-hidden rounded-2xl bg-elev shadow-card lg:sticky lg:top-6">
              <div className="border-b border-line px-3.5 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-fg">
                  <Folder size={12} className="text-amber-600" />
                  {catalog.rootName}
                </p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => setActiveFolder('')}
                  className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                    activeFolder === ''
                      ? 'bg-navy-950 font-semibold text-white'
                      : 'text-muted hover:bg-hover hover:text-fg'
                  }`}
                >
                  <FolderOpen size={14} strokeWidth={2} className="shrink-0" />
                  All materials
                  <span
                    className={`tnum ml-auto text-[10.5px] ${
                      activeFolder === '' ? 'text-white/50' : 'text-faint'
                    }`}
                  >
                    {files.length}
                  </span>
                </button>

                {Object.keys(folderCounts).map((folder) => {
                  const open = Boolean(openFolders[folder]);
                  const nested = catalog.folders.filter(
                    (f) => f.path[0] === folder && f.path.length > 1
                  );
                  const isActive = activeFolder === folder;
                  return (
                    <div key={folder}>
                      <div
                        className={`flex items-center rounded-lg transition-colors ${
                          isActive ? 'bg-hover' : 'hover:bg-hover'
                        }`}
                      >
                        <button
                          onClick={() => setOpenFolders((o) => ({ ...o, [folder]: !o[folder] }))}
                          aria-label={open ? 'Collapse' : 'Expand'}
                          aria-expanded={open}
                          className="p-1.5 pl-2 text-faint"
                        >
                          <ChevronRight
                            size={12}
                            strokeWidth={2.4}
                            className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                          />
                        </button>
                        <button
                          onClick={() => setActiveFolder(folder)}
                          className={`flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left text-[12.5px] ${
                            isActive ? 'font-semibold text-fg' : 'text-muted'
                          }`}
                        >
                          {open ? (
                            <FolderOpen size={14} strokeWidth={2} className="shrink-0 text-amber-600" />
                          ) : (
                            <Folder size={14} strokeWidth={2} className="shrink-0 text-amber-600/80" />
                          )}
                          <span className="truncate">{folder}</span>
                          <span className="tnum ml-auto text-[10.5px] text-faint">
                            {folderCounts[folder]}
                          </span>
                        </button>
                      </div>
                      {open && nested.length > 0 && (
                        <div className="mb-1 ml-[22px] border-l border-line pl-2.5">
                          {nested.slice(0, 8).map((nf) => (
                            <p key={nf.id} className="truncate py-0.5 text-[11px] text-faint">
                              {nf.path.slice(1).join(' / ')}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Folder contents */}
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-baseline gap-2">
                <h2 className="text-[17px] h-title text-fg">{activeFolder || 'All materials'}</h2>
                <span className="tnum text-[11.5px] text-faint">{folderFiles.length} files</span>
              </div>
              <div className="divide-y divide-line overflow-hidden rounded-2xl bg-elev shadow-card">
                {folderFiles.map((f) => (
                  <FileRow key={f.id} file={f} />
                ))}
                {folderFiles.length === 0 && (
                  <p className="px-4 py-14 text-center text-[12.5px] text-muted">
                    Nothing in this folder yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SegBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof LayoutGrid;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-all ${
        active ? 'bg-elev text-fg shadow-hair' : 'text-faint hover:text-muted'
      }`}
    >
      <Icon size={13} strokeWidth={2.1} />
      {children}
    </button>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="eyebrow mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-all ${
              value === o
                ? 'bg-fg text-canvas'
                : 'bg-elev text-muted shadow-hair hover:text-fg'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function FileRow({ file }: { file: CatalogFile }) {
  return (
    <Link
      href={`/viewer/${file.id}`}
      className="group flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-hover"
    >
      <FileTypeIcon file={file} size={15} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-fg">
          {file.name.replace(/\.pdf$/i, '')}
        </p>
        <p className="truncate text-[11px] text-faint">
          {file.path.join(' / ')}
          {file.modifiedTime
            ? ` · ${new Date(file.modifiedTime).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}`
            : ''}
        </p>
      </div>
      <span className="tnum hidden shrink-0 text-[11px] text-faint sm:block">
        {formatSize(file.size)}
      </span>
      <span className="chip shrink-0">{file.type}</span>
    </Link>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-mist">
        <FileText size={18} className="text-faint" strokeWidth={1.8} />
      </span>
      <p className="text-[16px] font-bold text-fg">No matches</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted">
        Nothing fits this combination. Clear the filters to see the whole library.
      </p>
      <button onClick={onReset} className="btn btn-outline btn-sm mt-4">
        Clear filters
      </button>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-10">
          <div className="h-8 w-40 rounded-lg skeleton" />
          <div className="mt-4 h-12 rounded-2xl skeleton" />
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[122px] rounded-xl skeleton" />
            ))}
          </div>
        </div>
      }
    >
      <LibraryInner />
    </Suspense>
  );
}
