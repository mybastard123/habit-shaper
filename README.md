# Habit Shaper

A lightweight, web-based app to **build positive habits** and **break negative ones**
through daily tracking, streaks, and weekly completion metrics.

Built with **React** (frontend), **Node.js + TypeScript + Express** (backend), and
**MySQL** (database). The entire stack runs with **Docker Compose only** — no local
runtime or database installation required.

## Requirements

- [Docker](https://www.docker.com/products/docker-desktop/) with Docker Compose
  (Compose v2 ships with Docker Desktop)

That's it. No Node.js, no MySQL client, no additional toolchain.

## Quick start

```bash
# from the repository root
docker compose up -d --build
```

Then open the app:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/api

Database schema bootstrap (migrations) runs **automatically on first boot** — no manual
setup needed. Stop with:

```bash
docker compose down
```

To wipe all data and start completely fresh:

```bash
docker compose down -v
docker compose up -d --build
```

## Environment variables

Optional. The defaults in `compose.yml` make the app runnable out of the box. Copy
`.env.example` to `.env` to override secrets for a real deployment.

| Variable             | Default                    | Description                          |
|----------------------|----------------------------|--------------------------------------|
| `MYSQL_DATABASE`     | `habit_shaper`             | MySQL database name                  |
| `MYSQL_USER`         | `habit_user`               | MySQL application user               |
| `MYSQL_PASSWORD`     | `habit_pass`               | MySQL application password           |
| `MYSQL_ROOT_PASSWORD`| `root_pass_change_me`      | MySQL root password (set a real one) |
| `JWT_SECRET`         | `change_this_to_a_long_random_string` | Secret used to sign auth tokens |

**Never commit a real `.env`.** Only `.env.example` with placeholders is tracked.

## Features

### Habit building
- Create habits you want to build (meditate, exercise, read, learn Mandarin, …)
- Mark a habit as completed for each day
- Track **streaks** — consecutive days of completion
- Track **weekly completion** — days completed vs missed this week (Mon–Sun)

### Habit breaking
- Create habits you want to break (smoking, junk food, doomscrolling, …)
- Track **clean streaks** — consecutive days without the habit
- **Reset the streak** by recording a relapse

### Goals
- Add, edit, and remove goals
- Each goal is linked to a habit (build or break type)

### Accounts
- Register and log in with email + password (no email verification required)
- Passwords hashed with bcrypt; sessions via JWT

## API overview

| Method | Path                    | Auth | Description                          |
|--------|-------------------------|------|--------------------------------------|
| POST   | `/api/auth/register`    | –    | Register (email, password)           |
| POST   | `/api/auth/login`       | –    | Login, returns JWT                   |
| GET    | `/api/auth/me`          | ✓    | Current user                         |
| GET    | `/api/habits`           | ✓    | List habits with stats               |
| POST   | `/api/habits`           | ✓    | Create habit (`type`: build/break)   |
| GET    | `/api/habits/:id`       | ✓    | Habit detail with stats              |
| PUT    | `/api/habits/:id`       | ✓    | Edit habit (name, type)              |
| DELETE | `/api/habits/:id`       | ✓    | Delete habit                         |
| POST   | `/api/habits/:id/complete` | ✓ | Mark build habit completed (date)  |
| POST   | `/api/habits/:id/relapse`  | ✓ | Record relapse for break habit      |
| GET    | `/api/goals`            | ✓    | List goals                           |
| POST   | `/api/goals`            | ✓    | Create goal (title, habitId)         |
| PUT    | `/api/goals/:id`        | ✓    | Edit goal                            |
| DELETE | `/api/goals/:id`        | ✓    | Delete goal                          |

## Architecture

```
┌────────────┐    HTTP/JSON (JWT)   ┌────────────┐   mysql2   ┌─────────┐
│  Frontend  │ ───────────────────► │  Backend   │ ─────────► │  MySQL  │
│  React SPA │   nginx proxies      │ Express/TS │            │  8.0    │
│  :3000     │   /api → backend     │  :4000     │            │  :3306  │
└────────────┘                      └────────────┘            └─────────┘
```

- **Frontend** — React + Vite SPA, served by nginx. `/api` is proxied to the backend,
  giving a single origin (no CORS).
- **Backend** — Express + TypeScript. Idempotent `CREATE TABLE IF NOT EXISTS`
  migrations run automatically on boot. Streaks and weekly rates are computed from log
  rows on read, never stored.
- **Database** — official `mysql:8.0` image with a named volume for persistence.

### Time handling

The backend is timezone-agnostic and defaults to **GMT (UTC)**. The frontend sends the
user's local calendar date as a `today` reference (query/body param), so streak and
weekly-rate math always runs against the correct local day boundary no matter where the
app is opened. Dates are stored as plain `YYYY-MM-DD` strings.

### Project structure

```
├── compose.yml            # db + backend + frontend services
├── .env.example           # placeholder environment variables
├── docs/                  # planning: architecture, data model, task breakdown, agentic workflow
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── index.ts       # boot sequence: DB → migrations → server
│       ├── db/            # connection pool + schema.sql + migrate
│       ├── middleware/    # JWT auth, error handling
│       ├── routes/        # auth, habits, goals
│       └── services/      # streak + weekly-rate analytics
└── frontend/
    ├── Dockerfile         # multi-stage: build SPA → serve via nginx
    ├── nginx.conf
    └── src/
        ├── api/           # fetch client + types
        ├── auth/          # auth context (token, login/logout)
        ├── pages/         # Login, Register, Dashboard, Goals
        └── components/    # HabitCard, WeeklyRate
```

## Development (local, optional)

The containers are the source of truth, but you can run the pieces locally:

```bash
# backend on :4000 (requires a local MySQL or a running db container)
cd backend && npm install && npm run dev

# frontend on :5173 with /api proxied to localhost:4000
cd frontend && npm install && npm run dev

# backend tests (unit + smoke; no database required)
cd backend && npm test
```

## Verification

The full flow was verified end-to-end: register → create a build habit → complete past
days (streak + weekly rate) → create a break habit → record a relapse (clean streak
resets) → create/list goals → log back in. See `docker compose logs backend` for
migration output on first boot.