'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Bookmark,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  Sparkle,
  X,
  Loader2,
  ListTree,
  BookOpen,
  FileQuestion,
  Sigma,
  Lightbulb,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { Markdown } from '@/components/markdown';
import { FileTypeIcon } from '@/components/file-icon';
import { downloadFile } from '@/components/file-card';
import { useFavorites, store } from '@/lib/store';

const PdfViewer = dynamic(() => import('@/components/pdf-viewer').then((m) => m.PdfViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2 text-[12px] text-muted">
      <Loader2 size={14} className="animate-spin" /> Loading viewer…
    </div>
  ),
});

const TOOLS = [
  { id: 'explain', label: 'Explain simply', icon: Lightbulb },
  { id: 'summary', label: 'Exam summary', icon: BookOpen },
  { id: 'formulas', label: 'Key formulas', icon: Sigma },
  { id: 'practice', label: 'Practice questions', icon: FileQuestion },
];

export default function ViewerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { fileById, catalog, loading } = useApp();
  const { isFav, toggle } = useFavorites();
  const [zoom, setZoom] = useState(1);
  const [nightMode, setNightMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTool, setAiTool] = useState<string | null>(null);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [copied, setCopied] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  const id = params?.id ? decodeURIComponent(params.id) : '';
  const file = fileById(id);

  useEffect(() => {
    if (file) {
      store.pushRecent(file.id);
      store.setProgress(file.id, 100);
    }
  }, [file]);

  const isText = file?.kind === 'text';

  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreen) setFullscreen(false);
        else if (aiOpen) setAiOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [file, fullscreen, aiOpen]);

  const runTool = useCallback(
    async (tool: string) => {
      if (!file) return;
      setAiTool(tool);
      setAiOpen(true);
      setAiLoading(true);
      setAiText('');
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool, fileName: file.name, excerpt: excerpt || textContent }),
        });
        const data = (await res.json()) as { text: string };
        setAiText(data.text);
      } catch {
        setAiText('Could not reach the AI service. Please try again.');
      } finally {
        setAiLoading(false);
      }
    },
    [file, excerpt, textContent]
  );

  const loadText = useCallback(async () => {
    if (!file || textLoading || textContent) return;
    setTextLoading(true);
    try {
      const res = await fetch(`/api/drive?id=${encodeURIComponent(file.id)}`);
      const text = await res.text();
      setTextContent(text.slice(0, 20000));
    } catch {
      setTextContent('Could not load text content.');
    } finally {
      setTextLoading(false);
    }
  }, [file, textLoading, textContent]);

  useEffect(() => {
    if (isText && file) void loadText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isText, file?.id]);

  const related = useMemo(() => {
    if (!file) return [];
    return catalog.files
      .filter((f) => f.id !== file.id && (f.subject === file.subject || f.type === file.type))
      .slice(0, 4);
  }, [catalog.files, file]);

  if (!file) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <FileQuestion size={24} className="text-faint" />
        <p className="text-[18px] font-bold h-title">{loading ? 'Loading…' : 'File not found'}</p>
        {!loading && (
          <>
            <p className="max-w-sm text-[12.5px] text-muted">
              This file isn&apos;t in the indexed catalog. It may have been moved in Drive.
            </p>
            <Link href="/library" className="btn btn-ghost mt-2 text-[12px]">Back to library</Link>
          </>
        )}
      </div>
    );
  }



  const src = `/api/drive?id=${encodeURIComponent(file.id)}`;
  const isPdf = file.kind === 'pdf';
  const isVideo = file.kind === 'video';
  const isAudio = file.kind === 'audio';
  const isImage = file.kind === 'image';
  const isDoc = file.kind === 'doc' || file.kind === 'other';

  return (
    <div className={`flex flex-col bg-canvas ${fullscreen ? 'fixed inset-0 z-[70] h-screen' : 'h-screen md:h-screen'}`}>
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-2.5 sm:px-4">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg"
          aria-label="Back"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <FileTypeIcon file={file} size={14} />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-medium leading-tight">{file.name}</p>
            <p className="hidden truncate text-[10.5px] text-faint sm:block">
              {file.path.join(' / ')} {numPages ? `· ${numPages} pages` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {isPdf && (
            <>
              <IconBtn label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}>
                <ZoomOut size={16} />
              </IconBtn>
              <span className="hidden w-9 text-center text-[10.5px] tabular-nums text-faint sm:block">
                {Math.round(zoom * 100)}%
              </span>
              <IconBtn label="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + 0.15))}>
                <ZoomIn size={16} />
              </IconBtn>
              <IconBtn label="Night reading" onClick={() => setNightMode((n) => !n)} active={nightMode}>
                {nightMode ? <Sun size={16} /> : <Moon size={16} />}
              </IconBtn>
            </>
          )}
          <IconBtn label={isFav(file.id) ? 'Remove bookmark' : 'Bookmark'} onClick={() => toggle(file.id)} active={isFav(file.id)}>
            <Bookmark size={16} fill={isFav(file.id) ? 'currentColor' : 'none'} />
          </IconBtn>
          <IconBtn
            label="Download"
            onClick={() => {
              downloadFile(file);
              store.pushDownload(file.id, file.name);
            }}
          >
            <Download size={16} />
          </IconBtn>
          <IconBtn label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={() => setFullscreen((f) => !f)}>
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </IconBtn>
          <button
            onClick={() => setAiOpen((o) => !o)}
            className="ml-1 hidden items-center gap-1.5 rounded-lg bg-fg px-2.5 py-1.5 text-[11.5px] font-medium text-canvas transition-opacity hover:opacity-90 sm:flex"
          >
            <Sparkle size={13} /> Study AI
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Main content */}
        <div className="min-w-0 flex-1 overflow-hidden">
          {isPdf && (
            <PdfViewer
              url={src}
              nightMode={nightMode}
              zoom={zoom}
              page={page}
              onPageChange={setPage}
              onPagesReady={setNumPages}
              onTextExtracted={setExcerpt}
            />
          )}

          {isVideo && (
            <div className="flex h-full items-center justify-center bg-[#080D16] p-4">
              <video src={src} controls playsInline className="max-h-full w-full max-w-[1000px] rounded-lg" />
            </div>
          )}

          {isAudio && (
            <div className="flex h-full flex-col items-center justify-center gap-6 bg-sunken px-6">
              <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-[#0F1B2D] ring-1 ring-white/10">
                <div className="flex items-end gap-[3px]">
                  {[18, 30, 44, 26, 38, 52, 22, 34, 46, 20].map((h, i) => (
                    <span key={i} className="w-[3px] rounded-full bg-white/70" style={{ height: h }} />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <p className="eyebrow">Audio guide</p>
                <p className="mt-1.5 max-w-md text-[17px] font-bold h-title leading-snug">{file.name}</p>
                <p className="mt-1 text-[11.5px] text-faint">{[file.subject, file.semester].filter(Boolean).join(' · ')}</p>
              </div>
              <audio src={src} controls className="w-full max-w-[420px]" />
              <Link href="/audio" className="text-[11.5px] text-muted underline-offset-2 hover:underline">
                Open full podcast player →
              </Link>
            </div>
          )}

          {isImage && (
            <div className="flex h-full items-center justify-center overflow-auto bg-sunken p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={file.name} className="max-h-full max-w-full rounded-sm object-contain shadow-[0_2px_16px_rgba(15,27,45,0.14)]" />
            </div>
          )}

          {isText && (
            <div className="h-full overflow-auto bg-canvas px-6 py-6 sm:px-10">
              {textLoading ? (
                <div className="flex items-center gap-2 text-[12px] text-muted">
                  <Loader2 size={14} className="animate-spin" /> Loading text…
                </div>
              ) : (
                <pre className="mx-auto max-w-[820px] whitespace-pre-wrap text-[14.5px] leading-[1.85]">{textContent}</pre>
              )}
            </div>
          )}

          {isDoc && (
            <div className="h-full overflow-auto bg-canvas px-6 py-10 sm:px-12">
              <div className="mx-auto max-w-[720px]">
                <div className="mb-6 border-b border-line pb-5">
                  <p className="eyebrow">{file.type}</p>
                  <h1 className="mt-2 text-[24px] font-bold h-title leading-tight tracking-[-0.02em]">{file.name}</h1>
                  <p className="mt-2 text-[12px] text-faint">
                    {file.path.join(' / ')} {file.semester ? `· ${file.semester}` : ''} {file.subject ? `· ${file.subject}` : ''}
                  </p>
                </div>
                <p className="text-[13.5px] leading-relaxed text-muted">
                  {file.type === 'Presentation'
                    ? 'This presentation renders best in its native format. Download it to open in PowerPoint, Keynote or Google Slides — or use Study AI below to generate a written summary of what it likely covers from its title and subject context.'
                    : 'This document format can’t be rendered natively in the browser. Download it to open in its native app, or use Study AI to generate an exam-oriented summary and practice questions from the file metadata.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => downloadFile(file)} className="btn btn-primary text-[12px]">
                    <Download size={13} /> Download file
                  </button>
                  <button onClick={() => setAiOpen(true)} className="btn btn-ghost text-[12px]">
                    <Sparkle size={13} /> Summarize with AI
                  </button>
                </div>

                {related.length > 0 && (
                  <div className="mt-10">
                    <p className="eyebrow mb-2.5">Related in your library</p>
                    <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                      {related.map((r) => (
                        <Link key={r.id} href={`/viewer/${r.id}`} className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-hover">
                          <FileTypeIcon file={r} size={13} />
                          <span className="min-w-0 flex-1 truncate text-[12.5px]">{r.name}</span>
                          <ChevronRight size={13} className="text-faint" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI panel */}
        {aiOpen && (
          <>
            <div className="absolute inset-0 z-20 bg-[#0B1220]/30 md:hidden" onClick={() => setAiOpen(false)} />
            <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[400px] flex-col border-l border-line bg-elev shadow-[-8px_0_24px_rgba(15,27,45,0.08)]">
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-3.5">
                <p className="flex items-center gap-1.5 text-[12.5px] font-medium">
                  <Sparkle size={14} className="text-accent" /> Study AI
                </p>
                <button onClick={() => setAiOpen(false)} className="rounded-md p-1.5 text-faint hover:bg-hover hover:text-fg" aria-label="Close panel">
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 border-b border-line p-2.5">
                {TOOLS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => void runTool(t.id)}
                    className={`flex flex-col items-start gap-1.5 rounded-lg border p-2.5 text-left transition-colors ${
                      aiTool === t.id
                        ? 'border-accent bg-accent-soft'
                        : 'border-line hover:border-line-strong hover:bg-hover'
                    }`}
                  >
                    <t.icon size={14} className={aiTool === t.id ? 'text-accent' : 'text-faint'} />
                    <span className="text-[11px] font-medium leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
                {!aiTool && (
                  <div className="pt-6 text-center">
                    <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sunken ring-1 ring-line">
                      <Sparkle size={17} className="text-accent" />
                    </span>
                    <p className="text-[13px] font-medium">Study smarter with this document</p>
                    <p className="mx-auto mt-1.5 max-w-[260px] text-[11.5px] leading-relaxed text-muted">
                      Pick a tool above. The AI reads the document context and returns exam-ready notes.
                    </p>
                  </div>
                )}
                {aiLoading && (
                  <div className="flex items-center gap-2 text-[12px] text-muted">
                    <Loader2 size={14} className="animate-spin" /> Reading the document…
                  </div>
                )}
                {aiText && !aiLoading && (
                  <div className="animate-fade-up">
                    <Markdown content={aiText} />
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(aiText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1800);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[10.5px] text-muted hover:bg-hover"
                    >
                      {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-line px-3 py-2 text-[9.5px] text-faint">
                Web App Created By - Ayush Jha, 2CSE-4
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Subtle footer watermark */}
      <div className="hidden shrink-0 items-center justify-between border-t border-line px-4 py-1.5 text-[9.5px] text-faint sm:flex">
        <span className="inline-flex items-center gap-1.5">
          <ListTree size={10} /> {file.path.join(' / ')}
        </span>
        <span>AcademicOS · Web App Created By - Ayush Jha, 2CSE-4</span>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, label, active }: { children: React.ReactNode; onClick: () => void; label: string; active?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-md p-1.5 transition-colors hover:bg-hover ${
        active ? 'bg-hover text-fg' : 'text-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}
