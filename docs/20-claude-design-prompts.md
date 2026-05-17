# 20 — Claude Design Prompts

> 本檔提供「**可直接複製貼上 Claude Design**」的提示詞。每個畫面一段、自包含 (含設計系統 reference)。建議流程：先用 §1 設計系統 prompt 跑一輪確認風格、之後每個畫面 prompt 自動沿用。

---

## 操作指南

1. **先跑 §1 設計系統 prompt** — 取得 colors / typography / tokens
2. **§2 Logo & App Icon** — 取得品牌資產
3. **§3-§15 每個畫面** — 順序不必嚴格、可挑緊急的先
4. 每份產出存到 `docs/design/{screen}.html` 或 `.png`、之後落地時參照
5. 若 Claude Design 出來與 SDD 規格不符、調整 prompt 中具體區段、重產

> **重要**：每個 prompt 都假定畫面是 mobile-first 375×812 (iPhone 14)、PWA 安裝後 standalone 模式。

---

## §1. 全域設計系統 (Run This First)

```
你是 FitForge 的首席設計師。FitForge 是一款健身入門 PWA，目標用戶是「想開始重訓但不知從何下手」的健身新手 (18-35 歲)。整體調性需要：專業但不嚇人、運動感但不雄性、簡潔但不冷漠。

請為這個產品設計完整的「設計系統 (Design System)」HTML 預覽頁，包含：

# 1. 品牌 Mood
- 一句話 mood：你會用三個形容詞 + 一個比喻來形容這個 app
- 三個視覺關鍵詞 (例：energetic, focused, encouraging)

# 2. Color Tokens (HSL + Hex 雙寫)
產出 light + dark 兩套 token，命名遵循 shadcn/ui 慣例：
- background, foreground
- card, card-foreground
- primary, primary-foreground (主品牌色 — 應該是有力量感、但不血腥的暖色系，建議橙紅或正紅)
- secondary, secondary-foreground
- accent, accent-foreground
- muted, muted-foreground
- destructive, destructive-foreground
- success (新增：完成組 / PR 慶祝)
- warning (新增：RPE 過高、組數警示)
- border, input, ring

每個 token 給出 Light/Dark 雙值、並展示在色塊中。

# 3. Typography
- 主字型：Inter (英文) + Noto Sans TC (中文)
- 標題層級：h1 (32) / h2 (24) / h3 (20) / h4 (18) / body (16) / small (14) / caption (12)
- 字重：500 (body) / 600 (h3-h4) / 700 (h1-h2)
- 行高：1.5 (body) / 1.2 (heading)
- 字距：標題 -0.02em
- 數字字體 (展示重量數字)：用 tabular-nums 等寬

展示「重量 80 kg × 10 reps」的數字字體樣式。

# 4. Spacing Scale
基於 4px：1/2/3/4/6/8/12/16/24

# 5. Radius
- sm: 6px / md: 10px / lg: 14px / xl: 20px
- 全域 --radius: 12px

# 6. Shadow
- sm (subtle card)
- md (hover state)
- lg (modal / sheet)
- glow (PR celebration、用 primary 色)

# 7. Iconography
- 採用 Lucide icons、線條圖示為主
- 圖示尺寸：16 / 20 / 24
- stroke-width: 2

# 8. Motion 語言
- 預設 ease: cubic-bezier(0.16, 1, 0.3, 1)
- 預設 duration: 200ms (小)、300ms (中)、500ms (大)
- 訓練動作完成 / PR：spring scale + glow
- 頁面切換：slide-in from right (iOS-like)

# 9. 語氣 (Voice & Tone)
寫 6 個範例：
- 標題口吻 (例：「準備好了嗎？」vs 「開始你的訓練」)
- 完成組的鼓勵 (例：「漂亮的一組」)
- 錯誤訊息 (例：「重量不能為負」)
- 空狀態 (例：「還沒有訓練紀錄、開始你的第一次吧」)
- PR 慶祝 (例：「新紀錄！」)
- 結束訓練確認 (例：「結束本次訓練？」)

中文口吻：直接、溫暖、像個友善但不油膩的私人教練。避免：「太棒了！」、「你超強！」、過度 emoji。

# 10. 元件樣本 (展示 Tailwind + shadcn/ui 對齊)
渲染這些元件的視覺：
- Button (default / primary / secondary / ghost / destructive / outline)
- Input (default / focused / error)
- Card (default with shadow)
- Badge (default / success / warning / outline)
- Dialog (modal preview)
- Toast (success / error / info)
- BottomNav (4 tabs: 今天/課表/動作/歷史)

輸出單頁 HTML、可作為 design tokens 完整 reference。使用 Tailwind CSS。要 light mode + dark mode 切換 toggle。
```

**用完這個 prompt、把產出的 color token 與 typography 抄入 `tailwind.config.ts` 與 `globals.css` (見 [09-monorepo-structure.md](./09-monorepo-structure.md) §6)。**

---

## §2. Logo + App Icon

```
為 FitForge (健身入門 PWA、目標用戶健身新手) 設計：

# 1. Logo (橫式)
- 圖標 + 文字並排
- 文字「FitForge」、Inter Display 字型、字重 700、字距 -0.02em
- 圖標：建議用「F + dumbell」融合、或抽象 forge (打造、鍛造) 隱喻、線條乾淨
- 主色用 primary (預期是橙紅、見 §1)
- 高度 32px

# 2. Logo (純圖標方形)
- 用於 favicon、small space
- 32 × 32 與 192 × 192 兩個尺寸
- 確保 16px 也清楚

# 3. App Icon (iOS / Android)
- 512 × 512 + 192 × 192
- iOS 風格：圓角 (iOS 自動處理、設計時直接方形)
- 內容置中、留 12% safe area 邊距
- 背景：純色 (建議 primary 色)
- 主圖：白色或對比色

# 4. Maskable Icon (Android)
- 512 × 512、內容置中
- 確保 80% 中心區是「主要視覺」、外圍 20% 可被裁切
- 帶 safe zone overlay 預覽圖

# 5. Apple Touch Icon
- 180 × 180、無圓角 (iOS 自動處理)

請輸出 SVG 源碼 + 各尺寸 PNG preview (HTML 中展示)。並附上「為何選這個視覺」的設計說明 (50 字內)。
```

---

## §3. Onboarding Step 1 — 訓練目標

