'use client';

import Link from 'next/link';
import { Bookmark, Download, ArrowUpRight, Play } from 'lucide-react';
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
  const streamable = file.kind === 'video' || file.kind === 'audio';
  const fav = isFav(file.id);

  if (compact) {
    return (
      <Link
        href={`/viewer/${file.id}`}
        className="group flex items-center gap-3 rounded-xl bg-elev px-3 py-2.5 shadow-hair transition-shadow hover:shadow-card"
      >
        <FileTypeIcon file={file} size={15} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold leading-5 text-fg">
            {file.name.replace(/\.pdf$/i, '')}
          </span>
          <span className="block truncate text-[11px] text-faint">
            {[file.type, file.subject, formatSize(file.size)].filter(Boolean).join(' · ')}
          </span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle(file.id);
          }}
          aria-label={fav ? 'Remove bookmark' : 'Bookmark'}
          className={`relative z-10 shrink-0 rounded-md p-1.5 transition-all ${
            fav ? 'text-accent' : 'text-faint opacity-0 hover:text-fg group-hover:opacity-100'
          }`}
        >
          <Bookmark size={14} fill={fav ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </Link>
    );
  }

  return (
    <article className="group relative flex flex-col rounded-xl bg-elev p-3.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <Link
        href={`/viewer/${file.id}`}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={`Open ${file.name}`}
      />

      <div className="pointer-events-none relative flex items-start gap-2.5">
        <FileTypeIcon file={file} size={17} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-semibold leading-[1.42] tracking-[-0.008em] text-fg">
            {file.name.replace(/\.pdf$/i, '')}
          </p>
        </div>
        <ArrowUpRight
          size={14}
          strokeWidth={2.2}
          className="mt-0.5 shrink-0 text-faint opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100"
        />
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-1">
        <span className="chip">{file.type}</span>
        {file.subject && (
          <span className="truncate text-[10.5px] text-faint">
            {file.subject}
          </span>
        )}
        {!file.subject && file.semester && (
          <span className="truncate text-[10.5px] text-faint">{file.semester}</span>
        )}
      </div>

      <div className="relative mt-3 flex items-center justify-between border-t border-line pt-2.5">
        <span className="tnum text-[10.5px] text-faint">
          {formatSize(file.size) || (streamable ? 'Streams in-app' : 'Opens in-app')}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(file.id);
            }}
            aria-label={fav ? 'Remove bookmark' : 'Bookmark'}
            aria-pressed={fav}
            className={`relative z-10 rounded-md p-1.5 transition-colors hover:bg-hover ${
              fav ? 'text-accent' : 'text-faint hover:text-fg'
            }`}
          >
            <Bookmark size={14} fill={fav ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              downloadFile(file);
            }}
            aria-label="Download"
            className="relative z-10 rounded-md p-1.5 text-faint transition-colors hover:bg-hover hover:text-fg"
          >
            <Download size={14} strokeWidth={2} />
          </button>
          {streamable && (
            <Link
              href={`/viewer/${file.id}`}
              aria-label="Play"
              className="relative z-10 rounded-md p-1.5 text-faint transition-colors hover:bg-hover hover:text-accent"
            >
              <Play size={14} strokeWidth={2.2} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
