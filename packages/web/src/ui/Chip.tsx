import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Chip — 小型分類標籤、比 Badge 更扁
 *
 * 用於：肌群標籤、難度、器材、filter chips。
 *
 * 設計：對應 §13 / §15 mockup 的 MuscleChip。
 * - 預設樣式 = 小型 caps 風格（uppercase tracking-wide、9.5-11px）
 * - tone="primary" = primary-soft 背景 + primary 文字（主肌群用）
 */

export type ChipTone = 'default' | 'primary' | 'muted' | 'outline';
export type ChipSize = 'xs' | 'sm';

const toneClasses: Record<ChipTone, string> = {
  default: 'bg-secondary text-foreground/80',
  primary: 'bg-[hsl(var(--primary)/0.10)] text-primary',
  muted: 'bg-secondary text-muted-foreground',
  outline: 'border border-border bg-card text-muted-foreground',
};

const sizeClasses: Record<ChipSize, string> = {
  xs: 'px-1.5 py-0.5 text-[9.5px] tracking-[1px]',
  sm: 'px-2 py-0.5 text-[10.5px] tracking-[0.6px]',
};

export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
  size?: ChipSize;
  uppercase?: boolean;
};

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, tone = 'default', size = 'xs', uppercase = true, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-sm font-bold',
        toneClasses[tone],
        sizeClasses[size],
        uppercase && 'uppercase',
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = 'Chip';
