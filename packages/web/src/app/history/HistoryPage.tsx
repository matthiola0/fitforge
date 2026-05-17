import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BarChart3, ChevronRight, Sparkles, Timer, Trash2 } from 'lucide-react';
import type { Workout } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { useRxQuery } from '@/lib/rxdb/useRxQuery';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { useUiStore } from '@/stores/uiStore';
import { formatDuration } from '@/lib/time/formatDuration';
import { cn } from '@/lib/cn';

/**
 * HistoryPage — §17
 *
 * 對應 docs/design/screens/17-history.html
 * - Top stats: 本月訓練次數 / 總噸位 / 總時長
 * - 月份分組、sticky month header
 * - swipe-to-delete (V1: 用按鈕版、不做真 swipe gesture)
 * - empty state with sparkle
 */
export function HistoryPage() {
  const core = useCore();
  const recentQ = useRxQuery(() => core.workoutRepo.observeRecent(100), [core]);
  const workouts = recentQ.data ?? [];

  const monthlyStats = useMemo(() => calcMonthlyStats(workouts, new Date()), [workouts]);
  const grouped = useMemo(() => groupByMonth(workouts), [workouts]);

  return (
    <>
      <PageHeader title="歷史" />

      <div className="mx-auto max-w-md px-4 pb-6 pt-4">
        {/* Top stats card */}
        {workouts.length > 0 ? <MonthStatsCard stats={monthlyStats} /> : null}

        {/* List or empty */}
        {recentQ.isLoading ? (
          <Skeleton />
        ) : workouts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-4 space-y-5">
            {grouped.map((group) => (
              <MonthGroup
                key={group.key}
                label={group.label}
                workouts={group.items}
                avgVolume={group.avgVolume}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stats Card
// ---------------------------------------------------------------------------

type MonthlyStats = {
  count: number;
  totalVolume: number;
  totalSeconds: number;
  vsLastMonth: number | null; // 差幾次、null 表示沒有上月資料
};

function MonthStatsCard({ stats }: { stats: MonthlyStats }) {
  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
          本月節奏
        </span>
        {stats.vsLastMonth !== null ? (
          <Chip
            tone={stats.vsLastMonth >= 0 ? 'primary' : 'muted'}
            size="xs"
            className="!normal-case !tracking-normal"
          >
            {stats.vsLastMonth >= 0 ? '+' : ''}
            {stats.vsLastMonth} 比上月
          </Chip>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatCell
          icon={<Activity size={14} strokeWidth={2.2} className="text-primary" />}
          label="次數"
          value={`${stats.count}`}
          unit="次"
        />
        <StatCell
          icon={<BarChart3 size={14} strokeWidth={2.2} className="text-primary" />}
          label="總噸位"
          value={fmtCompact(stats.totalVolume)}
          unit="kg"
        />
        <StatCell
          icon={<Timer size={14} strokeWidth={2.2} className="text-primary" />}
          label="總時長"
          value={fmtHours(stats.totalSeconds)}
        />
      </div>
    </Card>
  );
}

function StatCell({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className="num text-[20px] font-extrabold tabular-nums tracking-[-0.02em]">
          {value}
        </span>
        {unit ? <span className="text-[11px] font-semibold text-muted-foreground">{unit}</span> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month grouped list
// ---------------------------------------------------------------------------

type MonthGroup = {
  key: string; // YYYY-MM
  label: string;
  items: Workout[];
  avgVolume: number; // 該月平均噸位 (kg)
};

function MonthGroup({
  label,
  workouts,
  avgVolume,
}: {
  label: string;
  workouts: Workout[];
  avgVolume: number;
}) {
  return (
    <section>
      <div className="sticky top-[60px] z-10 -mx-4 mb-2 bg-background/95 px-4 py-1.5 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </h3>
          <span className="text-[11px] text-muted-foreground">
            <span className="num">{workouts.length}</span> 次
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {workouts.map((w) => (
          <HistoryRow key={w.id} workout={w} avgVolume={avgVolume} />
        ))}
      </div>
    </section>
  );
}

function HistoryRow({ workout, avgVolume }: { workout: Workout; avgVolume: number }) {
  const core = useCore();
  const pushToast = useUiStore((s) => s.pushToast);
  const [confirming, setConfirming] = useState(false);

  // Compute this workout's volume
  const volume = useMemo(() => {
    let sum = 0;
    for (const we of workout.exercises) {
      for (const s of we.sets) {
        if (!s.isCompleted) continue;
        const w = s.weightUnit === 'lb' ? s.weight * 0.4536 : s.weight;
        sum += w * s.reps;
      }
    }
    return sum;
  }, [workout]);

  const completed = workout.exercises.reduce(
    (n, we) => n + we.sets.filter((s) => s.isCompleted).length,
    0,
  );
  const total = workout.exercises.reduce((n, we) => n + we.sets.length, 0);

  // Compare to month avg → bar fill ratio
  const ratio = avgVolume > 0 ? Math.min(1.2, volume / avgVolume) : 0.5;

  const date = new Date(workout.startedAt);
  const dayLabel = date.toLocaleDateString('zh-TW', {
    day: 'numeric',
    weekday: 'narrow',
  });

  const handleDelete = async () => {
    setConfirming(false);
    await core.workoutRepo.softDelete(workout.id);
    pushToast({ kind: 'info', message: '已移除紀錄' });
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {/* Main link area */}
        <Link to={`/history/${workout.id}`} className="block flex-1 p-3 hover:bg-secondary/40">
          <div className="flex items-center gap-3">
            {/* Date column */}
            <div className="w-12 shrink-0 text-center">
              <div className="num text-[20px] font-extrabold leading-none tabular-nums">
                {date.getDate()}
              </div>
              <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[1px] text-muted-foreground">
                {dayLabel.replace(/\d+/g, '').trim() || '—'}
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[14.5px] font-bold leading-tight">{workout.name}</span>
                {workout.mode === 'ad_hoc' ? (
                  <Chip tone="outline" size="xs">
                    自由
                  </Chip>
                ) : null}
                {workout.status === 'abandoned' ? (
                  <Chip tone="muted" size="xs">
                    放棄
                  </Chip>
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <span>{formatDuration(workout.durationSeconds)}</span>
                <span>·</span>
                <span className="num">
                  {completed}/{total} 組
                </span>
                <span>·</span>
                <span className="num">{Math.round(volume).toLocaleString('zh-TW')}kg</span>
              </div>

              {/* Mini bar */}
              <div className="mt-2 flex items-center gap-1.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      ratio >= 1 ? 'bg-primary' : 'bg-primary/60',
                    )}
                    style={{ width: `${Math.min(100, ratio * 100)}%` }}
                  />
                </div>
                <span className="num text-[10px] font-semibold text-muted-foreground">
                  {ratio >= 1 ? '↑' : '↓'}
                  {Math.abs(Math.round((ratio - 1) * 100))}%
                </span>
              </div>
            </div>

            <ChevronRight size={16} className="shrink-0 text-muted-foreground" strokeWidth={2} />
          </div>
        </Link>

        {/* Delete affordance (button-style instead of swipe for V1) */}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label="刪除紀錄"
          className="grid w-12 shrink-0 place-items-center border-l border-border text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      </div>

      {confirming ? (
        <div
          role="dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm"
          onClick={() => setConfirming(false)}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm p-5 text-center shadow-ds-lg"
          >
            <h3 className="text-[16px] font-bold">移除這筆紀錄？</h3>
            <p className="mt-2 text-[13px] text-muted-foreground">
              軟刪除、可由設定的「資料」區域復原。
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="md" block onClick={() => setConfirming(false)}>
                取消
              </Button>
              <Button variant="destructive" size="md" block onClick={handleDelete}>
                移除
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty / Loading
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="mt-12 flex flex-col items-center text-center">
      <div className="relative">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-accent text-primary">
          <Activity size={36} strokeWidth={2} />
        </div>
        <Sparkles
          size={16}
          strokeWidth={2.4}
          className="absolute -right-1 -top-1 text-primary"
        />
      </div>
      <h3 className="mt-5 text-[18px] font-extrabold tracking-[-0.02em]">還沒有訓練紀錄</h3>
      <p className="mt-1.5 max-w-[26ch] text-[13px] leading-[1.55] text-muted-foreground">
        完成第一次訓練後、會自動顯示在這裡。
      </p>
      <Link to="/today" className="mt-5">
        <Button size="md">回首頁 · 開始第一次</Button>
      </Link>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-4 space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[88px] animate-pulse rounded-lg bg-muted/40" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByMonth(workouts: Workout[]): MonthGroup[] {
  const map = new Map<string, Workout[]>();
  for (const w of workouts) {
    const d = new Date(w.startedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const arr = map.get(key) ?? [];
    arr.push(w);
    map.set(key, arr);
  }
  return Array.from(map.entries()).map(([key, items]) => {
    const sample = items[0]!;
    const d = new Date(sample.startedAt);
    const label = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
    let total = 0;
    let n = 0;
    for (const w of items) {
      const v = wholeVolume(w);
      if (v > 0) {
        total += v;
        n++;
      }
    }
    return { key, label, items, avgVolume: n > 0 ? total / n : 0 };
  });
}

function calcMonthlyStats(workouts: Workout[], now: Date): MonthlyStats {
  const thisM = now.getMonth();
  const thisY = now.getFullYear();
  const lastM = thisM === 0 ? 11 : thisM - 1;
  const lastY = thisM === 0 ? thisY - 1 : thisY;

  let thisCount = 0;
  let lastCount = 0;
  let totalVolume = 0;
  let totalSeconds = 0;
  for (const w of workouts) {
    const d = new Date(w.startedAt);
    if (d.getFullYear() === thisY && d.getMonth() === thisM) {
      thisCount++;
      totalVolume += wholeVolume(w);
      totalSeconds += w.durationSeconds ?? 0;
    } else if (d.getFullYear() === lastY && d.getMonth() === lastM) {
      lastCount++;
    }
  }
  return {
    count: thisCount,
    totalVolume,
    totalSeconds,
    vsLastMonth: lastCount > 0 ? thisCount - lastCount : null,
  };
}

function wholeVolume(w: Workout): number {
  let v = 0;
  for (const we of w.exercises) {
    for (const s of we.sets) {
      if (!s.isCompleted) continue;
      const wt = s.weightUnit === 'lb' ? s.weight * 0.4536 : s.weight;
      v += wt * s.reps;
    }
  }
  return v;
}

function fmtCompact(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return Math.round(n).toLocaleString('zh-TW');
}

function fmtHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}
