import { describe, it, expect } from "vitest";
import {
  formatQuestionDeadline,
  formatWallClockWithZone,
  QUESTION_DEADLINE_FORMAT,
  wallClockInZoneToInstant,
} from "../utils";

// QA #190: SOLMC1147's question deadline was entered as 9 AM CST and stored as
// that wall clock stamped UTC. The Timeline tab showed "09:00 am CST" while the
// Questions tab banner showed the viewer-local "5:00 AM" with no zone.
const STORED = "2026-10-09T09:00:00.000Z";

describe("question acceptance deadline (QA #190)", () => {
  it("renders the same wall clock and zone label on both tabs", () => {
    // Both the Timeline tab and the Questions tab banner call this helper.
    expect(formatQuestionDeadline(STORED, "CST")).toBe(
      "Oct 9, 2026 9:00 AM CST"
    );
    expect(formatQuestionDeadline(STORED, "CST")).toBe(
      formatWallClockWithZone(STORED, QUESTION_DEADLINE_FORMAT, "CST")
    );
  });

  it("resolves the stored wall clock in the solicitation zone for open/closed", () => {
    // 9 AM in Chicago in October (CDT, UTC-5) is 14:00Z, not 09:00Z.
    expect(wallClockInZoneToInstant(STORED, "CST")?.toISOString()).toBe(
      "2026-10-09T14:00:00.000Z"
    );
    // Naive (no Z) values carry the same wall clock.
    expect(
      wallClockInZoneToInstant("2026-10-09T09:00:00", "CST")?.toISOString()
    ).toBe("2026-10-09T14:00:00.000Z");
  });

  it("uses fixed offsets for non-DST zones and the stored instant otherwise", () => {
    expect(wallClockInZoneToInstant(STORED, "WAT")?.toISOString()).toBe(
      "2026-10-09T08:00:00.000Z"
    );
    expect(wallClockInZoneToInstant(STORED, undefined)?.toISOString()).toBe(
      STORED
    );
    expect(wallClockInZoneToInstant(null, "CST")).toBeNull();
    expect(wallClockInZoneToInstant("not a date", "CST")).toBeNull();
  });
});
