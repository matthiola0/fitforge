import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Button — shadcn-style 對齊 FitForge 設計 tokens
 *
 * 不依賴 shadcn CLI、不依賴 class-variance-authority。
 */

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'destructive'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const baseClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ' +
  'transition-all duration-200 ease-forge ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'active:scale-[0.98]';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-ds-sm hover:bg-primary/90 hover:shadow-ds-md',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost:
    'bg-transparent text-foreground hover:bg-secondary',
  outline:
    'border border-border bg-card text-foreground hover:bg-secondary',
  destructive:
    'bg-destructive text-destructive-foreground shadow-ds-sm hover:bg-destructive/90',
  link:
    'bg-transparent text-primary underline-offset-4 hover:underline px-0 py-0 h-auto',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-md',
  md: 'h-11 px-4 text-[14px] rounded-md',
  lg: 'h-12 px-5 text-[15px] rounded-lg',
  xl: 'h-14 px-6 text-[16px] rounded-lg',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 整個寬度撐滿 */
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', block, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          block && 'w-full',
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
