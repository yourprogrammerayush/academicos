'use client';

import Link from 'next/link';

type Props = {
  size?: number;
  withWordmark?: boolean;
  href?: string | null;
  className?: string;
  lockup?: boolean;
};

/**
 * Brand lockup.
 *
 * Default: the supplied artwork's own lockup — graduation cap over the
 * "AcademicOS" wordmark — as one transparent PNG. Because it is the original
 * artwork rather than recomposed text, the wordmark's navy/amber/coral
 * gradient is exactly the supplied one.
 *
 * `withWordmark={false}` falls back to the mark alone for tight spaces.
 * Every variant is transparent, so it sits correctly on the white canvas.
 */
export function Logo({
  size = 32,
  withWordmark = true,
  href = '/',
  className = '',
}: Props) {
  const body = withWordmark ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo-lockup.png"
      alt="AcademicOS"
      width={Math.round(size * 1.16)}
      height={size}
      className={`brand-lockup shrink-0 ${className}`}
      style={{ height: size, width: 'auto' }}
      draggable={false}
    />
  ) : (
    <LogoMarkOnly size={size} className={className} />
  );

  if (!href) return body;
  return (
    <Link href={href} className="inline-flex items-center rounded-lg" aria-label="AcademicOS home">
      {body}
    </Link>
  );
}

/** The graduation-cap mark alone — the app icon silhouette. */
export function LogoMarkOnly({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo-mark.png"
      alt=""
      width={size}
      height={size}
      className={`brand-mark shrink-0 ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
