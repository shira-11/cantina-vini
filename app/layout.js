import './globals.css';
import InactivityTracker from './components/InactivityTracker';

export const metadata = {
  title: 'Cantina Vini',
  description: 'Gestisci e cataloga la tua collezione di vini',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cantina Vini',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8b5cf6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Cantina Vini" />
        <meta name="application-name" content="Cantina Vini" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <InactivityTracker />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
