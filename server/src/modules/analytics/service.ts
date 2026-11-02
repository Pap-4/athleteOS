// Analytics stores nothing: it asks other modules (through their public
// contracts only) and recomputes on every request.
import { totalsByWeek } from '../activities/contract.js'
import type { ActivityType } from '../activities/contract.js'

export interface ProgressSeries {
  sport: ActivityType
  metric: 'distance' | 'duration'
  unit: 'km' | 'min'
  points: { weekStart: string; value: number }[]
}

/**
 * The single MVP progress chart. It plots a different metric per sport because
 * distance and duration are what is meaningful for each: running -> distance,
 * gym -> duration (see docs/mvp-scope.md).
 */
export async function progress(
  userId: string,
  opts: { sport: ActivityType; weeks: number; asOf?: string | undefined },
): Promise<ProgressSeries> {
  const weekly = await totalsByWeek(userId, {
    type: opts.sport,
    weeks: opts.weeks,
    ...(opts.asOf ? { asOf: opts.asOf } : {}),
  })

  if (opts.sport === 'running') {
    return {
      sport: 'running',
      metric: 'distance',
      unit: 'km',
      points: weekly.map((w) => ({ weekStart: w.weekStart, value: w.distanceKm })),
    }
  }
  return {
    sport: 'gym',
    metric: 'duration',
    unit: 'min',
    points: weekly.map((w) => ({ weekStart: w.weekStart, value: w.durationMinutes })),
  }
}
