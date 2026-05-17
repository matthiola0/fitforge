import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * uiStore — 跨組件 UI 狀態
 *
 * 對應 docs/06-state-management.md §2.1。
 *
 * - `theme` & `installPromptDismissed` 持久化 (localStorage)
 * - `activeModal` / `toasts` 純記憶體
 */

export type ToastKind = 'info' | 'success' | 'error' | 'warning';
export type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
  durationMs?: number;
};

export type ModalKey = 'exit-workout' | 'delete-plan' | 'reset-data' | null;

type UiState = {
  // 主題
  theme: 'system' | 'light' | 'dark';
  setTheme: (theme: UiState['theme']) => void;

  // PWA 安裝
  installPromptDismissed: boolean;
  dismissInstallPrompt: () => void;

  // Modal / Dialog
  activeModal: ModalKey;
  openModal: (m: NonNullable<ModalKey>) => void;
  closeModal: () => void;

  // Toast queue
  toasts: ToastItem[];
  pushToast: (t: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
};

let toastCounter = 0;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      installPromptDismissed: false,
      dismissInstallPrompt: () => set({ installPromptDismissed: true }),

      activeModal: null,
      openModal: (m) => set({ activeModal: m }),
      closeModal: () => set({ activeModal: null }),

      toasts: [],
      pushToast: (t) =>
        set((s) => ({
          toasts: [...s.toasts, { ...t, id: `toast_${++toastCounter}_${Date.now()}` }],
        })),
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
    }),
    {
      name: 'fitforge-ui',
      partialize: (s) => ({
        theme: s.theme,
        installPromptDismissed: s.installPromptDismissed,
      }),
    },
  ),
);
