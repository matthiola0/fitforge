import { z } from 'zod';

/**
 * Plan — 訓練計劃模板
 *
 * 對應 docs/04-data-model.md §3.2。
 *
 * - 預設 plan (isPreset: true) 不可被用戶直接編輯，需先 fork
 * - 自訂 plan 由用戶建立或從 preset fork 而來
 * - PlanDay 與 PlanExercise 採內嵌設計（非另開 collection）
 */

export const PlanExerciseSchema = z.object({
  id: z.string().regex(/^pe_/),
  exerciseId: z.string().regex(/^ex_/),
  order: z.number().int().nonnegative(),
  targetSets: z.number().int().min(1).max(20),
  targetRepsMin: z.number().int().min(1).max(100),
  targetRepsMax: z.number().int().min(1).max(100),
  restSeconds: z.number().int().min(0).max(600).default(90),
  notes: z.string().max(200).optional(),

  // 訓練中換動作能力 (見 docs/13-exercise-tagging.md §9)
  isSwappable: z.boolean().default(true),
  swapScope: z.enum(['same_muscle', 'same_body_part', 'any']).default('same_muscle'),
});

export type PlanExercise = z.infer<typeof PlanExerciseSchema>;

export const PlanDaySchema = z.object({
  id: z.string().regex(/^pd_/),
  order: z.number().int().nonnegative(),
  name: z.string().min(1).max(40),
  focusMuscleGroups: z.array(z.string()),
  exercises: z.array(PlanExerciseSchema).min(1),
});

export type PlanDay = z.infer<typeof PlanDaySchema>;

export const PlanSchema = z.object({
  id: z.string().regex(/^plan_/),
  userId: z.string().default('local'),
  name: z.string().min(1).max(60),
  description: z.string().max(280),
  isPreset: z.boolean(),
  isActive: z.boolean(),
  goalTag: z.enum(['strength', 'hypertrophy', 'general', 'fatloss']).optional(),
  frequencyPerWeek: z.number().int().min(1).max(7),
  days: z.array(PlanDaySchema).min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export type Plan = z.infer<typeof PlanSchema>;
