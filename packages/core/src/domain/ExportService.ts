import type { OnboardingRepository } from '../data/repositories/OnboardingRepository';
import type { PlanRepository } from '../data/repositories/PlanRepository';
import type { SettingsRepository } from '../data/repositories/SettingsRepository';
import type { WorkoutRepository } from '../data/repositories/WorkoutRepository';
import { PlanSchema, type Plan } from '../data/schemas/plan.schema';
import { WorkoutSchema, type Workout } from '../data/schemas/workout.schema';
import { SettingsSchema, type Settings } from '../data/schemas/settings.schema';
import {
  OnboardingProfileSchema,
  type OnboardingProfile,
} from '../data/schemas/onboarding.schema';
import { z } from 'zod';
import { err, ok, type Result } from './errors';

/**
 * ExportService — 匯出 / 匯入 JSON
 *
 * 對應 docs/04-data-model.md §9、docs/05-domain-logic.md §10。
 */

export const ExportPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string().datetime(),
  plans: z.array(PlanSchema),
  workouts: z.array(WorkoutSchema),
  settings: SettingsSchema.nullable(),
  onboardingProfile: OnboardingProfileSchema.nullable(),
});

export type ExportPayload = z.infer<typeof ExportPayloadSchema>;

export type ImportReport = {
  plansAdded: number;
  workoutsAdded: number;
  settingsReplaced: boolean;
  onboardingReplaced: boolean;
};

export class ExportService {
  constructor(
    private deps: {
      planRepo: PlanRepository;
      workoutRepo: WorkoutRepository;
      settingsRepo: SettingsRepository;
      onboardingRepo: OnboardingRepository;
    },
  ) {}

  async exportAll(userId: string = 'local'): Promise<ExportPayload> {
    const userPlans = await this.deps.planRepo.listUserPlans(userId);
    const presets = await this.deps.planRepo.listPresets();
    const plans: Plan[] = [...userPlans, ...presets.filter((p) => p.isActive)];

    // Workouts: 取全部歷史（含 abandoned），preset/user 不分
    const completed = await this.deps.workoutRepo.listByStatus('completed', userId);
    const inProgress = await this.deps.workoutRepo.findInProgress(userId);
    const abandoned = await this.deps.workoutRepo.listByStatus('abandoned', userId);
    const workouts: Workout[] = [...(inProgress ? [inProgress] : []), ...completed, ...abandoned];

    const settings: Settings | null = await this.deps.settingsRepo.get(userId);
    const onboardingProfile: OnboardingProfile | null = await this.deps.onboardingRepo.get(userId);

    return ExportPayloadSchema.parse({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      plans,
      workouts,
      settings,
      onboardingProfile,
    });
  }

  /** V1 預設 replace — 直接覆蓋。merge 模式 V2 再做。 */
  async importAll(payload: ExportPayload): Promise<Result<ImportReport>> {
    const parsed = ExportPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return err({ code: 'VALIDATION_FAILED', details: parsed.error.issues });
    }
    const data = parsed.data;

    // Upsert plans (preset 與 user plans 都用 bulkUpsert)
    if (data.plans.length > 0) {
      await this.deps.planRepo.bulkUpsert(data.plans);
    }
    // workouts
    for (const wo of data.workouts) {
      await this.deps.workoutRepo.insert(wo).catch(async () => {
        // duplicate id → update instead
        await this.deps.workoutRepo.update(wo.id, wo);
      });
    }
    let settingsReplaced = false;
    if (data.settings) {
      await this.deps.settingsRepo.upsert(data.settings);
      settingsReplaced = true;
    }
    let onboardingReplaced = false;
    if (data.onboardingProfile) {
      await this.deps.onboardingRepo.upsert(data.onboardingProfile);
      onboardingReplaced = true;
    }
    return ok({
      plansAdded: data.plans.length,
      workoutsAdded: data.workouts.length,
      settingsReplaced,
      onboardingReplaced,
    });
  }
}
