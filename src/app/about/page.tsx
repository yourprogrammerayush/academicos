'use client';

import Image from 'next/image';
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
      <div className="mx-auto max-w-[900px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Image src="/logo.png" alt="AcademicOS" width={220} height={132} className="h-16 w-auto" priority />
          <div>
            <h1 className="font-serif text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[31px]">
              An operating system for your degree.
            </h1>
            <p className="mt-2 max-w-[520px] text-[13.5px] leading-relaxed text-[var(--fg-muted)]">
              AcademicOS takes one folder of study material and turns it into a fast, private, installable workspace — with an AI that actually knows what&apos;s inside it.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
              <f.icon size={17} className="text-[var(--brand)]" />
              <p className="mt-2.5 text-[13.5px] font-semibold">{f.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--fg-muted)]">{f.text}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--bg-sub)] p-5">
          <p className="label-eyebrow">How it works</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {[
              { n: '01', t: 'Indexed', d: 'Your Drive folder is catalogued server-side — folders, names, types, sizes and preview routes.' },
              { n: '02', t: 'Enriched', d: 'Each file is tagged by year, semester, subject and resource type, so loose filenames become structure.' },
              { n: '03', t: 'Served', d: 'Files stream through a server proxy, so the reader, players and downloads all stay inside this app.' },
            ].map((s) => (
              <div key={s.n}>
                <p className="font-serif text-[19px] font-bold text-[var(--fg-subtle)]">{s.n}</p>
                <p className="mt-0.5 text-[12.5px] font-semibold">{s.t}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--fg-muted)]">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold"><Command size={14} /> Keyboard first</p>
            <ul className="mt-2 space-y-1 text-[11.5px] text-[var(--fg-muted)]">
              <li><kbd className="rounded border border-[var(--line)] bg-[var(--bg-sub)] px-1">⌘K</kbd> / <kbd className="rounded border border-[var(--line)] bg-[var(--bg-sub)] px-1">Ctrl K</kbd> — search everything</li>
              <li><kbd className="rounded border border-[var(--line)] bg-[var(--bg-sub)] px-1">Esc</kbd> — close panels and fullscreen</li>
              <li><kbd className="rounded border border-[var(--line)] bg-[var(--bg-sub)] px-1">Enter</kbd> — send a chat message</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold"><Smartphone size={14} /> Installable</p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--fg-muted)]">
              Add to home screen on Android, iPhone, iPad or desktop. The app shell, custom serif font and icons are cached for instant launch, even on a slow connection.
            </p>
            <Link href="/settings" className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--brand)] hover:underline">
              Installation guide <ArrowRight size={11} />
            </Link>
          </div>
        </section>

        <div className="mt-8 border-t border-[var(--line)] pt-5">
          <p className="text-[12px] font-medium">Web App Created By - Ayush Jha, 2CSE-4</p>
          <p className="mt-1 text-[11px] text-[var(--fg-subtle)]">
            AcademicOS · Built with Next.js, TypeScript & Tailwind · AI by Groq open-weight models · Files stay on Google Drive
          </p>
        </div>
      </div>
    </>
  );
}
