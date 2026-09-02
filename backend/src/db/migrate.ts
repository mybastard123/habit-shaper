import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pool } from "./pool";

export async function migrate(): Promise<void> {
  const candidates = [join(__dirname, "schema.sql"), join(process.cwd(), "src/db/schema.sql")];
  const file = candidates.find((p) => existsSync(p));
  if (!file) throw new Error("schema.sql not found for migration");
  const sql = readFileSync(file, "utf8");
  const connection = await pool.getConnection();
  try {
    await connection.query(sql);
  } finally {
    connection.release();
  }
}