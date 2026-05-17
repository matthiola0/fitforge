import { useNavigate } from 'react-router-dom';
import type { Goal } from '@fitforge/core';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { ChoiceCard, ContentHeader, OnboardingShell } from './OnboardingShell';

const OPTIONS: { value: Goal; icon: string; title: string; subtitle: string }[] = [
  { value: 'hypertrophy', icon: '💪', title: '增肌', subtitle: '想長肌肉、線條明顯' },
  { value: 'strength', icon: '🏋️', title: '增強力量', subtitle: '能舉更重、爆發力強' },
  { value: 'general_fitness', icon: '🌱', title: '一般體適能', subtitle: '健康、有活力' },
  { value: 'fatloss', icon: '🔥', title: '減脂', subtitle: '體脂降低、看起來精實' },
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
        title="想透過健身達到什麼？"
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
