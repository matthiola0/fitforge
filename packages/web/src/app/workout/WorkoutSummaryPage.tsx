import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Award, ChevronRight, MessageCircle, Share2 } from 'lucide-react';
import type { Exercise, PRRecord, Workout } from '@fitforge/core';
import type { WorkoutSummary } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { useRxQuery } from '@/lib/rxdb/useRxQuery';
import { useUiStore } from '@/stores/uiStore';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { formatDuration } from '@/lib/time/formatDuration';
import { muscleLabel } from '@/lib/labels';
import { cn } from '@/lib/cn';

/**
 * WorkoutSummaryPage — §16 (最小可用版)
 *
 * V1：時長 + 總噸位 + 完成組數 + PR 慶祝 + 動作摘要。
 * 完整 §16 設計待落地。
 */
export function WorkoutSummaryPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const core = useCore();
  const pushToast = useUiStore((s) => s.pushToast);

  const workoutQ = useRxQuery(
    () => (workoutId ? core.workoutRepo.observe(workoutId) : null),
    [core, workoutId],
  );
  const workout = workoutQ.data;

  const [exerciseMap, setExerciseMap] = useState<Map<string, Exercise>>(new Map());
  useEffect(() => {
    if (!workout) return;
    const ids = Array.from(new Set(workout.exercises.map((we) => we.exerciseId)));
    core.exerciseRepo.getMany(ids).then((exs) =>
      setExerciseMap(new Map(exs.map((e) => [e.id, e]))),
    );
  }, [core, workout]);

  // PR detection (one-shot)
  const [prs, setPrs] = useState<PRRecord[]>([]);
  useEffect(() => {
    if (!workout || workout.status !== 'completed') return;
    core.stats.detectPRs(workout).then(setPrs).catch(() => undefined);
  }, [core, workout?.id, workout?.status]);

  const summary = useMemo(() => (workout ? core.stats.computeSummary(workout) : null), [
    core,
    workout,
  ]);

  if (workoutQ.isLoading || !workout) {
    return (
      <>
        <PageHeader title="" />
        <div className="mx-auto max-w-md p-4">
          <div className="h-44 animate-pulse rounded-lg bg-muted/50" />
        </div>
      </>
    );
  }

  if (workout.status === 'in_progress') {
    return <Navigate to={`/workout/${workout.id}`} replace />;
  }

  return (
    <>
      <PageHeader title={workout.status === 'completed' ? '訓練紀錄' : '訓練紀錄'} />

      <div className="mx-auto max-w-md space-y-4 p-4 pb-20">
        {/* Celebration title (only when status === completed) */}
        {workout.status === 'completed' ? <CelebrationTitle /> : null}

        {/* Stats Hero */}
        <Card className="p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {new Date(workout.startedAt).toLocaleDateString('zh-TW', {
              month: 'numeric',
              day: 'numeric',
              weekday: 'short',
            })}
          </div>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.02em]">{workout.name}</h2>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat label="時長" value={formatDuration(workout.durationSeconds)} />
            <Stat
              label="總噸位"
              value={`${Math.round(summary?.totalVolume ?? 0).toLocaleString('zh-TW')}`}
              unit="kg"
            />
            <Stat
              label="完成組"
              value={`${summary?.completedSets ?? 0}`}
              unit={`/${summary?.totalSets ?? 0}`}
            />
          </div>
        </Card>

        {/* PRs */}
        {prs.length > 0 ? <PrCelebrationCard prs={prs} exerciseMap={exerciseMap} /> : null}

        {/* Exercise breakdown */}
        <section>
          <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            動作摘要
          </h3>
          <div className="space-y-2">
            {workout.exercises.map((we) => {
              const ex = exerciseMap.get(we.exerciseId);
              const completed = we.sets.filter((s) => s.isCompleted);
              return (
                <Card key={we.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-bold">
                        {ex?.nameZh ?? we.exerciseId}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{ex?.nameEn}</div>
                    </div>
                    {ex && ex.muscles[0] ? (
                      <Chip tone="primary" size="xs">
                        {muscleLabel(ex.muscles[0])}
                      </Chip>
                    ) : null}
                  </div>
                  {completed.length > 0 ? (
                    <ul className="mt-2 space-y-0.5 text-[12.5px] text-foreground/85">
                      {completed.map((s) => (
                        <li
                          key={s.id}
                          className="num flex items-baseline justify-between tabular-nums"
                        >
                          <span className="text-muted-foreground">SET {s.setNumber}</span>
                          <span className="font-bold">
                            {s.weight}
                            {s.weightUnit} × {s.reps}
                            {s.rpe ? <span className="ml-2 text-muted-foreground">RPE {s.rpe}</span> : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[11.5px] text-muted-foreground">未完成</p>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Coach note */}
        {workout.status === 'completed' && summary ? (
          <CoachNote workout={workout} summary={summary} prs={prs} />
        ) : null}
      </div>

      {/* Sticky CTA: share + back to home */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-md gap-2 px-4 py-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleShare(workout, summary, prs, exerciseMap, pushToast)}
          >
            <Share2 size={16} strokeWidth={2.4} />
            分享圖
          </Button>
          <Link to="/today" className="block flex-1">
            <Button block size="lg">
              回首頁
              <ChevronRight size={16} strokeWidth={2.5} />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Celebration title — sparkle animations + big 「訓練完成」
// ---------------------------------------------------------------------------

function CelebrationTitle() {
  return (
    <div className="relative px-2 pt-4 text-center">
      {/* sparkles arranged around the title — 6 total per design */}
      <Sparkle className="left-[18%] top-2 h-3 w-3 [animation-delay:0ms]" />
      <Sparkle className="left-[28%] top-0 h-1.5 w-1.5 opacity-70 [animation-delay:600ms]" />
      <Sparkle className="left-[12%] top-12 h-1 w-1 opacity-60 [animation-delay:1100ms]" />
      <Sparkle className="right-[18%] top-3 h-3 w-3 [animation-delay:300ms]" />
      <Sparkle className="right-[28%] top-12 h-1.5 w-1.5 opacity-70 [animation-delay:900ms]" />
      <Sparkle className="right-[14%] top-0 h-1 w-1 opacity-60 [animation-delay:1400ms]" />
      <h1 className="text-[36px] font-extrabold leading-none tracking-[-0.03em] text-primary">
        訓練完成
      </h1>
      <p className="mt-3 text-[13.5px] text-muted-foreground">辛苦了、紀錄已存</p>
    </div>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('absolute block animate-sparkle rounded-full bg-primary', className)}
    />
  );
}

// ---------------------------------------------------------------------------
// PR celebration card — multi-radial gradient + corner sparkles
// ---------------------------------------------------------------------------

function PrCelebrationCard({
  prs,
  exerciseMap,
}: {
  prs: PRRecord[];
  exerciseMap: Map<string, Exercise>;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-lg p-5 shadow-ds-glow"
      style={{
        background:
          'radial-gradient(120% 80% at 20% 0%, hsl(15 100% 92%) 0%, transparent 60%), ' +
          'radial-gradient(110% 80% at 100% 100%, hsl(38 90% 88%) 0%, transparent 55%), ' +
          'hsl(var(--card))',
        border: '1px solid hsl(var(--primary) / 0.30)',
      }}
    >
      {/* Corner sparkles */}
      <Sparkle className="right-3 top-2.5 h-1 w-1 opacity-70 [animation-delay:200ms]" />
      <Sparkle className="right-6 bottom-5 h-1.5 w-1.5 [animation-delay:1200ms]" />
      <Sparkle className="right-24 top-7 h-1 w-1 opacity-60 [animation-delay:1800ms]" />

      <div className="relative flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-ds-md">
          <Award size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-[17px] font-extrabold tracking-[-0.015em]">
          新紀錄 <span className="num text-primary">({prs.length})</span>
        </h3>
      </div>
      <ul className="relative mt-3 space-y-1.5">
        {prs.map((pr, i) => (
          <li
            key={i}
            className="flex items-baseline justify-between border-l-2 border-primary/40 bg-card/70 py-1.5 pl-3 pr-2 text-[13.5px]"
          >
            <span className="font-bold">
              {exerciseMap.get(pr.exerciseId)?.nameZh ?? pr.exerciseId}
            </span>
            <span className="num font-extrabold text-primary">
              {pr.type === '1RM_estimate'
                ? '估算 1RM'
                : pr.type === 'volume_per_set'
                  ? '單組最大噸位'
                  : '次數新高'}{' '}
              · {Math.round(pr.value)}kg
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coach note — dashed-border card like a coach's handwritten message
// ---------------------------------------------------------------------------

function CoachNote({
  workout,
  summary,
  prs,
}: {
  workout: Workout;
  summary: WorkoutSummary;
  prs: PRRecord[];
}) {
  const message = useMemo(() => buildCoachMessage(workout, summary, prs), [workout, summary, prs]);

  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
        <MessageCircle size={13} strokeWidth={2.2} className="text-primary" />
        教練留言
      </div>
      <p className="mt-2 text-[14px] leading-[1.6] text-foreground/90">
        {message.headline}
      </p>
      {message.tip ? (
        <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground">
          <span className="font-bold text-foreground">下次：</span>
          {message.tip}
        </p>
      ) : null}
    </div>
  );
}

function buildCoachMessage(
  workout: Workout,
  summary: WorkoutSummary,
  prs: PRRecord[],
): { headline: string; tip?: string } {
  // Skipped sets detection (weight==0 && reps==0)
  const completed = summary.completedSets;
  const total = summary.totalSets;
  const skipped = workout.exercises.reduce(
    (n, we) =>
      n +
      we.sets.filter((s) => s.isCompleted && s.weight === 0 && s.reps === 0).length,
    0,
  );
  const truncated = total - completed;

  if (prs.length > 0) {
    return {
      headline: '持續就是進步、不錯。',
      tip: `${prs.length} 個動作刷新紀錄、下次同重量再加 2.5kg 試試。`,
    };
  }
  if (truncated > 2) {
    return {
      headline: '今天沒做完、沒關係。',
      tip: '下次別硬撐、把目標重量降 5-10%、把所有組做完。',
    };
  }
  if (skipped > 2) {
    return {
      headline: '幾組被跳過、知道就好。',
      tip: '下次先暖身再上重量、跳組通常是強度沒抓對。',
    };
  }
  return {
    headline: '穩定、沒翻車。',
    tip: '下次照同樣 setup、看能不能在第 1 組多 1-2 下。',
  };
}

// ---------------------------------------------------------------------------
// Share image — generate a canvas-based PNG and trigger download
// ---------------------------------------------------------------------------

async function handleShare(
  workout: Workout | null,
  summary: WorkoutSummary | null,
  prs: PRRecord[],
  exerciseMap: Map<string, Exercise>,
  pushToast: (t: { kind: 'success' | 'error' | 'info' | 'warning'; message: string }) => void,
) {
  if (!workout || !summary) return;
  try {
    const canvas = document.createElement('canvas');
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      pushToast({ kind: 'error', message: '產生分享圖失敗' });
      return;
    }

    // BG warm paper
    ctx.fillStyle = '#FDFCFA';
    ctx.fillRect(0, 0, W, H);

    // Top brand strip
    ctx.fillStyle = '#E14B36';
    ctx.fillRect(0, 0, W, 12);

    // Title
    ctx.fillStyle = '#E14B36';
    ctx.font = '800 88px Inter, "Noto Sans TC", sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('訓練完成', 80, 100);

    // Date + workout name
    ctx.fillStyle = '#6B6D77';
    ctx.font = '600 28px Inter, "Noto Sans TC", sans-serif';
    const date = new Date(workout.startedAt).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    ctx.fillText(date, 80, 210);

    ctx.fillStyle = '#17181F';
    ctx.font = '800 42px Inter, "Noto Sans TC", sans-serif';
    ctx.fillText(workout.name, 80, 260);

    // Stats row
    const stats = [
      { label: '時長', value: formatDuration(workout.durationSeconds) },
      { label: '總噸位', value: `${Math.round(summary.totalVolume).toLocaleString()} kg` },
      { label: '完成組', value: `${summary.completedSets} / ${summary.totalSets}` },
    ];
    const statY = 380;
    const statH = 200;
    const colW = (W - 80 * 2 - 24) / 3;
    stats.forEach((s, i) => {
      const x = 80 + i * (colW + 12);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E1DDD7';
      ctx.lineWidth = 2;
      roundRect(ctx, x, statY, colW, statH, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6B6D77';
      ctx.font = '700 22px Inter, sans-serif';
      ctx.fillText(s.label, x + 24, statY + 24);
      ctx.fillStyle = '#17181F';
      ctx.font = '800 52px Inter, "Noto Sans TC", sans-serif';
      ctx.fillText(s.value, x + 24, statY + 78);
    });

    // PRs
    let cursorY = statY + statH + 50;
    if (prs.length > 0) {
      ctx.fillStyle = '#FFEBE5';
      roundRect(ctx, 80, cursorY, W - 160, 80 + prs.length * 50, 18);
      ctx.fill();
      ctx.fillStyle = '#E14B36';
      ctx.font = '800 32px Inter, "Noto Sans TC", sans-serif';
      ctx.fillText(`💪 新紀錄 (${prs.length})`, 110, cursorY + 24);
      ctx.font = '700 24px Inter, "Noto Sans TC", sans-serif';
      prs.forEach((pr, i) => {
        const name = exerciseMap.get(pr.exerciseId)?.nameZh ?? pr.exerciseId;
        ctx.fillStyle = '#17181F';
        ctx.fillText(name, 110, cursorY + 78 + i * 44);
        ctx.fillStyle = '#E14B36';
        ctx.fillText(`${Math.round(pr.value)} kg`, W - 280, cursorY + 78 + i * 44);
      });
      cursorY += 80 + prs.length * 50 + 30;
    }

    // Brand footer
    ctx.fillStyle = '#6B6D77';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText('FitForge · 健身入門 PWA', 80, H - 90);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      pushToast({ kind: 'error', message: '產生分享圖失敗' });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `fitforge-${stamp}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    pushToast({ kind: 'success', message: '已下載分享圖' });
  } catch (e) {
    console.error('[fitforge] share failed', e);
    pushToast({ kind: 'error', message: '產生分享圖失敗' });
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="num text-[22px] font-extrabold tabular-nums tracking-[-0.02em]">
          {value}
        </span>
        {unit ? (
          <span className="text-[11.5px] font-semibold text-muted-foreground">{unit}</span>
        ) : null}
      </div>
    </div>
  );
}
