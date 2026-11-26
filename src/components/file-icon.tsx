'use client';

import {
  FileText,
  Film,
  Music2,
  Image as ImageIcon,
  Presentation,
  File as FileIcon,
  FileAudio,
} from 'lucide-react';
import type { CatalogFile } from '@/lib/types';

export const TYPE_TONE: Record<string, { bg: string; fg: string }> = {
  pdf: { bg: '#FDECEC', fg: '#B42318' },
  video: { bg: '#EEF2FF', fg: '#3538CD' },
  audio: { bg: '#ECFDF5', fg: '#047857' },
  image: { bg: '#FEF6E7', fg: '#B54708' },
  text: { bg: '#F2F4F7', fg: '#475467' },
  doc: { bg: '#EFF8FF', fg: '#175CD3' },
  other: { bg: '#F2F4F7', fg: '#475467' },
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
                : FileTypeIconFallback(file);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md"
      style={{
        width: size + 16,
        height: size + 16,
        background: `color-mix(in srgb, ${tone.bg} 92%, transparent)`,
        color: tone.fg,
      }}
    >
      <Icon size={size} strokeWidth={1.75} />
    </span>
  );
}

function FileTypeIconFallback(file: CatalogFile) {
  if (file.kind === 'audio') return FileAudio;
  return FileIcon;
}

export function KindBadge({ label }: { label: string }) {
  return (
    <span className="rounded border border-[var(--line)] bg-[var(--bg-sub)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-subtle)]">
      {label}
    </span>
  );
}
