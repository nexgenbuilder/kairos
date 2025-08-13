'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/cashflow', label: 'Cashflow' },
  { href: '/content', label: 'Content' },
  { href: '/prospects', label: 'Prospects' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/fitness', label: 'Fitness' },
  { href: '/charts', label: 'Charts' },
  { href: '/settings/modules', label: 'Settings' },
  { href: '/premium', label: 'Premium' },
];

export default function ClientNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const LinkEl = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={active ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-gray-900'}
        onClick={() => setOpen(false)}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-4">
        {LINKS.map(l => <LinkEl key={l.href} href={l.href} label={l.label} />)}
      </div>

      {/* Mobile */}
      <div className="md:hidden relative">
        <button
          aria-label="Toggle menu"
          className="p-2 rounded hover:bg-gray-100"
          onClick={() => setOpen(s => !s)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-12 border-t bg-white px-4 py-3 flex flex-col gap-2">
            {LINKS.map(l => <LinkEl key={l.href} href={l.href} label={l.label} />)}
          </div>
        )}
      </div>
    </>
  );
}

