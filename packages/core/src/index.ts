/**
 * @fitforge/core — public API
 *
 * 對應 docs/09-monorepo-structure.md §3.3。
 *
 * 這層是 V1 (packages/web) 與 V2 (packages/native) 共用業務邏輯的對外介面。
 */

// === Container ============================================================
export { createCore, type Core, type CoreDeps } from './container';

// === Schemas (Zod) =======================================================
export * from './data/schemas';

// === Repositories type exports ===========================================
export type {
  ExerciseQuery,
} from './data/repositories/ExerciseRepository';
export {
  ExerciseRepository,
  PlanRepository,
  WorkoutRepository,
  SettingsRepository,
  OnboardingRepository,
  filterExercises,
  defaultSettings,
} from './data/repositories';

// === Domain ==============================================================
export {
  ok,
  err,
  isOk,
  isErr,
  WorkoutEngine,
  WorkoutBuilderService,
  ExerciseQueryService,
  PlanService,
  StatsService,
  OnboardingService,
  decideRecommendation,
  SeedService,
  ExportService,
  ExportPayloadSchema,
  RestTimer,
} from './domain';
export type {
  Result,
  Ok,
  Err,
  DomainError,
  SetPreview,
  WorkoutDraft,
  WorkoutDraftItem,
  WorkoutDraftSource,
  WorkoutSummary,
  PRRecord,
  ExportPayload,
  ImportReport,
} from './domain';

// === Ports / Adapters ====================================================
export type { ClockPort, IdPort, IdPrefix, AIPort, AnalyticsPort } from './ports';
export type {
  RecommendPlanInput,
  RecommendPlanResult,
  LiveAdviceInput,
  LiveAdviceResult,
  SuggestSubstitutesInput,
  SuggestSubstitutesResult,
  PostWorkoutReviewInput,
  PostWorkoutReviewResult,
  PlanDraft,
} from './ports';

export {
  SystemClock,
  NanoidIdGenerator,
  NoopAIAdapter,
  NoopAnalytics,
} from './adapters';

// === Database (進階用法) ==================================================
export { createDatabase } from './data/database';
export type {
  CreateDatabaseOptions,
  FitForgeDatabase,
  FitForgeCollections,
} from './data/database';

// === Seeds (匯出讓 packages/web 在 bootstrap 取用) =========================
export { EXERCISE_SEEDS, PLAN_SEEDS } from './data/seeds';
