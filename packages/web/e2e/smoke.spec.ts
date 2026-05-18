import { expect, test } from '@playwright/test';

/**
 * Smoke tests — basic shell + navigation must work.
 *
 * 跑 production build (vite preview)，所以也覆蓋 lazy chunk load + manifest。
 *
 * Playwright 每個 test 預設用獨立 browser context、cookies / storage / IndexedDB
 * 都是隔離的、不需要手動清。
 */

test.describe('Smoke', () => {
  test('app loads + 自動導到 onboarding (新使用者)', async ({ page }) => {
    await page.goto('/today');
    // SeedService 第一次跑會把 onboardingCompleted 設 false、TodayPage 會 Navigate 過去
    await expect(page.getByRole('button', { name: /增肌/ })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/onboard\/step1$/);
    await expect(page.getByRole('button', { name: '跳過' })).toBeVisible();
  });

  test('Onboarding 四個目標選項都在', async ({ page }) => {
    await page.goto('/onboard/step1');
    await expect(page.getByRole('button', { name: /增肌/ })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /增強力量/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /一般體適能/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /減脂/ })).toBeVisible();
  });

  test('跳過 onboarding → /today 空狀態 (還沒選課表)', async ({ page }) => {
    await page.goto('/onboard/step1');
    await page.getByRole('button', { name: '跳過' }).click();
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole('heading', { name: '還沒選課表' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /選擇課表/ })).toBeVisible();
  });

  test('BottomNav 切到課表 / 動作 / 歷史 / 今天', async ({ page }) => {
    await page.goto('/onboard/step1');
    await page.getByRole('button', { name: '跳過' }).click();
    await expect(page).toHaveURL(/\/today$/);

    await page.getByRole('link', { name: '課表', exact: true }).click();
    await expect(page).toHaveURL(/\/plans$/);

    await page.getByRole('link', { name: '動作', exact: true }).click();
    await expect(page).toHaveURL(/\/exercises$/);

    await page.getByRole('link', { name: '歷史', exact: true }).click();
    await expect(page).toHaveURL(/\/history$/);

    await page.getByRole('link', { name: '今天', exact: true }).click();
    await expect(page).toHaveURL(/\/today$/);
  });
});
