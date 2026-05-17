import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FitForgeDatabase } from '../database';
import { PlanSchema } from '../schemas/plan.schema';
import type { Plan } from '../schemas/plan.schema';

/**
 * PlanRepository — 訓練計劃 CRUD（含軟刪除）
 *
 * 對應 docs/04-data-model.md §3.2、docs/05-domain-logic.md §3。
 */
export class PlanRepository {
  constructor(private db: FitForgeDatabase) {}

  private get col() {
    return this.db.plans;
  }

  async get(id: string): Promise<Plan | null> {
    const doc = await this.col.findOne(id).exec();
    if (!doc) return null;
    const plan = PlanSchema.parse(doc.toJSON());
    return plan.deletedAt ? null : plan;
  }

  async listPresets(): Promise<Plan[]> {
    const docs = await this.col.find({ selector: { isPreset: true, deletedAt: null } }).exec();
    return docs.map((d) => PlanSchema.parse(d.toJSON()));
  }

  async listUserPlans(userId: string = 'local'): Promise<Plan[]> {
    const docs = await this.col
      .find({ selector: { userId, isPreset: false, deletedAt: null } })
      .exec();
    return docs.map((d) => PlanSchema.parse(d.toJSON()));
  }

  async findActive(userId: string = 'local'): Promise<Plan | null> {
    const doc = await this.col
      .findOne({ selector: { userId, isActive: true, deletedAt: null } })
      .exec();
    return doc ? PlanSchema.parse(doc.toJSON()) : null;
  }

  observeActive(userId: string = 'local'): Observable<Plan | null> {
    return this.col
      .findOne({ selector: { userId, isActive: true, deletedAt: null } })
      .$.pipe(map((doc) => (doc ? PlanSchema.parse(doc.toJSON()) : null)));
  }

  observeAll(userId: string = 'local'): Observable<Plan[]> {
    return this.col
      .find({ selector: { userId, deletedAt: null } })
      .$.pipe(map((docs) => docs.map((d) => PlanSchema.parse(d.toJSON()))));
  }

  async insert(plan: Plan): Promise<Plan> {
    const parsed = PlanSchema.parse(plan);
    await this.col.insert(parsed);
    return parsed;
  }

  async upsert(plan: Plan): Promise<Plan> {
    const parsed = PlanSchema.parse(plan);
    await this.col.upsert(parsed);
    return parsed;
  }

  async bulkUpsert(plans: Plan[]): Promise<void> {
    const parsed = plans.map((p) => PlanSchema.parse(p));
    await this.col.bulkUpsert(parsed);
  }

  async update(id: string, patch: Partial<Plan>): Promise<Plan> {
    const doc = await this.col.findOne(id).exec();
    if (!doc) throw new Error(`PLAN_NOT_FOUND: ${id}`);
    const next = PlanSchema.parse({ ...doc.toJSON(), ...patch });
    await this.col.upsert(next);
    return next;
  }

  /** 取消其他 active、設定這個為 active */
  async setActive(id: string, userId: string = 'local'): Promise<void> {
    const all = await this.col.find({ selector: { userId, isActive: true } }).exec();
    await Promise.all(
      all.map(async (doc) => {
        if (doc.get('id') !== id) {
          await doc.patch({ isActive: false, updatedAt: new Date().toISOString() });
        }
      }),
    );
    const target = await this.col.findOne(id).exec();
    if (!target) throw new Error(`PLAN_NOT_FOUND: ${id}`);
    await target.patch({ isActive: true, updatedAt: new Date().toISOString() });
  }

  /** 軟刪除 */
  async softDelete(id: string): Promise<void> {
    const doc = await this.col.findOne(id).exec();
    if (!doc) return;
    await doc.patch({ deletedAt: new Date().toISOString(), isActive: false });
  }

  async count(): Promise<number> {
    return this.col.count().exec();
  }
}
