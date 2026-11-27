'use client';

import Link from 'next/link';

type Props = {
  size?: number;
  withWordmark?: boolean;
  href?: string | null;
  className?: string;
  priority?: boolean;
};

/**
 * Brand lockup: the graduation-cap mark next to a typographic wordmark.
 * The mark is the supplied artwork (transparent PNG); the wordmark is set in
 * Jakarta so it stays crisp at every size and inherits theme colour.
 */
export function Logo({ size = 32, withWordmark = true, href = '/', className = '' }: Props) {
  const body = (
    <span className={`inline-flex select-none items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-mark.png"
        alt="AcademicOS"
        width={size}
        height={size}
        className="shrink-0"
        style={{ width: size, height: size }}
        draggable={false}
      />
      {withWordmark && (
        <span
          className="h-title text-[1.0625rem] leading-none"
          style={{ letterSpacing: '-0.038em' }}
          aria-hidden="true"
        >
          <span className="text-fg">Academic</span>
          <span
            style={{
              background: 'linear-gradient(94deg, #FCA800 0%, #FC6000 52%, #FC3A2C 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            OS
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return body;
  return (
    <Link href={href} className="inline-flex rounded-lg" aria-label="AcademicOS home">
      {body}
    </Link>
  );
}

export function LogoMarkOnly({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo-mark.png"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