```
為 FitForge 設計 onboarding 第 1 步：選擇訓練目標。

# Context
- mobile screen, 375 × 812
- 沿用 FitForge 設計系統 (見 §1) — 主色橙紅、Inter + Noto Sans TC
- shadcn/ui 風格、Tailwind class
- 整個 onboarding 共 4 步、本頁是第 1/4

# 內容
標題 (h1)：「想透過健身達到什麼？」
副標 (muted)：「選一個最接近你的目標、之後可隨時調整」

進度指示：頂部 4 個 dot、第 1 個是 primary 色 active、其他是 muted

4 個大型可點選卡片 (垂直堆疊、滿寬、24px 圓角)：
1. 💪 增肌 — 「想長肌肉、線條明顯」
2. 🏋️ 增強力量 — 「能舉更重、爆發力強」
3. 🌱 一般體適能 — 「健康、有活力」
4. 🔥 減脂 — 「體脂降低、看起來精實」

每個卡片：
- 左側 icon emoji 或 Lucide icon、64px 區塊
- 右側標題 + 描述
- 未選擇：bg-card + border
- hover/focused：scale 1.02 + shadow-md
- selected：border 2px primary + bg primary/5

底部：
- 「下一步」滿寬大 button、未選時 disabled、選後 primary
- 上方小字「跳過」link、置中、muted color

右上角小字 link「跳過」(也算可選)

# 互動細節
- 點卡片：selected 狀態切換 + 觸覺回饋示意
- 卡片之間 12px gap
- 底部 button 與卡片之間 32px

輸出 HTML + Tailwind。展示 light mode + dark mode 並排對照。
```

---

## §4. Onboarding Step 2 — 訓練頻率

```
為 FitForge onboarding 第 2 步：選擇訓練頻率。

# Context
延續 §3 設計系統。本頁是 2/4。進度 dots 第 2 個 active。

# 內容
標題 (h1)：「一週能練幾次？」
副標 (muted)：「不確定就選 3 — 入門最常見」

5 個按鈕橫向排列 (5 等寬、可換行)：2 / 3 / 4 / 5 / 6
- 64 × 64 圓形 / 圓角 16px、數字大字 24px、置中
- 未選：bg-secondary + foreground
- selected：bg-primary + primary-foreground、scale 1.05

每個按鈕下方小字註腳：
- "2": "比較輕鬆"
- "3": "新手常見 ⭐"
- "4": "進階一點"
- "5": "有目標感"
- "6": "認真衝"

底部「下一步」按鈕 + 上方「上一步」link。

輸出 HTML + Tailwind、Light/Dark 對照。
```

---

## §5. Onboarding Step 3 — 可用器材

```
為 FitForge onboarding 第 3 步：選擇可用器材。

# Context
延續設計系統。3/4。

# 內容
標題：「平常在哪訓練？」
副標 (muted)：「我們會幫你選擇能做的動作」

4 個卡片 (2 × 2 grid)：
1. 🏠 在家無器材 — 「自體重訓練」
2. 🏠 在家有啞鈴 — 「啞鈴 + 自體重」
3. 🏋️ 健身房完整 — 「槓鈴、機械、啞鈴」
4. 🤖 健身房只機械 — 「只用機械訓練」

每個卡片：方形比例 (1:1)、icon 在中上、標題在中、描述在下。
- 未選：bg-card
- selected：border-2 primary + bg-primary/5

底部「下一步」+ 上方「上一步」link。

輸出 HTML + Tailwind、Light/Dark 對照。
```

---

## §6. Onboarding Step 4 — 訓練經驗

```
為 FitForge onboarding 第 4 步：選擇訓練經驗。

# Context
延續設計系統。4/4。

# 內容
標題：「健身經驗如何？」
副標：「實話實說、會給你最適合的開始」

3 個卡片 (垂直堆疊滿寬)：
1. 🌱 完全新手 — 「從來沒練過 / 不滿 1 個月」
2. 🌿 練過一陣子 — 「1-6 個月、知道幾個動作」
3. 🌳 有點經驗 — 「6 個月以上、想優化訓練」

每個卡片：
- 左側植物 emoji (代表「成長階段」)
- 右側標題 + 描述
- 點 selected 樣式同 §3

底部「完成」按鈕 (取代「下一步」) + 上方「上一步」link。

輸出 HTML + Tailwind、Light/Dark。
```

---

## §7. Onboarding 推薦頁

```
為 FitForge 設計 onboarding 完成後的「推薦課表」頁面。

# Context
- 用戶剛完成 4 步、系統根據答案推薦一個 plan
- 設計系統見 §1

# 內容
頂部：
- 進度 dots 全部 filled、有個 ✓ 標記
- 標題 (h1)：「為你推薦」
- 大字 plan 名稱 (例：「新手全身入門 A/B」)、h2 字級

主視覺卡片 (大)：
- 上方：「6 週、每週 3 次、每次 45 分」三個 chip 並排
- 中間：plan description (3 句話、解釋這個 plan 為什麼適合你)
- 下方：每日 focus 預覽 (Day A: 全身、Day B: 全身)
- 卡片用 bg-card + shadow-md + radius lg

「為什麼推薦這個」展開區 (用 accordion)：
- 點開後顯示 bullet：
  - ✓ 適合你的「新手 + 增肌」組合
  - ✓ 一週 3 次符合你的頻率
  - ✓ 需要的器材你都有 (啞鈴 + 機械)

底部 CTA：
- 「開始這個課表」滿寬大 button、primary 色
- 「自己選課表」小 link、muted color、上方

輸出 HTML + Tailwind、Light/Dark。
```

---

## §8. Today Page (首頁)

```
為 FitForge 設計首頁 (今日 Today)。

# Context
- mobile 375 × 812、安裝後 standalone PWA
- 用戶已 onboarded、有 active plan
- 設計系統 §1
- 底部 BottomNav 4 tabs (今天/課表/動作/歷史)、今天 tab active

# 頂部 (Status Bar 下方)
左：問候 (依時段) — 「早安 ☀️」(15 字內)
右：頭像 icon (預設、可點進設定)

# 主視覺卡 (滿寬、大 padding、最重要)
「今天的訓練」標題 (h3)
- 大字 plan 名稱 + Day 標記 (例：「Day 1: 全身 A」)
- 4 個動作 chip 橫向 (例：「Squat 3×8、Bench 3×8、Row 3×8、Plank 3×30s」)
- 預估時長 「45 分鐘」、總組數 「12 組」
- 大型 CTA button「開始訓練 →」滿寬、primary

# 本週節奏
小標 (h4)：「本週節奏」
橫向 7 天 mini calendar：
- 週日到週六各 column
- 訓練過的日子：填 primary 色圓 + ✓
- 今天：border primary、empty
- 未來：muted、empty

# 最近 3 次訓練
小標：「最近訓練」
3 個小卡片橫向 (可滑動)：
- 日期 (相對：「昨天」「3 天前」「5 天前」)
- 訓練名稱
- 總時長、動作數
- 點進歷史詳情

# 探索動作 (引導)
小標：「探索更多動作」
3 個小 ExerciseCard 橫向 (可滑動)：
- Lottie 縮圖 (square)
- 中文名
- 主要肌群 chip
- 點進 ExerciseDetail

# 底部
BottomNav (滿寬、固定、bg-card + 上邊框 + safe-area-inset-bottom 補)：
- 今天 (active、icon + 文字 + primary 色)
- 課表
- 動作
- 歷史

輸出 HTML + Tailwind、Light/Dark 對照。
```

