'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

/**
 * Large illustrated art tiles, modelled on the IILM "New updates" grid.
 *
 * Each tile carries its own bespoke illustration drawn as inline SVG — flat
 * shapes in the brand ramp on a soft tinted ground. Because they are vectors
 * they stay sharp at any size and cost one HTTP request between them.
 */

export type ArtKind = 'ai' | 'library' | 'exams' | 'video' | 'audio';

const ART: Record<ArtKind, { bg: string; fg: string }> = {
  ai: { bg: '#FFF6EC', fg: '#FC6000' },
  library: { bg: '#F2F5FA', fg: '#1A2438' },
  exams: { bg: '#FFF9EB', fg: '#E08C00' },
  video: { bg: '#FFF1F0', fg: '#FC3A2C' },
  audio: { bg: '#EDF6F1', fg: '#1B7A56' },
};

export function ArtTile({
  kind,
  href,
  label,
  meta,
  icon: Icon,
  featured = false,
}: {
  kind: ArtKind;
  href: string;
  label: string;
  meta: string;
  icon: LucideIcon;
  featured?: boolean;
}) {
  const tone = ART[kind];
  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-xl2 bg-elev shadow-card transition-all duration-300 ease-swift hover:-translate-y-1 hover:shadow-lift ${
        featured ? 'sm:col-span-2' : ''
      }`}
    >
      {/* Illustration plate */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ background: tone.bg, height: featured ? 132 : 96 }}
      >
        <Illustration kind={kind} className="absolute inset-0 h-full w-full" />
        <span
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 shadow-hair backdrop-blur-sm transition-transform duration-300 ease-swift group-hover:scale-110"
          style={{ color: tone.fg }}
        >
          <Icon size={17} strokeWidth={2.1} />
        </span>
      </div>

      {/* Label */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-semibold leading-tight tracking-[-0.012em] text-fg">
            {label}
          </span>
          <span className="mt-0.5 block truncate text-[10.5px] text-faint">{meta}</span>
        </span>
        <span
          className="shrink-0 text-faint transition-all duration-300 ease-swift group-hover:translate-x-0.5 group-hover:text-fg"
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

/** Flat vector scenes, one per tile. Deliberately simple and geometric. */
function Illustration({ kind, className }: { kind: ArtKind; className?: string }) {
  const tone = ART[kind];
  const fg = tone.fg;

  if (kind === 'ai') {
    return (
      <svg viewBox="0 0 240 100" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
        <circle cx="196" cy="24" r="44" fill="#FC6000" opacity="0.08" />
        <circle cx="46" cy="86" r="34" fill="#FCA800" opacity="0.10" />
        {/* concentric intelligence rings */}
        {[14, 25, 36].map((r, i) => (
          <circle key={r} cx="120" cy="50" r={r} fill="none" stroke={fg} strokeWidth="1" opacity={0.16 + i * 0.05} />
        ))}
        <path d="M120 36l3.6 10.4L134 50l-10.4 3.6L120 64l-3.6-10.4L106 50l10.4-3.6z" fill={fg} opacity="0.9" />
        <circle cx="64" cy="30" r="3" fill="#FCA800" />
        <circle cx="186" cy="70" r="4" fill={fg} opacity="0.55" />
        <circle cx="160" cy="22" r="2" fill="#FC3A2C" opacity="0.7" />
      </svg>
    );
  }

  if (kind === 'library') {
    return (
      <svg viewBox="0 0 240 100" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
        {/* stacked shelves */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3, 4, 5, 6].map((col) => {
            const h = 10 + ((col * 7 + row * 11) % 16);
            return (
              <rect
                key={`${row}-${col}`}
                x={44 + col * 22}
                y={22 + row * 26 + (20 - h)}
                width="13"
                height={h}
                rx="2"
                fill={col % 3 === 0 ? '#FCA800' : fg}
                opacity={0.14 + ((col + row) % 4) * 0.09}
              />
            );
          })
        )}
        <rect x="38" y="20" width="164" height="3" rx="1.5" fill={fg} opacity="0.2" />
        <rect x="38" y="46" width="164" height="3" rx="1.5" fill={fg} opacity="0.2" />
        <rect x="38" y="72" width="164" height="3" rx="1.5" fill={fg} opacity="0.2" />
      </svg>
    );
  }

  if (kind === 'exams') {
    return (
      <svg viewBox="0 0 240 100" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
        {/* sheet of paper with ticked lines */}
        <rect x="88" y="16" width="64" height="76" rx="6" fill="#fff" opacity="0.85" />
        <rect x="88" y="16" width="64" height="76" rx="6" fill="none" stroke={fg} strokeWidth="1.2" opacity="0.3" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x="98" y={30 + i * 15} width="9" height="9" rx="2" fill={fg} opacity={i < 2 ? 0.85 : 0.25} />
            {i < 2 && (
              <path
                d={`M100 ${34.5 + i * 15}l2 2 4-4`}
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
            <rect x="113" y={33 + i * 15} width={i % 2 ? 26 : 32} height="4" rx="2" fill={fg} opacity="0.16" />
          </g>
        ))}
        {/* medal */}
        <circle cx="176" cy="38" r="17" fill="#FCA800" opacity="0.18" />
        <circle cx="176" cy="38" r="11" fill="none" stroke={fg} strokeWidth="2" opacity="0.8" />
        <path d="M176 32.5l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" fill={fg} opacity="0.9" />
        <circle cx="62" cy="62" r="14" fill="#FC6000" opacity="0.10" />
      </svg>
    );
  }

  if (kind === 'video') {
    return (
      <svg viewBox="0 0 240 100" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
        {/* film strip with a play head */}
        <rect x="60" y="26" width="120" height="52" rx="8" fill="#fff" opacity="0.7" />
        <rect x="60" y="26" width="120" height="52" rx="8" fill="none" stroke={fg} strokeWidth="1.2" opacity="0.28" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={`t${i}`} x={70 + i * 28} y="20" width="10" height="6" rx="1.5" fill={fg} opacity="0.3" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <rect key={`b${i}`} x={70 + i * 28} y="78" width="10" height="6" rx="1.5" fill={fg} opacity="0.3" />
        ))}
        <circle cx="120" cy="52" r="17" fill={fg} opacity="0.12" />
        <path d="M115 44.5l14 7.5-14 7.5z" fill={fg} />
        <circle cx="196" cy="30" r="3.5" fill="#FC6000" opacity="0.7" />
        <circle cx="44" cy="70" r="5" fill="#FC6000" opacity="0.2" />
      </svg>
    );
  }

  // audio
  return (
    <svg viewBox="0 0 240 100" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <circle cx="120" cy="50" r="46" fill={fg} opacity="0.07" />
      {[
        10, 22, 34, 20, 42, 54, 30, 46, 58, 36, 24, 40, 52, 28, 16, 30, 44, 20,
      ].map((h, i) => (
        <rect
          key={i}
          x={44 + i * 8.6}
          y={50 - h / 2}
          width="4"
          height={h}
          rx="2"
          fill={i % 4 === 0 ? '#FCA800' : fg}
          opacity={0.25 + (i % 5) * 0.12}
        />
      ))}
    </svg>
  );
}
