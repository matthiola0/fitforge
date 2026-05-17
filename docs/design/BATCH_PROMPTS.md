# Claude Design Batch Prompts

> 兩個 batch、每個一個新對話、可一次拿到 4-8 個畫面。
> 比 [`20-claude-design-prompts.md`](../20-claude-design-prompts.md) 的逐個 prompt 更省 token、保視覺一致。

---

## 🔧 每次新對話的 SOP

1. **新對話 → 附檔**：`docs/design/system/tokens.html` (必附)
2. **可選加附**：`docs/design/screens/08-today.html` + `15-workout-session.html` (傳達調性、最強 anchor)
3. **第一則訊息**：貼 [`PRIMER.md`](./PRIMER.md) 內 `===` 區段
4. **第二則訊息**：貼下方對應 batch
5. **收尾**：下載 5-8 個 artifact、放到 `docs/design/tmp/`、跟我說「做好了」

---

## 📦 Batch 1 — Onboarding (§3-§7)

5 個畫面、線性流程、共享 progress dots、調性一致是重點。

```
這份 batch 要產出 5 個畫面：FitForge Onboarding step 1 到 step 4、加上完成後的推薦課表頁。
全部用 mobile portrait 390×844、light + dark 並排預覽。
頂部 4 個 progress dot 標示當前步驟、第 5 個是完成後的 takeover「為你推薦」頁。

【共通結構】每頁
- StatusBar (假 iOS、僅 mockup)
- 頂部進度 dots (依步驟 active primary 色)
- 右上「跳過」link (只在 Step 1 顯示、之後改成「上一步」)
- 標題 (h1, 28px) + 副標 (muted body)
- 選項區
- 底部「下一步」滿寬 primary button、未選時 disabled

【Step 1 · 訓練目標】
- 標題：「想透過健身達到什麼？」
- 副標：「選一個最接近你的目標、之後可隨時調整」
- 4 個大型卡片 (垂直堆疊、滿寬、radius lg、20px padding、border + bg-card)
  - 💪 增肌「想長肌肉、線條明顯」
  - 🏋️ 增強力量「能舉更重、爆發力強」
  - 🌱 一般體適能「健康、有活力」
  - 🔥 減脂「體脂降低、看起來精實」
- selected: border-2 primary + bg-primary/5

【Step 2 · 訓練頻率】
- 標題：「一週能練幾次？」
- 副標：「不確定就選 3 — 入門最常見」
- 5 個圓角方形按鈕：2/3/4/5/6 (高 64px、數字 24px、tabular-nums)
- 數字下方小字註腳：「2:比較輕鬆 / 3:新手常見 ⭐ / 4:進階一點 / 5:有目標感 / 6:認真衝」

【Step 3 · 可用器材】
- 標題：「平常在哪訓練？」
- 副標：「我們會幫你選擇能做的動作」
- 2×2 grid 4 卡：
  - 🏠 在家無器材「自體重訓練」
  - 🏠 在家有啞鈴「啞鈴 + 自體重」
  - 🏋️ 健身房完整「槓鈴、機械、啞鈴」
  - 🤖 健身房只機械「只用機械訓練」

【Step 4 · 訓練經驗】
- 標題：「健身經驗如何？」
- 副標：「實話實說、會給你最適合的開始」
- 3 個垂直卡片：
  - 🌱 完全新手「從來沒練過 / 不滿 1 個月」
  - 🌿 練過一陣子「1-6 個月、知道幾個動作」
  - 🌳 有點經驗「6 個月以上、想優化訓練」
- 底部「完成」(取代「下一步」)

【Step 5 · 推薦課表 (完成 onboarding takeover)】
- 頂部 progress dots 全 filled、有 ✓ 標記
- 大標題：「為你推薦」(h1 28px)
- plan 名稱卡 (大): 「新手全身入門 A/B」
  - 3 chip：「6 週 / 每週 3 次 / 每次 45 分」
  - description (2-3 行)
  - 每日 focus 預覽：Day A: 全身 / Day B: 全身
  - bg-card + shadow-ds-md + radius xl
- accordion「為什麼推薦這個」(預設折疊)
  - ✓ 適合你的「新手 + 增肌」組合
  - ✓ 一週 3 次符合你的頻率
  - ✓ 需要的器材你都有
- 底部「開始這個課表」(主、橙紅) + 上方「自己選課表」(link、muted)

請輸出 10 個 mockup (每 step 2 個 = light + dark)、用 React JSX (CDN React、mock data 寫死)、
搭配自包含 HTML 預覽頁。
```

---

## 📦 Batch 2 — Workout Detail + Settings + Ad-hoc (§18 + §19 + §27)

