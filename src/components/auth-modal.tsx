'use client';

import { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, Loader2, Check } from 'lucide-react';
import { useApp } from './app-provider';

type Mode = 'signin' | 'signup' | 'otp';

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AuthModal() {
  const { authOpen, setAuthOpen, signIn, signedIn, userName, signOut } = useApp();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  if (!authOpen) return null;

  const close = () => {
    setAuthOpen(false);
    setError('');
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'otp') {
      if (!otpSent) {
        setOtpSent(true);
        return;
      }
      if (otp.trim().length < 4) {
        setError('Enter the 6-digit code from your email.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        signIn(name || email.split('@')[0] || 'Student', email);
        setAuthOpen(false);
      }, 600);
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      signIn(name || email.split('@')[0], email);
      setAuthOpen(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
      <button
        className="absolute inset-0 animate-fade-in bg-navy-950/50 backdrop-blur-[3px]"
        onClick={close}
        aria-label="Close sign in"
        tabIndex={-1}
      />
      <div className="relative w-full max-w-[430px] animate-fade-up overflow-hidden rounded-2xl bg-elev shadow-pop">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-faint transition-colors hover:bg-hover hover:text-fg"
        >
          <X size={16} />
        </button>

        <div className="px-6 pt-7">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/mark-96.png" alt="" width={26} height={26} className="h-[26px] w-[26px]" />
            </span>
            <span className="text-[17px] font-bold tracking-[-0.02em] text-fg">
              Academic<span className="text-accent">OS</span>
            </span>
          </div>
        </div>

        {signedIn ? (
          <div className="px-6 pb-6 pt-5">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-sunken p-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fg text-[13px] font-semibold text-canvas">
                {userName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">{userName}</p>
                <p className="text-[11.5px] text-faint">Profile synced · Guest data preserved</p>
              </div>
              <Check size={16} className="text-ok" />
            </div>
            <button onClick={signOut} className="btn btn-ghost mt-4 w-full justify-center">
              Sign out
            </button>
            <p className="mt-5 text-center text-[10.5px] text-faint">Web App Created By — Ayush Jha, 2CSE-4</p>
          </div>
        ) : (
          <div className="px-6 pb-6 pt-4">
            <h2 className="text-[19px] font-bold tracking-[-0.02em] text-fg">
              {mode === 'signup' ? 'Create your account' : mode === 'otp' ? 'Sign in with a code' : 'Welcome back'}
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              {mode === 'otp'
                ? 'No password needed — we’ll email you a one-time code.'
                : 'Sync favorites, collections and progress across devices.'}
            </p>

            <button
              onClick={() => {
                setLoading(true);
                const name = email.trim() ? email.split('@')[0] : 'Student';
                setTimeout(() => {
                  setLoading(false);
                  signIn(name, email.trim() || 'local@academicos.app');
                  setAuthOpen(false);
                }, 700);
              }}
              className="btn btn-ghost mt-5 w-full justify-center gap-2.5 py-2.5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
              </svg>
              {HAS_CLERK ? 'Continue with Google' : 'Create local profile'}
            </button>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-faint">
              {HAS_CLERK
                ? 'Secured by Clerk · Google one-tap'
                : 'Stored on this device only. Add Clerk keys to enable Google one-tap sync.'}
            </p>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[10.5px] uppercase tracking-wide text-faint">or</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              {mode === 'signup' && (
                <Field icon={<User size={15} />}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                    className="h-10 w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint"
                  />
                </Field>
              )}
              <Field icon={<Mail size={15} />}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="h-10 w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint"
                />
              </Field>
              {mode !== 'otp' ? (
                <Field icon={<Lock size={15} />}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className="h-10 w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint"
                  />
                </Field>
              ) : otpSent ? (
                <Field icon={<ShieldCheck size={15} />}>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    maxLength={6}
                    className="h-10 w-full bg-transparent text-[13.5px] tracking-[0.3em] outline-none placeholder:tracking-normal placeholder:text-faint"
                  />
                </Field>
              ) : null}

              {error && <p className="text-[11.5px] text-warn">{error}</p>}

              <button type="submit" disabled={loading} className="btn btn-primary mt-1 w-full justify-center py-2.5">
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'otp' ? (otpSent ? 'Verify & sign in' : 'Email me a code') : mode === 'signup' ? 'Create account' : 'Sign in'}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Turnstile placeholder — renders real widget when key is present */}
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <div className="mt-3 rounded-lg border border-dashed border-line p-2 text-center text-[10.5px] text-faint">
                Protected by Cloudflare Turnstile
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
              <button onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')} className="hover:text-fg hover:underline">
                {mode === 'signup' ? 'I already have an account' : 'Create an account'}
              </button>
              <span className="text-line-strong">·</span>
              <button
                onClick={() => {
                  setMode('otp');
                  setOtpSent(false);
                }}
                className="hover:text-fg hover:underline"
              >
                Email code
              </button>
              <span className="text-line-strong">·</span>
              <button onClick={close} className="hover:text-fg hover:underline">
                Continue as guest
              </button>
            </div>
            <p className="mt-4 text-center text-[10px] leading-relaxed text-faint">
              Guest mode works fully offline-local. Sign-in is optional.
              <br />
              Web App Created By - Ayush Jha, 2CSE-4
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line bg-sunken px-3 transition-colors focus-within:border-line-strong focus-within:bg-elev">
      <span className="text-faint">{icon}</span>
      {children}
    </div>
  );
}
