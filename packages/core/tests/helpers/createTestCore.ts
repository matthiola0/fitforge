import { createCore, type Core, type CoreDeps } from '../../src/container';
import { FakeClock } from './FakeClock';
import { DeterministicIdGen } from './DeterministicIdGen';

let dbCounter = 0;

/**
 * 建立隔離的測試用 core 實例 — 每個 test 一個 in-memory DB。
 */
export async function createTestCore(opts: CoreDeps = {}): Promise<Core & { clock: FakeClock; idGen: DeterministicIdGen }> {
  const clock = (opts.clock as FakeClock) ?? new FakeClock();
  const idGen = (opts.idGen as DeterministicIdGen) ?? new DeterministicIdGen();
  const dbName = `fitforge-test-${Date.now()}-${dbCounter++}`;
  const core = await createCore({
    ...opts,
    clock,
    idGen,
    databaseOptions: {
      ...opts.databaseOptions,
      name: dbName,
      storage: 'memory',
      multiInstance: false,
      ignoreDuplicate: true,
    },
  });
  return Object.assign(core, { clock, idGen });
}
