'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Film, Headphones, Sparkle, Shield, Smartphone, Layers, Command } from 'lucide-react';
import { MobileTopBar } from '@/components/mobile-nav';

const FEATURES = [
  {
    icon: Layers,
    title: 'Dual navigation',
    text: 'Keep the original Drive folder tree you already know, and jump straight to what you need with year, semester, subject and type filters.',
  },
  {
    icon: BookOpen,
    title: 'Read in place',
    text: 'A real document reader with zoom, page jump, fullscreen and a night-reading mode. No new tabs, no drive.google.com.',
  },
  {
    icon: Film,
    title: 'Reels for lectures',
    text: 'Every video becomes a vertical swipeable feed, with a one-tap landscape lecture mode for widescreen content.',
  },
  {
    icon: Headphones,
    title: 'Audio that follows you',
    text: 'A podcast-grade player with a persistent mini-bar, speed control, ±15s jumps and a sleep timer.',
  },
  {
    icon: Sparkle,
    title: 'Study AI, grounded',
    text: 'Ask in English, Hindi, Hinglish or Japanese. The assistant recommends real files from your library and renders them as cards.',
  },
  {
    icon: Shield,
    title: 'Private by default',
    text: 'Favorites, collections and history live on your device. All API keys stay server-side — nothing sensitive reaches the browser.',
  },
];

export default function AboutPage() {
  return (
    <>
      <MobileTopBar title="About" />
      <div className="mx-auto max-w-[880px] px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-2xl bg-navy-950 shadow-pop">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mark-192.png" alt="" width={54} height={54} className="h-[54px] w-[54px]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[27px] h-display text-fg sm:text-[33px]">
              An operating system for your degree.
            </h1>
            <p className="mt-2 max-w-[54ch] text-[13.5px] leading-relaxed text-muted text-pretty">
              AcademicOS turns one folder of study material into a fast, private, installable
              workspace — with an AI that actually knows what&apos;s inside it.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-elev p-4 shadow-card transition-shadow hover:shadow-lift">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
                <f.icon size={15} className="text-accent" strokeWidth={2} />
              </span>
              <p className="mt-3 text-[13.5px] font-bold text-fg">{f.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section className="mt-3 overflow-hidden rounded-2xl bg-navy-950 p-5 sm:p-7">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400/80">
            How it works
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Indexed',
                d: 'Your Drive folder is catalogued server-side — folders, names, types, sizes and preview routes.',
              },
              {
                n: '02',
                t: 'Enriched',
                d: 'Each file is tagged by year, semester, subject and resource type, so loose filenames become structure.',
              },
              {
                n: '03',
                t: 'Served',
                d: 'Files stream through a server proxy, so the reader, players and downloads all stay inside this app.',
              },
            ].map((s) => (
              <div key={s.n}>
                <p className="text-[15px] font-bold tracking-[0.02em] text-white/25">{s.n}</p>
                <p className="mt-1 text-[13px] font-semibold text-white">{s.t}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-white/55">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Details */}
        <section className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-2xl bg-elev p-4 shadow-card">
            <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-fg">
              <Command size={14} strokeWidth={2} className="text-faint" /> Keyboard first
            </p>
            <ul className="mt-2.5 space-y-1.5 text-[11.5px] leading-relaxed text-muted">
              <li className="flex flex-wrap items-center gap-1">
                <kbd className="rounded bg-mist px-1.5 py-0.5 text-[10px] font-semibold text-fg">⌘K</kbd>
                <span>/</span>
                <kbd className="rounded bg-mist px-1.5 py-0.5 text-[10px] font-semibold text-fg">Ctrl K</kbd>
                <span>— search everything</span>
              </li>
              <li className="flex flex-wrap items-center gap-1">
                <kbd className="rounded bg-mist px-1.5 py-0.5 text-[10px] font-semibold text-fg">Esc</kbd>
                <span>— close panels and fullscreen</span>
              </li>
              <li className="flex flex-wrap items-center gap-1">
                <kbd className="rounded bg-mist px-1.5 py-0.5 text-[10px] font-semibold text-fg">↑ ↓</kbd>
                <span>— move through the video and audio feeds</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-elev p-4 shadow-card">
            <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-fg">
              <Smartphone size={14} strokeWidth={2} className="text-faint" /> Installable
            </p>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted">
              Add it to your home screen on Android, iPhone, iPad or desktop. The app shell, the
              self-hosted font and the icons are cached for an instant launch, even on a slow
              connection.
            </p>
            <Link
              href="/settings"
              className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-accent hover:underline"
            >
              Installation guide <ArrowRight size={11} />
            </Link>
          </div>
        </section>

        <div className="mt-10 border-t border-line pt-6">
          <p className="text-[12.5px] font-semibold text-fg">
            Web App Created By — Ayush Jha, 2CSE-4
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-faint">
            AcademicOS · Next.js, TypeScript &amp; Tailwind · AI by Groq open-weight models · Files
            stay on Google Drive
          </p>
        </div>
      </div>
    </>
  );
}
