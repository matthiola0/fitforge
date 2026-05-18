import type { ReactNode } from 'react';
import { CloudOff, MapPinOff, ServerCrash } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

/**
 * ErrorState — §23.3 錯誤狀態
 *
 * 三種 kind 對應錯誤類型：
 * - "generic"  未知錯誤、給 retry / 回首頁
 * - "offline"  網路斷線、給「先離線繼續」CTA
 * - "404"      找不到頁面
 *
 * 救援階梯 (§23.4)：
 * 1. 明顯 CTA (重試 / 重新整理 / 回首頁)
 * 2. text button「回報問題」/「先離線繼續」
 * 3. 底部 mono 錯誤碼 — 給工程查、不嚇使用者
 */

type Props = {
  kind?: 'generic' | 'offline' | '404';
  title: ReactNode;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /** 給工程的錯誤碼、底部 mono 字體顯示 */
  errorCode?: string;
  className?: string;
};

const ICON = {
  generic: ServerCrash,
  offline: CloudOff,
  '404': MapPinOff,
};

export function ErrorState({
  kind = 'generic',
  title,
  description,
  primaryAction,
  secondaryAction,
  errorCode,
  className,
}: Props) {
  const Icon = ICON[kind];
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-5 inline-grid h-16 w-16 place-items-center rounded-full bg-destructive/12 text-destructive">
        <Icon className="h-8 w-8" strokeWidth={2.1} aria-hidden />
      </div>
      <h3 className="text-[18px] font-extrabold tracking-[-0.02em]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-[32ch] text-[14px] leading-[1.55] text-muted-foreground">
          {description}
        </p>
      ) : null}
      {primaryAction ? <div className="mt-5">{primaryAction}</div> : null}
      {secondaryAction ? <div className="mt-2">{secondaryAction}</div> : null}
      {errorCode ? (
        <p className="mt-5 font-mono text-[11px] tracking-[1px] text-muted-foreground/70">
          {errorCode}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Convenience for the common "things broke, try again" empty render.
 */
export function ErrorRetry({
  message,
  onRetry,
  errorCode,
}: {
  message?: string;
  onRetry: () => void;
  errorCode?: string;
}) {
  return (
    <ErrorState
      kind="generic"
      title="出了點狀況"
      description={message ?? '請再試一次、或回首頁重新開始。'}
      primaryAction={
        <Button variant="primary" size="md" onClick={onRetry}>
          重試
        </Button>
      }
      errorCode={errorCode}
    />
  );
}
