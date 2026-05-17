import { useNavigate } from 'react-router-dom';
import type { TrainingFrequency } from '@fitforge/core';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { ContentHeader, NumberChoice, OnboardingShell } from './OnboardingShell';

const OPTIONS: { value: TrainingFrequency; label: string }[] = [
  { value: '2', label: '比較輕鬆' },
  { value: '3', label: '新手常見 ⭐' },
  { value: '4', label: '進階一點' },
  { value: '5', label: '有目標感' },
  { value: '6', label: '認真衝' },
];

export function OnboardingFrequencyStep() {
  const navigate = useNavigate();
  const { frequency, setFrequency } = useOnboardingDraft();

  return (
    <OnboardingShell
      step={2}
      showBack
      nextDisabled={!frequency}
      onNext={() => navigate('/onboard/step3')}
    >
      <ContentHeader
        title="一週能練幾次？"
        subtitle="不確定就選 3 — 入門最常見"
      />
      <div className="grid grid-cols-5 gap-2">
        {OPTIONS.map((opt) => (
          <NumberChoice
            key={opt.value}
            value={opt.value}
            label={opt.label}
            selected={frequency === opt.value}
            onClick={() => setFrequency(opt.value)}
          />
        ))}
      </div>
    </OnboardingShell>
  );
}