---

## §9. Today Page — 進行中 / 無 plan 變體

```
為 FitForge 首頁設計兩個額外狀態：

# 變體 A: 訓練進行中
主視覺卡改為：
- 標題：「訓練進行中」
- 副標：plan 名稱 + 「30 分鐘前開始」
- 進度條：5/12 組完成
- CTA：「繼續訓練 →」(primary)
- 次要 link：「放棄訓練」(muted small)

# 變體 B: 還沒選課表
主視覺卡改為：
- 大插圖 (空狀態、運動感的線條藝術)
- 標題：「還沒選課表？」
- 副標：「選一個課表、開始第一次訓練」
- CTA：「選擇課表 →」 (primary、導向 /plans)
- 次要 link：「先逛逛動作庫」

輸出兩個變體並排 HTML、Light/Dark。
```

---

## §10. Plans Page (課表列表)

```
為 FitForge 設計課表列表頁。

# Context
- 設計系統 §1
- 用戶可看到「我的自訂課表」(若有) 與「預設課表」(3 個內建)

# 內容
頂部 header：
- 標題「課表」(h1)
- 右上 + icon (新增空白課表)

「使用中」區 (若有 active)：
- 小標：「目前正在跑」+ active dot
- 1 個大卡片、滿寬、border-primary
- plan 名稱、frequency、進度 (本週 2/3)、「繼續」按鈕

「我的自訂課表」區 (若有)：
- 小標 + 數量
- 每個 plan 一張卡片：
  - 左：plan icon (基於 goalTag 變色)
  - 中：name、description (1 行 truncate)、frequency chip、focus chips
  - 右：箭頭 →
  - 滑動：刪除 action

「預設課表」區：
- 小標：「預設課表 (推薦給新手)」
- 3 個 plan 卡片：
  - 同上、加上 「⭐ 預設」徽章
  - 點進詳情

底部 BottomNav (課表 tab active)。

輸出 HTML + Tailwind、Light/Dark。
```

---

## §11. Plan Detail Page

```
為 FitForge 設計課表詳情頁。

# Context
- 用戶從 Plans list 點進來、看一個 plan 的完整結構
- 可能是預設 (不可編輯)、或自訂 (可編輯)
- 設計系統 §1

# 內容
頂部 header：
- ← 返回 icon
- 標題：plan name
- 右上 icon menu (更多選項：複製、刪除、匯出)

Hero 區：
- plan 完整 name + description (h1 + body)
- 三個 stat chip：
  - 「⏱ 每次 45 分」
  - 「📅 每週 3 次」
  - 「🎯 增肌」(goalTag)
- 「⭐ 預設」徽章 (若 isPreset)

每日 (Day) 區塊 (accordion 預設展開)：
- Day 1: 全身 A
  - 4 個 exercise row：
    - 左：縮圖 (Lottie 第一幀靜態)
    - 中：exercise name (中文 + 英文小字)、target sets×reps、rest seconds
    - 右：箭頭 →
  - 點 row 進入 ExerciseDetail
- Day 2: 全身 B (同上)

底部固定 action bar：
若 active：
- 「結束使用」outline button + 「編輯」(preset 則為「複製為自訂」) primary button
若非 active：
- 「設為使用中」primary button、滿寬

輸出 HTML + Tailwind、Light/Dark、預設與自訂兩個 variant 對照。
```

---

## §12. Plan Editor Page

```
為 FitForge 設計自訂課表編輯器頁 (V1 最複雜的表單)。

# Context
- 用戶在編輯一個自訂 plan
- 可改 name、description、days、exercises、sets/reps/rest
- 設計系統 §1
- 表單較長、用 sticky save bar

# 內容
頂部 header：
- ← 返回 (若 dirty 彈確認 modal)
- 標題：「編輯課表」
- 右上：「刪除」icon (danger 色)

主表單區 (滾動)：
- 「課表名稱」input
- 「課表描述」textarea (3 行)
- 「目標」select chip group (增肌/力量/體適能/減脂)
- 「每週訓練次數」number stepper

「訓練日」區：
- 每個 day 一張卡片 (展開):
  - Day 標題：「Day 1: 全身 A」(可編輯 inline)
  - 右側 icon：上下排序、刪除
  - 內含 exercise list：
    - 每個 exercise row (可拖拉重排):
      - 縮圖 + name
      - sets × reps、rest 編輯 (inline、stepper 風格)
      - 刪除 icon (右側)
    - row 末加「+ 新增動作」button (outline)
  - 「+ 新增訓練日」(底部、outline button)

底部 sticky bar：
- 「取消」outline button + 「儲存」primary button

點「+ 新增動作」開啟 bottom sheet：
- 標題：「選擇動作」
- 搜尋輸入
- 篩選 chip (肌群)
- ExerciseCard list (可滾動)
- 點 card 帶回前頁

輸出 HTML + Tailwind、Light/Dark。展示主編輯頁 + sheet 開啟狀態兩張。
```

---

## §13. Exercise Library Page

```
為 FitForge 設計動作圖庫頁。

# Context
- 顯示 30 個動作 (V1 MVP)
- 可搜尋、可篩選 (肌群/器材/難度)
- 設計系統 §1
- 底部 BottomNav: 動作 tab active

# 內容
頂部 header：
- 標題「動作圖庫」
- 右上：搜尋 icon、篩選 icon

Sticky 搜尋區 (滾動時 collapse 標題、保留搜尋)：
- 搜尋 input (中英文皆可、左側 search icon)
- Filter chips 橫向 (可滑動)：
  - 全部 / 胸 / 背 / 肩 / 腿 / 臀 / 核心 / 手臂
  - selected chip: bg-primary + primary-foreground
- 進階篩選 trigger (點開 sheet)

Grid (2 column on mobile)：
- 每個 ExerciseCard:
  - 上半：Lottie 縮圖 (1:1 比例、bg-muted、autoplay loop on hover/focus、靜態 first-frame 否則)
  - 下半：
    - 中文名 (h4)
    - 英文名 (caption muted)
    - 主要肌群 chip (max 2)
- 點卡片進 ExerciseDetail

Empty state (篩選無結果)：
- 居中插圖 + 「找不到動作」+ 「清除篩選」link

底部 BottomNav。

輸出 HTML + Tailwind、Light/Dark。
```

