import { describe, it, expect } from "vitest";
import { isEmail, isIsoDate } from "../src/services/validation";

describe("isEmail", () => {
  it("accepts valid emails", () => {
    expect(isEmail("a@b.co")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isEmail("")).toBe(false);
    expect(isEmail("nope")).toBe(false);
    expect(isEmail("a@b")).toBe(false);
    expect(isEmail(123)).toBe(false);
  });
});

describe("isIsoDate", () => {
  it("accepts YYYY-MM-DD", () => {
    expect(isIsoDate("2026-09-02")).toBe(true);
  });

  it("rejects non-dates", () => {
    expect(isIsoDate("02/09/2026")).toBe(false);
    expect(isIsoDate("not-a-date")).toBe(false);
    expect(isIsoDate(2026)).toBe(false);
  });
});