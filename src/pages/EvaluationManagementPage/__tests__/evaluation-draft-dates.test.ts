import { buildEvaluationDraftPayload } from "../components/evaluationDraftPayload";
import { toWallClockPayload } from "@/lib/utils";

// QA N1: Save as Draft sent the picker's raw Date, which goes over the wire as
// a UTC instant (Lagos midnight -> "...T23:00:00.000Z" the day before). The BE
// reads dates as wall clock in the evaluation's timezone, so an Auckland
// evaluation picked for 29 Nov 12:00 AM came back as 12:00 PM NZDT.
// Continue already sends the naive wall clock; the draft must send the same.
// Run with TZ=Africa/Lagos so the browser zone differs from the evaluation's.

describe("Save as Draft date serialization (browser on Lagos, evaluation in Auckland)", () => {
  // What the date picker holds after picking 29 Nov 12:00 AM and 30 Nov 5:30 PM.
  const start = new Date(2026, 10, 29, 0, 0, 0);
  const end = new Date(2026, 10, 30, 17, 30, 0);

  const formData = {
    solicitation: "sol-1",
    timezone: "NZST",
    start_date: start as unknown as string,
    end_date: end as unknown as string,
    group: [],
    documents: [],
    criteria: [],
  };

  it("runs in a browser zone that is not UTC", () => {
    expect(start.getTimezoneOffset()).toBe(-60);
  });

  it("sends the picked wall-clock time, exactly like Continue", () => {
    // Serialize as the request body would be.
    const body = JSON.parse(JSON.stringify(buildEvaluationDraftPayload(formData)));
    console.log("draft request body dates:", body.start_date, body.end_date);

    expect(body.start_date).toBe("2026-11-29T00:00:00");
    expect(body.end_date).toBe("2026-11-30T17:30:00");
    expect(body.start_date).toBe(toWallClockPayload(start));
    expect(body.end_date).toBe(toWallClockPayload(end));
  });
});
