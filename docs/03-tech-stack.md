# 03 — 技術選型與 ADRs (Tech Stack & Decision Records)

> 本檔對每項選擇給出「為什麼選它、考慮過什麼、換掉的代價」。**未列入的細節技術 (例如 ESLint 規則)** 屬於開發慣例、不算 ADR。

---

## 1. 一覽表 (Stack Overview)

| 層次         | 選擇                              | 版本       | ADR     |
| ------------ | --------------------------------- | ---------- | ------- |
| 構建工具     | Vite                              | ^5.0       | ADR-001 |
| 語言         | TypeScript                        | ^5.4       | ADR-011 |
| UI 框架      | React                             | ^18.2      | ADR-012 |
| 路由         | React Router                      | ^6.22      | ADR-001 |
| 樣式         | Tailwind CSS                      | ^3.4       | ADR-013 |
| UI primitives | shadcn/ui (源碼複製)             | latest     | ADR-013 |
| 狀態管理 (UI) | Zustand                          | ^4.5       | ADR-006 |
| 狀態管理 (資料) | RxDB hooks + RxJS              | RxDB ^15   | ADR-002 |
| 本地資料庫   | RxDB + Dexie storage              | ^15        | ADR-002 |
| 動畫         | lottie-react                      | ^2.4       | ADR-004 |
| Lucide 圖示  | lucide-react                      | ^0.378     | ADR-014 |
| 表單         | React Hook Form                   | ^7.51      | ADR-015 |
| 驗證         | Zod                               | ^3.23      | ADR-015 |
| PWA          | vite-plugin-pwa (內含 Workbox)    | ^0.20      | ADR-005 |
| i18n         | @lingui/react                     | ^4.10      | ADR-016 |
| 主題         | next-themes (適配 SPA 也可)       | ^0.3       | -       |
| 日期         | date-fns                          | ^3.6       | -       |
| ID 產生      | nanoid                            | ^5.0       | -       |
| Monorepo     | pnpm workspaces                   | pnpm ^9    | ADR-003 |
| 單元/整合測試 | Vitest + Testing Library          | ^1.5 / ^15 | -       |
| E2E 測試     | Playwright                        | ^1.43      | -       |
| Linter       | ESLint + typescript-eslint        | ^8 / ^7    | -       |
| Formatter    | Prettier                          | ^3.2       | -       |
| Git hooks    | Husky + lint-staged               | ^9 / ^15   | -       |
| 部署         | Vercel                            | -          | -       |

---

## 2. ADRs (Architecture Decision Records)

> 格式採輕量版：**Context → Decision → Consequences → Alternatives**。每個 ADR 一節。

---

### ADR-001 — Vite + React Router (不用 Next.js)

**Status**: Accepted (2026-05-14)

**Context**：
- V1 是 local-first PWA、零後端、無 SEO 需求 (產品內容是個人化的紀錄)、無公開頁面 (沒有部落格 / marketing 頁要 SSR)。
- 用戶安裝後 95% 流量是 PWA 啟動 (跳過 server)。
- 設計目標：構建快、配置簡單、PWA 整合無摩擦。

**Decision**：用 **Vite 5 + React Router 6 (Browser Router)**。

**Consequences**：
- ✅ Dev server 啟動 < 500ms、HMR 即時
- ✅ `vite-plugin-pwa` 是頭等公民、零摩擦
- ✅ 部署單一檔案夾 (`dist/`)，任何靜態 hosting 都能跑
- ✅ 純 client-side、`packages/core` 跨環境測試簡單
- ❌ 失去 SSR / SSG / RSC 能力 — 但 V1 不需要
- ❌ SEO 為 0 — 但這是 app 不是站，無所謂

**Alternatives Considered**：
- **Next.js (App Router)**：強 SSR / SEO / file-based routing；但 Local-first + RSC 概念衝突 (RSC 假設 server 為主、我們是 client 為主)、PWA 整合需要 dance、bundle 較大。
- **TanStack Start**：型別最強、新興；但 Q1 2026 還在 beta、生態小、賭性偏高。
- **Remix**：類似 Next.js 思維；同 Next.js 問題。

**Reversal Cost**：低。SPA 改 Next.js 主要是 routing 重寫 + SSR 配置；業務邏輯 (`packages/core`) 不受影響。

