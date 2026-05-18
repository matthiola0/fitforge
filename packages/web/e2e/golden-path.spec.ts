import { expect, test, type Page } from '@playwright/test';

/**
 * Golden path — 從 skip onboarding 一路走到 workout summary
 *
 *   /onboard/step1 → 跳過 → /today → 選擇課表 → /plans → 設為使用中
 *   → /today → 開始訓練 → /workout/new → 開始訓練 → /workout/:id
 *   → 完成所有 sets → 結束訓練 → /workout/:id/summary → 訓練完成
 *
 * 這條路徑覆蓋 Routes / WorkoutEngine / StatsService / RxDB / 多數 UI 組件。
 * 任一個壞掉、整條會紅。
 */

test.describe('Golden path', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {
        /* noop */
      }
    });
  });

  test('skip onboarding → pick preset plan → run workout → see summary', async ({ page }) => {
    test.setTimeout(120_000);

    // === 1. Skip onboarding ============================================
    await page.goto('/onboard/step1');
    await page.getByRole('button', { name: '跳過' }).click();
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole('heading', { name: '還沒選課表' })).toBeVisible();

    // === 2. Pick first preset plan ======================================
    await page.getByRole('link', { name: /選擇課表/ }).click();
    await expect(page).toHaveURL(/\/plans$/);
    // 找第一個「設為使用中」按鈕、按下
    const setActiveButtons = page.getByRole('button', { name: '設為使用中' });
    await expect(setActiveButtons.first()).toBeVisible();
    await setActiveButtons.first().click();

    // 等「使用中」section 出現
    await expect(page.getByText('使用中', { exact: true }).first()).toBeVisible();

    // === 3. Back to today、開始訓練 =====================================
    await page.getByRole('link', { name: '今天' }).click();
    await expect(page).toHaveURL(/\/today$/);
    await page.getByRole('button', { name: /開始訓練/ }).click();
    await expect(page).toHaveURL(/\/workout\/new/);

    // === 4. Pre-workout review → 開始訓練 ================================
    await page.getByRole('button', { name: /開始訓練/ }).click();
    await expect(page).toHaveURL(/\/workout\/wo_/);

    // === 5. 完成所有 sets =================================================
    // 防呆 cap、避免 bug 時無限 loop
    await loopCompleteSets(page, { maxClicks: 60 });

    // === 6. 結束訓練 → 看摘要 =============================================
    await expect(page.getByRole('heading', { name: '所有組完成' })).toBeVisible();
    await page.getByRole('button', { name: /結束訓練/ }).click();

    // 確認 dialog —「結束本次訓練？」、按 dialog 內的「結束」
    await page.getByRole('dialog').getByRole('button', { name: '結束', exact: true }).click();

    await expect(page).toHaveURL(/\/workout\/wo_.*\/summary$/);
    await expect(page.getByText('訓練完成', { exact: false })).toBeVisible();
  });
});

/**
 * 連續點「完成這組」直到看見 AllDoneState (「所有組完成」)。
 * - 表單預填 weight/reps、不另外 fill
 * - 組間休息 overlay 出現時點「跳過」、不等 90 秒
 */
async function loopCompleteSets(page: Page, { maxClicks }: { maxClicks: number }) {
  for (let i = 0; i < maxClicks; i++) {
    const done = page.getByRole('heading', { name: '所有組完成' });
    if (await done.isVisible().catch(() => false)) return;

    // 組間休息 overlay 擋住「完成這組」按鈕 — 先按「跳過」收掉
    const skipRest = page.getByRole('button', { name: '跳過', exact: true });
    if (await skipRest.isVisible().catch(() => false)) {
      await skipRest.click();
      await page.waitForTimeout(120);
      continue;
    }

    const completeBtn = page.getByRole('button', { name: /^完成這組/ });
    if (!(await completeBtn.isVisible().catch(() => false))) {
      await page.waitForTimeout(200);
      continue;
    }
    await completeBtn.click();
    await page.waitForTimeout(120);
  }
  throw new Error(`未達 AllDoneState (按了 ${maxClicks} 次完成這組)`);
}
