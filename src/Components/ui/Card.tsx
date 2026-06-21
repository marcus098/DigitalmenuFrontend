import React from 'react';
import clsx from 'clsx';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
};

const Card: React.FC<CardProps> = ({ className, hoverable, ...props }) => (
  <div
    className={clsx(
      'bg-white rounded-xl shadow-card border border-neutral-100',
      hoverable && 'transition-shadow duration-200 hover:shadow-card-hover cursor-pointer',
      className
    )}
    {...props}
  />
);

const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={clsx('px-5 pt-5 pb-3 border-b border-neutral-100', className)} {...props} />
);

const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={clsx('px-5 py-4', className)} {...props} />
);

const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={clsx('px-5 pb-5 pt-3 border-t border-neutral-100', className)} {...props} />
);

export { Card, CardHeader, CardBody, CardFooter };
