import express from "express";
import { config } from "./config";
import { migrate } from "./db/migrate";
import { pool } from "./db/pool";
import authRoutes from "./routes/auth";
import habitRoutes from "./routes/habits";
import goalRoutes from "./routes/goals";
import { errorHandler, notFound } from "./middleware/error";

async function start(): Promise<void> {
  try {
    await pool.query("SELECT 1");
    console.log("[db] connected");
    await migrate();
    console.log("[db] migrations applied");
  } catch (err) {
    console.error("[db] connection failed, retrying in 3s", err);
    setTimeout(start, 3000);
    return;
  }

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/habits", habitRoutes);
  app.use("/api/goals", goalRoutes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`[server] listening on :${config.port}`);
  });
}

start();