'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  FolderPlus,
  Clock3,
  Download,
  Search,
  Plus,
  Trash2,
  X,
  FolderClosed,
  Check,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { MobileTopBar } from '@/components/mobile-nav';
import { FileCard } from '@/components/file-card';
import { formatSize } from '@/lib/catalog';
import { store, useFavorites } from '@/lib/store';
import type { Collection } from '@/lib/types';

type Tab = 'favorites' | 'collections' | 'recent' | 'downloads' | 'searches';

const TABS: { id: Tab; label: string; icon: typeof Bookmark }[] = [
  { id: 'favorites', label: 'Favorites', icon: Bookmark },
  { id: 'collections', label: 'Collections', icon: FolderClosed },
  { id: 'recent', label: 'Recent', icon: Clock3 },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'searches', label: 'Searches', icon: Search },
];

export default function WorkspacePage() {
  const { catalog, signedIn, setAuthOpen } = useApp();
  const { favorites } = useFavorites();
  const [tab, setTab] = useState<Tab>('favorites');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [recents, setRecents] = useState<{ id: string; at: number }[]>([]);
  const [downloads, setDownloads] = useState<{ id: string; name: string; at: number }[]>([]);
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    setCollections(store.getCollections());
    setRecents(store.getRecents());
    setDownloads(store.getDownloads());
    setSearches(store.getSearchHistory());
  }, []);

  const favoriteFiles = useMemo(() => catalog.files.filter((f) => favorites.includes(f.id)), [catalog.files, favorites]);
  const recentFiles = useMemo(
    () => recents.map((r) => catalog.files.find((f) => f.id === r.id)).filter(Boolean),
    [catalog.files, recents]
  );

  const persistCollections = (next: Collection[]) => {
    setCollections(next);
    store.setCollections(next);
  };

  const createCollection = () => {
    const name = newName.trim();
    if (!name) return;
    const c: Collection = { id: Math.random().toString(36).slice(2, 10), name, fileIds: [], createdAt: Date.now() };
    persistCollections([c, ...collections]);
    setNewName('');
    setCreating(false);
  };

  const activeCollection = collections.find((c) => c.id === openCollection);
  const collectionFiles = activeCollection
    ? (activeCollection.fileIds.map((id) => catalog.files.find((f) => f.id === id)).filter(Boolean) as typeof catalog.files)
    : [];

  const totalSaved = favorites.length + collections.reduce((n, c) => n + c.fileIds.length, 0);

  return (
    <>
      <MobileTopBar title="Workspace" />
      <div className="mx-auto max-w-[1360px] px-4 pb-8 pt-5 sm:px-6 md:pt-7 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-eyebrow">Workspace</p>
            <h1 className="mt-1.5 font-serif text-[25px] font-bold tracking-[-0.02em] sm:text-[29px]">Your personal study space.</h1>
            <p className="mt-1.5 max-w-[560px] text-[13px] text-[var(--fg-muted)]">
              Saved locally on this device — instant, private, zero cost.
              {!signedIn && ' Sign in to keep it across devices.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!signedIn && (
              <button onClick={() => setAuthOpen(true)} className="btn btn-ghost text-[12px]">
                <Check size={13} /> Sync this workspace
              </button>
            )}
            <button onClick={() => setCreating(true)} className="btn btn-primary text-[12px]">
              <Plus size={13} /> New collection
            </button>
          </div>
        </div>

        {/* Overview strip */}
        <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="Favorite files" value={favorites.length} />
          <Stat label="Collections" value={collections.length} />
          <Stat label="Recent viewed" value={recents.length} />
          <Stat label="Total saved" value={totalSaved} />
        </div>

        {/* Tabs */}
        <div className="no-scrollbar mb-4 flex gap-1 overflow-x-auto border-b border-[var(--line)]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setOpenCollection(null);
              }}
              className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[12.5px] font-medium transition-colors ${
                tab === t.id ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <t.icon size={13} />
              {t.label}
              {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[var(--fg)]" />}
            </button>
          ))}
        </div>

        {tab === 'favorites' && (
          favoriteFiles.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favoriteFiles.map((f) => <FileCard key={f.id} file={f} />)}
            </div>
          ) : (
            <Empty icon={<Bookmark size={20} />} title="No favorites yet" text="Tap the bookmark icon on any file — from the library, a chat card, or inside the viewer." cta={{ href: '/library', label: 'Browse library' }} />
          )
        )}

        {tab === 'collections' && (
          activeCollection ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => setOpenCollection(null)} className="rounded-md p-1 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]" aria-label="Back">
                    <X size={16} />
                  </button>
                  <h2 className="font-serif text-[19px] font-bold">{activeCollection.name}</h2>
                  <span className="text-[11.5px] text-[var(--fg-subtle)]">{collectionFiles.length} files</span>
                </div>
                <button
                  onClick={() => {
                    if (!confirm(`Delete "${activeCollection.name}"?`)) return;
                    persistCollections(collections.filter((c) => c.id !== activeCollection.id));
                    setOpenCollection(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--warn)]"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
              {collectionFiles.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {collectionFiles.map((f) => <FileCard key={f.id} file={f} />)}
                </div>
              ) : (
                <Empty icon={<FolderPlus size={20} />} title="This collection is empty" text="Open any file, then use “Save to collection” from its viewer or bookmark it and add it here." />
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setOpenCollection(c.id)}
                  className="group flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 text-left transition-all hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-card)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-sub)] text-[var(--fg-muted)] ring-1 ring-[var(--line)]">
                    <FolderClosed size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">{c.name}</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--fg-subtle)]">{c.fileIds.length} files · created {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </span>
                </button>
              ))}
              <button
                onClick={() => setCreating(true)}
                className="flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--line)] text-[12px] text-[var(--fg-subtle)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--fg-muted)]"
              >
                <Plus size={17} /> New collection
              </button>
            </div>
          )
        )}

        {tab === 'recent' && (
          recentFiles.length ? (
            <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-elev)]">
              {recentFiles.map((f, i) => (
                <Link key={f!.id} href={`/viewer/${f!.id}`} className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-[var(--bg-hover)] ${i < recentFiles.length - 1 ? 'border-b border-[var(--line)]' : ''}`}>
                  <span className="text-[10.5px] tabular-nums text-[var(--fg-subtle)]">{String(recents[i]?.at ? new Date(recents[i].at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '').padStart(5, ' ')}</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{f!.name}</span>
                  <span className="hidden text-[10.5px] text-[var(--fg-subtle)] sm:block">{f!.type}</span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty icon={<Clock3 size={20} />} title="Nothing viewed yet" text="Files you open will show up here for one-tap return." cta={{ href: '/library', label: 'Start browsing' }} />
          )
        )}

        {tab === 'downloads' && (
          downloads.length ? (
            <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-elev)]">
              {downloads.map((d, i) => {
                const f = catalog.files.find((x) => x.id === d.id);
                return (
                  <div key={d.id} className={`flex items-center gap-3 px-3.5 py-2.5 ${i < downloads.length - 1 ? 'border-b border-[var(--line)]' : ''}`}>
                    <Download size={14} className="shrink-0 text-[var(--fg-subtle)]" />
                    <span className="min-w-0 flex-1 truncate text-[12.5px]">{d.name}</span>
                    <span className="shrink-0 text-[10.5px] text-[var(--fg-subtle)]">{f ? formatSize(f.size) : ''}</span>
                    <span className="hidden shrink-0 text-[10.5px] text-[var(--fg-subtle)] sm:block">
                      {new Date(d.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty icon={<Download size={20} />} title="No downloads yet" text="Files you download are listed here with their size and date." cta={{ href: '/library', label: 'Find something to read' }} />
          )
        )}

        {tab === 'searches' && (
          searches.length ? (
            <div className="flex flex-wrap gap-2">
              {searches.map((s) => (
                <Link key={s} href={`/library?q=${encodeURIComponent(s)}`} className="chip">
                  <Search size={12} /> {s}
                </Link>
              ))}
            </div>
          ) : (
            <Empty icon={<Search size={20} />} title="No searches yet" text="Recent searches appear here so you can retrace your steps instantly." cta={{ href: '/library', label: 'Search the library' }} />
          )
        )}
      </div>

      {/* New collection modal */}
      {creating && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#0B1220]/45 backdrop-blur-[2px]" onClick={() => setCreating(false)} />
          <div className="animate-fade-up relative w-full max-w-[380px] rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 shadow-[var(--shadow-pop)]">
            <p className="text-[14px] font-semibold">New collection</p>
            <p className="mt-1 text-[11.5px] text-[var(--fg-muted)]">Group files for an exam, a subject, or a late-night cram session.</p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createCollection()}
              placeholder="e.g. Midterm Prep, Exam Night"
              className="mt-3 h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] px-3 text-[13px] outline-none focus:border-[var(--line-strong)]"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="btn btn-quiet text-[12px]">Cancel</button>
              <button onClick={createCollection} disabled={!newName.trim()} className="btn btn-primary text-[12px] disabled:opacity-40">Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] px-3 py-2.5">
      <p className="font-serif text-[20px] font-bold leading-none tracking-[-0.02em] tabular-nums">{value}</p>
      <p className="mt-1 text-[10.5px] uppercase tracking-wide text-[var(--fg-subtle)]">{label}</p>
    </div>
  );
}

function Empty({ icon, title, text, cta }: { icon: React.ReactNode; title: string; text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] px-6 py-14 text-center">
      <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-sub)] text-[var(--fg-subtle)]">{icon}</span>
      <p className="font-serif text-[16px] font-bold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-[var(--fg-muted)]">{text}</p>
      {cta && <Link href={cta.href} className="btn btn-ghost mt-4 text-[12px]">{cta.label}</Link>}
    </div>
  );
}
