import { describe, it, expect } from "vitest";
import { numberFieldTransform } from "../components/proposalFieldTransforms";

// QA #295: Quantity / Unit Price boxes were stuck at 0 and couldn't be typed
// into. Forge's web adapter forwards the raw DOM change event to
// transform.output, but the old output assumed a string and returned 0 for
// anything else — so every keystroke wrote 0. These assert output now reads the
// event's value (and still accepts raw strings/numbers).
describe("numberFieldTransform.output", () => {
  it("reads the value out of a DOM change event (the Forge web path)", () => {
    const event = {
      target: { value: "42" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    expect(numberFieldTransform.output(event)).toBe(42);
  });

  it("parses a raw string value", () => {
    expect(numberFieldTransform.output("15.5")).toBe(15.5);
  });

  it("passes a numeric value through", () => {
    expect(numberFieldTransform.output(7)).toBe(7);
  });

  it("falls back to 0 for empty / non-numeric input", () => {
    expect(numberFieldTransform.output("")).toBe(0);
    expect(numberFieldTransform.output("abc")).toBe(0);
    expect(
      numberFieldTransform.output({
        target: { value: "" },
      } as unknown as React.ChangeEvent<HTMLInputElement>),
    ).toBe(0);
  });
});

describe("numberFieldTransform.input", () => {
  it("stringifies the stored number for display", () => {
    expect(numberFieldTransform.input(0)).toBe("0");
    expect(numberFieldTransform.input(42)).toBe("42");
  });

  it("returns an empty string for nullish stored values", () => {
    expect(numberFieldTransform.input(undefined)).toBe("");
    expect(numberFieldTransform.input(null)).toBe("");
  });
});