---

## §14. Exercise Detail Page

```
為 FitForge 設計動作詳情頁。

# Context
- 用戶在學一個動作
- 內容：Lottie 動畫、中英文名、肌群、器材、難度、步驟、提醒、常見錯誤
- 設計系統 §1
- 全畫面、底部 BottomNav 隱藏 (modal-style)

# 內容
頂部：
- ← 返回 (左)
- 動作名稱 (中文 + 英文小字)
- 收藏 icon (右、V2 啟用、V1 隱藏)

Hero (大 Lottie 區)：
- 滿寬、高度 280px
- bg-muted
- 中心大 Lottie 動畫 (autoplay loop)
- 底部播放控制 bar：暫停 / 慢速 (0.5x) / 一般 / 重播
- 右下小字：「動畫示範」

Tag 區 (橫向)：
- 「胸」「肩」「三頭」chip (muscle groups)
- 「槓鈴 + 臥推椅」chip (equipment)
- 「初級」chip (difficulty、依等級變色)

「動作說明」section：
- body text、2-3 句

「步驟」section (h3)：
- 數字列表 1, 2, 3, 4：
  - 每步驟 1-2 句
  - 數字用 primary 色圓圈

「💡 重點提醒」section (h3、icon 在前)：
- bullet list 3 點

「⚠️ 常見錯誤」section (h3、icon 在前)：
- bullet list 3 點、warning 色 left border

底部 spacing (24px)、無 button (因為這頁是 read-only)。

輸出 HTML + Tailwind、Light/Dark。
```

---

## §15. Workout Session Page ⭐ (最重要)

```
為 FitForge 設計訓練中的主畫面 — 這是 app 最高頻使用、最關鍵的 UI。

# Context
- 用戶正在做訓練、需要邊看動作邊輸入紀錄
- 預期使用情境：手機放在器材旁、手汗、訓練中分心、可能單手操作
- 設計目標：不分心、不誤觸、看得清、操作快
- 設計系統 §1
- BottomNav 隱藏 (防誤觸切頁)、Header 簡化

# 內容
頂部 header (slim、bg-card + border-bottom)：
- 左：訓練時長計時 (例：「00:24:13」、tabular-nums)
- 中：plan day name (例：「Day 1: 全身 A」、truncate)
- 右：「結束」按鈕 (text button、destructive 色)

主視覺區 (滿寬、佔約 60% 螢幕)：
- 動作名稱大字 (h2、中文 + 英文小)
- 「第 2 / 3 組」(h4、primary 色)
- 目標：「80kg × 8-10 下」(body、muted)
- 動作 Lottie 縮圖 (右側 small thumbnail、80×80、點放大)

輸入區 (大、易點)：
- 兩個大數字 stepper 並排:
  - 左：「重量 (kg)」、上下按鈕、中間 input、預設 80
  - 右：「次數」、上下按鈕、中間 input、預設 8
- 下方小：「RPE (1-10)」可選 chip 1-10、選中 primary

主要 CTA：
- 「完成這組」滿寬大 button (height 64px)、primary 色、shadow-md
- 觸覺與聲音回饋 (符合用戶 settings)

次要 actions (icon row、底部、間距大)：
- 跳過此組 (skip icon、small text)
- 加一組 (plus icon、small text)
- 切換動作 (list icon、small text)

# 倒數覆蓋層 (Rest Overlay) — 另一個狀態
組完成後、覆蓋輸入區：
- 半透明 backdrop (bg-background/95)
- 大字倒數「00:45」(80px、tabular-nums、primary 色)
- 副標：「下一組 80kg × 8-10」
- 上次回顧：「上次 80kg × 9 ✓」(small、muted)
- 兩個 button 橫向：「跳過」outline + 「+15 秒」outline
- 預設倒數結束自動消失、亦可點空白 dismiss

# 動作列表 (底部可折疊區)
- bottom sheet drag handle、可拖開
- 展開後顯示本次所有 exercise + 完成度 dots
- 點任一可切換 (重點：自由訓練順序、不強制 sequential)

# 螢幕鎖死 (Wake Lock active 指示)
- 右上角小 icon (subtle、muted)：🔓 防鎖屏

輸出 4 個狀態並排：
1. 主視覺 (剛開始一組)
2. 輸入中 (使用者打了重量、按下完成前)
3. 倒數中 (剛完成、休息中)
4. 動作列表展開

Light + Dark 各一份。
```

---

## §16. Workout Summary Page

```
為 FitForge 設計訓練結束的摘要頁 (成就感頁)。

# Context
- 訓練剛結束、用戶看數據與獎勵
- 設計系統 §1
- 應該感覺「完成感」、不雜亂

# 內容
頂部：
- 大標題 (h1)「訓練完成！」(置中、primary 色)
- 副標 (muted)：「[plan name] · [date] · [duration]」

主視覺數字 grid (3 column)：
- 「45:32」總時長 (label: 「時長」)
- 「4,250 kg」總噸位 (label: 「總噸位」)
- 「18 / 18」組數 (label: 「完成組數」)
- 每個 stat：大數字 (h2) + label (caption muted)

PR 慶祝區 (若有)：
- 黃色背景 / 漸層 + 動畫 sparkle 效果
- 標題 (h3)：「💪 新紀錄」
- 列出 PR：「Back Squat 100kg × 5」+ 對比上次

動作摘要 list：
- 每個 exercise 一張小卡片：
  - 名稱
  - 每組 weight × reps 表 (compact、tabular-nums)
  - 平均 RPE (若有)

底部 CTA：
- 「分享圖」outline button (V1：產 PNG 下載；V2：原生 share)
- 「回首頁」primary button、滿寬

輸出 HTML + Tailwind、含 PR 與不含 PR 兩種 variant。Light/Dark 對照。
```

---

## §17. History Page

