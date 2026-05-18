import { Link } from 'react-router-dom';
import type { Exercise } from '@fitforge/core';
import { Chip } from '@/ui/Chip';
import { cn } from '@/lib/cn';
import { bodyPartLabel, muscleLabel } from '@/lib/labels';
import { ExerciseAnimation } from './ExerciseAnimation';

type Props = {
  exercise: Exercise;
  /** 點擊時的覆蓋行為（多選模式用）；不傳則導向 detail page */
  onClick?: () => void;
  /** 多選模式 — 顯示 checkbox + selected 樣式 */
  selected?: boolean;
  selectable?: boolean;
};

/**
 * ExerciseCard — 動作圖庫項目卡片
 *
 * 對應 docs/design/screens/13-exercise-library.jsx 的 ExerciseCard。
 */
export function ExerciseCard({ exercise, onClick, selected, selectable }: Props) {
  const primary = exercise.muscles[0];
  const secondary = exercise.muscles[1];

  const inner = (
    <article
      className={cn(
        'relative flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-all',
        'hover:border-border/80 hover:shadow-ds-sm active:scale-[0.98]',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
      )}
    >
      {/* Thumb area */}
      <div className="relative">
        <ExerciseAnimation
          exercise={exercise}
          size={160}
          animate
          className="!w-full !h-[120px] rounded-none"
        />
        {selectable ? (
          <div
            className={cn(
              'absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border-2 transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card/80 text-transparent',
            )}
          >
            {selected ? '✓' : ''}
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 px-3 py-3">
        <div className="flex items-start justify-between gap-1">
          <h4 className="line-clamp-1 flex-1 text-[14px] font-extrabold leading-tight tracking-[-0.015em] text-foreground">
            {exercise.nameZh}
          </h4>
        </div>
        <p className="line-clamp-1 text-[10.5px] font-medium leading-tight text-muted-foreground">
          {exercise.nameEn}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1">
          {primary ? (
            <Chip tone="primary">{muscleLabel(primary)}</Chip>
          ) : (
            <Chip tone="primary">{bodyPartLabel(exercise.bodyPart)}</Chip>
          )}
          {secondary ? <Chip>{muscleLabel(secondary)}</Chip> : null}
        </div>
      </div>
    </article>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {inner}
      </button>
    );
  }
  return (
    <Link to={`/exercises/${exercise.slug}`} className="block">
      {inner}
    </Link>
  );
}
