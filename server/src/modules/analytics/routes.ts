import { Router, type Express } from 'express'
import { z } from 'zod'
import { currentUserId, requireAuth } from '../../platform/auth-middleware.js'
import { dateString } from '../../platform/validate.js'
import { ACTIVITY_TYPES } from '../activities/contract.js'
import * as service from './service.js'

const progressQuery = z.object({
  sport: z.enum(ACTIVITY_TYPES),
  weeks: z.coerce.number().int().min(1).max(52).default(12),
  // The caller's local "today", so users ahead of UTC (e.g. Melbourne) see the right current week.
  asOf: dateString.optional(),
})

const router = Router()
router.use(requireAuth)

router.get('/progress', async (req, res) => {
  const query = progressQuery.parse(req.query)
  res.json(await service.progress(currentUserId(req), query))
})

export function registerAnalytics(app: Express): void {
  app.use('/api/v1/analytics', router)
}
