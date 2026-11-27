'use client';

import { useApp } from './app-provider';
import { Loader2, Check, RefreshCw, CloudOff, Sparkle } from 'lucide-react';
import { useState } from 'react';

/**
 * Live Drive status + manual "check for new files" action.
 * When Drive is connected it polls nothing — it just reports the last sync and
 * lets the user pull immediately.
 */
export function SyncPill({ compact = false }: { compact?: boolean }) {
  const { sync, driveConnected, refreshCatalog } = useApp();
  const [pressed, setPressed] = useState(false);

  const onClick = async () => {
    setPressed(true);
    await refreshCatalog({ force: true });
    window.setTimeout(() => setPressed(false), 900);
  };

  const busy = sync.syncing || pressed;

  if (!driveConnected) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-2xs font-semibold text-faint"
        title="Drive API key not configured — showing the indexed snapshot"
      >
        <CloudOff size={11} strokeWidth={2.2} />
        {compact ? 'Snapshot' : 'Snapshot catalog'}
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={sync.syncedAt ? `Last synced ${new Date(sync.syncedAt).toLocaleTimeString()}` : 'Sync now'}
      className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-2xs font-semibold text-ok ring-1 ring-inset ring-ok/20 transition-opacity hover:opacity-80 disabled:opacity-60"
    >
      {busy ? (
        <Loader2 size={11} strokeWidth={2.4} className="animate-spin" />
      ) : pressed ? (
        <Check size={11} strokeWidth={2.6} />
      ) : (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ok" />
        </span>
      )}
      {busy ? 'Syncing' : compact ? 'Live' : 'Drive live'}
    </button>
  );
}

/** Floating toast for "N new files added". */
export function SyncToast() {
  const { sync } = useApp();
  if (!sync.notice) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-4 sm:top-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-navy-950 px-4 py-2 text-[12.5px] font-semibold text-white shadow-pop animate-fade-up">
        <Sparkle size={13} className="text-amber-300" />
        {sync.notice}
      </div>
    </div>
  );
}
