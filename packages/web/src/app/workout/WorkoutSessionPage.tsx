import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  ChevronUp,
  Maximize2,
  Plus,
  Repeat,
  SkipForward,
  Target,
  Trash2,
} from 'lucide-react';
import type {
  Exercise,
  Set as WorkoutSetT,
  Workout,
  WorkoutExercise,
} from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { useRxQuery } from '@/lib/rxdb/useRxQuery';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { t } from '@/lib/i18n';
import { Sheet } from '@/ui/Sheet';
import { NumberStepper } from '@/ui/NumberStepper';
import { ExerciseAnimation } from '@/features/exercises/ExerciseAnimation';
import { AddExerciseSheet } from '@/features/workout/AddExerciseSheet';
import { SwapExerciseSheet } from '@/features/workout/SwapExerciseSheet';
import { useRestTick } from '@/features/workout/useRestTick';
import { useWakeLock } from '@/features/workout/useWakeLock';
import { useSessionStore } from '@/stores/sessionStore';
import { useUiStore } from '@/stores/uiStore';
import { formatDuration } from '@/lib/time/formatDuration';
import { muscleLabel } from '@/lib/labels';
import { cn } from '@/lib/cn';

/**
 * WorkoutSessionPage — §15 ⭐ MVP 核心
 *
 * 對應 docs/design/screens/15-workout-session.{html,jsx}。
 *
 * State machine (對應 WorkoutEngineState):
 * - active : 顯示 MainVisual + Steppers + CTA
 * - resting: 顯示 RestOverlay 覆蓋
 * - all-done: 自動顯示「結束訓練」CTA
 */
export function WorkoutSessionPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const core = useCore();
  const navigate = useNavigate();

  // Subscribe to workout doc (reactive)
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
    core.exerciseRepo.getMany(ids).then((exs) => {
      setExerciseMap(new Map(exs.map((e) => [e.id, e])));
    });
  }, [core, workout]);

  // Wake lock during workout
  useWakeLock(workout?.status === 'in_progress');

  // Loading / not-found gates
  if (workoutQ.isLoading) {
    return <FullScreenLoader />;
  }
  if (!workout) {
    return <Navigate to="/today" replace />;
  }
  if (workout.status === 'completed') {
    return <Navigate to={`/workout/${workout.id}/summary`} replace />;
  }
  if (workout.status === 'abandoned') {
    return <Navigate to="/today" replace />;
  }

  return <ActiveSession workout={workout} exerciseMap={exerciseMap} navigate={navigate} />;
}

// ===========================================================================
// Active Session
// ===========================================================================

type ActiveSessionProps = {
  workout: Workout;
  exerciseMap: Map<string, Exercise>;
  navigate: ReturnType<typeof useNavigate>;
};

