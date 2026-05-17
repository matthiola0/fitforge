import { nanoid } from 'nanoid';
import type { IdPort, IdPrefix } from '../ports/IdPort';

/**
 * Nanoid 預設實作。每個 prefix 自己一段 21 字 nanoid。
 *
 * 範例：`ex_V1StGXR8_Z5jdHi6B-myT`
 */
export class NanoidIdGenerator implements IdPort {
  next(prefix: IdPrefix): string {
    return `${prefix}_${nanoid()}`;
  }
}
