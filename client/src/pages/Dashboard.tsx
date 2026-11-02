import { useState } from 'react'
import { FormError } from '../components/form'
import NutritionCard from '../components/NutritionCard'
import ProgressChart from '../components/ProgressChart'
import { formatDay, formatPace, localToday } from '../lib/dates'
import type { Activity, ProgressSeries, Sport } from '../lib/types'
import { useApi } from '../lib/useApi'

const SPORTS: { value: Sport; label: string }[] = [
  { value: 'running', label: 'Running' },
  { value: 'gym', label: 'Gym' },
]

function summary(a: Activity): string {
  if (a.type === 'running') {
    return `${a.metrics.distance} km in ${a.durationMinutes} min (${formatPace(a.metrics.pace)})`
  }
  const names = a.metrics.exercises.map((e) => e.exercise).join(', ')
  return `${names} · ${a.durationMinutes} min`
}

export default function Dashboard() {
  const [sport, setSport] = useState<Sport>('running')
  const progress = useApi<ProgressSeries>(
    `/api/v1/analytics/progress?sport=${sport}&weeks=12&asOf=${localToday()}`,
  )
  const recent = useApi<{ activities: Activity[] }>('/api/v1/activities?limit=10')

  return (
    <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[2fr_1fr]">
      {/* Left: progress chart on top, recent activity below */}
      <section className="border border-gray-300 bg-white p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="mt-4 border-b border-gray-300 pb-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              {sport === 'running' ? 'Weekly running distance' : 'Weekly gym time'}, last 12 weeks
            </p>
            <div role="group" aria-label="Sport" className="inline-flex overflow-hidden rounded-lg border border-gray-300 text-sm">
              {SPORTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={sport === s.value}
                  onClick={() => setSport(s.value)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    sport === s.value ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {progress.error && <FormError error={progress.error} />}
          {progress.data ? (
            <ProgressChart
              points={progress.data.points}
              unit={progress.data.unit}
              label={`${progress.data.metric} per week in ${progress.data.unit}`}
            />
          ) : (
            !progress.error && <p className="py-16 text-center text-sm text-gray-500">Loading chart…</p>
          )}
        </div>

        <div className="pt-6">
          <h2 className="text-xl font-semibold">Recent activity</h2>
          {recent.error && <FormError error={recent.error} />}
          {recent.loading && !recent.data && <p className="mt-4 text-sm text-gray-500">Loading…</p>}
          {recent.data && recent.data.activities.length === 0 && (
            <p className="mt-4 text-gray-500">No activities yet. Use “Log” in the menu to add your first run or gym session.</p>
          )}
          {recent.data && recent.data.activities.length > 0 && (
            <ul className="mt-4 divide-y divide-gray-200">
              {recent.data.activities.map((a) => (
                <li key={a.id} className="flex items-baseline justify-between gap-4 py-3">
                  <span>
                    {formatDay(a.occurredOn)}: {a.type === 'running' ? 'Run' : 'Gym'}
                  </span>
                  <span className="text-right text-gray-500">{summary(a)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Right: Goals on top, Nutrition below */}
      <div className="grid content-start gap-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Goals</h2>
          <p className="mt-4 text-sm text-gray-500">Goal tracking is coming soon.</p>
        </section>
        <NutritionCard />
      </div>
    </main>
  )
}
