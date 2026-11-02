import { execSync } from 'node:child_process'

// Bring the test database up to date before the suite runs.
// Set SKIP_DB_MIGRATE=1 if you've already migrated it yourself.
export default function setup() {
  if (process.env.SKIP_DB_MIGRATE) return
  const url =
    process.env.TEST_DATABASE_URL ?? 'postgresql://athleteos:athleteos@localhost:5432/athleteos_test'
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  })
}
