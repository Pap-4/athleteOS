const VALUES = [5, 5.5, 6, 5, 6.5, 7, 7.5, 8] // sample distances in km
const W = 600
const H = 280
const PAD = 40
const MAX = 10

export default function PlaceholderChart() {
  // Turn a data point into a pixel position on the canvas.
  const x = (i: number) => PAD + (i / (VALUES.length - 1)) * (W - PAD * 2)
  const y = (v: number) => H - PAD - (v / MAX) * (H - PAD * 2)

  const line = VALUES.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Sample chart of running distance in km over time"
      className="w-full"
    >
      {/* Horizontal gridlines with their values */}
      {[0, 5, 10].map((v) => (
        <g key={v}>
          <line x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke="#e5e7eb" />
          <text x={PAD - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="#6b7280">
            {v}
          </text>
        </g>
      ))}

      <text x={PAD - 8} y={PAD - 14} textAnchor="end" fontSize="12" fill="#6b7280">
        km
      </text>

      {/* The line, then a dot on each point */}
      <polyline
        points={line}
        fill="none"
        stroke="#4f46e5"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {VALUES.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="5" fill="#4f46e5" />
      ))}
    </svg>
  )
}