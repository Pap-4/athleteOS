import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/auth-context'
import { Field, FormError } from '../components/form'
import { inputClass, primaryButton } from '../lib/ui'

export default function AuthPage({ mode }: { mode: 'signin' | 'signup' }) {
  const { status, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  if (status === 'authed') return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'signup') await signUp(email, password, displayName)
      else await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const isSignUp = mode === 'signup'
  return (
    <main className="mx-auto max-w-md p-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{isSignUp ? 'Create your account' : 'Sign in'}</h1>

        {isSignUp && (
          <Field label="Name">
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              required
              maxLength={80}
            />
          </Field>
        )}
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password" hint={isSignUp ? 'At least 8 characters.' : undefined}>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
            minLength={isSignUp ? 8 : undefined}
          />
        </Field>

        <FormError error={error} />

        <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
          {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-gray-500">
          {isSignUp ? 'Already have an account? ' : 'New here? '}
          <Link
            to={isSignUp ? '/login' : '/signup'}
            state={location.state}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </form>
    </main>
  )
}
