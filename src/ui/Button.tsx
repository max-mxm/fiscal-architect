import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '~/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover disabled:bg-line-2 disabled:text-card',
  secondary: 'bg-card text-ink border border-line-3 hover:bg-card-2 disabled:text-ink-3',
  ghost: 'bg-transparent text-ink-2 hover:text-ink hover:bg-card-2 disabled:text-ink-3',
  // Destructif : contour rouge, plein seulement au survol / focus.
  danger:
    'bg-card text-alert-ink border border-alert/60 hover:bg-alert hover:text-alert-on hover:border-alert focus-visible:bg-alert focus-visible:text-alert-on disabled:opacity-50',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 pointer-coarse:h-11 px-3 text-[14px] gap-1.5',
  md: 'h-11 px-4 text-[15px] gap-2',
  lg: 'h-12 px-5 text-[16px] gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, iconRight, block, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-[var(--radius-ctl)] font-semibold whitespace-nowrap',
        'transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANT[variant],
        SIZE[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'md' | 'sm';
  badge?: number;
  badgeTone?: 'alert' | 'warn';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', badge, badgeTone = 'alert', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={badge ? `${label} (${badge})` : label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-card-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40',
        size === 'md' ? 'h-11 w-11' : 'h-9 w-9 pointer-coarse:h-11 pointer-coarse:w-11',
        className,
      )}
      {...rest}
    >
      {children}
      {badge ? (
        <span
          aria-hidden="true"
          className={cn(
            'absolute right-1 top-1 h-[18px] min-w-[18px] rounded-full px-1 text-center text-[11px] font-bold leading-[18px] tnum ring-2 ring-card',
            badgeTone === 'alert' ? 'bg-alert-strong text-alert-on' : 'bg-warn text-warn-on',
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  );
});
