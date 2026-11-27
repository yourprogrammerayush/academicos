'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CornerDownLeft,
  Home,
  Library,
  Film,
  Headphones,
  Bookmark,
  Sparkle,
  Sun,
  Moon,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from './app-provider';
import { searchCatalog } from '@/lib/search';
import { FileTypeIcon } from './file-icon';
import { store } from '@/lib/store';

interface Item {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, catalog, setQuery, theme, setTheme, setAuthOpen } = useApp();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (paletteOpen) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [paletteOpen]);

  const results = useMemo(() => searchCatalog(catalog.files, q, 6), [catalog.files, q]);

  const nav: Item[] = useMemo(
    () => [
      { id: 'nav-home', label: 'Go to Home', icon: <Home size={15} />, action: () => router.push('/') },
      { id: 'nav-lib', label: 'Go to Library', icon: <Library size={15} />, action: () => router.push('/library') },
      { id: 'nav-ai', label: 'Open Study AI', icon: <Sparkle size={15} />, action: () => router.push('/ai') },
      { id: 'nav-video', label: 'Open Video', icon: <Film size={15} />, action: () => router.push('/video') },
      { id: 'nav-audio', label: 'Open Podcasts', icon: <Headphones size={15} />, action: () => router.push('/audio') },
      { id: 'nav-ws', label: 'Open Workspace', icon: <Bookmark size={15} />, action: () => router.push('/workspace') },
    ],
    [router]
  );

  const actions: Item[] = useMemo(
    () => [
      {
        id: 'act-theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
        action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      { id: 'act-auth', label: 'Sign in / account', icon: <ArrowUpRight size={15} />, action: () => setAuthOpen(true) },
    ],
    [theme, setTheme, setAuthOpen]
  );

  const fileItems: Item[] = results.map((f) => ({
    id: f.id,
    label: f.name,
    hint: [f.type, f.subject, f.semester].filter(Boolean).join(' · '),
    icon: <FileTypeIcon file={f} size={13} />,
    action: () => router.push(`/viewer/${f.id}`),
  }));

  const items = [...fileItems, ...(q.trim() ? [] : [...nav, ...actions])];

  const run = (item?: Item) => {
    const chosen = item || items[active];
    if (!chosen) return;
    if (q.trim()) store.pushSearch(q.trim());
    chosen.action();
    setPaletteOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      run();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      setQuery(q || '');
    }
  };

  if (!paletteOpen) return null;

  const sectionLabel = (text: string) => (
    <p className="eyebrow px-3 pb-1.5 pt-3">{text}</p>
  );

  const row = (item: Item, idx: number) => (
    <button
      key={item.id}
      onMouseEnter={() => setActive(idx)}
      onClick={() => run(item)}
      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
        active === idx ? 'bg-hover' : ''
      }`}
    >
      {item.icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-fg">{item.label}</span>
        {item.hint && (
          <span className="mt-0.5 block truncate text-[11px] text-faint">{item.hint}</span>
        )}
      </span>
      {active === idx && (
        <span className="flex shrink-0 items-center gap-1 text-[10.5px] text-faint">
          open <CornerDownLeft size={11} />
        </span>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[8vh] sm:pt-[12vh]">
      <button
        className="absolute inset-0 animate-fade-in bg-navy-950/45 backdrop-blur-[3px]"
        onClick={() => setPaletteOpen(false)}
        aria-label="Close search"
        tabIndex={-1}
      />
      <div
        className="relative w-full max-w-[612px] animate-fade-up overflow-hidden rounded-2xl bg-elev shadow-pop"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={17} className="shrink-0 text-faint" strokeWidth={2.1} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search files, subjects, or jump anywhere…"
            className="h-[56px] flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-faint"
            aria-label="Command palette search"
          />
          <kbd className="hidden rounded-md bg-mist px-1.5 py-0.5 text-[10px] font-semibold text-faint sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[54vh] overflow-y-auto p-1.5">
          {items.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-[14px] font-bold text-fg">No results for “{q}”</p>
              <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-relaxed text-muted">
                Try a subject code (COA, DCN, OOP) or a type (notes, PYQ, video).
              </p>
            </div>
          )}

          {fileItems.length > 0 && sectionLabel('Files')}
          {fileItems.map((item, i) => row(item, i))}

          {!q.trim() && (
            <>
              {sectionLabel('Navigate')}
              {nav.map((item, i) => row(item, fileItems.length + i))}
              {sectionLabel('Actions')}
              {actions.map((item, i) => row(item, fileItems.length + nav.length + i))}
            </>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-line bg-sunken px-4 py-2.5 text-[10.5px] text-faint">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-elev px-1 py-0.5 text-[10px] shadow-hair">↑</kbd>
            <kbd className="rounded bg-elev px-1 py-0.5 text-[10px] shadow-hair">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-elev px-1 py-0.5 text-[10px] shadow-hair">↵</kbd> open
          </span>
          <span className="ml-auto hidden sm:block">
            {catalog.files.length} files indexed
          </span>
        </div>
      </div>
    </div>
  );
}
