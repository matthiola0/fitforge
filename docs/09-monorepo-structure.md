# 09 — Monorepo 結構 (Repository Layout)

> 本檔列出實際資料夾、檔案、套件邊界、build 配置。配 [02-system-architecture.md](./02-system-architecture.md) 的分層讀。

---

## 1. 頂層結構

```
fitness-app/
├── docs/                       # SDD 本身
│   ├── SDD.md
│   ├── 01-product-overview.md
│   ├── ... (詳見 docs/SDD.md §0)
│   └── diagrams/               # Mermaid 原始檔
├── packages/
│   ├── core/                   # 業務邏輯 (V1/V2 共用)
│   └── web/                    # React PWA (V1)
│   # 未來: packages/native/     # React Native (V2)
├── .github/
│   └── workflows/              # CI/CD
├── .vscode/                    # 編輯器建議設定
├── package.json                # 根 workspace、scripts
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json          # 共用 TS 配置
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
└── README.md
```

---

## 2. `package.json` (root)

```json
{
  "name": "fitforge",
  "version": "1.0.0-dev",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter @fitforge/web dev",
    "build": "pnpm --filter @fitforge/web build",
    "preview": "pnpm --filter @fitforge/web preview",
    "test": "pnpm -r test",
    "test:e2e": "pnpm --filter @fitforge/web test:e2e",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,md,json,yaml}\"",
    "prepare": "husky"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "eslint": "^8.57.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.2.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  },
  "packageManager": "pnpm@9.0.0"
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
```

---

## 3. `packages/core/` — 純 TS 業務邏輯

### 3.1 結構

```
packages/core/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                # 對外匯出
│   ├── container.ts            # createCore() — DI 容器
│   ├── domain/
│   │   ├── index.ts
│   │   ├── errors.ts           # DomainError types + Result
│   │   ├── WorkoutEngine.ts
│   │   ├── PlanService.ts
│   │   ├── StatsService.ts
│   │   ├── OnboardingService.ts
│   │   ├── ExportService.ts
│   │   ├── SeedService.ts
│   │   └── RestTimer.ts
│   ├── data/
│   │   ├── index.ts
│   │   ├── database.ts         # createDatabase() — RxDB instance
│   │   ├── schemas/
│   │   │   ├── exercise.schema.ts
│   │   │   ├── plan.schema.ts
│   │   │   ├── workout.schema.ts
│   │   │   ├── settings.schema.ts
│   │   │   └── onboarding.schema.ts
│   │   ├── repositories/
│   │   │   ├── PlanRepository.ts
│   │   │   ├── ExerciseRepository.ts
│   │   │   ├── WorkoutRepository.ts
│   │   │   ├── SettingsRepository.ts
│   │   │   └── OnboardingRepository.ts
│   │   ├── migrations/
│   │   │   └── (v0 起、每個 schema 一個檔)
│   │   └── seeds/
│   │       ├── exercises.ts    # 30 個動作
│   │       └── plans.ts        # 3 個預設課表
│   ├── ports/
│   │   ├── ClockPort.ts
│   │   ├── IdPort.ts
│   │   ├── AIPort.ts           # V2 用
│   │   └── AnalyticsPort.ts    # V2 可選
│   ├── adapters/
│   │   ├── SystemClock.ts
│   │   ├── NanoidIdGenerator.ts
│   │   ├── NoopAIAdapter.ts
│   │   └── NoopAnalytics.ts
│   └── types/
│       └── (共用 type aliases)
└── tests/
    ├── domain/
    │   └── WorkoutEngine.test.ts
    └── data/
        └── PlanRepository.test.ts
```

### 3.2 `package.json`

```json
{
  "name": "@fitforge/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src tests"
  },
  "dependencies": {
    "nanoid": "^5.0.0",
    "rxdb": "^15.0.0",
    "rxjs": "^7.8.0",
    "zod": "^3.23.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "fake-indexeddb": "^5.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.5.0"
  }
}
```

### 3.3 對外 API (`src/index.ts`)

```typescript
// packages/core/src/index.ts

// 主要入口
export { createCore } from './container';
export type { Core } from './container';

// Domain models (型別)
export type { Plan, PlanDay, PlanExercise } from './data/schemas/plan.schema';
export type { Workout, WorkoutExercise, Set } from './data/schemas/workout.schema';
export type { Exercise } from './data/schemas/exercise.schema';
export type { Settings } from './data/schemas/settings.schema';
export type { OnboardingProfile } from './data/schemas/onboarding.schema';

// Domain errors
export { Ok, Err } from './domain/errors';
export type { Result, DomainError } from './domain/errors';

// Service interfaces (給 UI 取用)
export type { WorkoutEngineState, WorkoutSummary } from './domain/WorkoutEngine';

// Ports (給 V2 注入)
export type { AIPort } from './ports/AIPort';
export type { ClockPort } from './ports/ClockPort';
```

### 3.4 不可變紀律

- 任何 `import 'react'` / `import 'react-dom'` = ESLint error
- 任何 `import 'react-native'` = ESLint error
- 任何瀏覽器 only API (`window`、`document`、`navigator`) 使用 → 經由 port 或 wrapper

