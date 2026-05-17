import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * FitForge Tailwind config
 *
 * 從 docs/design/system/tailwind-extension.ts 合併而來。
 * Tokens 在 src/styles/globals.css 中以 CSS variables 定義。
 */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
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
      keyframes: {
        'pr-burst': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 hsl(var(--primary) / 0.5)' },
          '40%': { transform: 'scale(1.08)', boxShadow: '0 0 0 16px hsl(var(--primary) / 0)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 hsl(var(--primary) / 0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(24%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0.6) rotate(0deg)' },
          '40%': { opacity: '1', transform: 'scale(1) rotate(180deg)' },
          '60%': { opacity: '1', transform: 'scale(1) rotate(180deg)' },
        },
      },
      animation: {
        'pr-burst': 'pr-burst 700ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        sparkle: 'sparkle 2.8s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
