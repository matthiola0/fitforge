import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AlertTriangle, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import type { Exercise } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Chip } from '@/ui/Chip';
import { ExerciseThumb } from '@/features/exercises/ExerciseThumb';
import {
  bodyPartLabel,
  difficultyLabel,
  EQUIPMENT_LABELS_ZH,
  muscleLabel,
} from '@/lib/labels';
import { cn } from '@/lib/cn';

/**
 * ExerciseDetailPage — §14
 *
 * 對應 docs/design/screens/14-exercise-detail.{html,jsx}。
 * V1：Lottie 用 placeholder thumb（之後接 lottie-react）。
 */
export function ExerciseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const core = useCore();
  const [exercise, setExercise] = useState<Exercise | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    core.exerciseRepo.getBySlug(slug).then((ex) => {
      if (!cancelled) setExercise(ex);
    });
    return () => {
      cancelled = true;
    };
  }, [core, slug]);

  if (exercise === undefined) {
    return (
      <>
        <PageHeader title="" back />
        <div className="mx-auto max-w-md p-4">
          <div className="h-[280px] animate-pulse rounded-lg bg-muted/50" />
        </div>
      </>
    );
  }
  if (exercise === null) {
    return <Navigate to="/exercises" replace />;
  }

  return (
    <>
      <PageHeader title={exercise.nameZh} subtitle={exercise.nameEn} back />
      <div className="mx-auto max-w-md pb-10">
        <Hero exercise={exercise} />
        <TagsRow exercise={exercise} />
        {exercise.description ? <Description text={exercise.description} /> : null}
        {exercise.steps.length > 0 ? <Steps steps={exercise.steps} /> : null}
        {exercise.tips.length > 0 ? <Tips tips={exercise.tips} /> : null}
        {exercise.commonMistakes.length > 0 ? (
          <Mistakes items={exercise.commonMistakes} />
        ) : null}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function Hero({ exercise }: { exercise: Exercise }) {
  const [playing, setPlaying] = useState(true);
  return (
    <section className="relative">
      <div className="bg-muted px-6 py-8">
        <div className="mx-auto flex aspect-[5/4] max-w-sm items-center justify-center">
          <ExerciseThumb
            exercise={exercise}
            size={240}
            animated={playing}
            className="!h-[240px] !w-[240px] rounded-xl"
          />
        </div>
      </div>
      <div className="flex items-center justify-between border-y border-border bg-card px-5 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[1.6px] text-muted-foreground">
          {playing ? '動畫示範' : '已暫停'}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? '暫停' : '播放'}
            className="grid h-9 w-9 place-items-center rounded-md text-foreground transition-colors hover:bg-secondary"
          >
            {playing ? <Pause size={18} strokeWidth={2.2} /> : <Play size={18} strokeWidth={2.2} />}
          </button>
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="重播"
            className="grid h-9 w-9 place-items-center rounded-md text-foreground transition-colors hover:bg-secondary"
          >
            <RotateCcw size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </section>
  );
}

function TagsRow({ exercise }: { exercise: Exercise }) {
  return (
    <div className="mx-auto max-w-md px-5 py-4">
      <div className="flex flex-wrap gap-1.5">
        <Chip tone="primary" size="sm">
          {bodyPartLabel(exercise.bodyPart)}
        </Chip>
        {exercise.muscles.map((m) => (
          <Chip key={m} size="sm">
            {muscleLabel(m)}
          </Chip>
        ))}
        {exercise.equipment.map((e) => (
          <Chip key={e} size="sm" tone="muted">
            {EQUIPMENT_LABELS_ZH[e] ?? e}
          </Chip>
        ))}
        <Chip size="sm" tone="outline">
          {difficultyLabel(exercise.difficulty)}
        </Chip>
        {exercise.isUnilateral ? (
          <Chip size="sm" tone="outline">
            單邊
          </Chip>
        ) : null}
      </div>
    </div>
  );
}

function Description({ text }: { text: string }) {
  return (
    <section className="px-5 pb-2">
      <p className="text-[15px] leading-[1.6] text-foreground/90">{text}</p>
    </section>
  );
}

function Section({
  icon,
  iconClass,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconClass?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border px-5 py-5">
      <h3 className="mb-3 inline-flex items-center gap-2 text-[15px] font-bold tracking-[-0.01em] text-foreground">
        <span className={cn('grid h-5 w-5 place-items-center', iconClass)}>{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <Section icon={<StepNumberDot />} title="步驟">
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="num mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[12px] font-extrabold text-primary">
              {i + 1}
            </span>
            <p className="text-[14px] leading-[1.55] text-foreground/90">{step}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function StepNumberDot() {
  return <span className="h-2 w-2 rounded-full bg-primary" />;
}

function Tips({ tips }: { tips: string[] }) {
  return (
    <Section
      icon={<Lightbulb size={16} strokeWidth={2.2} />}
      iconClass="text-success"
      title="重點提醒"
    >
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li
            key={i}
            className="rounded-md border-l-2 border-success/40 bg-success/[0.05] py-2 pl-3 pr-2 text-[13.5px] leading-[1.55] text-foreground/90"
          >
            {tip}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Mistakes({ items }: { items: string[] }) {
  return (
    <Section
      icon={<AlertTriangle size={16} strokeWidth={2.2} />}
      iconClass="text-warning"
      title="常見錯誤"
    >
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="rounded-md border-l-2 border-warning/50 bg-warning/[0.06] py-2 pl-3 pr-2 text-[13.5px] leading-[1.55] text-foreground/90"
          >
            {item}
          </li>
        ))}
      </ul>
    </Section>
  );
}
