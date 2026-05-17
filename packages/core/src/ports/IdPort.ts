/**
 * IdPort — 抽象 ID 產生
 *
 * 對應 docs/02-system-architecture.md §5.2。
 *
 * 所有實體 ID 經此 port 產生，避免散落 `nanoid()` 呼叫，且測試可注入確定性產生器。
 */
export type IdPrefix =
  | 'ex'
  | 'plan'
  | 'pd'
  | 'pe'
  | 'wo'
  | 'we'
  | 'set'
  | 'mm';

export interface IdPort {
  next(prefix: IdPrefix): string;
}