---

### ADR-002 — RxDB (而非 Dexie 裸用或 PouchDB)

**Status**: Accepted (2026-05-14)

**Context**：
- V1 純 local，但 **V2 必須加雲端同步** — 這是 SDD 已敲定的演進路徑。
- 不想 V2 改 schema 或 query API、不想自己寫 sync layer (太多邊界情況：衝突解決、增量同步、attachments)。
- 需要 reactive query — UI 訂閱資料變動自動更新、減少 store 同步 bugs。

**Decision**：用 **RxDB 15 + Dexie storage adapter**。V1 用 open-source 部分、V2 評估 Premium (replication 部分需要)。

**Consequences**：
- ✅ Reactive query 內建 — RxJS Observable、配 React hook 簡單
- ✅ Schema 用 JSON Schema 定義、有 migration 機制
- ✅ V2 加 `replicationCouchDB()` 或 `replicationGraphQL()` 即可同步
- ✅ 有 attachment 支援 — 未來 V2 體態照可用
- ❌ Bundle 重 — gzip 後約 50KB (RxDB core) + Dexie；比裸 Dexie 多一倍
- ❌ 學習曲線高於裸 Dexie — Observable 對新手不友善
- ❌ Premium replication adapter 部分功能要付費

**Alternatives Considered**：
- **裸 Dexie.js**：輕、社群大；但 V2 同步要自寫，工作量大且 bug 風險高。
- **PouchDB**：CouchDB 同步協議元祖；但維護減速、bundle 大、TypeScript 體驗差。
- **WatermelonDB**：原生為 RN 設計、Web 支援是 SQLite WASM；V1 走 Web 反而不如 RxDB 自然。
- **TinyBase**：很輕、reactive；但無內建同步、不適合 V2 路徑。
- **PowerSync**：強大、商業；過度殺雞用牛刀、超出個人專案需求。
- **Triplit / ElectricSQL**：實驗性、暫不採用。

**Reversal Cost**：中。換回 Dexie 主要是 Repository 層重寫 (RxQuery → IDB transaction)、Domain 不受影響。

---

### ADR-003 — Monorepo with `packages/core`

**Status**: Accepted (2026-05-14)

**Context**：
- V2 加 React Native — 同一份業務邏輯要兩端 (Web + Native) 跑。
- 若 V1 寫成「一個 Vite app」、V2 從 RN 角度看會發現「業務邏輯散在 React component / hooks 中」，無法直接搬。

**Decision**：用 **pnpm workspaces** 切兩個 package：
- `packages/core` — 純 TS、無 React、含 Domain Services、Repositories、Schemas、Ports
- `packages/web` — Vite + React + UI

V2 加 `packages/native` (RN)、共用 `packages/core`。

**Consequences**：
- ✅ 業務邏輯 100% V1/V2 共用、無重寫
- ✅ `packages/core` 可在 Node 環境跑單元測試 — 更快、更穩
- ✅ 強制隔離、避免 UI 與業務糾纏
- ❌ Monorepo 配置稍多 (pnpm workspace、tsconfig references、vite resolve.alias)
- ❌ 開發者要習慣「先想這支函式屬於哪個 package」

**Alternatives Considered**：
- **Single package**：簡單，但 V2 跨端共用業務邏輯困難。
- **npm/yarn workspaces**：pnpm 速度與 disk 友善大幅領先。
- **Nx / Turborepo**：殺雞用牛刀、個人專案 build cache 收益小。

**Reversal Cost**：低。Monorepo 拆回 single package 是 inverse refactor、可機械化執行。

---

### ADR-004 — Lottie 動畫 (而非 GIF、影片、3D)

**Status**: Accepted (2026-05-14) (使用者已選)

**Context**：見 [01-product-overview.md](./01-product-overview.md) §4.1.2、教學動畫是核心 UX。

**Decision**：用 **lottie-react** 載入 Lottie JSON 動畫。

