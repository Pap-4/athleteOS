import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { subscribe } from '../src/platform/events.js'
import { prisma } from '../src/platform/prisma.js'
import { macroPercent } from '../src/modules/nutrition/service.js'

const app = createApp()
const api = request(app)

// Unique per run: tests never delete other people's rows, and never clash.
const run = Date.now().toString(36)
let n = 0
async function newUser() {
  const email = `user${run}${n++}@example.com`
  const res = await api
    .post('/api/v1/auth/signup')
    .send({ email, password: 'correct horse battery', displayName: 'Test User' })
  expect(res.status).toBe(201)
  return { email, token: res.body.token as string, id: res.body.user.id as string }
}
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

const iso = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10)

afterAll(() => prisma.$disconnect())

describe('health', () => {
  it('reports ok when the database is reachable', async () => {
    const res = await api.get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})

describe('auth', () => {
  it('signs up, signs in, and returns the current user', async () => {
    const { email, token } = await newUser()

    const me = await api.get('/api/v1/auth/me').set(bearer(token))
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe(email)
    expect(me.body.user).not.toHaveProperty('passwordHash')

    const signIn = await api.post('/api/v1/auth/signin').send({ email, password: 'correct horse battery' })
    expect(signIn.status).toBe(200)
    expect(signIn.body.token).toBeTruthy()
  })

  it('normalises email case and rejects duplicates', async () => {
    const { email } = await newUser()
    const res = await api
      .post('/api/v1/auth/signup')
      .send({ email: email.toUpperCase(), password: 'another long password', displayName: 'Dup' })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })

  it('validates sign-up input', async () => {
    const res = await api.post('/api/v1/auth/signup').send({ email: 'nope', password: 'short', displayName: '' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(3)
  })

  it('gives the same error for a wrong password and an unknown email', async () => {
    const { email } = await newUser()
    const wrong = await api.post('/api/v1/auth/signin').send({ email, password: 'wrong password!!' })
    const unknown = await api.post('/api/v1/auth/signin').send({ email: 'ghost@example.com', password: 'whatever123' })
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.body).toEqual(unknown.body)
  })

  it('rejects missing, malformed and tampered tokens', async () => {
    const { token } = await newUser()
    expect((await api.get('/api/v1/activities')).status).toBe(401)
    expect((await api.get('/api/v1/activities').set(bearer('garbage'))).status).toBe(401)
    expect((await api.get('/api/v1/activities').set(bearer(token + 'x'))).status).toBe(401)
  })

  it('soft-deletes: the user is deactivated, nothing is removed, every module stops serving them', async () => {
    const { token, email, id } = await newUser()
    await api
      .post('/api/v1/activities')
      .set(bearer(token))
      .send({ type: 'running', occurredOn: iso(), durationMinutes: 30, metrics: { distance: 5 } })

    expect((await api.delete('/api/v1/auth/me').set(bearer(token))).status).toBe(204)

    // Old token no longer works anywhere, and sign-in is refused.
    expect((await api.get('/api/v1/activities').set(bearer(token))).status).toBe(401)
    expect((await api.post('/api/v1/auth/signin').send({ email, password: 'correct horse battery' })).status).toBe(401)

    // ...but the data is still there.
    expect(await prisma.user.findUnique({ where: { id } })).toMatchObject({ isActive: false })
    expect(await prisma.session.count({ where: { userId: id } })).toBe(1)
  })
})

describe('activities', () => {
  it('logs a running activity and derives pace', async () => {
    const { token } = await newUser()
    const res = await api
      .post('/api/v1/activities')
      .set(bearer(token))
      .send({ type: 'running', occurredOn: iso(-1), durationMinutes: 45, metrics: { distance: 8, pace: 999 } })
    expect(res.status).toBe(201)
    expect(res.body.activity.metrics).toEqual({ distance: 8, duration: 45, pace: 5.63 })
  })

  it('logs a gym activity', async () => {
    const { token } = await newUser()
    const exercises = [
      { exercise: 'Bench Press', sets: 3, reps: 8, weight: 60 },
      { exercise: 'Squat', sets: 3, reps: 5, weight: 80 },
    ]
    const res = await api
      .post('/api/v1/activities')
      .set(bearer(token))
      .send({ type: 'gym', occurredOn: iso(), durationMinutes: 60, metrics: { exercises } })
    expect(res.status).toBe(201)
    expect(res.body.activity.metrics.exercises).toEqual(exercises)
  })

  it('rejects invalid metrics, unknown sports and far-future dates', async () => {
    const { token } = await newUser()
    const post = (body: object) => api.post('/api/v1/activities').set(bearer(token)).send(body)
    const base = { occurredOn: iso(), durationMinutes: 30 }

    expect((await post({ ...base, type: 'running', metrics: { distance: -1 } })).status).toBe(400)
    expect((await post({ ...base, type: 'running', metrics: {} })).status).toBe(400)
    expect((await post({ ...base, type: 'gym', metrics: { exercises: [] } })).status).toBe(400)
    expect((await post({ ...base, type: 'swimming', metrics: {} })).status).toBe(400)
    expect((await post({ ...base, type: 'running', occurredOn: iso(30), metrics: { distance: 5 } })).status).toBe(400)
    expect((await post({ ...base, type: 'running', occurredOn: '2026-13-45', metrics: { distance: 5 } })).status).toBe(400)
  })

  it('lists newest first, filters by sport, and paginates', async () => {
    const { token } = await newUser()
    const log = (body: object) => api.post('/api/v1/activities').set(bearer(token)).send(body)
    await log({ type: 'running', occurredOn: iso(-3), durationMinutes: 30, metrics: { distance: 5 } })
    await log({ type: 'gym', occurredOn: iso(-2), durationMinutes: 50, metrics: { exercises: [{ exercise: 'Deadlift', sets: 3, reps: 5, weight: 100 }] } })
    await log({ type: 'running', occurredOn: iso(-1), durationMinutes: 60, metrics: { distance: 10 } })

    const all = await api.get('/api/v1/activities').set(bearer(token))
    expect(all.body.activities.map((a: { occurredOn: string }) => a.occurredOn)).toEqual([iso(-1), iso(-2), iso(-3)])

    const runs = await api.get('/api/v1/activities?type=running').set(bearer(token))
    expect(runs.body.activities).toHaveLength(2)

    const page = await api.get('/api/v1/activities?limit=1&offset=1').set(bearer(token))
    expect(page.body.activities).toHaveLength(1)
    expect(page.body.activities[0].occurredOn).toBe(iso(-2))

    const range = await api.get(`/api/v1/activities?from=${iso(-2)}&to=${iso(-2)}`).set(bearer(token))
    expect(range.body.activities).toHaveLength(1)
  })

  it("never exposes another user's activities", async () => {
    const alice = await newUser()
    const bob = await newUser()
    const created = await api
      .post('/api/v1/activities')
      .set(bearer(alice.token))
      .send({ type: 'running', occurredOn: iso(), durationMinutes: 30, metrics: { distance: 5 } })
    const id = created.body.activity.id as string

    expect((await api.get(`/api/v1/activities/${id}`).set(bearer(bob.token))).status).toBe(404)
    expect((await api.delete(`/api/v1/activities/${id}`).set(bearer(bob.token))).status).toBe(404)
    expect((await api.get('/api/v1/activities').set(bearer(bob.token))).body.activities).toHaveLength(0)
    expect((await api.get(`/api/v1/activities/${id}`).set(bearer(alice.token))).status).toBe(200)
  })

  it('deletes an activity and returns 400 for a malformed id', async () => {
    const { token } = await newUser()
    const created = await api
      .post('/api/v1/activities')
      .set(bearer(token))
      .send({ type: 'running', occurredOn: iso(), durationMinutes: 30, metrics: { distance: 5 } })
    const id = created.body.activity.id as string
    expect((await api.delete(`/api/v1/activities/${id}`).set(bearer(token))).status).toBe(204)
    expect((await api.get(`/api/v1/activities/${id}`).set(bearer(token))).status).toBe(404)
    expect((await api.get('/api/v1/activities/not-a-uuid').set(bearer(token))).status).toBe(400)
  })

  it('a failing event handler cannot fail or roll back the write', async () => {
    const { token, id } = await newUser()
    const unsubscribe = subscribe('activity.logged', () => {
      throw new Error('Goals blew up')
    })
    try {
      const res = await api
        .post('/api/v1/activities')
        .set(bearer(token))
        .send({ type: 'running', occurredOn: iso(), durationMinutes: 30, metrics: { distance: 5 } })
      expect(res.status).toBe(201)
      expect(await prisma.session.count({ where: { userId: id } })).toBe(1)
    } finally {
      unsubscribe()
    }
  })
})

describe('nutrition', () => {
  it('logs entries and returns a daily list with totals and macro percentages', async () => {
    const { token } = await newUser()
    const day = iso(-1)
    const log = (body: object) => api.post('/api/v1/nutrition/entries').set(bearer(token)).send(body)

    const first = await log({ occurredOn: day, mealType: 'breakfast', name: 'Eggs on toast', calories: 400, proteinG: 25, carbsG: 30, fatG: 20 })
    expect(first.status).toBe(201)
    await log({ occurredOn: day, name: 'Chicken & rice', calories: 600, proteinG: 45, carbsG: 70, fatG: 12 })
    await log({ occurredOn: iso(-5), name: 'Other day', calories: 999, proteinG: 1, carbsG: 1, fatG: 1 })

    const res = await api.get(`/api/v1/nutrition/day?date=${day}`).set(bearer(token))
    expect(res.status).toBe(200)
    expect(res.body.entries).toHaveLength(2)
    expect(res.body.entries[1].mealType).toBe('snack') // default
    expect(res.body.totals).toEqual({ calories: 1000, proteinG: 70, carbsG: 100, fatG: 32 })
    const pct = res.body.macroPercent
    expect(pct.protein + pct.carbs + pct.fat).toBe(100)
  })

  it('returns zeros for an empty day', async () => {
    const { token } = await newUser()
    const res = await api.get(`/api/v1/nutrition/day?date=${iso(-2)}`).set(bearer(token))
    expect(res.body.entries).toEqual([])
    expect(res.body.totals).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 })
    expect(res.body.macroPercent).toEqual({ protein: 0, carbs: 0, fat: 0 })
  })

  it('validates entries and isolates users', async () => {
    const alice = await newUser()
    const bob = await newUser()
    const bad = await api.post('/api/v1/nutrition/entries').set(bearer(alice.token)).send({ occurredOn: iso(), name: '', calories: -5, proteinG: 1, carbsG: 1, fatG: 1 })
    expect(bad.status).toBe(400)

    const ok = await api.post('/api/v1/nutrition/entries').set(bearer(alice.token)).send({ occurredOn: iso(), name: 'Apple', calories: 95, proteinG: 0, carbsG: 25, fatG: 0 })
    const id = ok.body.entry.id as string
    expect((await api.delete(`/api/v1/nutrition/entries/${id}`).set(bearer(bob.token))).status).toBe(404)
    expect((await api.get(`/api/v1/nutrition/day?date=${iso()}`).set(bearer(bob.token))).body.entries).toHaveLength(0)
    expect((await api.delete(`/api/v1/nutrition/entries/${id}`).set(bearer(alice.token))).status).toBe(204)
  })

  it('macroPercent always sums to 100', () => {
    for (const [p, c, f] of [[1, 1, 1], [33, 33, 34], [150, 300, 70], [0, 0, 5], [7, 0, 0], [1, 2, 3]] as const) {
      const m = macroPercent(p, c, f)
      expect(m.protein + m.carbs + m.fat).toBe(100)
    }
    expect(macroPercent(0, 0, 0)).toEqual({ protein: 0, carbs: 0, fat: 0 })
  })
})

describe('analytics', () => {
  it('switches metric by sport: running -> distance, gym -> duration', async () => {
    const { token } = await newUser()
    const log = (body: object) => api.post('/api/v1/activities').set(bearer(token)).send(body)
    await log({ type: 'running', occurredOn: iso(), durationMinutes: 30, metrics: { distance: 5 } })
    await log({ type: 'running', occurredOn: iso(), durationMinutes: 60, metrics: { distance: 10.5 } })
    await log({ type: 'gym', occurredOn: iso(), durationMinutes: 55, metrics: { exercises: [{ exercise: 'Squat', sets: 3, reps: 5, weight: 80 }] } })

    const run = await api.get(`/api/v1/analytics/progress?sport=running&weeks=4&asOf=${iso()}`).set(bearer(token))
    expect(run.status).toBe(200)
    expect(run.body).toMatchObject({ sport: 'running', metric: 'distance', unit: 'km' })
    expect(run.body.points).toHaveLength(4)
    expect(run.body.points.at(-1).value).toBe(15.5)
    expect(run.body.points[0].value).toBe(0)

    const gym = await api.get(`/api/v1/analytics/progress?sport=gym&weeks=4&asOf=${iso()}`).set(bearer(token))
    expect(gym.body).toMatchObject({ sport: 'gym', metric: 'duration', unit: 'min' })
    expect(gym.body.points.at(-1).value).toBe(55)
  })

  it('buckets by Monday-based week and validates query params', async () => {
    const { token } = await newUser()
    // 2026-11-01 is a Sunday, 2026-11-02 a Monday: they belong to different weeks.
    const log = (occurredOn: string, distance: number) =>
      api.post('/api/v1/activities').set(bearer(token)).send({ type: 'running', occurredOn, durationMinutes: 30, metrics: { distance } })
    await log('2026-11-01', 4)
    await log('2026-11-02', 6)
    const res = await api.get('/api/v1/analytics/progress?sport=running&weeks=2&asOf=2026-11-03').set(bearer(token))
    expect(res.body.points).toEqual([
      { weekStart: '2026-10-26', value: 4 },
      { weekStart: '2026-11-02', value: 6 },
    ])

    expect((await api.get('/api/v1/analytics/progress').set(bearer(token))).status).toBe(400)
    expect((await api.get('/api/v1/analytics/progress?sport=swimming').set(bearer(token))).status).toBe(400)
    expect((await api.get('/api/v1/analytics/progress?sport=gym&weeks=500').set(bearer(token))).status).toBe(400)
  })
})

describe('error handling', () => {
  it('returns the standard error shape for unknown routes and bad JSON', async () => {
    const notFound = await api.get('/api/v1/nope')
    expect(notFound.status).toBe(404)
    expect(notFound.body.error.code).toBe('NOT_FOUND')

    const badJson = await api.post('/api/v1/auth/signin').set('Content-Type', 'application/json').send('{not json')
    expect(badJson.status).toBe(400)
    expect(badJson.body.error.code).toBe('BAD_REQUEST')
  })
})
