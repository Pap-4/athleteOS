import { addDays, formatDate, parseDate, startOfWeek, todayUtc } from '../../platform/dates.js'
import { notFound } from '../../platform/errors.js'
import { publish } from '../../platform/events.js'
import * as repo from './repository.js'
import type {
  ActivityType,
  CreateActivityInput,
  GymMetrics,
  RunningMetrics,
} from './schemas.js'

export interface ActivityDto {
  id: string
  type: ActivityType
  occurredOn: string
  durationMinutes: number
  metrics: RunningMetrics | GymMetrics
  source: string
  createdAt: string
}

export interface ActivityRange {
  type?: ActivityType
  from?: string // YYYY-MM-DD, inclusive
  to?: string // YYYY-MM-DD, inclusive
}

export interface WeeklyTotals {
  weekStart: string // Monday, YYYY-MM-DD
  sessions: number
  distanceKm: number
  durationMinutes: number
}

type Row = Awaited<ReturnType<typeof repo.create>>

function toDto(row: Row): ActivityDto {
  return {
    id: row.id,
    type: row.type as ActivityType,
    occurredOn: formatDate(row.occurredOn),
    durationMinutes: row.durationMinutes,
    // We only ever write the shapes in schemas.ts, so this cast is safe.
    metrics: row.metrics as unknown as RunningMetrics | GymMetrics,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100

export async function logActivity(userId: string, input: CreateActivityInput): Promise<ActivityDto> {
  const metrics: RunningMetrics | GymMetrics =
    input.type === 'running'
      ? {
          distance: input.metrics.distance,
          duration: input.durationMinutes,
          pace: round2(input.durationMinutes / input.metrics.distance),
        }
      : { exercises: input.metrics.exercises }

  const row = await repo.create({
    userId,
    type: input.type,
    occurredOn: parseDate(input.occurredOn),
    durationMinutes: input.durationMinutes,
    metrics: metrics as unknown as object,
  })

  // After the write has committed. Subscribers (e.g. Goals, later) cannot fail it.
  publish('activity.logged', {
    userId,
    sessionId: row.id,
    type: row.type,
    occurredOn: formatDate(row.occurredOn),
  })
  return toDto(row)
}

export async function getActivity(userId: string, id: string): Promise<ActivityDto> {
  const row = await repo.findOwned(userId, id)
  if (!row) throw notFound('Activity')
  return toDto(row)
}

export async function deleteActivity(userId: string, id: string): Promise<void> {
  if (!(await repo.deleteOwned(userId, id))) throw notFound('Activity')
}

export async function listPage(
  userId: string,
  range: ActivityRange,
  page: { limit: number; offset: number },
): Promise<ActivityDto[]> {
  const rows = await repo.list(userId, toFilter(range), page)
  return rows.map(toDto)
}

function toFilter(range: ActivityRange): repo.SessionFilter {
  return {
    type: range.type,
    from: range.from ? parseDate(range.from) : undefined,
    to: range.to ? parseDate(range.to) : undefined,
  }
}

// ── Public contract (re-exported by contract.ts) ──

export async function listForUser(userId: string, range: ActivityRange = {}): Promise<ActivityDto[]> {
  return (await repo.list(userId, toFilter(range))).map(toDto)
}

/**
 * Weekly totals for the last `weeks` weeks (Monday-based), oldest first, with
 * empty weeks included as zeros so charts get a continuous x axis. `asOf` is
 * the caller's "today" (YYYY-MM-DD); it defaults to today in UTC.
 */
export async function totalsByWeek(
  userId: string,
  opts: { type?: ActivityType; weeks?: number; asOf?: string } = {},
): Promise<WeeklyTotals[]> {
  const weeks = opts.weeks ?? 12
  const thisWeek = startOfWeek(opts.asOf ? parseDate(opts.asOf) : todayUtc())
  const firstWeek = addDays(thisWeek, -7 * (weeks - 1))

  const buckets = new Map<string, WeeklyTotals>()
  for (let i = 0; i < weeks; i++) {
    const weekStart = formatDate(addDays(firstWeek, 7 * i))
    buckets.set(weekStart, { weekStart, sessions: 0, distanceKm: 0, durationMinutes: 0 })
  }

  const rows = await repo.list(userId, {
    type: opts.type,
    from: firstWeek,
    to: addDays(thisWeek, 6),
  })
  for (const row of rows) {
    const bucket = buckets.get(formatDate(startOfWeek(row.occurredOn)))
    if (!bucket) continue
    bucket.sessions += 1
    bucket.durationMinutes += row.durationMinutes
    if (row.type === 'running') bucket.distanceKm += (row.metrics as unknown as RunningMetrics).distance
  }

  return [...buckets.values()].map((b) => ({ ...b, distanceKm: round2(b.distanceKm) }))
}
