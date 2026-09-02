import { describe, it, expect } from "vitest";
import { ensureUtcInstant, formatDateTZ } from "../utils";

describe("ensureUtcInstant — normalize naive datetimes to a UTC instant", () => {
  it("appends Z to a datetime string with no timezone designator", () => {
    expect(ensureUtcInstant("2026-09-01T11:24:00")).toBe("2026-09-01T11:24:00Z");
  });

  it("normalizes a space-separated naive datetime to ISO UTC", () => {
    expect(ensureUtcInstant("2026-09-01 11:24:00")).toBe("2026-09-01T11:24:00Z");
  });

  it("leaves a string that already carries Z unchanged", () => {
    expect(ensureUtcInstant("2026-09-01T11:24:00.000Z")).toBe(
      "2026-09-01T11:24:00.000Z"
    );
  });

  it("leaves a string with an explicit ±offset unchanged", () => {
    expect(ensureUtcInstant("2026-09-01T11:24:00+04:00")).toBe(
      "2026-09-01T11:24:00+04:00"
    );
  });

  it("leaves a date-only string unchanged (no time to anchor)", () => {
    expect(ensureUtcInstant("2026-09-01")).toBe("2026-09-01");
  });

  it("passes through Date objects and nullish values unchanged", () => {
    const d = new Date("2026-09-01T11:24:00Z");
    expect(ensureUtcInstant(d)).toBe(d);
    expect(ensureUtcInstant(undefined)).toBeUndefined();
    expect(ensureUtcInstant(null)).toBeNull();
  });

  // The bug: the pricing row's naive timestamp rendered unconverted (raw UTC)
  // while sibling file rows — which carry the Z — converted to the viewer's
  // zone. After normalization the naive value formats to the SAME instant as
  // its explicit-Z counterpart, in any runner timezone.
  it("makes a naive timestamp format identically to its explicit-UTC sibling", () => {
    const fmt = "MMM d, yyyy h:mm a";
    const naive = formatDateTZ(ensureUtcInstant("2026-09-01T11:24:00"), fmt);
    const withZ = formatDateTZ("2026-09-01T11:24:00Z", fmt);
    expect(naive).toBe(withZ);
  });
});
