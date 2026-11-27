'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Download,
  ShieldCheck,
  Server,
  LogOut,
  Check,
  ChevronRight,
  Database,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { MobileTopBar } from '@/components/mobile-nav';
import type { Collection } from '@/lib/types';

export default function SettingsPage() {
  const { theme, setTheme, signedIn, userName, setAuthOpen, signOut, installPrompt, canInstall, driveConnected, catalog } = useApp();
  const [cleared, setCleared] = useState(false);
  const [collectionCount, setCollectionCount] = useState(0);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('academicos:collections') || '[]') as Collection[];
      setCollectionCount(Array.isArray(raw) ? raw.length : 0);
    } catch {
      setCollectionCount(0);
    }
    setStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  const clearLocal = () => {
    if (!confirm('Clear favorites, collections, recents and search history on this device?')) return;
    ['favorites', 'collections', 'recents', 'downloads', 'searchHistory', 'progress'].forEach((k) =>
      localStorage.removeItem(`academicos:${k}`)
    );
    setCollectionCount(0);
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <>
      <MobileTopBar title="Settings" />
      <div className="mx-auto max-w-[740px] px-4 pb-12 pt-5 sm:px-6 md:pt-8 lg:px-8">
        <h1 className="text-[27px] h-display text-fg sm:text-[32px]">Settings</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Everything here is stored on this device.
        </p>

        <Section title="Appearance">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light' as const, label: 'Light', icon: Sun, meta: 'Airy, high contrast' },
              { id: 'dark' as const, label: 'Dark', icon: Moon, meta: 'Slate, easy at night' },
              { id: 'system' as const, label: 'System', icon: Laptop, meta: 'Follows your OS' },
            ].map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-start gap-2 rounded-xl p-3 text-left transition-all ${
                    active
                      ? 'bg-elev shadow-lift ring-2 ring-inset ring-accent'
                      : 'bg-elev shadow-hair hover:shadow-card'
                  }`}
                >
                  <t.icon size={16} className={active ? 'text-accent' : 'text-faint'} strokeWidth={2} />
                  <span className="text-[12.5px] font-semibold text-fg">{t.label}</span>
                  <span className="text-[10.5px] leading-snug text-faint">{t.meta}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Account">
          {signedIn ? (
            <div className="flex items-center gap-3 rounded-xl bg-elev p-3.5 shadow-card">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg text-[13px] font-bold text-canvas">
                {userName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-fg">{userName}</p>
                <p className="text-[11px] text-faint">Signed in · profile sync on</p>
              </div>
              <button onClick={signOut} className="btn btn-outline btn-sm">
                <LogOut size={12} /> Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-elev p-4 shadow-card">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-fg">You&apos;re browsing as a guest</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                  Everything works. Signing in adds a synced profile.
                </p>
              </div>
              <button onClick={() => setAuthOpen(true)} className="btn btn-primary btn-sm">
                Sign in
              </button>
            </div>
          )}
        </Section>

        <Section title="Install">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-elev p-3.5 shadow-card">
            <div className="flex min-w-0 items-start gap-2.5">
              <Smartphone size={15} className="mt-0.5 shrink-0 text-faint" strokeWidth={1.9} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-fg">Add to your home screen</p>
                <p className="mt-0.5 max-w-[44ch] text-[11.5px] leading-relaxed text-muted">
                  One tap on Android and desktop. On iPhone: Share → Add to Home Screen. Runs
                  full-screen with the shell cached.
                </p>
              </div>
            </div>
            {canInstall && installPrompt ? (
              <button onClick={installPrompt} className="btn btn-primary btn-sm">
                <Download size={13} /> Install
              </button>
            ) : (
              <span className="chip">{standalone ? 'Installed' : 'Via browser menu'}</span>
            )}
          </div>
        </Section>

        <Section title="Data & privacy">
          <div className="divide-y divide-line overflow-hidden rounded-xl bg-elev shadow-card">
            <Row
              icon={<Database size={14} />}
              title="Your data stays local"
              meta="Favourites, collections and history live in this browser only."
            />
            <Row
              icon={<ShieldCheck size={14} />}
              title="No secrets in the client"
              meta="AI and Drive calls are proxied server-side with secret env vars."
            />
            <Row
              icon={<Server size={14} />}
              title="Catalogue source"
              meta={
                driveConnected
                  ? `Live from Google Drive · ${catalog.files.length} files indexed`
                  : `Curated snapshot · ${catalog.files.length} files (Drive key not set)`
              }
              trailing={
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    driveConnected ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {driveConnected ? 'live' : 'snapshot'}
                </span>
              }
            />
            <button
              onClick={clearLocal}
              className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-hover"
            >
              <Trash2 size={14} className={cleared ? 'text-ok' : 'text-warn'} />
              <span className="flex-1">
                <span className="block text-[12.5px] font-semibold text-fg">
                  {cleared ? 'Cleared' : 'Clear local workspace data'}
                </span>
                <span className="block text-[11px] text-faint">
                  {collectionCount} collection{collectionCount === 1 ? '' : 's'} · resets favourites
                  and history
                </span>
              </span>
              {cleared && <Check size={14} className="text-ok" />}
            </button>
          </div>
        </Section>

        <Section title="More">
          <div className="divide-y divide-line overflow-hidden rounded-xl bg-elev shadow-card">
            <Link href="/about" className="flex items-center gap-2.5 px-3.5 py-3 transition-colors hover:bg-hover">
              <span className="flex-1 text-[12.5px] font-medium text-fg">About AcademicOS</span>
              <ChevronRight size={14} className="text-faint" />
            </Link>
            <a href="/api/health" className="flex items-center gap-2.5 px-3.5 py-3 transition-colors hover:bg-hover">
              <span className="flex-1 text-[12.5px] font-medium text-fg">System status</span>
              <span className="inline-flex items-center gap-1.5 text-[10.5px] text-faint">
                <span className={`h-1.5 w-1.5 rounded-full ${driveConnected ? 'bg-ok' : 'bg-warn'}`} />
                {driveConnected ? 'Drive live' : 'Snapshot'}
              </span>
              <ChevronRight size={14} className="text-faint" />
            </a>
          </div>
        </Section>

        <p className="mt-10 text-center text-[10.5px] text-faint">
          Web App Created By — Ayush Jha, 2CSE-4
        </p>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <p className="eyebrow mb-2.5">{title}</p>
      {children}
    </section>
  );
}

function Row({
  icon,
  title,
  meta,
  trailing,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3">
      <span className="mt-0.5 text-faint">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-fg">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-faint">{meta}</p>
      </div>
      {trailing}
    </div>
  );
}
