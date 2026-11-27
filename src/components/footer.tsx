'use client';

import Link from 'next/link';
import { useApp } from './app-provider';

export function Footer() {
  const { driveConnected, catalog } = useApp();
  return (
    <footer className="mt-auto hidden border-t border-line px-6 py-4 md:block">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 text-[11px] text-faint">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mark-32.png" alt="" width={14} height={14} className="h-3.5 w-3.5 opacity-70" />
            <span className="text-[12px] font-bold tracking-[-0.02em] text-muted">
              Academic<span className="text-accent">OS</span>
            </span>
          </span>
          <span className="text-line-strong">·</span>
          <span>
            {catalog.files.length} files indexed from <span className="text-muted">{catalog.rootName}</span>
          </span>
          <span className="text-line-strong">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${driveConnected ? 'bg-ok' : 'bg-warn'}`} />
            {driveConnected ? 'Google Drive live' : 'Curated snapshot'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/about" className="hover:text-muted hover:underline">
            About
          </Link>
          <Link href="/settings" className="hover:text-muted hover:underline">
            Settings
          </Link>
          <span className="text-line-strong">·</span>
          <span>Built by Ayush Jha, 2CSE-4</span>
        </div>
      </div>
    </footer>
  );
}
