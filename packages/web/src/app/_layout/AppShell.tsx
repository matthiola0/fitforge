import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/**
 * AppShell — 全域 layout
 *
 * - 訓練中 / Onboarding 不顯示 BottomNav (防誤觸)
 * - 全頁 scroll、bottom safe area
 *
 * 對應 docs/07-screen-flow.md §4。
 */
const HIDE_NAV_PATTERNS = [
  /^\/workout\/[\w-]+/, // 訓練中 (含 summary)
  /^\/onboard\//, // Onboarding
];

export function AppShell() {
  const { pathname } = useLocation();
  const hideNav = HIDE_NAV_PATTERNS.some((re) => re.test(pathname));

  return (
    <div className="flex h-full flex-col bg-background">
      <main className={hideNav ? 'flex-1 overflow-y-auto' : 'flex-1 overflow-y-auto pb-20'}>
        <Outlet />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
