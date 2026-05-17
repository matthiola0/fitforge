import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestCore } from '../helpers/createTestCore';

describe('ExerciseQueryService', () => {
  let core: Awaited<ReturnType<typeof createTestCore>>;

  beforeEach(async () => {
    core = await createTestCore();
    await core.seedService.ensureSeeded();
  });

  afterEach(async () => {
    await core.destroy();
  });

  describe('query', () => {
    it('filters by bodyPart', async () => {
      const results = await core.exerciseQuery.query({ bodyPart: 'shoulders' });
      expect(results.length).toBeGreaterThanOrEqual(3);
      results.forEach((e) => expect(e.bodyPart).toBe('shoulders'));
    });

    it('filters by multiple bodyParts and includes full_body', async () => {
      const results = await core.exerciseQuery.query({ bodyParts: ['legs'] });
      const slugs = results.map((e) => e.slug);
      // Deadlift is full_body but related to legs (hamstrings/glutes) — should be included
      expect(slugs).toContain('deadlift');
      expect(slugs).toContain('back-squat');
    });

    it('filters by includesMuscle', async () => {
      const results = await core.exerciseQuery.query({ includesMuscle: 'lateral_delts' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((e) => expect(e.muscles).toContain('lateral_delts'));
    });

    it('filters by search (中文)', async () => {
      const results = await core.exerciseQuery.query({ search: '深蹲' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((e) => e.nameZh.includes('深蹲'))).toBe(true);
    });

    it('filters by search (英文，case-insensitive)', async () => {
      const results = await core.exerciseQuery.query({ search: 'BENCH' });
      expect(results.some((e) => e.slug === 'bench-press')).toBe(true);
    });
  });

  describe('findSubstitutes', () => {
    it('returns same primary muscle exercises (Tier 1)', async () => {
      const lateral = await core.exerciseRepo.getBySlug('lateral-raise');
      const subs = await core.exerciseQuery.findSubstitutes({
        exerciseId: lateral!.id,
        swapScope: 'same_body_part',
        limit: 10,
      });
      // 預期會包含 OHP / Face Pull 等
      expect(subs.length).toBeGreaterThan(0);
      subs.forEach((s) => expect(s.id).not.toBe(lateral!.id));
    });

    it('excludes original exercise', async () => {
      const benchPress = await core.exerciseRepo.getBySlug('bench-press');
      const subs = await core.exerciseQuery.findSubstitutes({ exerciseId: benchPress!.id, limit: 10 });
      expect(subs.find((s) => s.id === benchPress!.id)).toBeUndefined();
    });
  });

  describe('pickForBodyParts', () => {
    it('picks the requested count', async () => {
      const picked = await core.exerciseQuery.pickForBodyParts({
        bodyParts: ['shoulders', 'arms'],
        count: 5,
      });
      expect(picked.length).toBeLessThanOrEqual(5);
      expect(picked.length).toBeGreaterThan(0);
    });

    it('respects excludeExerciseIds', async () => {
      const lateral = await core.exerciseRepo.getBySlug('lateral-raise');
      const picked = await core.exerciseQuery.pickForBodyParts({
        bodyParts: ['shoulders'],
        count: 5,
        excludeExerciseIds: [lateral!.id],
      });
      expect(picked.find((p) => p.id === lateral!.id)).toBeUndefined();
    });
  });
});