ESLint 配置 (片段)：

```javascript
// packages/core/.eslintrc.cjs
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['react', 'react-*', 'react-native*'], message: 'core 不可依賴 React' },
      ],
    }],
    'no-restricted-globals': ['error', 'window', 'document'],
  },
};
```

---

## 4. `packages/web/` — Vite React PWA

### 4.1 結構

```
packages/web/
├── package.json
├── tsconfig.json
├── tsconfig.node.json          # for vite.config.ts
├── vite.config.ts
├── index.html
├── tailwind.config.ts
├── postcss.config.js
├── lingui.config.ts            # i18n 提取設定
├── playwright.config.ts
├── public/
│   ├── icons/                  # PWA icons
│   ├── screenshots/            # manifest screenshots
│   ├── assets/
│   │   └── lottie/             # 30 個 .json
│   ├── robots.txt
│   └── offline.html            # SW navigation fallback (可選)
├── src/
│   ├── main.tsx                # 入口
│   ├── App.tsx
│   ├── router.tsx              # React Router 配置
│   ├── app/                    # 各 page component
│   │   ├── _layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── Header.tsx
│   │   ├── today/
│   │   │   └── TodayPage.tsx
│   │   ├── plans/
│   │   │   ├── PlansPage.tsx
│   │   │   ├── PlanDetailPage.tsx
│   │   │   └── PlanEditorPage.tsx
│   │   ├── exercises/
│   │   │   ├── ExerciseLibraryPage.tsx
│   │   │   └── ExerciseDetailPage.tsx
│   │   ├── workout/
│   │   │   ├── WorkoutSessionPage.tsx
│   │   │   └── WorkoutSummaryPage.tsx
│   │   ├── history/
│   │   │   ├── HistoryPage.tsx
│   │   │   └── WorkoutDetailPage.tsx
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx
│   │   ├── onboarding/
│   │   │   ├── OnboardingGoalStep.tsx
│   │   │   ├── OnboardingFrequencyStep.tsx
│   │   │   ├── OnboardingEquipmentStep.tsx
│   │   │   ├── OnboardingExperienceStep.tsx
│   │   │   └── OnboardingRecommendationPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── features/               # feature-grouped hooks + components
│   │   ├── workout/
│   │   │   ├── hooks/
│   │   │   │   ├── useStartWorkout.ts
│   │   │   │   ├── useLogSet.ts
│   │   │   │   ├── useWorkoutSession.ts
│   │   │   │   ├── useFinishWorkout.ts
│   │   │   │   └── useRestTick.ts
│   │   │   ├── components/
│   │   │   │   ├── SetLogger.tsx
│   │   │   │   ├── RestOverlay.tsx
│   │   │   │   ├── ExerciseHero.tsx
│   │   │   │   └── WorkoutHeader.tsx
│   │   │   └── index.ts
│   │   ├── plans/
│   │   │   ├── hooks/
│   │   │   │   ├── usePlans.ts
│   │   │   │   ├── usePlan.ts
│   │   │   │   ├── usePlanEditor.ts
│   │   │   │   └── useForkPlan.ts
│   │   │   └── components/
│   │   │       ├── PlanCard.tsx
│   │   │       ├── PlanDayEditor.tsx
│   │   │       └── PlanExerciseRow.tsx
│   │   ├── exercises/
│   │   │   ├── hooks/
│   │   │   │   ├── useExercises.ts
│   │   │   │   └── useExerciseBySlug.ts
│   │   │   └── components/
│   │   │       ├── ExerciseCard.tsx
│   │   │       ├── LottiePlayer.tsx
│   │   │       └── MuscleGroupFilter.tsx
│   │   ├── history/
│   │   ├── onboarding/
│   │   ├── settings/
│   │   └── pwa/
│   │       ├── InstallPrompt.tsx
│   │       ├── UpdateBanner.tsx
│   │       └── useOnlineStatus.ts
│   ├── ui/                     # 全域 UI primitives
│   │   ├── shadcn/             # shadcn/ui 複製源碼
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ... (依需要新增)
│   │   ├── feedback/
│   │   │   ├── Toast.tsx
│   │   │   └── ToastViewport.tsx
│   │   └── motion/
│   │       └── PageTransition.tsx
│   ├── stores/
│   │   ├── uiStore.ts
│   │   └── sessionStore.ts
│   ├── lib/
│   │   ├── core/
│   │   │   └── CoreProvider.tsx
│   │   ├── rxdb/
│   │   │   └── useRxQuery.ts
│   │   ├── router/
│   │   │   ├── guards.ts
│   │   │   └── routes.ts
│   │   ├── pwa/
│   │   │   └── preloadLottie.ts
│   │   ├── i18n/
│   │   │   └── setup.ts
│   │   ├── theme/
│   │   │   └── ThemeProvider.tsx
│   │   └── time/
│   │       └── formatDuration.ts
│   ├── locales/
│   │   └── zh-TW/
│   │       └── messages.po
│   └── styles/
│       └── globals.css
├── tests/
│   ├── unit/                   # Vitest + Testing Library
│   │   ├── stores/
│   │   ├── hooks/
│   │   └── ui/
│   └── e2e/                    # Playwright
│       ├── onboarding.spec.ts
│       ├── start-workout.spec.ts
│       ├── log-set.spec.ts
│       └── full-workout.spec.ts
└── README.md
```

