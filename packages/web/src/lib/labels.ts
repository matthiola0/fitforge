import type { BodyPart, Muscle, Difficulty } from '@fitforge/core';

/**
 * i18n labels — V1 only zh-TW
 *
 * 之後接 lingui 時、把這些 key 改成 t() 呼叫。
 */

export const BODY_PART_LABELS_ZH: Record<BodyPart, string> = {
  chest: '胸',
  back: '背',
  shoulders: '肩',
  arms: '手臂',
  legs: '腿',
  core: '核心',
  full_body: '全身',
};

export const MUSCLE_LABELS_ZH: Record<Muscle, string> = {
  upper_chest: '上胸',
  mid_chest: '中胸',
  lower_chest: '下胸',
  lats: '闊背',
  mid_back: '中背',
  lower_back: '下背',
  traps: '斜方',
  front_delts: '前三角',
  lateral_delts: '中三角',
  rear_delts: '後三角',
  biceps: '二頭',
  triceps: '三頭',
  forearms: '前臂',
  quads: '股四頭',
  hamstrings: '腿後',
  glutes: '臀',
  calves: '小腿',
  abs: '腹肌',
  obliques: '腹斜',
  deep_core: '深層核心',
};

export const DIFFICULTY_LABELS_ZH: Record<Difficulty, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '進階',
};

export const EQUIPMENT_LABELS_ZH: Record<string, string> = {
  barbell: '槓鈴',
  dumbbell: '啞鈴',
  machine: '機械',
  cable: '滑輪',
  bodyweight: '自體重',
  kettlebell: '壺鈴',
  band: '彈力帶',
  bench: '椅',
};

export function bodyPartLabel(bp: BodyPart): string {
  return BODY_PART_LABELS_ZH[bp];
}
export function muscleLabel(m: Muscle): string {
  return MUSCLE_LABELS_ZH[m];
}
export function difficultyLabel(d: Difficulty): string {
  return DIFFICULTY_LABELS_ZH[d];
}
