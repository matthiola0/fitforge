/**
 * RxDB JSON Schemas (storage layout)
 *
 * 對應 docs/04-data-model.md。**Zod 是型別與業務驗證的真相**，
 * 這裡只負責 RxDB 需要的：primaryKey、indexes、必填欄位。
 *
 * 慣例：
 * - 巢狀複雜結構（如 plans.days）以 `type: 'object'` + `additionalProperties: true` 帶過、不展開
 * - 只展開頂層查詢用得到的欄位
 */

import type { RxJsonSchema } from 'rxdb';

// Common string fields (length caps for index efficiency)
const ID_FIELD = { type: 'string', maxLength: 32 } as const;
const SHORT = { type: 'string', maxLength: 64 } as const;
const MEDIUM = { type: 'string', maxLength: 280 } as const;
const TIMESTAMP = { type: 'string', maxLength: 32 } as const;
const NULLABLE_TIMESTAMP = { type: ['string', 'null'], maxLength: 32 } as const;
const NULLABLE_ID = { type: ['string', 'null'], maxLength: 32 } as const;

// === Exercise =============================================================
export const exerciseRxSchema: RxJsonSchema<Record<string, unknown>> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: ID_FIELD,
    slug: SHORT,
    nameZh: SHORT,
    nameEn: SHORT,
    bodyPart: { type: 'string', maxLength: 20 },
    muscles: { type: 'array', items: { type: 'string', maxLength: 32 } },
    equipment: { type: 'array', items: { type: 'string', maxLength: 32 } },
    difficulty: { type: 'string', maxLength: 16 },
    isUnilateral: { type: 'boolean' },
    lottieAssetId: SHORT,
    description: { type: 'string' },
    steps: { type: 'array', items: { type: 'string' } },
    tips: { type: 'array', items: { type: 'string' } },
    commonMistakes: { type: 'array', items: { type: 'string' } },
    videoUrl: { type: 'string' },
    isPreset: { type: 'boolean' },
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  required: ['id', 'slug', 'nameZh', 'nameEn', 'bodyPart', 'muscles', 'difficulty', 'isPreset'],
  indexes: ['slug', 'bodyPart', 'difficulty'],
};

// === Plan =================================================================
export const planRxSchema: RxJsonSchema<Record<string, unknown>> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: ID_FIELD,
    userId: SHORT,
    name: SHORT,
    description: MEDIUM,
    isPreset: { type: 'boolean' },
    isActive: { type: 'boolean' },
    goalTag: { type: 'string', maxLength: 20 },
    frequencyPerWeek: { type: 'number', minimum: 1, maximum: 7, multipleOf: 1 },
    days: { type: 'array', items: { type: 'object', additionalProperties: true } },
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: NULLABLE_TIMESTAMP,
  },
  required: ['id', 'userId', 'name', 'isPreset', 'isActive', 'frequencyPerWeek', 'days'],
  indexes: [
    ['userId', 'isPreset'],
    ['userId', 'isActive'],
  ],
};

// === Workout ==============================================================
export const workoutRxSchema: RxJsonSchema<Record<string, unknown>> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: ID_FIELD,
    userId: SHORT,
    planId: NULLABLE_ID,
    planDayId: NULLABLE_ID,
    mode: { type: 'string', maxLength: 16 },
    targetBodyParts: { type: 'array', items: { type: 'string', maxLength: 20 } },
    name: SHORT,
    status: { type: 'string', maxLength: 16 },
    startedAt: TIMESTAMP,
    endedAt: NULLABLE_TIMESTAMP,
    durationSeconds: { type: ['number', 'null'] },
    exercises: { type: 'array', items: { type: 'object', additionalProperties: true } },
    notes: { type: 'string' },
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: NULLABLE_TIMESTAMP,
  },
  required: ['id', 'userId', 'mode', 'name', 'status', 'startedAt'],
  indexes: [
    ['userId', 'startedAt'],
    ['userId', 'status'],
  ],
};

// === Settings =============================================================
export const settingsRxSchema: RxJsonSchema<Record<string, unknown>> = {
  version: 0,
  primaryKey: 'userId',
  type: 'object',
  properties: {
    userId: ID_FIELD,
    weightUnit: { type: 'string', maxLength: 4 },
    theme: { type: 'string', maxLength: 16 },
    hapticsEnabled: { type: 'boolean' },
    soundEnabled: { type: 'boolean' },
    defaultRestSeconds: { type: 'number' },
    locale: { type: 'string', maxLength: 16 },
    onboardingCompleted: { type: 'boolean' },
    installPromptShownCount: { type: 'number' },
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  required: ['userId'],
};

// === Onboarding ===========================================================
export const onboardingRxSchema: RxJsonSchema<Record<string, unknown>> = {
  version: 0,
  primaryKey: 'userId',
  type: 'object',
  properties: {
    userId: ID_FIELD,
    goal: { type: 'string', maxLength: 32 },
    trainingFrequency: { type: 'string', maxLength: 4 },
    availableEquipment: { type: 'array', items: { type: 'string', maxLength: 32 } },
    experienceLevel: { type: 'string', maxLength: 32 },
    ageRange: { type: 'string', maxLength: 16 },
    completedAt: TIMESTAMP,
  },
  required: ['userId', 'goal', 'trainingFrequency', 'experienceLevel'],
};
