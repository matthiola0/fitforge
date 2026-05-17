/**
 * Page stubs — placeholder 用、之後逐個換成實作
 *
 * 對應 docs/07-screen-flow.md §3 各畫面。
 * 命名與 SDD 一致，方便之後 1:1 替換。
 */
import type { ReactNode } from 'react';
import { Construction } from 'lucide-react';
import { PageHeader } from './_layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '@/ui/Card';
import { Badge } from '@/ui/Badge';

type StubProps = {
  title: string;
  prompt?: string; // §20 Claude Design prompt 編號
  children?: ReactNode;
  back?: boolean | string;
  showSettings?: boolean;
};

function PageStub({ title, prompt, children, back, showSettings }: StubProps) {
  return (
    <>
      <PageHeader title={title} back={back} showSettings={showSettings} />
      <div className="mx-auto max-w-md p-4">
        <Card className="p-6 text-center">
          <CardHeader className="p-0">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Construction size={22} strokeWidth={2} />
            </div>
            <CardTitle>畫面待實作</CardTitle>
            <CardDescription>
              此頁面 (<code className="font-mono text-[12px]">{title}</code>) 待從
              Claude Design 產出設計稿後落地。
            </CardDescription>
            {prompt ? (
              <div className="mt-4">
                <Badge variant="outline">
                  20-claude-design-prompts.md §{prompt}
                </Badge>
              </div>
            ) : null}
          </CardHeader>
        </Card>
        {children}
      </div>
    </>
  );
}

// === Onboarding ===
export const OnboardingGoalStep = () => <PageStub title="Onboarding · 訓練目標" prompt="3" />;
export const OnboardingFrequencyStep = () => (
  <PageStub title="Onboarding · 訓練頻率" prompt="4" back />
);
export const OnboardingEquipmentStep = () => (
  <PageStub title="Onboarding · 可用器材" prompt="5" back />
);
export const OnboardingExperienceStep = () => (
  <PageStub title="Onboarding · 訓練經驗" prompt="6" back />
);
export const OnboardingRecommendation = () => (
  <PageStub title="Onboarding · 推薦課表" prompt="7" back />
);

// === Plans ===
export const PlansPage = () => <PageStub title="課表" prompt="10" />;
export const PlanDetailPage = () => <PageStub title="課表詳情" prompt="11" back />;
export const PlanEditorPage = () => <PageStub title="編輯課表" prompt="12" back />;

// === Exercises ===
export const ExerciseLibraryPage = () => <PageStub title="動作圖庫" prompt="13" />;
export const ExerciseDetailPage = () => <PageStub title="動作詳情" prompt="14" back />;

// === Workout ===
export const PreWorkoutReviewPage = () => (
  <PageStub title="準備開始訓練" prompt="26" back />
);
export const AdhocBuilderPage = () => <PageStub title="自由訓練" prompt="27" back />;
export const WorkoutSessionPage = () => <PageStub title="訓練中" prompt="15" />;
export const WorkoutSummaryPage = () => <PageStub title="訓練完成" prompt="16" />;

// === History ===
export const HistoryPage = () => <PageStub title="歷史" prompt="17" />;
export const WorkoutDetailPage = () => <PageStub title="訓練詳情" prompt="18" back />;

// === Settings ===
export const SettingsPage = () => <PageStub title="設定" prompt="19" back />;

// === 404 ===
export const NotFoundPage = () => (
  <>
    <PageHeader title="找不到此頁面" back="/today" />
    <div className="mx-auto max-w-md p-4">
      <Card className="p-6 text-center">
        <CardTitle>404</CardTitle>
        <CardDescription className="mt-2">
          你想去的頁面不存在、或還沒實作。
        </CardDescription>
      </Card>
    </div>
  </>
);
