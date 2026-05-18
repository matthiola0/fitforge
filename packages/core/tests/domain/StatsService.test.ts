import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Exercise } from '../../src/data/schemas/exercise.schema';
import type { Workout } from '../../src/data/schemas/workout.schema';
import { createTestCore } from '../helpers/createTestCore';

/**
 * StatsService — PR 偵測 + 時間型動作排除
 *
 * 對應 docs/05-domain-logic.md §4.2、StatsService.ts TIME_BASED_SLUGS。
 */
describe('StatsService.detectPRs', () => {
  let core: Awaited<ReturnType<typeof createTestCore>>;
  let benchPress: Exercise;
  let plank: Exercise;

  beforeEach(async () => {
    core = await createTestCore();
    await core.seedService.ensureSeeded();
    const all = await core.exerciseRepo.listAll();
    benchPress = all.find((e) => e.slug === 'bench-press')!;
    plank = all.find((e) => e.slug === 'plank')!;
    expect(benchPress).toBeDefined();
    expect(plank).toBeDefined();
  });

  afterEach(async () => {
    await core.destroy();
  });

  it('回傳重量型動作的 1RM PR (沒有歷史紀錄、本次有完成 set)', async () => {
    const workout = await persistCompletedWorkout(core, [
      makeExercise(benchPress.id, [{ weight: 80, reps: 5 }]),
    ]);
    const prs = await core.stats.detectPRs(workout);
    expect(prs).toHaveLength(1);
    expect(prs[0]!.exerciseId).toBe(benchPress.id);
    expect(prs[0]!.type).toBe('1RM_estimate');
    // epley(80, 5) = 80 * (1 + 5/30) ≈ 93.33
    expect(prs[0]!.value).toBeCloseTo(93.33, 1);
  });

  it('Plank 即使輸入 weight × reps 也不會吃 1RM PR (時間型動作排除)', async () => {
    const workout = await persistCompletedWorkout(core, [
      // 假設使用者誤填了 weight=10 (kg)、reps=60 (秒)
      makeExercise(plank.id, [{ weight: 10, reps: 60 }]),
    ]);
    const prs = await core.stats.detectPRs(workout);
    expect(prs).toHaveLength(0);
  });

  it('Bench Press + Plank 混合 — 只算 Bench PR、Plank 跳過', async () => {
    const workout = await persistCompletedWorkout(core, [
      makeExercise(benchPress.id, [{ weight: 100, reps: 3 }]),
      makeExercise(plank.id, [{ weight: 0, reps: 90 }]),
    ]);
    const prs = await core.stats.detectPRs(workout);
    expect(prs).toHaveLength(1);
    expect(prs[0]!.exerciseId).toBe(benchPress.id);
  });

  it('如果新訓練沒比歷史好 — 不出 PR', async () => {
    // 先存一筆比較重的歷史
    await persistCompletedWorkout(core, [
      makeExercise(benchPress.id, [{ weight: 100, reps: 5 }]),
    ]);
    // 再做一筆比較輕的
    const lighter = await persistCompletedWorkout(core, [
      makeExercise(benchPress.id, [{ weight: 80, reps: 5 }]),
    ]);
    const prs = await core.stats.detectPRs(lighter);
    expect(prs).toHaveLength(0);
  });
});

// ===== helpers ==============================================================

type SetInput = { weight: number; reps: number };

function makeExercise(exerciseId: string, sets: SetInput[]) {
  return { exerciseId, sets };
}

/**
 * 直接寫一筆 completed workout 到 DB、跳過 WorkoutEngine
 * (好處：測試只關心 StatsService 邏輯、不耦合 engine 狀態機規則)。
 */
async function persistCompletedWorkout(
  core: Awaited<ReturnType<typeof createTestCore>>,
  items: { exerciseId: string; sets: SetInput[] }[],
): Promise<Workout> {
  const now = core.clock.now().toISOString();
  const workout: Workout = {
    id: core.idGen.next('wo'),
    userId: 'local',
    planId: null,
    planDayId: null,
    mode: 'ad_hoc',
    targetBodyParts: ['core'],
    name: 'Test',
    status: 'completed',
    startedAt: now,
    endedAt: now,
    durationSeconds: 600,
    exercises: items.map((it, i) => ({
      id: core.idGen.next('we'),
      exerciseId: it.exerciseId,
      order: i,
      sets: it.sets.map((s, j) => ({
        id: core.idGen.next('set'),
        setNumber: j + 1,
        weight: s.weight,
        weightUnit: 'kg' as const,
        reps: s.reps,
        isWarmup: false,
        isCompleted: true,
        completedAt: now,
      })),
      notes: '',
      source: 'ad_hoc_initial',
      swappedFromExerciseId: null,
    })),
    notes: '',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await core.workoutRepo.insert(workout);
  // 推進時鐘 1 秒、避免多次寫入時間重複
  core.clock.advance(1);
  return workout;
}
