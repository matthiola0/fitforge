import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestCore } from '../helpers/createTestCore';

describe('Repositories (RxDB integration)', () => {
  let core: Awaited<ReturnType<typeof createTestCore>>;

  beforeEach(async () => {
    core = await createTestCore();
    await core.seedService.ensureSeeded();
  });

  afterEach(async () => {
    await core.destroy();
  });

  describe('ExerciseRepository', () => {
    it('counts 30 seeded exercises', async () => {
      expect(await core.exerciseRepo.count()).toBe(30);
    });

    it('finds by slug', async () => {
      const ex = await core.exerciseRepo.getBySlug('back-squat');
      expect(ex).not.toBeNull();
      expect(ex!.nameZh).toBe('槓鈴深蹲');
    });

    it('getMany returns subset', async () => {
      const list = await core.exerciseRepo.getMany(['ex_back-squat', 'ex_bench-press']);
      expect(list).toHaveLength(2);
    });
  });

  describe('PlanRepository', () => {
    it('lists 3 presets', async () => {
      const presets = await core.planRepo.listPresets();
      expect(presets).toHaveLength(3);
      expect(presets.every((p) => p.isPreset)).toBe(true);
    });

    it('setActive unsets others', async () => {
      const [p1, p2] = await core.planRepo.listPresets();
      await core.planRepo.setActive(p1!.id);
      const active1 = await core.planRepo.findActive();
      expect(active1?.id).toBe(p1!.id);

      await core.planRepo.setActive(p2!.id);
      const active2 = await core.planRepo.findActive();
      expect(active2?.id).toBe(p2!.id);

      const refetched = await core.planRepo.get(p1!.id);
      expect(refetched?.isActive).toBe(false);
    });
  });

  describe('SettingsRepository', () => {
    it('returns settings after seed', async () => {
      const s = await core.settingsRepo.get('local');
      expect(s).not.toBeNull();
      expect(s!.weightUnit).toBe('kg');
    });

    it('update merges fields', async () => {
      await core.settingsRepo.update('local', { weightUnit: 'lb' });
      const s = await core.settingsRepo.get('local');
      expect(s!.weightUnit).toBe('lb');
      // other fields preserved
      expect(s!.theme).toBe('system');
    });
  });
});
