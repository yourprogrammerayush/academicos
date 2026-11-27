'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Bookmark,
  Download,
  Headphones,
  Timer,
  ArrowLeft,
  ListMusic,
  Gauge,
  Repeat,
  X,
  ChevronDown,
  Mic2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { downloadFile } from '@/components/file-card';
import { useFavorites } from '@/lib/store';

const SLEEP_CHOICES = [5, 10, 15, 30, 45] as const;

/**
 * Podcast / audiobook player.
 * Layout follows the current audiobook apps — a large cover, a scrubbable
 * progress rail, and a queue. On narrow screens you can also scroll vertically
 * to move between tracks, matching the video feed.
 */
export default function AudioPage() {
  const { catalog } = useApp();
  const { isFav, toggle } = useFavorites();
  const tracks = useMemo(() => catalog.files.filter((f) => f.kind === 'audio'), [catalog.files]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [sleepMin, setSleepMin] = useState<number | null>(null);
  const [sleepLeft, setSleepLeft] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const current = tracks[index];

  useEffect(() => {
    if (index > tracks.length - 1) setIndex(0);
  }, [tracks.length, index]);

  /* Playback rate */
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed, index]);

  /* Sleep timer — counts down so the UI can show remaining time */
  useEffect(() => {
    if (!sleepMin) {
      setSleepLeft(0);
      return;
    }
    const total = sleepMin * 60;
    setSleepLeft(total);
    const started = Date.now();
    const tick = window.setInterval(() => {
      const left = total - Math.floor((Date.now() - started) / 1000);
      if (left <= 0) {
        audioRef.current?.pause();
        setPlaying(false);
        setSleepMin(null);
        setSleepLeft(0);
        window.clearInterval(tick);
      } else {
        setSleepLeft(left);
      }
    }, 1000);
    return () => window.clearInterval(tick);
  }, [sleepMin]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.currentTime + seconds, el.duration || Infinity));
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(i, 0), tracks.length - 1);
      setIndex(next);
      setCurrentTime(0);
      setDuration(0);
      setPlaying(true);
    },
    [tracks.length]
  );

  /* Archive-style scrolling between tracks */
  const scrollerRef = useRef<HTMLDivElement>(null);
  const goToScroll = useCallback((i: number) => {
    scrollerRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx) && idx !== index) {
              setIndex(idx);
              setCurrentTime(0);
              setDuration(0);
            }
          }
        }
      },
      { root, threshold: 0.6 }
    );
    root.querySelectorAll('[data-index]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tracks.length, index]);

  useEffect(() => {
    if (!playing) return;
    const el = audioRef.current;
    if (el?.paused) void el.play().catch(() => setPlaying(false));
  }, [index, playing]);

  const pct = duration ? (currentTime / duration) * 100 : 0;

  if (tracks.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mist">
          <Headphones size={24} className="text-faint" strokeWidth={1.8} />
        </span>
        <p className="text-[17px] font-bold text-fg">No audio yet</p>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
          Add audio files to your Drive folder and they show up here as a listening queue.
        </p>
        <Link href="/library" className="btn btn-outline btn-sm mt-5">
          Browse library
        </Link>
      </div>
    );
  }

  return (
    <div className="relative bg-sunken">
      {current && (
        <audio
          ref={audioRef}
          key={current.id}
          src={`/api/drive?id=${encodeURIComponent(current.id)}`}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => {
            if (repeat) {
              const el = audioRef.current;
              if (el) {
                el.currentTime = 0;
                void el.play();
              }
            } else if (index < tracks.length - 1) {
              goTo(index + 1);
            } else {
              setPlaying(false);
            }
          }}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="safe-t">
          <div className="mx-auto flex h-[52px] max-w-2xl items-center gap-2 px-3">
            <Link href="/library" aria-label="Back" className="btn-icon -ml-1">
              <ArrowLeft size={19} strokeWidth={2.1} />
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate text-[12.5px] font-bold text-fg">
                {playing ? 'Now playing' : 'Podcasts'}
              </p>
              <p className="text-[10px] text-faint">
                {tracks.length} track{tracks.length === 1 ? '' : 's'} ·{' '}
                {index + 1} of {tracks.length}
              </p>
            </div>
            <button onClick={() => setQueueOpen(true)} aria-label="Queue" className="btn-icon -mr-1">
              <ListMusic size={19} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </header>

      <div ref={scrollerRef} className="no-scrollbar h-[calc(100svh-52px)] overflow-y-scroll">
        {tracks.map((t, i) => {
          const isCurrent = i === index;
          return (
            <section
              key={t.id}
              data-index={i}
              className="flex min-h-[calc(100svh-52px)] snap-item flex-col px-5 pb-6 pt-4"
            >
              <div className="mx-auto w-full max-w-[420px]">
                {/* Cover */}
                <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-[26px] shadow-pop">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(150deg,#121A2A 0%,#233047 46%,#4A5C78 100%)',
                    }}
                  />
                  {/* Subtle orbital motif echoing the brand mark */}
                  <svg
                    viewBox="0 0 200 200"
                    className="absolute inset-0 h-full w-full opacity-[0.22]"
                    aria-hidden="true"
                  >
                    <circle cx="100" cy="100" r="76" fill="none" stroke="#FCA800" strokeWidth="1.2" />
                    <circle cx="100" cy="100" r="56" fill="none" stroke="#FC6000" strokeWidth="0.9" />
                    <circle cx="100" cy="100" r="36" fill="none" stroke="#FC3A2C" strokeWidth="0.7" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <Mic2 size={30} className="mb-3 text-amber-400" strokeWidth={1.6} />
                    <p className="line-clamp-3 text-[15px] font-bold leading-snug tracking-[-0.02em] text-white">
                      {t.name.replace(/\.[a-z0-9]+$/i, '')}
                    </p>
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/45">
                      {[t.subject, t.semester].filter(Boolean).join(' · ') || t.type}
                    </p>
                  </div>
                  {isCurrent && playing && (
                    <div className="absolute right-3 top-3 flex items-end gap-[3px]" aria-hidden="true">
                      {[0, 1, 2, 3].map((b) => (
                        <span
                          key={b}
                          className="w-[3px] rounded-full bg-amber-400"
                          style={{
                            height: 8 + b * 3,
                            animation: `fade-in 0.6s ${b * 0.12}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="mt-6 text-center">
                  <h1 className="line-clamp-2 text-[19px] font-bold leading-snug tracking-[-0.025em] text-fg text-balance">
                    {t.name.replace(/\.[a-z0-9]+$/i, '')}
                  </h1>
                  <p className="mt-1.5 text-[12.5px] text-faint">
                    {[t.subject, t.semester, t.type].filter(Boolean).join(' · ')}
                  </p>
                </div>

                {/* Progress */}
                <div className="mt-6">
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    disabled={!isCurrent}
                    onChange={(e) => {
                      const el = audioRef.current;
                      if (el) {
                        el.currentTime = Number(e.target.value);
                        setCurrentTime(Number(e.target.value));
                      }
                    }}
                    aria-label="Seek"
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line-strong accent-accent disabled:opacity-40"
                    style={{
                      background: `linear-gradient(to right, var(--accent) ${pct}%, var(--line-strong) ${pct}%)`,
                    }}
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-faint">
                    <span>{fmt(currentTime)}</span>
                    <span>{duration ? fmt(duration) : '—:—'}</span>
                  </div>
                </div>

                {/* Transport */}
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    onClick={() => skip(-15)}
                    aria-label="Back 15 seconds"
                    className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-fg"
                  >
                    <SkipBack size={20} strokeWidth={1.9} />
                    <span className="absolute bottom-0.5 text-[7.5px] font-bold">15</span>
                  </button>

                  <button
                    onClick={togglePlay}
                    aria-label={playing ? 'Pause' : 'Play'}
                    className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-fg text-canvas shadow-lift transition-transform active:scale-95"
                  >
                    {playing ? (
                      <Pause size={24} fill="currentColor" />
                    ) : (
                      <Play size={24} fill="currentColor" className="ml-1" />
                    )}
                  </button>

                  <button
                    onClick={() => skip(15)}
                    aria-label="Forward 15 seconds"
                    className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-fg"
                  >
                    <SkipForward size={20} strokeWidth={1.9} />
                    <span className="absolute bottom-0.5 text-[7.5px] font-bold">15</span>
                  </button>
                </div>

                {/* Secondary controls */}
                <div className="mt-5 flex items-center justify-center gap-1.5">
                  <PillButton
                    active={speed !== 1}
                    onClick={() => setSpeedOpen((s) => !s)}
                    label={`${speed}× speed`}
                  >
                    <Gauge size={13} /> {speed}×
                  </PillButton>
                  <PillButton
                    active={Boolean(sleepMin)}
                    onClick={() => setSleepMin(sleepMin ? null : 15)}
                    label={sleepMin ? `Sleep in ${fmtLeft(sleepLeft)}` : 'Sleep timer'}
                  >
                    <Timer size={13} /> {sleepMin ? fmtLeft(sleepLeft) : 'Sleep'}
                  </PillButton>
                  <PillButton
                    active={repeat}
                    onClick={() => setRepeat((r) => !r)}
                    label="Repeat"
                  >
                    <Repeat size={13} />
                  </PillButton>
                  <PillButton
                    active={isFav(t.id)}
                    onClick={() => toggle(t.id)}
                    label="Save"
                  >
                    <Bookmark size={13} fill={isFav(t.id) ? 'currentColor' : 'none'} />
                  </PillButton>
                </div>

                {speedOpen && (
                  <div className="mx-auto mt-3 flex max-w-[300px] justify-center gap-1 rounded-xl bg-elev p-1 shadow-card animate-fade-up">
                    {[0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSpeed(s);
                          setSpeedOpen(false);
                        }}
                        className={`flex-1 rounded-lg py-1.5 text-[11.5px] font-semibold transition-colors ${
                          speed === s ? 'bg-fg text-canvas' : 'text-muted hover:bg-hover'
                        }`}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                )}

                {sleepMin !== null && (
                  <div className="mx-auto mt-3 flex max-w-[300px] justify-center gap-1 rounded-xl bg-elev p-1 shadow-card animate-fade-up">
                    {SLEEP_CHOICES.map((m) => (
                      <button
                        key={m}
                        onClick={() => setSleepMin(m)}
                        className={`flex-1 rounded-lg py-1.5 text-[11.5px] font-semibold transition-colors ${
                          sleepMin === m ? 'bg-fg text-canvas' : 'text-muted hover:bg-hover'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                )}

                {/* Download + hint */}
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() => downloadFile(t)}
                    className="btn btn-ghost btn-sm text-[11.5px]"
                  >
                    <Download size={13} /> Save offline
                  </button>
                  {i < tracks.length - 1 && (
                    <button
                      onClick={() => goToScroll(i + 1)}
                      className="btn btn-ghost btn-sm text-[11.5px]"
                    >
                      Next track <ChevronDown size={13} />
                    </button>
                  )}
                </div>

                {i < tracks.length - 1 && (
                  <p className="mt-4 text-center text-[10.5px] text-faint">Scroll to keep listening</p>
                )}

                {/* Up next */}
                {tracks.length > 1 && (
                  <div className="mt-7">
                    <p className="eyebrow mb-2">Up next</p>
                    <div className="divide-y divide-line overflow-hidden rounded-2xl bg-elev shadow-card">
                      {tracks
                        .slice(i + 1)
                        .concat(tracks.slice(0, i))
                        .slice(0, 3)
                        .map((t) => {
                          const realIdx = tracks.findIndex((x) => x.id === t.id);
                          return (
                            <button
                              key={t.id}
                              onClick={() => {
                                goTo(realIdx);
                                goToScroll(realIdx);
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-hover"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mist text-faint">
                                <Play size={11} fill="currentColor" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12px] font-semibold text-fg">
                                  {t.name.replace(/\.[a-z0-9]+$/i, '')}
                                </span>
                                <span className="block truncate text-[10.5px] text-faint">
                                  {[t.subject, t.semester].filter(Boolean).join(' · ') || t.type}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Queue sheet */}
      {queueOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            className="absolute inset-0 animate-fade-in bg-navy-950/40 backdrop-blur-sm"
            onClick={() => setQueueOpen(false)}
            aria-label="Close queue"
          />
          <div className="absolute inset-x-0 bottom-0 animate-sheet-up sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:w-[380px]">
            <div className="flex h-full max-h-[80vh] flex-col overflow-hidden rounded-t-3xl bg-elev shadow-pop sm:max-h-full sm:rounded-none">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <p className="text-[14px] font-bold text-fg">Listening queue</p>
                  <p className="text-[11.5px] text-faint">{tracks.length} tracks</p>
                </div>
                <button onClick={() => setQueueOpen(false)} className="btn-icon" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 safe-b">
                {tracks.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      goTo(i);
                      setQueueOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                      i === index ? 'bg-hover' : 'hover:bg-hover'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        i === index ? 'bg-navy-950 text-amber-400' : 'bg-mist text-faint'
                      }`}
                    >
                      {i === index && playing ? (
                        <Pause size={14} fill="currentColor" />
                      ) : (
                        <Play size={14} fill="currentColor" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`line-clamp-2 text-[12.5px] leading-snug ${
                          i === index ? 'font-semibold text-fg' : 'text-muted'
                        }`}
                      >
                        {t.name.replace(/\.[a-z0-9]+$/i, '')}
                      </span>
                      <span className="mt-0.5 block truncate text-[10.5px] text-faint">
                        {[t.subject, t.semester].filter(Boolean).join(' · ') || t.type}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-line px-4 py-3">
                <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-faint">
                  <Sparkles size={11} className="mt-0.5 shrink-0 text-accent" />
                  The mini-player keeps playing while you browse notes or ask Study AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PillButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-semibold transition-colors ${
        active ? 'bg-accent-soft text-accent ring-1 ring-inset ring-accent/25' : 'bg-elev text-muted shadow-hair hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}

function fmt(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtLeft(seconds: number) {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
