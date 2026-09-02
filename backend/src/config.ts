export const config = {
  port: Number(process.env.PORT ?? 4000),
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "habit_user",
    password: process.env.DB_PASSWORD ?? "habit_pass",
    database: process.env.DB_NAME ?? "habit_shaper",
  },
  jwtSecret: process.env.JWT_SECRET ?? "insecure_dev_secret_change_me",
  jwtExpiresIn: "7d",
};