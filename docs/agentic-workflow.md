# Agentic Development Workflow

This document describes how the Habit Shaper was built with a coding agent, and is
included because the process itself is part of the evaluation.

## Tooling

- **Agent:** [opencode](https://opencode.ai) (terminal-based coding agent), powered by a
  frontier coding model.
- **Human in the loop:** the author planned the high-level approach, reviewed every
  agent-produced change before committing, and made the product decisions. The agent
  did the mechanical work — scaffolding, implementation, debugging, verification — and
  surfaced decisions for approval.

## Workflow

The build followed a deliberate loop, repeated per feature:

1. **Plan first.** Before writing any code, the agent produced three planning documents
   (`docs/architecture.md`, `docs/data-model.md`, `docs/task-breakdown.md`) and they
   were committed as the *first* commit.
2. **Scaffold.** The agent generated the project skeleton (compose file, Dockerfiles,
   backend/frontend projects) from the architecture doc.
3. **Implement.** One feature at a time, each landing as its own commit.
4. **Verify.** After every meaningful step the agent compiled (`tsc`), type-checked the
   frontend, and — critically — ran the *real* stack with `docker compose up` and
   exercised the API end-to-end.
5. **Review & fix.** The agent diagnosed its own failures from logs and test output,
   then the human reviewed and approved the fix before it was committed.

## How the agent added value (and where it caught itself)

The value of agentic development is that the agent can *run* the system and react to
real output rather than just write code. Concrete examples from this build:

- **Environment discovery.** Before starting, the agent inspected the machine and found
  Node/npm/git present but Docker and WSL2 missing, then guided a one-time setup and
  re-verified (`docker version`, WSL distro state) before proceeding.
- **Toolchain mismatch.** `create-vite@9` requires Node 20+, but the machine had Node 18.
  The agent pinned `create-vite@5` (Node 18-compatible) while keeping the *Docker* build
  on Node 20 — so local dev and container builds both worked.
- **Caught a real bug via E2E.** After wiring the backend, the agent ran
  `docker compose up`, read the logs, and found the schema migration failed because the
  multi-statement `schema.sql` needs `multipleStatements`. It fixed it by scoping that
  option to a dedicated migration connection (instead of the shared pool).
- **Iterated on type errors.** The agent repeatedly ran `tsc` and the Vite build and
  resolved each error (mysql2 query-parameter types, JWT `expiresIn` typing, and
  narrowing a union type for habit stats) rather than guessing.
- **Verified, not just compiled.** After every backend feature the agent drove the HTTP
  API with real requests (register → build habit → complete → streak; break habit →
  relapse → clean streak reset; goals CRUD) and asserted the actual streak/weekly
  numbers.

## Key decisions

| Decision | Rationale |
|----------|-----------|
| Streaks computed on read, never stored | Avoids stale counters and complex write-time logic |
| Idempotent `CREATE TABLE IF NOT EXISTS` migrations | Zero-setup first boot, safe to re-run |
| `bcryptjs` (pure JS) over native `bcrypt` | Avoids native build failures in Alpine images |
| nginx reverse-proxy for `/api` | Single origin, no CORS, production-like frontend |
| `mysql2` raw SQL over an ORM | Explicit queries keep a small app transparent |

## What could be improved

- Add a CI workflow (GitHub Actions) running typecheck + tests on push.
- Broaden integration coverage to exercise the DB-backed routes against a test database.
- Adopt a typed validation layer (e.g. zod) as the API surface grows.

## Result

- **18 automated tests** covering the trickiest logic (streak/date math) and app wiring.
- **13+ commits**, each a meaningful step, with planning committed first.