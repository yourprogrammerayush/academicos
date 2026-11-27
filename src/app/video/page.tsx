'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bookmark,
  Film,
  Gauge,
  RotateCcw,
  ArrowLeft,
  ListVideo,
  Captions,
  X,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { useFavorites } from '@/lib/store';

/**
 * Reels-style lecture feed.
 * One video per viewport, driven by native CSS scroll-snap so the gesture feels
 * identical to Instagram/YouTube Shorts — momentum and snapping come from the
 * platform, not from JS. IntersectionObserver decides which video owns playback.
 */
export default function VideoPage() {
  const { catalog } = useApp();
  const { isFav, toggle } = useFavorites();
  const videos = useMemo(
    () => catalog.files.filter((f) => f.kind === 'video'),
    [catalog.files]
  );

  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [theatre, setTheatre] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef(new Map<number, HTMLVideoElement>());

  /* Snap-driven active index */
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || videos.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { root, threshold: 0.6 }
    );

    root.querySelectorAll('[data-index]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [videos.length]);

  /* Only the active video plays and makes sound */
  useEffect(() => {
    videoRefs.current.forEach((el, i) => {
      el.muted = i !== active ? true : muted;
      if (i === active) {
        el.playbackRate = speed;
        if (!paused) void el.play().catch(() => setPaused(true));
        else el.pause();
      } else {
        el.pause();
        try {
          el.currentTime = 0;
        } catch {
          /* not seekable yet */
        }
      }
    });
  }, [active, muted, speed, paused]);

  const goTo = useCallback(
    (i: number) => {
      const root = scrollerRef.current;
      if (!root) return;
      const child = root.children[i] as HTMLElement | undefined;
      child?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    []
  );

  /* Keyboard: j/k or arrows move through the feed, space toggles play */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goTo(Math.min(active + 1, videos.length - 1));
      }
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goTo(Math.max(active - 1, 0));
      }
      if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
      }
      if (e.key === 'm') setMuted((m) => !m);
      if (e.key === 'ArrowRight') setActive((a) => {
        const next = Math.min(a + 1, videos.length - 1);
        goTo(next);
        return next;
      });
      if (e.key === 'ArrowLeft') setActive((a) => {
        const next = Math.max(a - 1, 0);
        goTo(next);
        return next;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, videos.length, goTo]);

  if (videos.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mist">
          <Film size={24} className="text-faint" strokeWidth={1.8} />
        </span>
        <p className="text-[17px] font-bold text-fg">No lectures yet</p>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
          Drop video files into your Drive folder and they land here automatically — no
          uploading, no re-indexing.
        </p>
        <Link href="/library" className="btn btn-outline btn-sm mt-5">
          Browse library
        </Link>
      </div>
    );
  }

  const current = videos[active];

  return (
    <div className="relative bg-navy-950">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-3 pt-3 safe-t">
        <Link
          href="/library"
          aria-label="Back to library"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          <ArrowLeft size={17} strokeWidth={2.2} />
        </Link>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <span className="tnum rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
            {active + 1} / {videos.length}
          </span>
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={() => setTheatre((t) => !t)}
            aria-label={theatre ? 'Reel mode' : 'Theatre mode'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            {theatre ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            onClick={() => setPlaylistOpen((p) => !p)}
            aria-label="Playlist"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <ListVideo size={16} />
          </button>
        </div>
      </header>

      {/* ── Feed ────────────────────────────────────────────────── */}
      <div
        ref={scrollerRef}
        className="no-scrollbar h-[100svh] snap-y-mandatory overflow-y-scroll overscroll-contain"
      >
        {videos.map((v, i) => (
          <section
            key={v.id}
            data-index={i}
            className="snap-item relative flex h-[100svh] w-full items-center justify-center"
          >
            <div
              className={`relative h-full w-full ${theatre ? '' : 'mx-auto max-w-[min(100vw,560px)]'}`}
            >
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(i, el);
                  else videoRefs.current.delete(i);
                }}
                src={`/api/drive?id=${encodeURIComponent(v.id)}`}
                className="h-full w-full object-contain"
                playsInline
                muted
                loop
                preload={Math.abs(i - active) <= 1 ? 'auto' : 'none'}
                onClick={() => (i === active ? setPaused((p) => !p) : goTo(i))}
              />

              {/* Legibility scrim */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

              {/* Centre play/pause affordance */}
              {i === active && paused && (
                <button
                  onClick={() => setPaused(false)}
                  aria-label="Play"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="flex h-16 w-16 animate-fade-in items-center justify-center rounded-full bg-white/95 shadow-2xl">
                    <Play size={26} fill="#0B1220" className="ml-1 text-navy-950" />
                  </span>
                </button>
              )}

              {/* Caption block */}
              <div className="absolute inset-x-0 bottom-0 px-4 pb-6">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-navy-950">
                    Lecture
                  </span>
                  {v.subject && (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10.5px] font-semibold text-white/90 backdrop-blur">
                      {v.subject}
                    </span>
                  )}
                  {v.semester && (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10.5px] font-semibold text-white/90 backdrop-blur">
                      {v.semester}
                    </span>
                  )}
                </div>

                <h2 className="line-clamp-2 text-[16px] font-bold leading-snug tracking-[-0.02em] text-white text-balance">
                  {v.name.replace(/\.[a-z0-9]+$/i, '')}
                </h2>
                <p className="mt-1 text-[11.5px] text-white/60">
                  {v.path.join(' / ') || v.type}
                </p>

                {/* Controls */}
                <div className="mt-3 flex items-center gap-1.5">
                  <FeedBtn
                    label={paused ? 'Play' : 'Pause'}
                    onClick={() => setPaused((p) => !p)}
                    solid
                  >
                    {paused ? (
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    ) : (
                      <Pause size={16} fill="currentColor" />
                    )}
                  </FeedBtn>
                  <FeedBtn
                    label="Replay"
                    onClick={() => {
                      const el = videoRefs.current.get(i);
                      if (el) el.currentTime = 0;
                    }}
                  >
                    <RotateCcw size={15} />
                  </FeedBtn>
                  <button
                    onClick={() => setSpeed((s) => (s >= 2 ? 0.75 : Number((s + 0.25).toFixed(2))))}
                    className="flex h-9 items-center gap-1 rounded-full bg-white/12 px-3 text-[11px] font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
                  >
                    <Gauge size={13} /> {speed}×
                  </button>

                  <div className="ml-auto flex items-center gap-1.5">
                    <FeedBtn
                      label={isFav(v.id) ? 'Remove bookmark' : 'Save'}
                      onClick={() => toggle(v.id)}
                    >
                      <Bookmark
                        size={16}
                        fill={isFav(v.id) ? 'currentColor' : 'none'}
                        className={isFav(v.id) ? 'text-amber-400' : ''}
                      />
                    </FeedBtn>
                    <FeedBtn label="Captions" onClick={() => {}}>
                      <Captions size={16} />
                    </FeedBtn>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── Scroll hint on first load ───────────────────────────── */}
      {active === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center">
          <span className="animate-fade-in rounded-full bg-white/10 px-3 py-1.5 text-[10.5px] font-medium text-white/70 backdrop-blur">
            Scroll for the next lecture
          </span>
        </div>
      )}

      {/* ── Playlist sheet ──────────────────────────────────────── */}
      {playlistOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
            onClick={() => setPlaylistOpen(false)}
            aria-label="Close playlist"
          />
          <div className="absolute inset-x-0 bottom-0 animate-sheet-up">
            <div className="mx-auto max-w-lg overflow-hidden rounded-t-3xl bg-elev shadow-pop">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[14px] font-bold text-fg">Up next</p>
                  <p className="text-[11.5px] text-faint">{videos.length} lectures in this feed</p>
                </div>
                <button
                  onClick={() => setPlaylistOpen(false)}
                  className="btn-icon"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-[56vh] overflow-y-auto px-2 pb-3">
                {videos.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      goTo(i);
                      setPlaylistOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                      i === active ? 'bg-hover' : 'hover:bg-hover'
                    }`}
                  >
                    <span
                      className={`flex h-11 w-16 shrink-0 items-center justify-center rounded-lg ${
                        i === active ? 'bg-navy-950 text-amber-400' : 'bg-mist text-faint'
                      }`}
                    >
                      <Play size={14} fill="currentColor" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`line-clamp-2 text-[12.5px] leading-snug ${
                          i === active ? 'font-semibold text-fg' : 'text-muted'
                        }`}
                      >
                        {v.name.replace(/\.[a-z0-9]+$/i, '')}
                      </span>
                      <span className="mt-0.5 block truncate text-[10.5px] text-faint">
                        {[v.subject, v.semester].filter(Boolean).join(' · ') || v.path.join(' / ')}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <span className="sr-only">Now playing {current?.name}</span>
    </div>
  );
}

function FeedBtn({
  children,
  onClick,
  label,
  solid,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  solid?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`flex h-9 items-center justify-center rounded-full backdrop-blur transition-colors ${
        solid
          ? 'w-10 bg-white text-navy-950 hover:bg-white/90'
          : 'w-9 bg-white/12 text-white hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  );
}
