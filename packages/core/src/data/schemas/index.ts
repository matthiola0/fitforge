// === Tag 系統 =============================================================
export {
  BODY_PARTS,
  MUSCLES,
  MUSCLE_TO_BODY_PART,
  MUSCLES_BY_BODY_PART,
  EQUIPMENT,
  DIFFICULTIES,
  musclesMatchBodyPart,
} from './tags';
export type { BodyPart, Muscle, Equipment, Difficulty } from './tags';

// === Entities ============================================================
export { ExerciseSchema } from './exercise.schema';
export type { Exercise } from './exercise.schema';

export {
  PlanSchema,
  PlanDaySchema,
  PlanExerciseSchema,
} from './plan.schema';
export type { Plan, PlanDay, PlanExercise } from './plan.schema';

export {
  WorkoutSchema,
  WorkoutExerciseSchema,
  SetSchema,
  WORKOUT_STATUSES,
  WORKOUT_MODES,
} from './workout.schema';
export type {
  Workout,
  WorkoutExercise,
  Set,
  WorkoutStatus,
  WorkoutMode,
} from './workout.schema';

export { SettingsSchema } from './settings.schema';
export type { Settings } from './settings.schema';

export {
  OnboardingProfileSchema,
  GOALS,
  TRAINING_FREQUENCIES,
  EQUIPMENT_PROFILES,
  EXPERIENCE_LEVELS,
  AGE_RANGES,
} from './onboarding.schema';
export type {
  OnboardingProfile,
  Goal,
  TrainingFrequency,
  EquipmentProfile,
  ExperienceLevel,
  AgeRange,
} from './onboarding.schema';
