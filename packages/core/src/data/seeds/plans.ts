import type { Plan, PlanDay, PlanExercise } from '../schemas/plan.schema';

/**
 * 3 套預設課表 seed
 *
 * 對應 docs/04-data-model.md §5.2、docs/05-domain-logic.md §3。
 *
 * Plan ID 約定：plan_preset_<slug>
 * PlanDay ID 約定：pd_<plan_slug>_<day_key>
 * PlanExercise ID 約定：pe_<plan_slug>_<day_key>_<exercise_slug>
 *
 * isSwappable 規則：
 * - 大型複合動作 (Squat、Deadlift、RDL、Bench、OHP) → false（安全考量）
 * - 輔助動作 → true，預設 swapScope: 'same_muscle'
 */

const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

type PEInput = {
  exerciseId: string; // 動作 slug (不含 ex_)
  sets: number;
  repsMin: number;
  repsMax: number;
  rest: number;
  notes?: string;
  isSwappable?: boolean;
  swapScope?: PlanExercise['swapScope'];
};

function planExercise(planSlug: string, dayKey: string, order: number, input: PEInput): PlanExercise {
  return {
    id: `pe_${planSlug}_${dayKey}_${input.exerciseId}`,
    exerciseId: `ex_${input.exerciseId}`,
    order,
    targetSets: input.sets,
    targetRepsMin: input.repsMin,
    targetRepsMax: input.repsMax,
    restSeconds: input.rest,
    notes: input.notes,
    isSwappable: input.isSwappable ?? true,
    swapScope: input.swapScope ?? 'same_muscle',
  };
}

function day(
  planSlug: string,
  dayKey: string,
  order: number,
  name: string,
  focus: string[],
  exercises: PEInput[],
): PlanDay {
  return {
    id: `pd_${planSlug}_${dayKey}`,
    order,
    name,
    focusMuscleGroups: focus,
    exercises: exercises.map((e, i) => planExercise(planSlug, dayKey, i, e)),
  };
}

// ============ Plan 1: 新手全身入門 A/B ============
const FULL_BODY_AB: Plan = {
  id: 'plan_preset_full_body_ab',
  userId: 'local',
  name: '新手全身入門 A/B',
  description: '一週 3 次、A/B 兩天交替。涵蓋下肢、推、拉、核心，是學動作模式最好的起點。',
  isPreset: true,
  isActive: false,
  goalTag: 'general',
  frequencyPerWeek: 3,
  days: [
    day('full_body_ab', 'day_a', 0, 'Day A 全身', ['legs', 'chest', 'back', 'core'], [
      { exerciseId: 'back-squat', sets: 3, repsMin: 6, repsMax: 8, rest: 120, isSwappable: false, notes: '核心動作、暖身充分' },
      { exerciseId: 'bench-press', sets: 3, repsMin: 6, repsMax: 8, rest: 120, isSwappable: false },
      { exerciseId: 'bent-over-row', sets: 3, repsMin: 8, repsMax: 10, rest: 90, isSwappable: true, swapScope: 'same_body_part' },
      { exerciseId: 'plank', sets: 3, repsMin: 30, repsMax: 45, rest: 60, isSwappable: true, swapScope: 'same_body_part', notes: '次數單位是秒' },
    ]),
    day('full_body_ab', 'day_b', 1, 'Day B 全身', ['legs', 'shoulders', 'back', 'core'], [
      { exerciseId: 'romanian-deadlift', sets: 3, repsMin: 6, repsMax: 8, rest: 120, isSwappable: false, notes: '保持背中立、髖鉸鏈驅動' },
      { exerciseId: 'overhead-press', sets: 3, repsMin: 6, repsMax: 8, rest: 120, isSwappable: false },
      { exerciseId: 'lat-pulldown', sets: 3, repsMin: 8, repsMax: 12, rest: 90 },
      { exerciseId: 'hanging-knee-raise', sets: 3, repsMin: 8, repsMax: 12, rest: 60, swapScope: 'same_body_part' },
    ]),
  ],
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
  deletedAt: null,
};

