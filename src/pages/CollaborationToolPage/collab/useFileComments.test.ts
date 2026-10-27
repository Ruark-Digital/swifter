import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  anchorCommentIdFromLocation,
  decodeWireToRich,
  formatCommentTimestamp,
} from "./useFileComments";

describe("anchorCommentIdFromLocation", () => {
  it("extracts the SuperDoc comment entity id from a comment: location", () => {
    expect(anchorCommentIdFromLocation("comment:111")).toBe("111");
    expect(anchorCommentIdFromLocation("comment:6a9c4aa6b13c64d259638d8c")).toBe(
      "6a9c4aa6b13c64d259638d8c",
    );
  });

  it("returns null for non-comment or empty locations", () => {
    expect(anchorCommentIdFromLocation("redline:42")).toBeNull();
    expect(anchorCommentIdFromLocation("comment:")).toBeNull();
    expect(anchorCommentIdFromLocation("")).toBeNull();
  });

  it("returns null for absent / non-string values", () => {
    expect(anchorCommentIdFromLocation(undefined)).toBeNull();
    expect(anchorCommentIdFromLocation(null)).toBeNull();
    expect(anchorCommentIdFromLocation(123)).toBeNull();
  });
});

describe("comment timestamps", () => {
  const originalTz = process.env.TZ;
  // Viewer at UTC-4, as in the QA report (Word 6:56 PM vs tool 2:56 PM).
  beforeEach(() => {
    process.env.TZ = "America/New_York";
  });
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it("shows a docx-imported comment at Word's wall-clock time", () => {
    const rich = decodeWireToRich(
      {
        author: "Adedeji Igbayilola",
        text: "Replace with Incoterm 2020",
        date: "2026-10-21T18:56:00Z",
        location: "comment:111",
      },
      0,
    );
    expect(rich.wallClock).toBe(true);
    expect(formatCommentTimestamp(rich.createdAt, rich.wallClock)).toBe(
      "Oct 21, 2026, 6:56 PM",
    );
  });

  it("still converts an in-app comment to the viewer's zone", () => {
    const rich = decodeWireToRich(
      {
        author: "Adedeji Igbayilola",
        text: JSON.stringify({ __ct__: 1, id: "c1", content: "Hello" }),
        date: "2026-10-21T18:56:00.000Z",
      },
      0,
    );
    expect(rich.wallClock).toBeFalsy();
    expect(formatCommentTimestamp(rich.createdAt, rich.wallClock)).toBe(
      "Oct 21, 2026, 2:56 PM",
    );
  });
});
