import { useEffect } from 'react';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * useRestTick — 訂閱 sessionStore.restEndsAt、每 250ms tick 一次
 *
 * 倒數結束時呼叫 onEnd callback 並清空 restEndsAt。
 */
export function useRestTick(onEnd?: () => void) {
  const restEndsAt = useSessionStore((s) => s.restEndsAt);
  const tickRest = useSessionStore((s) => s.tickRest);
  const skipRest = useSessionStore((s) => s.skipRest);

  useEffect(() => {
    if (!restEndsAt) return;
    const endTs = new Date(restEndsAt).getTime();

    const tick = () => {
      const remainingMs = endTs - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      tickRest(remainingSec);
      if (remainingMs <= 0) {
        skipRest();
        onEnd?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [restEndsAt, tickRest, skipRest, onEnd]);
}
