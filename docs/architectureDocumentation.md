# AthleteOS — Architecture Documentation

**Pattern:** Modular monolith
**Processes:** 1 · **Deploys:** 1 · **Modules:** 5 · **Databases:** 1 (schema per module)

## Summary

AthleteOS is one deployable application and one database — not microservices. What makes it "modular" is what comes first when organizing the code: instead of horizontal layers (one `routes/` folder, one `services/` folder, one `data/` folder spanning the whole app) with modules living inside them, each module is a vertical slice that owns its own routes, business logic, data access, and database schema, and exposes a small public contract to everyone else. Same app, same platform, same database — the difference is purely how the code is organized and what's allowed to depend on what.

## Layered vs. modular

Both approaches produce a working app; they differ in what a change costs.

- **Folders.** Layered groups files by technical role — all controllers together, all services together. Modular groups by feature — everything about Nutrition lives in one folder.
- **Adding a feature.** In a layered app, a new feature touches four existing folders. In a modular app, it adds one new folder and one line registering it with the host — Goals joining the system is exactly this.
- **Talking across features.** Layered lets any service call any other service directly, because they all live in the same folder. Modular limits a module to calling another module's *public contract* — never its routes, services, or repository files directly.
- **Data.** Layered typically shares one schema freely across all tables. Modular gives each module its own Postgres schema and forbids cross-schema joins — a module can't write a query that reaches into another module's tables, even though they're physically in the same database.

## Entry — the application host

The host starts Express, then asks each module to register itself:

```
registerAuth(app)
registerActivities(app)
registerNutrition(app)
registerGoals(app)
registerAnalytics(app)
```

Each module mounts its own routes under `/api/v1` from inside that one function call. Adding a sixth module means adding one new folder and one new line here — nothing else in the host changes.

## The core — modules

Each module is a small, self-contained application living in its own folder under `/server/modules`. Internally it's layered (`routes.ts` → `service.ts` → `repository.ts`), but that internal layering is private — nothing outside the module is allowed to see it. The only thing a module exposes to the rest of the system is its **public contract**: a short, explicit list of functions.

### Auth
Accounts and tokens.
- **Public contract:** `getUser(id)`, `verifyToken(t)`
- **Calls:** nothing — self-contained
- **Owns schema:** `auth.users`

### Activities
Sessions across every sport.
- **Public contract:** `listForUser(id, range)`, `totalsByWeek(id)`
- **Calls:** nothing — self-contained
- **Owns schema:** `activity.sessions` (sport-specific fields stored as `jsonb` on `metrics`)

### Nutrition
Food entries and daily totals.
- **Public contract:** `dayTotals(id, date)`, `macroTrend(id)`
- **Calls:** nothing — self-contained
- **Owns schema:** `nutrition.entries`, `nutrition.foods`, `nutrition.water`

### Goals
Targets set by the athlete, and progress against them.
- **Public contract:** `createGoal(id, spec)`, `getActiveGoals(id)`, `checkProgress(id, goalId)`
- **Calls:** Activities and Nutrition, through their public contracts only
- **Owns schema:** `goals.targets`, `goals.progress_marks`

### Analytics
Progress charts. Recomputes on every request rather than storing anything.
- **Public contract:** consumer only — Analytics exposes nothing for other modules to call, since nothing is meant to depend on it
- **Calls:** Activities and Nutrition, through their public contracts only
- **Owns schema:** none — it stores nothing. If recomputing on every request ever becomes too slow, that's a caching decision to make later, not a sign the boundary is wrong.

## The one rule that holds it up

A module may import another module's public contract file, and nothing else. The moment one file reaches past that — importing another module's `service.ts` directly, or querying another module's tables — the boundaries stop being real, and this quietly becomes a layered monolith with extra folders instead of an actual modular one. Every other guarantee in this document (independent schemas, safe deletes, safe events) depends on this one rule holding.

## In-process events (event bus)

For the two places where a module needs to *react* to something rather than be *asked* for something, modules communicate through named events instead of direct calls:

- **`activity.logged`** → Goals re-checks progress on the athlete's active targets.
- **`user.deactivated`** → every module stops serving that user. Nothing is deleted.

The event bus runs in-process — this is plain function calls within the one running app, not a separate message queue or external service. One deliberate rule governs it: **a handler can never fail a write.** Handlers run *after* the publisher's transaction commits, each catching its own errors. Concretely: logging a workout and Goals re-checking progress against it are two separate steps. If a bug in Goals' progress-check code throws, the workout the athlete just logged is already saved — a failure in Goals cannot roll back an Activities write. Coupling the two at the transaction level would mean an unrelated bug in one module could block a completely different module's core function.

## Deleting a user is a soft delete

A hard delete fanned out across five modules can half-succeed — some modules clear their data, one fails, and the account is left in an inconsistent state, requiring cross-module coordination to fix. Marking the user inactive (`user.deactivated`) avoids the problem entirely instead of trying to coordinate around it. Every module stops serving that user; none of them delete anything.

## Shared platform code

`/server/platform` holds the code every module uses, and is deliberately kept thin — anything with an opinion about training or food belongs in a module, not here:

- **Auth middleware** — checks the token once, for every route, rather than each module re-implementing that check.
- **Prisma client** — one connection pool, and one shared `schema.prisma` file across all modules.
- **Config** — typed environment variables.
- **Logging** — request logs and error tracking.
- **Errors** — one handler, one response shape, so every module's API errors look the same to the client.

## Database

One PostgreSQL database, one named Postgres schema per module — the module boundary shows up in SQL itself, not only in application code:

| Schema | Tables |
|---|---|
| `auth` | `users` |
| `activity` | `sessions` (with `metrics` as `jsonb`) |
| `nutrition` | `entries`, `foods`, `water` |
| `goals` | `targets`, `progress_marks` |
| *(analytics)* | none — stores nothing |

The one seam in this story: Postgres enforces the schema boundary, but every module's tables are still defined in one shared `schema.prisma` file. That file is where the slices still overlap, even though the database itself keeps them apart.

## The trade

**What it buys:** you can work on one feature — Nutrition, say — without reading anything else, and any module could be lifted into its own service later without untangling it first, because the public-contract discipline already keeps it decoupled.

**What it costs:** more upfront structure than just writing everything into a handful of shared files, and losing free joins across features in code — Analytics and Goals both have to ask two other modules for data and combine the answers themselves rather than writing one query that joins across tables.

## Decisions this diagram makes

A running log of specific calls made and why, worth extending as more get made:

- **Deleting a user is a soft delete** — see above. Avoids a five-module coordination problem entirely rather than solving it.
- **Event handlers run after the commit** — see above. Keeps a bug in one module's reaction from being able to roll back another module's write.
- **Analytics keeps no store** — it asks the other modules and recomputes each time. If that gets slow later, that's a caching decision, not a boundary problem.
- **The Prisma schema stays shared** — Postgres enforces the schema-per-module boundary; the `.prisma` file itself is still one shared file everyone edits.
- **Foods are a personal library, not a shared catalog** — each user builds their own list of frequently-logged foods; there's no shared/global food database and no third-party food API in scope. Selecting a saved food pre-fills a nutrition entry's macros, but those values are captured at the time of logging rather than computed live from the food record — editing a saved food later doesn't retroactively change past entries.
- **Water is tracked in millilitres** — one canonical unit avoids conversion bugs between logging and display; the UI can present it however fits, but the database only ever stores millilitres.

## Related files
- `data-model.md` — ERD matching the current schema
- `GLOSSARY.md` — plain-language definitions of the terms used throughout this document
- `ROADMAP.md` — build order this architecture is being implemented against
