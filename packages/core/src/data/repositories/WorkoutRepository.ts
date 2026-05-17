import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FitForgeDatabase } from '../database';
import { WorkoutSchema } from '../schemas/workout.schema';
import type { Workout, WorkoutStatus } from '../schemas/workout.schema';

/**
 * WorkoutRepository — 訓練紀錄 CRUD
 *
 * 對應 docs/04-data-model.md §3.3、docs/05-domain-logic.md §2。
 */
export class WorkoutRepository {
  constructor(private db: FitForgeDatabase) {}

  private get col() {
    return this.db.workouts;
  }

  async get(id: string): Promise<Workout | null> {
    const doc = await this.col.findOne(id).exec();
    if (!doc) return null;
    const wo = WorkoutSchema.parse(doc.toJSON());
    return wo.deletedAt ? null : wo;
  }

  async findInProgress(userId: string = 'local'): Promise<Workout | null> {
    const doc = await this.col
      .findOne({ selector: { userId, status: 'in_progress', deletedAt: null } })
      .exec();
    return doc ? WorkoutSchema.parse(doc.toJSON()) : null;
  }

  observeInProgress(userId: string = 'local'): Observable<Workout | null> {
    return this.col
      .findOne({ selector: { userId, status: 'in_progress', deletedAt: null } })
      .$.pipe(map((doc) => (doc ? WorkoutSchema.parse(doc.toJSON()) : null)));
  }

  observe(id: string): Observable<Workout | null> {
    return this.col.findOne(id).$.pipe(map((doc) => (doc ? WorkoutSchema.parse(doc.toJSON()) : null)));
  }

  async listByStatus(
    status: WorkoutStatus,
    userId: string = 'local',
    limit?: number,
  ): Promise<Workout[]> {
    const query: any = { selector: { userId, status, deletedAt: null }, sort: [{ startedAt: 'desc' }] };
    if (limit) query.limit = limit;
    const docs = await this.col.find(query).exec();
    return docs.map((d) => WorkoutSchema.parse(d.toJSON()));
  }

  async listRecent(limit: number = 20, userId: string = 'local'): Promise<Workout[]> {
    const docs = await this.col
      .find({
        selector: { userId, status: 'completed', deletedAt: null },
        sort: [{ startedAt: 'desc' }],
        limit,
      })
      .exec();
    return docs.map((d) => WorkoutSchema.parse(d.toJSON()));
  }

  observeRecent(limit: number = 20, userId: string = 'local'): Observable<Workout[]> {
    return this.col
      .find({
        selector: { userId, status: 'completed', deletedAt: null },
        sort: [{ startedAt: 'desc' }],
        limit,
      })
      .$.pipe(map((docs) => docs.map((d) => WorkoutSchema.parse(d.toJSON()))));
  }

  async insert(workout: Workout): Promise<Workout> {
    const parsed = WorkoutSchema.parse(workout);
    await this.col.insert(parsed);
    return parsed;
  }

  async update(id: string, patch: Partial<Workout>): Promise<Workout> {
    const doc = await this.col.findOne(id).exec();
    if (!doc) throw new Error(`WORKOUT_NOT_FOUND: ${id}`);
    const next = WorkoutSchema.parse({ ...doc.toJSON(), ...patch });
    await this.col.upsert(next);
    return next;
  }

  async softDelete(id: string): Promise<void> {
    const doc = await this.col.findOne(id).exec();
    if (!doc) return;
    await doc.patch({ deletedAt: new Date().toISOString() });
  }

  async count(): Promise<number> {
    return this.col.count().exec();
  }
}
