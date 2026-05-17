import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FitForgeDatabase } from '../database';
import { ExerciseSchema } from '../schemas/exercise.schema';
import type { Exercise } from '../schemas/exercise.schema';
import type { BodyPart, Difficulty, Equipment, Muscle } from '../schemas/tags';

export interface ExerciseQuery {
  bodyPart?: BodyPart;
  bodyParts?: BodyPart[];
  includesMuscle?: Muscle;
  anyMuscles?: Muscle[];
  equipment?: Equipment[];
  difficulty?: Difficulty[];
  excludeId?: string;
  search?: string;
  limit?: number;
}

/**
 * ExerciseRepository — 動作圖庫
 *
 * 在 V1 是「只讀」(全部 isPreset)，V2 才允許用戶自建動作。
 *
 * 對應 docs/04-data-model.md §3.1、docs/13-exercise-tagging.md §8。
 */
export class ExerciseRepository {
  constructor(private db: FitForgeDatabase) {}

  private get col() {
    return this.db.exercises;
  }

  async get(id: string): Promise<Exercise | null> {
    const doc = await this.col.findOne(id).exec();
    return doc ? parseExercise(doc.toJSON()) : null;
  }

  async getBySlug(slug: string): Promise<Exercise | null> {
    const doc = await this.col.findOne({ selector: { slug } }).exec();
    return doc ? parseExercise(doc.toJSON()) : null;
  }

  async getMany(ids: string[]): Promise<Exercise[]> {
    if (ids.length === 0) return [];
    const docs = await this.col.findByIds(ids).exec();
    return Array.from(docs.values()).map((d) => parseExercise(d.toJSON()));
  }

  async listAll(): Promise<Exercise[]> {
    const docs = await this.col.find().exec();
    return docs.map((d) => parseExercise(d.toJSON()));
  }

  /**
   * 通用查詢（用於 Exercise Library、Swap Sheet、Ad-hoc Builder）。
   * 大部分 filter 在記憶體做 — 動作量級才 30，效能無虞，邏輯更易理解。
   */
  async query(opts: ExerciseQuery): Promise<Exercise[]> {
    const all = await this.listAll();
    return filterExercises(all, opts);
  }

  observeAll(): Observable<Exercise[]> {
    return this.col.find().$.pipe(map((docs) => docs.map((d) => parseExercise(d.toJSON()))));
  }

  /** 種子用：批次寫入。已存在的 id 會被 upsert 覆蓋。 */
  async bulkUpsert(exercises: Exercise[]): Promise<void> {
    // Zod 驗證每一筆
    const validated = exercises.map((e) => ExerciseSchema.parse(e));
    await this.col.bulkUpsert(validated);
  }

  async count(): Promise<number> {
    return this.col.count().exec();
  }
}

// ===== Helpers =============================================================

function parseExercise(raw: unknown): Exercise {
  return ExerciseSchema.parse(raw);
}

export function filterExercises(all: Exercise[], opts: ExerciseQuery): Exercise[] {
  let res = all;
  if (opts.bodyPart) {
    res = res.filter((e) => e.bodyPart === opts.bodyPart);
  }
  if (opts.bodyParts && opts.bodyParts.length > 0) {
    const set = new Set(opts.bodyParts);
    res = res.filter((e) => set.has(e.bodyPart) || e.bodyPart === 'full_body');
  }
  if (opts.includesMuscle) {
    res = res.filter((e) => e.muscles.includes(opts.includesMuscle!));
  }
  if (opts.anyMuscles && opts.anyMuscles.length > 0) {
    const set = new Set(opts.anyMuscles);
    res = res.filter((e) => e.muscles.some((m) => set.has(m)));
  }
  if (opts.equipment && opts.equipment.length > 0) {
    const set = new Set(opts.equipment);
    res = res.filter((e) => e.equipment.some((eq) => set.has(eq)));
  }
  if (opts.difficulty && opts.difficulty.length > 0) {
    const set = new Set(opts.difficulty);
    res = res.filter((e) => set.has(e.difficulty));
  }
  if (opts.excludeId) {
    res = res.filter((e) => e.id !== opts.excludeId);
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    res = res.filter(
      (e) =>
        e.nameZh.toLowerCase().includes(q) ||
        e.nameEn.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q),
    );
  }
  if (opts.limit) {
    res = res.slice(0, opts.limit);
  }
  return res;
}
