import type { IdPort, IdPrefix } from '../../src/ports/IdPort';

/**
 * 測試用的確定性 ID 產生器。
 *
 * 每個 prefix 各自從 0 開始遞增：ex_0、ex_1、wo_0...
 */
export class DeterministicIdGen implements IdPort {
  private counters = new Map<IdPrefix, number>();

  next(prefix: IdPrefix): string {
    const cur = this.counters.get(prefix) ?? 0;
    this.counters.set(prefix, cur + 1);
    return `${prefix}_${cur}`;
  }

  reset(): void {
    this.counters.clear();
  }
}