function ActiveSession({ workout, exerciseMap, navigate }: ActiveSessionProps) {
  const core = useCore();
  const pushToast = useUiStore((s) => s.pushToast);
  const sessionStore = useSessionStore();

  // === Locate current cursor ===
  const cursor = useMemo(() => findCurrentCursor(workout), [workout]);
  const allDone = cursor == null;

  const currentWE = cursor ? workout.exercises[cursor.exerciseIdx] : null;
  const currentSet = cursor && currentWE ? currentWE.sets[cursor.setIdx] : null;
  const currentEx = currentWE ? exerciseMap.get(currentWE.exerciseId) : null;

  // Last completed set (for default values)
  const lastCompletedSet = useMemo(
    () => (currentWE ? findLastCompletedSet(currentWE) : null),
    [currentWE],
  );

  // === Local input state ===
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [rpe, setRpe] = useState<number | null>(null);

  // When cursor moves, repopulate defaults from plan / last set
  useEffect(() => {
    if (!currentWE) return;
    const defaultReps = lastCompletedSet?.reps ?? 8;
    const defaultWeight = lastCompletedSet?.weight ?? 20;
    setWeight(defaultWeight);
    setReps(defaultReps);
    setRpe(null);
  }, [currentWE?.id, cursor?.setIdx, lastCompletedSet?.id]);

  // === Timer ticks ===
  const [elapsed, setElapsed] = useState(() => calcElapsed(workout.startedAt));
  useEffect(() => {
    const id = window.setInterval(() => setElapsed(calcElapsed(workout.startedAt)), 1000);
    return () => window.clearInterval(id);
  }, [workout.startedAt]);

  // Rest tick
  useRestTick();

  // === Confirms ===
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState<
    { workoutExerciseId: string; exerciseId: string } | null
  >(null);

  // === Remove exercise action (from inside ExerciseListSheet) ===
  const removeExercise = async (workoutExerciseId: string) => {
    const r = await core.workoutEngine.removeExercise({
      workoutId: workout.id,
      workoutExerciseId,
    });
    if (!r.ok) {
      pushToast({
        kind: 'error',
        message:
          r.error.code === 'CANNOT_REMOVE_WITH_COMPLETED_SETS'
            ? '已有完成的組、不能移除'
            : `移除失敗 (${r.error.code})`,
      });
      return;
    }
    pushToast({ kind: 'info', message: '已移除動作' });
  };

  // === Actions ===
  const completeSet = async () => {
    if (!currentWE || !currentSet) return;
    if (weight === 0 && reps === 0) {
      pushToast({ kind: 'warning', message: '重量與次數不能都是 0' });
      return;
    }
    const result = await core.workoutEngine.logSet({
      workoutId: workout.id,
      weight,
      reps,
      rpe: rpe ?? undefined,
    });
    if (!result.ok) {
      pushToast({ kind: 'error', message: `紀錄失敗 (${result.error.code})` });
      return;
    }
    // Start rest countdown
    if (result.value.restSeconds > 0 && result.value.nextSet) {
      sessionStore.startRest(result.value.restSeconds);
    }
  };

  const skipSet = async () => {
    if (!currentWE) return;
    const r = await core.workoutEngine.skipSet(workout.id);
    if (!r.ok) pushToast({ kind: 'error', message: `跳過失敗 (${r.error.code})` });
  };

  const finishWorkout = async () => {
    setConfirmingFinish(false);
    const r = await core.workoutEngine.finish(workout.id);
    if (!r.ok) {
      pushToast({ kind: 'error', message: `結束失敗 (${r.error.code})` });
      return;
    }
    sessionStore.setActiveWorkoutId(null);
    sessionStore.skipRest();
    navigate(`/workout/${workout.id}/summary`, { replace: true });
  };

  // === Render ===
  const completedSetsCount = workout.exercises.reduce(
    (n, we) => n + we.sets.filter((s) => s.isCompleted).length,
    0,
  );
  const totalSetsCount = workout.exercises.reduce((n, we) => n + we.sets.length, 0);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Slim header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur pt-safe">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="num text-[17px] font-extrabold tabular-nums leading-tight tracking-[-0.01em]">
              {formatTime(elapsed)}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">{workout.name}</div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmingFinish(true)}
            className="text-[13px] font-bold text-destructive hover:underline"
          >
            結束
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-md flex-1 overflow-y-auto pb-32">
        {allDone ? (
          <AllDoneState onFinish={() => setConfirmingFinish(true)} />
        ) : currentWE && currentSet && currentEx ? (
          <>
            <MainVisual
              we={currentWE}
              set={currentSet}
              exercise={currentEx}
              lastSet={lastCompletedSet}
            />

            <div className="flex gap-2 px-4 pt-4">
              <NumberStepper
                label="重量"
                unit={currentSet.weightUnit}
                value={weight}
                onChange={setWeight}
                step={2.5}
                precision={1}
              />
              <NumberStepper
                label="次數"
                unit="reps"
                value={reps}
                onChange={setReps}
                step={1}
              />
            </div>

            <RpeSelector value={rpe} onChange={setRpe} />

            <div className="px-4 pt-4">
              <button
                type="button"
                onClick={completeSet}
                className="flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[18px] font-extrabold tracking-[-0.005em] text-primary-foreground shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.40)] transition-all active:scale-[0.99]"
              >
                <Check size={22} strokeWidth={2.8} />
                完成這組
              </button>
            </div>

            <SecondaryActions
              onSkip={skipSet}
              onAdd={() => setAddSheetOpen(true)}
              onOpenList={() => setSheetOpen(true)}
            />
          </>
        ) : (
          <FullScreenLoader />
        )}

        {/* Sheet peek */}
        {!allDone ? (
          <SheetPeek
            workout={workout}
            exerciseMap={exerciseMap}
            completed={completedSetsCount}
            total={totalSetsCount}
            onOpen={() => setSheetOpen(true)}
          />
        ) : null}
      </main>

      {/* Bottom sheet — exercise list (read + swap/remove) */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={`動作列表 · ${completedSetsCount}/${totalSetsCount} 組`}
      >
        <ExerciseListSheet
          workout={workout}
          exerciseMap={exerciseMap}
          currentIdx={cursor?.exerciseIdx ?? -1}
          onSwap={(we) => {
            setSheetOpen(false);
            setSwapTarget({ workoutExerciseId: we.id, exerciseId: we.exerciseId });
          }}
          onRemove={(we) => removeExercise(we.id)}
        />
      </Sheet>

      {/* Add exercise sheet — §28 */}
      <AddExerciseSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        workoutId={workout.id}
      />

      {/* Swap exercise sheet — §28 */}
      {swapTarget ? (
        <SwapExerciseSheet
          open={true}
          onClose={() => setSwapTarget(null)}
          workoutId={workout.id}
          workoutExerciseId={swapTarget.workoutExerciseId}
          currentExerciseId={swapTarget.exerciseId}
        />
      ) : null}

      {/* Rest overlay */}
      <RestOverlay
        nextSet={cursor ? buildPreviewLabel(workout, cursor) : null}
        lastSet={lastCompletedSet}
      />

      {/* Finish confirm — §22.1 中度破壞、CTA 用 primary 色 */}
      <ConfirmDialog
        open={confirmingFinish}
        variant="primary"
        title={t('workout.finishConfirmTitle')}
        description={t('workout.finishConfirmBody')}
        meta={
          <span className="inline-flex items-center gap-3 rounded-[10px] bg-muted px-3.5 py-2 text-[12px]">
            <span className="num font-medium">
              {t('workout.finishConfirmMetaSaved', { count: completedSetsCount })}
            </span>
            <span className="opacity-40">·</span>
            <span className="num font-medium text-muted-foreground">
              {t('workout.finishConfirmMetaLost', {
                count: totalSetsCount - completedSetsCount,
              })}
            </span>
          </span>
        }
        confirmLabel={t('workout.finishConfirmCta')}
        cancelLabel={t('workout.finishConfirmCancel')}
        onCancel={() => setConfirmingFinish(false)}
        onConfirm={finishWorkout}
      />
    </div>
  );
}

