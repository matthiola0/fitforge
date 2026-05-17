import { z } from 'zod';
import { BODY_PARTS } from './tags';

/**
 * Workout — 實際訓練紀錄
 *
 * 對應 docs/04-data-model.md §3.3、docs/05-domain-logic.md §2。
 *
 * Workout 有兩種啟動模式：
 * - from_plan: 從 Plan 啟動，planId/planDayId 必填
 * - ad_hoc: 自由訓練，planId/planDayId 為 null，targetBodyParts 至少 1 個
 */

export const SetSchema = z.object({
  id: z.string().regex(/^set_/),
  setNumber: z.number().int().min(1),
  weight: z.number().min(0).max(1000),
  weightUnit: z.enum(['kg', 'lb']),
  reps: z.number().int().min(0).max(100),
  rpe: z.number().min(1).max(10).optional(),
  isWarmup: z.boolean().default(false),
  isCompleted: z.boolean().default(false),
  completedAt: z.string().datetime().nullable().default(null),
});

export type Set = z.infer<typeof SetSchema>;

export const WorkoutExerciseSchema = z.object({
  id: z.string().regex(/^we_/),
  exerciseId: z.string().regex(/^ex_/),
  order: z.number().int().nonnegative(),
  sets: z.array(SetSchema),
  notes: z.string().max(200).default(''),

  // 訓練中變更的紀錄
  source: z
    .enum(['from_plan', 'added_during_session', 'swapped', 'ad_hoc_initial'])
    .default('from_plan'),
  swappedFromExerciseId: z.string().regex(/^ex_/).nullable().default(null),
});

export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;

export const WORKOUT_STATUSES = ['in_progress', 'completed', 'abandoned'] as const;
export type WorkoutStatus = (typeof WORKOUT_STATUSES)[number];

export const WORKOUT_MODES = ['from_plan', 'ad_hoc'] as const;
export type WorkoutMode = (typeof WORKOUT_MODES)[number];

export const WorkoutSchema = z
  .object({
    id: z.string().regex(/^wo_/),
    userId: z.string().default('local'),
    planId: z
      .string()
      .regex(/^plan_/)
      .nullable(),
    planDayId: z
      .string()
      .regex(/^pd_/)
      .nullable(),

    // 啟動模式
    mode: z.enum(WORKOUT_MODES).default('from_plan'),
    targetBodyParts: z.array(z.enum(BODY_PARTS)).default([]),

    // 內容
    name: z.string().max(60),
    status: z.enum(WORKOUT_STATUSES),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime().nullable().default(null),
    durationSeconds: z.number().int().nullable().default(null),
    exercises: z.array(WorkoutExerciseSchema),
    notes: z.string().max(500).default(''),

    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable().default(null),
  })
  .refine(
    (d) =>
      d.mode !== 'from_plan' || (d.planId !== null && d.planDayId !== null),
    { message: 'from_plan 模式必須提供 planId 與 planDayId', path: ['planId'] },
  )
  .refine((d) => d.mode !== 'ad_hoc' || d.targetBodyParts.length > 0, {
    message: 'ad_hoc 模式必須提供至少 1 個 targetBodyParts',
    path: ['targetBodyParts'],
  });

export type Workout = z.infer<typeof WorkoutSchema>;
