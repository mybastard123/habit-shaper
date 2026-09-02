import { config } from "./config";
import { migrate } from "./db/migrate";
import { pool } from "./db/pool";
import { createApp } from "./app";

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

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] listening on :${config.port}`);
  });
}

start();