# FitForge — Claude Design 風格定錨 (Style Primer)

> **每個新對話的開頭、貼這份 + 附 `tokens.html`**。
> 不貼就會風格漂移（顏色稍偏、字級跑、組件命名亂、語氣不一致）。

---

## 📎 操作步驟

1. **新對話開頭附檔**：[`docs/design/system/tokens.html`](./system/tokens.html)（讓 Claude Design 視覺上看到設計系統）
2. **貼下面這整段做為第一條訊息**（含 `===` 內全部內容）
3. **第二條訊息**再貼具體畫面 prompt（從 [`20-claude-design-prompts.md`](../20-claude-design-prompts.md) 挑）

---

## 📋 風格定錨（複製貼上用）

```
===
你正在為 FitForge 設計 UI — 一個面向健身新手的離線可用 PWA。
我已附上 tokens.html。所有後續設計都必須完全使用該檔的 design tokens、
不要自己重新發明顏色 / 字級 / 間距 / 圓角。

【品牌 Mood（記住、別跑掉）】
- 三個形容詞：堅定 Resolute · 溫暖 Warm · 鼓舞 Encouraging
- 一句話：像剛認識的私人教練 — 他知道你的手在抖、但不會嘲笑你
- 三個視覺關鍵字：Forge-warm · Disciplined · Human

【Tokens（從 tokens.html 抽出、不要改）】
- Primary：hsl(8 78% 55%) 「Forge Ember」橙紅、CTA / 完成 / PR 用
- Background：hsl(30 25% 99%) 暖紙白、非純白
- Dark bg：hsl(240 10% 7%) warm carbon、非純黑
- Success：hsl(150 62% 38%)（完成）、Warning：hsl(38 94% 50%)（RPE 過高）
- Border：hairline 1px hsl(30 10% 88%)
- Radius：sm 6 / md 10 / lg 14 / xl 20、預設 --radius: 12px
- Shadow：ds-sm subtle / ds-md hover / ds-lg modal / ds-glow primary PR
- Font：Inter（英）+ Noto Sans TC（中）+ JetBrains Mono（數字）
- 數字一律 tabular-nums

【Typography Scale（不要超出）】
H1 32 · H2 24 · H3 20 · H4 18 · body 16 · small 14 · caption 12
（hero 數字例外可到 64+、像訓練中倒數）

【Spacing】4px baseline
【Motion】cubic-bezier(0.16, 1, 0.3, 1) 預設 / 200ms 小 / 300ms 中 / 500ms 大
【Icon】只用 Lucide、stroke-width 2、尺寸 16/20/24

【Voice & Tone（每段文案的測試）】
- 直接、溫暖、像私人教練、不油膩
- 用「你」不用「使用者」
- 避免：「太棒了！」「你超強！」過度 emoji、客套
- 鼓勵：「漂亮的一組」「持續就是進步」
- 錯誤：「重量不能為 0」(不罵人)

【UI 慣例（前面 12 個畫面已建立的、必須延續）】
- BottomNav 4 tab：今天 / 課表 / 動作 / 歷史、active = primary 色
- StatusBar：iOS 假狀態列只在 mockup 顯示、實際 PWA 不需要
- Phone preview：每個畫面同時出 light + dark mode、各 390×844
- Card：bg-card + 1px hairline border + radius lg；shadow 只在 hover/modal
- Button：primary（橙）/ secondary / ghost / outline / destructive
- 數字 hero：80kg × 10 用 64px Inter 800、tabular-nums、× 是分隔
- Set tracker：mono 字 SET 1 / SET 2、PR 那行整列變 primary

【別做的事】
- 別漸層（除了 PR 慶祝可微 glow）
- 別陰影過重
- 別純白純黑（暖偏）
- 別用 Material / iOS 預設組件感
- 別發明新 icon family
- 別寫成「Material Design 風」「iOS 風」

【輸出格式】
- 同 §1-§15：自包含 HTML（Tailwind CDN + tokens inline）+ 可選 React JSX
- JSX 用 `const { useState } = React;`（CDN React、不是 import）
- mock data 直接寫死、別擔心型別

請確認你理解這份 primer 後、我會貼下一條訊息給你具體畫面 prompt。
===
```

---

## 🎯 為什麼這份 primer 夠用

| Claude Design 容易漂的點 | 這份 primer 怎麼鎖 |
|--------------------------|--------------------|
| 顏色偏離 (Forge Ember 變鮮紅) | 明確 HSL 值 + 「不要重新發明」 |
| 字級加大變化 (H1 從 32 變 48) | 列出 scale + 例外 (hero) |
| 圓角飄移 (用 16 而非 12) | 列 6/10/14/20、預設 12 |
| 文案油膩 (「太棒了！你超強！」) | 直接列「避免」清單 |
| 加 native iOS / Material 感 | 直接禁 |
| BottomNav 命名 / 順序不對 | 列死「今天/課表/動作/歷史」 |
| 漸層 / 陰影過重 | 列規則：別漸層、shadow 節制 |

---

## 🔬 驗證一致性（每次新畫面收到後）

對照 [`docs/design/screens/`](./screens/) 已有的 12 個畫面，眼睛掃過：

1. ✅ Primary 色看起來是同一個橙紅？
2. ✅ Card 邊框是 hairline（不是 2px 粗線）？
3. ✅ BottomNav 風格一致（active = 橙）？
4. ✅ 數字用 tabular-nums（兩位數對齊）？
5. ✅ 圖示是 Lucide line style（不是 filled / Material）？
6. ✅ light/dark 兩個 preview 並排？
7. ✅ 文案語氣是「教練」不是「客服」？

只要前 3 條對、其他都好說 — 視覺一致性 80% 來自這 3 點。

---

## 🚨 如果新對話畫出來真的漂了

選一個漂得最厲害的 element、直接告訴 Claude Design：
> 這個 [元素] 的 [屬性] 不對、應該照 tokens.html 的 [token name]。
> 例：這個橙紅是哪裡來的？應該用 --primary，HSL 值是 8 78% 55%。

通常 1 輪修正就會回到正軌。如果 2-3 輪都修不好、開新對話比繼續鬥便宜（清掉漂掉的 anchor）。

---

## 💡 進階：把 primer 縮成「最小版」

如果 token 預算真的緊、用這個 1/3 體積版：

```
你在為 FitForge 設計 UI（健身新手 PWA）。附檔 tokens.html 是設計系統真相、
不要重新發明顏色 / 字級 / 圓角。Primary 是 Forge Ember 橙紅 hsl(8 78% 55%)、
背景暖紙白非純白、Font 是 Inter + Noto Sans TC、Radius 預設 12px、
數字用 tabular-nums。BottomNav 4 tab：今天 / 課表 / 動作 / 歷史。
Phone preview light + dark 並排 390×844。語氣像私人教練、溫暖直接不油膩。
輸出自包含 HTML + 可選 React JSX (CDN React、mock data 寫死)。
請確認後我貼具體畫面 prompt。
```

短一半但少了「禁做清單」、漂移風險高一點。

---

## 📦 也可以放這個範例附檔提升一致性

對話開頭一次附 3 個檔，Claude Design 視覺對標更準：

| 附檔 | 為什麼 |
|------|--------|
| `docs/design/system/tokens.html` | **必附** — 設計系統視覺真相 |
| `docs/design/screens/15-workout-session.html` | 已有的「最複雜畫面」、最能傳達調性 |
| `docs/design/screens/08-today.html` | 已有的「最常見畫面」、卡片/排版基準 |

3 個檔加起來不大、但 Claude Design 看到後做新畫面會自然延續風格。