```
為 FitForge 設計訓練歷史頁。

# Context
- 列出過去所有訓練紀錄、依時間倒序
- 設計系統 §1
- BottomNav: 歷史 tab active

# 內容
頂部 header：
- 標題「歷史」
- 右上：搜尋 icon、月曆 view 切換 icon

Stats bar (頂部 sticky)：
- 「本月訓練 8 次」大字 + 「+ 2 比上月」trend (success 色 ↑)
- 「總噸位 32,500 kg」
- 「總時長 6h 12m」

時間軸 (按月分組、sticky month header)：
- 「2026 年 5 月」(h3、sticky 在月份切換時)
- 每筆 workout 一個 row：
  - 左：日期大字 + 星期幾 (小)
  - 中：plan name + duration + sets count
  - 右：mini chart (本次總噸位的 visual bar、與該月平均比較)
- 點 row 進入 WorkoutDetail
- 滑動：刪除 action (destructive)

Empty state：
- 居中插圖 + 「還沒有訓練紀錄」+ 「開始第一次訓練 →」CTA

輸出 HTML + Tailwind、Light/Dark。
```

---

## §18. Workout Detail Page (history)

```
為 FitForge 設計歷史單次訓練的詳情頁 (read-only)。

# Context
- 設計系統 §1
- 比 Summary 多了「對比上次」資訊

# 內容
頂部：
- ← 返回
- 標題：「2026 年 5 月 14 日 · 週三」(date)
- 右上 menu：刪除、匯出

Hero 區：
- plan name (h2)
- 三個 stat：時長、總噸位、組數 (同 Summary 但 inline 一行)
- 「PR 達成 ✓ Back Squat」徽章 (若有)

動作 detail list：
- 每個 exercise 一個 section：
  - 名稱 + Lottie 縮圖
  - 完整 set table：
    - column: 組 / 重量 / 次數 / RPE
    - row: 1 / 80kg / 10 / 7
  - 對比區 (collapsable)：
    - 「上次此動作」weight × reps、時間
    - 「進步」+ 5% volume / + 5kg PR / -1 reps

底部：
- 「重做這個訓練」outline button (從這個 plan day 啟動新 workout)

輸出 HTML + Tailwind、Light/Dark。
```

---

## §19. Settings Page

```
為 FitForge 設計設定頁。

# Context
- 設計系統 §1
- 偏 utilitarian、清楚就好

# 內容
頂部 header：
- ← 返回 (若從 Today 點頭像進來)
- 標題「設定」

分區 list (用 shadcn/ui 風格的 row、icon + label + value + chevron)：

「一般」section：
- 主題 — value: 「跟隨系統」(點進 sheet 切換)
- 重量單位 — value: 「kg」(toggle)
- 預設組間休息 — value: 「90 秒」(stepper)
- 訓練音效 — toggle
- 震動回饋 — toggle
- 語言 — value: 「繁體中文」(V1 只顯示、未開放切換)

「資料」section：
- 匯出資料 — action row (跳一個 confirm + 觸發 download)
- 匯入資料 — action row (檔案選擇)
- 清除所有資料 — destructive row、紅色文字、二次確認 modal

「關於」section：
- 版本 — value: 「v1.0.0」
- GitHub — external link icon
- 隱私政策 — link
- 致謝 — link

底部小字：
「Made by [name] · 2026」(置中、muted)

輸出 HTML + Tailwind、Light/Dark。
```

---

## §20. Lottie 動畫風格 Guide

```
為 FitForge 設計 30 個健身動作的 Lottie 動畫「風格規範」(style guide)、給未來動畫師或 AI 動畫工具參考。

# Context
- 用戶看的動畫是教學用、不能太抽象、要看得出動作關鍵點
- 但也不要太擬真、保持插畫感、避免「真人錄影」的不一致與隱私問題
- 設計系統 §1 — 主色橙紅

# 風格規範
請提供：
1. 角色 style sheet：
   - 性別中性、無特定種族 (avoid 偏見)
   - 線條風格：粗細 stroke、扁平色塊 (有點像 Notion illustrations 那種)
   - 顏色：身體用 neutral 色、衣物用 primary 色點綴
   - 比例：稍微 Q 版 (頭身比 1:5)、不過度卡通

2. 環境 / 場景：
   - 純色背景 (bg-muted)、無雜物
   - 必要器材以線條表示 (槓鈴、啞鈴、bench)
   - 不畫健身房內裝、避免文化偏見

3. 動畫節奏：
   - 一個完整 rep 約 3-4 秒
   - loop 流暢、起始與結束點一致
   - 慢速可調 (0.5x、1x 切換不破畫)

4. 視角：
   - 大部分動作用「側面 45° 角」
   - 需區分左右動作 (例：弓步) 用 isometric
   - 確保「動作關鍵點」清楚 (例：squat 的膝蓋對齊腳尖)

5. 標註：
   - 動畫中可加 subtle 箭頭或紅點 highlight 動作軌跡
   - 不加文字 (因為 i18n、文字另外 overlay)

請輸出：
- 3 個範例動作的設計稿 (Squat、Bench Press、Plank) — 用 SVG keyframes 表達
- 一張 character + scene 的 style sheet
- 動畫時長與 file size 目標：每支 < 80KB、< 4 秒 loop

附：適合用 LottieFiles 採購的 keyword 建議列表。
```

---

## §21. 安裝引導 Bottom Sheet

```
為 FitForge 設計「安裝到主畫面」的引導 bottom sheet。

# Context
- 出現時機：用戶第 3 次訪問、且未 dismiss、且 PWA 可安裝
- 設計系統 §1

# 內容
Bottom sheet 從底部滑入：
- Drag handle (頂部)
- Hero icon (大 app icon 預覽、80×80)
- 標題 (h3)：「裝到主畫面、訓練時更快開」
- 副標 (body)：「離線可用、安裝後像 native app 一樣秒開」
- 兩個 bullet：
  - ✓ 訓練中可完全離線
  - ✓ 桌面 icon、不用每次找瀏覽器
- 主 CTA：「立即安裝」滿寬 primary button (Android：呼叫 beforeinstallprompt；iOS：跳 iOS 教學)
- 次要：「之後再說」text button、muted

# iOS 教學 variant
- 上述 CTA 改為圖文步驟：
  1. 點 [share icon] 分享按鈕
  2. 選「加到主畫面」
  3. 點「新增」
- 配 iOS 系統 UI 截圖示意 (用插圖)

輸出 HTML + Tailwind、Light/Dark、Android + iOS 兩個 variant。
```

---

## §22. Modal / Confirm Dialogs