**Consequences**：
- ✅ 檔案小 (10–80KB / 動畫、視覺等同 1MB GIF)
- ✅ 可離線 (預載入 Cache Storage、見 [08-pwa-offline.md](./08-pwa-offline.md))
- ✅ 解析度自適應、retina 顯示器銳利
- ✅ 風格可由 Claude Design 統一指導
- ❌ **內容取得困難**：沒有現成的健身動作 Lottie 套件
  - **緩解 A**：MVP 30 動作、由使用者透過 LottieFiles 採購 / 委外
  - **緩解 B**：暫時用佔位 (SVG + CSS 動畫)、發佈時換掉
  - **緩解 C**：用 Claude Design 出靜態插圖、設計師後製 Lottie
- ❌ 動畫師工時昂貴 — 個人專案壓力大

**Alternatives Considered**：
- **GIF**：檔案大、無法調速、跳格、視覺一致性低
- **MP4 影片**：檔案最大、離線壓力、可錄真實人但成本最高
- **靜態插圖 + 步驟箭頭**：最便宜、教學效果差
- **3D 模型 (model-viewer)**：cool 但 bundle 巨大、過度

**Reversal Cost**：低。`<LottiePlayer>` 組件抽出來、未來換 GIF 就是換組件實作。

---

### ADR-005 — PWA 完整 Offline + Installable

**Status**: Accepted (2026-05-14) (使用者已選)

**Context**：訓練場景常無網路、且這是作品集亮點。

**Decision**：**vite-plugin-pwa** + Workbox 預設配置：
- Precache: App Shell (HTML/JS/CSS/字型/icon)
- Runtime cache: Lottie JSON (StaleWhileRevalidate)
- Manifest: 完整含 maskable icons、shortcuts、`display: "standalone"`

**Consequences**：
- ✅ 安裝後可離線完整使用
- ✅ Lighthouse PWA score 可達 100
- ✅ iOS / Android 主畫面 icon、啟動畫面、無瀏覽器 UI
- ❌ Service Worker 更新策略要設計 — 否則用戶會看到「舊版」(緩解：`registerSW` 帶 `immediate` flag + UI 提示更新)
- ❌ Safari PWA 仍有限制 (例：無 push、可用存儲較小) — V1 不依賴這些功能

**Alternatives Considered**：
- **不做 PWA**：失去離線、失去安裝、失去作品集亮點
- **部分離線 (只 cache UI)**：訓練資料本就在 IndexedDB、實際上沒省什麼

**Reversal Cost**：極低。`vite-plugin-pwa` 是 Vite plugin、可隨時關閉。

---

### ADR-006 — Zustand 處理 UI 狀態、RxDB Hook 處理資料狀態

**Status**: Accepted (2026-05-14)

**Context**：
- UI 狀態 (theme、modal open、表單草稿) 與資料狀態 (plans、workouts) 本質不同：
  - UI 狀態：短暫、不持久、依賴 React 生命週期
  - 資料狀態：持久、跨頁、需 reactive query
- 一套 store 強行統一 = 痛苦 (Redux/RTK 的 RTK Query + slice 邊界混亂、複雜度 spike)。

**Decision**：
- **UI 狀態 → Zustand** (`uiStore`, `sessionStore` 等)。
- **資料狀態 → RxDB reactive query + 自寫 React hooks** (例如 `usePlan(id)` 內部呼叫 `RxQuery.$`)。

**Consequences**：
- ✅ 兩種狀態各得其所
- ✅ Zustand boilerplate 極少、TS 推斷好
- ✅ RxDB reactive query 自動觸發 React rerender、無需手動 invalidate
- ❌ 開發者要分得清楚「這個狀態算 UI 還是資料」
  - 緩解：給經驗法則 (見 [06-state-management.md](./06-state-management.md) §2)
- ❌ 雙 store 心智負擔比單 store 大

**Alternatives Considered**：
- **Redux Toolkit + RTK Query**：完整、生態大；但 boilerplate 多、與 RxDB 雙寫尷尬。
- **Jotai**：atom 設計優雅；但訓練 session 這種「狀態機」用 atom 表達囉嗦。
- **TanStack Query**：server-state 強；但 V1 沒 server、純 query 對 IndexedDB 是 overkill。
- **All in RxDB**：太多 UI 狀態硬塞 RxDB collection 就是過度。

**Reversal Cost**：中。Zustand → 其他 store 可逐 store 遷移。

---

### ADR-007 — AI 介面 V1 預留、V2 實作

