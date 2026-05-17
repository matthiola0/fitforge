import { z } from 'zod';
import { BODY_PARTS, DIFFICULTIES, EQUIPMENT, MUSCLES, musclesMatchBodyPart } from './tags';

/**
 * Exercise — 動作圖庫項目
 *
 * 對應 docs/04-data-model.md §3.1、docs/13-exercise-tagging.md。
 *
 * V1 全部 isPreset: true，用戶不能新增動作（V2 開放）。
 */
export const ExerciseSchema = z
  .object({
    id: z.string().regex(/^ex_/),
    slug: z.string().min(1).max(64),
    nameZh: z.string().min(1).max(64),
    nameEn: z.string().min(1).max(64),

    // Tag 兩層
    bodyPart: z.enum(BODY_PARTS),
    muscles: z.array(z.enum(MUSCLES)).min(1).max(6),

    // 其他屬性
    equipment: z.array(z.enum(EQUIPMENT)),
    difficulty: z.enum(DIFFICULTIES),
    isUnilateral: z.boolean().default(false),

    // 內容
    lottieAssetId: z.string(),
    description: z.string(),
    steps: z.array(z.string()).max(8),
    tips: z.array(z.string()).max(5),
    commonMistakes: z.array(z.string()).max(5),
    videoUrl: z.string().url().optional(),

    // Meta
    isPreset: z.literal(true),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .refine((d) => musclesMatchBodyPart(d.bodyPart, d.muscles), {
    message: 'muscles 必須對應 bodyPart 或 bodyPart 為 full_body',
    path: ['muscles'],
  });

export type Exercise = z.infer<typeof ExerciseSchema>;
