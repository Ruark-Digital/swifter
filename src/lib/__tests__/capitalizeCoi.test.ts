import { describe, it, expect } from "vitest";
import { capitalizeCoi } from "../utils";

describe("capitalizeCoi — uppercase COI in general-update text (QA #266)", () => {
  it("uppercases a lower-cased standalone 'coi'", () => {
    expect(capitalizeCoi("Finch Monica rejected coi on contract")).toBe(
      "Finch Monica rejected COI on contract"
    );
  });

  it("uppercases a title-cased 'Coi'", () => {
    expect(capitalizeCoi("Approved Coi renewal")).toBe("Approved COI renewal");
  });

  it("leaves an already-uppercase COI unchanged", () => {
    expect(capitalizeCoi("COI expires soon")).toBe("COI expires soon");
  });

  it("only matches whole words — does not touch words that merely contain 'coi'", () => {
    expect(capitalizeCoi("a coin and a choice")).toBe("a coin and a choice");
  });

  it("handles multiple occurrences", () => {
    expect(capitalizeCoi("coi and coi")).toBe("COI and COI");
  });

  it("returns non-string / empty input unchanged", () => {
    expect(capitalizeCoi("")).toBe("");
    // @ts-expect-error — defensive: guards a non-string at runtime.
    expect(capitalizeCoi(undefined)).toBe(undefined);
  });
});
