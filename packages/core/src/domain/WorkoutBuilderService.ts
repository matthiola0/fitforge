import type { ExerciseRepository } from '../data/repositories/ExerciseRepository';
import type { PlanRepository } from '../data/repositories/PlanRepository';
import type { SettingsRepository } from '../data/repositories/SettingsRepository';
import type { Difficulty } from '../data/schemas/tags';
import type { BodyPart } from '../data/schemas/tags';
import type { IdPort } from '../ports/IdPort';
import { err, ok, type Result } from './errors';
import type { ExerciseQueryService } from './ExerciseQueryService';

/**
 * WorkoutBuilderService — 將「Plan / 用戶選擇」轉譯為 WorkoutDraft
 *
 * 對應 docs/05-domain-logic.md §9、docs/07-screen-flow.md §3.11a-b。
 *
 * Draft 是「未 persist」的中間態，給 PreWorkoutReview 頁面編輯後再丟給 WorkoutEngine.start。
 */

export type WorkoutDraftSource =
  | { kind: 'from_plan'; planId: string; planDayId: string }
  | { kind: 'ad_hoc'; targetBodyParts: BodyPart[] };

export type WorkoutDraftItem = {
  draftItemId: string;
  exerciseId: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  notes?: string;
  source: 'from_plan' | 'added_during_session' | 'swapped' | 'ad_hoc_initial';
  swappedFromExerciseId?: string;
  isSwappable: boolean;
  swapScope: 'same_muscle' | 'same_body_part' | 'any';
};

export type WorkoutDraft = {
  source: WorkoutDraftSource;
  name: string;
  items: WorkoutDraftItem[];
};

export class WorkoutBuilderService {
  constructor(
    private deps: {
      planRepo: PlanRepository;
      exerciseRepo: ExerciseRepository;
      settingsRepo: SettingsRepository;
      exerciseQuery: ExerciseQueryService;
      idGen: IdPort;
    },
  ) {}

  /** 從 Plan 建立 draft */
  async buildFromPlan(input: { planId: string; planDayId: string }): Promise<Result<WorkoutDraft>> {
    const plan = await this.deps.planRepo.get(input.planId);
    if (!plan) return err({ code: 'PLAN_NOT_FOUND', planId: input.planId });

    const day = plan.days.find((d) => d.id === input.planDayId);
    if (!day) return err({ code: 'PLAN_DAY_NOT_FOUND', planDayId: input.planDayId });

    const items: WorkoutDraftItem[] = day.exercises.map((pe) => ({
      draftItemId: this.deps.idGen.next('we'),
      exerciseId: pe.exerciseId,
      targetSets: pe.targetSets,
      targetRepsMin: pe.targetRepsMin,
      targetRepsMax: pe.targetRepsMax,
      restSeconds: pe.restSeconds,
      notes: pe.notes,
      source: 'from_plan',
      isSwappable: pe.isSwappable,
      swapScope: pe.swapScope,
    }));

    return ok({
      source: { kind: 'from_plan', planId: plan.id, planDayId: day.id },
      name: day.name,
      items,
    });
  }

  /** 從 ad-hoc 啟動建立 draft（智慧推薦） */
  async buildAdHoc(input: {
    targetBodyParts: BodyPart[];
    suggestedCount: number;
    name?: string;
  }): Promise<Result<WorkoutDraft>> {
    if (input.targetBodyParts.length === 0) {
      return err({ code: 'AD_HOC_REQUIRES_BODY_PARTS' });
    }
    const settings = await this.deps.settingsRepo.get('local');
    const picked = await this.deps.exerciseQuery.pickForBodyParts({
      bodyParts: input.targetBodyParts,
      count: input.suggestedCount,
    });

    const items: WorkoutDraftItem[] = picked.map((ex) => {
      const defaults = defaultsByDifficulty(ex.difficulty);
      // full_body 動作強制保護
      if (ex.bodyPart === 'full_body') {
        defaults.repsMax = Math.min(defaults.repsMax, 8);
        defaults.restSeconds = Math.max(defaults.restSeconds, 120);
      }
      return {
        draftItemId: this.deps.idGen.next('we'),
        exerciseId: ex.id,
        targetSets: defaults.sets,
        targetRepsMin: defaults.repsMin,
        targetRepsMax: defaults.repsMax,
        restSeconds: settings?.defaultRestSeconds ?? defaults.restSeconds,
        source: 'ad_hoc_initial',
        isSwappable: true,
        swapScope: 'same_muscle',
      };
    });

    return ok({
      source: { kind: 'ad_hoc', targetBodyParts: input.targetBodyParts },
      name: input.name ?? buildAdHocName(input.targetBodyParts),
      items,
    });
  }

