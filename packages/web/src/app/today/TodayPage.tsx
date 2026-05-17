import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ChevronRight, Dumbbell, Flame, Play, Shuffle, Timer } from 'lucide-react';
import type { Plan, Workout } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { useRxQuery } from '@/lib/rxdb/useRxQuery';
import { greetingByHour } from '@/lib/time/formatDuration';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';

/**
 * TodayPage — 首頁
 *
 * 對應 docs/07-screen-flow.md §3.6。
 *
 * V1 第一版實作（無完整 Lottie / mini calendar，留待設計稿到位）：
 * - 問候語 + 設定入口
 * - 今日訓練主視覺卡 (有 active plan / 無 / 進行中 三種狀態)
 * - 自由訓練入口
 * - 最近訓練摘要
 */
export function TodayPage() {
  const core = useCore();

  const settings = useRxQuery(() => core.settingsRepo.observe('local'), [core]);
  const activePlan = useRxQuery(() => core.planRepo.observeActive(), [core]);
  const inProgress = useRxQuery(() => core.workoutRepo.observeInProgress(), [core]);
  const recent = useRxQuery(() => core.workoutRepo.observeRecent(3), [core]);

  const greeting = useMemo(() => greetingByHour(), []);

  // Onboarding guard — redirect to step 1 if not completed
  if (!settings.isLoading && settings.data && !settings.data.onboardingCompleted) {
    return <Navigate to="/onboard/step1" replace />;
  }

  return (
    <>
      <PageHeader
        title={
          <span>
            {greeting} <span aria-hidden>👋</span>
          </span>
        }
        showSettings
      />

      <div className="mx-auto max-w-md space-y-4 p-4">
        <TodayHero
          activePlan={activePlan.data}
          inProgress={inProgress.data}
          isLoading={activePlan.isLoading || inProgress.isLoading}
        />

        <AdhocEntry />

        <RecentSection workouts={recent.data ?? []} isLoading={recent.isLoading} />

        <FooterHint />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function TodayHero({
  activePlan,
  inProgress,
  isLoading,
}: {
  activePlan: Plan | null;
  inProgress: Workout | null;
  isLoading: boolean;
}) {
  // 進行中 workout 優先
  if (inProgress) {
    return (
      <Card className="overflow-hidden border-primary/30 bg-accent/40">
        <div className="p-5">
          <Badge variant="primary" className="uppercase tracking-[0.1em]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground" />
            進行中
          </Badge>
          <h2 className="mt-3 text-[22px] font-bold tracking-[-0.02em]">
            {inProgress.name}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {inProgress.exercises.length} 個動作 · 開始於{' '}
            {new Date(inProgress.startedAt).toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <Link to={`/workout/${inProgress.id}`}>
            <Button size="xl" block className="mt-5">
              <Play size={18} strokeWidth={2.5} fill="currentColor" />
              繼續訓練
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return <Card className="h-44 animate-pulse bg-muted/60" />;
  }

  if (!activePlan) {
    return (
      <Card className="overflow-hidden">
        <div className="p-5">
          <Badge variant="outline" className="uppercase tracking-[0.1em]">
            開始第一次
          </Badge>
          <h2 className="mt-3 text-[22px] font-bold tracking-[-0.02em]">
            還沒選課表
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            選一個預設課表、開始你的健身旅程。
          </p>
          <Link to="/plans">
            <Button size="xl" block className="mt-5">
              選擇課表
              <ChevronRight size={18} strokeWidth={2.5} />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // 有 active plan — 顯示第一個 day 的預覽
  const day = activePlan.days[0]!;
  const exerciseCount = day.exercises.length;
  const totalSets = day.exercises.reduce((sum, e) => sum + e.targetSets, 0);
  const estimatedMin = Math.round((totalSets * 90 + day.exercises.length * 60) / 60);

  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <Badge variant="primary" className="uppercase tracking-[0.1em]">
          今天的訓練
        </Badge>
        <h2 className="mt-3 text-[24px] font-extrabold leading-[1.15] tracking-[-0.02em]">
          {day.name}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{activePlan.name}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Dumbbell size={14} strokeWidth={2.2} />
            {exerciseCount} 個動作
          </span>
          <span className="flex items-center gap-1.5">
            <Flame size={14} strokeWidth={2.2} />
            {totalSets} 組
          </span>
          <span className="flex items-center gap-1.5">
            <Timer size={14} strokeWidth={2.2} />
            約 {estimatedMin} 分鐘
          </span>
        </div>

        <Link to={`/workout/new?planId=${activePlan.id}&dayId=${day.id}`}>
          <Button size="xl" block className="mt-5">
            <Play size={18} strokeWidth={2.5} fill="currentColor" />
            開始訓練
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function AdhocEntry() {
  return (
    <Link to="/workout/adhoc" className="block">
      <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-secondary">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
          <Shuffle size={20} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">自由訓練</div>
          <div className="truncate text-[12px] text-muted-foreground">
            沒在跑課表？選個部位、隨意練
          </div>
        </div>
        <ChevronRight size={20} className="text-muted-foreground" strokeWidth={2} />
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------

function RecentSection({ workouts, isLoading }: { workouts: Workout[]; isLoading: boolean }) {
  if (isLoading) {
    return <div className="h-24" />;
  }
  if (workouts.length === 0) {
    return null;
  }
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h3 className="text-[14px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          最近訓練
        </h3>
        <Link
          to="/history"
          className="text-[12px] font-semibold text-primary hover:underline"
        >
          全部
        </Link>
      </div>
      <div className="space-y-2">
        {workouts.map((w) => (
          <RecentItem key={w.id} workout={w} />
        ))}
      </div>
    </section>
  );
}

function RecentItem({ workout }: { workout: Workout }) {
  const date = new Date(workout.startedAt);
  const dateStr = date.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
  const totalSets = workout.exercises.reduce(
    (sum, we) => sum + we.sets.filter((s) => s.isCompleted).length,
    0,
  );
  const minutes = workout.durationSeconds
    ? Math.round(workout.durationSeconds / 60)
    : null;

  return (
    <Link to={`/history/${workout.id}`} className="block">
      <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-secondary/50">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold">{workout.name}</span>
            {workout.mode === 'ad_hoc' ? (
              <Badge variant="outline" className="text-[10px]">
                自由
              </Badge>
            ) : null}
          </div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            {dateStr}
            {minutes ? ` · ${minutes} 分鐘` : ''}
            {totalSets ? ` · ${totalSets} 組` : ''}
          </div>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" strokeWidth={2} />
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------

function FooterHint() {
  // V1 骨架階段的提示，之後可移除
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem('fitforge-skeleton-hint-dismissed');
    if (flag === '1') setDismissed(true);
  }, []);

  if (dismissed) return null;
  return (
    <Card className="border-dashed bg-secondary/40 p-4">
      <div className="text-[12px] leading-[1.55] text-muted-foreground">
        <strong className="text-foreground">👷‍♀️ 開發中</strong>：你正在看 V1 骨架。
        其他畫面顯示 stub、要從{' '}
        <code className="font-mono text-[11px]">docs/20-claude-design-prompts.md</code>{' '}
        逐個跑設計稿落地。
      </div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem('fitforge-skeleton-hint-dismissed', '1');
          setDismissed(true);
        }}
        className="mt-2 text-[11px] font-semibold text-primary hover:underline"
      >
        知道了、不要再顯示
      </button>
    </Card>
  );
}