// ===========================================================================
// MainVisual
// ===========================================================================

function MainVisual({
  we,
  set,
  exercise,
  lastSet,
}: {
  we: WorkoutExercise;
  set: WorkoutSetT;
  exercise: Exercise;
  lastSet: WorkoutSetT | null;
}) {
  return (
    <section className="px-4 pt-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {/* set indicator */}
          <div className="inline-flex items-baseline gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
              第
            </span>
            <span className="num text-[20px] font-extrabold tracking-[-0.02em] text-primary">
              {set.setNumber}
            </span>
            <span className="text-[14px] font-bold tracking-[-0.01em] text-muted-foreground">
              / {we.sets.length}
            </span>
            <span className="ml-0.5 text-[10.5px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
              組
            </span>
          </div>

          <h2 className="mt-1 text-[24px] font-extrabold leading-[1.1] tracking-[-0.025em] text-foreground">
            {exercise.nameZh}
          </h2>
          <div className="text-[11.5px] font-medium leading-tight text-muted-foreground">
            {exercise.nameEn}
          </div>

          {lastSet ? (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1">
              <Target size={12} strokeWidth={2.4} className="text-primary" />
              <span className="num text-[12px] font-bold tracking-[-0.005em] text-foreground">
                上次 {lastSet.weight}{lastSet.weightUnit} × {lastSet.reps}
              </span>
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1">
              <Target size={12} strokeWidth={2.4} className="text-primary" />
              <span className="text-[12px] font-bold text-foreground">第一組、放輕鬆</span>
            </div>
          )}
        </div>

        {/* Mini thumb */}
        <button
          type="button"
          className="relative grid h-[76px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary"
          aria-label="放大示範"
        >
          <ExerciseAnimation exercise={exercise} size={76} animate className="!h-[76px] !w-[76px] rounded-xl" />
          <span className="absolute bottom-1 right-1 grid h-[18px] w-[18px] place-items-center rounded-full bg-background/85 text-foreground">
            <Maximize2 size={9} strokeWidth={2.6} />
          </span>
        </button>
      </div>
    </section>
  );
}

