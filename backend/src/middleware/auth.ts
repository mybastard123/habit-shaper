import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { query } from "../db/pool";

export interface AuthUser {
  id: number;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }
  let payload: AuthUser;
  try {
    payload = jwt.verify(header.slice(7), config.jwtSecret) as AuthUser;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // A token can outlive the account it belongs to (e.g. after a database reset or
  // account deletion). Verify the user still exists so writes fail with 401, not a
  // foreign-key 500.
  try {
    const [user] = await query<{ id: number }[]>("SELECT id FROM users WHERE id = ?", [payload.id]);
    if (!user) {
      res.status(401).json({ error: "Account no longer exists" });
      return;
    }
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
}