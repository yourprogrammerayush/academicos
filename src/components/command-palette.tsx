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

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[10vh]">
      <div className="absolute inset-0 bg-[#0B1220]/45 backdrop-blur-[2px]" onClick={() => setPaletteOpen(false)} />
      <div className="animate-fade-up relative w-full max-w-[600px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] shadow-[var(--shadow-pop)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4">
          <Search size={16} className="shrink-0 text-[var(--fg-subtle)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search files, subjects, or jump anywhere…"
            className="h-[52px] flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--fg-subtle)]"
            aria-label="Command palette search"
          />
          <kbd className="rounded border border-[var(--line)] bg-[var(--bg-sub)] px-1.5 py-0.5 text-[10px] text-[var(--fg-subtle)]">ESC</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-1.5">
          {items.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-[13.5px] font-medium">No results for “{q}”</p>
              <p className="mt-1 text-[12px] text-[var(--fg-subtle)]">
                Try a subject code (COA, DCN, OOP) or a type (notes, PYQ, video).
              </p>
            </div>
          )}

          {fileItems.length > 0 && (
            <p className="label-eyebrow px-3 pb-1 pt-2">Files</p>
          )}
          {fileItems.map((item, i) => (
            <button
              key={item.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(item)}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                active === i ? 'bg-[var(--bg-hover)]' : ''
              }`}
            >
              {item.icon}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{item.label}</span>
                {item.hint && <span className="block truncate text-[11px] text-[var(--fg-subtle)]">{item.hint}</span>}
              </span>
              {active === i && (
                <span className="flex items-center gap-1 text-[10.5px] text-[var(--fg-subtle)]">
                  open <CornerDownLeft size={11} />
                </span>
              )}
            </button>
          ))}

          {!q.trim() && (
            <>
              <p className="label-eyebrow px-3 pb-1 pt-3">Navigate</p>
              {nav.map((item, i) => {
                const idx = fileItems.length + i;
                return (
                  <button
                    key={item.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => run(item)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                      active === idx ? 'bg-[var(--bg-hover)]' : ''
                    }`}
                  >
                    <span className="text-[var(--fg-muted)]">{item.icon}</span>
                    <span className="flex-1 text-[13px]">{item.label}</span>
                  </button>
                );
              })}
              <p className="label-eyebrow px-3 pb-1 pt-3">Actions</p>
              {actions.map((item, i) => {
                const idx = fileItems.length + nav.length + i;
                return (
                  <button
                    key={item.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => run(item)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                      active === idx ? 'bg-[var(--bg-hover)]' : ''
                    }`}
                  >
                    <span className="text-[var(--fg-muted)]">{item.icon}</span>
                    <span className="flex-1 text-[13px]">{item.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--line)] bg-[var(--bg-sub)] px-4 py-2 text-[10.5px] text-[var(--fg-subtle)]">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--line)] bg-[var(--bg-elev)] px-1">↑</kbd>
            <kbd className="rounded border border-[var(--line)] bg-[var(--bg-elev)] px-1">↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--line)] bg-[var(--bg-elev)] px-1">↵</kbd> open
          </span>
          <span className="ml-auto">Searches across {catalog.files.length} indexed files</span>
        </div>
      </div>
    </div>
  );
}
