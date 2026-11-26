'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home,
  Library,
  Sparkle,
  Bookmark,
  Film,
  Headphones,
  X,
  Plus,
} from 'lucide-react';
import { useApp } from './app-provider';

const ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/ai', label: 'Study AI', icon: Sparkle },
  { href: '/workspace', label: 'Saved', icon: Bookmark },
];

const MORE = [
  { href: '/video', label: 'Video lectures', icon: Film, hint: 'Reels-style feed' },
  { href: '/audio', label: 'Podcasts', icon: Headphones, hint: 'Audio guides' },
];

export function MobileNav() {
  const pathname = usePathname();
  const [more, setMore] = useState(false);

  // Close the sheet on navigation
  useEffect(() => {
    setMore(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = more ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [more]);

  const mediaActive = pathname.startsWith('/video') || pathname.startsWith('/audio');

  return (
    <>
      {more && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-label="More sections">
          <div className="absolute inset-0 bg-[#0B1220]/40 backdrop-blur-[2px]" onClick={() => setMore(false)} />
          <div
            className="animate-fade-up absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-[var(--line)] bg-[var(--bg-elev)] p-4 pb-6"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="label-eyebrow">Media</p>
              <button
                onClick={() => setMore(false)}
                aria-label="Close"
                className="rounded-md p-1.5 text-[var(--fg-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-1.5">
              {MORE.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                      active
                        ? 'border-[var(--line-strong)] bg-[var(--bg-hover)]'
                        : 'border-[var(--line)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-sub)] text-[var(--fg-muted)] ring-1 ring-[var(--line)]">
                      <item.icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium">{item.label}</span>
                      <span className="block text-[11px] text-[var(--fg-subtle)]">{item.hint}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
            onClick={() => setMore(true)}
            aria-label="More sections"
            aria-expanded={more}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition-colors ${
              mediaActive || more ? 'text-[var(--fg)]' : 'text-[var(--fg-subtle)]'
            }`}
          >
            <Plus size={19} strokeWidth={mediaActive ? 2.2 : 1.8} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export function MobileTopBar({ title, back }: { title?: string; back?: boolean }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--bg)]/92 px-4 backdrop-blur-md md:hidden">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="AcademicOS" className="h-7 w-auto" />
        <span className="font-serif text-[16px] font-bold tracking-tight">
          Academic<span className="text-[var(--brand)]">OS</span>
        </span>
      </Link>
      {title && <span className="truncate text-[11.5px] text-[var(--fg-subtle)]">{title}</span>}
      {back && <span className="sr-only">Back</span>}
    </header>
  );
}
