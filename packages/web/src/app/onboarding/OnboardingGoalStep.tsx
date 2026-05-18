import { useNavigate } from 'react-router-dom';
import type { Goal } from '@fitforge/core';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { t } from '@/lib/i18n';
import { ChoiceCard, ContentHeader, OnboardingShell } from './OnboardingShell';

const OPTIONS: { value: Goal; icon: string; title: string; subtitle: string }[] = [
  { value: 'hypertrophy', icon: '💪', title: t('onboarding.goalHypertrophy'), subtitle: t('onboarding.goalHypertrophyDesc') },
  { value: 'strength', icon: '🏋️', title: t('onboarding.goalStrength'), subtitle: t('onboarding.goalStrengthDesc') },
  { value: 'general_fitness', icon: '🌱', title: t('onboarding.goalFitness'), subtitle: t('onboarding.goalFitnessDesc') },
  { value: 'fatloss', icon: '🔥', title: t('onboarding.goalFatLoss'), subtitle: t('onboarding.goalFatLossDesc') },
];

export function OnboardingGoalStep() {
  const navigate = useNavigate();
  const { goal, setGoal } = useOnboardingDraft();

  return (
    <OnboardingShell
      step={1}
      showSkip
      nextDisabled={!goal}
      onNext={() => navigate('/onboard/step2')}
    >
      <ContentHeader
        title={t('onboarding.step1Title')}
        subtitle="選一個最接近你的目標、之後可隨時調整"
      />
      <div className="space-y-2.5">
        {OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.value}
            icon={opt.icon}
            title={opt.title}
            subtitle={opt.subtitle}
            selected={goal === opt.value}
            onClick={() => setGoal(opt.value)}
          />
        ))}
      </div>
    </OnboardingShell>
  );
}
