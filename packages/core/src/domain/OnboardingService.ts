import type { OnboardingRepository } from '../data/repositories/OnboardingRepository';
import type { PlanRepository } from '../data/repositories/PlanRepository';
import type { SettingsRepository } from '../data/repositories/SettingsRepository';
import type { Plan } from '../data/schemas/plan.schema';
import type {
  ExperienceLevel,
  Goal,
  OnboardingProfile,
  TrainingFrequency,
} from '../data/schemas/onboarding.schema';
import { OnboardingProfileSchema } from '../data/schemas/onboarding.schema';
import type { AIPort } from '../ports/AIPort';
import type { ClockPort } from '../ports/ClockPort';
import { err, ok, type Result } from './errors';

/**
 * OnboardingService — 編排 onboarding 流程、推薦 plan
 *
 * 對應 docs/05-domain-logic.md §5、docs/07-screen-flow.md §3.1-3.5。
 */
export class OnboardingService {
  constructor(
    private deps: {
      onboardingRepo: OnboardingRepository;
      planRepo: PlanRepository;
      settingsRepo: SettingsRepository;
      ai: AIPort;
      clock: ClockPort;
    },
  ) {}

  async getProfile(userId: string = 'local'): Promise<OnboardingProfile | null> {
    return this.deps.onboardingRepo.get(userId);
  }

  async completeOnboarding(input: {
    goal: Goal;
    trainingFrequency: TrainingFrequency;
    availableEquipment: OnboardingProfile['availableEquipment'];
    experienceLevel: ExperienceLevel;
    ageRange?: OnboardingProfile['ageRange'];
    userId?: string;
  }): Promise<Result<{ profile: OnboardingProfile; recommendedPlan: Plan | null }>> {
    const userId = input.userId ?? 'local';
    const now = this.deps.clock.now().toISOString();

    const profile: OnboardingProfile = OnboardingProfileSchema.parse({
      userId,
      goal: input.goal,
      trainingFrequency: input.trainingFrequency,
      availableEquipment: input.availableEquipment,
      experienceLevel: input.experienceLevel,
      ageRange: input.ageRange,
      completedAt: now,
    });
    await this.deps.onboardingRepo.upsert(profile);

    // 標記 settings.onboardingCompleted
    const existing = await this.deps.settingsRepo.get(userId);
    if (existing) {
      await this.deps.settingsRepo.update(userId, { onboardingCompleted: true });
    }

    const recommendation = await this.recommendPlan(profile);
    return ok({ profile, recommendedPlan: recommendation });
  }

  /** V1: 純決策樹推薦；V2: AI 接管後若 isAvailable 改用 AI */
  async recommendPlan(profile: OnboardingProfile): Promise<Plan | null> {
    const presets = await this.deps.planRepo.listPresets();
    return decideRecommendation(profile, presets);
  }

  /** 跳過 onboarding：只標記 settings.onboardingCompleted，不寫 profile */
  async skipOnboarding(userId: string = 'local'): Promise<Result<void>> {
    const existing = await this.deps.settingsRepo.get(userId);
    if (!existing) {
      // 初始化 settings 然後標記 onboarded
      const now = this.deps.clock.now().toISOString();
      await this.deps.settingsRepo.upsert({
        userId,
        weightUnit: 'kg',
        theme: 'system',
        hapticsEnabled: true,
        soundEnabled: true,
        defaultRestSeconds: 90,
        locale: 'zh-TW',
        onboardingCompleted: true,
        installPromptShownCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await this.deps.settingsRepo.update(userId, { onboardingCompleted: true });
    }
    return ok(undefined);
  }
}

// ===== Recommendation decision tree ========================================

/**
 * 簡易推薦邏輯（V1）
 *
 * | experience + frequency  | plan                       |
 * | ----------------------- | -------------------------- |
 * | beginner + 任何頻率     | Beginner Full Body A/B     |
 * | novice + 2-3            | Beginner Full Body A/B     |
 * | novice + 4              | Upper / Lower              |
 * | intermediate + 3-6      | Push / Pull / Legs         |
 * | 其他                    | fallback: Full Body A/B    |
 */
export function decideRecommendation(profile: OnboardingProfile, presets: Plan[]): Plan | null {
  if (presets.length === 0) return null;

  const fullBody = presets.find((p) => p.id === 'plan_preset_full_body_ab');
  const upperLower = presets.find((p) => p.id === 'plan_preset_upper_lower');
  const ppl = presets.find((p) => p.id === 'plan_preset_push_pull_legs');

  const freq = parseInt(profile.trainingFrequency, 10);
  const exp = profile.experienceLevel;

  if (exp === 'absolute_beginner') {
    return fullBody ?? presets[0] ?? null;
  }
  if (exp === 'novice') {
    if (freq >= 4) return upperLower ?? fullBody ?? presets[0] ?? null;
    return fullBody ?? presets[0] ?? null;
  }
  if (exp === 'intermediate') {
    if (freq >= 5) return ppl ?? upperLower ?? presets[0] ?? null;
    if (freq === 4) return upperLower ?? ppl ?? presets[0] ?? null;
    return upperLower ?? fullBody ?? presets[0] ?? null;
  }
  return fullBody ?? presets[0] ?? null;
}
