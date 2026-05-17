import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Plan } from '../../src/data/schemas/plan.schema';
import { createTestCore } from '../helpers/createTestCore';

describe('WorkoutEngine', () => {
  let core: Awaited<ReturnType<typeof createTestCore>>;
  let preset: Plan;

  beforeEach(async () => {
    core = await createTestCore();
    await core.seedService.ensureSeeded();
    const presets = await core.planRepo.listPresets();
    preset = presets[0]!; // Beginner Full Body A/B
  });

  afterEach(async () => {
    await core.destroy();
  });

  describe('start (from_plan)', () => {
    it('builds draft from plan day & starts workout', async () => {
      const day = preset.days[0]!;
      const draft = await core.builder.buildFromPlan({ planId: preset.id, planDayId: day.id });
      expect(draft.ok).toBe(true);
      if (!draft.ok) return;

      const result = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.status).toBe('in_progress');
      expect(result.value.mode).toBe('from_plan');
      expect(result.value.exercises.length).toBe(day.exercises.length);
      expect(result.value.exercises[0]!.sets.length).toBe(day.exercises[0]!.targetSets);
    });

    it('rejects when plan not found', async () => {
      const result = await core.workoutEngine.start({
        planId: 'plan_nonexistent',
        planDayId: 'pd_x',
        items: [],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('PLAN_NOT_FOUND');
    });

    it('rejects when an in-progress workout already exists', async () => {
      const day = preset.days[0]!;
      const draft = await core.builder.buildFromPlan({ planId: preset.id, planDayId: day.id });
      if (!draft.ok) return;

      const r1 = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });
      expect(r1.ok).toBe(true);
      const r2 = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });
      expect(r2.ok).toBe(false);
      if (r2.ok) return;
      expect(r2.error.code).toBe('CONCURRENT_ACTIVE_WORKOUT');
    });
  });

  describe('logSet', () => {
    it('records weight/reps and advances to next set', async () => {
      const day = preset.days[0]!;
      const draft = await core.builder.buildFromPlan({ planId: preset.id, planDayId: day.id });
      if (!draft.ok) return;
      const start = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });
      if (!start.ok) return;

      const log = await core.workoutEngine.logSet({
        workoutId: start.value.id,
        weight: 60,
        reps: 8,
        rpe: 7,
      });
      expect(log.ok).toBe(true);
      if (!log.ok) return;
      expect(log.value.nextSet).not.toBeNull();
      expect(log.value.restSeconds).toBeGreaterThan(0);

      const refetched = await core.workoutRepo.get(start.value.id);
      expect(refetched).not.toBeNull();
      const first = refetched!.exercises[0]!.sets[0]!;
      expect(first.isCompleted).toBe(true);
      expect(first.weight).toBe(60);
      expect(first.reps).toBe(8);
      expect(first.rpe).toBe(7);
    });

    it('rejects invalid set (weight=0 & reps=0)', async () => {
      const day = preset.days[0]!;
      const draft = await core.builder.buildFromPlan({ planId: preset.id, planDayId: day.id });
      if (!draft.ok) return;
      const start = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });
      if (!start.ok) return;
      const log = await core.workoutEngine.logSet({
        workoutId: start.value.id,
        weight: 0,
        reps: 0,
      });
      expect(log.ok).toBe(false);
      if (log.ok) return;
      expect(log.error.code).toBe('INVALID_SET');
    });

    it('returns null nextSet when all sets are completed', async () => {
      const day = preset.days[0]!;
      const draft = await core.builder.buildFromPlan({ planId: preset.id, planDayId: day.id });
      if (!draft.ok) return;
      const start = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });
      if (!start.ok) return;
      const workoutId = start.value.id;
      // Log every set
      const totalSets = start.value.exercises.reduce((sum, we) => sum + we.sets.length, 0);
      let lastResult;
      for (let i = 0; i < totalSets; i++) {
        lastResult = await core.workoutEngine.logSet({ workoutId, weight: 50, reps: 10 });
        expect(lastResult.ok).toBe(true);
      }
      if (!lastResult || !lastResult.ok) return;
      expect(lastResult.value.nextSet).toBeNull();
    });
  });

  describe('addExercise / removeExercise / swapExercise', () => {
    it('addExercise appends to end and survives reload', async () => {
      const day = preset.days[0]!;
      const draft = await core.builder.buildFromPlan({ planId: preset.id, planDayId: day.id });
      if (!draft.ok) return;
      const start = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });
      if (!start.ok) return;
      const wo = start.value;
      const lateral = await core.exerciseRepo.getBySlug('lateral-raise');
      expect(lateral).not.toBeNull();

      const result = await core.workoutEngine.addExercise({
        workoutId: wo.id,
        exerciseId: lateral!.id,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const refetched = await core.workoutRepo.get(wo.id);
      expect(refetched!.exercises.length).toBe(wo.exercises.length + 1);
      expect(refetched!.exercises.at(-1)!.exerciseId).toBe(lateral!.id);
      expect(refetched!.exercises.at(-1)!.source).toBe('added_during_session');
    });

    it('removeExercise refuses when sets are completed', async () => {
      const day = preset.days[0]!;
      const draft = await core.builder.buildFromPlan({ planId: preset.id, planDayId: day.id });
      if (!draft.ok) return;
      const start = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });
      if (!start.ok) return;

      // Log set first
      await core.workoutEngine.logSet({ workoutId: start.value.id, weight: 50, reps: 8 });

      const firstWeId = start.value.exercises[0]!.id;
      const removeResult = await core.workoutEngine.removeExercise({
        workoutId: start.value.id,
        workoutExerciseId: firstWeId,
      });
      expect(removeResult.ok).toBe(false);
      if (removeResult.ok) return;
      expect(removeResult.error.code).toBe('CANNOT_REMOVE_WITH_COMPLETED_SETS');
    });

    it('swapExercise replaces exerciseId without losing set count', async () => {
      const day = preset.days[0]!;
      const draft = await core.builder.buildFromPlan({ planId: preset.id, planDayId: day.id });
      if (!draft.ok) return;
      const start = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });
      if (!start.ok) return;
      const wo = start.value;
      const target = wo.exercises[2]!; // bent-over-row (isSwappable: true in seed)
      const subs = await core.exerciseQuery.findSubstitutes({ exerciseId: target.exerciseId });
      expect(subs.length).toBeGreaterThan(0);
      const newEx = subs[0]!;

      const result = await core.workoutEngine.swapExercise({
        workoutId: wo.id,
        workoutExerciseId: target.id,
        newExerciseId: newEx.id,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.exerciseId).toBe(newEx.id);
      expect(result.value.source).toBe('swapped');
      expect(result.value.swappedFromExerciseId).toBe(target.exerciseId);
      expect(result.value.sets.length).toBe(target.sets.length);
    });
  });

  describe('finish', () => {
    it('marks workout completed and returns summary', async () => {
      const day = preset.days[0]!;
      const draft = await core.builder.buildFromPlan({ planId: preset.id, planDayId: day.id });
      if (!draft.ok) return;
      const start = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });
      if (!start.ok) return;

      // Do one set, then finish (no need to finish everything to allow ending)
      await core.workoutEngine.logSet({ workoutId: start.value.id, weight: 60, reps: 8 });
      core.clock.advance(30 * 60); // 30 分鐘
      const result = await core.workoutEngine.finish(start.value.id);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const updated = await core.workoutRepo.get(start.value.id);
      expect(updated!.status).toBe('completed');
      expect(updated!.endedAt).not.toBeNull();
      expect(updated!.durationSeconds).toBe(1800);
      expect(result.value.completedSets).toBe(1);
      expect(result.value.totalVolume).toBe(60 * 8);
    });

    it('refuses to finish a non-in_progress workout', async () => {
      const day = preset.days[0]!;
      const draft = await core.builder.buildFromPlan({ planId: preset.id, planDayId: day.id });
      if (!draft.ok) return;
      const start = await core.workoutEngine.start({
        planId: preset.id,
        planDayId: day.id,
        items: draft.value.items,
      });
      if (!start.ok) return;
      await core.workoutEngine.finish(start.value.id);
      const second = await core.workoutEngine.finish(start.value.id);
      expect(second.ok).toBe(false);
      if (second.ok) return;
      expect(second.error.code).toBe('WORKOUT_NOT_IN_PROGRESS');
    });
  });

  describe('startAdHoc', () => {
    it('requires at least 1 targetBodyPart', async () => {
      const result = await core.workoutEngine.startAdHoc({
        targetBodyParts: [],
        items: [],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('AD_HOC_REQUIRES_BODY_PARTS');
    });

    it('creates an ad-hoc workout with mode=ad_hoc and proper targetBodyParts', async () => {
      const draft = await core.builder.buildAdHoc({
        targetBodyParts: ['shoulders', 'arms'],
        suggestedCount: 4,
      });
      expect(draft.ok).toBe(true);
      if (!draft.ok) return;
      const result = await core.workoutEngine.startAdHoc({
        targetBodyParts: ['shoulders', 'arms'],
        items: draft.value.items,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.mode).toBe('ad_hoc');
      expect(result.value.planId).toBeNull();
      expect(result.value.targetBodyParts).toEqual(['shoulders', 'arms']);
    });
  });
});
