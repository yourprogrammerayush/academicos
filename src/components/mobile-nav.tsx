'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home,
  Library,
  Sparkle,
  Bookmark,
  Search,
  Film,
  Headphones,
  X,
  LayoutGrid,
  ChevronLeft,
} from 'lucide-react';
import { useApp } from './app-provider';
import { Logo } from './logo';

/** Sticky mobile header. Sits above page content, never overlaps safe-area. */
export function MobileTopBar({
  title,
  back,
  right,
}: {
  title?: string;
  back?: string | boolean;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl md:hidden">
      <div className="safe-t">
        <div className="flex h-[52px] items-center gap-2 px-3">
          {back ? (
            <Link
              href={typeof back === 'string' ? back : '/library'}
              aria-label="Back"
              className="btn-icon -ml-1 h-9 w-9"
            >
              <ChevronLeft size={19} strokeWidth={2.1} />
            </Link>
          ) : (
            <Logo size={26} withWordmark={false} href={null} />
          )}
          <div className="min-w-0 flex-1">
            {title ? (
              <p className="truncate text-[14.5px] font-semibold tracking-[-0.02em] text-fg">{title}</p>
            ) : (
              <Logo size={0} withWordmark />
            )}
          </div>
          {right}
        </div>
      </div>
    </header>
  );
}

const PRIMARY = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/ai', label: 'AI', icon: Sparkle },
  { href: '/workspace', label: 'Saved', icon: Bookmark },
];

const SHEET = [
  { href: '/video', label: 'Video lectures', desc: 'Reels-style lecture feed', icon: Film },
  { href: '/audio', label: 'Podcasts', desc: 'Listen to lecture audio', icon: Headphones },
];

export function MobileNav() {
  const pathname = usePathname();
  const { setPaletteOpen } = useApp();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="More sections">
          <button
            className="absolute inset-0 animate-fade-in bg-navy-950/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <div className="absolute inset-x-0 bottom-0 animate-sheet-up safe-b">
            <div className="mx-2 mb-2 overflow-hidden rounded-[22px] bg-elev shadow-pop">
              <div className="flex items-center justify-between px-4 pb-1 pt-3">
                <span className="eyebrow">Also in AcademicOS</span>
                <button onClick={() => setOpen(false)} className="btn-icon h-7 w-7" aria-label="Close">
                  <X size={15} />
                </button>
              </div>
              {SHEET.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3.5 px-4 py-3 transition-colors active:bg-hover"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-fg">
                    <item.icon size={18} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold leading-tight text-fg">{item.label}</span>
                    <span className="block text-[12px] text-faint">{item.desc}</span>
                  </span>
                </Link>
              ))}
              <div className="mx-4 h-px bg-line" />
              <button
                onClick={() => {
                  setOpen(false);
                  setPaletteOpen(true);
                }}
                className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors active:bg-hover"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-fg">
                  <Search size={18} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold leading-tight text-fg">Search everything</span>
                  <span className="block text-[12px] text-faint">Files, subjects, papers</span>
                </span>
              </button>
              <div className="h-2" />
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-elev/92 backdrop-blur-xl md:hidden">
        <div className="safe-b">
          <div className="mx-auto flex h-14 max-w-lg items-stretch">
            {PRIMARY.slice(0, 2).map((item) => (
              <Tab key={item.href} item={item} pathname={pathname} />
            ))}
            {PRIMARY.slice(2).map((item) => (
              <Tab key={item.href} item={item} pathname={pathname} />
            ))}
            <button
              onClick={() => setOpen(true)}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                open ? 'text-fg' : 'text-faint'
              }`}
              aria-label="More sections"
              aria-expanded={open}
            >
              <LayoutGrid size={20} strokeWidth={1.85} />
              <span className="text-[10px] font-semibold leading-none">More</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

function Tab({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: typeof Home };
  pathname: string;
}) {
  const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
        active ? 'text-fg' : 'text-faint'
      }`}
    >
      <item.icon size={20} strokeWidth={active ? 2.3 : 1.85} className={active ? 'text-accent' : ''} />
      <span className="text-[10px] font-semibold leading-none">{item.label}</span>
    </Link>
  );
}
