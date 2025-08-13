'use client';
import clsx from 'clsx';

export function Badge({
  children,
  color = 'gray',
  className,
}: {
  children: React.ReactNode;
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
}) {
  const bg: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', bg[color], className)}>
      {children}
    </span>
  );
}
