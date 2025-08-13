// src/components/UserMenu.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getUserBySessionToken } from '@/lib/auth';

export default async function UserMenu() {
  const sid = cookies().get('sid')?.value || null;
  const user = sid ? await getUserBySessionToken(sid) : null;

  if (!user) {
    return (
      <div className="ml-auto flex items-center gap-3 text-sm">
        <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
        <Link href="/register" className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-3 text-sm">
      <span className="text-gray-600">
        {user.name || user.email}
        {user.role === 'superadmin' ? ' (admin)' : ''}
      </span>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="rounded border px-3 py-1 hover:bg-gray-50"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
