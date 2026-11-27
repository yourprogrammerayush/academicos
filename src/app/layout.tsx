import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://academic-os-eight-rust.vercel.app'),
  title: {
    default: 'AcademicOS — Your Academic Operating System',
    template: '%s · AcademicOS',
  },
  description:
    'An AI-powered academic workspace: browse, search, read, watch and listen to every study resource in one fast, private, installable app.',
  applicationName: 'AcademicOS',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'AcademicOS', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'AcademicOS',
    description: 'Your entire academic library, reimagined. AI-powered, in-app, and installable.',
    images: ['/icons/icon-512.png'],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0C1220' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

const themeInit = `(function(){try{var t=JSON.parse(localStorage.getItem('academicos:theme')||'"system"');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');}r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="preload" href="/fonts/times-new-roman.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="stylesheet" href="/katex.min.css" />
      </head>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
