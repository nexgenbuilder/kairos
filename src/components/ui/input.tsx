'use client';
import * as React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm',
        'focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
        className
      )}
      {...props}
    />
  );
});
