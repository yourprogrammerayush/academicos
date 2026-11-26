'use client';

import { usePathname } from 'next/navigation';
import { AppProvider, useApp } from './app-provider';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { CommandPalette } from './command-palette';
import { AuthModal } from './auth-modal';
import { MiniPlayer } from './mini-player';
import { Footer } from './footer';
import { InstallBanner } from './install-banner';

function ShellInner({ children }: { children: React.ReactNode }) {
  const { player } = useApp();
  const pathname = usePathname() || '/';
  const immersive = pathname.startsWith('/viewer/');
  const flush = immersive || pathname === '/ai';
  const hasPlayer = Boolean(player.file);

  if (immersive) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg)]">
        <div className="flex-1">{children}</div>
        <CommandPalette />
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className={
            flush
              ? 'flex-1'
              : `${hasPlayer ? 'pb-36' : 'pb-20'} flex-1 md:pb-8`
          }
        >
          {children}
        </div>
        {!flush && <Footer />}
        <MiniPlayer />
      </div>
      {!flush && <MobileNav />}
      <CommandPalette />
      <AuthModal />
      <InstallBanner />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ShellInner>{children}</ShellInner>
    </AppProvider>
  );
}
