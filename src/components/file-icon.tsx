'use client';

import { FileText, Film, Music2, Image as ImageIcon, Presentation, File as FileIcon } from 'lucide-react';
import type { CatalogFile } from '@/lib/types';

/** Muted, print-inspired tints — never neon, never pure hues. */
export const TYPE_TONE: Record<string, { bg: string; fg: string }> = {
  pdf: { bg: '#FDEEEC', fg: '#C0362B' },
  video: { bg: '#F0F1F8', fg: '#3F4B9B' },
  audio: { bg: '#EDF6F1', fg: '#1B7A56' },
  image: { bg: '#FDF3E3', fg: '#9A6410' },
  text: { bg: '#F2F3F1', fg: '#4B5563' },
  doc: { bg: '#EDF4FA', fg: '#1F5FA0' },
  other: { bg: '#F2F3F1', fg: '#4B5563' },
};

export function FileTypeIcon({ file, size = 18 }: { file: CatalogFile; size?: number }) {
  const tone = TYPE_TONE[file.kind] || TYPE_TONE.other;
  const Icon =
    file.kind === 'pdf'
      ? FileText
      : file.kind === 'video'
        ? Film
        : file.kind === 'audio'
          ? Music2
          : file.kind === 'image'
            ? ImageIcon
            : file.type === 'Presentation'
              ? Presentation
              : file.kind === 'text'
                ? FileText
                : FileIcon;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[9px]"
      style={{
        width: size + 16,
        height: size + 16,
        background: tone.bg,
        color: tone.fg,
      }}
      aria-hidden="true"
    >
      <Icon size={size} strokeWidth={1.85} />
    </span>
  );
}

export function KindBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-mist px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-faint">
      {label}
    </span>
  );
}
