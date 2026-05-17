# 13 — 動作 Tag 系統 (Exercise Tagging)

> 本檔是「**動作分類的單一真相**」。所有 Exercise schema 的 `bodyPart`、`muscles`、篩選 UI、訓練中換動作邏輯、ad-hoc workout 推薦都依本檔。

---

## 1. 設計目標

| 目標                                        | 為何重要                                        |
| ------------------------------------------- | ----------------------------------------------- |
| 兩層分類：大分類 + 細分肌群                  | 新手用大分類入門、進階用細分肌群調整訓練分布      |
| Tag 命名穩定、可演進                         | 將是 V2 AI 教練判斷「該練什麼」的基礎、不可亂改   |
| 篩選 / 換動作 / 推薦 共用同一套               | 一套 tag、所有 feature 都吃這套                  |
| 不教用戶解剖學                               | UI 顯示用「中三角」(口語)、code 用 `lateral_delts` (穩定)  |

---

## 2. Tag 兩層結構

```
bodyPart (大分類、1 個)
  └─ muscles (細分肌群、1-3 個、主肌群在第一個)
```

每個 exercise 帶：
- **1 個** `bodyPart` (大分類、即「點哪個 tab 看得到我」)
- **1+ 個** `muscles` (細分、第一個是主肌群、後面是輔助)

> 設計取捨：選「兩層」而非「多層階層 tag (例 `muscle/shoulders/lateral`)」是因為健身新手心智模型是「平的」：他想到「肩」、不會去想「肩之下的中三角又是哪一支」。兩層讓 UI 設計極簡、tag 列表可控。

---

## 3. 完整 `bodyPart` 列表 (固定 7 個)

| Tag ID       | 中文 (UI)  | 英文 (UI)    | 範圍說明                                |
| ------------ | ---------- | ------------ | --------------------------------------- |
| `chest`      | 胸         | Chest        | 胸大肌、相關推姿勢                       |
| `back`       | 背         | Back         | 闊背、中背、下背、斜方                  |
| `shoulders`  | 肩         | Shoulders    | 三角肌 (前/中/後)                       |
| `arms`       | 手臂       | Arms         | 二頭、三頭、前臂                        |
| `legs`       | 腿         | Legs         | 股四頭、腿後、小腿、臀                  |
| `core`       | 核心       | Core         | 腹直、腹斜、深層核心                    |
| `full_body`  | 全身       | Full Body    | 多關節大動作 (deadlift、clean 類)        |

**規則**：
- 一個 exercise 只能有 1 個 `bodyPart`
- 多關節動作的 `bodyPart` 取「**主動肌群所在身體部位**」 — 例如 Bench Press 是 `chest` (即使三頭也參與)
- Deadlift 因為臀/腿/背都重度參與、歸 `full_body`
- Pull-up 主動是闊背 → `back` (非 arms 即使二頭參與)

---

## 4. 完整 `muscles` 列表 (V1 共 21 個)

> 命名規範：snake_case、英文、避免醫學專名 (避用 `triceps_lateralis`、用 `triceps_lateral`)。中文用口語標籤。

### 4.1 胸 (`chest`)

| ID                | UI 中文 | UI 英文       | 備註                                |
| ----------------- | ------- | ------------- | ----------------------------------- |
| `upper_chest`     | 上胸    | Upper Chest   | 鎖骨頭 (pec clavicular)、上斜推練到 |
| `mid_chest`       | 中胸    | Mid Chest     | 胸骨頭主體 (pec sternal)、平推練到  |
| `lower_chest`     | 下胸    | Lower Chest   | 肋骨頭 (pec costal)、下斜推 / 雙槓  |

### 4.2 背 (`back`)

| ID            | UI 中文 | UI 英文        | 備註                                    |
| ------------- | ------- | -------------- | --------------------------------------- |
| `lats`        | 闊背    | Lats           | 引體向上、滑輪下拉主練                  |
| `mid_back`    | 中背    | Mid Back       | 菱形肌 + 中斜方、划船動作主練           |
| `lower_back`  | 下背    | Lower Back     | 豎脊肌、Romanian Deadlift / Hyper       |
| `traps`       | 斜方    | Traps          | 上斜方、聳肩動作主練                    |

### 4.3 肩 (`shoulders`)

| ID              | UI 中文 | UI 英文      | 備註                              |
| --------------- | ------- | ------------ | --------------------------------- |
| `front_delts`   | 前三角  | Front Delt   | 推類動作主練 (OHP)                |
| `lateral_delts` | 中三角  | Side Delt    | 側平舉主練 (寬肩關鍵)             |
| `rear_delts`    | 後三角  | Rear Delt    | Face Pull / 反向飛鳥主練          |

### 4.4 手臂 (`arms`)

