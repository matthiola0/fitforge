import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestCore } from '../helpers/createTestCore';

describe('SeedService', () => {
  let core: Awaited<ReturnType<typeof createTestCore>>;

  beforeEach(async () => {
    core = await createTestCore();
  });

  afterEach(async () => {
    await core.destroy();
  });

  it('seeds 30 exercises and 3 plans on empty database', async () => {
    const result = await core.seedService.ensureSeeded();
    expect(result.seededExercises).toBe(true);
    expect(result.seededPlans).toBe(true);
    expect(result.seededSettings).toBe(true);
    expect(await core.exerciseRepo.count()).toBe(30);
    expect(await core.planRepo.count()).toBe(3);
  });

  it('is idempotent — running twice does not re-seed', async () => {
    await core.seedService.ensureSeeded();
    const second = await core.seedService.ensureSeeded();
    expect(second.seededExercises).toBe(false);
    expect(second.seededPlans).toBe(false);
    expect(second.seededSettings).toBe(false);
    expect(await core.exerciseRepo.count()).toBe(30);
  });

  it('seeds exercises with valid tag mapping', async () => {
    await core.seedService.ensureSeeded();
    const all = await core.exerciseRepo.listAll();
    expect(all.length).toBe(30);
    // Spot check
    const squat = all.find((e) => e.slug === 'back-squat');
    expect(squat).toBeDefined();
    expect(squat!.bodyPart).toBe('legs');
    expect(squat!.muscles[0]).toBe('quads');

    const lateral = all.find((e) => e.slug === 'lateral-raise');
    expect(lateral!.bodyPart).toBe('shoulders');
    expect(lateral!.muscles).toEqual(['lateral_delts']);
  });
});
