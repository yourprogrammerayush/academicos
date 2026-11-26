'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Sparkle, Search } from 'lucide-react';
import { useApp } from './app-provider';

const ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/ai', label: 'AI', icon: Sparkle },
  { href: '/workspace', label: 'Saved', icon: Search },
];

export function MobileNav() {
  const pathname = usePathname();
  const { setPaletteOpen } = useApp();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex h-14 max-w-lg items-stretch">
        {ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition-colors ${
                active ? 'text-[var(--fg)]' : 'text-[var(--fg-subtle)]'
              }`}
            >
              <item.icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium text-[var(--fg-subtle)]"
        >
          <Search size={19} strokeWidth={1.8} />
          <span>Search</span>
        </button>
      </div>
    </nav>
  );
}

export function MobileTopBar({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/92 px-4 backdrop-blur-md md:hidden">
      <Link href="/" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="AcademicOS" className="h-7 w-auto" />
        <span className="font-serif text-[16px] font-bold tracking-tight">
          Academic<span className="text-[var(--brand)]">OS</span>
        </span>
      </Link>
      {title && <span className="text-[11.5px] text-[var(--fg-subtle)]">{title}</span>}
    </header>
  );
}
