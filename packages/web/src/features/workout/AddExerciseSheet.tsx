import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { BODY_PARTS, type BodyPart, type Exercise } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { Sheet } from '@/ui/Sheet';
import { Chip } from '@/ui/Chip';
import { Button } from '@/ui/Button';
import { NumberStepper } from '@/ui/NumberStepper';
import { ExerciseThumb } from '@/features/exercises/ExerciseThumb';
import { useExercises } from '@/features/exercises/useExercises';
import { useUiStore } from '@/stores/uiStore';
import { bodyPartLabel, EQUIPMENT_LABELS_ZH, muscleLabel } from '@/lib/labels';
import { cn } from '@/lib/cn';

/**
 * AddExerciseSheet — §28 Add mode
 *
 * 兩階段：
 * 1. 選動作 (tabs: 依部位 / 搜尋)
 * 2. 選了動作 → 設定組數 sheet (sets/reps/rest)
 *
 * V1 簡化：略掉「依肌群」tab（部位 + 搜尋已涵蓋大部分場景）
 */
type Props = {
  open: boolean;
  onClose: () => void;
  workoutId: string;
};

type TabKey = 'body_part' | 'search';

export function AddExerciseSheet({ open, onClose, workoutId }: Props) {
  const [picked, setPicked] = useState<Exercise | null>(null);

  // When sheet closes, reset
  const handleClose = () => {
    setPicked(null);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={picked ? null : '新增動作'}
    >
      {picked ? (
        <ConfigureStep
          exercise={picked}
          workoutId={workoutId}
          onBack={() => setPicked(null)}
          onDone={handleClose}
        />
      ) : (
        <PickStep onPick={setPicked} />
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Pick exercise
// ---------------------------------------------------------------------------

function PickStep({ onPick }: { onPick: (ex: Exercise) => void }) {
  const [tab, setTab] = useState<TabKey>('body_part');
  const [bodyPart, setBodyPart] = useState<BodyPart | 'all'>('all');
  const [query, setQuery] = useState('');

  const { data: filtered, isLoading } = useExercises({
    bodyPart: tab === 'body_part' ? bodyPart : undefined,
    search: tab === 'search' ? query : undefined,
  });

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="border-b border-border px-4 pt-2">
        <div className="inline-flex gap-1 rounded-md bg-secondary p-1">
          {(['body_part', 'search'] as TabKey[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'rounded px-3 py-1.5 text-[12px] font-bold tracking-[-0.005em] transition-all',
                tab === t
                  ? 'bg-card text-foreground shadow-ds-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'body_part' ? '依部位' : '搜尋'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab body */}
      {tab === 'body_part' ? (
        <BodyPartFilters value={bodyPart} onChange={setBodyPart} />
      ) : (
        <SearchInput value={query} onChange={setQuery} />
      )}

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[64px] animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : (filtered ?? []).length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-muted-foreground">
            {tab === 'search' && !query ? '輸入動作名稱搜尋' : '沒有符合的動作'}
          </p>
        ) : (
          <ul className="space-y-2">
            {(filtered ?? []).map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => onPick(ex)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-secondary"
                >
                  <ExerciseThumb exercise={ex} size={48} className="!h-12 !w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold leading-tight">
                      {ex.nameZh}
                    </div>
                    <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                      {ex.nameEn}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {ex.muscles[0] ? (
                        <Chip tone="primary" size="xs">
                          {muscleLabel(ex.muscles[0])}
                        </Chip>
                      ) : null}
                      {ex.equipment[0] ? (
                        <Chip tone="muted" size="xs">
                          {EQUIPMENT_LABELS_ZH[ex.equipment[0]] ?? ex.equipment[0]}
                        </Chip>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-muted-foreground" strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BodyPartFilters({
  value,
  onChange,
}: {
  value: BodyPart | 'all';
  onChange: (v: BodyPart | 'all') => void;
}) {
  const all: Array<BodyPart | 'all'> = ['all', ...BODY_PARTS];
  return (
    <div className="border-b border-border bg-card px-4 py-2.5">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {all.map((bp) => (
          <button
            key={bp}
            type="button"
            onClick={() => onChange(bp)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] font-bold transition-all',
              value === bp
                ? 'bg-primary text-primary-foreground shadow-ds-sm'
                : 'bg-secondary text-foreground hover:bg-secondary/70',
            )}
          >
            {bp === 'all' ? '全部' : bodyPartLabel(bp)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="border-b border-border bg-card px-4 py-2.5">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2.2}
        />
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="搜尋動作 (中英皆可)"
          className="h-10 w-full rounded-md bg-secondary py-2 pl-9 pr-9 text-[14px] font-medium outline-none focus:ring-2 focus:ring-ring"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-card"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Configure sets/reps/rest
// ---------------------------------------------------------------------------

function ConfigureStep({
  exercise,
  workoutId,
  onBack,
  onDone,
}: {
  exercise: Exercise;
  workoutId: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const core = useCore();
  const pushToast = useUiStore((s) => s.pushToast);

  const defaults = useMemo(() => defaultsByDifficulty(exercise.difficulty), [exercise.difficulty]);
  const [sets, setSets] = useState(defaults.sets);
  const [repsMin, setRepsMin] = useState(defaults.repsMin);
  const [repsMax, setRepsMax] = useState(defaults.repsMax);
  const [rest, setRest] = useState(defaults.restSeconds);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    const r = await core.workoutEngine.addExercise({
      workoutId,
      exerciseId: exercise.id,
      targetSets: sets,
      targetRepsMin: repsMin,
      targetRepsMax: Math.max(repsMin, repsMax),
      restSeconds: rest,
    });
    setAdding(false);
    if (!r.ok) {
      pushToast({ kind: 'error', message: `加入失敗 (${r.error.code})` });
      return;
    }
    pushToast({ kind: 'success', message: `已加入 ${exercise.nameZh}` });
    onDone();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-3 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="grid h-9 w-9 place-items-center rounded-md hover:bg-secondary"
        >
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[10.5px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
            加入動作
          </div>
          <div className="truncate text-[15px] font-bold leading-tight">{exercise.nameZh}</div>
        </div>
        <ExerciseThumb exercise={exercise} size={40} className="!h-10 !w-10 shrink-0" />
      </div>

      {/* Configure form */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
              組數
            </label>
            <NumberStepper
              label="目標組數"
              unit="sets"
              value={sets}
              onChange={(v) => setSets(Math.max(1, Math.min(20, Math.round(v))))}
              step={1}
              min={1}
              max={20}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
              次數範圍
            </label>
            <div className="flex gap-2">
              <NumberStepper
                label="最少"
                unit="reps"
                value={repsMin}
                onChange={(v) => setRepsMin(Math.max(1, Math.min(100, Math.round(v))))}
                step={1}
                min={1}
                max={100}
              />
              <NumberStepper
                label="最多"
                unit="reps"
                value={repsMax}
                onChange={(v) => setRepsMax(Math.max(1, Math.min(100, Math.round(v))))}
                step={1}
                min={1}
                max={100}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
              組間休息
            </label>
            <NumberStepper
              label="秒數"
              unit="sec"
              value={rest}
              onChange={(v) => setRest(Math.max(0, Math.min(600, Math.round(v / 15) * 15)))}
              step={15}
              min={0}
              max={600}
            />
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="border-t border-border bg-card px-4 py-3">
        <Button size="lg" block onClick={handleAdd} disabled={adding}>
          {adding ? '加入中...' : `加入 · ${sets} × ${repsMin}${repsMin !== repsMax ? `-${repsMax}` : ''}`}
        </Button>
      </div>
    </div>
  );
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
