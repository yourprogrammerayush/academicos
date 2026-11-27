'use client';

import Link from 'next/link';
import { useApp } from './app-provider';

export function Footer() {
  const { driveConnected, catalog } = useApp();
  return (
    <footer className="mt-auto hidden border-t border-line px-6 py-4 md:block">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 text-[11px] text-faint">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[12px] font-bold h-title tracking-tight text-muted">
            Academic<span className="text-accent">OS</span>
          </span>
          <span className="text-line-strong">·</span>
          <span>
            {catalog.files.length} files indexed from <span className="text-muted">{catalog.rootName}</span>
          </span>
          <span className="text-line-strong">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${driveConnected ? 'bg-ok' : 'bg-warn'}`} />
            {driveConnected ? 'Google Drive connected' : 'Demo catalog'}
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
          <span>Web App Created By - Ayush Jha, 2CSE-4</span>
        </div>
      </div>
    </footer>
  );
}
