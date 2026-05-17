import type { ClockPort } from '../ports/ClockPort';

/**
 * 系統時鐘 — 直接讀 OS 時間。Production 預設實作。
 */
export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }

  monotonic(): number {
    // performance.now() 在 Node 與瀏覽器都可用，且 monotonic
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }
}