| ID         | UI 中文 | UI 英文    | 備註                          |
| ---------- | ------- | ---------- | ----------------------------- |
| `biceps`   | 二頭    | Biceps     | 二頭肌 (V1 不細分長短頭)       |
| `triceps`  | 三頭    | Triceps    | 三頭肌 (V1 不細分頭)           |
| `forearms` | 前臂    | Forearms   | 前臂、握力                     |

### 4.5 腿 (`legs`)

| ID           | UI 中文 | UI 英文     | 備註                                   |
| ------------ | ------- | ----------- | -------------------------------------- |
| `quads`      | 股四頭  | Quads       | 大腿前側                                |
| `hamstrings` | 腿後    | Hamstrings  | 大腿後側                                |
| `glutes`     | 臀      | Glutes      | 臀大肌為主                              |
| `calves`     | 小腿    | Calves      | 腓腸肌 + 比目魚 (V1 不分)               |

### 4.6 核心 (`core`)

| ID                  | UI 中文  | UI 英文        | 備註                              |
| ------------------- | -------- | -------------- | --------------------------------- |
| `abs`               | 腹肌     | Abs            | 腹直肌                            |
| `obliques`          | 腹斜     | Obliques       | 腹斜肌                            |
| `deep_core`         | 深層核心 | Deep Core      | 腹橫肌、骨盆底 (棒式類主練)        |

### 4.7 全身 (`full_body`)

`full_body` 的動作通常標多個 muscles (例如 Deadlift: `glutes, hamstrings, lower_back, lats, traps`)。不另設「全身細分」tag。

---

## 5. 為什麼選這套 (不選什麼)

| 我們選了                                | 我們沒選                                                | 為什麼                                                          |
| --------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| 兩層 (bodyPart + muscles)              | 三層 (+ 動作模式 push/pull/squat/hinge)                 | 新手不需要分這麼細、UI 簡單                                      |
| 21 個 muscles                          | 細到肌肉頭 (例 `triceps_long_head`)                     | V1 用不到、設計過載、可在 V2 加 (新欄位)                          |
| 一個 `muscles[]` 陣列                  | 拆 `primaryMuscles` + `secondaryMuscles`                | UI 顯示時用「主肌群在第一個」慣例即可、不必雙欄                  |
| 中英文都存                              | 只存 ID、UI 動態翻譯                                    | 簡化 i18n、UI 直接讀 (V2 多語系時統一 t() 也可)                  |
| `full_body` 獨立大分類                  | 把 Deadlift 歸到 `back` 或 `legs`                       | 強烈暗示這是個「複合大動作、會累全身」、避免新手只當練背         |

---

## 6. Schema 對應

詳細的 Zod schema 見 [04-data-model.md](./04-data-model.md) §3.1。本檔規定**值集**：

```typescript
// packages/core/src/data/schemas/exercise.schema.ts

export const BODY_PARTS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full_body'] as const;
export type BodyPart = (typeof BODY_PARTS)[number];

export const MUSCLES = [
  // chest
  'upper_chest', 'mid_chest', 'lower_chest',
  // back
  'lats', 'mid_back', 'lower_back', 'traps',
  // shoulders
  'front_delts', 'lateral_delts', 'rear_delts',
  // arms
  'biceps', 'triceps', 'forearms',
  // legs
  'quads', 'hamstrings', 'glutes', 'calves',
  // core
  'abs', 'obliques', 'deep_core',
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const MUSCLE_TO_BODY_PART: Record<Muscle, BodyPart> = {
  upper_chest: 'chest', mid_chest: 'chest', lower_chest: 'chest',
  lats: 'back', mid_back: 'back', lower_back: 'back', traps: 'back',
  front_delts: 'shoulders', lateral_delts: 'shoulders', rear_delts: 'shoulders',
  biceps: 'arms', triceps: 'arms', forearms: 'arms',
  quads: 'legs', hamstrings: 'legs', glutes: 'legs', calves: 'legs',
  abs: 'core', obliques: 'core', deep_core: 'core',
};

// Schema 驗證：所有 muscles 必須對應 exercise 的 bodyPart 或全身允許
```

---

## 7. MVP 30 個動作的 Tag 對照

> 對應 [04-data-model.md](./04-data-model.md) §5.1 的 30 個動作。

