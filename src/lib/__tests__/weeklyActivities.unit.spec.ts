import { describe, it, expect } from "vitest";
import { DashboardDataTransformer } from "@/lib/dashboardDataTransformer";

describe("transformWeeklyActivities — QA #115 (labels/datasets shape)", () => {
  // The real BE payload (docs drift): pre-bucketed labels + datasets, not the
  // legacy { solicitations[], evaluations[] } item arrays.
  const payload = {
    labels: ["Nov", "Dec", "Jan"],
    datasets: [
      { name: "Solicitations", values: [9, 2, 4] },
      { name: "Evaluations", values: [8, 1, 1] },
      { name: "Vendors", values: [3, 0, 0] },
      { name: "Contracts", values: [0, 0, 5] },
    ],
  } as never;

  it("renders one point per label with activities summed across all datasets", () => {
    const result = DashboardDataTransformer.transformWeeklyActivities(payload);
    expect(result).toEqual([
      { day: "Nov", activities: 20 }, // 9+8+3+0
      { day: "Dec", activities: 3 }, //  2+1+0+0
      { day: "Jan", activities: 10 }, // 4+1+0+5
    ]);
  });

  it("is not empty when datasets carry values (the #115 regression)", () => {
    const result = DashboardDataTransformer.transformWeeklyActivities(payload);
    expect(result.some((p) => p.activities > 0)).toBe(true);
  });

  it("still handles the legacy item-array shape by date bucketing", () => {
    const now = new Date("2026-03-15T00:00:00Z");
    const legacy = {
      solicitations: [{ createdAt: "2026-03-10T00:00:00Z" }],
      evaluations: [{ createdAt: "2026-03-01T00:00:00Z" }],
    } as never;
    const result = DashboardDataTransformer.transformWeeklyActivities(
      legacy,
      "3months",
      now,
    );
    const total = result.reduce((sum, p) => sum + (p.activities as number), 0);
    expect(total).toBe(2);
  });
});
