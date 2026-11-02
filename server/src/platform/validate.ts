import { z } from 'zod'
import { parseDate, todayUtc, addDays } from './dates.js'

/** `YYYY-MM-DD` calendar date. */
export const dateString = z.iso.date()

/**
 * A date a user may log against: not later than tomorrow (UTC), so a client
 * that is already on the next calendar day (e.g. Melbourne) isn't rejected.
 */
export const loggableDate = dateString.refine(
  (s) => parseDate(s) <= addDays(todayUtc(), 1),
  'Date cannot be in the future',
)

export const idParam = z.object({ id: z.uuid() })