```
為 FitForge 設計 confirm dialog 集合：

# 1. 結束訓練 confirm
- 標題：「結束本次訓練？」
- 內容：「已紀錄的組會保留、未完成的組會丟失」
- 按鈕：「取消」outline + 「結束訓練」primary destructive

# 2. 放棄訓練 confirm
- 標題：「放棄這次訓練？」
- 內容：「未完成的訓練會被刪除、無法恢復」
- 按鈕：「繼續訓練」outline + 「放棄」destructive

# 3. 清除所有資料 confirm
- 標題：「清除所有資料？」
- 內容 (粗體強調)：「此動作不可復原。所有訓練紀錄、自訂課表、設定都會永久刪除。」
- 二次確認：要在 input 輸入「我要清除」才能 enable 按鈕
- 按鈕：「取消」outline + 「永久清除」destructive (disabled until typed)

# 4. 離開未儲存編輯 confirm
- 標題：「未儲存的變更會丟失」
- 內容：「確定要離開嗎？」
- 按鈕：「繼續編輯」outline + 「不儲存離開」destructive + 「儲存並離開」primary

# 5. 更新可用 banner (非 modal、頂部 banner)
- 文字：「有新版本可用」
- 按鈕：「立即更新」text button

# 6. 安裝成功 toast
- ✓ icon + 「FitForge 已安裝到主畫面」
- 自動 dismiss 3 秒

輸出 6 個並排 HTML、Light/Dark 對照。
```

---

## §23. 空狀態 + 載入狀態 + 錯誤狀態 Patterns

```
為 FitForge 設計三種「非快樂路徑」狀態 pattern：

# 1. 空狀態 (Empty State)
通用模板：
- 居中插圖 (lineart 風、單色、約 200×200)
- 標題 (h3)
- 副標 (body, muted)
- 主 CTA (primary button)

請設計這幾個具體案例的視覺：
- 「還沒有訓練紀錄」+ 「開始第一次訓練」
- 「篩選找不到動作」+ 「清除篩選」
- 「還沒選課表」+ 「去選課表」
- 「還沒自訂課表」+ 「+ 新增空白課表」

# 2. 載入狀態 (Loading)
- 動作圖庫：skeleton grid (2×3 灰色方塊 + shimmer)
- 訓練紀錄：skeleton row list
- 動作詳情：skeleton hero + 段落
- Onboarding 推薦：loading spinner (1-2 秒最大)、文字「分析中...」

# 3. 錯誤狀態 (Error)
- 通用：⚠️ icon + 「發生錯誤」+ 「重試」button
- 離線 (V1 罕見、但保險)：「需要網路連線」+ 「重新整理」
- 找不到 (404)：「找不到此頁面」+ 「回首頁」

每個都要 light + dark 對照。

輸出單頁 HTML 含所有 pattern、用 grid 排列展示。
```

---

## §24. 動效規格 (Motion Spec)

```
為 FitForge 撰寫動效規格 (motion spec)、用於 framer-motion 落地時參照。

# 規格範圍
列出 V1 所有動效、含 prop:

# 頁面切換
- 進入：translateX 100% → 0、duration 250ms、ease custom
- 退出：translateX 0 → -20%、opacity 1 → 0、duration 200ms

# Modal / Sheet
- 進入：translateY 100% → 0、duration 300ms、spring (stiffness 300, damping 30)
- 退出：translateY 0 → 100%、duration 200ms

# Toast
- 進入：translateY -100% → 0 + opacity 0 → 1、duration 200ms
- 退出：opacity 1 → 0、duration 150ms
- 自動 dismiss：3000ms (info)、5000ms (error)

# 完成組動畫
- Button click → 縮放 1 → 0.95 → 1、duration 200ms
- 「完成」狀態：背景 primary → success、duration 300ms
- Rest overlay 進入：opacity 0 → 1 + 數字 scale 0.8 → 1、duration 400ms spring

# PR 慶祝
- Hero scale 1 → 1.05 → 1、duration 600ms、bounce 2 次
- Sparkle particles (3-5 個)、隨機位置、scale + fade out

# Lottie 控制
- 預設 1x speed
- 慢速 0.5x: smooth tween 200ms

# 鍵盤輸入 number stepper
- 點 +/- 按鈕：scale 0.9 一瞬間、duration 100ms
- 數字變化：fade transition、duration 150ms

請輸出整理好的表格 + 範例 framer-motion `<motion.div>` 程式碼片段。
```

---

## §25. 微互動範例 (Micro-interactions)

```
為 FitForge 設計 5 個關鍵微互動：

1. **「完成這組」按鈕點擊**
   - 按下：scale 0.95 + 觸覺 medium
   - 鬆開：scale 1 + ripple 從中心向外 (primary 色 30% opacity)
   - 完成：背景 primary → success、+ ✓ icon fade in、+ 觸覺 success
   - 200ms 後切換到 rest overlay

2. **PR 達成**
   - 倒數結束、若該組 PR：
   - 大「PR!」字 fade in + 跳動 2 次
   - 環繞 sparkle 粒子向外擴散
   - 觸覺：success heavy

3. **Onboarding 卡片選擇**
   - 點選：scale 1.02 + border primary fade in
   - 切換其他：原本 fade out、新的 fade in

4. **Bottom Nav 切換**
   - 切換 tab：active icon 微微 bounce + label 顏色變化 200ms
   - inactive icon 顏色變 muted

5. **Lottie 縮圖 hover** (desktop)
   - hover: scale 1.05 + 播放 Lottie
   - leave: 回到 first frame static

輸出 SVG / Lottie / GIF 示範 (HTML 展示) 並附 framer-motion 程式碼。
```

---

## §26. Pre-Workout Review Page (新增)

