import { describe, it, expect } from "vitest";
import { addDays, buildStats, breakStats, diffDays, todayStr, weekStart } from "../src/services/streaks";

describe("todayStr", () => {
  it("returns a valid YYYY-MM-DD date", () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("addDays", () => {
  it("adds days across a month boundary", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
  });
});

describe("diffDays", () => {
  it("computes calendar-day difference", () => {
    expect(diffDays("2026-09-02", "2026-09-01")).toBe(1);
    expect(diffDays("2026-09-01", "2026-09-02")).toBe(-1);
  });
});

describe("weekStart", () => {
  it("returns Monday of the same ISO week", () => {
    expect(weekStart("2026-09-02")).toBe("2026-08-31"); // Wed
    expect(weekStart("2026-09-06")).toBe("2026-08-31"); // Sun
    expect(weekStart("2026-08-31")).toBe("2026-08-31"); // Mon
  });
});

describe("buildStats", () => {
  const today = "2026-09-02"; // Wednesday, week starts Mon 2026-08-31

  it("has zero streak with no completions and counts elapsed days as missed", () => {
    const s = buildStats([], today);
    expect(s.currentStreak).toBe(0);
    expect(s.weekly.totalDaysThisWeek).toBe(3); // Mon, Tue, Wed
    expect(s.weekly.missedThisWeek).toBe(3);
  });

  it("counts a consecutive streak ending today", () => {
    const s = buildStats(["2026-08-31", "2026-09-01", "2026-09-02"], today);
    expect(s.currentStreak).toBe(3);
    expect(s.weekly.missedThisWeek).toBe(0);
  });

  it("does not break the streak when today is not yet completed", () => {
    const s = buildStats(["2026-08-31", "2026-09-01"], today);
    expect(s.currentStreak).toBe(2);
  });

  it("breaks the streak on a gap", () => {
    const s = buildStats(["2026-08-30", "2026-08-31", "2026-09-02"], today);
    expect(s.currentStreak).toBe(1);
  });
});

describe("breakStats", () => {
  const today = "2026-09-02";

  it("starts counting from creation when there are no relapses", () => {
    const s = breakStats([], "2026-09-02", today);
    expect(s.cleanStreak).toBe(1); // day 1
  });

  it("resets to zero when relapsing today", () => {
    const s = breakStats(["2026-09-02"], "2026-08-20", today);
    expect(s.cleanStreak).toBe(0);
    expect(s.lastRelapse).toBe("2026-09-02");
  });

  it("counts clean days since the last relapse", () => {
    expect(breakStats(["2026-09-01"], "2026-08-20", today).cleanStreak).toBe(1); // first clean day
    expect(breakStats(["2026-08-30"], "2026-08-20", today).cleanStreak).toBe(3); // Aug 31, Sep 1, Sep 2
  });
});