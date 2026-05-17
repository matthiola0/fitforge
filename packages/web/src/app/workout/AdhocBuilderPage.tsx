import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { BODY_PARTS, type BodyPart, type Exercise } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Sheet } from '@/ui/Sheet';
import { ExerciseThumb } from '@/features/exercises/ExerciseThumb';
import { useExercises } from '@/features/exercises/useExercises';
import { useUiStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { bodyPartLabel, muscleLabel } from '@/lib/labels';
import { cn } from '@/lib/cn';

/**
 * AdhocBuilderPage — §27
 *
 * 對應 docs/design/screens/27-adhoc-builder.html
 *
 * 2-step：
 * Step 1：選 1+ bodyPart (multi-select)
 * Step 2：選動作數 + 分岔 (智慧推薦 / 自己挑)
 */
type Step = 1 | 2;

export function AdhocBuilderPage() {
  const navigate = useNavigate();
  const core = useCore();
  const pushToast = useUiStore((s) => s.pushToast);

  const [step, setStep] = useState<Step>(1);
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [count, setCount] = useState<number>(5);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const toggle = (bp: BodyPart) =>
    setBodyParts((cur) => (cur.includes(bp) ? cur.filter((x) => x !== bp) : [...cur, bp]));

  // === Start workout ===
  const startSmart = async () => {
    if (bodyParts.length === 0) return;
    setStarting(true);
    const draft = await core.builder.buildAdHoc({
      targetBodyParts: bodyParts,
      suggestedCount: count,
    });
    if (!draft.ok) {
      setStarting(false);
      pushToast({ kind: 'error', message: `建立失敗 (${draft.error.code})` });
      return;
    }
    const r = await core.workoutEngine.startAdHoc({
      targetBodyParts: bodyParts,
      items: draft.value.items,
      name: draft.value.name,
    });
    setStarting(false);
    if (!r.ok) {
      pushToast({
        kind: 'error',
        message:
          r.error.code === 'CONCURRENT_ACTIVE_WORKOUT'
            ? '已有進行中的訓練、請先結束'
            : `啟動失敗 (${r.error.code})`,
      });
      return;
    }
    useSessionStore.getState().setActiveWorkoutId(r.value.id);
    navigate(`/workout/${r.value.id}`, { replace: true });
  };

  const startWithPicked = async (exerciseIds: string[]) => {
    setStarting(true);
    const draft = await core.builder.buildAdHocFromPicked({
      targetBodyParts: bodyParts,
      exerciseIds,
    });
    if (!draft.ok) {
      setStarting(false);
      pushToast({ kind: 'error', message: `建立失敗 (${draft.error.code})` });
      return;
    }
    const r = await core.workoutEngine.startAdHoc({
      targetBodyParts: bodyParts,
      items: draft.value.items,
      name: draft.value.name,
    });
    setStarting(false);
    if (!r.ok) {
      pushToast({ kind: 'error', message: `啟動失敗 (${r.error.code})` });
      return;
    }
    useSessionStore.getState().setActiveWorkoutId(r.value.id);
    navigate(`/workout/${r.value.id}`, { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top */}
      <header className="sticky top-0 z-10 bg-background pt-safe">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 pb-2 pt-4">
          <button
            type="button"
            onClick={() => (step === 1 ? navigate(-1) : setStep(1))}
            aria-label={step === 1 ? '取消' : '上一步'}
            className="-ml-2 grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-secondary"
          >
            <ChevronLeft size={20} strokeWidth={2.2} />
          </button>
          <div className="flex-1 text-center text-[11px] font-bold uppercase tracking-[1.5px] text-muted-foreground">
            自由訓練 · <span className="num">{step} / 2</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pb-28">
        {step === 1 ? (
          <Step1
            bodyParts={bodyParts}
            onToggle={toggle}
            onNext={() => setStep(2)}
          />
        ) : (
          <Step2
            bodyParts={bodyParts}
            count={count}
            onCountChange={setCount}
            onStartSmart={startSmart}
            onPickSelf={() => setPickerOpen(true)}
            starting={starting}
          />
        )}
      </main>

      {/* Pick yourself sheet (Step 2 path B) */}
      <SelfPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        targetCount={count}
        bodyParts={bodyParts}
        onConfirm={(ids) => {
          setPickerOpen(false);
          startWithPicked(ids);
        }}
      />
    </div>
  );
}

// ===========================================================================
// Step 1 — pick body parts
// ===========================================================================

function Step1({
  bodyParts,
  onToggle,
  onNext,
}: {
  bodyParts: BodyPart[];
  onToggle: (bp: BodyPart) => void;
  onNext: () => void;
}) {
  return (
    <>
      <div className="pb-5 pt-3">
        <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em]">
          今天想練什麼？
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">可複選、之後可調</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {BODY_PARTS.map((bp) => {
          const active = bodyParts.includes(bp);
          return (
            <button
              key={bp}
              type="button"
              onClick={() => onToggle(bp)}
              className={cn(
                'flex h-14 items-center justify-center gap-1.5 rounded-xl border-2 px-3 transition-all',
                'active:scale-[0.98]',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-ds-md scale-[1.02]'
                  : 'border-border bg-card text-foreground hover:bg-secondary/40',
              )}
            >
              {active ? (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-primary-foreground/25">
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6.5l2.5 2.5L10 3.5"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : null}
              <span className="text-[16px] font-extrabold">{bodyPartLabel(bp)}</span>
            </button>
          );
        })}
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-safe backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <Button block size="xl" onClick={onNext} disabled={bodyParts.length === 0}>
            下一步
            {bodyParts.length > 0 ? (
              <span className="ml-1 text-[12px] opacity-80">
                · 已選 {bodyParts.length}
              </span>
            ) : null}
          </Button>
        </div>
      </div>
    </>
  );
}

