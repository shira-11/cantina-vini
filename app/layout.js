import './globals.css';
import InactivityTracker from './components/InactivityTracker';

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
        <InactivityTracker />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
