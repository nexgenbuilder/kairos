// src/lib/user.ts
import { cookies } from 'next/headers';
import { getUserBySessionToken } from '@/lib/auth';

export async function currentUser() {
  const cookieStore = cookies();
  const sid = cookieStore.get('sid')?.value || '';
  if (!sid) return null;
  return getUserBySessionToken(sid);
}
