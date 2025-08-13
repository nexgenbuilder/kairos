export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-white p-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold mb-2">{children}</div>;
}
