import { createContext, useContext } from 'react'
import type { User } from '../lib/types'

export interface AuthValue {
  user: User | null
  status: 'loading' | 'authed' | 'anon'
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