| 動作 (中)         | 動作 (en)              | bodyPart    | muscles (主肌群在前)                          |
| ----------------- | ---------------------- | ----------- | --------------------------------------------- |
| 槓鈴深蹲          | Back Squat             | legs        | `quads`, `glutes`, `hamstrings`               |
| 前蹲              | Front Squat            | legs        | `quads`, `glutes`                             |
| 羅馬尼亞硬舉      | Romanian Deadlift      | legs        | `hamstrings`, `glutes`, `lower_back`           |
| 保加利亞分腿蹲    | Bulgarian Split Squat  | legs        | `quads`, `glutes`                             |
| 腿推              | Leg Press              | legs        | `quads`, `glutes`                             |
| 高腳杯蹲          | Goblet Squat           | legs        | `quads`, `glutes`                             |
| 槓鈴臥推          | Bench Press            | chest       | `mid_chest`, `triceps`, `front_delts`         |
| 上斜啞鈴推        | Incline DB Press       | chest       | `upper_chest`, `front_delts`, `triceps`       |
| 伏地挺身          | Push-up                | chest       | `mid_chest`, `triceps`, `front_delts`         |
| 飛鳥              | Chest Fly              | chest       | `mid_chest`                                   |
| 硬舉              | Deadlift               | full_body   | `glutes`, `hamstrings`, `lower_back`, `lats`, `traps` |
| 槓鈴划船          | Bent-over Row          | back        | `mid_back`, `lats`, `rear_delts`              |
| 滑輪下拉          | Lat Pulldown           | back        | `lats`, `biceps`                              |
| 引體向上          | Pull-up                | back        | `lats`, `biceps`, `mid_back`                  |
| 坐姿划船          | Seated Cable Row       | back        | `mid_back`, `lats`                            |
| 過頭推            | Overhead Press         | shoulders   | `front_delts`, `lateral_delts`, `triceps`     |
| 側平舉            | Lateral Raise          | shoulders   | `lateral_delts`                               |
| Face Pull         | Face Pull              | shoulders   | `rear_delts`, `mid_back`                      |
| 槓鈴彎舉          | Barbell Curl           | arms        | `biceps`                                      |
| 三頭下壓          | Triceps Pushdown       | arms        | `triceps`                                     |
| 錘式彎舉          | Hammer Curl            | arms        | `biceps`, `forearms`                          |
| 棒式              | Plank                  | core        | `deep_core`, `abs`                            |
| 懸吊抬腿          | Hanging Knee Raise     | core        | `abs`, `deep_core`                            |
| 俄羅斯轉體        | Russian Twist          | core        | `obliques`, `abs`                             |
| 臀推              | Hip Thrust             | legs        | `glutes`, `hamstrings`                        |
| 臀橋              | Glute Bridge           | legs        | `glutes`                                      |
| 農夫走路          | Farmer's Carry         | full_body   | `forearms`, `traps`, `deep_core`              |
| 提踵              | Calf Raise             | legs        | `calves`                                      |
| 流氓划船          | Renegade Row           | full_body   | `mid_back`, `lats`, `deep_core`               |
| 壺鈴擺盪          | Kettlebell Swing       | full_body   | `glutes`, `hamstrings`, `lower_back`           |

---

## 8. 篩選 UI 規則

### 8.1 動作圖庫篩選 (`/exercises`)

- **預設視圖**：所有動作、grid 2 column
- **頂部 7 個 chip**：全部 / 胸 / 背 / 肩 / 腿 / 手 / 核心 (`full_body` 不單獨列、依用戶選的大類顯示)
  - 點一個 chip → 過濾為該 bodyPart + 包含「該 bodyPart 任一 muscle 的 `full_body` 動作」(例如點「腿」會看到 Deadlift)
- **進階篩選 sheet**：
  - 細分肌群 chip group (依當前選的 bodyPart 動態顯示對應 muscles)
  - 器材 chip
  - 難度 chip
  - 「動作可在訓練中替換」toggle (V2 暫不開)

### 8.2 換動作 sheet (訓練中)

點動作的 🔄 → 開啟 bottom sheet：
- 標題：「替換 [動作名]」
- 副標：「相同肌群的其他選擇」
- 規則：
  - **預設過濾**：與原動作 `muscles[0]` (主肌群) 相同的其他動作
  - **若 < 3 個結果**：放寬到「相同 `bodyPart`」
  - **若 < 2 個結果**：放寬到「相同 `bodyPart` 任一 muscle 交集」
- 列表 + 「自己挑」進入完整動作庫的入口

### 8.3 Ad-hoc Workout 目標選擇

「自由訓練」啟動時：
- 用戶選 1+ bodyPart (chip multi-select)
- 系統提供「智慧推薦」(隨機選 N 個、覆蓋所選 bodyPart 的不同 muscles 求平衡)
- 或「自己挑」進完整動作庫多選模式

---

## 9. 換動作的演算法 (Swap Logic)

