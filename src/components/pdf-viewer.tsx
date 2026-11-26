'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  url: string;
  nightMode: boolean;
  zoom: number;
  onPagesReady?: (pages: number) => void;
  page: number;
  onPageChange: (p: number) => void;
  onTextExtracted?: (text: string) => void;
}

interface PdfPageProxy {
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void>; cancel: () => void };
  getTextContent: () => Promise<{ items: { str?: string }[] }>;
}

interface PdfDocumentProxy {
  numPages: number;
  getPage: (n: number) => Promise<PdfPageProxy>;
}

interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (o: { url: string }) => { promise: Promise<PdfDocumentProxy> };
}

export function PdfViewer({ url, nightMode, zoom, onPagesReady, page, onPageChange, onTextExtracted }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PdfDocumentProxy | null>(null);
  const [lib, setLib] = useState<PdfJsLib | null>(null);
  const [error, setError] = useState('');
  const [rendering, setRendering] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = (await import('pdfjs-dist')) as unknown as PdfJsLib;
        mod.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        if (!cancelled) setLib(mod);
      } catch (e) {
        if (!cancelled) setError(`PDF engine failed to load: ${(e as Error).message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!lib) return;
    let cancelled = false;
    setRendering(true);
    setError('');
    const task = lib.getDocument({ url });
    task.promise
      .then((doc) => {
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        onPagesReady?.(doc.numPages);
        return doc.getPage(Math.min(page, doc.numPages));
      })
      .then(async (p) => {
        if (!p || cancelled) return;
        const pg = p as PdfPageProxy;
        const viewport = pg.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        ctx.scale(dpr, dpr);
        await pg.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setRendering(false);
        if (onTextExtracted && page === 1) {
          try {
            const tc = await pg.getTextContent();
            onTextExtracted(tc.items.map((i) => i.str || '').join(' ').slice(0, 8000));
          } catch {
            // text extraction optional
          }
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(`Could not render this PDF. ${e.message || ''}`);
          setRendering(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lib, url, page, scale]);

  const fit = () => {
    const w = Math.min(window.innerWidth - 64, 900);
    setScale(w / 612);
  };

  useEffect(() => {
    if (lib) fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lib]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertCircle size={22} className="text-[var(--warn)]" />
        <p className="max-w-sm text-[13px] font-medium">{error}</p>
        <p className="max-w-sm text-[11.5px] text-[var(--fg-muted)]">
          The file may not be shared publicly, or Drive isn&apos;t connected yet. You can still download it directly.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto bg-[var(--bg-sub)] p-4">
        <div className="mx-auto flex min-h-full items-start justify-center">
          {rendering && !error && (
            <div className="absolute flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] px-3 py-2 text-[11.5px] text-[var(--fg-muted)] shadow-[var(--shadow-card)]">
              <Loader2 size={13} className="animate-spin" /> Rendering page…
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={`mx-auto rounded-sm bg-white shadow-[0_2px_16px_rgba(15,27,45,0.14)] transition-[filter] ${nightMode ? 'pdf-night' : ''}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          />
        </div>
      </div>
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-[var(--line)] bg-[var(--bg-elev)] px-4 py-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-md p-1.5 text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[11.5px] tabular-nums text-[var(--fg-muted)]">
            Page <input
              type="number"
              value={page}
              min={1}
              max={numPages}
              onChange={(e) => onPageChange(Math.min(numPages, Math.max(1, Number(e.target.value) || 1)))}
              className="mx-1 w-10 rounded border border-[var(--line)] bg-[var(--bg)] px-1 py-0.5 text-center text-[11.5px] outline-none focus:border-[var(--line-strong)]"
              aria-label="Page number"
            /> of {numPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(numPages, page + 1))}
            disabled={page >= numPages}
            className="rounded-md p-1.5 text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
