import type { PlanRepository } from '../data/repositories/PlanRepository';
import type { Plan } from '../data/schemas/plan.schema';
import { PlanSchema } from '../data/schemas/plan.schema';
import type { ClockPort } from '../ports/ClockPort';
import type { IdPort } from '../ports/IdPort';
import { err, ok, type Result } from './errors';

/**
 * PlanService — 計劃 CRUD、preset fork、setActive
 *
 * 對應 docs/05-domain-logic.md §3。
 */
export class PlanService {
  constructor(
    private deps: {
      planRepo: PlanRepository;
      idGen: IdPort;
      clock: ClockPort;
    },
  ) {}

  listPresets() {
    return this.deps.planRepo.listPresets();
  }

  listUserPlans(userId: string = 'local') {
    return this.deps.planRepo.listUserPlans(userId);
  }

  get(id: string) {
    return this.deps.planRepo.get(id);
  }

  /** 設為使用中（其他自動取消 active） */
  async setActive(id: string, userId: string = 'local'): Promise<Result<void>> {
    const target = await this.deps.planRepo.get(id);
    if (!target) return err({ code: 'PLAN_NOT_FOUND', planId: id });
    await this.deps.planRepo.setActive(id, userId);
    return ok(undefined);
  }

  /** 建立空白自訂 plan（含一個空 Day、無動作）— 由用戶在 PlanEditor 填內容 */
  async createBlank(input: { name?: string } = {}, userId: string = 'local'): Promise<Plan> {
    const now = this.deps.clock.now().toISOString();
    const dayId = this.deps.idGen.next('pd');
    const blank: Plan = PlanSchema.parse({
      id: this.deps.idGen.next('plan'),
      userId,
      name: input.name ?? '新課表',
      description: '',
      isPreset: false,
      isActive: false,
      frequencyPerWeek: 3,
      days: [
        {
          id: dayId,
          order: 0,
          name: 'Day 1',
          focusMuscleGroups: [],
          exercises: [
            // 至少 1 個動作（schema 要求 min(1)）— 用第一個 seed 動作當佔位
            {
              id: this.deps.idGen.next('pe'),
              exerciseId: 'ex_push-up',
              order: 0,
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 12,
              restSeconds: 60,
              isSwappable: true,
              swapScope: 'same_muscle',
            },
          ],
        },
      ],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    return this.deps.planRepo.insert(blank);
  }

  /** 從 preset 複製為自訂 plan（可編輯） */
  async forkFromPreset(presetId: string, userId: string = 'local'): Promise<Result<Plan>> {
    const preset = await this.deps.planRepo.get(presetId);
    if (!preset) return err({ code: 'PLAN_NOT_FOUND', planId: presetId });
    if (!preset.isPreset) return err({ code: 'PLAN_NOT_FOUND', planId: presetId });

    const now = this.deps.clock.now().toISOString();
    const newPlan: Plan = PlanSchema.parse({
      ...preset,
      id: this.deps.idGen.next('plan'),
      userId,
      name: `${preset.name}（我的）`,
      isPreset: false,
      isActive: false,
      days: preset.days.map((d) => ({
        ...d,
        id: this.deps.idGen.next('pd'),
        exercises: d.exercises.map((e) => ({ ...e, id: this.deps.idGen.next('pe') })),
      })),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    const saved = await this.deps.planRepo.insert(newPlan);
    return ok(saved);
  }

  /** 自訂 plan 更新（拒絕 preset） */
  async update(id: string, patch: Partial<Plan>): Promise<Result<Plan>> {
    const existing = await this.deps.planRepo.get(id);
    if (!existing) return err({ code: 'PLAN_NOT_FOUND', planId: id });
    if (existing.isPreset) return err({ code: 'IMMUTABLE_PRESET', planId: id });
    const updated = await this.deps.planRepo.update(id, {
      ...patch,
      updatedAt: this.deps.clock.now().toISOString(),
    });
    return ok(updated);
  }

  /** 軟刪除（preset 不能刪） */
  async softDelete(id: string): Promise<Result<void>> {
    const existing = await this.deps.planRepo.get(id);
    if (!existing) return err({ code: 'PLAN_NOT_FOUND', planId: id });
    if (existing.isPreset) return err({ code: 'IMMUTABLE_PRESET', planId: id });
    await this.deps.planRepo.softDelete(id);
    return ok(undefined);
  }
}
