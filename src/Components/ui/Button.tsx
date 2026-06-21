import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

const button = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:   'bg-primary-400 text-white hover:bg-primary-500 focus:ring-primary-400',
        secondary: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 focus:ring-neutral-300',
        danger:    'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500',
        success:   'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500',
        ghost:     'bg-transparent text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-300',
        outline:   'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-300',
      },
      size: {
        xs: 'px-2.5 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(button({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, button };
