import { createApp } from './app.js'
import { config } from './platform/config.js'
import { logger } from './platform/logger.js'
import { prisma } from './platform/prisma.js'

const server = createApp().listen(config.PORT, () => {
  logger.info(`AthleteOS API listening on :${config.PORT} (${config.NODE_ENV})`)
})

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`)
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
