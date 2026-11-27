'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Pause, Play, X, SkipBack, SkipForward, Volume2, VolumeX, ArrowUpRight } from 'lucide-react';
import { useApp } from './app-provider';

export function MiniPlayer() {
  const { player, togglePlay, closePlayer, setPlaying } = useApp();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  const file = player.file;
  const src = file ? `/api/drive?id=${encodeURIComponent(file.id)}` : '';

  useEffect(() => {
    setProgress(0);
    setDuration(0);
  }, [file?.id]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (player.playing) void el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [player.playing, file?.id, setPlaying]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = speed;
  }, [speed, file?.id]);

  if (!file || file.kind !== 'audio') return null;

  const pct = duration ? (progress / duration) * 100 : 0;
  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-40 border-t border-line bg-elev/92 backdrop-blur-xl md:bottom-0">
      <div className="absolute inset-x-0 top-0 h-[2.5px] bg-line">
        <div
          className="h-full bg-accent transition-[width] duration-200 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
        muted={muted}
        preload="metadata"
      />
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-3 py-2.5 sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold text-fg">{file.name.replace(/\.(mp3|m4a|wav|ogg)$/i, '')}</p>
          <p className="truncate text-[10.5px] text-faint">
            {[file.subject, file.semester, 'Audio guide'].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <span className="w-9 text-right text-[10.5px] tabular-nums text-faint">{fmt(progress)}</span>
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
            className="h-1 w-40 cursor-pointer appearance-none rounded-full bg-line-strong accent-accent lg:w-64"
            aria-label="Seek"
          />
          <span className="w-9 text-[10.5px] tabular-nums text-faint">{fmt(duration)}</span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime = Math.max(0, progress - 15);
            }}
            aria-label="Rewind 15 seconds"
            className="hidden rounded-md p-1.5 text-muted hover:bg-hover hover:text-fg sm:block"
          >
            <SkipBack size={15} />
          </button>
          <button
            onClick={togglePlay}
            aria-label={player.playing ? 'Pause' : 'Play'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-fg text-canvas shadow-lift transition-transform active:scale-95"
          >
            {player.playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime = Math.min(duration, progress + 15);
            }}
            aria-label="Forward 15 seconds"
            className="hidden rounded-md p-1.5 text-muted hover:bg-hover hover:text-fg sm:block"
          >
            <SkipForward size={15} />
          </button>
        </div>

        <div className="hidden items-center gap-0.5 md:flex">
          <button
            onClick={() => setSpeed((s) => (s >= 2 ? 0.75 : s === 0.75 ? 1 : s + 0.25))}
            className="rounded-md px-1.5 py-1 text-[10.5px] font-semibold tabular-nums text-muted hover:bg-hover"
            aria-label="Playback speed"
          >
            {speed}x
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="rounded-md p-1.5 text-muted hover:bg-hover hover:text-fg"
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>

        <Link
          href={`/audio`}
          aria-label="Open podcast player"
          className="hidden rounded-md p-1.5 text-faint hover:bg-hover hover:text-fg sm:block"
        >
          <ArrowUpRight size={15} />
        </Link>
        <button
          onClick={closePlayer}
          aria-label="Close player"
          className="rounded-md p-1.5 text-faint hover:bg-hover hover:text-fg"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
