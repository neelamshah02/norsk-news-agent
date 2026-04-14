import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Norsk Nyhetsagent',
  description: 'Lær norsk gjennom aktuelle nyheter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
