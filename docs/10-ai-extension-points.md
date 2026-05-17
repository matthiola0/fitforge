# 10 — AI 擴展點 (AI Extension Points)

> V1 不實作 AI 教練、但**架構上預留介面**。本檔定義 `AIPort`、V2 期望的能力、資料採集點、prompt 模板雛形。讓 V2 接 Claude API 時改 1 個 adapter 即可。

---

## 1. 為什麼 V1 預留 AI 介面

詳見 [01-product-overview.md](./01-product-overview.md) §2.2：
- V1 沒有訓練資料、AI 推薦無 grounding
- V1 累積 4–8 週訓練資料後、V2 接入 AI 才有意義
- 不預留會導致 V2 時動 Domain 多處、重複改

**設計目標**：V1 端到端跑、AI 部分用 `NoopAIAdapter` 回應「目前不支援、請參考預設推薦」。V2 換 `ClaudeAIAdapter` 即可。

---

## 2. `AIPort` 介面定義

```typescript
// packages/core/src/ports/AIPort.ts

import type { OnboardingProfile, Plan, Workout, Exercise } from '../data/schemas';

export interface AIPort {
  /** 是否可用 (例如 V1 noop = false、V2 有 key = true) */
  isAvailable(): boolean;

  /** 推薦課表 — 根據 onboarding profile + 歷史訓練 */
  recommendPlan(input: RecommendPlanInput): Promise<RecommendPlanResult>;

  /** 即時建議 — 訓練中根據當前進度產生鼓勵 / 提醒 (V2 後段) */
  liveAdvice(input: LiveAdviceInput): Promise<LiveAdviceResult>;

  /** 動作替換建議 — 當用戶無器材時 */
  suggestSubstitutes(input: SuggestSubstitutesInput): Promise<SuggestSubstitutesResult>;

  /** 訓練後總結 — 自然語言摘要、鼓勵、下次建議 */
  postWorkoutReview(input: PostWorkoutReviewInput): Promise<PostWorkoutReviewResult>;
}

// === Input/Output 型別 ===

export type RecommendPlanInput = {
  profile: OnboardingProfile;
  recentWorkouts: Workout[]; // 最近 N 次，V2 一開始可為空陣列
  availableExercises: Exercise[]; // 用戶器材篩過的子集
};

export type RecommendPlanResult =
  | { ok: true; plan: PlanDraft; rationale: string }
  | { ok: false; reason: 'NOT_AVAILABLE' | 'INSUFFICIENT_DATA' | 'ERROR'; fallbackPresetId?: string };

export type LiveAdviceInput = {
  workout: Workout;
  currentExerciseId: string;
  currentSetIndex: number;
  lastSet?: { weight: number; reps: number; rpe?: number };
};

export type LiveAdviceResult = {
  message: string; // 短句、< 80 字
  tone: 'encouraging' | 'cautionary' | 'celebratory';
};

export type SuggestSubstitutesInput = {
  exerciseId: string;
  availableEquipment: OnboardingProfile['availableEquipment'];
};

export type SuggestSubstitutesResult = {
  substitutes: Array<{ exerciseId: string; reason: string }>;
};

export type PostWorkoutReviewInput = {
  workout: Workout;
  weeklyContext: { workoutsThisWeek: number; consecutiveDays: number };
};

export type PostWorkoutReviewResult = {
  summary: string;       // 一段話總結
  nextSessionTip: string; // 下次訓練建議
  motivation: string;     // 鼓勵
};

// PlanDraft — 從 Plan 衍生、AI 產出的中間態
export type PlanDraft = Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'userId' | 'isPreset' | 'isActive'>;
```

---

## 3. V1 實作 — `NoopAIAdapter`

```typescript
// packages/core/src/adapters/NoopAIAdapter.ts
import type { AIPort, RecommendPlanInput, RecommendPlanResult /* ... */ } from '../ports/AIPort';

export class NoopAIAdapter implements AIPort {
  isAvailable() { return false; }

  async recommendPlan(input: RecommendPlanInput): Promise<RecommendPlanResult> {
    // V1 落回 OnboardingService 的決策樹推薦 (見 05-domain-logic.md §5.2)
    return { ok: false, reason: 'NOT_AVAILABLE' };
  }

  async liveAdvice() {
    return { message: '', tone: 'encouraging' as const };
  }

  async suggestSubstitutes() {
    return { substitutes: [] };
  }

  async postWorkoutReview(input) {
    return {
      summary: `完成 ${input.workout.exercises.length} 個動作、做得好！`,
      nextSessionTip: '休息至少 24 小時再練同一肌群。',
      motivation: '持續就是進步、繼續加油！',
    };
  }
}
```

> `postWorkoutReview` 即使在 noop adapter 下也回有意義的字 — 因為這是 UI 必看的位置 (WorkoutSummary 頁顯示)、不能空白。

---

## 4. V2 實作雛形 — `ClaudeAIAdapter`

