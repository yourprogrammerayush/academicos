'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bookmark,
  Download,
  Film,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Gauge,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { MobileTopBar } from '@/components/mobile-nav';
import { downloadFile } from '@/components/file-card';
import { useFavorites } from '@/lib/store';

export default function VideoPage() {
  const { catalog, fileById } = useApp();
  const { isFav, toggle } = useFavorites();
  const videos = useMemo(() => catalog.files.filter((f) => f.kind === 'video'), [catalog.files]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [wide, setWide] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showChrome, setShowChrome] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = videos[index];

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed, index]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const go = (dir: 1 | -1) => {
    setIndex((i) => Math.min(Math.max(i + dir, 0), videos.length - 1));
    setPlaying(false);
    setProgress(0);
  };

  return (
    <>
      <MobileTopBar title="Video" />
      <div className="mx-auto max-w-[1400px] px-0 pb-6 pt-0 sm:px-6 md:pt-6 lg:px-8">
        <div className="mb-4 hidden items-end justify-between md:flex">
          <div>
            <p className="label-eyebrow">Lecture feed</p>
            <h1 className="mt-1.5 font-serif text-[25px] font-bold tracking-[-0.02em]">Watch without leaving.</h1>
            <p className="mt-1 text-[12.5px] text-[var(--fg-muted)]">
              {videos.length} videos from your folder, streaming in-app. Swipe or use the arrows.
            </p>
          </div>
          <button
            onClick={() => setWide((w) => !w)}
            className="btn btn-ghost text-[12px]"
            disabled={!current}
          >
            {wide ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            {wide ? 'Reels mode' : 'Lecture mode'}
          </button>
        </div>

        {!current ? (
          <div className="mx-4 rounded-xl border border-dashed border-[var(--line)] px-6 py-20 text-center sm:mx-0">
            <Film size={22} className="mx-auto mb-3 text-[var(--fg-subtle)]" />
            <p className="font-serif text-[18px] font-bold">No videos indexed yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-[var(--fg-muted)]">
              Add video files to your Drive folder (VIDEO GUIDES) and they will appear here automatically once Drive is connected.
            </p>
            <Link href="/library" className="btn btn-ghost mt-4 text-[12px]">
              Browse library
            </Link>
          </div>
        ) : (
          <div className={`flex gap-5 ${wide ? 'flex-col' : 'flex-col lg:flex-row'}`}>
            {/* Player */}
            <div className="min-w-0 flex-1">
              <div
                className={`relative mx-auto overflow-hidden bg-[#080D16] ${wide ? 'aspect-video max-h-[70vh] w-full rounded-none sm:rounded-xl' : 'aspect-[9/16] max-h-[78vh] w-full max-w-[420px] rounded-none sm:rounded-xl'}`}
                onClick={() => {
                  togglePlay();
                  setShowChrome(true);
                }}
              >
                <video
                  key={current.id}
                  ref={videoRef}
                  src={`/api/drive?id=${encodeURIComponent(current.id)}`}
                  className="h-full w-full object-contain"
                  playsInline
                  muted={muted}
                  preload="metadata"
                  onTimeUpdate={(e) => {
                    const el = e.currentTarget;
                    if (el.duration) setProgress((el.currentTime / el.duration) * 100);
                  }}
                  onEnded={() => {
                    setPlaying(false);
                    if (index < videos.length - 1) go(1);
                  }}
                />

                {/* Chrome overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

                {!playing && (
                  <button
                    aria-label="Play"
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#0B1220] shadow-lg backdrop-blur transition-transform hover:scale-105">
                      <Play size={22} fill="currentColor" className="ml-1" />
                    </span>
                  </button>
                )}

                <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
                  <span className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
                    {index + 1} / {videos.length}
                  </span>
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <IconBtn label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted((m) => !m)}>
                      {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </IconBtn>
                  </div>
                </div>

                <div className="absolute inset-x-3 bottom-3" onClick={(e) => e.stopPropagation()}>
                  <p className="line-clamp-2 text-[13px] font-medium text-white">{current.name}</p>
                  <p className="mt-0.5 text-[11px] text-white/70">
                    {[current.subject, current.semester].filter(Boolean).join(' · ') || current.path.join(' / ')}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                      <div className="h-full bg-white transition-[width]" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-white/70">{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <IconBtn label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>
                      {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </IconBtn>
                    <IconBtn label="Replay" onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0; }}>
                      <RotateCcw size={14} />
                    </IconBtn>
                    <button
                      onClick={() => setSpeed((s) => (s >= 2 ? 0.75 : s + 0.25))}
                      className="flex items-center gap-1 rounded-md bg-black/45 px-2 py-1.5 text-[10.5px] font-semibold text-white/90 backdrop-blur hover:bg-black/60"
                    >
                      <Gauge size={12} /> {speed}x
                    </button>
                    <div className="ml-auto flex items-center gap-1.5">
                      <IconBtn label="Save" onClick={() => toggle(current.id)}>
                        <Bookmark size={14} fill={isFav(current.id) ? 'currentColor' : 'none'} />
                      </IconBtn>
                      <IconBtn label="Download" onClick={() => downloadFile(current)}>
                        <Download size={14} />
                      </IconBtn>
                      <IconBtn label={wide ? 'Reels mode' : 'Lecture mode'} onClick={() => setWide((w) => !w)}>
                        {wide ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      </IconBtn>
                    </div>
                  </div>
                </div>

                {/* Up/down nav */}
                <div className="absolute bottom-24 right-3 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <IconBtn label="Previous" onClick={() => go(-1)}>
                    <ChevronUp size={16} />
                  </IconBtn>
                  <IconBtn label="Next" onClick={() => go(1)}>
                    <ChevronDown size={16} />
                  </IconBtn>
                </div>
                {void showChrome}
              </div>
            </div>

            {/* Playlist */}
            <aside className="w-full shrink-0 lg:w-[320px]">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elev)]">
                <div className="flex items-center justify-between border-b border-[var(--line)] px-3.5 py-2.5">
                  <p className="label-eyebrow">Up next</p>
                  <span className="text-[10.5px] text-[var(--fg-subtle)]">{videos.length} videos</span>
                </div>
                <div className="max-h-[520px] overflow-y-auto p-1.5">
                  {videos.map((v, i) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setIndex(i);
                        setPlaying(false);
                      }}
                      className={`flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition-colors ${
                        i === index ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-sub)]'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-9 w-14 shrink-0 items-center justify-center rounded-md bg-[#0F1B2D] text-white/85 ${i === index ? '' : 'opacity-85'}`}>
                        <Play size={13} fill="currentColor" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`line-clamp-2 text-[12px] leading-snug ${i === index ? 'font-medium' : ''}`}>{v.name}</span>
                        <span className="mt-0.5 block truncate text-[10.5px] text-[var(--fg-subtle)]">
                          {[v.subject, v.semester].filter(Boolean).join(' · ') || v.path.join(' / ')}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 px-1 text-[10px] leading-relaxed text-[var(--fg-subtle)]">
                Streaming is proxied through AcademicOS — no Google Drive pages, no popups.
              </p>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex h-7 w-7 items-center justify-center rounded-md bg-black/45 text-white/90 backdrop-blur transition-colors hover:bg-black/65"
    >
      {children}
    </button>
  );
}
