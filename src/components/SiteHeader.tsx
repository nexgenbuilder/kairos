// src/components/SiteHeader.tsx
import Logo from '@/components/Logo';
import ClientNav from '@/components/ClientNav';
import UserMenu from '@/components/UserMenu';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4 text-sm">
        <Logo />
        <div className="flex-1" />
        <ClientNav />
        <div className="flex-1" />
        <UserMenu />
      </nav>
    </header>
  );
}
