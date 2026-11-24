import { beforeAll, describe, expect, it, vi } from "vitest";

// pdf.js (pulled in by the page module) reads DOMMatrix at import time.
vi.stubGlobal("DOMMatrix", class {});

let mod: typeof import("../index");
beforeAll(async () => {
  mod = await import("../index");
}, 60_000);

const OLD = "2026-11-01T10:00:00Z"; // created before DATETIME_LEGACY_CUTOFF
const NEW = "2026-12-01T10:00:00Z"; // created after it

// The list API returns instants as offset strings in the requesting user's zone
// and (per swagger) no `timezone` on list items.
const row = (endDate: string, createdAt: string, timezone?: string) => ({
  _id: "1",
  contractId: "C-1",
  title: "T",
  status: "publish",
  endDate,
  datePublished: endDate,
  createdAt,
  timezone,
});

describe("contract list End Date (date-time) / Published (date) (QA-044)", () => {
  it.each([
    // LEGACY record (created before the cutoff): UTC components are the wall clock
    ["2027-01-19T16:00:00.000-08:00", OLD, undefined, "20 Jan 2027, 12:00 AM", "20 Jan 2027"],
    ["2027-01-20T13:00:00.000+13:00", OLD, undefined, "20 Jan 2027, 12:00 AM", "20 Jan 2027"],
    ["2027-01-10T09:00:00.000Z", OLD, "Pacific/Pago_Pago", "10 Jan 2027, 09:00 AM", "09 Jan 2027"],
    // NEW record with its zone on the row: a true instant shown in that zone
    ["2027-07-19T19:00:00.000Z", NEW, "Pacific/Kiritimati", "20 Jul 2027, 09:00 AM", "20 Jul 2027"],
    ["2027-11-07T06:30:00.000Z", NEW, "America/Toronto", "07 Nov 2027, 01:30 AM", "07 Nov 2027"],
    // NEW record, row without a zone: the API's own offset (the user's zone)
    ["2027-07-20T09:00:00.000+14:00", NEW, undefined, "20 Jul 2027, 09:00 AM", "20 Jul 2027"],
  ])("%s created %s (tz %s)", async (end, createdAt, tz, endShown, publishedShown) => {
    const { mapContractsToRows, mapVendorContractsToRows } = mod;
    const [r] = mapContractsToRows([row(end, createdAt, tz) as any]);
    expect(r.endDate).toBe(endShown);
    expect(r.published).toBe(publishedShown);
    const [v] = mapVendorContractsToRows([{ ...row(end, createdAt, tz), id: "1" } as any]);
    expect(v.endDate).toBe(endShown);
  });
});
