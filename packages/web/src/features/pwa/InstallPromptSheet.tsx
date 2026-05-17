import { Check, Download, Plus, Share } from 'lucide-react';
import { Button } from '@/ui/Button';
import { Sheet } from '@/ui/Sheet';
import type { InstallPlatform } from './useInstallPrompt';

/**
 * InstallPromptSheet — §21 安裝引導 bottom sheet
 *
 * 兩種 variant：
 * - Android (有 deferred prompt) → 大顆「立即安裝」CTA、按了觸發系統 prompt
 * - iOS / 找不到 prompt → 三步教學 + 分享 sheet 示意縮圖
 */

type Props = {
  open: boolean;
  platform: InstallPlatform;
  canTriggerNativePrompt: boolean;
  onInstall: () => void;
  onDismiss: () => void;
};

export function InstallPromptSheet({
  open,
  platform,
  canTriggerNativePrompt,
  onInstall,
  onDismiss,
}: Props) {
  const showAndroidCTA = canTriggerNativePrompt;

  return (
    <Sheet open={open} onClose={onDismiss}>
      <div className="px-6 pb-7 pt-1">
        <div className="flex justify-center pt-4">
          <AppIconBadge />
        </div>

        <h3 className="mt-5 text-center text-[20px] font-bold leading-[1.3] tracking-[-0.02em]">
          裝到主畫面、訓練時更快開
        </h3>
        <p className="mt-2 px-2 text-center text-[14px] leading-[1.55] text-muted-foreground">
          離線可用、安裝後像 native app 一樣秒開
        </p>

        {showAndroidCTA ? (
          <AndroidBody onInstall={onInstall} />
        ) : (
          <IOSBody />
        )}

        <Button
          variant="ghost"
          size="md"
          block
          className="mt-1 text-muted-foreground"
          onClick={onDismiss}
        >
          之後再說
        </Button>

        {/* a11y / 平台說明 — 給 screen reader、不擋視覺 */}
        <span className="sr-only">
          {platform === 'ios'
            ? 'iOS 不支援原生安裝、請依照畫面三步教學手動加入主畫面'
            : '使用瀏覽器原生安裝對話框'}
        </span>
      </div>
    </Sheet>
  );
}

function AndroidBody({ onInstall }: { onInstall: () => void }) {
  return (
    <>
      <ul className="mt-5 space-y-2.5 px-1">
        <Bullet>訓練中可完全離線</Bullet>
        <Bullet>桌面 icon、不用每次找瀏覽器</Bullet>
      </ul>

      <Button variant="primary" size="lg" block className="mt-7 h-[52px]" onClick={onInstall}>
        <Download className="h-[18px] w-[18px]" aria-hidden />
        立即安裝
      </Button>
    </>
  );
}

function IOSBody() {
  return (
    <>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
          Safari · 3 步 · 約 10 秒
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <ol className="mt-4 space-y-3 px-1">
        <Step n={1}>
          <span>點 Safari 底部的</span>
          <span
            aria-hidden
            className="ml-1 mr-1 inline-flex translate-y-[3px] items-center rounded-[5px] border border-border bg-secondary px-1 py-[1px]"
          >
            <Share className="h-[12px] w-[12px] text-primary" />
          </span>
          <span>分享按鈕</span>
        </Step>
        <Step n={2}>
          往下滑、選 <strong className="font-bold">「加到主畫面」</strong>
        </Step>
        <Step n={3}>
          點右上角 <strong className="font-bold">「新增」</strong>、完成
        </Step>
      </ol>

      <IOSShareIllustration />
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-md py-1">
      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center text-success">
        <Check className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-[14px] leading-[1.45]">{children}</span>
    </li>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-[2px] inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
        {n}
      </span>
      <span className="pt-[3px] text-[14px] leading-[1.55]">{children}</span>
    </li>
  );
}

function AppIconBadge() {
  return (
    <div className="rounded-[18px] p-1.5 shadow-ds-md ring-1 ring-border">
      <svg width={64} height={64} viewBox="0 0 80 80" aria-hidden>
        <rect width="80" height="80" rx="20" className="fill-primary" />
        <g className="fill-primary-foreground">
          <rect x="9" y="32" width="5" height="16" rx="1.5" />
          <rect x="16" y="26" width="11" height="28" rx="2.5" />
          <rect x="27" y="36" width="26" height="8" rx="1" />
          <rect x="53" y="26" width="11" height="28" rx="2.5" />
          <rect x="66" y="32" width="5" height="16" rx="1.5" />
        </g>
      </svg>
    </div>
  );
}

function IOSShareIllustration() {
  return (
    <div className="mx-auto mt-4 max-w-[296px] rounded-[12px] border border-border bg-muted p-3">
      <div className="flex justify-center">
        <div className="h-[3px] w-8 rounded-full bg-border" />
      </div>
      <div className="mt-2 flex items-center gap-2 px-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <svg width={20} height={20} viewBox="0 0 80 80" aria-hidden>
            <g className="fill-primary-foreground">
              <rect x="9" y="32" width="5" height="16" rx="1.5" />
              <rect x="16" y="26" width="11" height="28" rx="2.5" />
              <rect x="27" y="36" width="26" height="8" rx="1" />
              <rect x="53" y="26" width="11" height="28" rx="2.5" />
              <rect x="66" y="32" width="5" height="16" rx="1.5" />
            </g>
          </svg>
        </div>
        <div className="leading-tight">
          <div className="text-[10.5px] font-semibold">FitForge</div>
          <div className="font-mono text-[9px] text-muted-foreground">fitforge.app</div>
        </div>
      </div>
      <div className="mt-2 overflow-hidden rounded-md border border-border bg-card">
        <Row label="加入閱讀列表" />
        <Row label="加入書籤" />
        <Row label="加到主畫面" highlight />
        <Row label="拷貝" last />
      </div>
    </div>
  );
}

function Row({
  label,
  highlight,
  last,
}: {
  label: string;
  highlight?: boolean;
  last?: boolean;
}) {
  if (highlight) {
    return (
      <div
        className="flex items-center justify-between border-b border-border bg-accent px-2.5 py-2"
        style={{ boxShadow: 'inset 2px 0 0 hsl(var(--primary))' }}
      >
        <span className="text-[11.5px] font-bold text-accent-foreground">{label}</span>
        <Plus className="h-4 w-4 text-primary" aria-hidden />
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 ${
        last ? '' : 'border-b border-border'
      }`}
    >
      <span className="text-[11px] font-medium">{label}</span>
    </div>
  );
}
