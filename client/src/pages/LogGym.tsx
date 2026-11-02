import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Field, FormError } from '../components/form'
import { api } from '../lib/api'
import { localToday } from '../lib/dates'
import { inputClass, primaryButton, secondaryButton } from '../lib/ui'

interface Row {
  key: number
  exercise: string
  sets: string
  reps: string
  weight: string
}

let nextKey = 1
const blankRow = (): Row => ({ key: nextKey++, exercise: '', sets: '3', reps: '8', weight: '' })

export default function LogGym() {
  const navigate = useNavigate()
  const today = localToday()
  const [occurredOn, setOccurredOn] = useState(today)
  const [minutes, setMinutes] = useState('')
  const [rows, setRows] = useState<Row[]>(() => [blankRow()])
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api('/api/v1/activities', {
        method: 'POST',
        body: {
          type: 'gym',
          occurredOn,
          durationMinutes: Number(minutes),
          metrics: {
            exercises: rows.map((r) => ({
              exercise: r.exercise,
              sets: Number(r.sets),
              reps: Number(r.reps),
              weight: Number(r.weight || 0),
            })),
          },
        },
      })
      navigate('/')
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Log a gym session</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <input className={inputClass} type="date" value={occurredOn} max={today} required
              onChange={(e) => setOccurredOn(e.target.value)} />
          </Field>
          <Field label="Duration (minutes)">
            <input className={inputClass} type="number" inputMode="numeric" step="1" min="1"
              value={minutes} required onChange={(e) => setMinutes(e.target.value)} />
          </Field>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-700">Exercises</h2>
          <ul className="mt-2 space-y-3">
            {rows.map((r, i) => (
              <li key={r.key} className="grid grid-cols-[1fr_4rem_4rem_5rem_auto] items-end gap-2">
                <Field label={i === 0 ? 'Exercise' : ''}>
                  <input className={inputClass} value={r.exercise} required maxLength={100}
                    placeholder="Bench Press" onChange={(e) => update(r.key, { exercise: e.target.value })} />
                </Field>
                <Field label={i === 0 ? 'Sets' : ''}>
                  <input className={inputClass} type="number" min="1" step="1" value={r.sets} required
                    onChange={(e) => update(r.key, { sets: e.target.value })} />
                </Field>
                <Field label={i === 0 ? 'Reps' : ''}>
                  <input className={inputClass} type="number" min="1" step="1" value={r.reps} required
                    onChange={(e) => update(r.key, { reps: e.target.value })} />
                </Field>
                <Field label={i === 0 ? 'Weight (kg)' : ''}>
                  <input className={inputClass} type="number" min="0" step="0.5" value={r.weight}
                    placeholder="0" onChange={(e) => update(r.key, { weight: e.target.value })} />
                </Field>
                <button type="button" aria-label={`Remove exercise ${i + 1}`}
                  disabled={rows.length === 1}
                  onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                  className="mb-1 rounded px-2 py-1 text-gray-400 hover:text-red-600 disabled:opacity-30">
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setRows((rs) => [...rs, blankRow()])}
            className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            + Add exercise
          </button>
        </div>

        <FormError error={error} />

        <div className="flex gap-3">
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? 'Saving…' : 'Save session'}
          </button>
          <Link to="/" className={secondaryButton}>Cancel</Link>
        </div>
      </form>
    </main>
  )
}
