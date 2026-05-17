# 11 — 測試與部署 (Testing & Deployment)

> 本檔定義測試金字塔、CI 配置、Vercel 部署、發版流程。

---

## 1. 測試金字塔

```
        ┌───────────────────────────┐
        │   E2E (Playwright)        │  ← 少量、關鍵 user journey
        │   target: 5-8 scenarios   │
        ├───────────────────────────┤
        │   Integration             │  ← UI + Domain + RxDB 串
        │   target: 30+ tests       │
        ├───────────────────────────┤
        │   Unit (Vitest)           │  ← Domain / utils / hooks
        │   target: 100+ tests      │
        └───────────────────────────┘
                              ↑ 寬度 = 數量
```

**比例約**：Unit 70% / Integration 25% / E2E 5%。

---

## 2. 測試覆蓋目標

| 對象                       | 覆蓋目標         | 工具          |
| -------------------------- | ---------------- | ------------- |
| `packages/core/domain/`    | branch ≥ 80%     | Vitest        |
| `packages/core/data/`      | line ≥ 70%       | Vitest + fake-indexeddb |
| `packages/web/features/*/hooks/` | line ≥ 60% | Vitest + Testing Library |
| 業務 component (互動)      | smoke + 互動點   | Testing Library |
| 主要 user journey          | 100% (見 §5)    | Playwright    |

> 不追求 100% — coverage 是訊號不是目標。重點放「壞了會死人」的地方 (`WorkoutEngine` 狀態機 + 關鍵 hook)。

---

## 3. 單元測試 (Vitest)

### 3.1 `packages/core/` 環境

```typescript
// packages/core/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
```

```typescript
// packages/core/tests/setup.ts
import 'fake-indexeddb/auto'; // RxDB 在 Node 測試環境需要 fake-indexeddb
```

### 3.2 `packages/web/` 環境

```typescript
// packages/web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false,
  },
});
```

```typescript
// packages/web/tests/setup.ts
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
```

### 3.3 範例：`WorkoutEngine` 測試

```typescript
// packages/core/tests/domain/WorkoutEngine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCore } from '../helpers/createTestCore';

describe('WorkoutEngine', () => {
  let core: Awaited<ReturnType<typeof createTestCore>>;
  let presetPlanId: string;

  beforeEach(async () => {
    core = await createTestCore({ clock: new FakeClock('2026-05-14T10:00:00Z') });
    await core.seedService.ensureSeeded();
    const plans = await core.planRepo.listPresets();
    presetPlanId = plans[0].id;
  });

  describe('start()', () => {
    it('creates workout from preset plan', async () => {
      const day1 = (await core.planRepo.get(presetPlanId))!.days[0];
      const result = await core.workoutEngine.start({ planId: presetPlanId, planDayId: day1.id });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe('in_progress');
        expect(result.value.exercises.length).toBe(day1.exercises.length);
      }
    });

    it('rejects when planId not found', async () => {
      const result = await core.workoutEngine.start({ planId: 'plan_nonexistent', planDayId: 'pd_x' });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('PLAN_NOT_FOUND');
    });

    it('rejects when already an in-progress workout exists', async () => {
      const day1 = (await core.planRepo.get(presetPlanId))!.days[0];
      await core.workoutEngine.start({ planId: presetPlanId, planDayId: day1.id });
      const r2 = await core.workoutEngine.start({ planId: presetPlanId, planDayId: day1.id });
      expect(r2.ok).toBe(false);
      if (!r2.ok) expect(r2.error.code).toBe('CONCURRENT_ACTIVE_WORKOUT');
    });
  });

  describe('logSet()', () => {
    // ... happy path、各種錯誤、邊界 (最後一組、weight=0、rpe=10 等)
  });

  describe('finish()', () => {
    // ... 結算正確、status 變化、不能重複 finish
  });

  // 共: 約 30+ 測試 case
});
```

### 3.4 `FakeClock` & `createTestCore` 助手

```typescript
// packages/core/tests/helpers/FakeClock.ts
export class FakeClock implements ClockPort {
  private current: Date;
  constructor(start: string) { this.current = new Date(start); }
  now(): Date { return new Date(this.current); }
  monotonic(): number { return this.current.getTime(); }
  advance(seconds: number) { this.current = new Date(this.current.getTime() + seconds * 1000); }
}

// packages/core/tests/helpers/createTestCore.ts
export async function createTestCore(opts: { clock?: ClockPort; idGen?: IdPort } = {}) {
  return createCore({
    clock: opts.clock ?? new SystemClock(),
    idGen: opts.idGen ?? new DeterministicIdGen(), // 測試專用、可預測
  });
}
```

