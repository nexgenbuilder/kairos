// src/app/settings/modules/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ALLOWED = ['prospects','tasks','cashflow','content','inventory'] as const;

export default async function ModulesSettingsPage() {
  const cookieStore = cookies();
  const sid = cookieStore.get('sid')?.value;
  if (!sid) redirect('/login?next=/settings/modules');

  const betaFree = process.env.BETA_FREE === '1';

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Module Settings</h1>

      {betaFree ? (
        <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 p-3 text-emerald-800">
          <strong>Beta:</strong> Enjoy the platform for free during the beta! 
          You can enable multiple modules while we validate and harden the system.
        </div>
      ) : (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
          <strong>Note:</strong> Free tier allows one active module; switching may reset data.
          Premium &amp; superadmin accounts are not limited.
        </div>
      )}

      <form method="POST" action="/api/settings/modules" className="space-y-3">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Select active module</span>
          <select
            name="active_module"
            className="w-full rounded border p-2"
            required
            defaultValue=""
          >
            <option value="" disabled>Choose a module…</option>
            {ALLOWED.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        {!betaFree && (
          <label className="flex items-center gap-2">
            <input type="checkbox" name="confirm" value="yes" className="h-4 w-4" />
            <span className="text-sm">
              I understand switching modules on the free plan may reset existing data
            </span>
          </label>
        )}

        <button
          type="submit"
          className="rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
        >
          Save
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-600">
        <Link href="/" className="underline">Back to Dashboard</Link>
      </div>
    </div>
  );
}

