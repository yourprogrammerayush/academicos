import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://academicos-app.vercel.app'),
  title: {
    default: 'AcademicOS — Every study material in one place',
    template: '%s · AcademicOS',
  },
  description:
    'Browse, search, read, watch and listen to your entire semester of study material. AI-grounded, installable, and always in sync with your Drive folder.',
  applicationName: 'AcademicOS',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'AcademicOS', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/mark-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/brand/mark-180.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'AcademicOS',
    description: 'Your entire academic library, reimagined. AI-grounded, in-app and installable.',
    images: ['/brand/mark-512.png'],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1220' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

const themeInit = `(function(){try{var t=JSON.parse(localStorage.getItem('academicos:theme')||'"light"');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');}r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link
          rel="preload"
          href="/fonts/var/plus-jakarta-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="apple-touch-icon" href="/brand/mark-180.png" />
        <link rel="stylesheet" href="/katex.min.css" />
      </head>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
