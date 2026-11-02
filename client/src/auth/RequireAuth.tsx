import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './auth-context'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <p className="p-6 text-gray-500">Loading…</p>
  if (status === 'anon') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
