import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * EmptyState — §23.1 空狀態通用元件
 *
 * 文案三要 (來自 §23.4)：
 * - title 講「事實」(還沒有 / 沒有符合 / 找不到)、不哀求
 * - description 講「為什麼」或「下一步是什麼」
 * - action 用「動詞 + 受詞」(「開始第一次訓練」勝過「開始」)
 *
 * art 通常是 lucide 圖示 (h-12 w-12) 或 inline SVG (viewBox 0 0 200 200)。
 */

type Props = {
  art?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ art, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      {art ? (
        <div className="mb-5 inline-grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
          {art}
        </div>
      ) : null}
      <h3 className="text-[18px] font-extrabold tracking-[-0.02em]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-[28ch] text-[14px] leading-[1.55] text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
