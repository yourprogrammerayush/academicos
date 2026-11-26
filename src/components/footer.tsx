'use client';

import Link from 'next/link';
import { useApp } from './app-provider';

export function Footer() {
  const { driveConnected, catalog } = useApp();
  return (
    <footer className="mt-auto hidden border-t border-[var(--line)] px-6 py-4 md:block">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--fg-subtle)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-serif text-[12px] font-bold tracking-tight text-[var(--fg-muted)]">
            Academic<span className="text-[var(--brand)]">OS</span>
          </span>
          <span className="text-[var(--line-strong)]">·</span>
          <span>
            {catalog.files.length} files indexed from <span className="text-[var(--fg-muted)]">{catalog.rootName}</span>
          </span>
          <span className="text-[var(--line-strong)]">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${driveConnected ? 'bg-[var(--ok)]' : 'bg-[var(--warn)]'}`} />
            {driveConnected ? 'Google Drive connected' : 'Demo catalog'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/about" className="hover:text-[var(--fg-muted)] hover:underline">
            About
          </Link>
          <Link href="/settings" className="hover:text-[var(--fg-muted)] hover:underline">
            Settings
          </Link>
          <span className="text-[var(--line-strong)]">·</span>
          <span>Web App Created By - Ayush Jha, 2CSE-4</span>
        </div>
      </div>
    </footer>
  );
}
