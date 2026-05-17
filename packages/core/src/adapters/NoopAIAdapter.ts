import type {
  AIPort,
  LiveAdviceInput,
  LiveAdviceResult,
  PostWorkoutReviewInput,
  PostWorkoutReviewResult,
  RecommendPlanInput,
  RecommendPlanResult,
  SuggestSubstitutesInput,
  SuggestSubstitutesResult,
} from '../ports/AIPort';

/**
 * V1 預設：AI 不可用。Domain 在 isAvailable() 為 false 時自行 fallback。
 *
 * 唯一例外：postWorkoutReview 仍回傳「友善文案」，因為 WorkoutSummary 必看，
 * 不能空白。
 */
export class NoopAIAdapter implements AIPort {
  isAvailable(): boolean {
    return false;
  }

  async recommendPlan(_input: RecommendPlanInput): Promise<RecommendPlanResult> {
    return { ok: false, reason: 'NOT_AVAILABLE' };
  }

  async liveAdvice(_input: LiveAdviceInput): Promise<LiveAdviceResult> {
    return { message: '', tone: 'encouraging' };
  }

  async suggestSubstitutes(
    _input: SuggestSubstitutesInput,
  ): Promise<SuggestSubstitutesResult> {
    return { substitutes: [] };
  }

  async postWorkoutReview(
    input: PostWorkoutReviewInput,
  ): Promise<PostWorkoutReviewResult> {
    const exerciseCount = input.workout.exercises.length;
    return {
      summary: `完成 ${exerciseCount} 個動作、做得好！`,
      nextSessionTip: '休息至少 24 小時再練同一肌群。',
      motivation: '持續就是進步、繼續加油！',
    };
  }
}
