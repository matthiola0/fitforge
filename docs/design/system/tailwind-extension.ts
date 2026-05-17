/**
 * FitForge — Tailwind theme extension
 *
 * 從 docs/design/system/tokens.html 抽出 (tailwind.config script 區段)。
 * 之後合併到 packages/web/tailwind.config.ts。
 */
import type { Config } from 'tailwindcss';

export const fitForgeTheme: Partial<Config['theme']> = {
  extend: {
    colors: {
      background: 'hsl(var(--background) / <alpha-value>)',
      foreground: 'hsl(var(--foreground) / <alpha-value>)',
      card: {
        DEFAULT: 'hsl(var(--card) / <alpha-value>)',
        foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
      },
      primary: {
        DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
        foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
        foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
        foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
        foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
        foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
      },
      success: {
        DEFAULT: 'hsl(var(--success) / <alpha-value>)',
        foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
      },
      warning: {
        DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
        foreground: 'hsl(var(--warning-foreground) / <alpha-value>)',
      },
      border: 'hsl(var(--border) / <alpha-value>)',
      input: 'hsl(var(--input) / <alpha-value>)',
      ring: 'hsl(var(--ring) / <alpha-value>)',
    },
    borderRadius: {
      sm: '6px',
      md: '10px',
      lg: '14px',
      xl: '20px',
    },
    fontFamily: {
      sans: [
        'Inter',
        'Noto Sans TC',
        '-apple-system',
        'BlinkMacSystemFont',
        'PingFang TC',
        'system-ui',
        'sans-serif',
      ],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },
    fontSize: {
      // 從 §02 Typography scale
      // 命名沿用 Tailwind 慣例、value 對齊設計系統
      h1: ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
      h2: ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
      h3: ['20px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
      h4: ['18px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
      body: ['16px', { lineHeight: '1.5', fontWeight: '500' }],
      small: ['14px', { lineHeight: '1.5', fontWeight: '500' }],
      caption: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
    },
    boxShadow: {
      'ds-sm':
        '0 1px 2px 0 hsl(var(--shadow-color) / 0.06), 0 1px 1px 0 hsl(var(--shadow-color) / 0.04)',
      'ds-md':
        '0 4px 12px -2px hsl(var(--shadow-color) / 0.10), 0 2px 4px -1px hsl(var(--shadow-color) / 0.06)',
      'ds-lg':
        '0 20px 40px -12px hsl(var(--shadow-color) / 0.18), 0 8px 16px -6px hsl(var(--shadow-color) / 0.10)',
      'ds-glow':
        '0 0 0 1px hsl(var(--primary) / 0.40), 0 8px 24px -2px hsl(var(--primary) / 0.45), 0 0 32px -4px hsl(var(--primary) / 0.55)',
    },
    transitionTimingFunction: {
      forge: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },
};
