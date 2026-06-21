import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

const badge = cva(
  'inline-flex items-center gap-1 font-medium rounded-full',
  {
    variants: {
      variant: {
        primary: 'bg-primary-100 text-primary-700',
        success: 'bg-success-50 text-success-700',
        danger:  'bg-danger-50 text-danger-700',
        warning: 'bg-warning-50 text-warning-600',
        neutral: 'bg-neutral-100 text-neutral-600',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'sm',
    },
  }
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badge>;

const Badge: React.FC<BadgeProps> = ({ className, variant, size, ...props }) => (
  <span className={clsx(badge({ variant, size }), className)} {...props} />
);

export { Badge, badge };
