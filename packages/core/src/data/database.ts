import { addRxPlugin, createRxDatabase, type RxCollection, type RxDatabase } from 'rxdb';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

import {
  exerciseRxSchema,
  onboardingRxSchema,
  planRxSchema,
  settingsRxSchema,
  workoutRxSchema,
} from './rxdb-schemas';

addRxPlugin(RxDBQueryBuilderPlugin);

/**
 * Generic document shape — RxDB storage just sees JSON。
 * Repository 層用 Zod 嚴格驗證，這裡只需要 RxCollection 的方法可用。
 */
export type FitForgeDocType = Record<string, unknown>;

export type FitForgeCollections = {
  exercises: RxCollection<FitForgeDocType>;
  plans: RxCollection<FitForgeDocType>;
  workouts: RxCollection<FitForgeDocType>;
  settings: RxCollection<FitForgeDocType>;
  onboarding: RxCollection<FitForgeDocType>;
};

export type FitForgeDatabase = RxDatabase<FitForgeCollections>;

export type CreateDatabaseOptions = {
  /** 資料庫名稱、預設 fitforge */
  name?: string;
  /** 儲存後端，預設 dexie (瀏覽器)、測試用 'memory' */
  storage?: 'dexie' | 'memory';
  /** Multi-tab 同步（瀏覽器多分頁），預設 true */
  multiInstance?: boolean;
  /** 啟動時忽略已存在的同名 db，主要用於測試清乾淨 */
  ignoreDuplicate?: boolean;
};

const STORAGE_FACTORIES = {
  dexie: getRxStorageDexie,
  memory: getRxStorageMemory,
} as const;

/**
 * 建立 FitForge 的 RxDB 資料庫實例。
 *
 * 業務端永遠透過 Repositories 操作、不直接接觸 RxDB API。
 */
export async function createDatabase(opts: CreateDatabaseOptions = {}): Promise<FitForgeDatabase> {
  const storageFactory = STORAGE_FACTORIES[opts.storage ?? 'dexie'];
  const db = await createRxDatabase<FitForgeCollections>({
    name: opts.name ?? 'fitforge',
    storage: storageFactory(),
    multiInstance: opts.multiInstance ?? (opts.storage !== 'memory'),
    ignoreDuplicate: opts.ignoreDuplicate ?? false,
    eventReduce: true,
  });

  await db.addCollections({
    exercises: { schema: exerciseRxSchema },
    plans: { schema: planRxSchema },
    workouts: { schema: workoutRxSchema },
    settings: { schema: settingsRxSchema },
    onboarding: { schema: onboardingRxSchema },
  });

  return db;
}
