import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FitForgeDatabase } from '../database';
import { OnboardingProfileSchema } from '../schemas/onboarding.schema';
import type { OnboardingProfile } from '../schemas/onboarding.schema';

/**
 * OnboardingRepository — onboarding profile（單文件）
 */
export class OnboardingRepository {
  constructor(private db: FitForgeDatabase) {}

  private get col() {
    return this.db.onboarding;
  }

  async get(userId: string = 'local'): Promise<OnboardingProfile | null> {
    const doc = await this.col.findOne(userId).exec();
    return doc ? OnboardingProfileSchema.parse(doc.toJSON()) : null;
  }

  observe(userId: string = 'local'): Observable<OnboardingProfile | null> {
    return this.col
      .findOne(userId)
      .$.pipe(map((doc) => (doc ? OnboardingProfileSchema.parse(doc.toJSON()) : null)));
  }

  async upsert(profile: OnboardingProfile): Promise<OnboardingProfile> {
    const parsed = OnboardingProfileSchema.parse(profile);
    await this.col.upsert(parsed);
    return parsed;
  }
}
