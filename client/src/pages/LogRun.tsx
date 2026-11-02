import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Field, FormError } from '../components/form'
import { api } from '../lib/api'
import { formatPace, localToday } from '../lib/dates'
import { inputClass, primaryButton, secondaryButton } from '../lib/ui'

export default function LogRun() {
  const navigate = useNavigate()
  const today = localToday()
  const [occurredOn, setOccurredOn] = useState(today)
  const [distance, setDistance] = useState('')
  const [minutes, setMinutes] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  const km = Number(distance)
  const mins = Number(minutes)
  const pace = km > 0 && mins > 0 ? formatPace(mins / km) : null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api('/api/v1/activities', {
        method: 'POST',
        body: { type: 'running', occurredOn, durationMinutes: mins, metrics: { distance: km } },
      })
      navigate('/')
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Log a run</h1>

        <Field label="Date">
          <input className={inputClass} type="date" value={occurredOn} max={today} required
            onChange={(e) => setOccurredOn(e.target.value)} />
        </Field>
        <Field label="Distance (km)">
          <input className={inputClass} type="number" inputMode="decimal" step="0.01" min="0.01"
            value={distance} required onChange={(e) => setDistance(e.target.value)} />
        </Field>
        <Field label="Duration (minutes)" hint={pace ? `Average pace: ${pace}` : undefined}>
          <input className={inputClass} type="number" inputMode="numeric" step="1" min="1"
            value={minutes} required onChange={(e) => setMinutes(e.target.value)} />
        </Field>

        <FormError error={error} />

        <div className="flex gap-3">
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? 'Saving…' : 'Save run'}
          </button>
          <Link to="/" className={secondaryButton}>Cancel</Link>
        </div>
      </form>
    </main>
  )
}
