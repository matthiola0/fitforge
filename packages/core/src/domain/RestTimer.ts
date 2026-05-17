import type { ClockPort } from '../ports/ClockPort';

/**
 * RestTimer — 訓練組間倒數
 *
 * 對應 docs/05-domain-logic.md §7。
 *
 * Domain 層的時間機器。UI 訂閱 onTick / onEnd，DOM 重整不會丟失（因為計時的「真相」在 Engine、不在 UI）。
 *
 * 注意：本實作用 setTimeout/setInterval，monotonic 時間做漂移補正。
 */
export class RestTimer {
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private endAtMono: number = 0;
  private onTickRef: ((remaining: number) => void) | null = null;
  private onEndRef: (() => void) | null = null;
  private active = false;

  constructor(private clock: ClockPort) {}

  /** 啟動倒數、回傳 unsubscribe */
  start(seconds: number, onTick: (remaining: number) => void, onEnd: () => void): () => void {
    this.stop();
    this.endAtMono = this.clock.monotonic() + seconds * 1000;
    this.onTickRef = onTick;
    this.onEndRef = onEnd;
    this.active = true;

    // 立刻 tick 一次
    onTick(seconds);

    this.intervalHandle = setInterval(() => {
      if (!this.active) return;
      const remainingMs = this.endAtMono - this.clock.monotonic();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      onTick(remainingSec);
      if (remainingMs <= 0) {
        this.stop();
        onEnd();
      }
    }, 250);

    return () => this.stop();
  }

  /** 跳過剩餘倒數，立即觸發 onEnd */
  skip(): void {
    if (!this.active) return;
    const onEnd = this.onEndRef;
    this.stop();
    onEnd?.();
  }

  /** 延長 N 秒 */
  extend(seconds: number): void {
    if (!this.active) return;
    this.endAtMono += seconds * 1000;
  }

  /** 剩餘秒數（取整） */
  remaining(): number {
    if (!this.active) return 0;
    return Math.max(0, Math.ceil((this.endAtMono - this.clock.monotonic()) / 1000));
  }

  /** 是否運行中 */
  isActive(): boolean {
    return this.active;
  }

  stop(): void {
    this.active = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }
}
