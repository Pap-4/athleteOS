import { z } from 'zod'
import { dateString, loggableDate } from '../../platform/validate.js'

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

/**
 * Macros are the entry's totals as eaten (what the user typed), not per-unit
 * values. `quantity` is informational. Values are captured at log time.
 */
export const createEntryBody = z.object({
  occurredOn: loggableDate,
  mealType: z.enum(MEAL_TYPES).default('snack'),
  name: z.string().trim().min(1).max(120),
  quantity: z.number().positive().max(1000).default(1),
  calories: z.int().min(0).max(10_000),
  proteinG: z.int().min(0).max(1000),
  carbsG: z.int().min(0).max(1000),
  fatG: z.int().min(0).max(1000),
})
export type CreateEntryInput = z.infer<typeof createEntryBody>

export const dayQuery = z.object({ date: dateString.optional() })
