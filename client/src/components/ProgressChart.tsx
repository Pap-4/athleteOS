import { formatWeek } from '../lib/dates'

const W = 600
const H = 280
const PAD = 40

/** Round up to a tidy axis maximum (1, 2, 5, 10 × a power of ten). */
function niceMax(max: number): number {
  if (max <= 0) return 10
  const pow = 10 ** Math.floor(Math.log10(max))
  const n = max / pow
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
}

export default function ProgressChart({
  points,
  unit,
  label,
}: {
  points: { weekStart: string; value: number }[]
  unit: string
  label: string
}) {
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)))
  const x = (i: number) =>
    points.length < 2 ? W / 2 : PAD + (i / (points.length - 1)) * (W - PAD * 2)
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2)
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')
  const empty = points.every((p) => p.value === 0)
  const labelled = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="w-full">
        {[0, max / 2, max].map((v) => (
          <g key={v}>
            <line x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke="#e5e7eb" />
            <text x={PAD - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="#6b7280">
              {v}
            </text>
          </g>
        ))}
        <text x={PAD - 8} y={PAD - 14} textAnchor="end" fontSize="12" fill="#6b7280">
          {unit}
        </text>

        {points.map(
          (p, i) =>
            labelled.has(i) && (
              <text key={p.weekStart} x={x(i)} y={H - 12} textAnchor="middle" fontSize="12" fill="#6b7280">
                {formatWeek(p.weekStart)}
              </text>
            ),
        )}

        <polyline points={line} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.weekStart} cx={x(i)} cy={y(p.value)} r="4" fill="#4f46e5">
            <title>{`Week of ${formatWeek(p.weekStart)}: ${p.value} ${unit}`}</title>
          </circle>
        ))}
      </svg>
      {empty && (
        <p className="text-center text-sm text-gray-500">Nothing logged in this period yet.</p>
      )}
    </div>
  )
}
