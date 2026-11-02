import { Router, type Express } from 'express'
import { currentUserId, requireAuth } from '../../platform/auth-middleware.js'
import { idParam } from '../../platform/validate.js'
import { createEntryBody, dayQuery } from './schemas.js'
import * as service from './service.js'

const router = Router()
router.use(requireAuth)

router.post('/entries', async (req, res) => {
  const body = createEntryBody.parse(req.body)
  res.status(201).json({ entry: await service.logEntry(currentUserId(req), body) })
})

// One day's entries plus total macros and percentages. `date` defaults to today (UTC).
router.get('/day', async (req, res) => {
  const { date } = dayQuery.parse(req.query)
  res.json(await service.getDay(currentUserId(req), date))
})

router.delete('/entries/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  await service.deleteEntry(currentUserId(req), id)
  res.status(204).end()
})

export function registerNutrition(app: Express): void {
  app.use('/api/v1/nutrition', router)
}
