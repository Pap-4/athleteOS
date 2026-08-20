# AthleteOS Build Roadmap

A Plan to work from and tick off as development progresses

## Phase 0 - Planning

- [X] **Problem Statement** - Paragraph on what AtheteOS solves and target audience. (README file)

- [ ] **Architecture Diagram** - Client -> API (Authentication/Activities/Nutrition/Analytics etc) -> Postgres, any future integrations

- [ ] **Entity Relationshop Diagram (ERD)** - Entites with attributes with clear connections

- [ ] **Domain Model v1** - Users / Activities (with 'type' + 'jsonb metrics') / Nutrition Entries / Goals


- [ ] **Minimum Viable Product (MVP) Scope** - Begin with two sport types (running + gym) - continuous metrics (sets/reps/etc), + basic nutrition logging and a single progress chart. 

## Phase 1 - Infastructure 

- [ ] **Repo Structure** - Organise the repository with a base structure for future development (/client, /server /docs, etc)

- [ ] **Configuration** - TypeScript configs + ESLint in both client and server

- [ ] **Postgres** - Docker compose for local postgres

- [ ] **Translate Diagram** - Translate the Entity Relationship Diagram into a Prisma schema and run first migration

- [ ] **Bare CI Workflow** - lint + typecheck on push

- [ ] **Basic Deployment** - Deploy a skeleton and get something live (to be updated and redeployed as development progresses)

## Phase 2 - Vertical Slice

- [ ] **User Authentication** - Sign Up / Sign In 

- [ ] **Activity Log** - Log one activity type end to end: form -> API -> Database -> List View

- [ ] **Data Visualisation** - One Chart showing the activities trend over time 

## Phase 3 - Further Expansion

- [ ] **Second Sport Type** - Add the second MVP sport type (e.g gym)

- [ ] **Nutrition Logging** - Entry form + Daily list view

- [ ] **Goals** - Create and track goal progress

- [ ] **Cross Activity Analytics** - Progress view spanning multiple activities/sport types


## Phase 4 - Review/Test/Polish

- [ ] **Testing** - Core API Routes + at least one frontend flow

- [ ] **README** - Update README as a pitch, Problem Statement, Screenshots, Live Link, Decision Process etc.

## Phase 5 - Integrations

- [ ] **Strava** - Strava OAuth - requires subscription

- [ ] **Apple** - Apple Health App (Manual export/import)

- [ ] **Activities** - Remaining sport types (swim, bike, etc)