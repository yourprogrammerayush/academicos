'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useApp } from './app-provider';

export function InstallBanner() {
  const { canInstall, installPrompt } = useApp();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem('academicos:install-dismissed') === '1');
  }, []);

  if (!canInstall || dismissed || !installPrompt) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] z-30 mx-auto max-w-md rounded-2xl bg-elev p-3 shadow-pop md:inset-x-auto md:bottom-4 md:right-4 md:mx-0">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark-96.png" alt="" className="h-10 w-10 rounded-xl bg-navy-950 p-1" />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-bold text-fg">Install AcademicOS</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
            Full-screen, instant launch, works on a slow connection.
          </p>
          <div className="mt-2 flex gap-2">
            <button onClick={installPrompt} className="btn btn-primary px-2.5 py-1 text-[11.5px]">
              <Download size={12} /> Install
            </button>
            <button
              onClick={() => {
                setDismissed(true);
                localStorage.setItem('academicos:install-dismissed', '1');
              }}
              className="btn btn-ghost px-2 py-1 text-[11.5px]"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => {
            setDismissed(true);
            localStorage.setItem('academicos:install-dismissed', '1');
          }}
          className="rounded p-1 text-faint hover:text-fg"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
