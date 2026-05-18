import { cn } from '@/lib/cn';

/**
 * Skeleton — §23.2 載入狀態
 *
 * 三種 variant 對應真實內容形狀：
 * - "hero"  單個大卡片（Today 主訓練卡這類）
 * - "row"   訓練紀錄 / 設定 list — 多列 row
 * - "grid"  動作圖庫 — 2 欄 grid
 *
 * 規則：
 * - 形狀必須對應真實內容、最後 row opacity 0.6 暗示「往下還有」
 * - shimmer 1.6s linear、由左向右 (Tailwind animate-pulse 取代)
 * - prefers-reduced-motion 自動停 (Tailwind built-in)
 * - loading → loaded 用 200ms fade、不 pop
 */

type Props = {
  variant?: 'hero' | 'row' | 'grid';
  /** rows / cells 數量 (預設 row=4, grid=6) */
  count?: number;
  className?: string;
};

export function Skeleton({ variant = 'row', count, className }: Props) {
  if (variant === 'hero') {
    return <div className={cn('h-44 rounded-2xl bg-muted/60 animate-pulse', className)} />;
  }
  if (variant === 'grid') {
    const n = count ?? 6;
    return (
      <div className={cn('grid grid-cols-2 gap-3', className)}>
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'aspect-square rounded-xl bg-muted/60 animate-pulse',
              i === n - 1 && 'opacity-60',
            )}
          />
        ))}
      </div>
    );
  }
  // row (default)
  const n = count ?? 4;
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-16 rounded-xl bg-muted/60 animate-pulse',
            i === n - 1 && 'opacity-60',
          )}
        />
      ))}
    </div>
  );
}
