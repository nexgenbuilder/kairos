export default function LockedPage({ searchParams }: { searchParams: { module?: string } }) {
  const mod = searchParams?.module || 'this module';
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Locked</h1>
      <p className="text-gray-700">
        You don’t have access to <strong>{mod}</strong> right now. Pick your active module in settings.
      </p>
      <a className="inline-block rounded border px-3 py-1 text-sm hover:bg-gray-50" href="/settings/modules">
        Go to Settings
      </a>
    </div>
  );
}
