import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Minus,
  MoveDown,
  MoveUp,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type { Exercise, Plan, PlanDay, PlanExercise } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Sheet } from '@/ui/Sheet';
import { Input } from '@/ui/Input';
import { ExerciseThumb } from '@/features/exercises/ExerciseThumb';
import { useExercises } from '@/features/exercises/useExercises';
import { useUiStore } from '@/stores/uiStore';
import { bodyPartLabel, muscleLabel } from '@/lib/labels';
import { cn } from '@/lib/cn';

/**
 * PlanEditorPage — §12
 *
 * 對應 docs/design/screens/12-plan-editor.{html,jsx}。
 *
 * V1：name/desc/goal/frequency 編輯 + days 增減排序 + 每動作 stepper 調整 + 新增動作 sheet。
 * V2：完整 drag-and-drop (V1 用 ↑↓ 按鈕)。
 */
type GoalTag = NonNullable<Plan['goalTag']>;

const GOAL_OPTIONS: { value: GoalTag; label: string }[] = [
  { value: 'general', label: '一般體適能' },
  { value: 'hypertrophy', label: '增肌' },
  { value: 'strength', label: '增強力量' },
  { value: 'fatloss', label: '減脂' },
];

export function PlanEditorPage() {
  const { planId } = useParams<{ planId: string }>();
  const core = useCore();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);

  const [original, setOriginal] = useState<Plan | null>(null);
  const [draft, setDraft] = useState<Plan | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Map<string, Exercise>>(new Map());
  const [saving, setSaving] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  // Load
  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    (async () => {
      const p = await core.planRepo.get(planId);
      if (cancelled) return;
      if (!p) {
        pushToast({ kind: 'error', message: '找不到課表' });
        navigate('/plans', { replace: true });
        return;
      }
      if (p.isPreset) {
        pushToast({ kind: 'warning', message: '預設課表不可編輯、請先複製' });
        navigate(`/plans/${planId}`, { replace: true });
        return;
      }
      setOriginal(p);
      setDraft(p);
      const ids = Array.from(new Set(p.days.flatMap((d) => d.exercises.map((e) => e.exerciseId))));
      const exs = await core.exerciseRepo.getMany(ids);
      if (cancelled) return;
      setExerciseMap(new Map(exs.map((e) => [e.id, e])));
    })();
    return () => {
      cancelled = true;
    };
  }, [core, planId, navigate, pushToast]);

  const dirty = useMemo(() => {
    if (!original || !draft) return false;
    return JSON.stringify(stripVolatile(original)) !== JSON.stringify(stripVolatile(draft));
  }, [original, draft]);

  // Hydrate any newly-referenced exercises (after add)
  useEffect(() => {
    if (!draft) return;
    const ids = draft.days.flatMap((d) => d.exercises.map((e) => e.exerciseId));
    const missing = ids.filter((id) => !exerciseMap.has(id));
    if (missing.length === 0) return;
    core.exerciseRepo.getMany(Array.from(new Set(missing))).then((exs) => {
      setExerciseMap((prev) => {
        const next = new Map(prev);
        for (const e of exs) next.set(e.id, e);
        return next;
      });
    });
  }, [core, draft, exerciseMap]);

  // === Mutation helpers ===
  const update = (mutator: (d: Plan) => Plan) => setDraft((cur) => (cur ? mutator(cur) : cur));

  const updateBasic = (patch: Partial<Pick<Plan, 'name' | 'description' | 'goalTag' | 'frequencyPerWeek'>>) =>
    update((d) => ({ ...d, ...patch }));

  const addDay = () =>
    update((d) => ({
      ...d,
      days: [
        ...d.days,
        {
          id: core.idGen.next('pd'),
          order: d.days.length,
          name: `Day ${d.days.length + 1}`,
          focusMuscleGroups: [],
          exercises: [],
        },
      ],
    }));

  const removeDay = (dayId: string) =>
    update((d) => ({
      ...d,
      days: d.days.filter((x) => x.id !== dayId).map((x, i) => ({ ...x, order: i })),
    }));

  const moveDay = (dayId: string, dir: -1 | 1) =>
    update((d) => {
      const idx = d.days.findIndex((x) => x.id === dayId);
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= d.days.length) return d;
      const arr = [...d.days];
      [arr[idx], arr[newIdx]] = [arr[newIdx]!, arr[idx]!];
      return { ...d, days: arr.map((x, i) => ({ ...x, order: i })) };
    });

  const updateDay = (dayId: string, patch: Partial<PlanDay>) =>
    update((d) => ({
      ...d,
      days: d.days.map((x) => (x.id === dayId ? { ...x, ...patch } : x)),
    }));

  const addExerciseToDay = (dayId: string, exerciseId: string) => {
    const ex = exerciseMap.get(exerciseId);
    update((d) => ({
      ...d,
      days: d.days.map((x) => {
        if (x.id !== dayId) return x;
        const order = x.exercises.length;
        const defaults = defaultsByDifficulty(ex?.difficulty ?? 'beginner');
        const newPE: PlanExercise = {
          id: core.idGen.next('pe'),
          exerciseId,
          order,
          targetSets: defaults.sets,
          targetRepsMin: defaults.repsMin,
          targetRepsMax: defaults.repsMax,
          restSeconds: defaults.restSeconds,
          isSwappable: true,
          swapScope: 'same_muscle',
        };
        return { ...x, exercises: [...x.exercises, newPE] };
      }),
    }));
  };

  const removeExercise = (dayId: string, peId: string) =>
    update((d) => ({
      ...d,
      days: d.days.map((x) =>
        x.id !== dayId
          ? x
          : { ...x, exercises: x.exercises.filter((e) => e.id !== peId).map((e, i) => ({ ...e, order: i })) },
      ),
    }));

  const moveExercise = (dayId: string, peId: string, dir: -1 | 1) =>
    update((d) => ({
      ...d,
      days: d.days.map((x) => {
        if (x.id !== dayId) return x;
        const idx = x.exercises.findIndex((e) => e.id === peId);
        const newIdx = idx + dir;
        if (idx < 0 || newIdx < 0 || newIdx >= x.exercises.length) return x;
        const arr = [...x.exercises];
        [arr[idx], arr[newIdx]] = [arr[newIdx]!, arr[idx]!];
        return { ...x, exercises: arr.map((e, i) => ({ ...e, order: i })) };
      }),
    }));

  const updateExercise = (dayId: string, peId: string, patch: Partial<PlanExercise>) =>
    update((d) => ({
      ...d,
      days: d.days.map((x) =>
        x.id !== dayId
          ? x
          : { ...x, exercises: x.exercises.map((e) => (e.id === peId ? { ...e, ...patch } : e)) },
      ),
    }));

  // === Save / cancel ===
  const onSave = async () => {
    if (!draft) return;
    setSaving(true);
    const r = await core.planService.update(draft.id, draft);
    setSaving(false);
    if (!r.ok) {
      pushToast({
        kind: 'error',
        message: r.error.code === 'VALIDATION_FAILED' ? '驗證失敗、檢查欄位' : `儲存失敗 (${r.error.code})`,
      });
      return;
    }
    pushToast({ kind: 'success', message: '已儲存' });
    setOriginal(r.value);
    setDraft(r.value);
    navigate(`/plans/${draft.id}`);
  };

  const onClose = () => {
    if (dirty) {
      setConfirmExit(true);
      return;
    }
    navigate(`/plans/${planId}`);
  };

  if (!draft) {
    return (
      <>
        <PageHeader title="編輯課表" back />
        <div className="mx-auto max-w-md p-4">
          <div className="h-48 animate-pulse rounded-lg bg-muted/50" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="編輯課表"
        subtitle={dirty ? '未儲存的變更 · ' + draft.name : draft.name}
        back={false}
        rightSlot={
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        }
      />

      <div className="mx-auto max-w-md space-y-4 p-4 pb-32">
        <BasicFieldsCard draft={draft} onChange={updateBasic} />

        {draft.days.map((day, i) => (
          <DayEditorCard
            key={day.id}
            day={day}
            exerciseMap={exerciseMap}
            isFirst={i === 0}
            isLast={i === draft.days.length - 1}
            canRemove={draft.days.length > 1}
            onMove={(dir) => moveDay(day.id, dir)}
            onRemove={() => removeDay(day.id)}
            onChange={(patch) => updateDay(day.id, patch)}
            onAddExercise={(exerciseId) => addExerciseToDay(day.id, exerciseId)}
            onRemoveExercise={(peId) => removeExercise(day.id, peId)}
            onMoveExercise={(peId, dir) => moveExercise(day.id, peId, dir)}
            onUpdateExercise={(peId, patch) => updateExercise(day.id, peId, patch)}
          />
        ))}

        <Button variant="outline" block size="md" onClick={addDay}>
          <Plus size={16} strokeWidth={2.4} />
          新增訓練日
        </Button>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={onSave} onCancel={onClose} />

      {confirmExit ? (
        <ExitConfirm
          onCancel={() => setConfirmExit(false)}
          onDiscard={() => {
            setConfirmExit(false);
            navigate(`/plans/${planId}`);
          }}
          onSave={async () => {
            setConfirmExit(false);
            await onSave();
          }}
        />
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Basic fields
// ---------------------------------------------------------------------------

function BasicFieldsCard({
  draft,
  onChange,
}: {
  draft: Plan;
  onChange: (patch: Partial<Pick<Plan, 'name' | 'description' | 'goalTag' | 'frequencyPerWeek'>>) => void;
}) {
  return (
    <Card className="space-y-4 p-4">
      <FieldGroup label="課表名稱">
        <Input
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="例：我的推拉腿"
          maxLength={60}
        />
      </FieldGroup>

      <FieldGroup label="描述" hint="一句話說明這套課表想達到什麼">
        <textarea
          value={draft.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="可留空"
          rows={2}
          maxLength={280}
          className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </FieldGroup>

      <FieldGroup label="目標">
        <div className="flex flex-wrap gap-1.5">
          {GOAL_OPTIONS.map((g) => {
            const active = draft.goalTag === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => onChange({ goalTag: active ? undefined : g.value })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[12px] font-bold transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-ds-sm'
                    : 'bg-secondary text-foreground hover:bg-secondary/70',
                )}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </FieldGroup>

      <FieldGroup label="每週訓練次數">
        <div className="flex gap-1.5">
          {[2, 3, 4, 5, 6, 7].map((n) => {
            const active = draft.frequencyPerWeek === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ frequencyPerWeek: n })}
                className={cn(
                  'num grid h-10 flex-1 place-items-center rounded-md text-[14px] font-extrabold tabular-nums transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-ds-sm'
                    : 'bg-secondary text-foreground hover:bg-secondary/70',
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </FieldGroup>
    </Card>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-[11px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
          {label}
        </label>
        {hint ? <span className="text-[11px] text-muted-foreground/70">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DayEditorCard
// ---------------------------------------------------------------------------

function DayEditorCard({
  day,
  exerciseMap,
  isFirst,
  isLast,
  canRemove,
  onMove,
  onRemove,
  onChange,
  onAddExercise,
  onRemoveExercise,
  onMoveExercise,
  onUpdateExercise,
}: {
  day: PlanDay;
  exerciseMap: Map<string, Exercise>;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onChange: (patch: Partial<PlanDay>) => void;
  onAddExercise: (exerciseId: string) => void;
  onRemoveExercise: (peId: string) => void;
  onMoveExercise: (peId: string, dir: -1 | 1) => void;
  onUpdateExercise: (peId: string, patch: Partial<PlanExercise>) => void;
}) {
  const [open, setOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? '收合' : '展開'}
          className="grid h-8 w-8 place-items-center text-muted-foreground hover:bg-secondary rounded-md"
        >
          {open ? <ChevronDown size={18} strokeWidth={2.2} /> : <ChevronRight size={18} strokeWidth={2.2} />}
        </button>
        <input
          value={day.name}
          onChange={(e) => onChange({ name: e.target.value })}
          maxLength={40}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-bold tracking-[-0.01em] outline-none focus:bg-secondary/40 focus:px-2 focus:py-1 focus:rounded-md"
        />
        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn
            icon={<MoveUp size={15} strokeWidth={2.2} />}
            onClick={() => onMove(-1)}
            disabled={isFirst}
            label="上移"
          />
          <IconBtn
            icon={<MoveDown size={15} strokeWidth={2.2} />}
            onClick={() => onMove(1)}
            disabled={isLast}
            label="下移"
          />
          <IconBtn
            icon={<Trash2 size={15} strokeWidth={2.2} />}
            onClick={onRemove}
            disabled={!canRemove}
            label="刪除"
            destructive
          />
        </div>
      </div>

      {open ? (
        <>
          <ul className="border-t border-border">
            {day.exercises.map((pe, i) => (
              <li key={pe.id} className="border-b border-border last:border-b-0">
                <ExerciseEditRow
                  pe={pe}
                  exercise={exerciseMap.get(pe.exerciseId)}
                  isFirst={i === 0}
                  isLast={i === day.exercises.length - 1}
                  onChange={(patch) => onUpdateExercise(pe.id, patch)}
                  onRemove={() => onRemoveExercise(pe.id)}
                  onMove={(dir) => onMoveExercise(pe.id, dir)}
                />
              </li>
            ))}
            {day.exercises.length === 0 ? (
              <li className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
                這天還沒有動作、點下方按鈕加入。
              </li>
            ) : null}
          </ul>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 border-t border-dashed border-border bg-secondary/30 px-3 py-3 text-[13px] font-bold text-primary hover:bg-secondary/50"
          >
            <Plus size={14} strokeWidth={2.4} />
            新增動作
          </button>
        </>
      ) : null}

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(exId) => {
          onAddExercise(exId);
          setPickerOpen(false);
        }}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ExerciseEditRow
// ---------------------------------------------------------------------------

function ExerciseEditRow({
  pe,
  exercise,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
}: {
  pe: PlanExercise;
  exercise: Exercise | undefined;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<PlanExercise>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="p-3">
      <div className="flex items-center gap-3">
        {exercise ? (
          <ExerciseThumb exercise={exercise} size={44} className="!h-11 !w-11 shrink-0" />
        ) : (
          <div className="h-11 w-11 shrink-0 rounded-md bg-secondary" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold leading-tight">
            {exercise?.nameZh ?? pe.exerciseId}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {exercise?.nameEn}
          </div>
          {exercise && exercise.muscles[0] ? (
            <div className="mt-1 flex flex-wrap gap-1">
              <Chip tone="primary" size="xs">
                {muscleLabel(exercise.muscles[0])}
              </Chip>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn icon={<MoveUp size={14} strokeWidth={2.2} />} onClick={() => onMove(-1)} disabled={isFirst} label="上移" />
          <IconBtn icon={<MoveDown size={14} strokeWidth={2.2} />} onClick={() => onMove(1)} disabled={isLast} label="下移" />
          <IconBtn icon={<Trash2 size={14} strokeWidth={2.2} />} onClick={onRemove} label="移除" destructive />
        </div>
      </div>

      {/* Inline number controls */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <SmallStepper
          label="組數"
          value={pe.targetSets}
          min={1}
          max={20}
          onChange={(v) => onChange({ targetSets: v })}
        />
        <SmallStepper
          label="休息 (秒)"
          value={pe.restSeconds}
          min={0}
          max={600}
          step={15}
          onChange={(v) => onChange({ restSeconds: v })}
        />
        <SmallStepper
          label="次數 (min)"
          value={pe.targetRepsMin}
          min={1}
          max={100}
          onChange={(v) => onChange({ targetRepsMin: v, targetRepsMax: Math.max(v, pe.targetRepsMax) })}
        />
        <SmallStepper
          label="次數 (max)"
          value={pe.targetRepsMax}
          min={1}
          max={100}
          onChange={(v) => onChange({ targetRepsMax: Math.max(pe.targetRepsMin, v) })}
        />
      </div>
    </div>
  );
}

function SmallStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-1 rounded-md border border-border bg-card px-2 py-1.5">
      <span className="text-[10.5px] font-bold uppercase tracking-[1.2px] text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          aria-label={`${label}減`}
          className="grid h-6 w-6 place-items-center rounded text-foreground hover:bg-secondary"
        >
          <Minus size={12} strokeWidth={2.6} />
        </button>
        <span className="num w-7 text-center text-[14px] font-extrabold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          aria-label={`${label}加`}
          className="grid h-6 w-6 place-items-center rounded text-foreground hover:bg-secondary"
        >
          <Plus size={12} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}

function IconBtn({
  icon,
  onClick,
  disabled,
  label,
  destructive,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-md transition-colors',
        disabled
          ? 'cursor-not-allowed text-muted-foreground/40'
          : destructive
            ? 'text-destructive hover:bg-destructive/10'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      {icon}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ExercisePickerSheet — 只挑、不設組數（PlanEditor 內部 stepper 已可調）
// ---------------------------------------------------------------------------

function ExercisePickerSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exerciseId: string) => void;
}) {
  const [bodyPart, setBodyPart] = useState<'all' | NonNullable<Exercise['bodyPart']>>('all');
  const [query, setQuery] = useState('');

  const { data: exercises, isLoading } = useExercises({
    bodyPart,
    search: query || undefined,
  });

  return (
    <Sheet open={open} onClose={onClose} title="新增動作">
      {/* Filter bar */}
      <div className="space-y-2 border-b border-border bg-card px-4 py-2.5">
        <Input
          autoFocus
          placeholder="搜尋 (中英皆可)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full_body'] as const).map(
            (bp) => (
              <button
                key={bp}
                type="button"
                onClick={() => setBodyPart(bp)}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-[12px] font-bold transition-all whitespace-nowrap',
                  bodyPart === bp
                    ? 'bg-primary text-primary-foreground shadow-ds-sm'
                    : 'bg-secondary text-foreground hover:bg-secondary/70',
                )}
              >
                {bp === 'all' ? '全部' : bodyPartLabel(bp)}
              </button>
            ),
          )}
        </div>
      </div>

      {/* List */}
      <div className="px-3 py-2">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[64px] animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : (exercises ?? []).length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-muted-foreground">沒有符合的動作</p>
        ) : (
          <ul className="space-y-1.5">
            {(exercises ?? []).map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => onPick(ex.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <ExerciseThumb exercise={ex} size={40} className="!h-10 !w-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold leading-tight">{ex.nameZh}</div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{ex.nameEn}</div>
                  </div>
                  {ex.muscles[0] ? (
                    <Chip tone="primary" size="xs" className="shrink-0">
                      {muscleLabel(ex.muscles[0])}
                    </Chip>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// SaveBar / Exit confirm
// ---------------------------------------------------------------------------

function SaveBar({
  dirty,
  saving,
  onSave,
  onCancel,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-safe backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
        <Button variant="outline" size="lg" onClick={onCancel}>
          {dirty ? '取消' : '關閉'}
        </Button>
        <Button block size="lg" onClick={onSave} disabled={!dirty || saving}>
          <Save size={16} strokeWidth={2.4} />
          {saving ? '儲存中...' : dirty ? '儲存' : '已儲存'}
        </Button>
      </div>
    </div>
  );
}

function ExitConfirm({
  onCancel,
  onDiscard,
  onSave,
}: {
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-sm p-5 text-center shadow-ds-lg">
        <h3 className="text-[17px] font-bold">未儲存的變更會丟失</h3>
        <p className="mt-2 text-[13.5px] text-muted-foreground">想先儲存嗎？</p>
        <div className="mt-4 grid gap-2">
          <Button size="md" block onClick={onSave}>
            儲存並關閉
          </Button>
          <Button variant="destructive" size="md" block onClick={onDiscard}>
            不儲存、直接離開
          </Button>
          <Button variant="outline" size="md" block onClick={onCancel}>
            繼續編輯
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripVolatile(p: Plan): Omit<Plan, 'updatedAt'> {
  // Compare excluding updatedAt (auto-set on save)
  const { updatedAt, ...rest } = p;
  void updatedAt;
  return rest;
}

function defaultsByDifficulty(d: Exercise['difficulty']) {
  switch (d) {
    case 'beginner':
      return { sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 };
    case 'intermediate':
      return { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 };
    case 'advanced':
      return { sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 };
  }
}
