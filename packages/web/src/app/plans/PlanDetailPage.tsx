import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Dumbbell,
  Edit3,
  Flame,
  Play,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Exercise, Plan, PlanDay } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { useRxQuery } from '@/lib/rxdb/useRxQuery';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { t } from '@/lib/i18n';
import { ExerciseThumb } from '@/features/exercises/ExerciseThumb';
import { useUiStore } from '@/stores/uiStore';
import { bodyPartLabel, BODY_PART_LABELS_ZH, muscleLabel } from '@/lib/labels';
import { cn } from '@/lib/cn';
import { BODY_PARTS } from '@fitforge/core';
import type { BodyPart } from '@fitforge/core';

/**
 * PlanDetailPage — §11
 *
 * 對應 docs/design/screens/11-plan-detail.{html,jsx}。
 * 結構：Header / Hero（badge + name + desc + stats）/ DayCards / FooterActions
 */
export function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const core = useCore();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);

  const planQ = useRxQuery(
    () => (planId ? core.planRepo.observeAll('local') : null),
    [core, planId],
  );
  const plan = useMemo(() => planQ.data?.find((p) => p.id === planId) ?? null, [planQ.data, planId]);

  const activeQ = useRxQuery(() => core.planRepo.observeActive('local'), [core]);
  const isActive = plan && activeQ.data?.id === plan.id;

  // Hydrate exercise lookup
  const [exerciseMap, setExerciseMap] = useState<Map<string, Exercise>>(new Map());
  useEffect(() => {
    if (!plan) return;
    const ids = Array.from(
      new Set(plan.days.flatMap((d) => d.exercises.map((e) => e.exerciseId))),
    );
    core.exerciseRepo.getMany(ids).then((exs) => {
      setExerciseMap(new Map(exs.map((e) => [e.id, e])));
    });
  }, [core, plan]);

  // Confirm delete dialog
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (planQ.isLoading) {
    return (
      <>
        <PageHeader title="" back="/plans" />
        <div className="mx-auto max-w-md space-y-3 p-4">
          <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
          <div className="h-28 animate-pulse rounded-lg bg-muted/50" />
        </div>
      </>
    );
  }

  if (!plan) {
    return <Navigate to="/plans" replace />;
  }

  const onSetActive = async () => {
    const r = await core.planService.setActive(plan.id);
    if (!r.ok) {
      pushToast({ kind: 'error', message: `設定失敗 (${r.error.code})` });
      return;
    }
    pushToast({ kind: 'success', message: '已設為使用中' });
  };

  const onFork = async () => {
    const r = await core.planService.forkFromPreset(plan.id);
    if (!r.ok) {
      pushToast({ kind: 'error', message: `複製失敗 (${r.error.code})` });
      return;
    }
    pushToast({ kind: 'success', message: '已複製到「我的課表」' });
    navigate(`/plans/${r.value.id}/edit`);
  };

  const onDelete = async () => {
    setConfirmDelete(false);
    const r = await core.planService.softDelete(plan.id);
    if (!r.ok) {
      pushToast({ kind: 'error', message: `刪除失敗 (${r.error.code})` });
      return;
    }
    pushToast({ kind: 'info', message: '已移除課表' });
    navigate('/plans', { replace: true });
  };

  return (
    <>
      <PageHeader
        title={plan.name}
        subtitle={plan.isPreset ? '預設課表' : '自訂課表'}
        back="/plans"
      />

      <div className="mx-auto max-w-md space-y-4 p-4 pb-32">
        <Hero plan={plan} isActive={!!isActive} />

        {plan.days.map((day) => (
          <DayCard key={day.id} day={day} exerciseMap={exerciseMap} />
        ))}

        {plan.isPreset ? (
          <Card className="border-dashed bg-secondary/40 p-4 text-[12px] leading-snug text-muted-foreground">
            <Sparkles size={14} className="inline text-primary" strokeWidth={2.4} />
            <span className="ml-1.5">
              預設課表不可直接編輯。要客製、請點「複製為我的」、之後可自由調整。
            </span>
          </Card>
        ) : null}
      </div>

      {/* Sticky footer actions */}
      <FooterActions
        plan={plan}
        isActive={!!isActive}
        onSetActive={onSetActive}
        onFork={onFork}
        onDeleteConfirm={() => setConfirmDelete(true)}
      />

      <ConfirmDialog
        open={confirmDelete}
        variant="destructive"
        title={t('plans.deleteConfirmTitle')}
        description={t('plans.deleteConfirmBody', { name: plan.name })}
        confirmLabel={t('common.remove')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero({ plan, isActive }: { plan: Plan; isActive: boolean }) {
  const totalExercises = plan.days.reduce((n, d) => n + d.exercises.length, 0);
  const totalSets = plan.days.reduce(
    (n, d) => n + d.exercises.reduce((m, e) => m + e.targetSets, 0),
    0,
  );

  return (
    <Card className={cn('p-5', isActive && 'border-primary/40 bg-accent/40')}>
      <div className="flex items-center gap-2">
        {isActive ? (
          <Chip tone="primary" size="sm">
            <CheckCircle2 size={11} strokeWidth={2.4} className="-ml-0.5" />
            使用中
          </Chip>
        ) : null}
        {plan.isPreset ? (
          <Chip tone="outline" size="sm">
            預設
          </Chip>
        ) : null}
        {plan.goalTag ? (
          <Chip tone="muted" size="sm">
            {goalLabel(plan.goalTag)}
          </Chip>
        ) : null}
      </div>

      <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.02em]">{plan.name}</h2>
      {plan.description ? (
        <p className="mt-1.5 text-[13.5px] leading-snug text-muted-foreground">
          {plan.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={14} strokeWidth={2.2} />
          每週 {plan.frequencyPerWeek} 次
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Dumbbell size={14} strokeWidth={2.2} />
          {plan.days.length} 日 · {totalExercises} 動作
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Flame size={14} strokeWidth={2.2} />
          {totalSets} 組
        </span>
      </div>
    </Card>
  );
}

function goalLabel(g: NonNullable<Plan['goalTag']>): string {
  switch (g) {
    case 'strength':
      return '增強力量';
    case 'hypertrophy':
      return '增肌';
    case 'general':
      return '一般體適能';
    case 'fatloss':
      return '減脂';
  }
}

// ---------------------------------------------------------------------------
// DayCard
// ---------------------------------------------------------------------------

function DayCard({ day, exerciseMap }: { day: PlanDay; exerciseMap: Map<string, Exercise> }) {
  const [open, setOpen] = useState(true);
  const totalSets = day.exercises.reduce((n, e) => n + e.targetSets, 0);
  const estimatedMin = Math.round((totalSets * 90 + day.exercises.length * 60) / 60);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-[13px] font-extrabold text-primary">
          {day.order + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold tracking-[-0.01em]">{day.name}</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            {day.exercises.length} 動作 · {totalSets} 組 · 約 {estimatedMin} 分
          </div>
          {day.focusMuscleGroups.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {day.focusMuscleGroups.map((t) => (
                <Chip key={t} tone="muted" size="xs">
                  {translateFocus(t)}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
        {open ? (
          <ChevronUp size={18} className="shrink-0 text-muted-foreground" strokeWidth={2} />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-muted-foreground" strokeWidth={2} />
        )}
      </button>

      {open ? (
        <ul className="divide-y divide-border border-t border-border">
          {day.exercises.map((pe) => {
            const ex = exerciseMap.get(pe.exerciseId);
            return (
              <li key={pe.id}>
                <Link
                  to={ex ? `/exercises/${ex.slug}` : '#'}
                  className="flex items-center gap-3 p-3 hover:bg-secondary/40"
                >
                  {ex ? (
                    <ExerciseThumb exercise={ex} size={44} className="!h-11 !w-11 shrink-0" />
                  ) : (
                    <div className="h-11 w-11 shrink-0 rounded-md bg-secondary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-bold leading-tight">
                      {ex?.nameZh ?? pe.exerciseId}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                      <span className="num">
                        {pe.targetSets} × {pe.targetRepsMin}
                        {pe.targetRepsMax !== pe.targetRepsMin ? `-${pe.targetRepsMax}` : ''}
                      </span>
                      <span>·</span>
                      <span className="num">休 {pe.restSeconds}s</span>
                      {!pe.isSwappable ? <Chip size="xs" tone="outline">主動作</Chip> : null}
                    </div>
                    {ex && ex.muscles[0] ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Chip tone="primary" size="xs">
                          {muscleLabel(ex.muscles[0])}
                        </Chip>
                      </div>
                    ) : null}
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-muted-foreground" strokeWidth={2} />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Card>
  );
}

const BODY_PART_SET = new Set<string>(BODY_PARTS);
function translateFocus(tag: string): string {
  return BODY_PART_SET.has(tag) ? BODY_PART_LABELS_ZH[tag as BodyPart] : tag;
}

// ---------------------------------------------------------------------------
// FooterActions
// ---------------------------------------------------------------------------

function FooterActions({
  plan,
  isActive,
  onSetActive,
  onFork,
  onDeleteConfirm,
}: {
  plan: Plan;
  isActive: boolean;
  onSetActive: () => void;
  onFork: () => void;
  onDeleteConfirm: () => void;
}) {
  // Find current active day for "開始訓練" link
  const day0 = plan.days[0];

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-safe backdrop-blur">
      <div className="mx-auto max-w-md space-y-2 px-4 py-3">
        {isActive && day0 ? (
          <Link to={`/workout/new?planId=${plan.id}&dayId=${day0.id}`} className="block">
            <Button size="lg" block>
              <Play size={16} strokeWidth={2.5} fill="currentColor" />
              開始今天的訓練
            </Button>
          </Link>
        ) : (
          <Button size="lg" block onClick={onSetActive}>
            <CheckCircle2 size={16} strokeWidth={2.4} />
            設為使用中
          </Button>
        )}

        <div className="flex gap-2">
          {plan.isPreset ? (
            <Button variant="outline" size="md" block onClick={onFork}>
              <Copy size={14} strokeWidth={2.2} />
              複製為我的
            </Button>
          ) : (
            <Link to={`/plans/${plan.id}/edit`} className="block flex-1">
              <Button variant="outline" size="md" block>
                <Edit3 size={14} strokeWidth={2.2} />
                編輯
              </Button>
            </Link>
          )}
          {!plan.isPreset ? (
            <Button variant="outline" size="md" onClick={onDeleteConfirm} className="text-destructive">
              <Trash2 size={14} strokeWidth={2.2} />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

