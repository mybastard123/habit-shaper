import mysql from "mysql2/promise";
import { config } from "../config";

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true,
  namedPlaceholders: true,
  dateStrings: true,
});

export async function query<T>(sql: string, params: (string | number | null)[] = []): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}