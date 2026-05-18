import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/app/_layout/AppShell';
// Today is the entry route — keep eager so first paint doesn't wait on a chunk
import { TodayPage } from '@/app/today/TodayPage';
import { NotFoundPage } from '@/app/NotFoundPage';

/**
 * 路由設定
 *
 * 對應 docs/07-screen-flow.md §2。
 * 所有非首頁 routes 都 lazy-load — 第一次造訪 /today 只下載 Today + AppShell + shared chunks。
 */

// === Lazy routes (each becomes its own JS chunk) ===
const ExerciseLibraryPage = lazyExport(
  () => import('@/app/exercises/ExerciseLibraryPage'),
  'ExerciseLibraryPage',
);
const ExerciseDetailPage = lazyExport(
  () => import('@/app/exercises/ExerciseDetailPage'),
  'ExerciseDetailPage',
);
const HistoryPage = lazyExport(() => import('@/app/history/HistoryPage'), 'HistoryPage');
const WorkoutDetailPage = lazyExport(
  () => import('@/app/history/WorkoutDetailPage'),
  'WorkoutDetailPage',
);
const OnboardingGoalStep = lazyExport(
  () => import('@/app/onboarding/OnboardingGoalStep'),
  'OnboardingGoalStep',
);
const OnboardingFrequencyStep = lazyExport(
  () => import('@/app/onboarding/OnboardingFrequencyStep'),
  'OnboardingFrequencyStep',
);
const OnboardingEquipmentStep = lazyExport(
  () => import('@/app/onboarding/OnboardingEquipmentStep'),
  'OnboardingEquipmentStep',
);
const OnboardingExperienceStep = lazyExport(
  () => import('@/app/onboarding/OnboardingExperienceStep'),
  'OnboardingExperienceStep',
);
const OnboardingRecommendationPage = lazyExport(
  () => import('@/app/onboarding/OnboardingRecommendationPage'),
  'OnboardingRecommendationPage',
);
const PlansPage = lazyExport(() => import('@/app/plans/PlansPage'), 'PlansPage');
const PlanDetailPage = lazyExport(
  () => import('@/app/plans/PlanDetailPage'),
  'PlanDetailPage',
);
const PlanEditorPage = lazyExport(
  () => import('@/app/plans/PlanEditorPage'),
  'PlanEditorPage',
);
const SettingsPage = lazyExport(() => import('@/app/settings/SettingsPage'), 'SettingsPage');
const AdhocBuilderPage = lazyExport(
  () => import('@/app/workout/AdhocBuilderPage'),
  'AdhocBuilderPage',
);
const PreWorkoutReviewPage = lazyExport(
  () => import('@/app/workout/PreWorkoutReviewPage'),
  'PreWorkoutReviewPage',
);
const WorkoutSessionPage = lazyExport(
  () => import('@/app/workout/WorkoutSessionPage'),
  'WorkoutSessionPage',
);
const WorkoutSummaryPage = lazyExport(
  () => import('@/app/workout/WorkoutSummaryPage'),
  'WorkoutSummaryPage',
);

// Helper: React.lazy expects default export; wrap named exports
function lazyExport<K extends string>(
  factory: () => Promise<Record<K, React.ComponentType>>,
  name: K,
) {
  return lazy(async () => {
    const mod = await factory();
    return { default: mod[name] };
  });
}

// Suspense fallback (minimal — chunks load fast over good connection)
function ChunkFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<ChunkFallback />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },

      // Onboarding
      { path: 'onboard/step1', element: withSuspense(<OnboardingGoalStep />) },
      { path: 'onboard/step2', element: withSuspense(<OnboardingFrequencyStep />) },
      { path: 'onboard/step3', element: withSuspense(<OnboardingEquipmentStep />) },
      { path: 'onboard/step4', element: withSuspense(<OnboardingExperienceStep />) },
      { path: 'onboard/recommendation', element: withSuspense(<OnboardingRecommendationPage />) },

      // Today (eager)
      { path: 'today', element: <TodayPage /> },

      // Plans
      { path: 'plans', element: withSuspense(<PlansPage />) },
      { path: 'plans/:planId', element: withSuspense(<PlanDetailPage />) },
      { path: 'plans/:planId/edit', element: withSuspense(<PlanEditorPage />) },

      // Exercises
      { path: 'exercises', element: withSuspense(<ExerciseLibraryPage />) },
      { path: 'exercises/:slug', element: withSuspense(<ExerciseDetailPage />) },

      // Workout
      { path: 'workout/new', element: withSuspense(<PreWorkoutReviewPage />) },
      { path: 'workout/adhoc', element: withSuspense(<AdhocBuilderPage />) },
      { path: 'workout/:workoutId', element: withSuspense(<WorkoutSessionPage />) },
      { path: 'workout/:workoutId/summary', element: withSuspense(<WorkoutSummaryPage />) },

      // History
      { path: 'history', element: withSuspense(<HistoryPage />) },
      { path: 'history/:workoutId', element: withSuspense(<WorkoutDetailPage />) },

      // Settings
      { path: 'settings', element: withSuspense(<SettingsPage />) },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
