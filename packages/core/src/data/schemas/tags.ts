/**
 * 動作 Tag 系統 — 兩層分類
 *
 * 對應 docs/13-exercise-tagging.md。本檔是 tag 值集的單一真相。
 *
 * - bodyPart: 7 個大分類，1 個 exercise 只能有 1 個
 * - muscles: 21 個細分肌群，1 個 exercise 可有 1-6 個，第一個是「主肌群」
 */

// === 大分類 (bodyPart) =====================================================

export const BODY_PARTS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'full_body',
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];

// === 細分肌群 (muscles) ====================================================

export const MUSCLES = [
  // chest
  'upper_chest',
  'mid_chest',
  'lower_chest',
  // back
  'lats',
  'mid_back',
  'lower_back',
  'traps',
  // shoulders
  'front_delts',
  'lateral_delts',
  'rear_delts',
  // arms
  'biceps',
  'triceps',
  'forearms',
  // legs
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  // core
  'abs',
  'obliques',
  'deep_core',
] as const;

export type Muscle = (typeof MUSCLES)[number];

// === Muscle ↔ BodyPart 映射 ================================================

export const MUSCLE_TO_BODY_PART: Record<Muscle, BodyPart> = {
  upper_chest: 'chest',
  mid_chest: 'chest',
  lower_chest: 'chest',
  lats: 'back',
  mid_back: 'back',
  lower_back: 'back',
  traps: 'back',
  front_delts: 'shoulders',
  lateral_delts: 'shoulders',
  rear_delts: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  abs: 'core',
  obliques: 'core',
  deep_core: 'core',
};

export const MUSCLES_BY_BODY_PART: Record<BodyPart, Muscle[]> = (() => {
  const map = { chest: [], back: [], shoulders: [], arms: [], legs: [], core: [], full_body: [] } as Record<BodyPart, Muscle[]>;
  for (const m of MUSCLES) {
    map[MUSCLE_TO_BODY_PART[m]].push(m);
  }
  return map;
})();

// === Equipment 與 Difficulty ===============================================

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'band',
  'bench',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

// === Helpers ===============================================================

/**
 * 檢查某 muscles 列表是否與宣告的 bodyPart 相符。
 *
 * - 若 bodyPart 是 full_body，任何 muscle 皆可。
 * - 否則「主肌群」(muscles[0]) 必須對應該 bodyPart；輔助肌群 (muscles[1+]) 可跨部位。
 *
 * 範例：Bench Press 是 chest、主肌群 mid_chest (chest)；輔助 triceps (arms)、front_delts (shoulders) 允許。
 */
export function musclesMatchBodyPart(bodyPart: BodyPart, muscles: readonly Muscle[]): boolean {
  if (bodyPart === 'full_body') return true;
  const primary = muscles[0];
  if (!primary) return false;
  return MUSCLE_TO_BODY_PART[primary] === bodyPart;
}
