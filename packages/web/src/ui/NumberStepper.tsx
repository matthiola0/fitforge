import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * NumberStepper — 大型數字輸入 (對應 §15 BigStepper)
 *
 * 訓練中 weight / reps 輸入用、巨大 touch target。
 */

type Props = {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  precision?: number;
  className?: string;
};

export function NumberStepper({
  label,
  unit,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  precision = 0,
  className,
}: Props) {
  const dec = () => onChange(Math.max(min, +(value - step).toFixed(precision + 2)));
  const inc = () => onChange(Math.min(max, +(value + step).toFixed(precision + 2)));

  const display = precision === 0 ? String(Math.round(value)) : value.toFixed(precision);

  return (
    <div
      className={cn(
        'flex-1 min-w-0 rounded-xl bg-card px-3 py-3',
        'border border-border',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
          {label}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground/70">
          {unit}
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={dec}
          aria-label={`${label}減`}
          className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-foreground/80 transition-colors hover:bg-secondary/70 active:scale-95"
        >
          <Minus size={18} strokeWidth={2.8} />
        </button>
        <span className="num text-[32px] font-extrabold tracking-[-0.03em] tabular-nums">
          {display}
        </span>
        <button
          type="button"
          onClick={inc}
          aria-label={`${label}加`}
          className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-foreground/80 transition-colors hover:bg-secondary/70 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
}
