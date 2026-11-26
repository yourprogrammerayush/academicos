'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  Bookmark,
  Download,
  ExternalLink,
  MessageSquarePlus,
  Sparkle,
  Square,
  Trash2,
  Menu,
  X,
  BookOpen,
  Languages,
  Zap,
} from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { MobileTopBar } from '@/components/mobile-nav';
import { Markdown } from '@/components/markdown';
import { FileTypeIcon } from '@/components/file-icon';
import { downloadFile } from '@/components/file-card';
import { store } from '@/lib/store';
import { useFavorites } from '@/lib/store';
import type { ChatMessage, ChatThread } from '@/lib/types';

const QUICK_PROMPTS = [
  { label: '2nd year COA ke important notes aur PYQ do', icon: Zap },
  { label: 'Discrete math unit 2 notes summarize kar do', icon: BookOpen },
  { label: 'Which videos should I watch before DBMS exam?', icon: Sparkle },
  { label: 'Make a 7-day revision plan for Sem 3', icon: Languages },
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
    <>
      <MobileTopBar title="Study AI" />
      <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
        {/* Threads */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[268px] shrink-0 border-r border-[var(--line)] bg-[var(--bg-sub)] transition-transform md:static md:z-0 md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-[var(--line)] px-3.5">
            <p className="label-eyebrow">Conversations</p>
            <div className="flex items-center gap-0.5">
              <button onClick={newChat} aria-label="New chat" className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]">
                <MessageSquarePlus size={15} />
              </button>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close" className="rounded-md p-1.5 text-[var(--fg-muted)] md:hidden">
                <X size={15} />
              </button>
            </div>
          </div>
          <div className="h-[calc(100%-3.5rem)] overflow-y-auto p-2">
            <button onClick={newChat} className="btn btn-ghost mb-2 w-full justify-center text-[12px]">
              <MessageSquarePlus size={13} /> New chat
            </button>
            {threads.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-1 rounded-md transition-colors ${
                  activeId === t.id ? 'bg-[var(--bg-elev)] shadow-[var(--shadow-card)] ring-1 ring-[var(--line)]' : 'hover:bg-[var(--bg-hover)]'
                }`}
              >
                <button
                  onClick={() => {
                    setActiveId(t.id);
                    setSidebarOpen(false);
                  }}
                  className="min-w-0 flex-1 px-2.5 py-2 text-left"
                >
                  <p className={`truncate text-[12.5px] ${activeId === t.id ? 'font-medium' : 'text-[var(--fg-muted)]'}`}>{t.title}</p>
                  <p className="text-[10.5px] text-[var(--fg-subtle)]">
                    {t.messages.length} message{t.messages.length === 1 ? '' : 's'}
                  </p>
                </button>
                <button
                  onClick={() => deleteThread(t.id)}
                  aria-label="Delete conversation"
                  className="mr-1 rounded p-1 text-[var(--fg-subtle)] opacity-0 transition-opacity hover:text-[var(--warn)] group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </aside>
        {sidebarOpen && <div className="fixed inset-0 z-40 bg-[#0B1220]/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-14 items-center gap-2 border-b border-[var(--line)] px-3 sm:px-5">
            <button onClick={() => setSidebarOpen(true)} aria-label="Open conversations" className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] md:hidden">
              <Menu size={16} />
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <Sparkle size={15} className="shrink-0 text-[var(--brand)]" />
              <p className="truncate text-[13px] font-medium">Study AI</p>
              <span className="hidden rounded-full border border-[var(--line)] px-1.5 py-0.5 text-[10px] text-[var(--fg-subtle)] sm:inline">
                grounded on {catalog.files.length} files
              </span>
            </div>
            <span className="ml-auto hidden text-[10.5px] text-[var(--fg-subtle)] sm:block">English · हिंदी · Hinglish · 日本語</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-6">
              {!active || active.messages.length === 0 ? (
                <div className="animate-fade-up pt-6">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-sub)] ring-1 ring-[var(--line)]">
                      <Sparkle size={15} className="text-[var(--brand)]" />
                    </span>
                    <h1 className="font-serif text-[22px] font-bold tracking-[-0.02em]">What are we studying?</h1>
                  </div>
                  <p className="mb-6 max-w-lg text-[13px] leading-relaxed text-[var(--fg-muted)]">
                    Ask in any language. I know every file in your Drive folder and can point you straight to the right notes, papers and lectures.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => send(p.label)}
                        className="group flex items-start gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] p-3 text-left transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--bg-hover)]"
                      >
                        <p.icon size={14} className="mt-0.5 shrink-0 text-[var(--fg-subtle)] group-hover:text-[var(--brand)]" />
                        <span className="text-[12.5px] leading-relaxed text-[var(--fg-muted)] group-hover:text-[var(--fg)]">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {active.messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                  ))}
                  {streaming && (
                    <div className="animate-fade-up">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Sparkle size={12} className="text-[var(--brand)]" />
                        <span className="text-[11px] font-medium text-[var(--fg-subtle)]">Study AI</span>
                      </div>
                      {streamText ? (
                        <Markdown content={streamText.replace(/FILE:\s*[A-Za-z0-9_-]+\n?/g, '')} />
                      ) : (
                        <div className="flex gap-1 py-1">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--fg-subtle)]"
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
          <div className="border-t border-[var(--line)] bg-[var(--bg)] px-3 py-3 sm:px-6">
            <div className="mx-auto max-w-[760px]">
              <div className="flex items-end gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-2 shadow-[var(--shadow-card)] transition-colors focus-within:border-[var(--line-strong)]">
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
                  className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-[13.5px] leading-relaxed outline-none placeholder:text-[var(--fg-subtle)]"
                />
                {streaming ? (
                  <button onClick={stop} aria-label="Stop" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-hover)] text-[var(--fg)]">
                    <Square size={12} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={() => void send()}
                    disabled={!input.trim()}
                    aria-label="Send"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--fg)] text-[var(--bg)] transition-opacity disabled:opacity-30"
                  >
                    <ArrowUp size={15} />
                  </button>
                )}
              </div>
              <p className="mt-1.5 px-1 text-[10px] text-[var(--fg-subtle)]">
                AI can make mistakes — always verify against your source material. Enter to send, Shift+Enter for a new line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const { fileById } = useApp();
  const { isFav, toggle } = useFavorites();

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--fg)] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[var(--bg)]">
          {message.content}
        </div>
      </div>
    );
  }

  const files = (message.fileIds || []).map((id) => fileById(id)).filter(Boolean);

  return (
    <div className="animate-fade-up">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkle size={12} className="text-[var(--brand)]" />
        <span className="text-[11px] font-medium text-[var(--fg-subtle)]">Study AI</span>
      </div>
      <Markdown content={message.content} />
      {files.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {files.map((f) => (
            <div
              key={f!.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] p-2.5 transition-colors hover:border-[var(--line-strong)]"
            >
              <FileTypeIcon file={f!} size={15} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium">{f!.name}</p>
                <p className="truncate text-[10.5px] text-[var(--fg-subtle)]">{[f!.type, f!.semester, f!.subject].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Link href={`/viewer/${f!.id}`} className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]" aria-label="Open in app">
                  <ExternalLink size={13} />
                </Link>
                <button onClick={() => downloadFile(f!)} className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]" aria-label="Download">
                  <Download size={13} />
                </button>
                <button onClick={() => toggle(f!.id)} className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]" aria-label="Save">
                  <Bookmark size={13} fill={isFav(f!.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
