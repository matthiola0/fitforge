import type { ExerciseRepository, ExerciseQuery } from '../data/repositories/ExerciseRepository';
import type { Exercise } from '../data/schemas/exercise.schema';
import { MUSCLES_BY_BODY_PART, type BodyPart, type Equipment } from '../data/schemas/tags';

/**
 * ExerciseQueryService — 依 tag 查詢、找替代動作、智慧推薦
 *
 * 對應 docs/13-exercise-tagging.md §9、docs/05-domain-logic.md §8。
 */
export class ExerciseQueryService {
  constructor(private deps: { exerciseRepo: ExerciseRepository }) {}

  async query(opts: ExerciseQuery): Promise<Exercise[]> {
    return this.deps.exerciseRepo.query(opts);
  }

  /**
   * 找替代動作 — 3 階 fallback
   * Tier 1: 同 bodyPart + 同主肌群 (muscles[0])
   * Tier 2: 若 < 3 結果、退到同 bodyPart
   * Tier 3: 若 < 2 結果、退到任一 muscle 重疊
   *
   * 對應 docs/13-exercise-tagging.md §9。
   */
  async findSubstitutes(input: {
    exerciseId: string;
    swapScope?: 'same_muscle' | 'same_body_part' | 'any';
    limit?: number;
  }): Promise<Exercise[]> {
    const { exerciseId, swapScope = 'same_muscle', limit = 8 } = input;
    const target = await this.deps.exerciseRepo.get(exerciseId);
    if (!target) return [];

    // swapScope='any' 直接回傳同部位以外的所有動作
    if (swapScope === 'any') {
      const all = await this.deps.exerciseRepo.listAll();
      return all.filter((e) => e.id !== exerciseId).slice(0, limit);
    }

    const primaryMuscle = target.muscles[0];
    if (!primaryMuscle) return [];

    // Tier 1: 同 bodyPart + 同主肌群
    const tier1 = await this.deps.exerciseRepo.query({
      bodyPart: target.bodyPart,
      includesMuscle: primaryMuscle,
      excludeId: exerciseId,
    });
    if (tier1.length >= 3) return tier1.slice(0, limit);

    // 若 swapScope 是 same_muscle，到此為止
    if (swapScope === 'same_muscle' && tier1.length > 0) {
      return tier1.slice(0, limit);
    }

    // Tier 2: 同 bodyPart
    const tier2 = await this.deps.exerciseRepo.query({
      bodyPart: target.bodyPart,
      excludeId: exerciseId,
    });
    if (tier2.length >= 2) return mergeUnique(tier1, tier2).slice(0, limit);

    // Tier 3: 任一 muscle 交集
    const tier3 = await this.deps.exerciseRepo.query({
      anyMuscles: target.muscles,
      excludeId: exerciseId,
    });
    return mergeUnique(tier1, tier2, tier3).slice(0, limit);
  }

  /**
   * Ad-hoc 推薦
   * 依目標 bodyParts、分配 count、優先覆蓋不同 muscles。
   */
  async pickForBodyParts(input: {
    bodyParts: BodyPart[];
    count: number;
    excludeExerciseIds?: string[];
    availableEquipment?: Equipment[];
  }): Promise<Exercise[]> {
    const exclude = new Set(input.excludeExerciseIds ?? []);
    const all = await this.deps.exerciseRepo.query({
      bodyParts: input.bodyParts,
      equipment: input.availableEquipment,
    });
    const pool = all.filter((e) => !exclude.has(e.id));
    if (pool.length === 0) return [];

    // 將 pool 依 bodyPart 分桶
    const buckets = new Map<BodyPart, Exercise[]>();
    for (const e of pool) {
      const bp = (e.bodyPart === 'full_body' ? input.bodyParts[0]! : e.bodyPart);
      const list = buckets.get(bp) ?? [];
      list.push(e);
      buckets.set(bp, list);
    }

    // 每個 bodyPart 在 pool 內隨機取一些、優先覆蓋不同 muscles
    const allocPerPart = Math.max(1, Math.ceil(input.count / input.bodyParts.length));
    const picked: Exercise[] = [];
    const seenMuscles = new Set<string>();

    for (const bp of input.bodyParts) {
      const bucket = buckets.get(bp);
      if (!bucket) continue;
      const sorted = sortByMuscleCoverage(bucket, seenMuscles);
      for (const e of sorted.slice(0, allocPerPart)) {
        picked.push(e);
        for (const m of e.muscles) seenMuscles.add(m);
        if (picked.length >= input.count) break;
      }
      if (picked.length >= input.count) break;
    }

    return picked.slice(0, input.count);
  }

  /** 取得某 bodyPart 下所有 muscles（給 UI 篩選用） */
  musclesForBodyPart(bodyPart: BodyPart) {
    return MUSCLES_BY_BODY_PART[bodyPart] ?? [];
  }
}

// ===== Helpers =============================================================

function mergeUnique<T extends { id: string }>(...lists: T[][]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
  }
  return out;
}

function sortByMuscleCoverage(pool: Exercise[], seenMuscles: Set<string>): Exercise[] {
  // 「越能引入新 muscle」越優先；同等好則 difficulty=beginner > intermediate > advanced
  const diffOrder: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
  return [...pool].sort((a, b) => {
    const newA = a.muscles.filter((m) => !seenMuscles.has(m)).length;
    const newB = b.muscles.filter((m) => !seenMuscles.has(m)).length;
    if (newB !== newA) return newB - newA;
    return (diffOrder[a.difficulty] ?? 99) - (diffOrder[b.difficulty] ?? 99);
  });
}
