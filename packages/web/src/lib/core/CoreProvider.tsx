import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createCore, type Core } from '@fitforge/core';

/**
 * CoreProvider — DI wrapper for @fitforge/core
 *
 * - Bootstrap once: createCore() → seedService.ensureSeeded()
 * - Show splash while booting
 * - Expose `useCore()` hook for descendants
 *
 * 對應 docs/06-state-management.md §5。
 */

const CoreContext = createContext<Core | null>(null);

type Props = {
  children: ReactNode;
  /** 測試 / Storybook 用、預先注入 core */
  injected?: Core;
};

export function CoreProvider({ children, injected }: Props) {
  const [core, setCore] = useState<Core | null>(injected ?? null);
  const [bootError, setBootError] = useState<unknown>(null);

  useEffect(() => {
    if (injected) return;
    let disposed = false;
    let bootedCore: Core | null = null;

    (async () => {
      try {
        const c = await createCore({
          databaseOptions: {
            name: 'fitforge',
            storage: 'dexie',
            // StrictMode 雙倒 effect + HMR 會讓 createDatabase 被叫多次。
            // ignoreDuplicate: true 讓 RxDB 重用已存在的同名 instance。
            ignoreDuplicate: true,
          },
        });
        await c.seedService.ensureSeeded();
        // 若有 stale in-progress workout、abandon
        await c.workoutEngine.abandonIfStale();
        if (disposed) {
          await c.destroy();
          return;
        }
        bootedCore = c;
        if (import.meta.env.DEV) {
          // Dev only — expose for browser console debugging
          (window as unknown as { __core?: typeof c }).__core = c;
        }
        setCore(c);
      } catch (e) {
        console.error('[fitforge] Core bootstrap failed:', e);
        if (!disposed) setBootError(e);
      }
    })();

    return () => {
      disposed = true;
      bootedCore?.destroy().catch(() => undefined);
    };
  }, [injected]);

  if (bootError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-2xl font-bold text-destructive">啟動失敗</div>
          <p className="mt-3 text-sm text-muted-foreground">
            無法初始化本地資料庫。請嘗試重新整理頁面、或在設定中清除應用資料。
          </p>
          <pre className="mt-4 overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
            {String(bootError)}
          </pre>
        </div>
      </div>
    );
  }

  if (!core) {
    return <BootSplash />;
  }

  return <CoreContext.Provider value={core}>{children}</CoreContext.Provider>;
}

export function useCore(): Core {
  const c = useContext(CoreContext);
  if (!c) {
    throw new Error('useCore() called outside <CoreProvider>');
  }
  return c;
}

/** 載入畫面 */
function BootSplash() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-ds-md">
          <svg viewBox="0 0 64 64" width="36" height="36" fill="#FFFFFF" aria-label="FitForge">
            <rect x="16" y="11" width="14" height="46" rx="7" />
            <rect x="16" y="11" width="24" height="14" rx="7" />
            <circle cx="45" cy="18" r="8.5" />
            <rect x="16" y="28" width="20" height="12" rx="6" />
            <circle cx="40" cy="34" r="7" />
          </svg>
        </div>
        <div className="text-sm font-medium text-muted-foreground">啟動中...</div>
      </div>
    </div>
  );
}
