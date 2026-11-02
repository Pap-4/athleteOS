import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`)
  throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`)
}

export const config = {
  ...parsed.data,
  isTest: parsed.data.NODE_ENV === 'test',
  isProd: parsed.data.NODE_ENV === 'production',
  // Cheap hashing in tests so the suite stays fast; strong everywhere else.
  bcryptCost: parsed.data.NODE_ENV === 'test' ? 4 : 12,
}
