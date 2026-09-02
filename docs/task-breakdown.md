# Habit Shaper — Task Breakdown

Estimated total: ~1.5–2 focused days. Ordered so the app is runnable end-to-end as
early as possible, and each step ends in a meaningful commit.

## Phase 0 — Planning (committed first, no code)

- [x] Repo init, `.gitignore`
- [x] `docs/architecture.md`
- [x] `docs/data-model.md`
- [ ] `docs/task-breakdown.md` (this file)
- [ ] First commit: `docs: initial planning (architecture, data model, tasks)`

## Phase 1 — Infra skeleton

- [ ] Root `compose.yml`: `db`, `backend`, `frontend` services
- [ ] `.env.example` with placeholder secrets + documented variables
- [ ] Backend `Dockerfile` (multi-stage: build TS → run node)
- [ ] Frontend `Dockerfile` (build SPA → serve with nginx)
- [ ] nginx config proxying `/api` → backend

## Phase 2 — Backend

- [ ] TS project setup (tsconfig, deps: express, mysql2, bcryptjs, jsonwebtoken)
- [ ] `db/pool.ts` + `db/migrate.ts` (idempotent schema from `schema.sql`)
- [ ] `middleware/auth.ts` (JWT verify) + `middleware/error.ts`
- [ ] `routes/auth.ts` — POST register, POST login
- [ ] `routes/habits.ts` — CRUD
- [ ] `routes/habits.ts` — POST complete (build), POST relapse (break)
- [ ] `services/streaks.ts` — build streak, clean streak, weekly rate/missed days
- [ ] `routes/goals.ts` — CRUD, linked to a habit
- [ ] `index.ts` — boot sequence: DB → migrations → listen

## Phase 3 — Frontend

- [ ] Vite + React scaffold (typescript template)
- [ ] `api/client.ts` + `auth/AuthContext.tsx`
- [ ] Login + Register pages
- [ ] Dashboard: habit list, create habit, complete/relapse buttons, streak +
      weekly-rate display
- [ ] Goals page: add/edit/remove goals linked to habits

## Phase 4 — Integration & polish

- [ ] Full E2E manual test via `docker compose up` on a clean clone
- [ ] Empty states and basic form validation
- [ ] `README.md` — requirements, `.env` variables, exact run commands
- [ ] Final pass on code quality (no dead code, consistent style)

## Commit plan

Suggested commit messages (all lowercase conventional style):

```
docs: initial planning (architecture, data model, task breakdown)
chore: add root compose.yml and .env.example
feat(backend): scaffold typescript express app and boot sequence
feat(backend): auth register/login with bcrypt and jwt
feat(backend): habit CRUD with build/break types
feat(backend): completion, relapse, streak and weekly-rate analytics
feat(backend): goal CRUD linked to habits
feat(frontend): scaffold react app with auth context and api client
feat(frontend): login and register pages
feat(frontend): habit dashboard with streaks and weekly rate
feat(frontend): goals page
infra: dockerfiles and nginx config for backend and frontend
docs: readme with run instructions
test: verify fresh docker compose up end-to-end
```