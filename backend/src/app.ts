import express from "express";
import authRoutes from "./routes/auth";
import habitRoutes from "./routes/habits";
import goalRoutes from "./routes/goals";
import { errorHandler, notFound } from "./middleware/error";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/habits", habitRoutes);
  app.use("/api/goals", goalRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}