---

## 4. 整合測試 (Hook + Component)

### 4.1 範例：`useStartWorkout` 整合

```typescript
// packages/web/tests/unit/hooks/useStartWorkout.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useStartWorkout } from '@/features/workout/hooks/useStartWorkout';
import { TestCoreProvider } from '@/tests/utils/TestCoreProvider';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

describe('useStartWorkout', () => {
  it('starts workout and navigates', async () => {
    const { result } = renderHook(() => useStartWorkout(), {
      wrapper: ({ children }) => <TestCoreProvider>{children}</TestCoreProvider>,
    });

    await result.current({ planId: 'plan_preset_1', planDayId: 'pd_1' });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(expect.stringMatching(/^\/workout\//));
    });
  });
});
```

### 4.2 範例：`PlanCard` 互動

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('PlanCard', () => {
  it('shows active badge when isActive', () => {
    render(<PlanCard plan={{ ...mockPlan, isActive: true }} />);
    expect(screen.getByText('使用中')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(<PlanCard plan={mockPlan} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /detail/i }));
    expect(onSelect).toHaveBeenCalledWith(mockPlan.id);
  });
});
```

---

## 5. E2E 測試 (Playwright)

### 5.1 配置

```typescript
// packages/web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
```

### 5.2 必跑的 E2E 流程

| 場景檔案                | 路徑                                              |
| ----------------------- | ------------------------------------------------- |
| `onboarding.spec.ts`    | 新訪客完整 onboarding → 進首頁                    |
| `start-workout.spec.ts` | 從首頁開始第一次訓練、登入第一組                  |
| `log-set.spec.ts`       | 訓練中 log 多組、倒數、加組、跳組                  |
| `full-workout.spec.ts`  | 完整訓練從頭到尾 (含 summary)                     |
| `offline.spec.ts`       | 設 offline、訓練仍可完成                          |
| `custom-plan.spec.ts`   | 建立自訂課表、設為 active、開始訓練                |
| `history.spec.ts`       | 看歷史、進詳情、確認資料一致                      |
| `data-export.spec.ts`   | 匯出 / 匯入 / 清空資料                            |

### 5.3 範例：`onboarding.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('first-time user completes onboarding to today', async ({ page, context }) => {
  await context.clearCookies();
  await context.clearStorages();

  await page.goto('/');
  await expect(page).toHaveURL(/\/onboard\/step1/);

  await page.getByRole('button', { name: '增肌' }).click();
  await page.getByRole('button', { name: '下一步' }).click();

  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: '下一步' }).click();

  await page.getByRole('button', { name: '健身房 (完整)' }).click();
  await page.getByRole('button', { name: '下一步' }).click();

  await page.getByRole('button', { name: '完全新手' }).click();
  await page.getByRole('button', { name: '下一步' }).click();

  await expect(page.getByText('為你推薦')).toBeVisible();
  await page.getByRole('button', { name: '開始這個課表' }).click();

  await expect(page).toHaveURL('/today');
  await expect(page.getByRole('button', { name: /開始訓練/ })).toBeVisible();
});
```

### 5.4 範例：`offline.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('user can complete workout while offline', async ({ page, context }) => {
  // 先完成 onboarding (helper)
  await completeOnboarding(page);

  // 進首頁、確認 SW 已 active
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null);

  // 模擬 offline
  await context.setOffline(true);

  // 開始訓練、log 一組
  await page.getByRole('button', { name: /開始訓練/ }).click();
  await page.fill('[data-testid="weight-input"]', '60');
  await page.fill('[data-testid="reps-input"]', '10');
  await page.getByRole('button', { name: '完成這組' }).click();

  // 倒數應出現
  await expect(page.getByText(/00:\d{2}/)).toBeVisible();

  // 結束訓練
  await page.getByRole('button', { name: '結束' }).click();
  await page.getByRole('button', { name: '確認結束' }).click();
  await expect(page).toHaveURL(/\/workout\/.*\/summary/);
});
```

---

## 6. 程式碼品質 (Quality Gates)

### 6.1 在 CI 必須通過的閘門

1. `pnpm typecheck` — TS strict 全通
2. `pnpm lint` — ESLint 0 error (warning 允許)
3. `pnpm test` — Unit + Integration 全通
4. `pnpm test:e2e --project=chromium` — E2E chromium 全通 (其他瀏覽器 PR 才跑 / nightly)
5. `pnpm build` — production build 成功
6. Lighthouse CI — PWA / Performance / Accessibility ≥ 90

### 6.2 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
- uses: treosh/lighthouse-ci-action@v11
  with:
    urls: |
      http://localhost:4173/today
      http://localhost:4173/plans
      http://localhost:4173/exercises
    uploadArtifacts: true
    temporaryPublicStorage: true
```

