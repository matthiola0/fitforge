import { z } from 'zod';

/**
 * Settings — 用戶偏好（單文件）
 *
 * 對應 docs/04-data-model.md §3.4。
 */
export const SettingsSchema = z.object({
  userId: z.string().default('local'),
  weightUnit: z.enum(['kg', 'lb']).default('kg'),
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  hapticsEnabled: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
  defaultRestSeconds: z.number().int().min(0).max(600).default(90),
  locale: z.enum(['zh-TW']).default('zh-TW'),
  onboardingCompleted: z.boolean().default(false),
  installPromptShownCount: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Settings = z.infer<typeof SettingsSchema>;
