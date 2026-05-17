import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
import { InstallPromptSheet } from './InstallPromptSheet';
import { useInstallPrompt } from './useInstallPrompt';

/**
 * InstallPromptManager — 決定何時冒出 §21 安裝引導
 *
 * 觸發規則 (全部成立):
 *   1. 第 3 次或之後造訪 (依 uiStore.visitCount、每天最多 +1)
 *   2. 還沒 dismiss 過
 *   3. 平台支援 (Android 有 deferred prompt、或 iOS Safari 不在 standalone)
 *   4. 不在 onboarding 流程裡 (太早冒會打斷新手)、不在訓練中 / 摘要頁
 *   5. 延遲 1.5s 顯示、避免和首載動畫打架
 */

const MIN_VISIT_COUNT = 3;
const SHOW_DELAY_MS = 1500;

function isExcludedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/onboard') ||
    pathname.startsWith('/workout/') ||
    pathname === '/' // 還沒導到 /today
  );
}

export function InstallPromptManager() {
  const visitCount = useUiStore((s) => s.visitCount);
  const dismissed = useUiStore((s) => s.installPromptDismissed);
  const markVisitToday = useUiStore((s) => s.markVisitToday);
  const dismissInstallPrompt = useUiStore((s) => s.dismissInstallPrompt);

  const install = useInstallPrompt();
  const { pathname } = useLocation();

  const [visible, setVisible] = useState(false);

  // 每次 mount (= 每次 app load) 補一筆 visit
  useEffect(() => {
    markVisitToday();
  }, [markVisitToday]);

  const meetsBaseConditions =
    !dismissed && visitCount >= MIN_VISIT_COUNT && install.canShow && !isExcludedPath(pathname);

  useEffect(() => {
    if (!meetsBaseConditions) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [meetsBaseConditions]);

  if (!meetsBaseConditions && !visible) return null;

  const handleInstall = async () => {
    const outcome = await install.triggerInstall();
    if (outcome === 'accepted' || outcome === 'dismissed') {
      // 不管接受 / 拒絕都收起來、不再煩使用者
      dismissInstallPrompt();
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setVisible(false);
  };

  return (
    <InstallPromptSheet
      open={visible}
      platform={install.platform}
      canTriggerNativePrompt={install.canTriggerNativePrompt}
      onInstall={handleInstall}
      onDismiss={handleDismiss}
    />
  );
}
