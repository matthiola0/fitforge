import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dumbbell, Flame, Play, Timer } from 'lucide-react';
import type { Exercise, WorkoutDraft } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { ExerciseThumb } from '@/features/exercises/ExerciseThumb';
import { useUiStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { bodyPartLabel, muscleLabel } from '@/lib/labels';

/**
 * PreWorkoutReviewPage — §26 (最小可用版)
 *
 * Query string: ?planId=...&dayId=...
 *
 * V1 簡化版：
 * - 用 WorkoutBuilderService.buildFromPlan 建 draft
 * - 列動作清單（無微調 UI、§26 完整版才會有加減換）
 * - 「開始訓練」呼叫 WorkoutEngine.start，導向 /workout/:id
 */
export function PreWorkoutReviewPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const core = useCore();
  const planId = params.get('planId');
  const dayId = params.get('dayId');

  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [exercises, setExercises] = useState<Map<string, Exercise>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!planId || !dayId) {
      setError('缺少必要參數');
      return;
    }
    let cancelled = false;
    (async () => {
      const r = await core.builder.buildFromPlan({ planId, planDayId: dayId });
      if (cancelled) return;
      if (!r.ok) {
        setError(`找不到課表內容 (${r.error.code})`);
        return;
      }
      setDraft(r.value);
      const ids = r.value.items.map((i) => i.exerciseId);
      const exs = await core.exerciseRepo.getMany(ids);
      if (!cancelled) setExercises(new Map(exs.map((e) => [e.id, e])));
    })();
    return () => {
      cancelled = true;
    };
  }, [core, planId, dayId]);

  const start = async () => {
    if (!draft || !planId || !dayId) return;
    setStarting(true);
    const r = await core.workoutEngine.start({
      planId,
      planDayId: dayId,
      items: draft.items,
    });
    if (!r.ok) {
      useUiStore.getState().pushToast({
        kind: 'error',
        message:
          r.error.code === 'CONCURRENT_ACTIVE_WORKOUT'
            ? '已有進行中的訓練、請先結束'
            : `啟動失敗 (${r.error.code})`,
      });
      setStarting(false);
      return;
    }
    useSessionStore.getState().setActiveWorkoutId(r.value.id);
    navigate(`/workout/${r.value.id}`, { replace: true });
  };

  if (error) {
    return (
      <>
        <PageHeader title="準備開始訓練" back />
        <div className="mx-auto max-w-md p-4">
          <Card className="p-5 text-center">
            <p className="text-[14px] text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/today')} className="mt-4">
              回首頁
            </Button>
          </Card>
        </div>
      </>
    );
  }

  if (!draft) {
    return (
      <>
        <PageHeader title="準備開始訓練" back />
        <div className="mx-auto max-w-md p-4">
          <Card className="h-40 animate-pulse" />
        </div>
      </>
    );
  }

  const totalSets = draft.items.reduce((s, it) => s + it.targetSets, 0);
  const estimatedMin = Math.round((totalSets * 90 + draft.items.length * 60) / 60);

  return (
    <>
      <PageHeader title="準備開始訓練" back />
      <div className="mx-auto max-w-md space-y-4 p-4 pb-32">
        {/* Hero summary */}
        <Card className="p-5">
          <Chip tone="primary" size="sm" className="uppercase tracking-[0.1em]">
            今日訓練
          </Chip>
          <h2 className="mt-2 text-[22px] font-extrabold tracking-[-0.02em] text-foreground">
            {draft.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Dumbbell size={14} strokeWidth={2.2} />
              {draft.items.length} 個動作
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flame size={14} strokeWidth={2.2} />
              {totalSets} 組
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Timer size={14} strokeWidth={2.2} />
              約 {estimatedMin} 分鐘
            </span>
          </div>
        </Card>

        {/* Exercise list */}
        <div className="space-y-2">
          {draft.items.map((item, idx) => {
            const ex = exercises.get(item.exerciseId);
            return (
              <Card key={item.draftItemId} className="flex items-center gap-3 p-3">
                <ExerciseThumb
                  exercise={
                    ex ?? { bodyPart: 'full_body' as const, slug: 'placeholder' }
                  }
                  size={56}
                  className="!h-14 !w-14 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="num text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
                      {idx + 1}
                    </span>
                    <h4 className="truncate text-[14.5px] font-bold leading-tight text-foreground">
                      {ex?.nameZh ?? item.exerciseId}
                    </h4>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {ex?.nameEn ?? ''}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[12px] text-foreground/80">
                    <span className="num font-bold">
                      {item.targetSets} × {item.targetRepsMin}
                      {item.targetRepsMax !== item.targetRepsMin ? `-${item.targetRepsMax}` : ''}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="num text-muted-foreground">休 {item.restSeconds}s</span>
                  </div>
                  {ex && ex.muscles[0] ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Chip tone="primary" size="xs">
                        {muscleLabel(ex.muscles[0])}
                      </Chip>
                      {ex.bodyPart === 'full_body' ? (
                        <Chip tone="muted" size="xs">
                          {bodyPartLabel(ex.bodyPart)}
                        </Chip>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="rounded-md border border-dashed border-border bg-secondary/40 p-3 text-[11.5px] leading-snug text-muted-foreground">
          💡 §26 完整版會支援訓練前微調（加 / 減 / 換動作）— V1 demo loop 先省略。
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-md gap-2 px-4 py-3">
          <Button variant="outline" size="lg" onClick={() => navigate(-1)} className="shrink-0">
            取消
          </Button>
          <Button size="lg" block onClick={start} disabled={starting}>
            <Play size={18} strokeWidth={2.5} fill="currentColor" />
            {starting ? '啟動中...' : '開始訓練'}
          </Button>
        </div>
      </div>
    </>
  );
}
