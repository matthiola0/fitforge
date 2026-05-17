import { useEffect, useRef, useState } from 'react';
import type { Observable } from 'rxjs';

/**
 * useRxQuery — 訂閱 RxDB reactive query
 *
 * 對應 docs/06-state-management.md §3.2。
 *
 * 用法：
 *   const { data, isLoading } = useRxQuery(() => core.planRepo.observeActive(), []);
 *
 * - 第一個參數是回傳 Observable 的工廠（為了 closure deps 控制）
 * - 第二個 deps 與 useEffect 同樣語意
 */
export type RxQueryState<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
};

export function useRxQuery<T>(
  queryFactory: () => Observable<T> | null,
  deps: React.DependencyList,
): RxQueryState<T> {
  const [state, setState] = useState<RxQueryState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  // 用 ref 鎖住 factory，避免 strict mode 雙重執行時殘留訂閱
  const factoryRef = useRef(queryFactory);
  factoryRef.current = queryFactory;

  useEffect(() => {
    const obs = factoryRef.current();
    if (!obs) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, isLoading: true, error: null }));
    const sub = obs.subscribe({
      next: (data) => setState({ data, isLoading: false, error: null }),
      error: (error: Error) =>
        setState((s) => ({ ...s, isLoading: false, error })),
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
