import { useNavigate } from 'react-router-dom';
import type { ExperienceLevel } from '@fitforge/core';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { ChoiceCard, ContentHeader, OnboardingShell } from './OnboardingShell';

const OPTIONS: { value: ExperienceLevel; icon: string; title: string; subtitle: string }[] = [
  { value: 'absolute_beginner', icon: '🌱', title: '完全新手', subtitle: '從來沒練過 / 不滿 1 個月' },
  { value: 'novice', icon: '🌿', title: '練過一陣子', subtitle: '1-6 個月、知道幾個動作' },
  { value: 'intermediate', icon: '🌳', title: '有點經驗', subtitle: '6 個月以上、想優化訓練' },
];

export function OnboardingExperienceStep() {
  const navigate = useNavigate();
  const { experience, setExperience } = useOnboardingDraft();

  return (
    <OnboardingShell
      step={4}
      showBack
      nextDisabled={!experience}
      nextLabel="完成"
      onNext={() => navigate('/onboard/recommendation')}
    >
      <ContentHeader
        title="健身經驗如何？"
        subtitle="實話實說、會給你最適合的開始"
      />
      <div className="space-y-2.5">
        {OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.value}
            icon={opt.icon}
            title={opt.title}
            subtitle={opt.subtitle}
            selected={experience === opt.value}
            onClick={() => setExperience(opt.value)}
          />
        ))}
      </div>
    </OnboardingShell>
  );
}