3 個畫面、共享「list / form」基本 pattern、放一起風格容易一致。

```
這份 batch 要產出 3 個畫面：歷史單次訓練詳情、設定頁、自由訓練啟動頁。
全部 mobile portrait 390×844、light + dark 並排。

【§18 · 歷史單次訓練詳情 (WorkoutDetailPage)】
- read-only view、跟 §16 Summary 接近但無 PR 慶祝
- 頂部 PageHeader：← 返回 / 訓練名 / date subtitle / 右上 menu (•••)
- Hero 區：
  - 標題：plan day name (h2 22px)
  - 副標：完整日期 + 星期 + 時長
  - Stats 3-col：時長 / 總噸位 / 完成組數
- PR 區 (若該次有 PR、輕量版本、不 glow)：標題「達成 PR」+ 數字列表
- 動作 detail list：
  - 每個 exercise 卡片：
    - 名稱 / 肌群 chip
    - 完整 set table (column: 組 / 重量 / 次數 / RPE) — 用 mono / tabular-nums
    - 「對比上次」collapse 區：「上次 X kg × Y 次」+「進步 +5% / -1 rep」
- 底部 sticky bar：「重做這個訓練」outline button (從這 plan day 啟動新 workout)
- ✨ 兩個變體：with-PR / no-PR

【§19 · 設定頁 (SettingsPage)】
- iOS-style settings list、清楚就好、別花俏
- 頂部 ← 返回 / 設定
- 分區 (section header + rows)：
  - 「一般」
    - 主題 — value: 「跟隨系統」(point 右側 chevron、tap 開 sheet 切換 system/light/dark)
    - 重量單位 — value: 「kg」(toggle on tap → lb)
    - 預設組間休息 — value: 「90 秒」(tap 開 stepper sheet)
    - 訓練音效 — toggle switch
    - 震動回饋 — toggle switch
    - 語言 — value: 「繁體中文」(V1 disabled、grey)
  - 「資料」
    - 匯出資料 — chevron right (下載 JSON)
    - 匯入資料 — chevron right (檔案選擇)
    - 清除所有資料 — destructive red text、右側 chevron
  - 「關於」
    - 版本 — value: 「v1.0.0」grey
    - GitHub — external link icon
    - 隱私政策 — link
    - 致謝 — link
- 底部小字：「Made by [name] · 2026」置中 muted
- ✨ 兩個變體：light + dark

【§27 · 自由訓練啟動 (AdhocBuilderPage)】
- 兩步 stepper UI、頂部「1/2」「2/2」進度標
- Step 1：
  - 頂部 ← 返回
  - 標題「今天想練什麼？」+ 副標「可複選、之後可調」
  - 7 個 bodyPart chip multi-select (大、高 56px)：胸/背/肩/手臂/腿/核心/全身
  - selected: bg-primary + 勾 ✓ + scale 1.05
  - 底部「下一步」滿寬、未選 disabled
- Step 2：
  - 頂部 ← 回 Step 1 / 「2/2」
  - 已選部位 chip row（小、提醒）
  - 標題「想做幾個動作？」
  - 6 個圓角方按鈕橫向：3/4/5/6/7/8 (預設 5、tabular-nums)
  - 兩個 CTA 卡（垂直）：
    - **智慧推薦** (primary、突出、漸層 bg-primary subtle)
      - ✨ icon
      - 「依你選的部位、自動推薦 5 個動作」
      - 副字「(可以再調)」
    - **自己挑** (outline、次)
      - 📚 icon
      - 「進動作庫多選 5 個動作」
- ✨ 兩個變體 (各 step 1 + step 2)、light + dark

請輸出 8-10 個 mockup、用 React JSX + 自包含 HTML 預覽頁。
```

---

## 💡 跑完之後

- 都丟到 `docs/design/tmp/`
- 跟我說「§3-§7 + §18/§19/§27 都丟好了」
- 我會：分類整理 + 落地實作

## 一個對話塞太多會怎樣？

| 訊號 | 動作 |
|------|------|
| 顏色開始飄 (橙紅變鮮紅) | 開新對話、用「最小版 primer」 |
| 字級忽然跑 | 給具體錨：「H1 是 28px、不是 36」 |
| 突然出現 Material / iOS 字眼 | 開新對話、PRIMER 完整版重貼 |
| Claude Design 回應變慢 | 已超 7 個 artifact、開新對話 |

**Batch 1 (5 個 Onboarding) 預期 1 個對話內搞定** — 結構單純、共用 progress dots。
**Batch 2 (3 個 §18/§19/§27) 預期 1 個對話搞定** — 都是 list / form。
