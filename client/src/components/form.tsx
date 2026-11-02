import type { ReactNode } from 'react'
import { ApiError } from '../lib/api'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="mt-1">{children}</div>
      </label>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

/** Shows the API's message, plus any per-field problems it reported. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
  const details = error instanceof ApiError ? error.details : []
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <p className="font-medium">{message}</p>
      {details.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {details.map((d, i) => (
            <li key={i}>
              {d.path ? `${d.path}: ` : ''}
              {d.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
