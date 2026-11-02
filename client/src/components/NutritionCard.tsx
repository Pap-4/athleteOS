import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { localToday } from '../lib/dates'
import { inputClass, primaryButton } from '../lib/ui'
import { MEAL_TYPES, type MealType, type NutritionDay } from '../lib/types'
import { useApi } from '../lib/useApi'
import { Field, FormError } from './form'

const MACROS = [
  { key: 'protein', label: 'Protein', grams: 'proteinG', bar: 'bg-indigo-500' },
  { key: 'carbs', label: 'Carbs', grams: 'carbsG', bar: 'bg-sky-500' },
  { key: 'fat', label: 'Fat', grams: 'fatG', bar: 'bg-amber-500' },
] as const

const blank = { name: '', mealType: 'snack' as MealType, calories: '', proteinG: '', carbsG: '', fatG: '' }

export default function NutritionCard() {
  const today = localToday()
  const { data, error: loadError, loading, reload } = useApi<NutritionDay>(`/api/v1/nutrition/day?date=${today}`)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  const set = (patch: Partial<typeof blank>) => setForm((f) => ({ ...f, ...patch }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api('/api/v1/nutrition/entries', {
        method: 'POST',
        body: {
          occurredOn: today,
          name: form.name,
          mealType: form.mealType,
          calories: Number(form.calories),
          proteinG: Number(form.proteinG || 0),
          carbsG: Number(form.carbsG || 0),
          fatG: Number(form.fatG || 0),
        },
      })
      setForm(blank)
      setAdding(false)
      reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/v1/nutrition/entries/${id}`, { method: 'DELETE' })
      reload()
    } catch (err) {
      setError(err)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Nutrition today</h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            + Add food
          </button>
        )}
      </div>

      {loadError && <FormError error={loadError} />}
      {loading && !data && <p className="mt-4 text-sm text-gray-500">Loading…</p>}

      {data && (
        <>
          <p className="mt-3 text-3xl font-semibold">
            {data.totals.calories} <span className="text-base font-normal text-gray-500">kcal</span>
          </p>

          <ul className="mt-4 space-y-3">
            {MACROS.map((m) => (
              <li key={m.key}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-gray-500">
                    {data.totals[m.grams]} g · {data.macroPercent[m.key]}%
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-gray-100">
                  <div className={`h-2 rounded-full ${m.bar}`} style={{ width: `${data.macroPercent[m.key]}%` }} />
                </div>
              </li>
            ))}
          </ul>

          {data.entries.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Nothing logged today yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 text-sm">
              {data.entries.map((en) => (
                <li key={en.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    {en.name} <span className="text-gray-400">· {en.mealType}</span>
                  </span>
                  <span className="flex items-center gap-3 text-gray-500">
                    {en.calories} kcal
                    <button type="button" aria-label={`Delete ${en.name}`} onClick={() => remove(en.id)}
                      className="text-gray-400 hover:text-red-600">
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {adding && (
        <form onSubmit={onSubmit} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <Field label="Food">
            <input className={inputClass} value={form.name} required maxLength={120}
              onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Meal">
              <select className={inputClass} value={form.mealType}
                onChange={(e) => set({ mealType: e.target.value as MealType })}>
                {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Calories">
              <input className={inputClass} type="number" min="0" step="1" required value={form.calories}
                onChange={(e) => set({ calories: e.target.value })} />
            </Field>
            <Field label="Protein (g)">
              <input className={inputClass} type="number" min="0" step="1" value={form.proteinG} placeholder="0"
                onChange={(e) => set({ proteinG: e.target.value })} />
            </Field>
            <Field label="Carbs (g)">
              <input className={inputClass} type="number" min="0" step="1" value={form.carbsG} placeholder="0"
                onChange={(e) => set({ carbsG: e.target.value })} />
            </Field>
            <Field label="Fat (g)">
              <input className={inputClass} type="number" min="0" step="1" value={form.fatG} placeholder="0"
                onChange={(e) => set({ fatG: e.target.value })} />
            </Field>
          </div>
          <FormError error={error} />
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className={primaryButton}>{busy ? 'Saving…' : 'Add entry'}</button>
            <button type="button" onClick={() => { setAdding(false); setError(null) }}
              className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </form>
      )}
    </section>
  )
}
