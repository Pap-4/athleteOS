import { pino } from 'pino'
import { pinoHttp } from 'pino-http'
import { config } from './config.js'

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
})

export const requestLogger = pinoHttp({ logger })
