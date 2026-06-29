import { describe, expect, test } from "vitest";
import { ACTIVITY_SERIES } from "../components/AnalyticsTab";

describe("activity series colors", () => {
  test("uses a unique color for each activity label", () => {
    const strokes = ACTIVITY_SERIES.map((series) => series.stroke);
    expect(new Set(strokes).size).toBe(ACTIVITY_SERIES.length);
  });

  test("assigns deliverables a different color from claims", () => {
    const claims = ACTIVITY_SERIES.find((series) => series.key === "claims");
    const deliverables = ACTIVITY_SERIES.find(
      (series) => series.key === "deliverables",
    );

    expect(claims?.stroke).toBeDefined();
    expect(deliverables?.stroke).toBeDefined();
    expect(claims?.stroke).not.toBe(deliverables?.stroke);
  });
});
