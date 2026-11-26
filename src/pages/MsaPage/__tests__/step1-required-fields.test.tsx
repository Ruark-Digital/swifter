import { describe, expect, it, vi } from "vitest";
import { MSA_STEP_VALIDATION_FIELDS, schema } from "../layouts/CreateMSADialog";

describe("MSA step 1 required fields (API: title, msaType, description, rating, businessDivision, currency)", () => {
  it("validates businessDivision and rating before Next", () => {
    expect(MSA_STEP_VALIDATION_FIELDS[1]).toEqual(
      expect.arrayContaining(["name", "type", "description", "rating", "businessDivision", "currency"]),
    );
  });

  it("flags a missing business division and a missing rating with clear messages", async () => {
    const base = { name: "n", type: "t", currency: "CAD", description: "d", projectManager: "pm" };
    await expect(schema.validateAt("businessDivision", { ...base, businessDivision: "" })).rejects.toThrow(
      "Business division is required",
    );
    await expect(schema.validateAt("rating", { ...base, rating: undefined })).rejects.toThrow(
      "Complexity rating is required",
    );
  });
});

describe("friendlyAmendmentError", async () => {
  // pdf.js (pulled in by the amendment dialog) needs DOMMatrix, absent in jsdom.
  vi.stubGlobal("DOMMatrix", class {});
  const { friendlyAmendmentError } = await import("@/pages/ContractManagementPage/layouts/AmendmentsTabContent");
  it("replaces a raw impact enum error with a readable message", () => {
    const err: any = { response: { status: 422, data: { message: "Invalid enum value at impact" } } };
    expect(friendlyAmendmentError(err)).toMatch(/select an impact type/i);
  });
  it("passes other errors through", () => {
    const err: any = { response: { status: 500, data: { message: "boom" } } };
    expect(friendlyAmendmentError(err)).toBe(err);
  });
});
