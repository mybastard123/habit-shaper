import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import mysql from "mysql2/promise";
import { config } from "../config";

export async function migrate(): Promise<void> {
  const candidates = [join(__dirname, "schema.sql"), join(process.cwd(), "src/db/schema.sql")];
  const file = candidates.find((p) => existsSync(p));
  if (!file) throw new Error("schema.sql not found for migration");
  const sql = readFileSync(file, "utf8");

  // Multi-statement is enabled only on this dedicated connection for the schema
  // bootstrap, never on the shared application pool.
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  });
  try {
    await connection.query(sql);
  } finally {
    await connection.end();
  }
}