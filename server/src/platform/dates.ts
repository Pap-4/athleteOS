// Calendar-date helpers. Dates are `YYYY-MM-DD` strings at the API boundary and
// UTC-midnight Date objects inside (what Prisma expects for @db.Date columns).

const DAY_MS = 86_400_000

export function parseDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`)
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function todayUtc(): Date {
  return parseDate(formatDate(new Date()))
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS)
}

/** Monday of the week containing `d` (weeks run Monday–Sunday). */
export function startOfWeek(d: Date): Date {
  const daysSinceMonday = (d.getUTCDay() + 6) % 7
  return addDays(d, -daysSinceMonday)
}
