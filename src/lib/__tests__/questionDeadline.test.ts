import { describe, it, expect } from "vitest";
import {
  formatQuestionDeadline,
  formatWallClockWithZone,
  QUESTION_DEADLINE_FORMAT,
  solicitationInstant,
} from "../utils";

// QA #190: SOLMC1147's question deadline is 9 AM CST, stored as the UTC instant
// 14:00Z (CDT, UTC-5, in October). The Timeline tab and the Questions tab banner
// must render it identically, in the solicitation's zone.
const STORED = "2026-10-09T14:00:00.000Z";

describe("question acceptance deadline (QA #190)", () => {
  it("renders the same time and zone label on both tabs", () => {
    expect(formatQuestionDeadline(STORED, "CST")).toBe(
      "Oct 9, 2026 9:00 AM CST"
    );
    expect(formatQuestionDeadline(STORED, "CST")).toBe(
      formatWallClockWithZone(STORED, QUESTION_DEADLINE_FORMAT, "CST")
    );
  });

  it("compares open/closed against the stored instant", () => {
    expect(solicitationInstant(STORED)?.toISOString()).toBe(STORED);
    // Naive values are read as UTC.
    expect(solicitationInstant("2026-10-09T14:00:00")?.toISOString()).toBe(
      STORED
    );
    expect(solicitationInstant(null)).toBeNull();
    expect(solicitationInstant("not a date")).toBeNull();
  });
});
