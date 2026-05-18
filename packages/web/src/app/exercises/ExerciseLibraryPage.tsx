import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { BODY_PARTS, type BodyPart } from '@fitforge/core';
import { PageHeader } from '@/app/_layout/PageHeader';
import { useExercises } from '@/features/exercises/useExercises';
import { ExerciseCard } from '@/features/exercises/ExerciseCard';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { Skeleton } from '@/ui/Skeleton';
import { cn } from '@/lib/cn';
import { bodyPartLabel } from '@/lib/labels';

/**
 * ExerciseLibraryPage — §13
 *
 * 對應 docs/design/screens/13-exercise-library.{html,jsx}。
 */
type FilterChip = BodyPart | 'all';

const CHIP_ORDER: FilterChip[] = ['all', ...BODY_PARTS];

const CHIP_LABEL: Record<FilterChip, string> = {
  all: '全部',
  ...Object.fromEntries(BODY_PARTS.map((bp) => [bp, bodyPartLabel(bp)])),
} as Record<FilterChip, string>;

export function ExerciseLibraryPage() {
  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState<FilterChip>('all');

  const { data: exercises, isLoading } = useExercises({
    bodyPart,
    search: query || undefined,
  });

  const total = exercises?.length ?? 0;
  const hasActiveFilter = bodyPart !== 'all' || query.length > 0;

  const clearAll = () => {
    setBodyPart('all');
    setQuery('');
  };

  return (
    <>
      <PageHeader title="動作圖庫" />

      {/* Sticky filter bar */}
      <div className="sticky top-[60px] z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-md space-y-3 px-4 py-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2.2}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋動作 (中英皆可)"
              className={cn(
                'h-10 w-full rounded-md bg-secondary py-2 pl-9 pr-9 text-[14px] font-medium',
                'outline-none transition-colors focus:ring-2 focus:ring-ring',
                'placeholder:text-muted-foreground',
              )}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="清除搜尋"
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-card"
              >
                <X size={13} strokeWidth={2.4} />
              </button>
            ) : null}
          </div>

          {/* Chips */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CHIP_ORDER.map((c) => {
              const isActive = c === bodyPart;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBodyPart(c)}
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] font-bold tracking-[-0.005em]',
                    'transition-all duration-200 ease-forge',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-ds-sm'
                      : 'bg-secondary text-foreground hover:bg-secondary/70',
                  )}
                >
                  {CHIP_LABEL[c]}
                </button>
              );
            })}
          </div>

          {/* Counter row (only when filtering) */}
          {hasActiveFilter ? (
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[1.4px]">
              <span className="num text-muted-foreground">{total} 個動作</span>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <X size={12} strokeWidth={2.6} />
                清除
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-md px-4 py-4">
        {isLoading ? (
          <Skeleton variant="grid" count={6} />
        ) : total === 0 ? (
          <EmptyState
            art={<Search className="h-7 w-7" strokeWidth={2} />}
            title="找不到符合的動作"
            description="V1 還沒有這個組合 — 試試別的肌群、或先清掉篩選看看全部 30 個動作。"
            action={
              <Button variant="primary" size="md" onClick={clearAll}>
                <X size={14} strokeWidth={2.4} />
                清除全部篩選
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {exercises!.map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

