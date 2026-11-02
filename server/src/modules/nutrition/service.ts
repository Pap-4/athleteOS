import { formatDate, parseDate, todayUtc } from '../../platform/dates.js'
import { notFound } from '../../platform/errors.js'
import * as repo from './repository.js'
import type { CreateEntryInput } from './schemas.js'

export interface EntryDto {
  id: string
  occurredOn: string
  mealType: string
  name: string
  quantity: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  createdAt: string
}

export interface DayTotals {
  date: string
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number }
  /** Share of macro calories (protein 4 kcal/g, carbs 4, fat 9). Whole numbers summing to 100, or all 0. */
  macroPercent: { protein: number; carbs: number; fat: number }
}

export interface DayView extends DayTotals {
  entries: EntryDto[]
}

type Row = Awaited<ReturnType<typeof repo.create>>

function toDto(r: Row): EntryDto {
  return {
    id: r.id,
    occurredOn: formatDate(r.occurredOn),
    mealType: r.mealType,
    name: r.name,
    quantity: r.quantity,
    calories: r.calories,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    createdAt: r.createdAt.toISOString(),
  }
}

/** Largest-remainder rounding so the three percentages always add up to 100. */
export function macroPercent(proteinG: number, carbsG: number, fatG: number): DayTotals['macroPercent'] {
  const kcal = { protein: proteinG * 4, carbs: carbsG * 4, fat: fatG * 9 }
  const total = kcal.protein + kcal.carbs + kcal.fat
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 }

  const keys = ['protein', 'carbs', 'fat'] as const
  const exact = keys.map((k) => ({ k, value: (kcal[k] / total) * 100 }))
  const out = { protein: 0, carbs: 0, fat: 0 }
  for (const e of exact) out[e.k] = Math.floor(e.value)

  let remaining = 100 - (out.protein + out.carbs + out.fat)
  const byRemainder = [...exact].sort((a, b) => b.value - Math.floor(b.value) - (a.value - Math.floor(a.value)))
  for (const e of byRemainder) {
    if (remaining <= 0) break
    out[e.k] += 1
    remaining -= 1
  }
  return out
}

function summarise(date: string, rows: Row[]): DayTotals {
  const totals = rows.reduce(
    (t, r) => ({
      calories: t.calories + r.calories,
      proteinG: t.proteinG + r.proteinG,
      carbsG: t.carbsG + r.carbsG,
      fatG: t.fatG + r.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  )
  return { date, totals, macroPercent: macroPercent(totals.proteinG, totals.carbsG, totals.fatG) }
}

export async function logEntry(userId: string, input: CreateEntryInput): Promise<EntryDto> {
  const row = await repo.create({ ...input, userId, occurredOn: parseDate(input.occurredOn) })
  return toDto(row)
}

export async function deleteEntry(userId: string, id: string): Promise<void> {
  if (!(await repo.deleteOwned(userId, id))) throw notFound('Entry')
}

export async function getDay(userId: string, date?: string): Promise<DayView> {
  const day = date ?? formatDate(todayUtc())
  const rows = await repo.listForDay(userId, parseDate(day))
  return { ...summarise(day, rows), entries: rows.map(toDto) }
}

// ── Public contract (re-exported by contract.ts) ──

export async function dayTotals(userId: string, date: string): Promise<DayTotals> {
  const rows = await repo.listForDay(userId, parseDate(date))
  return summarise(date, rows)
}
