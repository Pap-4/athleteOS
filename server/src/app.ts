import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { registerActivities } from './modules/activities/routes.js'
import { registerAnalytics } from './modules/analytics/routes.js'
import { registerAuth } from './modules/auth/routes.js'
import { registerNutrition } from './modules/nutrition/routes.js'
import { config } from './platform/config.js'
import { errorHandler, notFoundHandler } from './platform/errors.js'
import { requestLogger } from './platform/logger.js'
import { prisma } from './platform/prisma.js'

/**
 * The application host: starts Express, then asks each module to register itself.
 * Goals (Phase 3) will be one more line here.
 */
export function createApp(): Express {
  const app = express()
  app.disable('x-powered-by')

  app.use(helmet())
  app.use(cors({ origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()) }))
  app.use(express.json({ limit: '100kb' }))
  app.use(requestLogger)

  // Liveness + database reachability, for deploy health checks.
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      res.json({ status: 'ok' })
    } catch {
      res.status(503).json({ status: 'unavailable' })
    }
  })

  registerAuth(app)
  registerActivities(app)
  registerNutrition(app)
  registerAnalytics(app)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
