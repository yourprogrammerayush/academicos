'use client';

import { useEffect, useState } from 'react';
import type { ChatThread, Collection } from './types';

const LS = {
  favorites: 'academicos:favorites',
  collections: 'academicos:collections',
  recents: 'academicos:recents',
  downloads: 'academicos:downloads',
  searchHistory: 'academicos:searchHistory',
  chatThreads: 'academicos:chatThreads',
  theme: 'academicos:theme',
  profile: 'academicos:profile',
  progress: 'academicos:progress',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / private mode — ignore
  }
}

export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    setValue(read(key, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      write(key, next);
      return next;
    });
  };
  return [value, set] as const;
}

export const store = {
  getFavorites: () => read<string[]>(LS.favorites, []),
  setFavorites: (ids: string[]) => write(LS.favorites, ids),
  getCollections: () => read<Collection[]>(LS.collections, []),
  setCollections: (c: Collection[]) => write(LS.collections, c),
  getRecents: () => read<{ id: string; at: number }[]>(LS.recents, []),
  pushRecent: (id: string) => {
    const list = store.getRecents().filter((r) => r.id !== id);
    list.unshift({ id, at: Date.now() });
    write(LS.recents, list.slice(0, 60));
  },
  getDownloads: () => read<{ id: string; name: string; at: number }[]>(LS.downloads, []),
  pushDownload: (id: string, name: string) => {
    const list = store.getDownloads().filter((d) => d.id !== id);
    list.unshift({ id, name, at: Date.now() });
    write(LS.downloads, list.slice(0, 60));
  },
  getSearchHistory: () => read<string[]>(LS.searchHistory, []),
  pushSearch: (q: string) => {
    const t = q.trim();
    if (!t) return;
    const list = store.getSearchHistory().filter((s) => s.toLowerCase() !== t.toLowerCase());
    list.unshift(t);
    write(LS.searchHistory, list.slice(0, 20));
  },
  getChatThreads: () => read<ChatThread[]>(LS.chatThreads, []),
  setChatThreads: (t: ChatThread[]) => write(LS.chatThreads, t),
  getTheme: () => read<'light' | 'dark' | 'system'>(LS.theme, 'system'),
  setTheme: (t: 'light' | 'dark' | 'system') => write(LS.theme, t),
  getProfile: () => read<{ name: string; email: string; guest: boolean }>(LS.profile, { name: 'Guest', email: '', guest: true }),
  setProfile: (p: { name: string; email: string; guest: boolean }) => write(LS.profile, p),
  getProgress: () => read<Record<string, number>>(LS.progress, {}),
  setProgress: (id: string, pct: number) => {
    const p = store.getProgress();
    p[id] = pct;
    write(LS.progress, p);
  },
};

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    setFavorites(store.getFavorites());
    const onChange = () => setFavorites(store.getFavorites());
    window.addEventListener('academicos:favorites', onChange);
    return () => window.removeEventListener('academicos:favorites', onChange);
  }, []);
  const toggle = (id: string) => {
    const list = store.getFavorites();
    const next = list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
    store.setFavorites(next);
    window.dispatchEvent(new Event('academicos:favorites'));
  };
  return { favorites, toggle, isFav: (id: string) => favorites.includes(id) };
}

export function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}
