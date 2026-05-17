import { create } from 'zustand';
import type {
  EquipmentProfile,
  ExperienceLevel,
  Goal,
  TrainingFrequency,
} from '@fitforge/core';

/**
 * useOnboardingDraft — 4 步 onboarding 累積答案、Step 5 一次寫入。
 *
 * 純記憶體 (不 persist) — 用戶若中途離開、下次重新走。
 */
export type OnboardingDraft = {
  goal: Goal | null;
  frequency: TrainingFrequency | null;
  equipment: EquipmentProfile[];
  experience: ExperienceLevel | null;
};

type Store = OnboardingDraft & {
  setGoal: (g: Goal) => void;
  setFrequency: (f: TrainingFrequency) => void;
  toggleEquipment: (e: EquipmentProfile) => void;
  setExperience: (x: ExperienceLevel) => void;
  reset: () => void;
};

const INITIAL: OnboardingDraft = {
  goal: null,
  frequency: null,
  equipment: [],
  experience: null,
};

export const useOnboardingDraft = create<Store>((set) => ({
  ...INITIAL,
  setGoal: (g) => set({ goal: g }),
  setFrequency: (f) => set({ frequency: f }),
  toggleEquipment: (e) =>
    set((s) =>
      s.equipment.includes(e)
        ? { equipment: s.equipment.filter((x) => x !== e) }
        : { equipment: [...s.equipment, e] },
    ),
  setExperience: (x) => set({ experience: x }),
  reset: () => set(INITIAL),
}));
