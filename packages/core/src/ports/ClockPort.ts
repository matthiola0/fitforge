/**
 * ClockPort — 抽象「時間」依賴
 *
 * 對應 docs/02-system-architecture.md §5.1。
 *
 * 為何不直接呼叫 `new Date()` / `Date.now()`：
 * - 測試時可注入 FakeClock 快進
 * - 訓練倒數需要 monotonic 時間（系統時間跳動不影響）
 */
export interface ClockPort {
  /** 牆鐘時間，會受系統時間調整影響 */
  now(): Date;
  /** 單調遞增的毫秒時間戳，僅用於量測經過時間（不可比 wall clock） */
  monotonic(): number;
}