### 4.2 `package.json`

```json
{
  "name": "@fitforge/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 4173",
    "lint": "eslint src",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "extract-i18n": "lingui extract",
    "compile-i18n": "lingui compile"
  },
  "dependencies": {
    "@fitforge/core": "workspace:*",
    "@hookform/resolvers": "^3.5.0",
    "@lingui/react": "^4.10.0",
    "framer-motion": "^11.0.0",
    "lottie-react": "^2.4.0",
    "lucide-react": "^0.378.0",
    "nanoid": "^5.0.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-hook-form": "^7.51.0",
    "react-router-dom": "^6.22.0",
    "rxdb": "^15.0.0",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@lingui/cli": "^4.10.0",
    "@lingui/vite-plugin": "^4.10.0",
    "@playwright/test": "^1.43.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^15.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "fake-indexeddb": "^5.0.0",
    "jsdom": "^24.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^1.5.0",
    "workbox-window": "^7.0.0"
  }
}
```

---

## 5. TypeScript 配置 (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "useDefineForClassFields": true
  }
}
```

`packages/core/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "lib": ["ES2022"],          // 注意：core 不含 DOM
    "types": ["node"]
  },
  "include": ["src", "tests"]
}
```

`packages/web/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vite-plugin-pwa/client"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "../core" }]
}
```

---

## 6. Tailwind 配置

`packages/web/tailwind.config.ts`：

```typescript
import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 從 Claude Design 提供的設計系統 token 抄入
        // 例如：
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... (見 20-claude-design-prompts.md §1 設計系統 prompt)
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
```

`src/styles/globals.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 220 13% 14%;
    --primary: 16 100% 60%;        /* FitForge orange */
    --primary-foreground: 0 0% 100%;
    /* ...其餘 token 由 Claude Design 設計系統 prompt 給出 */
    --radius: 0.75rem;
  }
  .dark {
    --background: 220 13% 9%;
    --foreground: 0 0% 98%;
    --primary: 16 100% 65%;
    --primary-foreground: 0 0% 100%;
    /* ... */
  }
}
```

---

## 7. ESLint 配置 (Monorepo Root)

`.eslintrc.cjs`：

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': ['warn', { 'newlines-between': 'always' }],
  },
  overrides: [
    {
      files: ['packages/core/**/*.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [{ group: ['react*'], message: 'core 不可依賴 React' }],
        }],
        'no-restricted-globals': ['error', 'window', 'document', 'navigator'],
      },
    },
  ],
};
```

---

## 8. Pre-commit Hooks (Husky + lint-staged)

`.husky/pre-commit`：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
pnpm lint-staged
```

`package.json` (root) 加 `lint-staged` 區塊：

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{md,json,yaml,yml}": ["prettier --write"]
}
```

---

## 9. 建立步驟 (從零)

> 給未來自己 (或 future maintainer) 的初始化清單。

```bash
# 1. 建 monorepo
mkdir fitforge && cd fitforge
pnpm init
echo "packages:\n  - \"packages/*\"" > pnpm-workspace.yaml

# 2. 共用工具
pnpm add -wD typescript prettier eslint husky lint-staged

# 3. core package
mkdir -p packages/core/src
cd packages/core
pnpm init  # 改 name 為 @fitforge/core、private: true
pnpm add nanoid rxdb rxjs zod date-fns
pnpm add -D fake-indexeddb vitest

# 4. web package
cd ../..
pnpm create vite packages/web --template react-ts
cd packages/web
pnpm add @fitforge/core@workspace:*
pnpm add react-router-dom zustand lottie-react ...  # 全部依賴 (見 §4.2)
pnpm add -D vite-plugin-pwa @playwright/test ...

# 5. 配置
# 拷貝 tsconfig.base.json、.eslintrc.cjs、tailwind.config.ts、vite.config.ts

# 6. 第一個 component & route + dev server 起來
pnpm dev
```

---

## 10. V2 預留結構

未來 (V2) 新增：

```
packages/
├── core/         # 不動
├── web/          # 不動 (或只增 features/)
└── native/       # 新增 React Native (Expo)
```

`packages/native` 會 `pnpm add @fitforge/core@workspace:*`、直接 import `WorkoutEngine` 等 — UI 重寫但業務邏輯 0 改動。

詳見 [12-roadmap-v2.md](./12-roadmap-v2.md)。

---

## 11. 下一步閱讀

- 想看每個技術為何選 → [03-tech-stack.md](./03-tech-stack.md)
- 想看 CI / 部署 → [11-testing-deployment.md](./11-testing-deployment.md)
- 想看 V2 怎麼演進 → [12-roadmap-v2.md](./12-roadmap-v2.md)
