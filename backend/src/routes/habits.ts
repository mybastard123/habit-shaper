import { Router } from "express";
import { query } from "../db/pool";
import { HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";
import { buildStats, breakStats, todayStr } from "../services/streaks";
import { isIsoDate } from "../services/validation";

interface HabitRow {
  id: number;
  user_id: number;
  name: string;
  type: "build" | "break";
  created_at: string;
}

interface LogRow {
  log_date: string;
}

interface RelapseRow {
  relapsed_on: string;
}

const router = Router();
router.use(requireAuth);

async function getOwnedHabit(userId: number, habitId: number): Promise<HabitRow> {
  const [habit] = await query<HabitRow[]>(
    "SELECT * FROM habits WHERE id = ? AND user_id = ?",
    [habitId, userId],
  );
  if (!habit) throw new HttpError(404, "Habit not found");
  return habit;
}

async function buildStatsFor(habit: HabitRow) {
  const logs = await query<LogRow[]>(
    "SELECT log_date FROM habit_logs WHERE habit_id = ? ORDER BY log_date",
    [habit.id],
  );
  return buildStats(logs.map((l) => l.log_date));
}

async function breakStatsFor(habit: HabitRow) {
  const relapses = await query<RelapseRow[]>(
    "SELECT relapsed_on FROM relapses WHERE habit_id = ? ORDER BY relapsed_on",
    [habit.id],
  );
  return breakStats(relapses.map((r) => r.relapsed_on), habit.created_at.slice(0, 10));
}

async function statsFor(habit: HabitRow) {
  if (habit.type === "build") {
    const stats = await buildStatsFor(habit);
    return { build: stats };
  }
  const stats = await breakStatsFor(habit);
  return { break: stats };
}

router.get("/", async (req, res, next) => {
  try {
    const habits = await query<HabitRow[]>(
      "SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC",
      [req.user!.id],
    );
    const result = [];
    for (const habit of habits) {
      result.push({ ...habit, stats: await statsFor(habit) });
    }
    res.json({ habits: result });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, type } = req.body ?? {};
    if (typeof name !== "string" || name.trim().length === 0) {
      throw new HttpError(400, "Habit name is required");
    }
    if (type !== "build" && type !== "break") {
      throw new HttpError(400, "Habit type must be 'build' or 'break'");
    }
    const result = await query<{ insertId: number }>(
      "INSERT INTO habits (user_id, name, type) VALUES (?, ?, ?)",
      [req.user!.id, name.trim(), type],
    );
    const habit = await getOwnedHabit(req.user!.id, Number(result.insertId));
    res.status(201).json({ habit: { ...habit, stats: await statsFor(habit) } });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const habit = await getOwnedHabit(req.user!.id, Number(req.params.id));
    res.json({ habit: { ...habit, stats: await statsFor(habit) } });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const habit = await getOwnedHabit(req.user!.id, Number(req.params.id));
    const { name, type } = req.body ?? {};

    let newName = habit.name;
    let newType = habit.type;
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        throw new HttpError(400, "Habit name must not be empty");
      }
      newName = name.trim();
    }
    if (type !== undefined) {
      if (type !== "build" && type !== "break") {
        throw new HttpError(400, "Habit type must be 'build' or 'break'");
      }
      newType = type;
    }

    await query("UPDATE habits SET name = ?, type = ? WHERE id = ?", [newName, newType, habit.id]);

    if (newType !== habit.type) {
      // Discard logs that no longer apply to the new habit type.
      if (newType === "break") await query("DELETE FROM habit_logs WHERE habit_id = ?", [habit.id]);
      else await query("DELETE FROM relapses WHERE habit_id = ?", [habit.id]);
    }

    const updated = await getOwnedHabit(req.user!.id, habit.id);
    res.json({ habit: { ...updated, stats: await statsFor(updated) } });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const habit = await getOwnedHabit(req.user!.id, Number(req.params.id));
    await query("DELETE FROM habits WHERE id = ?", [habit.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/:id/complete", async (req, res, next) => {
  try {
    const habit = await getOwnedHabit(req.user!.id, Number(req.params.id));
    if (habit.type !== "build") throw new HttpError(400, "Only 'build' habits can be completed");

    const date = (req.body ?? {}).date ?? todayStr();
    if (!isIsoDate(date)) throw new HttpError(400, "date must be YYYY-MM-DD");
    if (date > todayStr()) throw new HttpError(400, "Cannot complete a future date");

    await query("INSERT IGNORE INTO habit_logs (habit_id, log_date) VALUES (?, ?)", [habit.id, date]);
    res.json({ habit: { ...habit, stats: await statsFor(habit) } });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/relapse", async (req, res, next) => {
  try {
    const habit = await getOwnedHabit(req.user!.id, Number(req.params.id));
    if (habit.type !== "break") throw new HttpError(400, "Only 'break' habits can relapse");

    const date = (req.body ?? {}).date ?? todayStr();
    if (!isIsoDate(date)) throw new HttpError(400, "date must be YYYY-MM-DD");
    if (date > todayStr()) throw new HttpError(400, "Cannot record a future date");

    await query("INSERT IGNORE INTO relapses (habit_id, relapsed_on) VALUES (?, ?)", [habit.id, date]);
    res.json({ habit: { ...habit, stats: await statsFor(habit) } });
  } catch (err) {
    next(err);
  }
});

export default router;