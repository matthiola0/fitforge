import { useMemo } from 'react';
import type { BodyPart, Difficulty, Equipment, Exercise } from '@fitforge/core';
import { filterExercises } from '@fitforge/core';
import { useCore } from '@/lib/core/CoreProvider';
import { useRxQuery } from '@/lib/rxdb/useRxQuery';

export type ExerciseFilters = {
  bodyPart?: BodyPart | 'all';
  search?: string;
  equipment?: Equipment[];
  difficulty?: Difficulty[];
};

/**
 * useExercises — 取所有動作（reactive）+ in-memory filter
 *
 * 為何不用 ExerciseQueryService.query()：那是 async one-shot、
 * 不會在 RxDB 變動時 re-render。observable + in-memory filter 才對。
 */
export function useExercises(filters: ExerciseFilters = {}) {
  const core = useCore();
  const all = useRxQuery(() => core.exerciseRepo.observeAll(), [core]);

  const filtered = useMemo<Exercise[] | null>(() => {
    if (!all.data) return null;
    return filterExercises(all.data, {
      bodyPart: filters.bodyPart === 'all' ? undefined : filters.bodyPart,
      search: filters.search,
      equipment: filters.equipment,
      difficulty: filters.difficulty,
    });
  }, [all.data, filters.bodyPart, filters.search, filters.equipment, filters.difficulty]);

  return { data: filtered, isLoading: all.isLoading, error: all.error };
}
