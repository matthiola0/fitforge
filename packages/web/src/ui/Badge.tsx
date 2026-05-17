import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'outline';

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted text-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  outline: 'border border-border bg-card text-muted-foreground',
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-[0.02em]',
        badgeVariantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';
