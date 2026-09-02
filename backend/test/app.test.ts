import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("app wiring (no database required)", () => {
  it("responds to the health check", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("rejects unauthenticated requests to protected routes", async () => {
    const res = await request(app).get("/api/habits");
    expect(res.status).toBe(401);
  });

  it("validates input before touching the database", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "secret123" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/definitely-not-a-route");
    expect(res.status).toBe(404);
  });
});