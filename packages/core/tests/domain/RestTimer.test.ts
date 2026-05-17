import { describe, expect, it, vi } from 'vitest';
import { RestTimer } from '../../src/domain/RestTimer';
import { FakeClock } from '../helpers/FakeClock';

describe('RestTimer', () => {
  it('ticks down and calls onEnd at zero', async () => {
    vi.useFakeTimers();
    const clock = new FakeClock();
    const timer = new RestTimer(clock);
    const ticks: number[] = [];
    let ended = false;

    timer.start(
      3,
      (s) => ticks.push(s),
      () => {
        ended = true;
      },
    );

    expect(ticks[0]).toBe(3); // 立即 tick
    expect(timer.isActive()).toBe(true);

    // 推進 1s
    clock.advance(1);
    await vi.advanceTimersByTimeAsync(250);
    // 推進 2s
    clock.advance(1);
    await vi.advanceTimersByTimeAsync(250);
    // 推進到結束
    clock.advance(1.5);
    await vi.advanceTimersByTimeAsync(500);

    expect(ended).toBe(true);
    expect(timer.isActive()).toBe(false);
    vi.useRealTimers();
  });

  it('skip() triggers onEnd immediately', async () => {
    vi.useFakeTimers();
    const clock = new FakeClock();
    const timer = new RestTimer(clock);
    let ended = false;
    timer.start(
      60,
      () => {},
      () => {
        ended = true;
      },
    );
    timer.skip();
    expect(ended).toBe(true);
    expect(timer.isActive()).toBe(false);
    vi.useRealTimers();
  });

  it('extend() pushes endAt later', async () => {
    vi.useFakeTimers();
    const clock = new FakeClock();
    const timer = new RestTimer(clock);
    timer.start(
      10,
      () => {},
      () => {},
    );
    expect(timer.remaining()).toBe(10);
    timer.extend(5);
    expect(timer.remaining()).toBe(15);
    vi.useRealTimers();
  });
});
