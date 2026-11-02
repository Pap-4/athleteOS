import { z } from 'zod'
import { dateString, loggableDate } from '../../platform/validate.js'

export const ACTIVITY_TYPES = ['running', 'gym'] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

const durationMinutes = z.int().min(1).max(24 * 60)

const exercise = z.object({
  exercise: z.string().trim().min(1).max(100),
  sets: z.int().min(1).max(100),
  reps: z.int().min(1).max(1000),
  weight: z.number().min(0).max(1000), // kg; 0 = bodyweight
})

/** What a client sends. Running pace is derived server-side, never trusted. */
export const createActivityBody = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('running'),
    occurredOn: loggableDate,
    durationMinutes,
    metrics: z.object({ distance: z.number().positive().max(1000) }), // km
  }),
  z.object({
    type: z.literal('gym'),
    occurredOn: loggableDate,
    durationMinutes,
    metrics: z.object({ exercises: z.array(exercise).min(1).max(50) }),
  }),
])
export type CreateActivityInput = z.infer<typeof createActivityBody>

export const listActivitiesQuery = z.object({
  type: z.enum(ACTIVITY_TYPES).optional(),
  from: dateString.optional(),
  to: dateString.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

/** Stored shapes of `metrics` (see docs/mvp-scope.md). */
export interface RunningMetrics {
  distance: number // km
  duration: number // minutes
  pace: number // min per km
}
export interface GymMetrics {
  exercises: { exercise: string; sets: number; reps: number; weight: number }[]
}
