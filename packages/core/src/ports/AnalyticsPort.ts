/**
 * AnalyticsPort — V1 用 NoopAnalytics、V2 可換 PostHog/Plausible
 *
 * 對應 docs/10-ai-extension-points.md / docs/02-system-architecture.md §6.1。
 */
export interface AnalyticsPort {
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
}
