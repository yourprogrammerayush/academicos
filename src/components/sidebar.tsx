'use client';

import Link from 'next/link';
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
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  Laptop,
  FileText,
  Command,
} from 'lucide-react';
import { useApp } from './app-provider';
import { store } from '@/lib/store';
import { Logo } from './logo';

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
  const { setPaletteOpen, theme, setTheme, signedIn, userName, setAuthOpen, fileById } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [recents, setRecents] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    setCollapsed(localStorage.getItem('academicos:sidebar') === '1');
    setRecents(
      store
        .getRecents()
        .slice(0, 4)
        .map((r) => ({ id: r.id, label: fileById(r.id)?.name || 'Recent file' }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('academicos:sidebar', next ? '1' : '0');
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

  return (
    <aside
      className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-sunken transition-[width] duration-300 ease-swift md:flex"
      style={{ width: collapsed ? 76 : 252 }}
    >
      {/* Brand */}
      <div className={`flex h-[68px] items-center ${collapsed ? 'justify-center' : 'justify-between px-5'}`}>
        <Logo size={30} withWordmark={!collapsed} />
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className="btn-icon h-7 w-7"
          >
            <PanelLeftClose size={15} strokeWidth={1.9} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={toggleCollapsed}
          aria-label="Expand sidebar"
          className="btn-icon mx-auto mb-1 h-7 w-7"
        >
          <PanelLeftOpen size={15} strokeWidth={1.9} />
        </button>
      )}

      {/* Search */}
      <div className="px-3">
        <button
          onClick={() => setPaletteOpen(true)}
          className={`flex w-full items-center gap-2.5 rounded-xl bg-elev py-2 text-[13px] text-muted transition-all hover:shadow-lift ${
            collapsed ? 'justify-center px-0 shadow-hair' : 'px-3 shadow-hair'
          }`}
          aria-label="Search everything"
        >
          <Search size={15} strokeWidth={2} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search</span>
              <kbd className="flex items-center gap-0.5 rounded-md bg-mist px-1.5 py-0.5 text-[10px] font-semibold text-faint">
                <Command size={9} strokeWidth={2.5} />K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 no-scrollbar">
        {!collapsed && <p className="eyebrow mb-2 px-3">Library</p>}
        {NAV.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex items-center gap-3 rounded-xl py-[9px] text-[13.5px] font-medium transition-colors ${
                collapsed ? 'justify-center px-0' : 'px-3'
              } ${
                active
                  ? 'bg-elev text-fg shadow-hair font-semibold'
                  : 'text-muted hover:bg-hover hover:text-fg'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <item.icon
                size={17}
                strokeWidth={active ? 2.15 : 1.85}
                className={active ? 'text-accent' : 'text-faint group-hover:text-muted'}
              />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && recents.length > 0 && (
          <div className="mt-7">
            <p className="eyebrow mb-2 px-3">Recently opened</p>
            {recents.map((r) => (
              <Link
                key={r.id}
                href={`/viewer/${r.id}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[12.5px] text-muted transition-colors hover:bg-hover hover:text-fg"
              >
                <FileText size={13} strokeWidth={1.8} className="shrink-0 text-faint" />
                <span className="truncate" title={r.label}>
                  {r.label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Account + utilities */}
      <div className={`border-t border-line p-3 ${collapsed ? 'space-y-2' : 'space-y-1'}`}>
        {!collapsed && (
          <button
            onClick={() => setAuthOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-hover"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-950 text-[11px] font-bold text-white">
              {(signedIn ? userName : 'A').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold leading-tight">
                {signedIn ? userName : 'Ayush Jha'}
              </span>
              <span className="block truncate text-[11px] text-faint">2CSE-4 · Guest</span>
            </span>
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setAuthOpen(true)}
            aria-label="Account"
            className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-navy-950 text-[11px] font-bold text-white"
          >
            {(signedIn ? userName : 'A').slice(0, 1).toUpperCase()}
          </button>
        )}
        <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : 'justify-between'} px-1`}>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-[11.5px] text-faint transition-colors hover:bg-hover hover:text-muted"
            title={`Theme: ${theme}`}
          >
            <ThemeIcon size={14} strokeWidth={1.9} />
            {!collapsed && <span className="capitalize">{theme}</span>}
          </button>
          <Link href="/settings" aria-label="Settings" className="btn-icon h-7 w-7">
            <Settings size={15} strokeWidth={1.9} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
