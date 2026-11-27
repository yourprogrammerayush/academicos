'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Catalog, CatalogFile } from '@/lib/types';
import { SEED_CATALOG } from '@/data/seed-catalog';
import { applyTheme, store } from '@/lib/store';

type Theme = 'light' | 'dark' | 'system';

interface PlayerState {
  file: CatalogFile | null;
  playing: boolean;
}

type SyncState = {
  mode: 'live' | 'curated';
  syncedAt: string | null;
  syncing: boolean;
  notice: string | null;
};

interface AppCtx {
  catalog: Catalog;
  loading: boolean;
  driveConnected: boolean;
  sync: SyncState;
  refreshCatalog: (opts?: { silent?: boolean; force?: boolean }) => Promise<void>;
  query: string;
  setQuery: (q: string) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  player: PlayerState;
  play: (f: CatalogFile) => void;
  togglePlay: () => void;
  closePlayer: () => void;
  setPlaying: (p: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (o: boolean) => void;
  authOpen: boolean;
  setAuthOpen: (o: boolean) => void;
  signedIn: boolean;
  userName: string;
  signIn: (name: string, email: string) => void;
  signOut: () => void;
  installPrompt: (() => void) | null;
  canInstall: boolean;
  fileById: (id: string) => CatalogFile | undefined;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

type CatalogPayload = Catalog & {
  driveConnected?: boolean;
  mode?: 'live' | 'curated';
  syncedAt?: string;
  changes?: { added: CatalogFile[]; removed: string[]; unchanged: number };
  note?: string;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(SEED_CATALOG);
  const [loading, setLoading] = useState(true);
  const [driveConnected, setDriveConnected] = useState(false);
  const [sync, setSync] = useState<SyncState>({ mode: 'curated', syncedAt: null, syncing: false, notice: null });
  const [query, setQuery] = useState('');
  const [theme, setThemeState] = useState<Theme>('light');
  const [player, setPlayer] = useState<PlayerState>({ file: null, playing: false });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  const loadCatalog = useCallback(async (opts: { silent?: boolean; force?: boolean } = {}) => {
    if (!opts.silent) setSync((s) => ({ ...s, syncing: true }));
    try {
      const url = opts.force ? '/api/catalog?sync=1' : '/api/catalog';
      const res = await fetch(url, { cache: 'no-store' });
      const data = (await res.json()) as CatalogPayload;
      if (!data || !Array.isArray(data.files) || data.files.length === 0) return;

      setCatalog({
        files: data.files,
        folders: data.folders || [],
        rootName: data.rootName,
        indexedAt: data.syncedAt || new Date().toISOString(),
        source: data.driveConnected ? 'drive' : 'demo',
      });
      setDriveConnected(Boolean(data.driveConnected));
      setSync({
        mode: data.mode || (data.driveConnected ? 'live' : 'curated'),
        syncedAt: data.syncedAt || null,
        syncing: false,
        notice: null,
      });

      // Surface genuinely new files on a forced sync
      if (opts.force && data.changes?.added?.length) {
        const n = data.changes.added.length;
        setSync((s) => ({
          ...s,
          notice: `${n} new ${n === 1 ? 'file' : 'files'} added to your library`,
        }));
        window.setTimeout(() => setSync((s) => ({ ...s, notice: null })), 8000);
      }
    } catch {
      /* keep whatever we already have */
    } finally {
      setSync((s) => ({ ...s, syncing: false }));
      setLoading(false);
    }
  }, []);

  // First load
  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  // Refresh when the tab regains focus (covers the "I just uploaded a file" case)
  useEffect(() => {
    let last = Date.now();
    const maybeRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - last < 60_000) return;
      last = Date.now();
      void loadCatalog({ silent: true, force: true });
    };
    document.addEventListener('visibilitychange', maybeRefresh);
    window.addEventListener('focus', maybeRefresh);
    return () => {
      document.removeEventListener('visibilitychange', maybeRefresh);
      window.removeEventListener('focus', maybeRefresh);
    };
  }, [loadCatalog]);

  // Theme
  useEffect(() => {
    const stored = store.getTheme();
    setThemeState(stored);
    applyTheme(stored);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (store.getTheme() === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    store.setTheme(t);
    applyTheme(t);
  }, []);

  // Profile
  useEffect(() => {
    const p = store.getProfile();
    setSignedIn(!p.guest);
    setUserName(p.name || 'Guest');
  }, []);

  // Service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPrompt = useMemo(() => {
    if (!installEvent) return null;
    return () => {
      void installEvent.prompt();
      installEvent.userChoice.finally(() => setInstallEvent(null));
    };
  }, [installEvent]);

  const play = useCallback((f: CatalogFile) => setPlayer({ file: f, playing: true }), []);
  const togglePlay = useCallback(
    () => setPlayer((p) => (p.file ? { ...p, playing: !p.playing } : p)),
    []
  );
  const closePlayer = useCallback(() => setPlayer({ file: null, playing: false }), []);
  const setPlaying = useCallback((playing: boolean) => setPlayer((p) => ({ ...p, playing })), []);

  const signIn = useCallback((name: string, email: string) => {
    store.setProfile({ name, email, guest: false });
    setUserName(name);
    setSignedIn(true);
    setAuthOpen(false);
  }, []);

  const signOut = useCallback(() => {
    store.setProfile({ name: 'Guest', email: '', guest: true });
    setUserName('Guest');
    setSignedIn(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const fileIndex = useMemo(() => {
    const map = new Map<string, CatalogFile>();
    catalog.files.forEach((f) => map.set(f.id, f));
    return map;
  }, [catalog.files]);

  const value: AppCtx = {
    catalog,
    loading,
    driveConnected,
    sync,
    refreshCatalog: loadCatalog,
    query,
    setQuery,
    theme,
    setTheme,
    player,
    play,
    togglePlay,
    closePlayer,
    setPlaying,
    paletteOpen,
    setPaletteOpen,
    authOpen,
    setAuthOpen,
    signedIn,
    userName,
    signIn,
    signOut,
    installPrompt,
    canInstall: Boolean(installEvent),
    fileById: (id) => fileIndex.get(id),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
