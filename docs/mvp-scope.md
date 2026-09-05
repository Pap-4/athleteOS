# AthleteOS — MVP Scope

**Phase:** 0 — Planning
**Goal:** The smallest version of AthleteOS that works end-to-end. One real user flow, fully working, before any other feature is added.

## Sport Types

Two sport types only for MVP:

- **Running**
- **Gym**

All other sport types (swim, bike, etc.) are deferred to Phase 5.

## Activity Metrics

Each activity is a row in `activity.sessions`, with sport specific numbers stored in the `metrics` `jsonb` field rather than one column per possible metric. For MVP, each sport needs a fixed, agreed shape:

- **Running** — distance, duration, pace
- **Gym** — exercise name, sets, reps, weight

Only these fields are required to log and display an activity. Anything beyond this (e.g. splits, RPE, heart rate zones) is out of scope until later phases.

## Nutrition Logging

Basic logging only:

- A simple entry form: food name + calories/macros for a single entry
- A daily list view of that day's entries
- total daily macros with percentages

Not included in MVP: a saved-food library, macro trend charts (`macroTrend`), or water tracking. These can be layered on top of the same `nutrition.entries` schema later without changing the MVP shape.

## Progress Visualisation

One chart only: activity trend over time (e.g. weekly volume or a chosen metric, per the Phase 2 "Data Visualisation" step). This chart can be built from Activities data alone, it does not need Nutrition or Goals to exist yet.

## Explicitly Out of Scope for MVP

These are real roadmap items, just not part of "does the app work end-to-end":

- Second sport type expansion beyond running + gym (Phase 3)
- Goals module and progress tracking (Phase 3)
- Cross activity analytics spanning multiple sports/modules (Phase 3)
- Strava OAuth, Apple Health import, remaining sport types (Phase 5)

## Definition of Done

MVP scope is complete once a single user can, in one sitting:

- [ ] Sign up / sign in
- [ ] Log a running activity and a gym activity
- [ ] See both activities in a list view
- [ ] Log a basic nutrition entry and see it in a daily list
- [ ] View one chart showing activity trend over time

Everything above maps directly onto Phase 2 ("Vertical Slice"). MVP scope is really just naming, in advance, what that vertical slice needs to contain.

## Related files
- `Roadmap.md` — build order this scope feeds into
- `architectureDocumentation.md` — module boundaries this scope operates within
- `data-model.md` — ERD the `metrics` shape above should match
- `Glossary.md` — plain-language definitions of terms used here
