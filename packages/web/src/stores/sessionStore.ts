import { create } from 'zustand';

/**
 * sessionStore — 訓練 session 期間的 UI 暫存
 *
 * 對應 docs/06-state-management.md §2.2。
 *
 * 純記憶體 — reload 後從 RxDB 重建。
 */

type SessionState = {
  /** 當下進行中的 workout id (RxDB 才是真相、此處只是 fast path) */
  activeWorkoutId: string | null;
  setActiveWorkoutId: (id: string | null) => void;

  /** 用戶剛打但未送出的草稿 */
  draftSet: { weight: string; reps: string; rpe: string } | null;
  setDraftSet: (d: SessionState['draftSet']) => void;
  clearDraftSet: () => void;

  /** 倒數計時 UI 端 */
  restEndsAt: string | null; // ISO datetime
  restRemainingSec: number;
  startRest: (seconds: number) => void;
  skipRest: () => void;
  extendRest: (seconds: number) => void;
  tickRest: (remainingSec: number) => void;

  /** 訓練中折疊狀態 */
  expandedExerciseIndex: number | null;
  setExpanded: (i: number | null) => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  activeWorkoutId: null,
  setActiveWorkoutId: (activeWorkoutId) => set({ activeWorkoutId }),

  draftSet: null,
  setDraftSet: (draftSet) => set({ draftSet }),
  clearDraftSet: () => set({ draftSet: null }),

  restEndsAt: null,
  restRemainingSec: 0,
  startRest: (seconds) => {
    const endsAt = new Date(Date.now() + seconds * 1000).toISOString();
    set({ restEndsAt: endsAt, restRemainingSec: seconds });
  },
  skipRest: () => set({ restEndsAt: null, restRemainingSec: 0 }),
  extendRest: (seconds) => {
    const { restEndsAt } = get();
    if (!restEndsAt) return;
    const newEnd = new Date(new Date(restEndsAt).getTime() + seconds * 1000).toISOString();
    set({ restEndsAt: newEnd });
  },
  tickRest: (remainingSec) => set({ restRemainingSec: Math.max(0, remainingSec) }),

  expandedExerciseIndex: null,
  setExpanded: (i) => set({ expandedExerciseIndex: i }),
}));
