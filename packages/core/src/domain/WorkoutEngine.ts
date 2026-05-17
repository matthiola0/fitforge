import type { ExerciseRepository } from '../data/repositories/ExerciseRepository';
import type { PlanRepository } from '../data/repositories/PlanRepository';
import type { SettingsRepository } from '../data/repositories/SettingsRepository';
import type { WorkoutRepository } from '../data/repositories/WorkoutRepository';
import {
  WorkoutExerciseSchema,
  type Set,
  type Workout,
  type WorkoutExercise,
} from '../data/schemas/workout.schema';
import type { BodyPart } from '../data/schemas/tags';
import type { ClockPort } from '../ports/ClockPort';
import type { IdPort } from '../ports/IdPort';
import { err, ok, type Result } from './errors';
import type { ExerciseQueryService } from './ExerciseQueryService';
import { StatsService, type WorkoutSummary } from './StatsService';
import type { WorkoutDraftItem } from './WorkoutBuilderService';

export type SetPreview = {
  workoutExerciseId: string;
  exerciseId: string;
  setNumber: number;
  targetRepsMin: number;
  targetRepsMax: number;
  isLastInExercise: boolean;
  isLastSet: boolean;
};

/**
 * WorkoutEngine — 訓練 session 狀態機核心
 *
 * 對應 docs/05-domain-logic.md §2。
 *
 * 5 個主要入口 + 3 個加減換 + 1 個結束：
 * - start / startAdHoc — 啟動
 * - logSet / skipSet — 紀錄
 * - addExercise / removeExercise / swapExercise — 訓練中變更
 * - finish — 結束結算
 */
export class WorkoutEngine {
  private stats: StatsService;

  constructor(
    private deps: {
      clock: ClockPort;
      idGen: IdPort;
      workoutRepo: WorkoutRepository;
      planRepo: PlanRepository;
      exerciseRepo: ExerciseRepository;
      settingsRepo: SettingsRepository;
      exerciseQuery: ExerciseQueryService;
    },
  ) {
    this.stats = new StatsService({ workoutRepo: deps.workoutRepo });
  }

  // ===== 啟動 ==============================================================