// ============ Plan 2: 上下分化 ============
const UPPER_LOWER: Plan = {
  id: 'plan_preset_upper_lower',
  userId: 'local',
  name: '上下分化 (Upper/Lower)',
  description: '一週 4 次、上半身與下半身交替。比全身分化頻率高，適合已能做 6-8 週訓練的人。',
  isPreset: true,
  isActive: false,
  goalTag: 'hypertrophy',
  frequencyPerWeek: 4,
  days: [
    day('upper_lower', 'upper', 0, 'Upper Day 上半身', ['chest', 'back', 'shoulders', 'arms'], [
      { exerciseId: 'bench-press', sets: 4, repsMin: 6, repsMax: 8, rest: 120, isSwappable: false },
      { exerciseId: 'bent-over-row', sets: 4, repsMin: 6, repsMax: 8, rest: 120, isSwappable: false },
      { exerciseId: 'overhead-press', sets: 3, repsMin: 8, repsMax: 10, rest: 90, isSwappable: false },
      { exerciseId: 'lat-pulldown', sets: 3, repsMin: 8, repsMax: 12, rest: 90 },
      { exerciseId: 'lateral-raise', sets: 3, repsMin: 12, repsMax: 15, rest: 60 },
      { exerciseId: 'triceps-pushdown', sets: 3, repsMin: 10, repsMax: 12, rest: 60 },
    ]),
    day('upper_lower', 'lower', 1, 'Lower Day 下半身', ['legs'], [
      { exerciseId: 'back-squat', sets: 4, repsMin: 6, repsMax: 8, rest: 120, isSwappable: false },
      { exerciseId: 'romanian-deadlift', sets: 3, repsMin: 8, repsMax: 10, rest: 120, isSwappable: false },
      { exerciseId: 'bulgarian-split-squat', sets: 3, repsMin: 8, repsMax: 10, rest: 90 },
      { exerciseId: 'hip-thrust', sets: 3, repsMin: 10, repsMax: 12, rest: 90 },
      { exerciseId: 'calf-raise', sets: 4, repsMin: 12, repsMax: 15, rest: 45 },
    ]),
  ],
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
  deletedAt: null,
};

// ============ Plan 3: 推拉腿 ============
const PUSH_PULL_LEGS: Plan = {
  id: 'plan_preset_push_pull_legs',
  userId: 'local',
  name: '推拉腿 (Push/Pull/Legs)',
  description: '一週 3-6 次、按推/拉/腿動作分日。健身房經典分化、適合進入第二階段的訓練者。',
  isPreset: true,
  isActive: false,
  goalTag: 'hypertrophy',
  frequencyPerWeek: 6,
  days: [
    day('ppl', 'push', 0, 'Push Day 推', ['chest', 'shoulders', 'arms'], [
      { exerciseId: 'bench-press', sets: 4, repsMin: 6, repsMax: 8, rest: 120, isSwappable: false },
      { exerciseId: 'incline-db-press', sets: 3, repsMin: 8, repsMax: 10, rest: 90 },
      { exerciseId: 'overhead-press', sets: 3, repsMin: 8, repsMax: 10, rest: 90, isSwappable: false },
      { exerciseId: 'lateral-raise', sets: 3, repsMin: 12, repsMax: 15, rest: 60 },
      { exerciseId: 'triceps-pushdown', sets: 3, repsMin: 10, repsMax: 12, rest: 60 },
    ]),
    day('ppl', 'pull', 1, 'Pull Day 拉', ['back', 'arms'], [
      { exerciseId: 'deadlift', sets: 3, repsMin: 4, repsMax: 6, rest: 180, isSwappable: false, notes: '重訓週開始、其他週可換 RDL' },
      { exerciseId: 'pull-up', sets: 3, repsMin: 6, repsMax: 10, rest: 90, notes: '做不到改 Lat Pulldown' },
      { exerciseId: 'bent-over-row', sets: 3, repsMin: 8, repsMax: 10, rest: 90 },
      { exerciseId: 'face-pull', sets: 3, repsMin: 12, repsMax: 15, rest: 60 },
      { exerciseId: 'barbell-curl', sets: 3, repsMin: 10, repsMax: 12, rest: 60 },
    ]),
    day('ppl', 'legs', 2, 'Legs Day 腿', ['legs', 'core'], [
      { exerciseId: 'back-squat', sets: 4, repsMin: 6, repsMax: 8, rest: 120, isSwappable: false },
      { exerciseId: 'romanian-deadlift', sets: 3, repsMin: 8, repsMax: 10, rest: 120, isSwappable: false },
      { exerciseId: 'hip-thrust', sets: 3, repsMin: 10, repsMax: 12, rest: 90 },
      { exerciseId: 'calf-raise', sets: 4, repsMin: 12, repsMax: 15, rest: 45 },
      { exerciseId: 'plank', sets: 3, repsMin: 30, repsMax: 45, rest: 60, swapScope: 'same_body_part', notes: '次數單位是秒' },
    ]),
  ],
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
  deletedAt: null,
};

export const PLAN_SEEDS: Plan[] = [FULL_BODY_AB, UPPER_LOWER, PUSH_PULL_LEGS];

if (PLAN_SEEDS.length !== 3) {
  throw new Error(`PLAN_SEEDS expected 3, got ${PLAN_SEEDS.length}`);
}