```typescript
// packages/core/src/adapters/ClaudeAIAdapter.ts (V2 才存在)
import Anthropic from '@anthropic-ai/sdk';
import type { AIPort } from '../ports/AIPort';

export class ClaudeAIAdapter implements AIPort {
  private client: Anthropic;

  constructor(opts: { apiKey: string; model?: string }) {
    this.client = new Anthropic({ apiKey: opts.apiKey });
    this.model = opts.model ?? 'claude-haiku-4-5-20251001';
    // V2 預期用 Haiku 4.5 — 便宜、回覆快、品質夠用
    // 進階場景 (產生整套課表) 可升 Sonnet 4.6
  }

  isAvailable() { return true; }

  async recommendPlan(input) {
    const resp = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT_RECOMMEND_PLAN,
      messages: [{ role: 'user', content: buildRecommendPlanUserPrompt(input) }],
    });
    // 解析回應、轉成 PlanDraft、做 schema 驗證
    return parseRecommendPlanResponse(resp);
  }

  // ... 其他方法 ...
}
```

---

## 5. Prompt 模板雛形 (V1 寫好、V2 直接用)

### 5.1 `SYSTEM_PROMPT_RECOMMEND_PLAN`

```
你是 FitForge 的健身教練助手，專門為新手設計安全、漸進的重訓課表。

任務：根據用戶 profile、最近訓練記錄、可用器材，產出一份合適的 6-週課表草稿 (JSON 格式)。

設計原則：
1. 新手 (experienceLevel = absolute_beginner) 預設用「全身入門」、不分化
2. 一週訓練次數 ≤ 用戶提供的 frequency
3. 每個動作的目標 sets × reps 符合該動作的訓練特性 (大動作多組少次數、小動作少組多次數)
4. 每日訓練量平均、避免單日過載
5. 動作選擇必須在 availableExercises 範圍內

輸出 JSON schema (與 PlanDraft 對齊)：
{
  "name": "...",
  "description": "...",
  "goalTag": "strength | hypertrophy | general | fatloss",
  "frequencyPerWeek": 3,
  "days": [
    {
      "id": "pd_xxx",
      "order": 0,
      "name": "Day 1: ...",
      "focusMuscleGroups": ["chest", "triceps"],
      "exercises": [
        { "id": "pe_xxx", "exerciseId": "ex_xxx", "order": 0, "targetSets": 3, "targetRepsMin": 8, "targetRepsMax": 12, "restSeconds": 90, "notes": "..." }
      ]
    }
  ]
}

回應只能是 JSON、不要加 markdown code fence、不要加說明。
```

### 5.2 `SYSTEM_PROMPT_POST_WORKOUT_REVIEW`

```
你是 FitForge 的健身教練助手、總結一次訓練、給予具體鼓勵與下次建議。

任務：根據 workout 與 weeklyContext，產出三段 JSON：
- summary: 1-2 句總結這次訓練 (講具體：什麼動作、表現如何)
- nextSessionTip: 1 句下次訓練具體建議 (避免泛泛、給可執行的)
- motivation: 1 句鼓勵 (溫暖、不油膩、不誇張)

語氣：直接、溫暖、像私人教練、不要油膩讚美 (例：「太棒了！」「你超強！」不要)。

繁體中文、繁中標點符號。

輸出嚴格 JSON：{"summary":"...","nextSessionTip":"...","motivation":"..."}
```

### 5.3 `SYSTEM_PROMPT_LIVE_ADVICE`

```
你是 FitForge 教練助手、訓練中即時建議。

收到當前動作、組數、上組表現、給出 < 60 字的建議。

語氣分三種、依情境：
- encouraging: 一般組
- cautionary: 上組 RPE 9-10 + reps 不足、提示降重量
- celebratory: 達成 PR

繁中、不囉嗦、不要 emoji 灌爆。

輸出 JSON：{"message":"...","tone":"..."}
```

---

## 6. 資料採集點 (Data Hooks for AI)

V1 雖然不呼叫 AI、但 **資料要在「對的位置」**、避免 V2 找不到。

| 採集點             | V1 已有 | 用於 V2 AI 的什麼能力                          |
| ------------------ | ------- | ---------------------------------------------- |
| `OnboardingProfile` | ✅      | recommendPlan input                            |
| `Plan`             | ✅      | (作為現有計劃 context)                         |
| `Workout` (完整)   | ✅      | recommendPlan input / postWorkoutReview input  |
| `Set.rpe`          | ✅      | liveAdvice / 推算疲勞                          |
| `Set.completedAt`  | ✅      | 推算組間休息實際時間 vs 計劃                   |
| `Workout.notes`    | ✅      | 用戶手寫感受、AI context                        |
| `Workout.locationTag` | ❌    | V2 加？(同地點訓練表現比較)                    |
| `painMarkers`      | ❌      | V2 加？(疼痛位置 → 動作調整)                    |

V1 不加的欄位、寫入 [12-roadmap-v2.md](./12-roadmap-v2.md) 待補。

---

## 7. AI Service 整合點 (Domain 層)

在 V2、`PlanService` 與 `WorkoutEngine` 會在以下位置調用 `AIPort`：

