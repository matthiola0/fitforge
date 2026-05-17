import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

/**
 * PageHeader — 頁面頂部 header
 *
 * - 可選返回按鈕、可選設定按鈕、可選右側 action
 * - sticky 在頂部、blur 背景
 */
type Props = {
  title?: ReactNode;
  subtitle?: ReactNode;
  back?: boolean | string; // true = navigate(-1); string = navigate(path)
  rightSlot?: ReactNode;
  /** 顯示右上設定 icon (僅 Today 等少數頁) */
  showSettings?: boolean;
  className?: string;
};

export function PageHeader({ title, subtitle, back, rightSlot, showSettings, className }: Props) {
  const navigate = useNavigate();

  const goBack = () => {
    if (typeof back === 'string') navigate(back);
    else navigate(-1);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur',
        'pt-safe',
        className,
      )}
    >
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
        {back ? (
          <button
            type="button"
            onClick={goBack}
            aria-label="返回"
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          {title ? (
            <div className="truncate text-[17px] font-bold tracking-[-0.01em]">{title}</div>
          ) : null}
          {subtitle ? (
            <div className="truncate text-[12px] text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>

        {rightSlot}
        {showSettings ? (
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="設定"
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings size={20} strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </header>
  );
}
