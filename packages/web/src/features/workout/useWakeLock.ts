import { useEffect, useRef } from 'react';

type WakeLockSentinel = {
  release: () => Promise<void>;
};

/**
 * useWakeLock — 訓練中防螢幕關閉
 *
 * 對應 docs/08-pwa-offline.md §9。
 * Best-effort：iOS Safari 16.4+ / Chrome 已支援、其他平台靜默 noop。
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) return;
    if (!('wakeLock' in navigator)) return;

    let cancelled = false;
    const request = async () => {
      try {
        const lock = await (navigator as unknown as {
          wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinel> };
        }).wakeLock.request('screen');
        if (cancelled) {
          await lock.release().catch(() => undefined);
          return;
        }
        sentinelRef.current = lock;
      } catch (e) {
        console.warn('[fitforge] wakeLock failed', e);
      }
    };
    request();

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        request();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      sentinelRef.current?.release().catch(() => undefined);
      sentinelRef.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active]);
}
