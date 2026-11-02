import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api'

interface Settled<T> {
  key: string
  path: string
  data?: T
  error?: ApiError
}

/**
 * GET `path` and keep the result. Pass `null` to skip. While the path is
 * unchanged, a `reload()` keeps showing the previous data instead of flickering.
 */
export function useApi<T>(path: string | null) {
  const [nonce, setNonce] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const key = `${path}#${nonce}`

  useEffect(() => {
    if (path === null) return
    let cancelled = false
    api<T>(path)
      .then((data) => {
        if (!cancelled) setSettled({ key, path, data })
      })
      .catch((e: unknown) => {
        const error = e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', 'Something went wrong')
        if (!cancelled) setSettled({ key, path, error })
      })
    return () => {
      cancelled = true
    }
  }, [path, key])

  const current = settled !== null && settled.path === path ? settled : null
  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return {
    data: current?.data,
    error: current?.error,
    loading: path !== null && settled?.key !== key,
    reload,
  }
}
