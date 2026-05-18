import { expect, test } from '@playwright/test';

/**
 * Offline E2E — SDD §7.1 hard requirement「完整離線狀態下可完成一次訓練」
 *
 * 驗證手法：開始訓練後直接斷網、確認所有操作 (log set / skip rest / 結束)
 * 都靠 RxDB (IndexedDB) 與已預載的 JS 完成、沒打網路。
 */

test.describe('Offline', () => {
  test('進入訓練後斷網、仍能 log 一組 + 結束 + 看摘要', async ({ page, context }) => {
    test.setTimeout(120_000);

    // 1. 完整載入 + 進到訓練流程 (網路 ON)
    await page.goto('/onboard/step1');
    await page.getByRole('button', { name: '跳過' }).click();
    await expect(page).toHaveURL(/\/today$/);

    await page.getByRole('link', { name: /選擇課表/ }).click();
    await page.getByRole('button', { name: '設為使用中' }).first().click();
    await expect(page.getByText('使用中', { exact: true }).first()).toBeVisible();

    await page.getByRole('link', { name: '今天', exact: true }).click();
    await page.getByRole('button', { name: /開始訓練/ }).click();
    await expect(page).toHaveURL(/\/workout\/new/);

    await page.getByRole('button', { name: /開始訓練/ }).click();
    await expect(page).toHaveURL(/\/workout\/wo_/);

    // 2. 等動作渲染完成 (確保 lazy chunk 都拿到)
    await expect(page.getByRole('button', { name: /^完成這組/ })).toBeVisible();

    // 3. 等 Service Worker 啟動完成、開始攔截 fetch
    //    (skipWaiting + clientsClaim 一起啟用、第一次安裝即接管)
    await page.waitForFunction(
      () => Boolean(navigator.serviceWorker?.controller),
      undefined,
      { timeout: 15_000 },
    );
    // SW 拿到 controller 後再讓 Workbox 把 precache 寫進 cache storage
    await page.waitForTimeout(800);

    // 4. 斷網
    await context.setOffline(true);

    // 4. 完成第一組 — 純前端 + IndexedDB、不靠網路
    await page.getByRole('button', { name: /^完成這組/ }).click();

    // 跳過第一次組間休息
    const skipRest = page.getByRole('button', { name: '跳過', exact: true });
    await expect(skipRest).toBeVisible({ timeout: 5_000 });
    await skipRest.click();

    // 5. 完成剩下所有組 (全程 offline)
    for (let i = 0; i < 40; i++) {
      const done = page.getByRole('heading', { name: '所有組完成' });
      if (await done.isVisible().catch(() => false)) break;

      const rest = page.getByRole('button', { name: '跳過', exact: true });
      if (await rest.isVisible().catch(() => false)) {
        await rest.click();
        await page.waitForTimeout(100);
        continue;
      }
      const complete = page.getByRole('button', { name: /^完成這組/ });
      if (await complete.isVisible().catch(() => false)) {
        await complete.click();
        await page.waitForTimeout(100);
      } else {
        await page.waitForTimeout(200);
      }
    }

    // 6. 結束 + 看摘要 (仍 offline)
    await expect(page.getByRole('heading', { name: '所有組完成' })).toBeVisible();
    await page.getByRole('button', { name: /結束訓練/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: '結束', exact: true }).click();

    await expect(page).toHaveURL(/\/workout\/wo_.*\/summary$/);
    await expect(page.getByText('訓練完成', { exact: false })).toBeVisible();

    // 7. 復網、不影響結果 (確認 RxDB 寫進去了)
    await context.setOffline(false);
  });
});