  async start(input: {
    planId: string;
    planDayId: string;
    items: WorkoutDraftItem[];
    userId?: string;
  }): Promise<Result<Workout>> {
    const userId = input.userId ?? 'local';
    const existing = await this.deps.workoutRepo.findInProgress(userId);
    if (existing) {
      return err({ code: 'CONCURRENT_ACTIVE_WORKOUT', existingId: existing.id });
    }

    const plan = await this.deps.planRepo.get(input.planId);
    if (!plan) return err({ code: 'PLAN_NOT_FOUND', planId: input.planId });
    const day = plan.days.find((d) => d.id === input.planDayId);
    if (!day) return err({ code: 'PLAN_DAY_NOT_FOUND', planDayId: input.planDayId });

    const now = this.deps.clock.now().toISOString();
    const settings = await this.deps.settingsRepo.get(userId);
    const unit = settings?.weightUnit ?? 'kg';

    const exercises = await this.materializeExercises(input.items, unit);

    const workout: Workout = {
      id: this.deps.idGen.next('wo'),
      userId,
      planId: input.planId,
      planDayId: input.planDayId,
      mode: 'from_plan',
      targetBodyParts: [],
      name: day.name,
      status: 'in_progress',
      startedAt: now,
      endedAt: null,
      durationSeconds: null,
      exercises,
      notes: '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    return ok(await this.deps.workoutRepo.insert(workout));
  }

  async startAdHoc(input: {
    targetBodyParts: BodyPart[];
    items: WorkoutDraftItem[];
    name?: string;
    userId?: string;
  }): Promise<Result<Workout>> {
    const userId = input.userId ?? 'local';
    if (input.targetBodyParts.length === 0) {
      return err({ code: 'AD_HOC_REQUIRES_BODY_PARTS' });
    }
    const existing = await this.deps.workoutRepo.findInProgress(userId);
    if (existing) {
      return err({ code: 'CONCURRENT_ACTIVE_WORKOUT', existingId: existing.id });
    }
    const now = this.deps.clock.now().toISOString();
    const settings = await this.deps.settingsRepo.get(userId);
    const unit = settings?.weightUnit ?? 'kg';
    const exercises = await this.materializeExercises(input.items, unit);

    const workout: Workout = {
      id: this.deps.idGen.next('wo'),
      userId,
      planId: null,
      planDayId: null,
      mode: 'ad_hoc',
      targetBodyParts: input.targetBodyParts,
      name: input.name ?? '自由訓練',
      status: 'in_progress',
      startedAt: now,
      endedAt: null,
      durationSeconds: null,
      exercises,
      notes: '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    return ok(await this.deps.workoutRepo.insert(workout));
  }

  // ===== 紀錄組 ============================================================

  async logSet(input: {
    workoutId: string;
    weight: number;
    reps: number;
    rpe?: number;
  }): Promise<Result<{ nextSet: SetPreview | null; restSeconds: number }>> {
    const workout = await this.deps.workoutRepo.get(input.workoutId);
    if (!workout) return err({ code: 'WORKOUT_NOT_FOUND', workoutId: input.workoutId });
    if (workout.status !== 'in_progress') {
      return err({ code: 'WORKOUT_NOT_IN_PROGRESS', workoutId: input.workoutId, status: workout.status });
    }
    if (input.weight === 0 && input.reps === 0) {
      return err({ code: 'INVALID_SET', message: 'weight 與 reps 不能同時為 0' });
    }

    const cursor = findCurrentCursor(workout);
    if (!cursor) return err({ code: 'ALL_SETS_DONE', workoutId: workout.id });

    const { exerciseIdx, setIdx } = cursor;
    const settings = await this.deps.settingsRepo.get(workout.userId);
    const now = this.deps.clock.now().toISOString();

    // 不能修改 workout.exercises 直接，重組為新陣列
    const newExercises = workout.exercises.map((we, ei) => {
      if (ei !== exerciseIdx) return we;
      return {
        ...we,
        sets: we.sets.map((s, si) =>
          si === setIdx
            ? {
                ...s,
                weight: input.weight,
                reps: input.reps,
                rpe: input.rpe,
                weightUnit: settings?.weightUnit ?? s.weightUnit,
                isCompleted: true,
                completedAt: now,
              }
            : s,
        ),
      };
    });

    const updatedWorkout = await this.deps.workoutRepo.update(workout.id, {
      exercises: newExercises,
      updatedAt: now,
    });

    const next = findCurrentCursor(updatedWorkout);
    const restSeconds = await this.computeRestSeconds(workout, exerciseIdx);
    return ok({
      nextSet: next ? this.previewFromCursor(updatedWorkout, next) : null,
      restSeconds,
    });
  }

  async skipSet(workoutId: string): Promise<Result<void>> {
    const workout = await this.deps.workoutRepo.get(workoutId);
    if (!workout) return err({ code: 'WORKOUT_NOT_FOUND', workoutId });
    if (workout.status !== 'in_progress') {
      return err({ code: 'WORKOUT_NOT_IN_PROGRESS', workoutId, status: workout.status });
    }
    const cursor = findCurrentCursor(workout);
    if (!cursor) return err({ code: 'ALL_SETS_DONE', workoutId });

    const now = this.deps.clock.now().toISOString();
    const newExercises = workout.exercises.map((we, ei) => {
      if (ei !== cursor.exerciseIdx) return we;
      return {
        ...we,
        sets: we.sets.map((s, si) =>
          si === cursor.setIdx
            ? { ...s, isCompleted: true, completedAt: now, weight: s.weight, reps: 0 }
            : s,
        ),
      };
    });
    await this.deps.workoutRepo.update(workout.id, { exercises: newExercises, updatedAt: now });
    return ok(undefined);
  }

  // ===== 訓練中變更 ========================================================

  async addExercise(input: {
    workoutId: string;
    exerciseId: string;
    atIndex?: number;
    targetSets?: number;
    targetRepsMin?: number;
    targetRepsMax?: number;
    restSeconds?: number;
  }): Promise<Result<WorkoutExercise>> {
    const workout = await this.deps.workoutRepo.get(input.workoutId);
    if (!workout) return err({ code: 'WORKOUT_NOT_FOUND', workoutId: input.workoutId });
    if (workout.status !== 'in_progress') {
      return err({ code: 'WORKOUT_NOT_IN_PROGRESS', workoutId: input.workoutId, status: workout.status });
    }
    const exercise = await this.deps.exerciseRepo.get(input.exerciseId);
    if (!exercise) return err({ code: 'EXERCISE_NOT_FOUND', exerciseId: input.exerciseId });

    const settings = await this.deps.settingsRepo.get(workout.userId);
    const unit = settings?.weightUnit ?? 'kg';
    const sets = input.targetSets ?? 3;
    const we: WorkoutExercise = WorkoutExerciseSchema.parse({
      id: this.deps.idGen.next('we'),
      exerciseId: input.exerciseId,
      order: 0, // 重排後修正
      sets: this.makeInitialSets(sets, unit),
      notes: '',
      source: 'added_during_session',
      swappedFromExerciseId: null,
    });

    const list = [...workout.exercises];
    if (input.atIndex == null || input.atIndex >= list.length) {
      list.push(we);
    } else {
      list.splice(input.atIndex, 0, we);
    }
    const reordered = list.map((x, i) => ({ ...x, order: i }));
    await this.deps.workoutRepo.update(workout.id, {
      exercises: reordered,
      updatedAt: this.deps.clock.now().toISOString(),
    });
    return ok(we);
  }

  async removeExercise(input: {
    workoutId: string;
    workoutExerciseId: string;
  }): Promise<Result<void>> {
    const workout = await this.deps.workoutRepo.get(input.workoutId);
    if (!workout) return err({ code: 'WORKOUT_NOT_FOUND', workoutId: input.workoutId });
    if (workout.status !== 'in_progress') {
      return err({ code: 'WORKOUT_NOT_IN_PROGRESS', workoutId: input.workoutId, status: workout.status });
    }
    const target = workout.exercises.find((we) => we.id === input.workoutExerciseId);
    if (!target) return ok(undefined); // idempotent
    const hasCompleted = target.sets.some((s) => s.isCompleted);
    if (hasCompleted) {
      return err({
        code: 'CANNOT_REMOVE_WITH_COMPLETED_SETS',
        workoutExerciseId: input.workoutExerciseId,
      });
    }
    const list = workout.exercises
      .filter((we) => we.id !== input.workoutExerciseId)
      .map((we, i) => ({ ...we, order: i }));
    await this.deps.workoutRepo.update(workout.id, {
      exercises: list,
      updatedAt: this.deps.clock.now().toISOString(),
    });
    return ok(undefined);
  }

  async swapExercise(input: {
    workoutId: string;
    workoutExerciseId: string;
    newExerciseId: string;
  }): Promise<Result<WorkoutExercise>> {
    const workout = await this.deps.workoutRepo.get(input.workoutId);
    if (!workout) return err({ code: 'WORKOUT_NOT_FOUND', workoutId: input.workoutId });
    if (workout.status !== 'in_progress') {
      return err({ code: 'WORKOUT_NOT_IN_PROGRESS', workoutId: input.workoutId, status: workout.status });
    }
    const target = workout.exercises.find((we) => we.id === input.workoutExerciseId);
    if (!target) {
      return err({ code: 'EXERCISE_NOT_FOUND', exerciseId: input.workoutExerciseId });
    }
    const newExercise = await this.deps.exerciseRepo.get(input.newExerciseId);
    if (!newExercise) return err({ code: 'EXERCISE_NOT_FOUND', exerciseId: input.newExerciseId });

    // 已開始紀錄則不能換（保留資料完整性）
    if (target.sets.some((s) => s.isCompleted)) {
      return err({
        code: 'CANNOT_REMOVE_WITH_COMPLETED_SETS',
        workoutExerciseId: input.workoutExerciseId,
      });
    }

    const newWe: WorkoutExercise = WorkoutExerciseSchema.parse({
      ...target,
      exerciseId: input.newExerciseId,
      source: 'swapped',
      swappedFromExerciseId: target.exerciseId,
    });
    const list = workout.exercises.map((we) => (we.id === target.id ? newWe : we));
    await this.deps.workoutRepo.update(workout.id, {
      exercises: list,
      updatedAt: this.deps.clock.now().toISOString(),
    });
    return ok(newWe);
  }

  // ===== 結束 ==============================================================

  async finish(workoutId: string): Promise<Result<WorkoutSummary>> {
    const workout = await this.deps.workoutRepo.get(workoutId);
    if (!workout) return err({ code: 'WORKOUT_NOT_FOUND', workoutId });
    if (workout.status !== 'in_progress') {
      return err({ code: 'WORKOUT_NOT_IN_PROGRESS', workoutId, status: workout.status });
    }
    const now = this.deps.clock.now();
    const endedAt = now.toISOString();
    const startedAt = new Date(workout.startedAt);
    const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    const updated = await this.deps.workoutRepo.update(workout.id, {
      status: 'completed',
      endedAt,
      durationSeconds,
      updatedAt: endedAt,
    });
    const summary = this.stats.computeSummary(updated);
    summary.prs = await this.stats.detectPRs(updated, workout.userId);
    return ok(summary);
  }

  /** 用於 reload 還原：若有 in_progress 超過 24 小時、自動 abandon */
  async abandonIfStale(thresholdHours: number = 24, userId: string = 'local'): Promise<Workout | null> {
    const existing = await this.deps.workoutRepo.findInProgress(userId);
    if (!existing) return null;
    const ageHours =
      (this.deps.clock.now().getTime() - new Date(existing.startedAt).getTime()) /
      (1000 * 60 * 60);
    if (ageHours < thresholdHours) return existing;
    const now = this.deps.clock.now().toISOString();
    await this.deps.workoutRepo.update(existing.id, {
      status: 'abandoned',
      endedAt: now,
      durationSeconds: Math.floor(ageHours * 3600),
      updatedAt: now,
    });
    return null;
  }

  // ===== Helpers ===========================================================

  private async materializeExercises(items: WorkoutDraftItem[], unit: 'kg' | 'lb'): Promise<WorkoutExercise[]> {
    return items.map((item, i) =>
      WorkoutExerciseSchema.parse({
        id: this.deps.idGen.next('we'),
        exerciseId: item.exerciseId,
        order: i,
        sets: this.makeInitialSets(item.targetSets, unit),
        notes: '',
        source: item.source,
        swappedFromExerciseId: item.swappedFromExerciseId ?? null,
      }),
    );
  }

  private makeInitialSets(count: number, unit: 'kg' | 'lb'): Set[] {
    return Array.from({ length: count }, (_, i) => ({
      id: this.deps.idGen.next('set'),
      setNumber: i + 1,
      weight: 0,
      weightUnit: unit,
      reps: 0,
      isWarmup: false,
      isCompleted: false,
      completedAt: null,
    }));
  }

  private async computeRestSeconds(workout: Workout, exerciseIdx: number): Promise<number> {
    // 若是 from_plan，從 plan 取 restSeconds
    if (workout.mode === 'from_plan' && workout.planId && workout.planDayId) {
      const plan = await this.deps.planRepo.get(workout.planId);
      const day = plan?.days.find((d) => d.id === workout.planDayId);
      const we = workout.exercises[exerciseIdx];
      if (day && we) {
        const pe = day.exercises.find((x) => x.exerciseId === we.exerciseId);
        if (pe) return pe.restSeconds;
      }
    }
    // 否則使用 settings 預設
    const settings = await this.deps.settingsRepo.get(workout.userId);
    return settings?.defaultRestSeconds ?? 90;
  }

  private previewFromCursor(
    workout: Workout,
    cursor: { exerciseIdx: number; setIdx: number },
  ): SetPreview {
    const we = workout.exercises[cursor.exerciseIdx]!;
    const set = we.sets[cursor.setIdx]!;
    return {
      workoutExerciseId: we.id,
      exerciseId: we.exerciseId,
      setNumber: set.setNumber,
      targetRepsMin: 0,
      targetRepsMax: 0,
      isLastInExercise: cursor.setIdx === we.sets.length - 1,
      isLastSet:
        cursor.exerciseIdx === workout.exercises.length - 1 &&
        cursor.setIdx === we.sets.length - 1,
    };
  }
}

// ===== Helpers ===========================================================

function findCurrentCursor(workout: Workout): { exerciseIdx: number; setIdx: number } | null {
  for (let ei = 0; ei < workout.exercises.length; ei++) {
    const we = workout.exercises[ei]!;
    for (let si = 0; si < we.sets.length; si++) {
      if (!we.sets[si]!.isCompleted) {
        return { exerciseIdx: ei, setIdx: si };
      }
    }
  }
  return null;
}
