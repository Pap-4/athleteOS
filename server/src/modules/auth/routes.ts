import { Router, type Express } from 'express'
import { z } from 'zod'
import { currentUserId, requireAuth } from '../../platform/auth-middleware.js'
import { unauthorized } from '../../platform/errors.js'
import * as service from './service.js'

const email = z.string().trim().toLowerCase().pipe(z.email())

const signUpBody = z.object({
  email,
  // bcrypt only uses the first 72 bytes, so refuse longer passwords rather than truncate silently.
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((p) => Buffer.byteLength(p) <= 72, 'Password must be at most 72 bytes'),
  displayName: z.string().trim().min(1).max(80),
})

const signInBody = z.object({ email, password: z.string().min(1) })

const router = Router()

router.post('/signup', async (req, res) => {
  const body = signUpBody.parse(req.body)
  res.status(201).json(await service.signUp(body))
})

router.post('/signin', async (req, res) => {
  const body = signInBody.parse(req.body)
  res.json(await service.signIn(body))
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await service.getUser(currentUserId(req))
  if (!user) throw unauthorized()
  res.json({ user })
})

// "Deleting" an account deactivates it; every module stops serving the user.
router.delete('/me', requireAuth, async (req, res) => {
  await service.deactivate(currentUserId(req))
  res.status(204).end()
})

export function registerAuth(app: Express): void {
  app.use('/api/v1/auth', router)
}
