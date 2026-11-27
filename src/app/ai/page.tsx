'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  Bookmark,
  Download,
  MessageSquarePlus,
  Sparkle,
  Square,
  Trash2,
  Menu,
  X,
  ArrowLeft,
  BookOpen,
  FileSearch,
  CalendarClock,
  ScrollText,
  PanelLeft,
  Plus,
  Brain,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';

import { Markdown } from '@/components/markdown';
import { FileTypeIcon } from '@/components/file-icon';
import { downloadFile } from '@/components/file-card';
import { store } from '@/lib/store';
import { useFavorites } from '@/lib/store';
import type { ChatMessage, ChatThread } from '@/lib/types';

const QUICK_PROMPTS = [
  { label: 'What past papers do I have for Discrete Mathematics?', icon: FileSearch, tag: 'Find' },
  { label: 'Explain K-maps with a worked example', icon: BookOpen, tag: 'Learn' },
  { label: 'Build me a 7-day revision plan for Sem 2', icon: CalendarClock, tag: 'Plan' },
  { label: 'Summarise the syllabus and list every unit', icon: ScrollText, tag: 'Summarise' },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AIPage() {
  const { catalog, fileById } = useApp();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [streamFiles, setStreamFiles] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const active = threads.find((t) => t.id === activeId);

  useEffect(() => {
    const stored = store.getChatThreads();
    setThreads(stored);
    if (stored.length) setActiveId(stored[0].id);
    else {
      const t: ChatThread = { id: uid(), title: 'New chat', messages: [], updatedAt: Date.now() };
      setThreads([t]);
      setActiveId(t.id);
      store.setChatThreads([t]);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [active?.messages, streamText]);

  const persist = useCallback((next: ChatThread[]) => {
    setThreads(next);
    store.setChatThreads(next);
  }, []);

  const newChat = () => {
    const t: ChatThread = { id: uid(), title: 'New chat', messages: [], updatedAt: Date.now() };
    persist([t, ...threads]);
    setActiveId(t.id);
    setInput('');
    setSidebarOpen(false);
  };

  const deleteThread = (id: string) => {
    const next = threads.filter((t) => t.id !== id);
    if (!next.length) {
      const t: ChatThread = { id: uid(), title: 'New chat', messages: [], updatedAt: Date.now() };
      persist([t]);
      setActiveId(t.id);
    } else {
      persist(next);
      if (activeId === id) setActiveId(next[0].id);
    }
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming || !active) return;
    setInput('');
    const userMsg: ChatMessage = { id: uid(), role: 'user', content, createdAt: Date.now() };
    const updatedThread: ChatThread = {
      ...active,
      title: active.messages.length === 0 ? content.slice(0, 48) : active.title,
      messages: [...active.messages, userMsg],
      updatedAt: Date.now(),
    };
    const nextThreads = threads.map((t) => (t.id === active.id ? updatedThread : t));
    persist(nextThreads);
    setStreaming(true);
    setStreamText('');
    setStreamFiles([]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedThread.messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: ctrl.signal,
      });

      if (!res.headers.get('content-type')?.includes('text/event-stream')) {
        const data = (await res.json()) as { text?: string; fileIds?: string[] };
        const assistant: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: data.text || 'No response.',
          fileIds: data.fileIds || [],
          createdAt: Date.now(),
        };
        persist(
          nextThreads.map((t) =>
            t.id === active.id ? { ...t, messages: [...t.messages, assistant], updatedAt: Date.now() } : t
          )
        );
        setStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let full = '';
      let ids: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';
        for (const part of parts) {
          const line = part.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          try {
            const json = JSON.parse(line.slice(5).trim()) as { delta?: string; done?: boolean; fileIds?: string[] };
            if (json.delta) {
              full += json.delta;
              setStreamText(full);
            }
            if (json.done) ids = json.fileIds || [];
          } catch {
            // ignore
          }
        }
      }

      const clean = full.replace(/FILE:\s*[A-Za-z0-9_-]+\n?/g, '').trim();
      const assistant: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: clean || 'No response.',
        fileIds: ids,
        createdAt: Date.now(),
      };
      persist(
        nextThreads.map((t) =>
          t.id === active.id ? { ...t, messages: [...t.messages, assistant], updatedAt: Date.now() } : t
        )
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const assistant: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: 'Something went wrong reaching the AI. Please try again — the local catalog search still works from the Library tab.',
          createdAt: Date.now(),
        };
        persist(
          nextThreads.map((t) =>
            t.id === active.id ? { ...t, messages: [...t.messages, assistant], updatedAt: Date.now() } : t
          )
        );
      }
    } finally {
      setStreaming(false);
      setStreamText('');
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  return (
    <div className="flex h-[100dvh] flex-col md:h-screen">
      <div className="flex min-h-0 flex-1">
        {/* ── Conversations rail ───────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 flex-col border-r border-line bg-sunken transition-transform duration-300 ease-swift md:static md:z-0 md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-[60px] items-center justify-between px-3.5">
            <p className="eyebrow">Conversations</p>
            <div className="flex items-center gap-0.5">
              <button onClick={newChat} aria-label="New chat" className="btn-icon h-7 w-7">
                <Plus size={15} strokeWidth={2.2} />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close"
                className="btn-icon h-7 w-7 md:hidden"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {threads.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center rounded-xl transition-colors ${
                  activeId === t.id ? 'bg-elev shadow-hair' : 'hover:bg-hover'
                }`}
              >
                <button
                  onClick={() => {
                    setActiveId(t.id);
                    setSidebarOpen(false);
                  }}
                  className="min-w-0 flex-1 px-2.5 py-2 text-left"
                >
                  <p
                    className={`truncate text-[12.5px] leading-snug ${
                      activeId === t.id ? 'font-semibold text-fg' : 'text-muted'
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-faint">
                    {t.messages.length === 0
                      ? 'Empty'
                      : `${t.messages.length} message${t.messages.length === 1 ? '' : 's'}`}
                  </p>
                </button>
                <button
                  onClick={() => deleteThread(t.id)}
                  aria-label="Delete conversation"
                  className="mr-1.5 rounded-md p-1.5 text-faint opacity-0 transition-all hover:text-danger group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* What the AI knows */}
          <div className="border-t border-line p-3">
            <div className="rounded-xl bg-elev p-3 shadow-hair">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-fg">
                <Brain size={12} className="text-accent" />
                Grounded on your library
              </p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                {catalog.files.length} files ·{' '}
                {new Set(catalog.files.map((f) => f.subject).filter(Boolean)).size} subjects ·{' '}
                {new Set(catalog.files.map((f) => f.semester).filter(Boolean)).size} semesters
              </p>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            className="fixed inset-0 z-40 animate-fade-in bg-navy-950/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close conversations"
            tabIndex={-1}
          />
        )}

        {/* ── Chat column ──────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center gap-2 border-b border-line px-3 sm:px-5">
            <Link href="/library" aria-label="Back" className="btn-icon -ml-1 md:hidden">
              <ArrowLeft size={18} strokeWidth={2.1} />
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Conversations"
              className="btn-icon hidden h-8 w-8 md:inline-flex"
            >
              <PanelLeft size={16} strokeWidth={1.9} />
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-950">
                <Sparkle size={13} className="text-amber-400" strokeWidth={2.2} />
              </span>
              <p className="truncate text-[13.5px] font-semibold tracking-[-0.015em] text-fg">
                Study AI
              </p>
              <span className="hidden rounded-full bg-ok-soft px-2 py-0.5 text-[10px] font-bold text-ok sm:inline">
                live
              </span>
            </div>
            <p className="ml-auto hidden text-[10.5px] text-faint sm:block">
              English · हिंदी · Hinglish · 日本語
            </p>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[720px] px-4 py-7 sm:px-6">
              {!active || active.messages.length === 0 ? (
                <div className="animate-fade-up">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-950">
                    <Sparkle size={19} className="text-amber-400" strokeWidth={2.1} />
                  </span>
                  <h1 className="mt-4 text-[26px] h-display text-fg">What are we studying?</h1>
                  <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted text-pretty">
                    Ask in any language. I can see every file in your Drive folder and will point
                    you to the right notes, papers and lectures — or just explain the concept.
                  </p>

                  <div className="mt-7 grid gap-2 sm:grid-cols-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => void send(p.label)}
                        className="group flex flex-col items-start gap-2 rounded-xl bg-elev p-3.5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                      >
                        <span className="flex items-center gap-1.5">
                          <p.icon size={13} className="text-faint group-hover:text-accent" strokeWidth={2} />
                          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-faint">
                            {p.tag}
                          </span>
                        </span>
                        <span className="text-[12.5px] leading-relaxed text-fg">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-7">
                  {active.messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                  ))}
                  {streaming && (
                    <div className="animate-fade-up">
                      <div className="mb-2 flex items-center gap-1.5">
                        <Sparkle size={11} className="text-accent" />
                        <span className="text-[11px] font-semibold text-faint">Study AI</span>
                      </div>
                      {streamText ? (
                        <Markdown content={streamText.replace(/FILE:\s*[A-Za-z0-9_-]+\n?/g, '')} />
                      ) : (
                        <div className="flex gap-1 py-1">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 animate-pulse rounded-full bg-faint"
                              style={{ animationDelay: `${i * 140}ms` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-line bg-canvas px-3 pb-3 pt-2.5 sm:px-6 safe-b">
            <div className="mx-auto max-w-[720px]">
              <div className="flex items-end gap-2 rounded-2xl bg-elev px-2 py-2 shadow-lift transition-shadow focus-within:shadow-pop">
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={1}
                  placeholder="Ask anything — notes, PYQs, a concept, a plan…"
                  className="max-h-40 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-[13.5px] leading-relaxed outline-none placeholder:text-faint"
                />
                {streaming ? (
                  <button
                    onClick={stop}
                    aria-label="Stop"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hover text-fg transition-colors hover:bg-active"
                  >
                    <Square size={12} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={() => void send()}
                    disabled={!input.trim()}
                    aria-label="Send"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fg text-canvas transition-all hover:opacity-85 disabled:opacity-25"
                  >
                    <ArrowUp size={16} strokeWidth={2.4} />
                  </button>
                )}
              </div>
              <p className="mt-1.5 px-1 text-[10px] leading-relaxed text-faint">
                Answers are grounded in your catalogue but can still be wrong — check the source.
                Enter sends, Shift+Enter adds a line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const { fileById } = useApp();
  const { isFav, toggle } = useFavorites();

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[86%] rounded-2xl rounded-br-md bg-fg px-4 py-2.5 text-[13.5px] leading-relaxed text-canvas">
          {message.content}
        </div>
      </div>
    );
  }

  const files = (message.fileIds || []).map((id) => fileById(id)).filter(Boolean);

  return (
    <div className="animate-fade-up">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkle size={11} className="text-accent" />
        <span className="text-[11px] font-semibold text-faint">Study AI</span>
      </div>
      <div className="text-[13.5px] leading-relaxed">
        <Markdown content={message.content} />
      </div>
      {files.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="eyebrow mb-2">From your library</p>
          {files.map((f) => (
            <div
              key={f!.id}
              className="group flex items-center gap-3 rounded-xl bg-elev p-2.5 shadow-card transition-shadow hover:shadow-lift"
            >
              <FileTypeIcon file={f!} size={15} />
              <Link href={`/viewer/${f!.id}`} className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-fg">
                  {f!.name.replace(/\.pdf$/i, '')}
                </p>
                <p className="truncate text-[10.5px] text-faint">
                  {[f!.type, f!.semester, f!.subject].filter(Boolean).join(' · ')}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => toggle(f!.id)}
                  className={`rounded-md p-1.5 transition-colors hover:bg-hover ${
                    isFav(f!.id) ? 'text-accent' : 'text-faint hover:text-fg'
                  }`}
                  aria-label="Save"
                >
                  <Bookmark size={13} fill={isFav(f!.id) ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => downloadFile(f!)}
                  className="rounded-md p-1.5 text-faint transition-colors hover:bg-hover hover:text-fg"
                  aria-label="Download"
                >
                  <Download size={13} />
                </button>
                <Link
                  href={`/viewer/${f!.id}`}
                  className="rounded-md px-2 py-1 text-[11px] font-semibold text-muted transition-colors hover:bg-hover hover:text-fg"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
