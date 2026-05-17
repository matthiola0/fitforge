import { useEffect, useState } from 'react';

/**
 * useInstallPrompt — 捕捉 beforeinstallprompt + 判斷平台
 *
 * 對應 docs/design/screens/21-install-prompt.html。
 *
 * - Android Chrome: 監聽 `beforeinstallprompt`、攔截後可手動觸發
 * - iOS Safari: 不開放原生 prompt、回傳 platform: 'ios' 給 UI 顯示三步教學
 * - 已安裝 (display-mode: standalone) 時 canShow = false
 */

type BIPEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type InstallPlatform = 'android' | 'ios' | 'other';

export type InstallPromptHook = {
  platform: InstallPlatform;
  /** 是否真的能顯示安裝引導 (排除：已是 standalone、不支援平台) */
  canShow: boolean;
  /** Android only — 有抓到 deferred event 可程式觸發 */
  canTriggerNativePrompt: boolean;
  /** 觸發原生 prompt (僅 Android 有效)、回傳是否使用者接受 */
  triggerInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
};

function detectPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  // iOS Safari (含 iPadOS 桌面模式)
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1);
  if (isIOS) return 'ios';
  // Android (含 Chrome、Edge、Samsung)
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari 用非標準 navigator.standalone
  const nav = navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone);
}

export function useInstallPrompt(): InstallPromptHook {
  const [platform] = useState<InstallPlatform>(() => detectPlatform());
  const [standalone, setStandalone] = useState<boolean>(() => isStandalone());
  const [deferredPrompt, setDeferredPrompt] = useState<BIPEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BIPEvent);
    };
    const onAppInstalled = () => {
      setStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  // iOS 永遠 canShow (除非已 standalone)、Android 要有 deferred prompt、其他平台不顯示
  const canShow =
    !standalone &&
    (platform === 'ios' || (platform === 'android' && deferredPrompt !== null));

  const triggerInstall: InstallPromptHook['triggerInstall'] = async () => {
    if (!deferredPrompt) return 'unavailable';
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return choice.outcome;
    } catch {
      return 'unavailable';
    }
  };

  return {
    platform,
    canShow,
    canTriggerNativePrompt: deferredPrompt !== null,
    triggerInstall,
  };
}
