import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { config } from '../../platform/config.js'
import { AppError, conflict, notFound } from '../../platform/errors.js'
import { publish } from '../../platform/events.js'
import * as repo from './repository.js'

export interface PublicUser {
  id: string
  email: string
  displayName: string
  createdAt: string
}

export interface AuthResult {
  user: PublicUser
  token: string
}

function toPublic(u: { id: string; email: string; displayName: string; createdAt: Date }): PublicUser {
  return { id: u.id, email: u.email, displayName: u.displayName, createdAt: u.createdAt.toISOString() }
}

function issueToken(userId: string): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    subject: userId,
    expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  }
  return jwt.sign({}, config.JWT_SECRET, options)
}

// Compared against when an email is unknown, so "no such user" and "wrong
// password" take about the same time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', config.bcryptCost)

export async function signUp(input: {
  email: string
  password: string
  displayName: string
}): Promise<AuthResult> {
  if (await repo.findByEmail(input.email)) throw conflict('An account with this email already exists')

  const passwordHash = await bcrypt.hash(input.password, config.bcryptCost)
  try {
    const user = await repo.createUser({ email: input.email, passwordHash, displayName: input.displayName })
    return { user: toPublic(user), token: issueToken(user.id) }
  } catch (err) {
    // Two sign-ups racing past the check above: the unique index decides.
    if (typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002') {
      throw conflict('An account with this email already exists')
    }
    throw err
  }
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const user = await repo.findByEmail(input.email)
  const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !ok || !user.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }
  return { user: toPublic(user), token: issueToken(user.id) }
}

/** Soft delete: the account is marked inactive, nothing is removed. */
export async function deactivate(userId: string): Promise<void> {
  const user = await repo.findById(userId)
  if (!user || !user.isActive) throw notFound('User')
  await repo.markInactive(userId)
  publish('user.deactivated', { userId })
}

// ── Public contract (re-exported by contract.ts) ──

export async function getUser(id: string): Promise<PublicUser | null> {
  const user = await repo.findById(id)
  return user?.isActive ? toPublic(user) : null
}

/** Returns the user id for a valid token belonging to an active user, else null. */
export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  let sub: unknown
  try {
    sub = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }).sub
  } catch {
    return null
  }
  if (typeof sub !== 'string') return null
  const user = await repo.findById(sub).catch(() => null)
  return user?.isActive ? { userId: user.id } : null
}
