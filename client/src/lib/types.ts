// Mirrors the API responses (see server/README.md).

export type Sport = 'running' | 'gym'

export interface User {
  id: string
  email: string
  displayName: string
}

export interface RunningMetrics {
  distance: number // km
  duration: number // minutes
  pace: number // minutes per km
}

export interface GymExercise {
  exercise: string
  sets: number
  reps: number
  weight: number // kg
}

export interface GymMetrics {
  exercises: GymExercise[]
}

interface ActivityBase {
  id: string
  occurredOn: string // YYYY-MM-DD
  durationMinutes: number
  createdAt: string
}

export type Activity =
  | (ActivityBase & { type: 'running'; metrics: RunningMetrics })
  | (ActivityBase & { type: 'gym'; metrics: GymMetrics })

export interface ProgressSeries {
  sport: Sport
  metric: 'distance' | 'duration'
  unit: 'km' | 'min'
  points: { weekStart: string; value: number }[]
}

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export interface NutritionEntry {
  id: string
  name: string
  mealType: MealType
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface NutritionDay {
  date: string
  entries: NutritionEntry[]
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number }
  macroPercent: { protein: number; carbs: number; fat: number }
}
