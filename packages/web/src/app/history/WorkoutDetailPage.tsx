import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Play, RotateCcw, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import type { Exercise, Workout, WorkoutExercise } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { useRxQuery } from '@/lib/rxdb/useRxQuery';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { useUiStore } from '@/stores/uiStore';
import { formatDuration } from '@/lib/time/formatDuration';
import { muscleLabel } from '@/lib/labels';
import { cn } from '@/lib/cn';

/**
 * WorkoutDetailPage — §18
 *
 * 對應 docs/design/screens/18-workout-detail.html
 *
 * Read-only 歷史單次訓練 + 「對比上次此動作」delta + 「重做這個訓練」CTA
 */
export function WorkoutDetailPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const core = useCore();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);

  const workoutQ = useRxQuery(
    () => (workoutId ? core.workoutRepo.observe(workoutId) : null),
    [core, workoutId],
  );
  const workout = workoutQ.data;

  // Hydrate exercise lookup
  const [exerciseMap, setExerciseMap] = useState<Map<string, Exercise>>(new Map());
  useEffect(() => {
    if (!workout) return;
    const ids = Array.from(new Set(workout.exercises.map((we) => we.exerciseId)));
    core.exerciseRepo
      .getMany(ids)
      .then((exs) => setExerciseMap(new Map(exs.map((e) => [e.id, e]))));
  }, [core, workout]);

  // Compute previous-set comparisons (find each exercise's previous occurrence)
  const [previousMap, setPreviousMap] = useState<Map<string, WorkoutExercise | null>>(new Map());
  useEffect(() => {
    if (!workout) return;
    (async () => {
      const all = await core.workoutRepo.listByStatus('completed', workout.userId);
      const earlier = all.filter(
        (w) =>
          w.id !== workout.id &&
          new Date(w.startedAt).getTime() < new Date(workout.startedAt).getTime(),
      );
      const map = new Map<string, WorkoutExercise | null>();
      for (const we of workout.exercises) {
        let found: WorkoutExercise | null = null;
        for (const prior of earlier) {
          const match = prior.exercises.find((p) => p.exerciseId === we.exerciseId);
          if (match) {
            found = match;
            break;
          }
        }
        map.set(we.id, found);
      }
      setPreviousMap(map);
    })();
  }, [core, workout]);

  // Summary
  const summary = useMemo(() => (workout ? core.stats.computeSummary(workout) : null), [
    core,
    workout,
  ]);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (workoutQ.isLoading || !workout) {
    return (
      <>
        <PageHeader title="" back="/history" />
        <div className="mx-auto max-w-md p-4">
          <Card className="h-44 animate-pulse" />
        </div>
      </>
    );
  }

  if (workout.status === 'in_progress') {
    return <Navigate to={`/workout/${workout.id}`} replace />;
  }

  const date = new Date(workout.startedAt);
  const dateLabel = date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const handleDelete = async () => {
    setConfirmDelete(false);
    await core.workoutRepo.softDelete(workout.id);
    pushToast({ kind: 'info', message: '已移除紀錄' });
    navigate('/history', { replace: true });
  };

  const handleRedo = () => {
    if (workout.planId && workout.planDayId) {
      navigate(`/workout/new?planId=${workout.planId}&dayId=${workout.planDayId}`);
    } else {
      // ad_hoc: go to ad-hoc builder
      navigate('/workout/adhoc');
    }
  };

  return (
    <>
      <PageHeader
        title={workout.name}
        subtitle={dateLabel}
        back="/history"
        rightSlot={
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="刪除"
            className="-mr-2 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={18} strokeWidth={2.2} />
          </button>
        }
      />

      <div className="mx-auto max-w-md space-y-4 p-4 pb-32">
        {/* Hero */}
        <Card className="p-5">
          {workout.status === 'abandoned' ? (
            <Chip tone="muted" size="sm" className="mb-2">
              已放棄
            </Chip>
          ) : null}
          {workout.mode === 'ad_hoc' ? (
            <Chip tone="outline" size="sm" className="mb-2">
              自由訓練
            </Chip>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="時長" value={formatDuration(workout.durationSeconds)} />
            <Stat
              label="總噸位"
              value={Math.round(summary?.totalVolume ?? 0).toLocaleString('zh-TW')}
              unit="kg"
            />
            <Stat
              label="完成組"
              value={`${summary?.completedSets ?? 0}`}
              unit={`/${summary?.totalSets ?? 0}`}
            />
          </div>
        </Card>

        {/* Exercise breakdown with comparison */}
        <section>
          <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            動作明細 · 含對比上次
          </h3>
          <div className="space-y-2">
            {workout.exercises.map((we) => (
              <ExerciseDetailCard
                key={we.id}
                we={we}
                exercise={exerciseMap.get(we.exerciseId)}
                previous={previousMap.get(we.id) ?? null}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Sticky redo CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-safe backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <Button block size="lg" onClick={handleRedo}>
            <RotateCcw size={16} strokeWidth={2.4} />
            重做這個訓練
          </Button>
        </div>
      </div>

      {confirmDelete ? (
        <DeleteConfirm onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Stat
// ---------------------------------------------------------------------------

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className="num text-[22px] font-extrabold tabular-nums tracking-[-0.02em]">
          {value}
        </span>
        {unit ? <span className="text-[11.5px] font-semibold text-muted-foreground">{unit}</span> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExerciseDetailCard
// ---------------------------------------------------------------------------

function ExerciseDetailCard({
  we,
  exercise,
  previous,
}: {
  we: WorkoutExercise;
  exercise: Exercise | undefined;
  previous: WorkoutExercise | null;
}) {
  const [showCompare, setShowCompare] = useState(false);
  const completed = we.sets.filter((s) => s.isCompleted);

  const thisVolume = volume(we);
  const prevVolume = previous ? volume(previous) : 0;
  const delta = prevVolume > 0 ? ((thisVolume - prevVolume) / prevVolume) * 100 : null;
  const deltaPositive = delta != null && delta >= 0;

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-bold">{exercise?.nameZh ?? we.exerciseId}</div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {exercise?.nameEn}
          </div>
        </div>
        {exercise?.muscles[0] ? (
          <Chip tone="primary" size="xs">
            {muscleLabel(exercise.muscles[0])}
          </Chip>
        ) : null}
      </div>

      {/* Set table */}
      {completed.length > 0 ? (
        <table className="num mt-2 w-full text-[12.5px] tabular-nums">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-[1.4px] text-muted-foreground">
              <th className="font-bold">組</th>
              <th className="text-right font-bold">重量 × 次</th>
              <th className="text-right font-bold">RPE</th>
            </tr>
          </thead>
          <tbody>
            {completed.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="py-1.5">{s.setNumber}</td>
                <td className="py-1.5 text-right font-bold">
                  {s.weight}
                  <span className="text-[10.5px] text-muted-foreground">
                    {s.weightUnit}
                  </span>{' '}
                  × {s.reps}
                </td>
                <td className="py-1.5 text-right text-muted-foreground">
                  {s.rpe ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-2 text-[11.5px] text-muted-foreground">未完成</p>
      )}

      {/* Compare to previous */}
      {previous ? (
        <button
          type="button"
          onClick={() => setShowCompare((v) => !v)}
          className="mt-3 flex w-full items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-left transition-colors hover:bg-secondary"
        >
          <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <span>對比上次此動作</span>
            {delta != null ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] font-bold',
                  deltaPositive
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {deltaPositive ? (
                  <TrendingUp size={10} strokeWidth={2.6} />
                ) : (
                  <TrendingDown size={10} strokeWidth={2.6} />
                )}
                {deltaPositive ? '+' : ''}
                {delta.toFixed(1)}%
              </span>
            ) : null}
          </div>
          {showCompare ? (
            <ChevronUp size={14} className="text-muted-foreground" strokeWidth={2.2} />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" strokeWidth={2.2} />
          )}
        </button>
      ) : (
        <p className="mt-3 rounded-md bg-secondary/40 px-3 py-2 text-[11.5px] text-muted-foreground">
          這個動作沒有上次紀錄、是第一次
        </p>
      )}

      {/* Compare expanded */}
      {showCompare && previous ? (
        <div className="mt-2 space-y-1.5 rounded-md border border-dashed border-border bg-secondary/30 p-3">
          {previous.sets
            .filter((s) => s.isCompleted)
            .map((s) => (
              <div
                key={s.id}
                className="num flex items-baseline justify-between text-[12px] text-muted-foreground"
              >
                <span>上次 SET {s.setNumber}</span>
                <span className="font-bold">
                  {s.weight}
                  {s.weightUnit} × {s.reps}
                  {s.rpe ? <span className="ml-1.5 text-[10.5px]">RPE {s.rpe}</span> : null}
                </span>
              </div>
            ))}
        </div>
      ) : null}
    </Card>
  );
}

function volume(we: WorkoutExercise): number {
  let v = 0;
  for (const s of we.sets) {
    if (!s.isCompleted) continue;
    const w = s.weightUnit === 'lb' ? s.weight * 0.4536 : s.weight;
    v += w * s.reps;
  }
  return v;
}

// ---------------------------------------------------------------------------
// Delete confirm
// ---------------------------------------------------------------------------

function DeleteConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-sm p-5 text-center shadow-ds-lg">
        <h3 className="text-[16px] font-bold">移除這筆訓練？</h3>
        <p className="mt-2 text-[13px] text-muted-foreground">軟刪除、可從匯出 JSON 復原。</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="md" block onClick={onCancel}>
            取消
          </Button>
          <Button variant="destructive" size="md" block onClick={onConfirm}>
            移除
          </Button>
        </div>
      </Card>
    </div>
  );
}
