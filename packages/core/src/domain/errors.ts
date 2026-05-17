import type { z } from 'zod';

/**
 * Domain Errors — typed result，不 throw。
 *
 * 對應 docs/05-domain-logic.md §11。
 *
 * UI 層接到 Result.ok === false 時依 code 顯示 i18n 文案。
 */

export type DomainError =
  | { code: 'PLAN_NOT_FOUND'; planId: string }
  | { code: 'PLAN_DAY_NOT_FOUND'; planDayId: string }
  | { code: 'EXERCISE_NOT_FOUND'; exerciseId: string }
  | { code: 'WORKOUT_NOT_FOUND'; workoutId: string }
  | { code: 'WORKOUT_NOT_IN_PROGRESS'; workoutId: string; status: string }
  | { code: 'INVALID_SET'; message: string }
  | { code: 'CONCURRENT_ACTIVE_WORKOUT'; existingId: string }
  | { code: 'VALIDATION_FAILED'; details: z.ZodIssue[] }
  | { code: 'IMMUTABLE_PRESET'; planId: string }
  | { code: 'IMMUTABLE_WORKOUT'; workoutId: string }
  | { code: 'EXERCISE_NOT_SWAPPABLE'; planExerciseId: string }
  | { code: 'SWAP_TARGET_OUT_OF_SCOPE'; from: string; to: string; scope: string }
  | { code: 'CANNOT_REMOVE_WITH_COMPLETED_SETS'; workoutExerciseId: string }
  | { code: 'AD_HOC_REQUIRES_BODY_PARTS' }
  | { code: 'DRAFT_NOT_FOUND' }
  | { code: 'ALL_SETS_DONE'; workoutId: string };

// === Result type =========================================================

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = DomainError> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

// === Convenience type guards ============================================

export function isOk<T, E>(r: Result<T, E>): r is Ok<T> {
  return r.ok;
}
export function isErr<T, E>(r: Result<T, E>): r is Err<E> {
  return !r.ok;
}