**Status**: Accepted (2026-05-14) (使用者已選)

**Context**：見 [01-product-overview.md](./01-product-overview.md) §2.2、[10-ai-extension-points.md](./10-ai-extension-points.md)。

**Decision**：V1 在 `packages/core/src/ports` 定義 `AIPort` 介面、實作 `NoopAIAdapter`。Domain Service 在合適的位置調用 (例如 `usePlanRecommendation()` hook、V1 回傳 hard-coded 推薦) 為將來注入留位。

**Consequences**：
- ✅ V2 切換不需重構 — 換 adapter 即可
- ✅ Prompt template 早早設計、有時間 review
- ❌ V1 有些「死碼」(noop adapter 看似多餘) — 但這是預留成本、值得

**Alternatives Considered**：
- **V1 不預留**：V2 時要動 Domain 多處、痛苦
- **V1 就上 Claude API**：見 [01-product-overview.md](./01-product-overview.md) §2.2，沒有資料 grounding 的 AI 建議無價值

**Reversal Cost**：低。Port 介面薄、改變 signature 容易。

---

### ADR-008 — UI 設計透過 Claude Design 外包

**Status**: Accepted (2026-05-14) (使用者已選)

**Context**：開發者非設計師、自繪會花太多時間且品質不穩。

**Decision**：在 [20-claude-design-prompts.md](./20-claude-design-prompts.md) 提供：
- **§1 全域設計系統 prompt** — 顏色、字體、間距、語氣
- **§2-13 每個畫面 prompt** — 12 個主要畫面、可直接複製貼上 Claude Design
- **§14 Logo / icon prompt**

**Consequences**：
- ✅ 開發者只專注落地 (React + Tailwind + shadcn/ui)
- ✅ 設計風格在 SDD 中明文化、未來變動有跡可循
- ❌ Claude Design 輸出與 shadcn/ui 可能有風格差異 — prompt 明確要求對齊
- ❌ Lottie 動畫不能由 Claude Design 直接產出 (它輸出 HTML/CSS)、需另尋

**Alternatives Considered**：
- **Figma + 模板**：要學 Figma、模板難客製
- **自繪**：時間爆炸
- **抄競品**：法律灰、無原創

**Reversal Cost**：低。設計本就是迭代、之後改的版本疊上去。

---

### ADR-009 — 文案 i18n 抽 key、V1 只接 zh-TW

**Status**: Accepted (2026-05-14)

**Context**：V1 不做多語系、但 V2 / 海外野心存在。

**Decision**：所有用戶可見文案經 `t('namespace.key')` 取得、`@lingui/extract` 從源碼產出 `.po` 檔。V1 只有 `zh-TW.po`。

**Consequences**：
- ✅ V2 加 `en` 只是加一個 locale 檔
- ✅ 文案集中、後期 review / A/B 更方便
- ❌ 開發時要寫 `t('today.startWorkout')` 而非 inline 字串、稍煩

**Alternatives Considered**：
- **不抽 i18n**：V2 補要重構 — 後悔藥很苦
- **i18next**：與 Lingui 比、Lingui 在 Vite 編譯時提取、體驗較好
- **inline + sed 後補**：脆弱

**Reversal Cost**：低 — 增量。

---

### ADR-010 — 不做 Native、PWA 走 Web App Manifest

**Status**: Accepted (2026-05-14) (使用者已選)

**Context**：V1 個人專案、App Store 審核 + 維護成本不划算。

**Decision**：PWA 滿足 90% 原生體驗 (主畫面 icon、啟動畫面、離線、推送由 V2 評估)。V2 再考慮 React Native。

**Consequences**：
- ✅ 跳過 Apple / Google 審核
- ✅ 更新不卡審核、隨時推
- ❌ iOS PWA push 不支援 (V1 也不需要)
- ❌ App Store 曝光為 0 — V1 不需要曝光

**Alternatives Considered**：
- **Capacitor 包 PWA 上 App Store**：可行；但 V1 不必要

**Reversal Cost**：低。V2 RN 是另起 package、不影響 V1。

---

### ADR-011 — TypeScript Strict Mode

**Status**: Accepted

**Context**：個人專案、無 code review，型別是唯一外部 sanity check。