  /** 從一組「用戶自己挑的」exercise IDs 建立 draft */
  async buildAdHocFromPicked(input: {
    targetBodyParts: BodyPart[];
    exerciseIds: string[];
    name?: string;
  }): Promise<Result<WorkoutDraft>> {
    if (input.targetBodyParts.length === 0) {
      return err({ code: 'AD_HOC_REQUIRES_BODY_PARTS' });
    }
    const settings = await this.deps.settingsRepo.get('local');
    const exercises = await this.deps.exerciseRepo.getMany(input.exerciseIds);

    const items: WorkoutDraftItem[] = exercises.map((ex) => {
      const defaults = defaultsByDifficulty(ex.difficulty);
      if (ex.bodyPart === 'full_body') {
        defaults.repsMax = Math.min(defaults.repsMax, 8);
        defaults.restSeconds = Math.max(defaults.restSeconds, 120);
      }
      return {
        draftItemId: this.deps.idGen.next('we'),
        exerciseId: ex.id,
        targetSets: defaults.sets,
        targetRepsMin: defaults.repsMin,
        targetRepsMax: defaults.repsMax,
        restSeconds: settings?.defaultRestSeconds ?? defaults.restSeconds,
        source: 'ad_hoc_initial',
        isSwappable: true,
        swapScope: 'same_muscle',
      };
    });
    return ok({
      source: { kind: 'ad_hoc', targetBodyParts: input.targetBodyParts },
      name: input.name ?? buildAdHocName(input.targetBodyParts),
      items,
    });
  }

  // ===== Draft operations (純函式) ========================================

  addToDraft(
    draft: WorkoutDraft,
    item: Omit<WorkoutDraftItem, 'draftItemId'>,
    atIndex?: number,
  ): WorkoutDraft {
    const newItem: WorkoutDraftItem = { ...item, draftItemId: this.deps.idGen.next('we') };
    const items = [...draft.items];
    if (atIndex == null || atIndex >= items.length) {
      items.push(newItem);
    } else {
      items.splice(atIndex, 0, newItem);
    }
    return { ...draft, items };
  }

  removeFromDraft(draft: WorkoutDraft, draftItemId: string): WorkoutDraft {
    return { ...draft, items: draft.items.filter((i) => i.draftItemId !== draftItemId) };
  }

  swapInDraft(draft: WorkoutDraft, draftItemId: string, newExerciseId: string): WorkoutDraft {
    return {
      ...draft,
      items: draft.items.map((i) =>
        i.draftItemId === draftItemId
          ? { ...i, exerciseId: newExerciseId, source: 'swapped', swappedFromExerciseId: i.exerciseId }
          : i,
      ),
    };
  }

  reorderDraft(draft: WorkoutDraft, fromIndex: number, toIndex: number): WorkoutDraft {
    const items = [...draft.items];
    if (fromIndex < 0 || fromIndex >= items.length) return draft;
    if (toIndex < 0 || toIndex >= items.length) return draft;
    const [moved] = items.splice(fromIndex, 1);
    if (moved) items.splice(toIndex, 0, moved);
    return { ...draft, items };
  }
}

// ===== Helpers =============================================================

function defaultsByDifficulty(d: Difficulty): {
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
} {
  switch (d) {
    case 'beginner':
      return { sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 };
    case 'intermediate':
      return { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 };
    case 'advanced':
      return { sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 };
  }
}

const BODY_PART_LABEL: Record<BodyPart, string> = {
  chest: '胸',
  back: '背',
  shoulders: '肩',
  arms: '手臂',
  legs: '腿',
  core: '核心',
  full_body: '全身',
};

function buildAdHocName(bodyParts: BodyPart[]): string {
  const labels = bodyParts.map((bp) => BODY_PART_LABEL[bp]);
  return `自由訓練：${labels.join(' + ')}`;
}
