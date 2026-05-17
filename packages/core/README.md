# @fitforge/core

純 TypeScript 業務邏輯，**無 React、無 DOM 依賴**。可在 Node、Bun、瀏覽器、React Native 環境執行。

## 結構

```
src/
├── data/
│   ├── schemas/          # Zod schemas (single source of truth)
│   │   ├── tags.ts       # bodyPart / muscles 兩層 tag
│   │   ├── exercise.schema.ts
│   │   ├── plan.schema.ts
│   │   ├── workout.schema.ts
│   │   ├── settings.schema.ts
│   │   └── onboarding.schema.ts
│   ├── repositories/     # RxDB collection wrappers
│   ├── migrations/       # Schema version 進化
│   ├── seeds/            # 30 個動作 + 3 套預設課表
│   └── database.ts       # createDatabase()
├── domain/               # Domain Services
│   ├── errors.ts         # Result<T, E> + DomainError
│   ├── WorkoutEngine.ts
│   ├── PlanService.ts
│   ├── StatsService.ts
│   ├── ExerciseQueryService.ts
│   ├── WorkoutBuilderService.ts
│   ├── OnboardingService.ts
│   ├── SeedService.ts
│   ├── ExportService.ts
│   └── RestTimer.ts
├── ports/                # 與外部世界對話的介面
├── adapters/             # Port 的預設實作
├── container.ts          # createCore() 工廠
└── index.ts              # 對外公開 API
```

## 設計原則

詳見 [`docs/02-system-architecture.md`](../../docs/02-system-architecture.md) §1。

1. 業務邏輯與 UI 嚴格隔離
2. Local-first，雲端為將來的副本
3. 透過 Ports 注入時間 / ID / AI / Analytics
4. 不依賴 `window` / `document` / `react`

## 測試

```bash
pnpm --filter @fitforge/core test           # 一次
pnpm --filter @fitforge/core test:watch     # watch mode
pnpm --filter @fitforge/core test:coverage  # 含覆蓋率
```
