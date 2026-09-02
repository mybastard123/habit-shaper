# Habit Shaper — Architecture

## Overview

A lightweight, containerized web application for building positive habits and breaking
negative ones through daily tracking, streaks, and weekly completion metrics.

## System diagram

```
                    ┌─────────────────────────────┐
                    │         Frontend            │
                    │    React + Vite (SPA)       │
                    │  served by nginx :3000      │
                    └──────────────┬──────────────┘
                                   │  HTTP (JSON)  JWT Bearer
                    ┌──────────────▼──────────────┐
                    │         Backend             │
                    │ Node.js + TypeScript +      │
                    │ Express :4000               │
                    └──────────────┬──────────────┘
                                   │  mysql2 (TCP)
                    ┌──────────────▼──────────────┐
                    │           MySQL :3306       │
                    │   schema applied on boot    │
                    └─────────────────────────────┘
```

## Stack decisions

| Layer    | Choice                  | Reason                                                                 |
|----------|-------------------------|------------------------------------------------------------------------|
| Frontend | React + Vite            | Required; Vite is fast and minimal for a lightweight SPA               |
| Backend  | Node.js + TypeScript + Express | Required stack; Express is minimal and well-understood            |
| Database | MySQL 8 (official image)| Required; run in a container, no local install                         |
| Auth     | bcrypt + jsonwebtoken    | No email verification required per spec; stateless JWT                 |
| DB access| mysql2                  | Thin, promise-based driver; raw SQL keeps logic explicit               |
| Migrations| SQL file + idempotent runner | `CREATE TABLE IF NOT EXISTS` applied on backend boot                |
| Reverse proxy / static | nginx (frontend image) | Serves the built SPA and proxies `/api` to the backend                 |

## Backend structure

```
backend/src/
├── index.ts            # entry point: connect DB, run migrations, start server
├── config.ts           # env-var loading
├── db/
│   ├── pool.ts         # mysql2 connection pool
│   └── migrate.ts      # idempotent schema bootstrap (runs on boot)
├── middleware/
│   ├── auth.ts         # JWT verification
│   └── error.ts        # central error handler
├── routes/
│   ├── auth.ts         # register / login
│   ├── habits.ts       # CRUD + complete + relapse + stats
│   └── goals.ts        # CRUD (linked to a habit)
└── services/
    ├── streaks.ts      # build streaks, break (clean) streaks, weekly rate
    └── validation.ts   # request body validation helpers
```

## API surface

| Method | Path                 | Auth | Purpose                                  |
|--------|----------------------|------|------------------------------------------|
| POST   | /api/auth/register   | –    | Create account (email + password)        |
| POST   | /api/auth/login      | –    | Login, returns JWT                       |
| GET    | /api/habits          | ✓    | List current user's habits               |
| POST   | /api/habits          | ✓    | Create habit (type: build \| break)      |
| GET    | /api/habits/:id      | ✓    | Habit detail with streak + weekly stats  |
| PUT    | /api/habits/:id      | ✓    | Edit habit                               |
| DELETE | /api/habits/:id      | ✓    | Remove habit (and its logs/goals)        |
| POST   | /api/habits/:id/complete | ✓ | Mark build habit completed for a date    |
| POST   | /api/habits/:id/relapse | ✓  | Record a relapse (breaks clean streak)   |
| GET    | /api/goals           | ✓    | List current user's goals                |
| POST   | /api/goals           | ✓    | Create goal linked to a habit            |
| PUT    | /api/goals/:id       | ✓    | Edit goal                                |
| DELETE | /api/goals/:id       | ✓    | Remove goal                              |

## Frontend structure

```
frontend/src/
├── main.tsx
├── App.tsx               # router + protected routes
├── api/client.ts         # fetch wrapper with JWT header
├── auth/AuthContext.tsx  # token storage + login/logout state
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx     # habits list, complete/relapse, streaks, weekly rate
│   └── Goals.tsx
└── components/
    ├── HabitCard.tsx
    └── WeeklyRate.tsx
```

## Infra

- Root `compose.yml` with three services: `db`, `backend`, `frontend`.
- Backend waits for `db` healthcheck before booting.
- Frontend image builds the SPA then serves it via nginx; `/api` is proxied
  to the backend so the app has a single origin and no CORS issues.
- Configuration via environment variables; only `.env.example` is committed.

## Security notes

- Passwords hashed with bcrypt (cost 10).
- JWT stored by the SPA in localStorage (acceptable for this lightweight scope).
- All habit/goal endpoints are scoped by `user_id` taken from the verified JWT.
- No secrets in the repo; secrets come from the environment.