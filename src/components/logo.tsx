// src/components/Logo.tsx
import Link from 'next/link';

export default function Logo({ size = 22 }: { size?: number }) {
  // Clean, simple inline logo + wordmark. Replace later with your SVG/brand.
  return (
    <Link href="/" className="flex items-center gap-2 hover:opacity-90" aria-label="Kairos Home">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2" />
        <path d="M12 6v6l4 2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-base font-semibold text-gray-900">Kairos</span>
    </Link>
  );
}
