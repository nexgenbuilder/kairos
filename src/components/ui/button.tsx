'use client';
import * as React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-sm rounded',
  md: 'px-3 py-2 text-sm rounded-md',
  lg: 'px-4 py-2.5 text-base rounded-md',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, children, loading, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-1 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
        variants[variant],
        sizes[size],
        disabled || loading ? 'opacity-70 cursor-not-allowed' : '',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

