import { describe, it, expect } from "vitest";
import { formatDateInZoneAbbrev } from "../utils";

const FMT = "MMM d, yyyy h:mm a";

// These assertions are independent of the machine's local timezone: the
// abbreviation path reconstructs the wall clock from UTC fields, so the output
// is deterministic regardless of where the test runs.
describe("formatDateInZoneAbbrev — DST-aware abbreviations", () => {
  it("renders a summer EST timestamp in EDT (DST), not one hour behind", () => {
    // 10:05:14Z in US Eastern (July) = EDT (UTC-4) = 06:05.
    const out = formatDateInZoneAbbrev(
      "2026-07-27T10:05:14.314Z",
      FMT,
      "EST",
    );
    expect(out).toBe("Jul 27, 2026 6:05 AM EDT");
  });

  it("renders a winter EST timestamp in EST (standard)", () => {
    // 10:05:00Z in US Eastern (January) = EST (UTC-5) = 05:05.
    const out = formatDateInZoneAbbrev(
      "2026-01-15T10:05:00.000Z",
      FMT,
      "EST",
    );
    expect(out).toBe("Jan 15, 2026 5:05 AM EST");
  });

  it("keeps non-DST zones on their fixed offset and label (WAT, UTC+1)", () => {
    // 05:23Z in WAT (no DST) = 06:23, label unchanged.
    const out = formatDateInZoneAbbrev(
      "2026-07-27T05:23:00.000Z",
      FMT,
      "WAT",
    );
    expect(out).toBe("Jul 27, 2026 6:23 AM WAT");
  });

  it("handles a daylight abbreviation (BST) via its IANA zone in summer", () => {
    // 05:23Z in Europe/London (July) = BST (UTC+1) = 06:23.
    const out = formatDateInZoneAbbrev(
      "2026-07-27T05:23:00.000Z",
      FMT,
      "BST",
    );
    expect(out).toBe("Jul 27, 2026 6:23 AM BST");
  });

  it("returns N/A for empty input", () => {
    expect(formatDateInZoneAbbrev(null, FMT, "EST")).toBe("N/A");
  });
});
