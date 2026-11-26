import { describe, expect, it } from "vitest";
import { readableAuthor } from "./useFileVersionsApi";

describe("readableAuthor (version history)", () => {
  const names = { "64a1user": "Ada Obi", "64b2user": "cm@qat.example" };
  it("prefers the person's name", () => {
    expect(readableAuthor("64a1user", names)).toBe("Ada Obi");
  });
  it("falls back to the email's local part", () => {
    expect(readableAuthor("64b2user", names)).toBe("Cm");
    expect(readableAuthor("pm1@beta.example", {})).toBe("Pm1");
  });
  it("says Team member for an id nobody matches", () => {
    expect(readableAuthor("unknown-id", names)).toBe("Team member");
  });
});
