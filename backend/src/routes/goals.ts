import { Router } from "express";
import { query } from "../db/pool";
import { HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";

interface GoalRow {
  id: number;
  user_id: number;
  habit_id: number;
  title: string;
  description: string | null;
  created_at: string;
}

const router = Router();
router.use(requireAuth);

async function getOwnedGoal(userId: number, goalId: number): Promise<GoalRow> {
  const [goal] = await query<GoalRow[]>(
    "SELECT * FROM goals WHERE id = ? AND user_id = ?",
    [goalId, userId],
  );
  if (!goal) throw new HttpError(404, "Goal not found");
  return goal;
}

async function ensureHabitOwned(userId: number, habitId: number): Promise<void> {
  const [habit] = await query<{ id: number }[]>(
    "SELECT id FROM habits WHERE id = ? AND user_id = ?",
    [habitId, userId],
  );
  if (!habit) throw new HttpError(400, "Habit not found or does not belong to you");
}

router.get("/", async (req, res, next) => {
  try {
    const goals = await query<
      Array<GoalRow & { habit_name: string; habit_type: string }>
    >(
      `SELECT g.*, h.name AS habit_name, h.type AS habit_type
       FROM goals g
       JOIN habits h ON h.id = g.habit_id
       WHERE g.user_id = ?
       ORDER BY g.created_at DESC`,
      [req.user!.id],
    );
    res.json({ goals });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, description, habitId } = req.body ?? {};
    if (typeof title !== "string" || title.trim().length === 0) {
      throw new HttpError(400, "Goal title is required");
    }
    const habitIdNum = Number(habitId);
    if (!Number.isInteger(habitIdNum)) throw new HttpError(400, "habitId is required");
    await ensureHabitOwned(req.user!.id, habitIdNum);

    const result = await query<{ insertId: number }>(
      "INSERT INTO goals (user_id, habit_id, title, description) VALUES (?, ?, ?, ?)",
      [req.user!.id, habitIdNum, title.trim(), description ?? null],
    );
    const goal = await getOwnedGoal(req.user!.id, Number(result.insertId));
    res.status(201).json({ goal });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const goal = await getOwnedGoal(req.user!.id, Number(req.params.id));
    const { title, description } = req.body ?? {};

    let newTitle = goal.title;
    let newDescription = goal.description;
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        throw new HttpError(400, "Goal title must not be empty");
      }
      newTitle = title.trim();
    }
    if (description !== undefined) {
      newDescription = description === null ? null : String(description);
    }

    await query("UPDATE goals SET title = ?, description = ? WHERE id = ?", [
      newTitle,
      newDescription,
      goal.id,
    ]);
    res.json({ goal: { ...goal, title: newTitle, description: newDescription } });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const goal = await getOwnedGoal(req.user!.id, Number(req.params.id));
    await query("DELETE FROM goals WHERE id = ?", [goal.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;