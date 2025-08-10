export default function Home() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Welcome</h2>
        <p>This is your personal ops app (Phase 2 UI). Use the nav to access modules.</p>
      </section>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Next steps</h2>
        <ol className="list-decimal ml-4 space-y-1">
          <li>Go to <b>Tasks</b> to add/edit and verify timestamps update from DB triggers.</li>
          <li>Extend cashflow/content/prospects/inventory pages the same way.</li>
        </ol>
      </section>
    </div>
  )
}
