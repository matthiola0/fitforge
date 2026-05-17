import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Check, ChevronDown, ChevronUp, Dumbbell, Flame, Sparkles } from 'lucide-react';
import type { Plan } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { useUiStore } from '@/stores/uiStore';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { cn } from '@/lib/cn';

/**
 * OnboardingRecommendationPage — §7
 *
 * 對應 docs/design/screens/07-onboarding-recommendation.html
 *
 * 流程：
 * 1. 取 draft → completeOnboarding (寫 profile + 標 onboardingCompleted + 回傳推薦 plan)
 * 2. 顯示推薦 plan 卡片 + 「為什麼推薦」accordion
 * 3. 「開始這個課表」→ setActive + /today
 * 4. 「自己選課表」→ 不 setActive、/plans
 */
export function OnboardingRecommendationPage() {
  const navigate = useNavigate();
  const core = useCore();
  const draft = useOnboardingDraft();
  const reset = useOnboardingDraft((s) => s.reset);
  const pushToast = useUiStore((s) => s.pushToast);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Run completeOnboarding once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!draft.goal || !draft.frequency || draft.equipment.length === 0 || !draft.experience) {
        setError('資料不完整、回到上一步重新填');
        setLoading(false);
        return;
      }
      const r = await core.onboardingService.completeOnboarding({
        goal: draft.goal,
        trainingFrequency: draft.frequency,
        availableEquipment: draft.equipment,
        experienceLevel: draft.experience,
      });
      if (cancelled) return;
      if (!r.ok) {
        setError(`完成失敗 (${r.error.code})`);
        setLoading(false);
        return;
      }
      setPlan(r.value.recommendedPlan);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [core, draft.goal, draft.frequency, draft.equipment, draft.experience]);

  const goStart = async () => {
    if (!plan) return;
    setSubmitting(true);
    const r = await core.planService.setActive(plan.id);
    setSubmitting(false);
    if (!r.ok) {
      pushToast({ kind: 'error', message: '設定失敗、稍後再試' });
      return;
    }
    reset();
    navigate('/today', { replace: true });
  };

  const goPick = () => {
    reset();
    navigate('/plans', { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top: complete check + 5 dots */}
      <header className="sticky top-0 z-10 bg-background pt-safe">
        <div className="mx-auto flex max-w-md items-center justify-center gap-1.5 px-4 pb-3 pt-4">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className="h-1.5 w-1.5 rounded-full bg-primary/60" />
          ))}
          <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check size={9} strokeWidth={3} />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pb-32 pt-2">
        <div className="pb-5 pt-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.1em] text-accent-foreground">
            <Sparkles size={12} strokeWidth={2.4} />
            為你推薦
          </div>
          <h1 className="mt-3 text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em]">
            這個課表
            <br />
            <span className="text-primary">最適合你開始</span>
          </h1>
        </div>

        {loading ? (
          <Card className="h-56 animate-pulse" />
        ) : error ? (
          <ErrorState message={error} onBack={() => navigate('/onboard/step1')} />
        ) : !plan ? (
          <NoMatchState onPick={goPick} />
        ) : (
          <PlanCard
            plan={plan}
            accordionOpen={accordionOpen}
            onToggleAccordion={() => setAccordionOpen((o) => !o)}
            draft={draft}
          />
        )}
      </main>

      {/* Sticky CTA */}
      {plan ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-safe backdrop-blur">
          <div className="mx-auto max-w-md space-y-2 px-4 py-3">
            <Button block size="xl" onClick={goStart} disabled={submitting}>
              {submitting ? '設定中...' : '開始這個課表'}
            </Button>
            <button
              type="button"
              onClick={goPick}
              className="block w-full py-1.5 text-center text-[13px] font-semibold text-muted-foreground hover:text-foreground"
            >
              自己選課表
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

function PlanCard({
  plan,
  accordionOpen,
  onToggleAccordion,
  draft,
}: {
  plan: Plan;
  accordionOpen: boolean;
  onToggleAccordion: () => void;
  draft: ReturnType<typeof useOnboardingDraft.getState>;
}) {
  const totalExercises = plan.days.reduce((n, d) => n + d.exercises.length, 0);
  const totalSets = plan.days.reduce(
    (n, d) => n + d.exercises.reduce((m, e) => m + e.targetSets, 0),
    0,
  );

  return (
    <div className="space-y-3">
      {/* Main plan card */}
      <Card className="overflow-hidden p-5 shadow-ds-md">
        <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">{plan.name}</h2>
        {plan.description ? (
          <p className="mt-2 text-[13.5px] leading-snug text-muted-foreground">
            {plan.description}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-foreground/80">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} strokeWidth={2.2} className="text-primary" />
            每週 {plan.frequencyPerWeek} 次
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Dumbbell size={14} strokeWidth={2.2} className="text-primary" />
            {plan.days.length} 日 · {totalExercises} 動作
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Flame size={14} strokeWidth={2.2} className="text-primary" />
            {totalSets} 組
          </span>
        </div>

        {/* Daily preview */}
        <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-[13px]">
          {plan.days.map((d) => (
            <li key={d.id} className="flex items-center gap-2">
              <span className="num grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10.5px] font-extrabold text-primary">
                {d.order + 1}
              </span>
              <span className="font-bold">{d.name}</span>
              <span className="num text-muted-foreground">
                · {d.exercises.length} 動作
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Why accordion */}
      <button
        type="button"
        onClick={onToggleAccordion}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left transition-colors',
          'border-border bg-card hover:bg-secondary/40',
        )}
      >
        <span className="inline-flex items-center gap-2 text-[13px] font-bold">
          <Sparkles size={14} strokeWidth={2.2} className="text-primary" />
          為什麼推薦這個
        </span>
        {accordionOpen ? (
          <ChevronUp size={16} className="text-muted-foreground" strokeWidth={2.2} />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" strokeWidth={2.2} />
        )}
      </button>
      {accordionOpen ? <WhyAccordion plan={plan} draft={draft} /> : null}
    </div>
  );
}

function WhyAccordion({
  plan,
  draft,
}: {
  plan: Plan;
  draft: ReturnType<typeof useOnboardingDraft.getState>;
}) {
  const reasons: string[] = [];

  if (draft.experience === 'absolute_beginner') {
    reasons.push('適合你的「完全新手」起點 — 全身複合動作優先');
  } else if (draft.experience === 'novice') {
    reasons.push('適合你的「練過一陣子」經驗等級');
  } else if (draft.experience === 'intermediate') {
    reasons.push('符合你的「有點經驗」程度、進階分化');
  }

  if (draft.frequency) {
    reasons.push(`一週 ${plan.frequencyPerWeek} 次符合你設定的訓練頻率`);
  }

  if (draft.equipment.length > 0) {
    reasons.push('需要的器材你都有');
  }

  if (draft.goal === 'hypertrophy') {
    reasons.push('動作組數安排對「增肌」最有效');
  } else if (draft.goal === 'strength') {
    reasons.push('複合動作為主、適合「增強力量」');
  } else if (draft.goal === 'fatloss') {
    reasons.push('整體訓練量穩定、配合飲食最容易減脂');
  }

  return (
    <Card className="space-y-2 p-4">
      {reasons.map((r, i) => (
        <div key={i} className="flex items-start gap-2 text-[13px] leading-snug">
          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success/15 text-success">
            <Check size={11} strokeWidth={3} />
          </span>
          <span className="text-foreground/85">{r}</span>
        </div>
      ))}
    </Card>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <Card className="p-5 text-center">
      <p className="text-[14px] text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onBack} className="mt-4">
        重新開始
      </Button>
    </Card>
  );
}

function NoMatchState({ onPick }: { onPick: () => void }) {
  return (
    <Card className="p-5 text-center">
      <h3 className="text-[16px] font-bold">找不到推薦課表</h3>
      <p className="mt-2 text-[13px] text-muted-foreground">直接到課表頁挑一個吧。</p>
      <Button size="md" onClick={onPick} className="mt-4">
        去選課表
      </Button>
    </Card>
  );
}
