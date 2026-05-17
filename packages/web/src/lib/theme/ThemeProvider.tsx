import { useEffect, type ReactNode } from 'react';
import { useUiStore } from '@/stores/uiStore';

/**
 * ThemeProvider — 套用 Zustand 中的 theme 偏好到 <html class="dark">
 *
 * 對應 docs/02-system-architecture.md §5.6。
 *
 * 三模式：light / dark / system（跟系統 prefers-color-scheme）
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (mode: 'light' | 'dark') => {
      root.classList.toggle('dark', mode === 'dark');
    };

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mql.matches ? 'dark' : 'light');
      const onChange = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    apply(theme);
  }, [theme]);

  return <>{children}</>;
}