---

## 7. CI/CD (GitHub Actions)

### 7.1 `ci.yml` — PR 必跑

```yaml
name: CI
on: [pull_request, push]

jobs:
  lint-type-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  e2e:
    runs-on: ubuntu-latest
    needs: lint-type-test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm test:e2e --project=chromium
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: packages/web/playwright-report/
```

### 7.2 `deploy.yml` — 主分支自動部署

Vercel 直接連 GitHub repo、push 到 `main` 自動 deploy。無需手寫 deploy workflow。

> Preview deploy 同樣自動 (每個 PR 有 unique URL、利於 review)。

---

## 8. 部署 (Vercel)

### 8.1 配置 (`vercel.json`)

```json
{
  "buildCommand": "pnpm --filter @fitforge/web build",
  "outputDirectory": "packages/web/dist",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), camera=(), microphone=()" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    },
    {
      "source": "/assets/lottie/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### 8.2 環境變數 (V1 無外部依賴、空)

V1 沒有需要的 env vars (沒有 API、沒有 secret)。預留位置給 V2：
```
# .env.example
# V1: empty
# V2 將加：
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
# VITE_ANTHROPIC_PROXY_URL=
```

---

## 9. 發版流程 (Release Flow)

### 9.1 版本號

採 [SemVer](https://semver.org/)：`MAJOR.MINOR.PATCH`。

- V1 MVP 上線 = `1.0.0`
- 功能小修 = `1.0.x`
- 加非破壞性新功能 = `1.x.0`
- 破壞 schema (極罕)、UI 重大改 = `2.0.0`

### 9.2 Release 步驟

1. 在 `main` 分支：`pnpm changeset`、寫變更摘要
2. PR merge 後、tag 推上：`git tag v1.0.1 && git push --tags`
3. GitHub Actions 自動發 GitHub Release (含 changeset 摘要)
4. Vercel main 推送 → 自動部署 production

### 9.3 Production Sanity Checklist

每次 release 前在 staging URL 跑一遍：

- [ ] Onboarding 4 步流程順
- [ ] 從預設課表開始訓練、log 3 組、結束
- [ ] 倒數正確
- [ ] Offline 模式仍可完成訓練
- [ ] 安裝到主畫面正常 (iOS Safari + Android Chrome 各測一次)
- [ ] 更新 banner 出現 (前一版 SW 還在的情況)
- [ ] Lighthouse score ≥ 90
- [ ] DevTools Console 無 error

---

## 10. 觀察 / 監控

V1 不裝外部 observability，但保留勾子：
- 錯誤 boundary 寫到 `errorLogs` IndexedDB collection
- Settings 頁面 → 「除錯模式」開關 → 顯示診斷面板 (cache 狀態、SW 版本、最近錯誤 10 條)
- V2 評估接 PostHog / Sentry (尊重隱私的版本)

---

## 11. 緊急回滾 (Rollback)

Vercel Dashboard → Deployments → 之前的 deployment → 「Promote to Production」。

也可從 GitHub revert commit 推 — Vercel 會自動部署回滾後的版本。

**注意**：Service Worker 已快取的舊版資源、客戶端可能仍跑舊版直到 SW update。緊急情況：在 next deploy 加一個版本 bump、強制 SW skipWaiting → 用戶下次開立刻拿新版。

---

## 12. 下一步閱讀

- 想看 monorepo 結構 → [09-monorepo-structure.md](./09-monorepo-structure.md)
- 想看 PWA 細節 → [08-pwa-offline.md](./08-pwa-offline.md)
- 想看 V2 改動規模 → [12-roadmap-v2.md](./12-roadmap-v2.md)
