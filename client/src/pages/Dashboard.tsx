import PlaceholderChart from '../components/PlaceholderChart'

const NUTRITION_TODAY = [
  { label: 'Protein', current: 97,   target: 150,  unit: 'g' },
  { label: 'Carbs',   current: 196,  target: 300,  unit: 'g' },
  { label: 'Fat',     current: 50,   target: 70,   unit: 'g' },
  { label: 'Water',   current: 1000, target: 2000, unit: 'ml' },
]

const RECENT_ACTIVITY = [
  { id: 1, date: 'Tue 6 Oct', type: 'Run', summary: '8 km in 45 min' },
  { id: 2, date: 'Mon 5 Oct', type: 'Gym', summary: 'Bench Press, Overhead Press, Incline Press' },
  { id: 3, date: 'Sat 3 Oct', type: 'Run', summary: '10 km in 59 min' },
]

export default function Dashboard() {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[2fr_1fr]">
      {/* Left: Dashboard (graph on top, recent activity below) */}
      <section className="border border-gray-300 p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="mt-4 border-b border-gray-300 pb-6">
          <p className="text-sm text-gray-500">Running distance (sample data)</p>
          <PlaceholderChart />
        </div>

        <div className="pt-6">
          <h2 className="text-xl font-semibold">Recent activity</h2>
          <ul className="mt-4 divide-y divide-gray-200">
            {RECENT_ACTIVITY.map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-4 py-3">
                <span>
                  {a.date}: {a.type}
                </span>
                <span className="text-gray-500">{a.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Right: Goals on top, Nutrition below */}
      <div className="grid gap-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Goals</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Run 20 km this week</li>
            <li>Gym 3 times this week</li>
            <li>Hit 150 g protein each day</li>
          </ul>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Nutrition</h2>
          <ul className="mt-4 space-y-4">
            {NUTRITION_TODAY.map((n) => {
              const pct = Math.min(100, (n.current / n.target) * 100)
              return (
                <li key={n.label}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{n.label}</span>
                    <span className="text-gray-500">
                      {n.current}/{n.target}{n.unit}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </main>
  )
}