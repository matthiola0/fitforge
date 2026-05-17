import type { ClockPort } from '../../src/ports/ClockPort';

/**
 * 測試用的可控時鐘。
 *
 * - new FakeClock('2026-05-14T10:00:00Z') 起算
 * - clock.advance(60) 推進 60 秒
 * - clock.monotonic() 與 clock.now() 同步
 */
export class FakeClock implements ClockPort {
  private current: Date;
  private monoBase = 1_000_000;

  constructor(start: string | Date = '2026-05-14T10:00:00.000Z') {
    this.current = typeof start === 'string' ? new Date(start) : new Date(start);
  }

  now(): Date {
    return new Date(this.current);
  }

  monotonic(): number {
    return this.monoBase + this.current.getTime();
  }

  /** 推進 N 秒 */
  advance(seconds: number): void {
    this.current = new Date(this.current.getTime() + seconds * 1000);
  }

  /** 推進到絕對時間 */
  setTo(date: string | Date): void {
    this.current = typeof date === 'string' ? new Date(date) : new Date(date);
  }
}
