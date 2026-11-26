'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Bookmark,
  Download,
  Headphones,
  Timer,
  ArrowLeft,
  ListMusic,
  Mic2,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { MobileTopBar } from '@/components/mobile-nav';
import { downloadFile } from '@/components/file-card';
import { useFavorites } from '@/lib/store';

export default function AudioPage() {
  const { catalog } = useApp();
  const { isFav, toggle } = useFavorites();
  const tracks = useMemo(() => catalog.files.filter((f) => f.kind === 'audio'), [catalog.files]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [sleepMin, setSleepMin] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const current = tracks[index];

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed, index]);

  useEffect(() => {
    if (!sleepMin) return;
    const t = setTimeout(() => {
      audioRef.current?.pause();
      setPlaying(false);
      setSleepMin(null);
    }, sleepMin * 60 * 1000);
    return () => clearTimeout(t);
  }, [sleepMin]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else {
      el.pause();
      setPlaying(false);
    }
  };

  const jump = (delta: number) => {
    const el = audioRef.current;
    if (el) el.currentTime = Math.min(Math.max(el.currentTime + delta, 0), el.duration || 0);
  };

  const selectTrack = (i: number) => {
    setIndex(i);
    setPlaying(false);
    setProgress(0);
    setTimeout(() => {
      const el = audioRef.current;
      if (el) void el.play().then(() => setPlaying(true)).catch(() => {});
    }, 120);
  };

  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <MobileTopBar title="Podcasts" />
      <div className="mx-auto max-w-[1100px] px-4 pb-10 pt-5 sm:px-6 md:pt-7 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-eyebrow">Audio guides</p>
            <h1 className="mt-1.5 font-serif text-[25px] font-bold tracking-[-0.02em] sm:text-[29px]">Listen while you study.</h1>
            <p className="mt-1 text-[12.5px] text-[var(--fg-muted)]">
              {tracks.length} audio guide{tracks.length === 1 ? '' : 's'} from your folder. The mini-player follows you everywhere.
            </p>
          </div>
          {sleepMin && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-sub)] px-2.5 py-1 text-[11px] text-[var(--fg-muted)]">
              <Timer size={12} /> Sleep in {sleepMin}m
              <button onClick={() => setSleepMin(null)} className="text-[var(--fg-subtle)] hover:text-[var(--fg)]">✕</button>
            </span>
          )}
        </div>

        {!current ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] px-6 py-20 text-center">
            <Headphones size={22} className="mx-auto mb-3 text-[var(--fg-subtle)]" />
            <p className="font-serif text-[18px] font-bold">No audio indexed yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-[var(--fg-muted)]">
              Add audio files to AUDIO GUIDES in your Drive folder. Once Drive is connected they appear here automatically.
            </p>
            <Link href="/library" className="btn btn-ghost mt-4 text-[12px]">Browse library</Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            {/* Now playing */}
            <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-elev)]">
              <div className="relative flex flex-col items-center px-6 pb-6 pt-8">
                <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--brand)_7%,transparent),transparent_65%)]" />
                <div className="relative mb-5 flex h-[132px] w-[132px] items-center justify-center rounded-2xl bg-[#0F1B2D] ring-1 ring-white/10">
                  <div className="flex items-end gap-[3px]">
                    {[18, 30, 44, 26, 38, 52, 22, 34, 46, 20, 30, 40].map((h, i) => (
                      <span
                        key={i}
                        className={`w-[3px] rounded-full bg-white/70 ${playing ? '' : 'opacity-50'}`}
                        style={{
                          height: h,
                          animation: playing ? `wave 1.1s ${i * 0.07}s ease-in-out infinite alternate` : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p className="relative label-eyebrow mb-1.5">Now playing</p>
                <h2 className="relative line-clamp-2 max-w-[420px] text-center font-serif text-[19px] font-bold leading-snug tracking-[-0.01em]">
                  {current.name}
                </h2>
                <p className="relative mt-1.5 text-center text-[12px] text-[var(--fg-subtle)]">
                  {[current.subject, current.semester].filter(Boolean).join(' · ') || current.path.join(' / ')}
                </p>

                {/* Waveform scrubber */}
                <div className="relative mt-6 w-full max-w-[440px]">
                  <div className="flex h-12 items-center gap-[2px]">
                    {Array.from({ length: 64 }).map((_, i) => {
                      const fill = (i / 64) * 100 <= progress;
                      const h = 12 + ((i * 37) % 30);
                      return (
                        <span
                          key={i}
                          className="flex-1 rounded-full transition-colors"
                          style={{
                            height: h,
                            background: fill ? 'var(--brand)' : 'var(--line-strong)',
                          }}
                        />
                      );
                    })}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={progress}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setProgress(v);
                      if (audioRef.current) audioRef.current.currentTime = v;
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Seek"
                  />
                  <div className="mt-1.5 flex justify-between text-[10.5px] tabular-nums text-[var(--fg-subtle)]">
                    <span>{fmt(progress)}</span>
                    <span>{fmt(duration)}</span>
                  </div>
                </div>

                <div className="relative mt-3 flex items-center gap-4">
                  <button onClick={() => jump(-15)} aria-label="Rewind 15s" className="rounded-full p-2 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]">
                    <SkipBack size={18} />
                  </button>
                  <button
                    onClick={togglePlay}
                    aria-label={playing ? 'Pause' : 'Play'}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fg)] text-[var(--bg)] shadow-[var(--shadow-pop)] transition-transform hover:scale-[1.04]"
                  >
                    {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                  </button>
                  <button onClick={() => jump(15)} aria-label="Forward 15s" className="rounded-full p-2 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]">
                    <SkipForward size={18} />
                  </button>
                </div>

                <div className="relative mt-5 flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    onClick={() => setSpeed((s) => (s >= 2 ? 0.75 : s === 0.75 ? 1 : s + 0.25))}
                    className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] font-semibold tabular-nums text-[var(--fg-muted)] hover:bg-[var(--bg-hover)]"
                  >
                    {speed}× speed
                  </button>
                  <button onClick={() => setMuted((m) => !m)} className="rounded-md border border-[var(--line)] p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)]" aria-label="Mute">
                    {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                  <div className="flex items-center gap-1 rounded-md border border-[var(--line)] px-1 py-0.5">
                    <Timer size={12} className="ml-0.5 text-[var(--fg-subtle)]" />
                    {[10, 20, 30].map((m) => (
                      <button
                        key={m}
                        onClick={() => setSleepMin(sleepMin === m ? null : m)}
                        className={`rounded px-1.5 py-1 text-[10.5px] font-medium ${sleepMin === m ? 'bg-[var(--fg)] text-[var(--bg)]' : 'text-[var(--fg-muted)] hover:bg-[var(--bg-hover)]'}`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                  <button onClick={() => toggle(current.id)} className="rounded-md border border-[var(--line)] p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)]" aria-label="Save">
                    <Bookmark size={13} fill={isFav(current.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => downloadFile(current)} className="rounded-md border border-[var(--line)] p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)]" aria-label="Download">
                    <Download size={13} />
                  </button>
                </div>

                <audio
                  ref={audioRef}
                  src={`/api/drive?id=${encodeURIComponent(current.id)}`}
                  onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onEnded={() => {
                    setPlaying(false);
                    if (index < tracks.length - 1) selectTrack(index + 1);
                  }}
                  muted={muted}
                  preload="metadata"
                />
              </div>
            </section>

            {/* Queue */}
            <aside className="rounded-xl border border-[var(--line)] bg-[var(--bg-elev)]">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-3.5 py-2.5">
                <p className="label-eyebrow flex items-center gap-1.5"><ListMusic size={12} /> Queue</p>
                <span className="text-[10.5px] text-[var(--fg-subtle)]">{tracks.length}</span>
              </div>
              <div className="max-h-[440px] overflow-y-auto p-1.5">
                {tracks.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => selectTrack(i)}
                    className={`flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors ${
                      i === index ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-sub)]'
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${i === index ? 'bg-[var(--fg)] text-[var(--bg)]' : 'bg-[var(--bg-sub)] text-[var(--fg-muted)]'}`}>
                      {i === index && playing ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12px] ${i === index ? 'font-medium' : ''}`}>{t.name}</span>
                      <span className="block truncate text-[10.5px] text-[var(--fg-subtle)]">{[t.subject, t.semester].filter(Boolean).join(' · ')}</span>
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg-sub)] p-3.5">
          <Mic2 size={15} className="mt-0.5 shrink-0 text-[var(--fg-subtle)]" />
          <p className="text-[11.5px] leading-relaxed text-[var(--fg-muted)]">
            <span className="font-medium text-[var(--fg)]">Tip:</span> the mini-player stays docked while you read notes or chat with Study AI, so revision never stops. Sleep timer, 0.75×–2× speed and ±15s jumps are available everywhere.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes wave {
          from { transform: scaleY(0.55); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </>
  );
}
