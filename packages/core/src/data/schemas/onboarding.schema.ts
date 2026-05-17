import { z } from 'zod';

/**
 * OnboardingProfile — 新手 onboarding 蒐集的 profile
 *
 * 對應 docs/04-data-model.md §3.5、docs/07-screen-flow.md §3.1-3.5。
 */

export const GOALS = ['strength', 'hypertrophy', 'general_fitness', 'fatloss'] as const;
export type Goal = (typeof GOALS)[number];

export const TRAINING_FREQUENCIES = ['2', '3', '4', '5', '6'] as const;
export type TrainingFrequency = (typeof TRAINING_FREQUENCIES)[number];

export const EQUIPMENT_PROFILES = [
  'home_no_equipment',
  'home_dumbbells',
  'gym_full',
  'gym_machines_only',
] as const;
export type EquipmentProfile = (typeof EQUIPMENT_PROFILES)[number];

export const EXPERIENCE_LEVELS = ['absolute_beginner', 'novice', 'intermediate'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const AGE_RANGES = ['<20', '20-30', '30-40', '40-50', '>50'] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

export const OnboardingProfileSchema = z.object({
  userId: z.string().default('local'),
  goal: z.enum(GOALS),
  trainingFrequency: z.enum(TRAINING_FREQUENCIES),
  availableEquipment: z.array(z.enum(EQUIPMENT_PROFILES)).min(1),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  ageRange: z.enum(AGE_RANGES).optional(),
  completedAt: z.string().datetime(),
});

export type OnboardingProfile = z.infer<typeof OnboardingProfileSchema>;
