import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db/pool";
import { HttpError } from "../middleware/error";
import { requireAuth, signToken } from "../middleware/auth";
import { isEmail } from "../services/validation";

interface UserRow {
  id: number;
  email: string;
  password: string;
}

const router = Router();

function isDuplicateEntry(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "ER_DUP_ENTRY"
  );
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!isEmail(email)) throw new HttpError(400, "A valid email is required");
    if (typeof password !== "string" || password.length < 6) {
      throw new HttpError(400, "Password must be at least 6 characters");
    }

    const [existing] = await query<UserRow[]>("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) throw new HttpError(409, "Email already registered");

    const hash = await bcrypt.hash(password, 10);
    const result = await query<{ insertId: number }>(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hash],
    );

    const user = { id: Number(result.insertId), email };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    // The pre-check above handles the common case; this catches the race where two
    // concurrent registrations use the same email and the INSERT hits the unique key.
    if (isDuplicateEntry(err)) {
      next(new HttpError(409, "Email already registered"));
      return;
    }
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!isEmail(email) || typeof password !== "string") {
      throw new HttpError(400, "Email and password are required");
    }

    const [user] = await query<UserRow[]>("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    const payload = { id: user.id, email: user.email };
    res.json({ token: signToken(payload), user: payload });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;