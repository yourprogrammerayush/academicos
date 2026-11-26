'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home,
  Library,
  Sparkle,
  Film,
  Headphones,
  Bookmark,
  Search,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';
import { useApp } from './app-provider';
import { store } from '@/lib/store';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/ai', label: 'Study AI', icon: Sparkle },
  { href: '/video', label: 'Video', icon: Film },
  { href: '/audio', label: 'Podcasts', icon: Headphones },
  { href: '/workspace', label: 'Workspace', icon: Bookmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const { setPaletteOpen, theme, setTheme, signedIn, userName, setAuthOpen } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [recents, setRecents] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    setCollapsed(store.getTheme() === 'dark' ? false : localStorage.getItem('academicos:sidebar') === '1');
    setRecents(
      store
        .getRecents()
        .slice(0, 4)
        .map((r) => ({ id: r.id, label: r.id }))
    );
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('academicos:sidebar', next ? '1' : '0');
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

  return (
    <aside
      className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-sub)] transition-[width] duration-200 md:flex"
      style={{ width: collapsed ? 72 : 248 }}
    >
      <div className={`flex h-16 items-center ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden focus-ring rounded-lg">
          <Image src="/logo.png" alt="AcademicOS" width={96} height={58} className="h-8 w-auto shrink-0 object-contain" priority />
          {!collapsed && (
            <span className="font-serif text-[17px] font-bold leading-none tracking-tight">
              Academic<span className="text-[var(--brand)]">OS</span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className="rounded-md p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--fg)] focus-ring"
          >
            <ChevronsLeft size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={toggleCollapsed}
          aria-label="Expand sidebar"
          className="mx-auto mb-2 rounded-md p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--fg)] focus-ring"
        >
          <ChevronsRight size={16} />
        </button>
      )}

      <div className={collapsed ? 'px-3' : 'px-3'}>
        <button
          onClick={() => setPaletteOpen(true)}
          className={`flex w-full items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] py-2 text-[13px] text-[var(--fg-subtle)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--fg-muted)] focus-ring ${collapsed ? 'justify-center px-0' : 'px-3'}`}
          aria-label="Search everything"
        >
          <Search size={15} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search everything</span>
              <kbd className="rounded border border-[var(--line)] bg-[var(--bg-sub)] px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      <nav className={`mt-5 flex flex-1 flex-col gap-0.5 overflow-y-auto no-scrollbar ${collapsed ? 'px-3' : 'px-3'}`}>
        {!collapsed && <p className="label-eyebrow mb-2 px-3">Workspace</p>}
        {NAV.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-2.5 rounded-lg py-2 text-[13.5px] font-medium transition-colors focus-ring ${
                collapsed ? 'justify-center px-0' : 'px-3'
              } ${
                active
                  ? 'bg-[var(--bg-elev)] text-[var(--fg)] shadow-[var(--shadow-card)] ring-1 ring-[var(--line)]'
                  : 'text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]'
              }`}
            >
              <item.icon size={17} strokeWidth={active ? 2.1 : 1.8} className={active ? 'text-[var(--brand)]' : ''} />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && recents.length > 0 && (
          <div className="mt-6">
            <p className="label-eyebrow mb-2 px-3">Recent</p>
            {recents.map((r) => (
              <Link
                key={r.id}
                href={`/viewer/${r.id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]"
              >
                <span className="h-1 w-1 rounded-full bg-[var(--fg-subtle)]" />
                <span className="truncate">{r.label.replace(/demo-/, '').replace(/-/g, ' ')}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className={`border-t border-[var(--line)] p-3 ${collapsed ? 'space-y-2' : 'space-y-1.5'}`}>
        {!collapsed && (
          <button
            onClick={() => setAuthOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--bg-hover)]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--fg)] text-[11px] font-semibold text-[var(--bg)]">
              {(signedIn ? userName : 'G').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium">{signedIn ? userName : 'Guest mode'}</span>
              <span className="block truncate text-[11px] text-[var(--fg-subtle)]">
                {signedIn ? 'Synced profile' : 'Sign in to sync'}
              </span>
            </span>
            <Plus size={14} className="text-[var(--fg-subtle)]" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setAuthOpen(true)}
            aria-label="Account"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fg)] text-[11px] font-semibold text-[var(--bg)]"
          >
            {(signedIn ? userName : 'G').slice(0, 1).toUpperCase()}
          </button>
        )}
        <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : 'justify-between'}`}>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--fg-muted)]"
            title={`Theme: ${theme}`}
          >
            <ThemeIcon size={14} />
            {!collapsed && <span className="capitalize">{theme}</span>}
          </button>
          <Link
            href="/settings"
            aria-label="Settings"
            className="rounded-md p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]"
          >
            <Settings size={15} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
