import { useNavigate } from 'react-router-dom';
import type { EquipmentProfile } from '@fitforge/core';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { ChoiceCard, ContentHeader, OnboardingShell } from './OnboardingShell';

const OPTIONS: { value: EquipmentProfile; icon: string; title: string; subtitle: string }[] = [
  { value: 'home_no_equipment', icon: '🏠', title: '在家無器材', subtitle: '自體重訓練' },
  { value: 'home_dumbbells', icon: '🏠', title: '在家有啞鈴', subtitle: '啞鈴 + 自體重' },
  { value: 'gym_full', icon: '🏋️', title: '健身房完整', subtitle: '槓鈴、機械、啞鈴' },
  { value: 'gym_machines_only', icon: '🤖', title: '健身房只機械', subtitle: '只用機械訓練' },
];

export function OnboardingEquipmentStep() {
  const navigate = useNavigate();
  const { equipment, toggleEquipment } = useOnboardingDraft();

  return (
    <OnboardingShell
      step={3}
      showBack
      nextDisabled={equipment.length === 0}
      onNext={() => navigate('/onboard/step4')}
    >
      <ContentHeader
        title="平常在哪訓練？"
        subtitle="可複選 — 我們會幫你選擇能做的動作"
      />
      <div className="space-y-2.5">
        {OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.value}
            icon={opt.icon}
            title={opt.title}
            subtitle={opt.subtitle}
            selected={equipment.includes(opt.value)}
            onClick={() => toggleEquipment(opt.value)}
          />
        ))}
      </div>
    </OnboardingShell>
  );
}
