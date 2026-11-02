import { useEffect, useState, type ReactNode } from 'react'
import { api, AUTH_EXPIRED_EVENT, tokenStore } from '../lib/api'
import type { User } from '../lib/types'
import { AuthContext, type AuthValue } from './auth-context'

interface AuthResponse {
  user: User
  token: string
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // With a saved token we start "loading" until /auth/me confirms it.
  const [status, setStatus] = useState<AuthValue['status']>(() =>
    tokenStore.get() ? 'loading' : 'anon',
  )

  useEffect(() => {
    if (status !== 'loading') return
    let cancelled = false
    api<{ user: User }>('/api/v1/auth/me')
      .then((r) => {
        if (cancelled) return
        setUser(r.user)
        setStatus('authed')
      })
      .catch(() => {
        if (cancelled) return
        tokenStore.set(null)
        setStatus('anon')
      })
    return () => {
      cancelled = true
    }
  }, [status])

  // The API rejected our token mid-session: drop it and go back to signed-out.
  useEffect(() => {
    function onExpired() {
      tokenStore.set(null)
      setUser(null)
      setStatus('anon')
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  function accept(r: AuthResponse) {
    tokenStore.set(r.token)
    setUser(r.user)
    setStatus('authed')
  }

  const value: AuthValue = {
    user,
    status,
    signIn: async (email, password) =>
      accept(await api<AuthResponse>('/api/v1/auth/signin', { method: 'POST', body: { email, password } })),
    signUp: async (email, password, displayName) =>
      accept(
        await api<AuthResponse>('/api/v1/auth/signup', {
          method: 'POST',
          body: { email, password, displayName },
        }),
      ),
    signOut: () => {
      tokenStore.set(null)
      setUser(null)
      setStatus('anon')
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
