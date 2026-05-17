import { describe, expect, it } from 'vitest';
import { decideRecommendation } from '../../src/domain/OnboardingService';
import { PLAN_SEEDS } from '../../src/data/seeds';
import type { OnboardingProfile } from '../../src/data/schemas/onboarding.schema';

describe('decideRecommendation (decision tree)', () => {
  const presets = PLAN_SEEDS;

  function profile(over: Partial<OnboardingProfile>): OnboardingProfile {
    return {
      userId: 'local',
      goal: 'general_fitness',
      trainingFrequency: '3',
      availableEquipment: ['gym_full'],
      experienceLevel: 'absolute_beginner',
      completedAt: '2026-05-14T10:00:00.000Z',
      ...over,
    };
  }

  it('absolute_beginner → Full Body A/B', () => {
    const r = decideRecommendation(profile({ experienceLevel: 'absolute_beginner' }), presets);
    expect(r?.id).toBe('plan_preset_full_body_ab');
  });

  it('novice + 2-3 → Full Body A/B', () => {
    const r = decideRecommendation(
      profile({ experienceLevel: 'novice', trainingFrequency: '3' }),
      presets,
    );
    expect(r?.id).toBe('plan_preset_full_body_ab');
  });

  it('novice + 4 → Upper/Lower', () => {
    const r = decideRecommendation(
      profile({ experienceLevel: 'novice', trainingFrequency: '4' }),
      presets,
    );
    expect(r?.id).toBe('plan_preset_upper_lower');
  });

  it('intermediate + 5+ → Push/Pull/Legs', () => {
    const r = decideRecommendation(
      profile({ experienceLevel: 'intermediate', trainingFrequency: '6' }),
      presets,
    );
    expect(r?.id).toBe('plan_preset_push_pull_legs');
  });

  it('intermediate + 4 → Upper/Lower', () => {
    const r = decideRecommendation(
      profile({ experienceLevel: 'intermediate', trainingFrequency: '4' }),
      presets,
    );
    expect(r?.id).toBe('plan_preset_upper_lower');
  });

  it('returns null if presets empty', () => {
    const r = decideRecommendation(profile({}), []);
    expect(r).toBeNull();
  });
});
