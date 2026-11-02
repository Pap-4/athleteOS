# AthleteOS API

Express + TypeScript + Prisma/Postgres, organised as a modular monolith
(see `../docs/architectureDocumentation.md`). One process, one database, one
Postgres schema per module.

```
src/
  app.ts, index.ts      host: starts Express, asks each module to register itself
  platform/             shared, deliberately thin: config, prisma, errors, logging, auth middleware, event bus
  modules/<name>/       routes.ts -> service.ts -> repository.ts, plus contract.ts (the public face)
prisma/schema.prisma    one file, tables grouped under auth / activity / nutrition / goals schemas
```

**The one rule:** a module may import another module's `contract.ts` and nothing else.

## Run it

```bash
docker compose up -d                 # from the repo root: Postgres on :5432 (+ an athleteos_test db)
cd server
cp .env.example .env                 # then set JWT_SECRET
npm install
npm run db:generate                  # generate the Prisma client
npm run db:migrate                   # apply migrations
npm run dev                          # http://localhost:4000
npm test                             # uses TEST_DATABASE_URL, migrates it first
```

## API (`/api/v1`, JSON; everything except sign-up/sign-in needs `Authorization: Bearer <token>`)

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup` | `{ email, password (8+), displayName }` -> `{ user, token }` |
| POST | `/auth/signin` | `{ email, password }` -> `{ user, token }` |
| GET | `/auth/me` | current user |
| DELETE | `/auth/me` | soft delete (deactivates; nothing is removed) |
| POST | `/activities` | `running`: `{ type, occurredOn, durationMinutes, metrics: { distance } }` (pace is derived); `gym`: `metrics: { exercises: [{ exercise, sets, reps, weight }] }` |
| GET | `/activities` | `?type=running\|gym&from=&to=&limit=&offset=`, newest first |
| GET / DELETE | `/activities/:id` | |
| POST | `/nutrition/entries` | `{ occurredOn, mealType?, name, quantity?, calories, proteinG, carbsG, fatG }` (macros are the entry's totals) |
| GET | `/nutrition/day` | `?date=YYYY-MM-DD` (default today): entries, totals, macro % of calories |
| DELETE | `/nutrition/entries/:id` | |
| GET | `/analytics/progress` | `?sport=running\|gym&weeks=12&asOf=YYYY-MM-DD`: weekly points, running -> distance (km), gym -> duration (min) |
| GET | `/health` (no prefix) | liveness + DB check |

Errors always look like `{ "error": { "code", "message", "details?" } }`.
Dates are `YYYY-MM-DD`. Pass `asOf` from the client's local date so users ahead
of UTC (e.g. Melbourne) see the right current week.

## Not built yet (per `docs/mvp-scope.md`)

Goals module (Phase 3; its tables are in the schema), `macroTrend`, saved
foods, water tracking, Strava/Apple integrations. The `activity.logged` event is
already published, so Goals can subscribe without touching Activities.
