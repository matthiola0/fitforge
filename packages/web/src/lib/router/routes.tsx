import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/app/_layout/AppShell';
import { TodayPage } from '@/app/today/TodayPage';
import { ExerciseLibraryPage } from '@/app/exercises/ExerciseLibraryPage';
import { ExerciseDetailPage } from '@/app/exercises/ExerciseDetailPage';
import { HistoryPage } from '@/app/history/HistoryPage';
import { OnboardingGoalStep } from '@/app/onboarding/OnboardingGoalStep';
import { OnboardingFrequencyStep } from '@/app/onboarding/OnboardingFrequencyStep';
import { OnboardingEquipmentStep } from '@/app/onboarding/OnboardingEquipmentStep';
import { OnboardingExperienceStep } from '@/app/onboarding/OnboardingExperienceStep';
import { OnboardingRecommendationPage } from '@/app/onboarding/OnboardingRecommendationPage';
import { PlansPage } from '@/app/plans/PlansPage';
import { PlanDetailPage } from '@/app/plans/PlanDetailPage';
import { PlanEditorPage } from '@/app/plans/PlanEditorPage';
import { SettingsPage } from '@/app/settings/SettingsPage';
import { AdhocBuilderPage } from '@/app/workout/AdhocBuilderPage';
import { PreWorkoutReviewPage } from '@/app/workout/PreWorkoutReviewPage';
import { WorkoutSessionPage } from '@/app/workout/WorkoutSessionPage';
import { WorkoutSummaryPage } from '@/app/workout/WorkoutSummaryPage';
import { WorkoutDetailPage } from '@/app/history/WorkoutDetailPage';
import { NotFoundPage } from '@/app/stubs';

/**
 * 路由設定
 *
 * 對應 docs/07-screen-flow.md §2。
 *
 * V1 暫不加 guard (onboardingCompleted 檢查) — Today 頁面本身會處理「無 active plan」狀態。
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },

      // Onboarding
      { path: 'onboard/step1', element: <OnboardingGoalStep /> },
      { path: 'onboard/step2', element: <OnboardingFrequencyStep /> },
      { path: 'onboard/step3', element: <OnboardingEquipmentStep /> },
      { path: 'onboard/step4', element: <OnboardingExperienceStep /> },
      { path: 'onboard/recommendation', element: <OnboardingRecommendationPage /> },

      // Today
      { path: 'today', element: <TodayPage /> },

      // Plans
      { path: 'plans', element: <PlansPage /> },
      { path: 'plans/:planId', element: <PlanDetailPage /> },
      { path: 'plans/:planId/edit', element: <PlanEditorPage /> },

      // Exercises
      { path: 'exercises', element: <ExerciseLibraryPage /> },
      { path: 'exercises/:slug', element: <ExerciseDetailPage /> },

      // Workout
      { path: 'workout/new', element: <PreWorkoutReviewPage /> },
      { path: 'workout/adhoc', element: <AdhocBuilderPage /> },
      { path: 'workout/:workoutId', element: <WorkoutSessionPage /> },
      { path: 'workout/:workoutId/summary', element: <WorkoutSummaryPage /> },

      // History
      { path: 'history', element: <HistoryPage /> },
      { path: 'history/:workoutId', element: <WorkoutDetailPage /> },

      // Settings
      { path: 'settings', element: <SettingsPage /> },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
