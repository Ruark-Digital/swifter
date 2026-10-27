import { describe, it, expect } from "vitest";
import {
  findCombinationTypeId,
  formatContractType,
  resolveContractTypePayload,
} from "../lib/contractType";

const TYPE_OPTIONS = [
  { label: "Fixed Price", value: "id-fixed" },
  { label: "Time & Material", value: "id-tm" },
  { label: "Combination", value: "id-combo" },
  { label: "Milestone", value: "id-ms" },
];

describe("findCombinationTypeId (QA #33)", () => {
  it("finds the Combination option id case-insensitively", () => {
    expect(findCombinationTypeId(TYPE_OPTIONS)).toBe("id-combo");
    expect(
      findCombinationTypeId([{ label: "  combination ", value: "x" }]),
    ).toBe("x");
  });

  it("returns undefined when there is no Combination option", () => {
    expect(
      findCombinationTypeId([{ label: "Fixed Price", value: "id-fixed" }]),
    ).toBeUndefined();
  });
});

describe("resolveContractTypePayload (QA #33)", () => {
  it("passes a normal single type id through unchanged", () => {
    expect(resolveContractTypePayload("id-fixed", "id-combo", [])).toBe(
      "id-fixed",
    );
  });

  it("joins the picked sub-type ids with commas when Combination is selected", () => {
    const picked = [
      { label: "Fixed Price", value: "id-fixed" },
      { label: "Time & Material", value: "id-tm" },
    ];
    expect(resolveContractTypePayload("id-combo", "id-combo", picked)).toBe(
      "id-fixed,id-tm",
    );
  });

  it("accepts plain string ids as well as option objects", () => {
    expect(
      resolveContractTypePayload("id-combo", "id-combo", ["id-fixed", "id-ms"]),
    ).toBe("id-fixed,id-ms");
  });

  it("falls back to the raw type when Combination is selected but nothing picked", () => {
    expect(resolveContractTypePayload("id-combo", "id-combo", [])).toBe(
      "id-combo",
    );
  });

  it("ignores combination picks when the selected type is not Combination", () => {
    const picked = [{ label: "Fixed Price", value: "id-fixed" }];
    expect(resolveContractTypePayload("id-tm", "id-combo", picked)).toBe(
      "id-tm",
    );
  });

  it("returns empty string when no type is selected", () => {
    expect(resolveContractTypePayload("", "id-combo", [])).toBe("");
    expect(resolveContractTypePayload(undefined, "id-combo", [])).toBe("");
  });
});

describe("formatContractType (Combination display)", () => {
  it("shows a populated single type by name", () => {
    expect(
      formatContractType({ _id: "id-fixed", name: "Fixed Price" }, TYPE_OPTIONS),
    ).toBe("Fixed Price");
  });

  it("resolves a single type id to its label", () => {
    expect(formatContractType("id-tm", TYPE_OPTIONS)).toBe("Time & Material");
  });

  it("shows a comma-joined id list as Combination with sub-type names", () => {
    expect(formatContractType("id-fixed,id-tm", TYPE_OPTIONS)).toBe(
      "Combination (Fixed Price, Time & Material)",
    );
  });

  it("shows an array of ids or objects as Combination", () => {
    expect(formatContractType(["id-fixed", "id-ms"], TYPE_OPTIONS)).toBe(
      "Combination (Fixed Price, Milestone)",
    );
    expect(
      formatContractType(
        [{ _id: "id-fixed", name: "Fixed Price" }, { _id: "id-tm" }],
        TYPE_OPTIONS,
      ),
    ).toBe("Combination (Fixed Price, Time & Material)");
  });

  it("skips unknown ids, falling back to plain Combination", () => {
    expect(formatContractType("id-fixed,id-gone", TYPE_OPTIONS)).toBe(
      "Combination (Fixed Price)",
    );
    expect(formatContractType("x,y", [])).toBe("Combination");
  });

  it("returns undefined when there is no type", () => {
    expect(formatContractType(null, TYPE_OPTIONS)).toBeUndefined();
    expect(formatContractType("", TYPE_OPTIONS)).toBeUndefined();
  });
});
