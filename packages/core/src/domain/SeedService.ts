import type { ExerciseRepository } from '../data/repositories/ExerciseRepository';
import type { PlanRepository } from '../data/repositories/PlanRepository';
import type { SettingsRepository } from '../data/repositories/SettingsRepository';
import { EXERCISE_SEEDS, PLAN_SEEDS } from '../data/seeds';
import type { ClockPort } from '../ports/ClockPort';

/**
 * SeedService — 首次啟動種入靜態資料。冪等。
 *
 * 對應 docs/05-domain-logic.md §6。
 */
export class SeedService {
  constructor(
    private deps: {
      exerciseRepo: ExerciseRepository;
      planRepo: PlanRepository;
      settingsRepo: SettingsRepository;
      clock: ClockPort;
    },
  ) {}

  async ensureSeeded(): Promise<{
    seededExercises: boolean;
    seededPlans: boolean;
    seededSettings: boolean;
  }> {
    let seededExercises = false;
    let seededPlans = false;
    let seededSettings = false;

    if ((await this.deps.exerciseRepo.count()) === 0) {
      await this.deps.exerciseRepo.bulkUpsert(EXERCISE_SEEDS);
      seededExercises = true;
    }

    if ((await this.deps.planRepo.count()) === 0) {
      await this.deps.planRepo.bulkUpsert(PLAN_SEEDS);
      seededPlans = true;
    }

    if (!(await this.deps.settingsRepo.get('local'))) {
      const now = this.deps.clock.now().toISOString();
      await this.deps.settingsRepo.upsert({
        userId: 'local',
        weightUnit: 'kg',
        theme: 'system',
        hapticsEnabled: true,
        soundEnabled: true,
        defaultRestSeconds: 90,
        locale: 'zh-TW',
        onboardingCompleted: false,
        installPromptShownCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      seededSettings = true;
    }

    return { seededExercises, seededPlans, seededSettings };
  }
}