```typescript
// packages/core/src/domain/ExerciseQueryService.ts

export class ExerciseQueryService {
  constructor(private deps: { exerciseRepo: ExerciseRepository }) {}

  /**
   * 找替代動作
   * @param exerciseId 要被換掉的動作
   * @param limit 最多回幾個
   */
  async findSubstitutes(exerciseId: string, limit = 8): Promise<Exercise[]> {
    const target = await this.deps.exerciseRepo.get(exerciseId);
    if (!target) return [];

    // Tier 1: 同 bodyPart + 同主肌群
    const tier1 = await this.deps.exerciseRepo.query({
      bodyPart: target.bodyPart,
      includesMuscle: target.muscles[0],
      excludeId: exerciseId,
    });
    if (tier1.length >= 3) return tier1.slice(0, limit);

    // Tier 2: 同 bodyPart
    const tier2 = await this.deps.exerciseRepo.query({
      bodyPart: target.bodyPart,
      excludeId: exerciseId,
    });
    if (tier2.length >= 2) return tier2.slice(0, limit);

    // Tier 3: 任一 muscle 重疊
    const tier3 = await this.deps.exerciseRepo.query({
      anyMuscles: target.muscles,
      excludeId: exerciseId,
    });
    return tier3.slice(0, limit);
  }

  /** Ad-hoc 隨機推薦 */
  async pickForBodyParts(bodyParts: BodyPart[], count: number): Promise<Exercise[]> {
    const pool = await this.deps.exerciseRepo.query({ bodyParts });
    // 簡單策略：每個 bodyPart 平均分配 + 每個 muscle 不重複 (求覆蓋)
    return distributedSample(pool, bodyParts, count);
  }
}
```

V2 AI 接入後、`AIPort.suggestSubstitutes` 可覆寫 tier 邏輯 (依用戶訓練史推薦從沒練過的)。

---

## 10. UI 文案對應 (i18n key)

```json
{
  "bodyPart.chest": "胸",
  "bodyPart.back": "背",
  "bodyPart.shoulders": "肩",
  "bodyPart.arms": "手臂",
  "bodyPart.legs": "腿",
  "bodyPart.core": "核心",
  "bodyPart.full_body": "全身",

  "muscle.upper_chest": "上胸",
  "muscle.mid_chest": "中胸",
  "muscle.lower_chest": "下胸",
  "muscle.lats": "闊背",
  "muscle.mid_back": "中背",
  "muscle.lower_back": "下背",
  "muscle.traps": "斜方",
  "muscle.front_delts": "前三角",
  "muscle.lateral_delts": "中三角",
  "muscle.rear_delts": "後三角",
  "muscle.biceps": "二頭",
  "muscle.triceps": "三頭",
  "muscle.forearms": "前臂",
  "muscle.quads": "股四頭",
  "muscle.hamstrings": "腿後",
  "muscle.glutes": "臀",
  "muscle.calves": "小腿",
  "muscle.abs": "腹肌",
  "muscle.obliques": "腹斜",
  "muscle.deep_core": "深層核心"
}
```

V2 多語系時、加 `en.json` 即可。

---

## 11. V2 預備加什麼

> V1 不做、但設計時請保留擴充空間。

| V2 新增                | 為何 V1 不做                           | 對 V1 schema 的擾動               |
| ---------------------- | -------------------------------------- | --------------------------------- |
| `movementPattern`      | push/pull/squat/hinge/carry/core/lunge — 進階訓練者愛這套 | 新增欄位 nullable、V1 留空        |
| `equipmentDetail`      | 例：`barbell.olympic` vs `barbell.standard`、`dumbbell.adjustable` | 新欄位、V1 用 enum 簡版           |
| `jointStress`          | 對哪些關節壓力 (膝、肩、腰)            | 新欄位 array、V1 不存            |
| `rom` (Range of Motion) | 動作幅度需求                          | 同上                              |
| `unilateral` 標記      | 單邊動作                                | boolean、V1 從 name 推斷          |
| `progressionTier`      | 動作的進階階梯 (e.g., Push-up → Bench → Incline) | 新欄位、V1 不做            |

---

## 12. 命名一致性 Checklist

實作時逐項檢查：

- [ ] Schema 文件用 `BODY_PARTS` / `MUSCLES` const、不寫死字串
- [ ] Seeds (`exercises.ts`) 的 muscles 第一個是「主肌群」
- [ ] UI 顯示文案經 `t('bodyPart.xxx')` 取得
- [ ] 篩選邏輯 (`/exercises` + Swap Sheet + Ad-hoc Builder) 都呼叫 `ExerciseQueryService`、不重複實作
- [ ] V2 加 muscle 細分時 (例如三頭分頭)、必須加 migration 而非改 enum
- [ ] Linter 規則：所有 `bodyPart === '...'` 都改用 enum const

---

## 13. 下一步閱讀

- 想看 Exercise schema 細節 → [04-data-model.md](./04-data-model.md) §3.1
- 想看 ExerciseQueryService 介面 → [05-domain-logic.md](./05-domain-logic.md) §8
- 想看篩選 UI 設計 → [07-screen-flow.md](./07-screen-flow.md) §3.10、§3.20 (Swap Sheet)
- 想看 ad-hoc workout 推薦邏輯 → [05-domain-logic.md](./05-domain-logic.md) §9 (WorkoutBuilderService)
