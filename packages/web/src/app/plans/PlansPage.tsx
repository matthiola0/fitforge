import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, ChevronRight, Plus, Sparkles } from 'lucide-react';
import type { BodyPart, Plan } from '@fitforge/core';
import { BODY_PARTS } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { useRxQuery } from '@/lib/rxdb/useRxQuery';
import { PageHeader } from '@/app/_layout/PageHeader';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/cn';
import { bodyPartLabel } from '@/lib/labels';

const BODY_PART_SET = new Set<string>(BODY_PARTS);
function translateFocus(tag: string): string {
  return BODY_PART_SET.has(tag) ? bodyPartLabel(tag as BodyPart) : tag;
}

/**
 * PlansPage — §10 (最小可用版)
 *
 * V1 MVP demo loop 需要：用戶能在 UI 點某 plan「設為使用中」。
 * 完整 §10 設計待落地、本版本只實現核心交互。
 */
export function PlansPage() {
  const core = useCore();
  const navigate = useNavigate();
  const presets = useRxQuery(() => core.planRepo.observeAll('local'), [core]);
  const active = useRxQuery(() => core.planRepo.observeActive('local'), [core]);

  const all = presets.data ?? [];
  const userPlans = all.filter((p) => !p.isPreset);
  const presetPlans = all.filter((p) => p.isPreset);

  const setActive = async (id: string) => {
    const r = await core.planService.setActive(id);
    if (!r.ok) {
      useUiStore.getState().pushToast({ kind: 'error', message: '設定失敗、稍後再試' });
    }
  };

  const newBlank = async () => {
    const plan = await core.planService.createBlank({ name: '新課表' });
    navigate(`/plans/${plan.id}/edit`);
  };

  return (
    <>
      <PageHeader
        title="課表"
        rightSlot={
          <button
            type="button"
            onClick={newBlank}
            aria-label="新增空白課表"
            title="新增空白課表"
            className="-mr-2 grid h-9 w-9 place-items-center rounded-md text-foreground transition-colors hover:bg-secondary"
          >
            <Plus size={20} strokeWidth={2.2} />
          </button>
        }
      />

      <div className="mx-auto max-w-md space-y-6 p-4">
        {/* Active section */}
        {active.data ? (
          <section>
            <SectionLabel>使用中</SectionLabel>
            <PlanCard plan={active.data} active onSetActive={setActive} />
          </section>
        ) : null}

        {/* User plans */}
        {userPlans.length > 0 ? (
          <section>
            <SectionLabel>我的自訂課表</SectionLabel>
            <div className="space-y-2">
              {userPlans
                .filter((p) => p.id !== active.data?.id)
                .map((p) => (
                  <PlanCard key={p.id} plan={p} onSetActive={setActive} />
                ))}
            </div>
          </section>
        ) : null}

        {/* Presets */}
        <section>
          <SectionLabel>
            <Sparkles size={11} strokeWidth={2.4} />
            預設課表（推薦給新手）
          </SectionLabel>
          {presets.isLoading ? (
            <SkeletonList />
          ) : (
            <div className="space-y-2">
              {presetPlans
                .filter((p) => p.id !== active.data?.id)
                .map((p) => (
                  <PlanCard key={p.id} plan={p} onSetActive={setActive} />
                ))}
            </div>
          )}
        </section>

        <Stub />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 inline-flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </div>
  );
}

function PlanCard({
  plan,
  active,
  onSetActive,
}: {
  plan: Plan;
  active?: boolean;
  onSetActive: (id: string) => void;
}) {
  const focusTags = Array.from(new Set(plan.days.flatMap((d) => d.focusMuscleGroups))).slice(0, 4);

  return (
    <Card
      className={cn(
        'overflow-hidden transition-colors',
        active && 'border-primary/40 bg-accent/40',
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {active ? (
                <Chip tone="primary" size="sm">
                  <CheckCircle2 size={11} strokeWidth={2.4} className="-ml-0.5" />
                  使用中
                </Chip>
              ) : null}
              {plan.isPreset ? (
                <Chip size="sm" tone="outline">
                  預設
                </Chip>
              ) : null}
            </div>
            <h3 className="mt-1.5 text-[17px] font-extrabold tracking-[-0.015em] text-foreground">
              {plan.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
              {plan.description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} strokeWidth={2.2} />
                每週 {plan.frequencyPerWeek} 次
              </span>
              <span>{plan.days.length} 個訓練日</span>
            </div>
            {focusTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {focusTags.map((t) => (
                  <Chip key={t} tone="muted" size="xs">
                    {translateFocus(t)}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Link to={`/plans/${plan.id}`} className="block flex-1">
            <Button variant="outline" size="sm" block>
              查看
              <ChevronRight size={14} strokeWidth={2.2} />
            </Button>
          </Link>
          {!active ? (
            <Button size="sm" onClick={() => onSetActive(plan.id)} className="flex-1">
              設為使用中
            </Button>
          ) : (
            <Link to="/today" className="block flex-1">
              <Button size="sm" block>
                回首頁
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      <div className="h-32 animate-pulse rounded-lg bg-muted/50" />
      <div className="h-32 animate-pulse rounded-lg bg-muted/50" />
    </div>
  );
}

function Stub() {
  return (
    <Card className="border-dashed bg-secondary/40 p-4">
      <div className="text-[12px] leading-[1.55] text-muted-foreground">
        <strong className="text-foreground">📝 V1 簡版</strong>：完整 §10 設計稿 (
        <code className="font-mono text-[11px]">10-plans-list.html</code>) 尚未落地。
        本版本只實作「設為使用中」的核心交互、讓 MVP demo 流程能跑通。
      </div>
    </Card>
  );
}
