import './globals.css';
import Link from 'next/link';
import { Wine } from 'lucide-react';

export const metadata = {
  title: 'Cantina Vini',
  description: 'Gestisci la tua collezione di vini',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>

        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
