import { useRef, useState } from 'react';
import {
  ChevronRight,
  Download,
  ExternalLink,
  Github,
  Monitor,
  Moon,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { ExportPayloadSchema } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { useRxQuery } from '@/lib/rxdb/useRxQuery';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/cn';

/**
 * SettingsPage — §19 (最小可用版)
 *
 * 沒有 Claude Design 完整稿、本版本走 iOS 風 list row 慣例。
 * 包含：主題 / 單位 / 預設休息 / 音效 / 震動 / 匯出 / 匯入 / 清空 / 關於。
 */
export function SettingsPage() {
  const core = useCore();
  const pushToast = useUiStore((s) => s.pushToast);
  const settingsQ = useRxQuery(() => core.settingsRepo.observe('local'), [core]);
  const settings = settingsQ.data;

  // UI theme persists in uiStore (not RxDB) — see ThemeProvider
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // === Settings mutations ===
  const updateSetting = async (patch: Parameters<typeof core.settingsRepo.update>[1]) => {
    await core.settingsRepo.update('local', patch);
  };

  // === Export ===
  const handleExport = async () => {
    try {
      const payload = await core.exportService.exportAll('local');
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `fitforge-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushToast({ kind: 'success', message: '已匯出資料' });
    } catch (e) {
      pushToast({ kind: 'error', message: '匯出失敗' });
      console.error('[fitforge] export failed', e);
    }
  };

  // === Import ===
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = ExportPayloadSchema.safeParse(json);
      if (!parsed.success) {
        pushToast({ kind: 'error', message: '檔案格式不對' });
        return;
      }
      const r = await core.exportService.importAll(parsed.data);
      if (!r.ok) {
        pushToast({ kind: 'error', message: '匯入失敗' });
        return;
      }
      pushToast({
        kind: 'success',
        message: `已匯入 ${r.value.plansAdded} 課表 / ${r.value.workoutsAdded} 紀錄`,
      });
    } catch (err) {
      console.error('[fitforge] import failed', err);
      pushToast({ kind: 'error', message: '匯入失敗、檔案可能損壞' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // === Reset ===
  const handleReset = async () => {
    setConfirmReset(false);
    try {
      // Soft path: delete RxDB databases via IDB API
      // 簡單做法：直接 destroy core 重新 bootstrap、靠 SeedService 重種
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name && (db.name.includes('fitforge') || db.name.includes('rxdb-dexie-fitforge'))) {
          indexedDB.deleteDatabase(db.name);
        }
      }
      localStorage.clear();
      pushToast({ kind: 'success', message: '已清除全部資料、即將重新載入...' });
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      pushToast({ kind: 'error', message: '清除失敗' });
      console.error(e);
    }
  };

  return (
    <>
      <PageHeader title="設定" back="/today" />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="sr-only"
        onChange={handleImportFile}
      />

      <div className="mx-auto max-w-md space-y-5 p-4 pb-12">
        {/* 一般 */}
        <Section title="一般">
          {/* Theme */}
          <Row label="主題">
            <SegmentedControl
              value={theme}
              onChange={(v) => setTheme(v as typeof theme)}
              options={[
                { value: 'system', label: '系統', icon: <Monitor size={14} strokeWidth={2.2} /> },
                { value: 'light', label: '淺色', icon: <Sun size={14} strokeWidth={2.2} /> },
                { value: 'dark', label: '深色', icon: <Moon size={14} strokeWidth={2.2} /> },
              ]}
            />
          </Row>

          {/* Weight unit */}
          <Row label="重量單位">
            <SegmentedControl
              value={settings?.weightUnit ?? 'kg'}
              onChange={(v) => updateSetting({ weightUnit: v as 'kg' | 'lb' })}
              options={[
                { value: 'kg', label: 'kg' },
                { value: 'lb', label: 'lb' },
              ]}
            />
          </Row>

          {/* Default rest seconds */}
          <Row label="預設組間休息">
            <SmallNumber
              value={settings?.defaultRestSeconds ?? 90}
              suffix="秒"
              step={15}
              min={0}
              max={600}
              onChange={(v) => updateSetting({ defaultRestSeconds: v })}
            />
          </Row>

          {/* Sound + haptics */}
          <Row label="訓練音效">
            <Toggle
              checked={settings?.soundEnabled ?? true}
              onChange={(v) => updateSetting({ soundEnabled: v })}
            />
          </Row>
          <Row label="震動回饋">
            <Toggle
              checked={settings?.hapticsEnabled ?? true}
              onChange={(v) => updateSetting({ hapticsEnabled: v })}
            />
          </Row>

          {/* Locale (locked V1) */}
          <Row label="語言" hint="V2 加入更多語系">
            <span className="text-[13px] text-muted-foreground">繁體中文</span>
          </Row>
        </Section>

        {/* 資料 */}
        <Section title="資料">
          <RowButton
            icon={<Download size={16} strokeWidth={2.2} />}
            label="匯出資料"
            hint="所有課表 + 訓練紀錄、下載為 JSON"
            onClick={handleExport}
          />
          <RowButton
            icon={<Upload size={16} strokeWidth={2.2} />}
            label="匯入資料"
            hint="JSON 檔覆蓋現有資料"
            onClick={handleImportClick}
          />
          <RowButton
            icon={<Trash2 size={16} strokeWidth={2.2} />}
            label="清除所有資料"
            hint="自訂課表 / 紀錄 / 偏好全部移除、不可復原"
            destructive
            onClick={() => setConfirmReset(true)}
          />
        </Section>

        {/* 關於 */}
        <Section title="關於">
          <Row label="版本">
            <span className="num text-[13px] text-muted-foreground">v1.0.0-dev</span>
          </Row>
          <RowLink
            icon={<Github size={16} strokeWidth={2.2} />}
            label="GitHub"
            href="https://github.com/"
          />
          <RowLink icon={<ExternalLink size={16} strokeWidth={2.2} />} label="隱私政策" href="#" />
        </Section>

        <p className="pt-4 text-center text-[11px] text-muted-foreground">
          Made with 🔨 · 2026
          <br />
          <span className="text-[10.5px]">§19 簡版、完整設計待 Claude Design 補</span>
        </p>
      </div>

      <ConfirmDialog
        open={confirmReset}
        variant="nuclear"
        title="清除所有資料？"
        description={
          <>
            <strong className="text-foreground">此動作不可復原。</strong>
            所有訓練紀錄、自訂課表、設定都會永久刪除。
          </>
        }
        typeToConfirm="我要清除"
        confirmLabel="永久清除"
        onCancel={() => setConfirmReset(false)}
        onConfirm={handleReset}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Section / Row primitives
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
        {title}
      </h3>
      <Card className="divide-y divide-border overflow-hidden">{children}</Card>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold leading-tight">{label}</div>
        {hint ? <div className="mt-0.5 text-[11.5px] text-muted-foreground">{hint}</div> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function RowButton({
  icon,
  label,
  hint,
  destructive,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
        destructive ? 'hover:bg-destructive/5' : 'hover:bg-secondary/40',
      )}
    >
      {icon ? (
        <span
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-md',
            destructive ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-foreground/80',
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-[14.5px] font-semibold leading-tight',
            destructive && 'text-destructive',
          )}
        >
          {label}
        </div>
        {hint ? <div className="mt-0.5 text-[11.5px] text-muted-foreground">{hint}</div> : null}
      </div>
      <ChevronRight size={16} className="shrink-0 text-muted-foreground" strokeWidth={2} />
    </button>
  );
}

function RowLink({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground/80">
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-[14.5px] font-semibold">{label}</div>
      <ExternalLink size={14} className="shrink-0 text-muted-foreground" strokeWidth={2} />
    </a>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-md bg-secondary p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-bold transition-all',
              active
                ? 'bg-card text-foreground shadow-ds-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-secondary',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 inline-block h-5 w-5 rounded-full bg-card shadow-ds-sm transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

function SmallNumber({
  value,
  onChange,
  suffix,
  step = 1,
  min = 0,
  max = 9999,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label="減"
        className="grid h-6 w-6 place-items-center rounded text-foreground hover:bg-secondary"
      >
        −
      </button>
      <span className="num min-w-[40px] text-center text-[13px] font-bold tabular-nums">
        {value}
        {suffix ? <span className="ml-0.5 text-[11px] text-muted-foreground">{suffix}</span> : null}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label="加"
        className="grid h-6 w-6 place-items-center rounded text-foreground hover:bg-secondary"
      >
        +
      </button>
    </div>
  );
}