```
為 FitForge 設計「Pre-Workout Review」頁面 — 從 Plan 啟動訓練前的「菜單預覽 + 微調」頁。

# Context
- mobile 375 × 812
- 設計系統 §1
- 用戶剛從 Today 點「開始訓練」、進入這頁
- 預期 80% 用戶直接點「開始訓練」就走、20% 會微調
- 對新手友善：進階操作預設折疊

# 內容
頂部 header (slim)：
- ← 返回 (回 Today)
- 標題 (h3)：「準備開始：Day 1 全身 A」
- 副標 (caption muted)：「新手全身入門 A/B」

預估摘要 (頂部 chip row)：
- ⏱ 預估 45 分
- 💪 5 個動作
- 🎯 主練 (chips: 胸 / 背 / 腿)

「微調菜單」toggle (segmented control)：
- 兩個分段：「快速開始」(預設、selected) / 「微調菜單」
- 切到「微調菜單」才顯示每個動作的 swap/remove icon
- 新手不點 toggle、UI 看起來就像簡單預覽

動作列表 (核心)：
- 每個 item card：
  - 左：Lottie 縮圖 (1:1, 64×64)
  - 中上：動作中文名 (h4) + 英文名 (caption muted)
  - 中下：bodyPart chip + muscles chip (主肌群、最多 2 個)
  - 中底：3 × 8-12, 90 秒 (細字)
  - 右：依「微調菜單」模式顯示：
    - 模式 OFF (預設)：只顯示 → 箭頭 (點進 Exercise Detail 看示範)
    - 模式 ON：🔄 (換) + ❌ (移除) + ↕️ (拖把手)
- 「不可換的動作」(例：Deadlift) 用 🔒 icon 取代 swap icon、tooltip 「核心動作、建議照計劃」

新增動作 row (列表底部、虛線 border)：
- 只在「微調菜單」模式 ON 時顯示
- 「+ 新增動作」滿寬、灰色 bg
- 點開啟 Add Sheet

底部 sticky bar (滿寬、上邊框)：
- 「取消」outline (回 Today)
- 「開始訓練 →」primary、大、滿寬

# 互動細節
- 拖拉重排時、其他 item 微微滑開
- 點 ❌ 後顯示「該動作將被移除」的 inline confirm (右側按鈕：取消 / 確認)
- 點 🔄 → 打開 Swap Sheet (見 §28)

請輸出：
1. 「快速開始」狀態 (預設、無 swap/remove icons)
2. 「微調菜單」狀態 (顯示 swap/remove icons)
3. Swap 確認 inline state
4. 拖拉中間 state (item 跟著手指、其他撥開)

Light + Dark 對照。
```

---

## §27. Ad-hoc Workout Builder Page (新增)

```
為 FitForge 設計「自由訓練」啟動頁 — 用戶沒跟 Plan、想自己組今天訓練菜單時。

# Context
- mobile 375 × 812
- 設計系統 §1
- 是 Today 頁面的次要入口 (按鈕)、不在底部 nav

# 整體流程
兩個 step、用 stepper 顯示：
- Step 1: 選目標部位
- Step 2: 選動作數 + 推薦方式

# Step 1 (預設顯示)
頂部 header：
- ← 返回 (回 Today)
- 進度：「1 / 2」(右上)

標題 (h1)：「今天想練什麼？」
副標 (muted)：「可複選、之後可調」

7 個大型 bodyPart chip (multi-select)、wrap 換行：
- 胸 / 背 / 肩 / 手臂 / 腿 / 核心 / 全身
- 每個 chip 高度 56px、padding 大、字級 18px
- 未選：bg-secondary + foreground
- selected：bg-primary + primary-foreground、scale 1.05、勾選 ✓

底部「下一步 →」滿寬 button、未選時 disabled。

# Step 2 (滑入)
頂部進度：「2 / 2」
左上「←」(回 Step 1)

「已選部位」chip row (small、上方、提醒選了什麼)：
- 「肩」「手臂」「全身」(用戶 Step 1 選的)

標題：「想做幾個動作？」
副標 (muted)：「依推薦範圍、可以再調」

Stepper 排成橫向：3 / 4 / 5 / 6 / 7 / 8
- 圓角方形 button、64×64、置中數字 24px
- 預設 5、selected：bg-primary
- 未選：bg-secondary

兩個 CTA 卡片 (垂直堆疊)：

**卡片 A：智慧推薦** (primary、突出)
- 大 ✨ icon (左上)
- 標題 (h3)：「智慧推薦」
- 描述：「依你選的部位、自動推薦 5 個動作 (可以調整)」
- 右下箭頭 →
- bg gradient (primary subtle)

**卡片 B：自己挑** (outline、次要)
- 大 📚 icon (左上)
- 標題 (h3)：「自己挑」
- 描述：「進動作庫多選 5 個動作」
- 右下箭頭 →

請輸出：
1. Step 1 (未選任何)
2. Step 1 (已選 2 個 bodyPart)
3. Step 2 (預設 5 個動作、兩個 CTA 卡片)

Light + Dark 對照。
```

---

## §28. Swap / Add Exercise Bottom Sheet (新增)

```
為 FitForge 設計訓練中 / Pre-Workout 共用的「替換動作」與「新增動作」bottom sheet。

# Context
- 從 mobile 螢幕底部滑入、佔 80% 高度、上方半透明 backdrop
- 設計系統 §1
- 兩個用途、UI 接近 (重用組件)

# 28.a — Swap Sheet
觸發：用戶點某動作的 🔄 icon。

頂部：
- drag handle (置中、small)
- 標題 (h3)：「替換 [側平舉]」
- 副標 (muted)：「相同主肌群的其他選擇」
- 動作的 muscles chip row (例：「中三角」)

「結果」list (滾動)：
- 每 item card (橫向 row、密集)：
  - 左：Lottie 縮圖 1:1, 48×48
  - 中：name (中文) + 英文小字、muscles chip
  - 中下：器材 chip (例：「啞鈴」)
  - 右：→ 箭頭

底部 sticky：
- 「自己挑 (進動作庫)」link button (置中、small)、進 ExerciseLibrary 單選模式
- 空狀態 (若 Tier 1 無結果)：插圖 + 「沒有相同主肌群的動作」+ 「放寬到同部位」button

# 28.b — Add Sheet
觸發：用戶點 PreWorkout 列表底 + 或 Session 中加動作。

頂部：
- drag handle
- 標題 (h3)：「新增動作」
- Tabs 三個 (segmented control)：
  - 「依部位」(selected)
  - 「依肌群」
  - 「搜尋」

**Tab: 依部位**
- 7 個 bodyPart chip (single-select)
- 選後下方 list 顯示對應動作

**Tab: 依肌群**
- 21 個 muscles chip、用 bodyPart group header 分組 (collapsible)
- 例：
  - 肩 (展開)：前三角 / 中三角 / 後三角
  - 胸 (展開)：上胸 / 中胸 / 下胸
- 選後下方 list 顯示對應動作

**Tab: 搜尋**
- 搜尋 input (focus 自動)
- 結果 list 即時 filter

「結果 list」(每個 tab 共用)：
- 同 28.a 的 item card 樣式
- 點 item → 切換到「設定組數」二級 sheet

**設定組數二級 sheet** (從 Add Sheet 內部往上推):
- 標題：「[Bench Press] 怎麼做？」
- 三個 stepper 並排：
  - 組數：3 / 4 / 5 (預設 3)
  - 次數：「8 - 12」(min-max range)
  - 休息：「90 秒」(預設依 difficulty)
- 底部 「加入」 primary button + 「取消」outline

# 通用設計
- 半透明 backdrop (bg-background/95)、點關閉
- 滑下 dismiss
- 鍵盤 escape dismiss

請輸出：
1. Swap Sheet (有 6 個結果)
2. Swap Sheet (空狀態)
3. Add Sheet - 依部位 tab (選了「肩」、顯示 3 個動作)
4. Add Sheet - 依肌群 tab (展開「肩」、顯示 3 個 muscle chip)
5. 設定組數二級 sheet

Light + Dark 對照。
```