### 7.1 `OnboardingService.completeOnboarding()` 後

```typescript
// V2 偽碼
const profile = await onboardingRepo.save(draftProfile);
const exercises = await exerciseRepo.filterByEquipment(profile.availableEquipment);
const recent = await workoutRepo.getRecent(50);

if (this.ai.isAvailable()) {
  const result = await this.ai.recommendPlan({ profile, recentWorkouts: recent, availableExercises: exercises });
  if (result.ok) {
    const plan = await this.planService.createFromDraft(result.plan, { source: 'ai_recommended' });
    return { recommendedPlan: plan, rationale: result.rationale };
  }
}
// fallback: 決策樹推薦 (V1 邏輯)
return this.fallbackRecommendation(profile);
```

### 7.2 `WorkoutEngine.finish()` 後

```typescript
const summary = await statsService.computeSummary(workout);
const weekly = await statsService.weeklyContext();
const review = await this.ai.postWorkoutReview({ workout, weeklyContext: weekly });
return { ...summary, aiReview: review };
```

### 7.3 `WorkoutEngine.logSet()` 後 (頻率高、需 throttle)

```typescript
// 每 N 組 觸發一次 (V2 設計時決定)
if (shouldFetchAdvice(currentSetIndex)) {
  this.ai.liveAdvice({ ... }).then((advice) => emitToSession(advice));
}
```

---

## 8. 成本與效能考量

### 8.1 V2 預估成本 (一個重度用戶、月)

| 場景                      | 觸發頻率                 | tokens / 次  | 模型           | 月成本估算            |
| ------------------------- | ------------------------ | ------------ | -------------- | --------------------- |
| recommendPlan             | onboarding + 每 6 週     | 3K in / 2K out | Sonnet 4.6    | < $0.1 / 用戶 / 月    |
| postWorkoutReview         | 每次訓練 (12 次 / 月)    | 1K in / 200 out | Haiku 4.5     | < $0.05 / 用戶 / 月   |
| liveAdvice                | 訓練中 每 5 組 (60 次 / 月) | 500 in / 100 out | Haiku 4.5  | < $0.10 / 用戶 / 月   |
| suggestSubstitutes        | 偶爾 (3 次 / 月)         | 800 in / 300 out | Haiku 4.5   | 微                    |
| **合計**                  | -                        | -            | -              | **< $0.30 / 用戶 / 月** |

> 數字是 V2 規劃假設、未來精算需 actual telemetry。

### 8.2 Prompt Caching

V2 ClaudeAIAdapter 應啟用 prompt caching：
- System prompt 通常不變 → cache 它
- 用戶 profile / 動作庫 (大) → cache 5 分鐘 TTL
- 動態部分 (本次訓練) → 不 cache

詳見 Anthropic SDK 的 cache_control 文件。

### 8.3 失敗 fallback

`AIPort` 每個方法都有「不能用時的 graceful degrade」路徑：
- `recommendPlan` 失敗 → 用決策樹預設
- `liveAdvice` 失敗 → 不顯示
- `postWorkoutReview` 失敗 → 顯示簡單字串版

UI 層**永遠先渲染 fallback、AI 結果到了再覆蓋** — 不能 spinner 卡住。

---

## 9. 隱私 / 安全

- API key 不放 client：V2 透過 Supabase Edge Function (or Cloudflare Worker) 代理、把 key 放 server-side env
- 不傳用戶識別資訊 (姓名、email) 給 Claude — 只送訓練資料
- 用戶可在 Settings 關閉「AI 教練」、改回 V1 行為
- 系統 prompt 中明確要求 Claude 不索取或保存個人資訊

---

## 10. UI 層的 AI affordance (V1 預留)

V1 UI 雖然不顯示 AI 結果、但保留**容器**：

| 位置                | V1 行為                        | V2 行為                            |
| ------------------- | ------------------------------ | ---------------------------------- |
| OnboardingRecommendation | 預設推薦卡片                  | 預設推薦 + 「AI 為你客製」按鈕     |
| WorkoutSummary       | 簡單字串總結                   | AI summary + 下次建議              |
| WorkoutSession (右下角) | 不顯示                        | LiveAdvice toast (低調)             |
| ExerciseDetail       | -                              | 「找替代動作」按鈕 (V2 加)          |

---

## 11. 測試策略

V2 AI 整合需要：
- ✅ ClaudeAIAdapter 單元測試 (mock Anthropic SDK、驗證 prompt 組裝)
- ✅ End-to-end 含 AI 的測試 (用 fake adapter 回固定 JSON)
- ✅ Prompt regression test (一組 input + 期望 output 形狀的快照)
- ✅ Fallback path 測試 (AI 拋錯、UI 仍正常)

---

## 12. 下一步閱讀

- 想看 V2 完整路線 → [12-roadmap-v2.md](./12-roadmap-v2.md)
- 想看 V1 OnboardingService 的決策樹推薦 → [05-domain-logic.md](./05-domain-logic.md) §5.2
- 想看 Port 注入機制 → [02-system-architecture.md](./02-system-architecture.md) §6.2