// ===========================================================================
// Step 2 — count + fork
// ===========================================================================

function Step2({
  bodyParts,
  count,
  onCountChange,
  onStartSmart,
  onPickSelf,
  starting,
}: {
  bodyParts: BodyPart[];
  count: number;
  onCountChange: (n: number) => void;
  onStartSmart: () => void;
  onPickSelf: () => void;
  starting: boolean;
}) {
  return (
    <>
      <div className="pt-3">
        {/* Selected chips (reminder) */}
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
            已選
          </span>
          {bodyParts.map((bp) => (
            <Chip key={bp} tone="primary" size="sm">
              {bodyPartLabel(bp)}
            </Chip>
          ))}
        </div>

        <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em]">
          想做幾個動作？
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">依推薦範圍、可以再調</p>

        {/* Count selector */}
        <div className="mt-5 grid grid-cols-6 gap-2">
          {[3, 4, 5, 6, 7, 8].map((n) => {
            const active = n === count;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onCountChange(n)}
                className={cn(
                  'num h-14 rounded-xl text-[20px] font-extrabold tabular-nums transition-all',
                  'active:scale-[0.98]',
                  active
                    ? 'bg-primary text-primary-foreground shadow-ds-md'
                    : 'bg-secondary text-foreground hover:bg-secondary/70',
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two CTAs */}
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onStartSmart}
          disabled={starting}
          className={cn(
            'group flex w-full items-start gap-3 rounded-2xl p-5 text-left transition-all',
            'border-2 border-primary/30 active:scale-[0.99]',
            'disabled:opacity-50',
          )}
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--card)) 65%)',
            boxShadow: '0 8px 24px -8px hsl(var(--primary) / 0.30)',
          }}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-ds-md">
            <Sparkles size={20} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] font-extrabold">智慧推薦</span>
              <Chip tone="primary" size="xs">
                推薦
              </Chip>
            </div>
            <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
              依你選的部位、自動推薦{' '}
              <span className="num font-bold text-foreground">{count}</span> 個動作{' '}
              <span className="text-[11px]">(可以再調)</span>
            </p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-primary" strokeWidth={2.4} />
        </button>

        <button
          type="button"
          onClick={onPickSelf}
          disabled={starting}
          className="group flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:bg-secondary/40 active:scale-[0.99] disabled:opacity-50"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-foreground">
            <BookOpen size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-extrabold">自己挑</div>
            <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
              進動作庫多選 <span className="num font-bold text-foreground">{count}</span> 個動作
            </p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-muted-foreground" strokeWidth={2.2} />
        </button>
      </div>
    </>
  );
}

// ===========================================================================
// SelfPickerSheet — 用戶自己挑 N 個動作
// ===========================================================================

function SelfPickerSheet({
  open,
  onClose,
  targetCount,
  bodyParts,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  targetCount: number;
  bodyParts: BodyPart[];
  onConfirm: (exerciseIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const { data: exercises } = useExercises({
    bodyPart: bodyParts.length === 1 ? bodyParts[0] : undefined,
  });

  // Filter to selected bodyParts (multi-bp not handled by useExercises bodyPart prop)
  const filtered = (exercises ?? []).filter((ex) =>
    bodyParts.length === 0 ? true : bodyParts.includes(ex.bodyPart) || ex.bodyPart === 'full_body',
  );

  const toggle = (id: string) => {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onConfirm(selected);
    setSelected([]);
  };

  const close = () => {
    setSelected([]);
    onClose();
  };

  const enough = selected.length >= targetCount;

  return (
    <Sheet
      open={open}
      onClose={close}
      title={
        <span>
          選擇動作 · <span className="num text-primary">{selected.length}</span> / {targetCount}
        </span>
      }
    >
      <div className="flex h-full flex-col">
        <p className="border-b border-border bg-secondary/40 px-5 py-2.5 text-[11.5px] text-muted-foreground">
          至少選 <span className="num font-bold">{targetCount}</span> 個、可超過。
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] text-muted-foreground">
              沒有符合所選部位的動作
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((ex) => (
                <li key={ex.id}>
                  <PickRow
                    exercise={ex}
                    selected={selected.includes(ex.id)}
                    onClick={() => toggle(ex.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Bottom action */}
        <div className="border-t border-border bg-card px-4 py-3">
          <Button
            block
            size="lg"
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className={enough ? 'shadow-[0_0_0_2px_hsl(var(--primary)/0.4)]' : ''}
          >
            開始 ·{' '}
            <span className="num">{selected.length}</span> 個動作
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function PickRow({
  exercise,
  selected,
  onClick,
}: {
  exercise: Exercise;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 shadow-ds-sm'
          : 'border-border bg-card hover:bg-secondary/40',
      )}
    >
      <ExerciseThumb exercise={exercise} size={40} className="!h-10 !w-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-bold leading-tight">{exercise.nameZh}</div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{exercise.nameEn}</div>
      </div>
      {exercise.muscles[0] ? (
        <Chip tone="primary" size="xs" className="shrink-0">
          {muscleLabel(exercise.muscles[0])}
        </Chip>
      ) : null}
      <span
        className={cn(
          'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
        )}
      >
        {selected ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6.5l2.5 2.5L10 3.5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    </button>
  );
}
