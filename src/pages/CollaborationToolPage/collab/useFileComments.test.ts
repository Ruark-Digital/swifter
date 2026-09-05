import { describe, expect, it } from "vitest";
import { anchorCommentIdFromLocation } from "./useFileComments";

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
