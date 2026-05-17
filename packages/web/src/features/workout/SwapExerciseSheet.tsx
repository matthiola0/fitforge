import { useEffect, useState } from 'react';
import { ChevronRight, SearchX, Target } from 'lucide-react';
import type { Exercise } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { Sheet } from '@/ui/Sheet';
import { Chip } from '@/ui/Chip';
import { Button } from '@/ui/Button';
import { ExerciseThumb } from '@/features/exercises/ExerciseThumb';
import { useUiStore } from '@/stores/uiStore';
import { EQUIPMENT_LABELS_ZH, muscleLabel } from '@/lib/labels';

/**
 * SwapExerciseSheet — §28 Swap mode
 *
 * 3 階 fallback：
 * 1. 同主肌群 (same_muscle)
 * 2. 若 < 2 結果、放寬到同部位 (same_body_part)
 * 3. 若仍 < 2、any
 *
 * 對應 docs/design/screens/28-swap-add-sheet.html「替換」variant。
 */
type Props = {
  open: boolean;
  onClose: () => void;
  workoutId: string;
  workoutExerciseId: string;
  currentExerciseId: string;
};

type Scope = 'same_muscle' | 'same_body_part' | 'any';

const SCOPE_LABEL: Record<Scope, { title: string; subtitle: string }> = {
  same_muscle: { title: '相同主肌群的其他選擇', subtitle: '最接近的替代' },
  same_body_part: { title: '同部位的其他選擇', subtitle: '已放寬範圍' },
  any: { title: '所有動作', subtitle: '完全放寬' },
};

export function SwapExerciseSheet({
  open,
  onClose,
  workoutId,
  workoutExerciseId,
  currentExerciseId,
}: Props) {
  const core = useCore();
  const pushToast = useUiStore((s) => s.pushToast);

  const [scope, setScope] = useState<Scope>('same_muscle');
  const [original, setOriginal] = useState<Exercise | null>(null);
  const [candidates, setCandidates] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState<string | null>(null);

  // Load original + candidates whenever open / scope / target changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const orig = await core.exerciseRepo.get(currentExerciseId);
      if (cancelled) return;
      setOriginal(orig);
      const subs = await core.exerciseQuery.findSubstitutes({
        exerciseId: currentExerciseId,
        swapScope: scope,
        limit: 20,
      });
      if (cancelled) return;
      setCandidates(subs);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [core, open, currentExerciseId, scope]);

  // Reset scope when sheet re-opens for different exercise
  useEffect(() => {
    if (open) setScope('same_muscle');
  }, [open, currentExerciseId]);

  const handleSwap = async (newExerciseId: string) => {
    setSwapping(newExerciseId);
    const r = await core.workoutEngine.swapExercise({
      workoutId,
      workoutExerciseId,
      newExerciseId,
    });
    setSwapping(null);
    if (!r.ok) {
      pushToast({ kind: 'error', message: `換動作失敗 (${r.error.code})` });
      return;
    }
    pushToast({ kind: 'success', message: '已替換動作' });
    onClose();
  };

  const broaden = () => {
    setScope((s) => (s === 'same_muscle' ? 'same_body_part' : 'any'));
  };

  const labels = SCOPE_LABEL[scope];

  return (
    <Sheet open={open} onClose={onClose}>
      {/* Header */}
      <div className="px-5 pb-3 pt-1">
        <div className="text-[10.5px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
          替換動作
        </div>
        <h3 className="mt-1.5 text-[20px] font-bold tracking-[-0.02em]">
          替換「<span className="text-primary">{original?.nameZh ?? '...'}</span>」
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground">{labels.title}</p>
        {original && original.muscles[0] ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-accent-foreground">
              <Target size={11} strokeWidth={2.4} />
              {muscleLabel(original.muscles[0])}
            </span>
            <span className="text-[11.5px] text-muted-foreground">
              {scope === 'same_muscle' ? '主肌群' : labels.subtitle}
            </span>
          </div>
        ) : null}
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between border-b border-border px-5 pb-3">
        <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-muted-foreground">
          {loading ? '搜尋中...' : `${candidates.length} 個結果`}
        </div>
        {scope !== 'any' ? (
          <button
            type="button"
            onClick={broaden}
            className="text-[12px] font-semibold text-primary hover:underline"
          >
            放寬範圍
          </button>
        ) : null}
      </div>

      {/* Results */}
      <div className="px-5 py-3">
        {loading ? (
          <SkeletonRows />
        ) : candidates.length === 0 ? (
          <EmptyState scope={scope} onBroaden={broaden} />
        ) : (
          <ul className="space-y-2">
            {candidates.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => handleSwap(ex.id)}
                  disabled={swapping !== null}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-secondary disabled:opacity-50"
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
    </Sheet>
  );
}

function SkeletonRows() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-[72px] animate-pulse rounded-lg bg-muted/40" />
      ))}
    </ul>
  );
}

function EmptyState({ scope, onBroaden }: { scope: Scope; onBroaden: () => void }) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <SearchX size={22} strokeWidth={2} />
      </div>
      <h4 className="text-[15px] font-bold">沒有可用的替代</h4>
      <p className="mt-1.5 text-[12.5px] text-muted-foreground">
        {scope === 'same_muscle'
          ? '相同主肌群下沒有其他動作'
          : scope === 'same_body_part'
            ? '同部位下沒有其他動作'
            : '所有動作都試過了'}
      </p>
      {scope !== 'any' ? (
        <Button variant="outline" size="sm" onClick={onBroaden} className="mt-4">
          放寬範圍
        </Button>
      ) : null}
    </div>
  );
}
