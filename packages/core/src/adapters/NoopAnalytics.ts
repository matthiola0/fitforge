import type { AnalyticsPort } from '../ports/AnalyticsPort';

/**
 * V1 不接外部 analytics（隱私 > 觀測性）。
 */
export class NoopAnalytics implements AnalyticsPort {
  track(_event: string, _properties?: Record<string, unknown>): void {
    // no-op
  }
  identify(_userId: string, _traits?: Record<string, unknown>): void {
    // no-op
  }
}