**Decision**：`tsconfig.json` 啟用 `"strict": true`、附加 `"noUncheckedIndexedAccess": true`、`"exactOptionalPropertyTypes": true`。

**Consequences**：
- ✅ 編譯時抓 90% 的 null/undefined 邊界 bug
- ❌ 寫起來稍煩 (例如要 narrow `undefined`)

---

### ADR-012 — React 18 (而非 Preact 或 Vue)

**Status**: Accepted

**Context**：UI 框架的選擇。

**Decision**：React 18。

**Consequences**：
- ✅ 生態最大、shadcn/ui 是 React、Claude Design 預設輸出 React
- ✅ Suspense + concurrent 模式對訓練 UI (avoid layout shift) 有用
- ❌ Bundle 比 Preact 大 ~20KB — 接受

---

### ADR-013 — Tailwind + shadcn/ui (而非 Mantine/MUI/Chakra)

**Status**: Accepted

**Context**：UI primitives 選擇。

**Decision**：Tailwind CSS + shadcn/ui (源碼複製、非 npm package)。

**Consequences**：
- ✅ 客製化最高 — shadcn 把組件複製到專案內、想改就改
- ✅ Tailwind class 一致性、零 runtime CSS
- ✅ Claude Design 對 Tailwind 友善
- ❌ 需自己維護組件版本 (但 shadcn 本就鼓勵這做法)

**Alternatives**：
- **Mantine** — 完整但難客製、bundle 重
- **MUI** — Material Design 風格固化、不想要
- **Chakra** — 不錯但 styled-system runtime 開銷
- **Radix UI 直接用**：shadcn 本就 wrap Radix、不重複輪子

---

### ADR-014 — Lucide React (圖示)

**Status**: Accepted

無爭議 — tree-shake、一致、shadcn 預設搭配。

---

### ADR-015 — React Hook Form + Zod

**Status**: Accepted

**Context**：自訂課表編輯器是 V1 最複雜的表單。

**Decision**：RHF (表單) + Zod (schema 驗證)。

**Consequences**：
- ✅ Zod schema 可同時用於：表單驗證、RxDB document 驗證、TS 型別推導 (`z.infer`)
- ✅ RHF 效能好 (uncontrolled by default)

---

### ADR-016 — @lingui/react (而非 i18next、react-intl)

**Status**: Accepted

**Context**：i18n 工具選擇。

**Decision**：Lingui。

**Consequences**：
- ✅ 編譯時 extract、不需執行時 fetch JSON
- ✅ Macro 寫法乾淨 (`<Trans>` 組件)
- ✅ Bundle 友善

---

## 3. 版本鎖定策略

- **`package.json` 用 `^` (caret)** — 接受 minor + patch 自動 upgrade
- **`pnpm-lock.yaml` 鎖死** — 真正部署的是這個
- **Renovate / Dependabot** PR-based 更新、每週 review
- **重大版本** (例如 React 19)：手動評估、開 issue 追

---

## 4. 已 reject 的方案

放這裡避免重複討論。

| 方案                  | 為什麼不採用                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| Next.js               | SSR/SSG 無用、PWA 整合摩擦、bundle 重                                     |
| Firebase              | NoSQL schema 痛、V2 RxDB 同步協議與 Firestore 不合                        |
| Supabase Auth/DB V1   | V1 無註冊需求、Auth 是 V2                                                 |
| Prisma                | Server-side ORM、V1 純 client                                             |
| Redux Toolkit         | Boilerplate、與 RxDB 雙重 source-of-truth                                 |
| Material UI           | Design system 太強硬、客製代價高                                          |
| GraphQL               | V1 無 server、過度                                                        |
| Styled-Components     | Runtime CSS、效能輸 Tailwind                                              |
| Capacitor / Cordova   | V1 PWA 已足夠、native wrapping 是 V2 RN 議題                              |
| WebAssembly SQLite    | 視 ADR-002 — RxDB + Dexie 已足                                            |

---

## 5. 下一步閱讀

- 想看資料模型細節 → [04-data-model.md](./04-data-model.md)
- 想看 Domain 邏輯怎麼設計 → [05-domain-logic.md](./05-domain-logic.md)
- 想看實際資料夾結構 → [09-monorepo-structure.md](./09-monorepo-structure.md)