// ===========================================================================
// RPE Selector
// ===========================================================================

function RpeSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const toneFor = (n: number): 'success' | 'warning' | 'primary' => {
    if (n <= 5) return 'success';
    if (n <= 8) return 'warning';
    return 'primary';
  };

  return (
    <section className="px-4 pt-3">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
          RPE · 這組多難
        </span>
        <span className="text-[10px] font-medium text-muted-foreground/70">可選</span>
      </div>
      <div className="mt-2 grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = n === value;
          const tone = toneFor(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(active ? null : n)}
              className={cn(
                'num grid aspect-square items-center justify-center rounded-md text-[13px] font-extrabold tabular-nums transition-all',
                active
                  ? tone === 'success'
                    ? 'bg-success text-success-foreground shadow-[0_4px_10px_-3px_hsl(var(--success)/0.45)]'
                    : tone === 'warning'
                      ? 'bg-warning text-warning-foreground shadow-[0_4px_10px_-3px_hsl(var(--warning)/0.45)]'
                      : 'bg-primary text-primary-foreground shadow-[0_4px_10px_-3px_hsl(var(--primary)/0.45)]'
                  : 'bg-secondary text-foreground',
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ===========================================================================
// Secondary Actions
// ===========================================================================

function SecondaryActions({
  onSkip,
  onAdd,
  onOpenList,
}: {
  onSkip: () => void;
  onAdd: () => void;
  onOpenList: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-around px-4">
      <SecondaryButton
        icon={<SkipForward size={18} strokeWidth={2.2} />}
        label="跳過這組"
        onClick={onSkip}
      />
      <SecondaryButton
        icon={<Plus size={18} strokeWidth={2.4} />}
        label="加動作"
        onClick={onAdd}
      />
      <SecondaryButton
        icon={<ChevronUp size={18} strokeWidth={2.4} />}
        label="動作列表"
        onClick={onOpenList}
      />
    </div>
  );
}

function SecondaryButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-1 px-3 py-1.5 text-[11px] font-bold transition-colors',
        disabled ? 'opacity-40' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ===========================================================================
// Sheet peek + ExerciseListSheet
// ===========================================================================

function SheetPeek({
  workout,
  exerciseMap,
  completed,
  total,
  onOpen,
}: {
  workout: Workout;
  exerciseMap: Map<string, Exercise>;
  completed: number;
  total: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-6 flex w-full items-center justify-between gap-3 border-t border-border bg-card/40 px-4 py-3 text-left"
    >
      <div className="flex flex-wrap gap-1">
        {workout.exercises.map((we, i) => {
          const done = we.sets.every((s) => s.isCompleted);
          const partial = we.sets.some((s) => s.isCompleted) && !done;
          return (
            <span
              key={we.id}
              className={cn(
                'h-2 w-2 rounded-full',
                done ? 'bg-primary' : partial ? 'bg-primary/50' : 'bg-border',
              )}
              title={exerciseMap.get(we.exerciseId)?.nameZh}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <span className="num font-bold">
          {completed}/{total}
        </span>
        <ChevronUp size={14} strokeWidth={2.2} />
      </div>
    </button>
  );
}

function ExerciseListSheet({
  workout,
  exerciseMap,
  currentIdx,
  onSwap,
  onRemove,
}: {
  workout: Workout;
  exerciseMap: Map<string, Exercise>;
  currentIdx: number;
  onSwap: (we: WorkoutExercise) => void;
  onRemove: (we: WorkoutExercise) => void;
}) {
  return (
    <ul className="divide-y divide-border">
      {workout.exercises.map((we, i) => {
        const ex = exerciseMap.get(we.exerciseId);
        const completed = we.sets.filter((s) => s.isCompleted).length;
        const total = we.sets.length;
        const isCurrent = i === currentIdx;
        const allDone = completed === total && total > 0;
        const hasCompleted = completed > 0;
        return (
          <li key={we.id} className="flex items-center gap-3 px-5 py-3">
            <div
              className={cn(
                'num grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-extrabold',
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : allDone
                    ? 'bg-success text-success-foreground'
                    : 'bg-secondary text-muted-foreground',
              )}
            >
              {allDone ? <Check size={14} strokeWidth={2.6} /> : i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-bold text-foreground">
                {ex?.nameZh ?? we.exerciseId}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                <span className="num">
                  {completed} / {total} 組
                </span>
                {ex && ex.muscles[0] ? (
                  <Chip tone="primary" size="xs">
                    {muscleLabel(ex.muscles[0])}
                  </Chip>
                ) : null}
                {we.source !== 'from_plan' ? (
                  <Chip tone="outline" size="xs">
                    {we.source === 'added_during_session'
                      ? '訓練中加'
                      : we.source === 'swapped'
                        ? '換的'
                        : '自由'}
                  </Chip>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onSwap(we)}
                disabled={hasCompleted}
                title={hasCompleted ? '已有完成的組、無法替換' : '替換動作'}
                aria-label="替換"
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-md transition-colors',
                  hasCompleted
                    ? 'cursor-not-allowed text-muted-foreground/40'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Repeat size={16} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => onRemove(we)}
                disabled={hasCompleted}
                title={hasCompleted ? '已有完成的組、無法移除' : '移除動作'}
                aria-label="移除"
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-md transition-colors',
                  hasCompleted
                    ? 'cursor-not-allowed text-muted-foreground/40'
                    : 'text-destructive hover:bg-destructive/10',
                )}
              >
                <Trash2 size={16} strokeWidth={2.2} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ===========================================================================
// RestOverlay
// ===========================================================================

function RestOverlay({
  nextSet,
  lastSet,
}: {
  nextSet: string | null;
  lastSet: WorkoutSetT | null;
}) {
  const remaining = useSessionStore((s) => s.restRemainingSec);
  const skipRest = useSessionStore((s) => s.skipRest);
  const extendRest = useSessionStore((s) => s.extendRest);
  const restEndsAt = useSessionStore((s) => s.restEndsAt);

  if (!restEndsAt) return null;

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/95 px-6 backdrop-blur-sm">
      <div className="text-[11px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
        組間休息
      </div>
      <div className="num mt-2 text-[88px] font-extrabold tabular-nums leading-none tracking-[-0.04em] text-primary">
        {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
      </div>
      {nextSet ? (
        <div className="mt-3 text-[14px] text-foreground/80">下一組 · {nextSet}</div>
      ) : null}
      {lastSet ? (
        <div className="num mt-1.5 text-[12px] text-muted-foreground">
          上次 {lastSet.weight}
          {lastSet.weightUnit} × {lastSet.reps} ✓
        </div>
      ) : null}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={skipRest}
          className="rounded-md border border-border bg-card px-5 py-2.5 text-[13px] font-bold transition-colors hover:bg-secondary"
        >
          跳過
        </button>
        <button
          type="button"
          onClick={() => extendRest(15)}
          className="rounded-md border border-border bg-card px-5 py-2.5 text-[13px] font-bold transition-colors hover:bg-secondary"
        >
          +15 秒
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// All done state
// ===========================================================================

function AllDoneState({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="px-6 pt-16 text-center">
      <div className="mb-4 inline-grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
        <Check size={32} strokeWidth={2.5} />
      </div>
      <h2 className="text-[24px] font-extrabold tracking-[-0.025em]">所有組完成</h2>
      <p className="mt-2 text-[14px] text-muted-foreground">辛苦了！按下方按鈕結束、看完整摘要。</p>
      <Button size="xl" block onClick={onFinish} className="mt-6">
        結束訓練 · 看摘要
      </Button>
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================

function findCurrentCursor(workout: Workout): { exerciseIdx: number; setIdx: number } | null {
  for (let ei = 0; ei < workout.exercises.length; ei++) {
    const we = workout.exercises[ei]!;
    for (let si = 0; si < we.sets.length; si++) {
      if (!we.sets[si]!.isCompleted) return { exerciseIdx: ei, setIdx: si };
    }
  }
  return null;
}

function findLastCompletedSet(we: WorkoutExercise): WorkoutSetT | null {
  for (let i = we.sets.length - 1; i >= 0; i--) {
    if (we.sets[i]!.isCompleted) return we.sets[i]!;
  }
  return null;
}

function buildPreviewLabel(workout: Workout, cursor: { exerciseIdx: number; setIdx: number }): string {
  const we = workout.exercises[cursor.exerciseIdx];
  if (!we) return '';
  const set = we.sets[cursor.setIdx];
  if (!set) return '';
  return `第 ${set.setNumber} 組`;
}

function calcElapsed(startedAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
// avoid unused import warning in some configs
void formatDuration;
