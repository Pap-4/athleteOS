import { defineConfig } from 'vitest/config'

// Tests write real rows, so they use their own database (never DATABASE_URL).
const testDb =
  process.env.TEST_DATABASE_URL ?? 'postgresql://athleteos:athleteos@localhost:5432/athleteos_test'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: testDb,
      TEST_DATABASE_URL: testDb,
      JWT_SECRET: 'test-secret-test-secret-test-secret-0123456789',
    },
  },
})
