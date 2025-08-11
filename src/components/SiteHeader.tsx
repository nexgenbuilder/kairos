import Link from 'next/link';
import { cookies } from 'next/headers';
import UserMenu from '@/components/UserMenu';

export default function SiteHeader() {
  const role = cookies().get('role')?.value || 'user';
  const isAdmin = role === 'superadmin';

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4 text-sm">
        <Link href="/" className="font-semibold text-base md:text-lg">
          Kairos
        </Link>

        <Link href="/">Home</Link>
        <Link href="/tasks">Tasks</Link>
        <Link href="/cashflow">Cashflow</Link>
        <Link href="/content">Content</Link>
        <Link href="/prospects">Prospects</Link>
        <Link href="/inventory">Inventory</Link>
        {isAdmin && (
          <Link href="/admin/delete" className="hover:underline">
            Admin
          </Link>
        )}
        <Link href="/settings/modules">Settings</Link>
        <Link href="/premium">Premium</Link>

        <div className="ml-auto">
          <UserMenu />
        </div>
      </nav>
    </header>
  );
}


