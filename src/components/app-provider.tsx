'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Catalog, CatalogFile } from '@/lib/types';
import { SEED_CATALOG } from '@/data/seed-catalog';
import { applyTheme, store } from '@/lib/store';

type Theme = 'light' | 'dark' | 'system';

interface PlayerState {
  file: CatalogFile | null;
  playing: boolean;
}

interface AppCtx {
  catalog: Catalog;
  loading: boolean;
  driveConnected: boolean;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(SEED_CATALOG);
  const [loading, setLoading] = useState(true);
  const [driveConnected, setDriveConnected] = useState(false);
  const [query, setQuery] = useState('');
  const [theme, setThemeState] = useState<Theme>('system');
  const [player, setPlayer] = useState<PlayerState>({ file: null, playing: false });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [swReady, setSwReady] = useState(false);

  // Load catalog
  useEffect(() => {
    let cancelled = false;
    fetch('/api/catalog')
      .then((r) => r.json())
      .then((data: Catalog & { driveConnected?: boolean }) => {
        if (cancelled) return;
        if (data && Array.isArray(data.files) && data.files.length) {
          setCatalog(data);
          setDriveConnected(Boolean(data.driveConnected));
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

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
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => setSwReady(true))
        .catch(() => {});
    }
  }, []);
  void swReady;

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

  const play = useCallback((f: CatalogFile) => {
    setPlayer({ file: f, playing: true });
  }, []);

  const togglePlay = useCallback(() => {
    setPlayer((p) => (p.file ? { ...p, playing: !p.playing } : p));
  }, []);

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

  // Global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
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
