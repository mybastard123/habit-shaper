# Habit Shaper — Data Model

## Entity relationships

```
users 1 ──── n habits 1 ──── n habit_logs
               │ 1 ──── n goals
               │
               └── 1 ──── n relapses (only meaningful for type=break)
```

## Tables

### users

| Column    | Type        | Constraints                | Notes                          |
|-----------|-------------|----------------------------|--------------------------------|
| id        | INT         | PK, AUTO_INCREMENT         |                                |
| email     | VARCHAR(255)| UNIQUE, NOT NULL           | Login identifier               |
| password  | VARCHAR(255)| NOT NULL                   | bcrypt hash                    |
| created_at| DATETIME    | NOT NULL, DEFAULT NOW()    |                                |

### habits

| Column    | Type        | Constraints                | Notes                          |
|-----------|-------------|----------------------------|--------------------------------|
| id        | INT         | PK, AUTO_INCREMENT         |                                |
| user_id   | INT         | NOT NULL, FK → users(id)   | ON DELETE CASCADE              |
| name      | VARCHAR(255)| NOT NULL                   | e.g. "meditate"                |
| type      | ENUM('build','break') | NOT NULL          | Build or break target          |
| created_at| DATETIME    | NOT NULL, DEFAULT NOW()    |                                |

### habit_logs

One row per completed day for a **build** habit.

| Column    | Type        | Constraints                | Notes                          |
|-----------|-------------|----------------------------|--------------------------------|
| id        | INT         | PK, AUTO_INCREMENT         |                                |
| habit_id  | INT         | NOT NULL, FK → habits(id)  | ON DELETE CASCADE              |
| log_date  | DATE        | NOT NULL                   | Day the habit was completed    |
| created_at| DATETIME    | NOT NULL, DEFAULT NOW()    |                                |

Unique constraint: `UNIQUE(habit_id, log_date)` — a day can only be completed once.
Index on `(habit_id, log_date)` to make streak queries fast.

### relapses

One row per relapse for a **break** habit.

| Column    | Type        | Constraints                | Notes                          |
|-----------|-------------|----------------------------|--------------------------------|
| id        | INT         | PK, AUTO_INCREMENT         |                                |
| habit_id  | INT         | NOT NULL, FK → habits(id)  | ON DELETE CASCADE              |
| relapsed_on| DATE       | NOT NULL                   | Day the user slipped           |
| created_at| DATETIME    | NOT NULL, DEFAULT NOW()    |                                |

Unique constraint: `UNIQUE(habit_id, relapsed_on)`.

### goals

| Column    | Type        | Constraints                | Notes                          |
|-----------|-------------|----------------------------|--------------------------------|
| id        | INT         | PK, AUTO_INCREMENT         |                                |
| user_id   | INT         | NOT NULL, FK → users(id)   | ON DELETE CASCADE              |
| habit_id  | INT         | NOT NULL, FK → habits(id)  | Must belong to the same user   |
| title     | VARCHAR(255)| NOT NULL                   | e.g. "Read 20 minutes daily"   |
| description| TEXT      | NULL                       | Optional detail                |
| created_at| DATETIME    | NOT NULL, DEFAULT NOW()    |                                |

## Derived values (computed on read, never stored)

These are computed in `services/streaks.ts` from the log/relapse rows so they can
never become stale:

- **Build streak** — walk backward from today (or the given date): each consecutive
  day with a `habit_log` increases the streak; stop at the first gap.
- **Weekly completion rate** — for the current ISO week (Mon–Sun), count
  `habit_log`s per day and report which days were completed vs missed.
- **Clean streak (break)** — number of consecutive days with no `relapse` since the
  last relapse. The last 7 days are shown for context.

## Migration strategy

- Single `schema.sql` in the backend using `CREATE TABLE IF NOT EXISTS` so it is
  idempotent and safe to run on every boot.
- Tables are created in dependency order: `users` → `habits` → `habit_logs` /
  `relapses` / `goals`.