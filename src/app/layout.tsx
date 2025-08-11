import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 border-b bg-white">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex gap-4 text-sm">
            <Link href="/" className="font-semibold">Personal Ops</Link>
            <Link href="/tasks">Tasks</Link>
            <Link href="/cashflow">Cashflow</Link>
            <Link href="/content">Content</Link>
            <Link href="/prospects">Prospects</Link>
            <Link href="/inventory">Inventory</Link>
            <Link href="/admin/delete" className="hover:underline">Admin</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  )
}
