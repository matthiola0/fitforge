import type { WorkoutRepository } from '../data/repositories/WorkoutRepository';
import type { Workout } from '../data/schemas/workout.schema';

export type WorkoutSummary = {
  workoutId: string;
  durationSeconds: number | null;
  totalSets: number;
  completedSets: number;
  totalVolume: number; // in kg
  totalVolumeUnit: 'kg';
  exerciseCount: number;
  prs: PRRecord[];
};

export type PRRecord = {
  exerciseId: string;
  type: '1RM_estimate' | 'volume_per_set' | 'reps_at_weight';
  value: number;
  achievedAt: string;
};

/**
 * StatsService — 訓練摘要、PR、簡易進度
 *
 * 對應 docs/05-domain-logic.md §4。
 */
export class StatsService {
  constructor(private deps: { workoutRepo: WorkoutRepository }) {}

  /**
   * 計算單次訓練摘要
   * - totalVolume 統一轉成 kg
   * - 不撈歷史 PR（純摘要、PR 對比由 detectPRs() 處理）
   */
  computeSummary(workout: Workout): WorkoutSummary {
    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;
    for (const we of workout.exercises) {
      totalSets += we.sets.length;
      for (const s of we.sets) {
        if (!s.isCompleted) continue;
        completedSets += 1;
        const weightKg = s.weightUnit === 'lb' ? s.weight * 0.4536 : s.weight;
        totalVolume += weightKg * s.reps;
      }
    }
    return {
      workoutId: workout.id,
      durationSeconds: workout.durationSeconds,
      totalSets,
      completedSets,
      totalVolume: round2(totalVolume),
      totalVolumeUnit: 'kg',
      exerciseCount: workout.exercises.length,
      prs: [], // detectPRs 是另一支
    };
  }

  /**
   * 偵測本次 workout 比歷史紀錄破紀錄的動作。
   * 三種 PR 類型詳見 docs/05-domain-logic.md §4.2。
   */
  async detectPRs(workout: Workout, userId: string = 'local'): Promise<PRRecord[]> {
    const prs: PRRecord[] = [];

    // 撈該 user 所有 completed workouts (不含本次)
    const history = (await this.deps.workoutRepo.listByStatus('completed', userId)).filter(
      (w) => w.id !== workout.id,
    );

    // 對本次每個 exercise，找最佳 1RM estimate / volume / reps@weight
    for (const we of workout.exercises) {
      const exerciseId = we.exerciseId;
      const thisBestEstimate = bestEpley1RM(we.sets.filter((s) => s.isCompleted));
      const histBestEstimate = bestEpley1RMAcrossHistory(history, exerciseId);

      if (thisBestEstimate > histBestEstimate && thisBestEstimate > 0) {
        prs.push({
          exerciseId,
          type: '1RM_estimate',
          value: round2(thisBestEstimate),
          achievedAt: workout.endedAt ?? workout.startedAt,
        });
      }
    }
    return prs;
  }
}

// ===== Helpers =============================================================

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function epley1RM(weight: number, reps: number) {
  if (reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

function bestEpley1RM(sets: { weight: number; weightUnit: 'kg' | 'lb'; reps: number }[]): number {
  let best = 0;
  for (const s of sets) {
    const w = s.weightUnit === 'lb' ? s.weight * 0.4536 : s.weight;
    const v = epley1RM(w, s.reps);
    if (v > best) best = v;
  }
  return best;
}

function bestEpley1RMAcrossHistory(history: Workout[], exerciseId: string): number {
  let best = 0;
  for (const w of history) {
    for (const we of w.exercises) {
      if (we.exerciseId !== exerciseId) continue;
      const v = bestEpley1RM(we.sets.filter((s) => s.isCompleted));
      if (v > best) best = v;
    }
  }
  return best;
}
