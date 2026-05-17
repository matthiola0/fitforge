/**
 * createCore — DI container 工廠
 *
 * 對應 docs/02-system-architecture.md §6.2、docs/06-state-management.md §5。
 *
 * UI (packages/web) 啟動時呼叫一次、把結果透過 React Context 供應。
 * 測試時可注入自訂的 clock / idGen / aiAdapter。
 */

import { createDatabase, type CreateDatabaseOptions, type FitForgeDatabase } from './data/database';
import {
  ExerciseRepository,
  OnboardingRepository,
  PlanRepository,
  SettingsRepository,
  WorkoutRepository,
} from './data/repositories';
import {
  NanoidIdGenerator,
  NoopAIAdapter,
  NoopAnalytics,
  SystemClock,
} from './adapters';
import {
  ExerciseQueryService,
  ExportService,
  OnboardingService,
  PlanService,
  RestTimer,
  SeedService,
  StatsService,
  WorkoutBuilderService,
  WorkoutEngine,
} from './domain';
import type { AIPort } from './ports/AIPort';
import type { AnalyticsPort } from './ports/AnalyticsPort';
import type { ClockPort } from './ports/ClockPort';
import type { IdPort } from './ports/IdPort';

export type CoreDeps = {
  /** 注入時鐘（預設 SystemClock） */
  clock?: ClockPort;
  /** 注入 ID 產生器（預設 nanoid） */
  idGen?: IdPort;
  /** 注入 AI adapter（V1 預設 Noop） */
  ai?: AIPort;
  /** 注入 analytics（V1 預設 Noop） */
  analytics?: AnalyticsPort;
  /** 注入已存在的 RxDB 實例（測試用） */
  database?: FitForgeDatabase;
  /** RxDB 建立選項 (database 沒注入時用) */
  databaseOptions?: CreateDatabaseOptions;
};

export type Core = Awaited<ReturnType<typeof createCore>>;

export async function createCore(deps: CoreDeps = {}) {
  const clock = deps.clock ?? new SystemClock();
  const idGen = deps.idGen ?? new NanoidIdGenerator();
  const ai = deps.ai ?? new NoopAIAdapter();
  const analytics = deps.analytics ?? new NoopAnalytics();
  const database = deps.database ?? (await createDatabase(deps.databaseOptions));

  // === Repositories ======================================================
  const exerciseRepo = new ExerciseRepository(database);
  const planRepo = new PlanRepository(database);
  const workoutRepo = new WorkoutRepository(database);
  const settingsRepo = new SettingsRepository(database);
  const onboardingRepo = new OnboardingRepository(database);

  // === Domain Services ===================================================
  const exerciseQuery = new ExerciseQueryService({ exerciseRepo });
  const stats = new StatsService({ workoutRepo });
  const planService = new PlanService({ planRepo, idGen, clock });
  const onboardingService = new OnboardingService({
    onboardingRepo,
    planRepo,
    settingsRepo,
    ai,
    clock,
  });
  const builder = new WorkoutBuilderService({
    planRepo,
    exerciseRepo,
    settingsRepo,
    exerciseQuery,
    idGen,
  });
  const workoutEngine = new WorkoutEngine({
    clock,
    idGen,
    workoutRepo,
    planRepo,
    exerciseRepo,
    settingsRepo,
    exerciseQuery,
  });
  const seedService = new SeedService({ exerciseRepo, planRepo, settingsRepo, clock });
  const exportService = new ExportService({ planRepo, workoutRepo, settingsRepo, onboardingRepo });
  const restTimer = new RestTimer(clock);

  return {
    // ports / adapters
    clock,
    idGen,
    ai,
    analytics,
    // database & repos
    database,
    exerciseRepo,
    planRepo,
    workoutRepo,
    settingsRepo,
    onboardingRepo,
    // domain services
    exerciseQuery,
    stats,
    planService,
    onboardingService,
    builder,
    workoutEngine,
    seedService,
    exportService,
    restTimer,
    // teardown
    destroy: async () => {
      restTimer.stop();
      await database.destroy();
    },
  };
}
