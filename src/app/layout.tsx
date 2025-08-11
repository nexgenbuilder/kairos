// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: 'Kairos',
  description: 'Kairos – personal ops suite',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
} as const;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
