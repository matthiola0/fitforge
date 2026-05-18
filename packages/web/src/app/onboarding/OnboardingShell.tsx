import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/ui/Button';
import { useCore } from '@/lib/core/CoreProvider';
import { useUiStore } from '@/stores/uiStore';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

/**
 * OnboardingShell — 共用 layout：top bar (progress + skip/back) + content + sticky footer CTA
 *
 * 對應 docs/design/screens/03-06 共同結構。
 */
type Props = {
  step: 1 | 2 | 3 | 4;
  totalSteps?: number;
  showBack?: boolean;
  showSkip?: boolean;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  children: ReactNode;
};

export function OnboardingShell({
  step,
  totalSteps = 4,
  showBack = false,
  showSkip = false,
  onNext,
  nextDisabled,
  nextLabel = t('common.next'),
  children,
}: Props) {
  const navigate = useNavigate();
  const core = useCore();
  const pushToast = useUiStore((s) => s.pushToast);
  const resetDraft = useOnboardingDraft((s) => s.reset);

  const skip = async () => {
    const r = await core.onboardingService.skipOnboarding();
    if (!r.ok) {
      pushToast({ kind: 'error', message: '跳過失敗、稍後再試' });
      return;
    }
    resetDraft();
    navigate('/today', { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top bar: progress + back/skip */}
      <header className="sticky top-0 z-10 bg-background pt-safe">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 pb-3 pt-4">
          {showBack ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="上一步"
              className="-ml-2 grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-secondary"
            >
              <ChevronLeft size={20} strokeWidth={2.2} />
            </button>
          ) : (
            <div className="w-9" /> /* spacer */
          )}

          <ProgressDots active={step} total={totalSteps} />

          {showSkip ? (
            <button
              type="button"
              onClick={skip}
              className="-mr-2 px-2 py-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
            >
              {t('common.skip')}
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pb-28 pt-2">
        {children}
      </main>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-safe backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <Button block size="xl" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ProgressDots({ active, total }: { active: number; total: number }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
        const isActive = n === active;
        const isDone = n < active;
        return (
          <span
            key={n}
            className={cn(
              'h-1.5 rounded-full transition-all duration-200',
              isActive ? 'w-6 bg-primary' : isDone ? 'w-1.5 bg-primary/60' : 'w-1.5 bg-border',
            )}
            aria-current={isActive ? 'step' : undefined}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Choice Card / Number Button — shared primitives used by 4 step pages
// ---------------------------------------------------------------------------

export function ChoiceCard({
  icon,
  title,
  subtitle,
  selected,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all',
        'active:scale-[0.99]',
        selected
          ? 'border-primary bg-primary/[0.06] shadow-ds-sm'
          : 'border-border bg-card hover:bg-secondary/40',
      )}
    >
      <span
        className={cn(
          'grid h-12 w-12 shrink-0 place-items-center rounded-lg text-2xl',
          selected ? 'bg-primary text-primary-foreground' : 'bg-secondary',
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-extrabold leading-tight tracking-[-0.01em]">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>
      {selected ? (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : null}
    </button>
  );
}

export function NumberChoice({
  value,
  label,
  selected,
  onClick,
}: {
  value: number | string;
  label?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all',
        'active:scale-[0.98]',
        selected
          ? 'bg-primary text-primary-foreground shadow-ds-md'
          : 'bg-secondary text-foreground hover:bg-secondary/70',
      )}
    >
      <span className="num text-[22px] font-extrabold tabular-nums leading-none tracking-[-0.02em]">
        {value}
      </span>
      {label ? (
        <span
          className={cn(
            'text-[10.5px] font-bold leading-tight tracking-[0.02em]',
            selected ? 'text-primary-foreground/85' : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
      ) : null}
    </button>
  );
}

export function ContentHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pb-6 pt-4">
      <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em]">{title}</h1>
      {subtitle ? <p className="mt-2 text-[14px] text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
