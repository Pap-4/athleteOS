# AthleteOS
Full Stack Fitness and Nutrition Dashboard - Personal Project

https://athleteos-hzpc.onrender.com/api/v1/health

Michael Papanikolaou

# AthleteOS - Problem Statement

## What problem does AthleteOS Solve

AthleteOS combines activities such as running, swimming, cycling, gym etc. with nutrition to form a centralised dashboard where athletes can log their workout, view sessions, and track their progress over time using visual charts. 

## Who is AthleteOS for
AthleteOS is targeted for the "active person" who will benefit from a diverse fitness dashboard, however it is not limited to those who enjoy raising their heart rate and is accessible for all. 

## Running the Application

### Prerequisites

- [Node.js](https://nodejs.org/) 24+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (runs the local Postgres database)

### First-time setup

```bash
# 1. Clone and install dependencies
git clone https://github.com/Pap-4/athleteOS.git
cd athleteOS
(cd server && npm install)
(cd client && npm install)

# 2. Start the database
docker compose up -d

# 3. Configure the server's environment
cd server
cp ../.env.example .env
```

Open `server/.env` and set both values:

```
DATABASE_URL="postgresql://athleteos:athleteos_dev@localhost:5432/athleteos"
JWT_SECRET="<any long random string, e.g. output of: openssl rand -hex 32>"
```

```bash
# 4. Generate the Prisma client and create the database tables
npx prisma generate
npx prisma migrate dev
```

### Day-to-day

Run each of these in its own terminal from the repo root:

| Terminal | Commands | Runs on |
|---|---|---|
| Database | `docker compose up -d` | localhost:5432 |
| Backend | `cd server && npm run dev` | http://localhost:3000 |
| Frontend | `cd client && npm run dev` | http://localhost:5173 |

Confirm the backend is up by opening http://localhost:3000/api/v1/health in your browser, or run:

```bash
curl http://localhost:3000/api/v1/health
# {"status":"ok"}
```

> **Note:** Opening http://localhost:3000 in a browser shows `Cannot GET /`. This is expected: the API only has routes under `/api/v1/`, so use the health check URL above to confirm it's running.

### Stopping

Press `Ctrl+C` in the backend and frontend terminals. To stop the database too, run `docker compose stop`. Your data is kept in a Docker volume, so it survives restarts.

### Troubleshooting

- **`Cannot find module '../generated/prisma/client'`**: run `npx prisma generate` inside `server/`.
- **`JWT_SECRET environment variable is not set`**: check that `server/.env` exists and contains `JWT_SECRET`.
- **Database connection errors**: make sure Docker Desktop is running and `docker compose ps` shows the `postgres` container as `Up`.