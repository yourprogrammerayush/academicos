'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  FolderClosed,
  FolderOpen,
  LayoutGrid,
  ListTree,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { MobileTopBar } from '@/components/mobile-nav';
import { FileCard } from '@/components/file-card';
import { FileTypeIcon } from '@/components/file-icon';
import { searchCatalog } from '@/lib/search';
import { formatSize } from '@/lib/catalog';
import type { CatalogFile } from '@/lib/types';

function LibraryInner() {
  const { catalog, loading } = useApp();
  const params = useSearchParams();
  const [view, setView] = useState<'smart' | 'folders'>('smart');
  const [q, setQ] = useState(params.get('q') || '');
  const [year, setYear] = useState<string>('All');
  const [subject, setSubject] = useState<string>('All');
  const [type, setType] = useState<string>('All');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ '': true });
  const [activeFolder, setActiveFolder] = useState<string>('');

  const files = catalog.files;

  const years = useMemo(() => ['All', ...Array.from(new Set(files.map((f) => f.year).filter(Boolean) as string[]))], [files]);
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
    if (q.trim()) list = searchCatalog(list, q, 120);
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

  const folderFiles = useMemo(() => {
    if (!activeFolder) return files;
    return files.filter((f) => f.path[0] === activeFolder);
  }, [files, activeFolder]);

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
      <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-5 sm:px-6 md:pt-7 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-eyebrow">Library</p>
            <h1 className="mt-1.5 font-serif text-[25px] font-bold tracking-[-0.02em] sm:text-[29px]">Every resource, two ways to find it.</h1>
            <p className="mt-1.5 text-[13px] text-[var(--fg-muted)]">
              Browse the original folder structure, or filter by year, subject and type.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] p-0.5">
            <button
              onClick={() => setView('smart')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                view === 'smart' ? 'bg-[var(--bg-elev)] text-[var(--fg)] shadow-[var(--shadow-card)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <SlidersHorizontal size={13} /> Smart
            </button>
            <button
              onClick={() => setView('folders')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                view === 'folders' ? 'bg-[var(--bg-elev)] text-[var(--fg)] shadow-[var(--shadow-card)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <ListTree size={13} /> Folders
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] px-3">
          <Search size={15} className="text-[var(--fg-subtle)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={view === 'smart' ? 'Search within filters…' : 'Search all files…'}
            className="h-10 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[var(--fg-subtle)]"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search" className="rounded p-1 text-[var(--fg-subtle)] hover:text-[var(--fg)]">
              <X size={14} />
            </button>
          )}
        </div>

        {view === 'smart' ? (
          <div className="flex flex-col gap-5 lg:flex-row">
            {/* Filters rail */}
            <aside className="w-full shrink-0 lg:w-[232px]">
              <div className="space-y-5 rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-3.5">
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="flex w-full items-center justify-center gap-1 rounded-md border border-[var(--line)] py-1.5 text-[11.5px] text-[var(--fg-muted)] hover:bg-[var(--bg-hover)]">
                    <X size={12} /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                  </button>
                )}
                <FilterGroup label="Year" options={years} value={year} onChange={setYear} />
                <FilterGroup label="Resource type" options={types} value={type} onChange={setType} />
                <div>
                  <p className="label-eyebrow mb-2">Subject</p>
                  <div className="max-h-[240px] space-y-0.5 overflow-y-auto pr-1">
                    {subjects.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSubject(s)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] transition-colors ${
                          subject === s ? 'bg-[var(--bg-hover)] font-medium text-[var(--fg)]' : 'text-[var(--fg-muted)] hover:bg-[var(--bg-sub)] hover:text-[var(--fg)]'
                        }`}
                      >
                        <span className="truncate">{s}</span>
                        {subject === s && <ChevronRight size={12} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Results */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[12.5px] text-[var(--fg-muted)]">
                  <span className="font-semibold text-[var(--fg)]">{results.length}</span> files
                  {year !== 'All' && ` · ${year}`}
                  {subject !== 'All' && ` · ${subject}`}
                  {type !== 'All' && ` · ${type}`}
                </p>
              </div>
              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-[126px] rounded-xl border border-[var(--line)] skeleton" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <EmptyState onReset={clearFilters} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((f) => (
                    <FileCard key={f.id} file={f} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            {/* Folder tree */}
            <aside className="rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-2.5">
              <p className="label-eyebrow px-2 pb-2 pt-1">{catalog.rootName}</p>
              <button
                onClick={() => setActiveFolder('')}
                className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors ${
                  activeFolder === '' ? 'bg-[var(--bg-hover)] font-medium' : 'text-[var(--fg-muted)] hover:bg-[var(--bg-sub)]'
                }`}
              >
                <FolderOpen size={14} className="text-[var(--fg-subtle)]" /> All materials
                <span className="ml-auto text-[10.5px] text-[var(--fg-subtle)]">{files.length}</span>
              </button>
              {Object.keys(folderCounts).map((folder) => {
                const open = Boolean(openFolders[folder]);
                const nested = catalog.folders.filter((f) => f.path[0] === folder && f.path.length > 1);
                return (
                  <div key={folder}>
                    <div className={`flex items-center rounded-md transition-colors ${activeFolder === folder ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-sub)]'}`}>
                      <button
                        onClick={() => setOpenFolders((o) => ({ ...o, [folder]: !o[folder] }))}
                        aria-label={open ? 'Collapse' : 'Expand'}
                        className="p-1 text-[var(--fg-subtle)]"
                      >
                        <ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
                      </button>
                      <button
                        onClick={() => setActiveFolder(folder)}
                        className={`flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left text-[12.5px] ${
                          activeFolder === folder ? 'font-medium text-[var(--fg)]' : 'text-[var(--fg-muted)]'
                        }`}
                      >
                        {open ? <FolderOpen size={14} className="shrink-0 text-[var(--fg-subtle)]" /> : <FolderClosed size={14} className="shrink-0 text-[var(--fg-subtle)]" />}
                        <span className="truncate">{folder}</span>
                        <span className="ml-auto text-[10.5px] text-[var(--fg-subtle)]">{folderCounts[folder]}</span>
                      </button>
                    </div>
                    {open && nested.length > 0 && (
                      <div className="ml-[26px] border-l border-[var(--line)] pl-2">
                        {nested.slice(0, 8).map((nf) => (
                          <p key={nf.id} className="truncate py-1 text-[11.5px] text-[var(--fg-subtle)]">
                            {nf.path.slice(1).join(' / ')}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </aside>

            {/* Folder contents */}
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-baseline gap-2">
                <h2 className="font-serif text-[19px] font-bold tracking-[-0.01em]">{activeFolder || 'All materials'}</h2>
                <span className="text-[11.5px] text-[var(--fg-subtle)]">{folderFiles.length} files</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-elev)]">
                {folderFiles.map((f, i) => (
                  <FileRow key={f.id} file={f} last={i === folderFiles.length - 1} />
                ))}
                {folderFiles.length === 0 && <p className="px-4 py-10 text-center text-[12.5px] text-[var(--fg-muted)]">No files in this folder.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function FilterGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="label-eyebrow mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`rounded-md border px-2 py-1 text-[11.5px] font-medium transition-colors ${
              value === o
                ? 'border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]'
                : 'border-[var(--line)] text-[var(--fg-muted)] hover:border-[var(--line-strong)] hover:text-[var(--fg)]'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function FileRow({ file, last }: { file: CatalogFile; last: boolean }) {
  return (
    <a
      href={`/viewer/${file.id}`}
      className={`group flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-[var(--bg-hover)] ${!last ? 'border-b border-[var(--line)]' : ''}`}
    >
      <FileTypeIcon file={file} size={15} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{file.name}</p>
        <p className="truncate text-[11px] text-[var(--fg-subtle)]">
          {file.path.join(' / ')} {file.modifiedTime ? `· ${new Date(file.modifiedTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
        </p>
      </div>
      <span className="hidden shrink-0 text-[11px] text-[var(--fg-subtle)] sm:block">{formatSize(file.size)}</span>
      <span className="shrink-0 rounded border border-[var(--line)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--fg-muted)]">{file.type}</span>
    </a>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] px-6 py-16 text-center">
      <p className="font-serif text-[17px] font-bold">No matches</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-[var(--fg-muted)]">
        Nothing matches this combination of filters. Clear them to see the whole library.
      </p>
      <button onClick={onReset} className="btn btn-ghost mt-4 text-[12px]">
        Clear filters
      </button>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[var(--fg-muted)]">Loading library…</div>}>
      <LibraryInner />
    </Suspense>
  );
}