---

## §29. Exercise Library — Multi-select 模式 (補充 §13)

```
為 FitForge 動作圖庫加上「多選模式」— 從 Ad-hoc Builder 「自己挑」按鈕進來時、用戶要選 N 個動作。

# Context
- 與 §13 ExerciseLibrary 同畫面、但進入時帶 ?mode=multi&target=5 query
- 設計系統 §1

# 差異點
**頂部 header 變化**：
- 標題改為：「選擇 5 個動作 (1 / 5)」
- 副標：「至少選 [N] 個、可超過」
- 右上「取消」link (回 Ad-hoc Builder Step 2)

**Card 變化**：
- 每個 ExerciseCard 右上加 checkbox circle
- 未選：empty circle border
- selected：bg-primary + ✓ 圖示
- 整 card 點擊切換選中 (而非進 detail)
- 進 detail 改為 long-press / 左下 「i」icon

**Sticky 底部 bar** (滿寬、上邊框、bg-card)：
- 左：「已選 3 / 5」+ avatars (mini 縮圖排排)
- 右：「下一步 →」primary、disabled until count >= target

# 互動
- 點 card 切換 selected、有 haptic feedback
- 進度條 (頂部 thin) 顯示已選達標 %
- 達標時底部 bar 變色 (bg-primary 漸層) 鼓勵繼續或下一步

請輸出：
1. 多選模式進入 (未選)
2. 已選 3 / 5 中
3. 已選 5 / 5 達標
4. 已選 7 / 5 超過 (允許、表示彈性)

Light + Dark 對照。
```

---

## §30. Today Page 變體 — 「自由訓練入口」與 ad-hoc 紀錄展示

```
為 FitForge Today 頁面加上「自由訓練」入口與 ad-hoc 訓練的紀錄展示。

# Context
- 設計系統 §1
- 與 §8 同畫面、增加兩個區塊

# 新增 1：自由訓練入口
位於今日訓練卡之下、本週節奏之上：
- 整列高度 80px、bg-card、radius lg
- 左側 shuffle icon (24×24、primary 色)
- 右側 chevron →
- 主文 (body)：「自由訓練」
- 副文 (caption muted)：「沒在跑課表？選個部位、隨意練」
- 點擊整列導向 `/workout/adhoc`

# 新增 2：最近訓練 — ad-hoc 標記
在最近 3 次訓練卡片中：
- 若 workout.mode === 'ad_hoc'：左上加「自由」small chip (outline、muted)
- 若 workout.mode === 'from_plan'：不顯示 chip (預設)
- 卡片其他內容相同

請輸出：完整 Today 頁面 (有 active plan + 含自由訓練入口 + 最近訓練含 ad-hoc 標記)。Light + Dark 對照。
```

---

## 後記與使用建議

### 用法順序
1. **第 1 週**：跑 §1 + §2 (設計系統 + Logo)、確定整體風格後再進其他畫面
2. **第 2 週**：跑 §15 (WorkoutSession) + §8 (Today) — 最關鍵頁面先
3. **第 3 週**：把 onboarding (§3-§7) 跑完
4. **之後**：依需要跑其他

### 落地慣例
- Claude Design 給的 HTML/CSS、轉成 React + Tailwind 時：
  - 把 inline class 拆成 shadcn/ui 組件 (`<Button variant="primary">`)
  - 把 color hex 換成 CSS variable (`hsl(var(--primary))`)
  - 把固定文字抽 i18n key (`<Trans id="today.startWorkout">開始訓練</Trans>`)
- 落地過程中若 design 與 SDD 規格衝突、優先 SDD、回頭調 prompt

### 風格一致性 tips
- 每個 prompt 都先寫「沿用 §1 設計系統」、Claude Design 才會用對 token
- 如果連續產出開始 drift、回頭跑 §1 + 該畫面 prompt 一起 (給更強的 context)

### Lottie 來源
- 採購：LottieFiles ($5-20 / 動畫)
- 自製：After Effects + Bodymovin 外掛 (有學習曲線)
- AI 工具：Recraft、Krea、可控性與一致性有限
- 暫時佔位：自寫 SVG + CSS animation (能跑就好)

---

## 與 SDD 對齊

| 本檔節數 | 對應 SDD |
| -------- | -------- |
| §1 (Design System) | [02 §5.6 Theming](./02-system-architecture.md) / [09 §6 Tailwind 配置](./09-monorepo-structure.md) |
| §3-§7 (Onboarding) | [07 §3.1-3.5](./07-screen-flow.md) |
| §8-§9 (Today) | [07 §3.6](./07-screen-flow.md) |
| §10-§12 (Plans) | [07 §3.7-3.9](./07-screen-flow.md) |
| §13-§14 (Exercises) | [07 §3.10-3.11](./07-screen-flow.md) |
| §15-§16 (Workout) | [07 §3.12-3.13](./07-screen-flow.md) |
| §17-§18 (History) | [07 §3.14-3.15](./07-screen-flow.md) |
| §19 (Settings) | [07 §3.16](./07-screen-flow.md) |
| §20 (Lottie) | [08 §4 預載](./08-pwa-offline.md) |
| §21 (Install) | [08 §6](./08-pwa-offline.md) |
| **§26 (Pre-Workout Review)** | [07 §3.11a](./07-screen-flow.md) — 新增 |
| **§27 (Ad-hoc Builder)** | [07 §3.11b](./07-screen-flow.md) — 新增 |
| **§28 (Swap / Add Sheet)** | [07 §3.20](./07-screen-flow.md) — 新增 |
| **§29 (Exercise Library Multi-select)** | [07 §3.10 + Ad-hoc 流程](./07-screen-flow.md) |
| **§30 (Today 自由訓練入口)** | [07 §3.6 變體](./07-screen-flow.md) |

---

**End of Claude Design Prompts**
