# Design Outputs

存放從 [Claude Design](https://claude.ai/) 產出的設計稿原始檔案、以及 browse 驗證截圖。

> **這是參考來源、不是 production 資產**。實作 `packages/web` 時、會從這裡「抽」token / icon / 視覺 進 `src/`。

---

## 結構

```
docs/design/
├── system/                  ← §1 設計系統 (✅ 完成)
│   ├── tokens.html
│   ├── tokens-light.css
│   ├── tokens-dark.css
│   └── tailwind-extension.ts
├── logo/                    ← §2 Logo + App icons
│   └── 02-logo-preview.html (✅ Claude Design 預覽稿、SVG/PNG 待輸出)
└── screens/                 ← §3-§30 各畫面 mockup
    ├── 03-onboarding-goal.html               (✅)
    ├── 04-onboarding-frequency.html          (✅)
    ├── 05-onboarding-equipment.html          (✅)
    ├── 06-onboarding-experience.html         (✅)
    ├── 07-onboarding-recommendation.html     (✅)
    ├── 08-today.html / .jsx / .css           (✅ 含 JSX 落地參考)
    ├── 09-today-variants.html / .jsx         (✅)
    ├── 10-plans-list.html / .jsx             (✅)
    ├── 11-plan-detail.html / .jsx            (✅)
    ├── 12-plan-editor.html / .jsx            (✅)
    ├── 13-exercise-library.html / .jsx       (✅)
    ├── 14-exercise-detail.html / .jsx        (✅)
    ├── 15-workout-session.html / .jsx        (✅ ⭐ MVP 核心)
    ├── 16-workout-summary.html               (✅ HTML only)
    ├── 17-history.html                       (✅ HTML only)
    ├── 18-workout-detail.html                (✅ HTML only)
    ├── 19-settings.html                      (✅ HTML only)
    ├── 27-adhoc-builder.html                 (✅ HTML only)
    ├── 28-swap-add-sheet.html                (✅ HTML only — 解鎖 §15 加/換動作)
    └── verification/                          ← browse 驗證用截圖
        ├── today-no-active.png
        ├── today-with-active.png
        ├── today-dark.png
        ├── plans-stub.png
        └── pre-workout-stub.png
```

---

## 進度狀態表 (對應 [20-claude-design-prompts.md](../20-claude-design-prompts.md))

| §  | 畫面                       | HTML | JSX | 落地 | 備註                                            |
| -- | -------------------------- | ---- | --- | ---- | ----------------------------------------------- |
| 1  | 設計系統 tokens            | ✅    | -   | ✅    | tokens 已抽入 `packages/web/src/styles/globals.css` |
| 2  | Logo + Icons               | ✅    | -   | ⚠️    | 預覽稿就位、待輸出 SVG/PNG 進 `packages/web/public/icons/` |
| 3  | Onboarding · 訓練目標      | ✅    | -   | ⏳    | stub 在 `packages/web/src/app/stubs.tsx` |
| 4  | Onboarding · 訓練頻率      | ✅    | -   | ⏳    | 同上 |
| 5  | Onboarding · 可用器材      | ✅    | -   | ⏳    | 同上 |
| 6  | Onboarding · 訓練經驗      | ✅    | -   | ⏳    | 同上 |
| 7  | Onboarding · 推薦課表      | ✅    | -   | ⏳    | 同上 |
| 8  | Today (首頁)               | ✅    | ✅   | 🟡    | V1 骨架已寫、但 Claude Design 更精緻 (週節奏/最近訓練/動作探索)、待重做 |
| 9  | Today 變體 (無 plan / 進行中) | ✅    | ✅   | 🟡    | 同上 |
| 10 | PlansPage                  | ✅    | ✅   | ⏳    | stub |
| 11 | PlanDetailPage             | ✅    | ✅   | ⏳    | stub |
| 12 | PlanEditorPage             | ✅    | ✅   | ⏳    | stub |
| 13 | ExerciseLibraryPage        | ✅    | ✅   | ⏳    | 設計到位、待落地 |
| 14 | ExerciseDetailPage         | ✅    | ✅   | ⏳    | 設計到位、待落地 |
| 15 | WorkoutSessionPage ⭐      | ✅    | ✅   | ⏳    | **MVP 核心、優先落地** |
| 16 | WorkoutSummaryPage         | ✅    | -   | 🟡    | V1 簡版已實作、設計到位待升級 |
| 17 | HistoryPage                | ✅    | -   | ⏳    | 設計到位、待落地 (Today 已 reference) |
| 18 | WorkoutDetailPage          | ✅    | -   | ⏳    | 設計到位、待落地 |
| 19 | SettingsPage               | ✅    | -   | 🟡    | V1 簡版已實作、設計到位待升級 |
| 20 | Lottie 風格規範            | ❌    | -   | ⏳    | 給未來動畫師參考 |
| 21 | 安裝引導 Bottom Sheet      | ❌    | ❌   | ⏳    | 待跑 |
| 22 | Modal / Confirm 集合       | ❌    | ❌   | ⏳    | 待跑 |
| 23 | 空狀態 / Loading / Error patterns | ❌  | ❌ | ⏳ | 待跑 |
| 24 | Motion Spec                | ❌    | -   | ⏳    | 待跑 |
| 25 | 微互動範例                 | ❌    | -   | ⏳    | 待跑 |
| 26 | Pre-Workout Review         | ❌    | ❌   | ⏳    | stub |
| 27 | Ad-hoc Builder             | ✅    | -   | ⏳    | 設計到位、待落地（解鎖 Today 自由訓練入口）|
| 28 | Swap / Add Exercise Sheet  | ✅    | -   | ⏳    | 設計到位、落地後解鎖 §15「加一組/切換動作」 |
| 29 | Exercise Library multi-select | ❌ | ❌  | ⏳    | 待跑 |
| 30 | Today 變體 + ad-hoc 入口   | ❌    | ❌   | 🟡    | 已在 V1 骨架 Today 實作（自由訓練 row） |

**圖例**：✅ 完成 / ⚠️ 部分 / 🟡 已有 V1 簡版、待升級 / ⏳ 待做 / ❌ 未產出

---

## 工作流程

```
Claude Design 產出 (HTML + 可能 JSX)
       ↓
   存到 docs/design/files/ (你)
       ↓
   分類整理到 system / logo / screens/ (我)
       ↓
   review + 微調 (你)
       ↓
   落地時抽：
   ├─ tokens-*.css           → packages/web/src/styles/globals.css
   ├─ logo SVG / icon PNG    → packages/web/public/icons/
   ├─ JSX 視覺結構           → packages/web/src/app/{name}/{Name}Page.tsx
   ├─ HTML 區段樣式          → 同上
   └─ Mock 資料丟掉、改接 useCore() / useRxQuery()
```

**JSX 檔案是「視覺參考」、不直接用**：
- Claude Design 的 JSX 用 `const { useState } = React;` (CDN React)
- 內含 mock data (PLAN_TODAY, WEEK, RECENT 等)
- 沒接 RxDB / 沒接 router
- 我的工作：把視覺結構 / Tailwind class / 互動邏輯抽出來、套到 `packages/web/` 的真實組件

---

## 接下來建議路徑

1. **§2 logo → 輸出 SVG**：從 `logo/02-logo-preview.html` 取最佳版本、存成 `icon.svg`、用 [realfavicongenerator](https://realfavicongenerator.net/) 產 PNG 套件
2. **§8 Today 升級**：把 Claude Design 版本的 mini week calendar + 最近訓練卡片 + 探索動作落地進現有 TodayPage
3. **§10 PlansPage 落地**：用戶能在 UI 點 active plan、不必開 console
4. **跑 §13-§19 缺的 Claude Design**：把剩下的設計稿也一起補齊、之後一波落地
5. **§15 WorkoutSession** 是 MVP loop 的核心，**單獨優先做**

---

## 紀錄表

| 日期       | 操作               | 範圍                           |
| ---------- | ------------------ | ------------------------------ |
| 2026-05-16 | §1 設計系統就位    | tokens 抽入 web                |
| 2026-05-16 | §2-§12 一次性匯入  | 11 HTML + 5 JSX + 1 CSS        |
| 2026-05-17 | §13-§15 匯入       | 3 HTML + 3 JSX (含 MVP 核心)   |
| 2026-05-17 | §16/§17/§28 匯入   | 3 HTML (Summary 完整版 + History + Swap Sheet) |
