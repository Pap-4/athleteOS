import type { Request, RequestHandler } from 'express'
import { verifyToken } from '../modules/auth/contract.js'
import { unauthorized } from './errors.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

/** Checks the bearer token once, for every protected route. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined
  if (!token) throw unauthorized()

  const result = await verifyToken(token)
  if (!result) throw unauthorized('Invalid or expired token')

  req.userId = result.userId
  next()
}

/** The authenticated user's id. Only call on routes behind `requireAuth`. */
export function currentUserId(req: Request): string {
  if (!req.userId) throw unauthorized()
  return req.userId
}
