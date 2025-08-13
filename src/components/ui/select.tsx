'use client';
import * as React from 'react';
import clsx from 'clsx';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={clsx(
        'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm',
        'focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
