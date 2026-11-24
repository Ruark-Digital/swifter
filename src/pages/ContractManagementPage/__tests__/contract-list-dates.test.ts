import { beforeAll, describe, expect, it, vi } from "vitest";

// pdf.js (pulled in by the page module) reads DOMMatrix at import time.
vi.stubGlobal("DOMMatrix", class {});

let mod: typeof import("../index");
beforeAll(async () => {
  mod = await import("../index");
}, 60_000);

// The list API returns instants as offset strings in the requesting user's
// zone and (per swagger) no `timezone` on list items.
const row = (endDate: string, timezone?: string) => ({
  _id: "1",
  contractId: "C-1",
  title: "T",
  status: "publish",
  endDate,
  datePublished: endDate,
  timezone,
});

describe("contract list End Date / Published (QA-044)", () => {
  it.each([
    // legacy stored 2027-01-20T00:00:00.000Z, written in the user's zone
    ["2027-01-19T16:00:00.000-08:00", undefined, "20 Jan 2027"],
    ["2027-01-20T13:00:00.000+13:00", undefined, "20 Jan 2027"],
    ["2027-01-20T00:00:00.000Z", undefined, "20 Jan 2027"],
    // new value created in Kiritimati, API wrote it with the user's offset
    ["2027-07-20T00:00:00.000+14:00", undefined, "20 Jul 2027"],
    ["2027-07-20T00:00:00.000-11:00", undefined, "20 Jul 2027"],
    // when the row does carry the contract timezone it wins
    ["2027-07-19T10:00:00.000Z", "Pacific/Kiritimati", "20 Jul 2027"],
    ["2027-11-07T05:00:00.000Z", "America/Toronto", "07 Nov 2027"],
  ])("%s (tz %s) -> %s", async (end, tz, expected) => {
    const { mapContractsToRows, mapVendorContractsToRows } = mod;
    const [r] = mapContractsToRows([row(end, tz) as any]);
    expect(r.endDate).toBe(expected);
    expect(r.published).toBe(expected);
    const [v] = mapVendorContractsToRows([{ ...row(end, tz), id: "1" } as any]);
    expect(v.endDate).toBe(expected);
  });
});
