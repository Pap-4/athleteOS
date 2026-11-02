import { Router, type Express } from 'express'
import { currentUserId, requireAuth } from '../../platform/auth-middleware.js'
import { idParam } from '../../platform/validate.js'
import { createActivityBody, listActivitiesQuery } from './schemas.js'
import * as service from './service.js'

const router = Router()
router.use(requireAuth)

router.post('/', async (req, res) => {
  const body = createActivityBody.parse(req.body)
  res.status(201).json({ activity: await service.logActivity(currentUserId(req), body) })
})

router.get('/', async (req, res) => {
  const { limit, offset, ...range } = listActivitiesQuery.parse(req.query)
  const activities = await service.listPage(currentUserId(req), range, { limit, offset })
  res.json({ activities, limit, offset })
})

router.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  res.json({ activity: await service.getActivity(currentUserId(req), id) })
})

router.delete('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  await service.deleteActivity(currentUserId(req), id)
  res.status(204).end()
})

export function registerActivities(app: Express): void {
  app.use('/api/v1/activities', router)
}
