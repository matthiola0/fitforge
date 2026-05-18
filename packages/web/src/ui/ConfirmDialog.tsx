import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Flag, ShieldAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

/**
 * ConfirmDialog — §22 確認對話框
 *
 * 4 種破壞性等級 (對應 docs/design/screens/22-confirm-dialogs.html)：
 * - "primary"        中度破壞、CTA 用 primary 色（如：結束訓練、保留紀錄）
 * - "destructive"    刪除動作、紅色 CTA（如：放棄訓練、刪除課表）
 * - "nuclear"        不可復原、要求 type-to-confirm（如：清除所有資料）
 * - "warning"        三路選擇（如：未儲存的變更）
 *
 * 規則：
 * - 安全在左 / 破壞在右
 * - icon badge 顏色對應 severity
 * - 入場 dim 200ms + alert pop 200ms forge
 */

export type ConfirmVariant = 'primary' | 'destructive' | 'nuclear' | 'warning';

const ICON_BY_VARIANT: Record<ConfirmVariant, LucideIcon> = {
  primary: Flag,
  destructive: AlertTriangle,
  nuclear: ShieldAlert,
  warning: AlertTriangle,
};

const ICON_BADGE_CLASS: Record<ConfirmVariant, string> = {
  primary: 'bg-primary/15 text-primary',
  destructive: 'bg-destructive/15 text-destructive',
  nuclear: 'bg-destructive/15 text-destructive',
  warning: 'bg-warning/15 text-warning',
};

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  variant?: ConfirmVariant;
  title: ReactNode;
  description?: ReactNode;
  /** 中間額外內容（如 summary chip：「2 組保留 · 2 組丟失」） */
  meta?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** nuclear variant 用 — 必須輸入此字串才能確認（通常是「DELETE」） */
  typeToConfirm?: string;
  /**
   * §22.4 「未儲存的變更」3-way 模式：confirm = 主要動作 (例：儲存)、
   * tertiary = 中間動作 (例：不儲存、直接離開、destructive)、cancel = 取消。
   * 提供時 footer 改成 vertical stack。
   */
  tertiary?: { label: string; onClick: () => void };
};

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  variant = 'primary',
  title,
  description,
  meta,
  confirmLabel,
  cancelLabel = '取消',
  typeToConfirm,
  tertiary,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setTyped('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    // focus the confirm input for nuclear variant
    queueMicrotask(() => inputRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  const Icon = ICON_BY_VARIANT[variant];
  const ctaVariant = variant === 'primary' ? 'primary' : 'destructive';
  const ctaDisabled = typeToConfirm ? typed.trim() !== typeToConfirm : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 px-5 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-[360px] overflow-hidden rounded-2xl bg-card text-card-foreground shadow-ds-lg',
          'animate-in zoom-in-95 fade-in duration-200 ease-forge',
        )}
      >
        <div className="px-6 pb-2 pt-7">
          <div className="flex justify-center">
            <span
              className={cn(
                'inline-flex h-12 w-12 items-center justify-center rounded-full',
                ICON_BADGE_CLASS[variant],
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden />
            </span>
          </div>
          <h3
            id={titleId}
            className="mt-4 text-center text-[20px] font-bold leading-[1.3] tracking-[-0.02em]"
          >
            {title}
          </h3>
          {description ? (
            <p
              id={descId}
              className="mt-2 px-1 text-center text-[14px] leading-[1.55] text-muted-foreground"
            >
              {description}
            </p>
          ) : null}
          {meta ? <div className="mt-4 flex justify-center">{meta}</div> : null}
          {typeToConfirm ? (
            <div className="mt-4">
              <label className="block text-center text-[12px] font-medium text-muted-foreground">
                輸入「<span className="font-mono font-bold text-destructive">{typeToConfirm}</span>」確認
              </label>
              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className={cn(
                  'mt-2 w-full rounded-md border bg-background px-3 py-2 text-center font-mono text-[14px]',
                  'border-border focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20',
                )}
                aria-label={`輸入 ${typeToConfirm} 來確認`}
              />
            </div>
          ) : null}
        </div>
        {tertiary ? (
          <div className="grid gap-2 px-6 pb-6 pt-5">
            <Button variant={ctaVariant} size="md" block onClick={onConfirm} disabled={ctaDisabled}>
              {confirmLabel}
            </Button>
            <Button variant="destructive" size="md" block onClick={tertiary.onClick}>
              {tertiary.label}
            </Button>
            <Button variant="outline" size="md" block onClick={onCancel}>
              {cancelLabel}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-6 pb-6 pt-5">
            <Button variant="outline" size="md" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={ctaVariant} size="md" onClick={onConfirm} disabled={ctaDisabled}>
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
