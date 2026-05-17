import type { Exercise, OnboardingProfile, Plan, Workout } from '../data/schemas';

/**
 * AIPort — V2 AI 教練介面 (V1 用 NoopAIAdapter)
 *
 * 對應 docs/10-ai-extension-points.md §2。
 *
 * V1 不實作任何 LLM 呼叫，但介面、prompt template 與資料採集點都已就位，
 * V2 換 ClaudeAIAdapter 即可，Domain 不需動。
 */

export interface AIPort {
  isAvailable(): boolean;

  recommendPlan(input: RecommendPlanInput): Promise<RecommendPlanResult>;
  liveAdvice(input: LiveAdviceInput): Promise<LiveAdviceResult>;
  suggestSubstitutes(input: SuggestSubstitutesInput): Promise<SuggestSubstitutesResult>;
  postWorkoutReview(input: PostWorkoutReviewInput): Promise<PostWorkoutReviewResult>;
}

// === Input / Output types ===================================================

export type RecommendPlanInput = {
  profile: OnboardingProfile;
  recentWorkouts: Workout[];
  availableExercises: Exercise[];
};

export type PlanDraft = Omit<
  Plan,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'userId' | 'isPreset' | 'isActive'
>;

export type RecommendPlanResult =
  | { ok: true; plan: PlanDraft; rationale: string }
  | {
      ok: false;
      reason: 'NOT_AVAILABLE' | 'INSUFFICIENT_DATA' | 'ERROR';
      fallbackPresetId?: string;
    };

export type LiveAdviceInput = {
  workout: Workout;
  currentExerciseId: string;
  currentSetIndex: number;
  lastSet?: { weight: number; reps: number; rpe?: number };
};

export type LiveAdviceResult = {
  message: string;
  tone: 'encouraging' | 'cautionary' | 'celebratory';
};

export type SuggestSubstitutesInput = {
  exerciseId: string;
  availableEquipment: OnboardingProfile['availableEquipment'];
};

export type SuggestSubstitutesResult = {
  substitutes: Array<{ exerciseId: string; reason: string }>;
};

export type PostWorkoutReviewInput = {
  workout: Workout;
  weeklyContext: { workoutsThisWeek: number; consecutiveDays: number };
};

export type PostWorkoutReviewResult = {
  summary: string;
  nextSessionTip: string;
  motivation: string;
};
