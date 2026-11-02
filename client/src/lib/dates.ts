/** Today's date in the user's own timezone, as YYYY-MM-DD (not UTC). */
export function localToday(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fromIso(iso: string): Date {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "Tue 6 Oct" */
export function formatDay(iso: string): string {
  return fromIso(iso)
    .toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(',', '')
}

/** "6 Oct" */
export function formatWeek(iso: string): string {
  return fromIso(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

/** 5.63 min/km -> "5:38 /km" */
export function formatPace(minPerKm: number): string {
  let mins = Math.floor(minPerKm)
  let secs = Math.round((minPerKm - mins) * 60)
  if (secs === 60) {
    mins += 1
    secs = 0
  }
  return `${mins}:${String(secs).padStart(2, '0')} /km`
}
