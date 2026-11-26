'use client';

import Link from 'next/link';
import { useState } from 'react';
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

  const clearLocal = () => {
    if (!confirm('Clear favorites, collections, recents and search history on this device?')) return;
    ['favorites', 'collections', 'recents', 'downloads', 'searchHistory', 'progress'].forEach((k) =>
      localStorage.removeItem(`academicos:${k}`)
    );
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const collections = ((): Collection[] => {
    try {
      return JSON.parse(localStorage.getItem('academicos:collections') || '[]') as Collection[];
    } catch {
      return [];
    }
  })();

  return (
    <>
      <MobileTopBar title="Settings" />
      <div className="mx-auto max-w-[760px] px-4 pb-10 pt-5 sm:px-6 md:pt-7 lg:px-8">
        <p className="label-eyebrow">Settings</p>
        <h1 className="mt-1.5 font-serif text-[25px] font-bold tracking-[-0.02em] sm:text-[29px]">Preferences.</h1>
        <p className="mt-1.5 text-[13px] text-[var(--fg-muted)]">Everything here is stored on your device.</p>

        <Section title="Appearance">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light' as const, label: 'Light', icon: Sun },
              { id: 'dark' as const, label: 'Dark', icon: Moon },
              { id: 'system' as const, label: 'System', icon: Laptop },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-start gap-2 rounded-lg border p-3 transition-colors ${
                  theme === t.id ? 'border-[var(--fg)] bg-[var(--bg-sub)]' : 'border-[var(--line)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <t.icon size={16} className={theme === t.id ? 'text-[var(--brand)]' : 'text-[var(--fg-subtle)]'} />
                <span className="text-[12.5px] font-medium">{t.label}</span>
                <span className="text-[10px] text-[var(--fg-subtle)]">
                  {t.id === 'light' ? 'Airy, high contrast' : t.id === 'dark' ? 'Slate, not pitch black' : 'Follows your OS'}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Account">
          {signedIn ? (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--fg)] text-[13px] font-semibold text-[var(--bg)]">
                {userName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{userName}</p>
                <p className="text-[11px] text-[var(--fg-subtle)]">Signed in · profile sync enabled</p>
              </div>
              <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] px-2 py-1 text-[11.5px] text-[var(--fg-muted)] hover:bg-[var(--bg-hover)]">
                <LogOut size={12} /> Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] p-3.5">
              <div>
                <p className="text-[13px] font-medium">Guest mode</p>
                <p className="mt-0.5 text-[11.5px] text-[var(--fg-muted)]">Everything works. Sign-in adds cross-device profile sync.</p>
              </div>
              <button onClick={() => setAuthOpen(true)} className="btn btn-primary text-[12px]">Sign in</button>
            </div>
          )}
        </Section>

        <Section title="Install app">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] p-3.5">
            <div className="flex items-start gap-2.5">
              <Smartphone size={15} className="mt-0.5 shrink-0 text-[var(--fg-subtle)]" />
              <div>
                <p className="text-[13px] font-medium">AcademicOS on your home screen</p>
                <p className="mt-0.5 max-w-[380px] text-[11.5px] leading-relaxed text-[var(--fg-muted)]">
                  One tap on Android/desktop. On iPhone: Share → Add to Home Screen. Runs full-screen with the app shell cached.
                </p>
              </div>
            </div>
            {canInstall && installPrompt ? (
              <button onClick={installPrompt} className="btn btn-primary text-[12px]"><Download size={13} /> Install</button>
            ) : (
              <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[10.5px] text-[var(--fg-subtle)]">
                {typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches ? 'Already installed' : 'Use browser menu → Install'}
              </span>
            )}
          </div>
        </Section>

        <Section title="Data & privacy">
          <div className="divide-y divide-[var(--line)] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-elev)]">
            <Row icon={<Database size={14} />} title="Your data stays local" meta="Favorites, collections & history live in this browser only." />
            <Row icon={<ShieldCheck size={14} />} title="No secrets in the client" meta="All AI and Drive calls are proxied server-side with env-var keys." />
            <Row
              icon={<Server size={14} />}
              title="Catalog source"
              meta={driveConnected ? `Live from Google Drive · ${catalog.files.length} files indexed` : `Demo catalog · ${catalog.files.length} sample files (Drive not connected)`}
            />
            <button onClick={clearLocal} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--bg-hover)]">
              <Trash2 size={14} className="text-[var(--warn)]" />
              <span className="flex-1">
                <span className="block text-[12.5px] font-medium">{cleared ? 'Cleared' : 'Clear local workspace data'}</span>
                <span className="block text-[11px] text-[var(--fg-subtle)]">{collections.length} collections · resets favorites and history</span>
              </span>
              {cleared && <Check size={14} className="text-[var(--ok)]" />}
            </button>
          </div>
        </Section>

        <Section title="More">
          <div className="divide-y divide-[var(--line)] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-elev)]">
            <Link href="/about" className="flex items-center gap-2.5 px-3.5 py-3 transition-colors hover:bg-[var(--bg-hover)]">
              <span className="flex-1 text-[12.5px]">About AcademicOS</span>
              <ChevronRight size={14} className="text-[var(--fg-subtle)]" />
            </Link>
            <a href="/api/health" className="flex items-center gap-2.5 px-3.5 py-3 transition-colors hover:bg-[var(--bg-hover)]">
              <span className="flex-1 text-[12.5px]">System status</span>
              <span className="inline-flex items-center gap-1.5 text-[10.5px] text-[var(--fg-subtle)]">
                <span className={`h-1.5 w-1.5 rounded-full ${driveConnected ? 'bg-[var(--ok)]' : 'bg-[var(--warn)]'}`} />
                {driveConnected ? 'Drive live' : 'Demo mode'}
              </span>
            </a>
          </div>
        </Section>

        <p className="mt-8 text-center text-[10.5px] text-[var(--fg-subtle)]">Web App Created By - Ayush Jha, 2CSE-4</p>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <p className="label-eyebrow mb-2">{title}</p>
      {children}
    </section>
  );
}

function Row({ icon, title, meta }: { icon: React.ReactNode; title: string; meta: string }) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-2.5">
      <span className="mt-0.5 text-[var(--fg-subtle)]">{icon}</span>
      <div>
        <p className="text-[12.5px] font-medium">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--fg-subtle)]">{meta}</p>
      </div>
    </div>
  );
}
