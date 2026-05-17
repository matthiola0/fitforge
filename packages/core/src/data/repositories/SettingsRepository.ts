import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FitForgeDatabase } from '../database';
import { SettingsSchema } from '../schemas/settings.schema';
import type { Settings } from '../schemas/settings.schema';

/**
 * SettingsRepository — 用戶偏好（單文件）
 */
export class SettingsRepository {
  constructor(private db: FitForgeDatabase) {}

  private get col() {
    return this.db.settings;
  }

  async get(userId: string = 'local'): Promise<Settings | null> {
    const doc = await this.col.findOne(userId).exec();
    return doc ? SettingsSchema.parse(doc.toJSON()) : null;
  }

  observe(userId: string = 'local'): Observable<Settings | null> {
    return this.col.findOne(userId).$.pipe(map((doc) => (doc ? SettingsSchema.parse(doc.toJSON()) : null)));
  }

  async upsert(settings: Settings): Promise<Settings> {
    const parsed = SettingsSchema.parse(settings);
    await this.col.upsert(parsed);
    return parsed;
  }

  async update(userId: string, patch: Partial<Settings>): Promise<Settings> {
    const existing = await this.get(userId);
    const merged: Settings = {
      ...(existing ?? defaultSettings(userId)),
      ...patch,
      userId,
      updatedAt: new Date().toISOString(),
    };
    return this.upsert(merged);
  }
}

function defaultSettings(userId: string): Settings {
  const now = new Date().toISOString();
  return SettingsSchema.parse({
    userId,
    weightUnit: 'kg',
    theme: 'system',
    hapticsEnabled: true,
    soundEnabled: true,
    defaultRestSeconds: 90,
    locale: 'zh-TW',
    onboardingCompleted: false,
    installPromptShownCount: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export { defaultSettings };
