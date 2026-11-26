'use client';

import Link from 'next/link';
import { Bookmark, Download, Play } from 'lucide-react';
import type { CatalogFile } from '@/lib/types';
import { formatSize } from '@/lib/catalog';
import { useFavorites } from '@/lib/store';
import { FileTypeIcon } from './file-icon';

export function downloadFile(f: CatalogFile) {
  const url = `/api/drive?id=${encodeURIComponent(f.id)}&download=1&name=${encodeURIComponent(f.name)}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = f.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function FileCard({ file, compact = false }: { file: CatalogFile; compact?: boolean }) {
  const { isFav, toggle } = useFavorites();
  const inner = file.kind === 'video' || file.kind === 'audio';

  if (compact) {
    return (
      <Link
        href={`/viewer/${file.id}`}
        className="group flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] px-3 py-2.5 transition-colors hover:bg-[var(--bg-hover)]"
      >
        <FileTypeIcon file={file} size={15} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-5">{file.name}</p>
          <p className="truncate text-[11px] text-[var(--fg-subtle)]">
            {[file.type, file.subject, formatSize(file.size)].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle(file.id);
          }}
          aria-label={isFav(file.id) ? 'Remove bookmark' : 'Bookmark'}
          className="rounded p-1.5 text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-sub)] hover:text-[var(--fg)] group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Bookmark size={14} fill={isFav(file.id) ? 'currentColor' : 'none'} />
        </button>
      </Link>
    );
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 transition-all hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-card)]">
      <Link href={`/viewer/${file.id}`} className="focus-ring absolute inset-0 rounded-xl" aria-label={`Open ${file.name}`} />
      <div className="pointer-events-none relative flex items-start gap-3">
        <FileTypeIcon file={file} size={19} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13.5px] font-medium leading-[1.45] text-[var(--fg)]">{file.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] text-[var(--fg-subtle)]">
            <span className="font-medium text-[var(--fg-muted)]">{file.type}</span>
            {file.subject && <span>· {file.subject}</span>}
            {file.semester && <span>· {file.semester}</span>}
          </p>
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-[11px] text-[var(--fg-subtle)]">
          {formatSize(file.size) || (inner ? 'Stream in-app' : 'Open in-app')}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggle(file.id);
            }}
            aria-label={isFav(file.id) ? 'Remove bookmark' : 'Bookmark'}
            className="relative z-10 rounded-md p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]"
          >
            <Bookmark size={15} fill={isFav(file.id) ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              downloadFile(file);
            }}
            aria-label="Download"
            className="relative z-10 rounded-md p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]"
          >
            <Download size={15} />
          </button>
          <Link
            href={`/viewer/${file.id}`}
            aria-label="Open"
            className="relative z-10 rounded-md p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]"
          >
            <Play size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
