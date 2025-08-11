// src/components/UserMenu.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getUserBySessionToken } from '@/lib/auth';

export default async function UserMenu() {
  const sid = cookies().get('sid')?.value || '';
  const user = sid ? await getUserBySessionToken(sid) : null;
  const betaFree = process.env.BETA_FREE === '1';

  return (
    <div className="ml-auto flex items-center gap-3">
      {betaFree && (
        <span className="hidden sm:inline rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-700">
          Beta: all modules free 🎉
        </span>
      )}

      {!user ? (
        <>
          <Link href="/login" className="text-sm hover:underline">Log in</Link>
          <Link href="/register" className="text-sm hover:underline">Register</Link>
        </>
      ) : (
        <>
          <span className="text-sm text-gray-600">{user.email}</span>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm rounded border px-2 py-1 hover:bg-gray-50"
            >
              Logout
            </button>
          </form>
        </>
      )}
    </div>
  );
}
