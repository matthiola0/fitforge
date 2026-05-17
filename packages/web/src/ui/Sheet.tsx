import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Sheet — bottom sheet overlay (modal-like)
 *
 * 簡化版：用於 ExerciseListSheet、SwapSheet 等。
 * - 點 backdrop 或按 Escape 關閉
 * - drag handle 視覺、無實際拖拉
 */

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Sheet({ open, onClose, title, children, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'mx-auto w-full max-w-md max-h-[85vh] flex flex-col',
          'rounded-t-2xl border-t border-border bg-card text-card-foreground',
          'shadow-ds-lg pb-safe',
          'animate-in slide-in-from-bottom duration-300 ease-forge',
          className,
        )}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {title ? (
          <div className="shrink-0 border-b border-border px-5 py-3 text-[15px] font-bold">
            {title}
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
