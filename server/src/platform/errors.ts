import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { logger } from './logger.js'

/** Every API error leaves the server as `{ error: { code, message, details? } }`. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const unauthorized = (message = 'Authentication required') =>
  new AppError(401, 'UNAUTHORIZED', message)
export const notFound = (what = 'Resource') => new AppError(404, 'NOT_FOUND', `${what} not found`)
export const conflict = (message: string) => new AppError(409, 'CONFLICT', message)

function clientErrorStatus(err: unknown): number | undefined {
  // body-parser / http-errors style errors (malformed JSON, payload too large...)
  if (typeof err !== 'object' || err === null) return undefined
  const status = (err as { status?: unknown }).status
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`))
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    })
    return
  }

  const status = clientErrorStatus(err)
  if (status) {
    const message = err instanceof Error ? err.message : 'Bad request'
    res.status(status).json({ error: { code: 'BAD_REQUEST', message } })
    return
  }

  logger.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled error')
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } })
}
