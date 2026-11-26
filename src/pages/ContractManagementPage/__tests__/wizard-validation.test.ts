import { describe, expect, it } from "vitest";
import {
  canPrefillName,
  isValidContactValue,
  validateApprovalGroups,
  validateLaterStep,
  submitErrorMessage,
} from "../lib/wizardValidation";

describe("canPrefillName", () => {
  it("prefills an empty or whitespace-only name", () => {
    expect(canPrefillName("")).toBe(true);
    expect(canPrefillName("   ")).toBe(true);
    expect(canPrefillName(undefined)).toBe(true);
  });
  it("never overwrites a name the user typed", () => {
    expect(canPrefillName("My Contract")).toBe(false);
    expect(canPrefillName("My Contract", "RFP Alpha")).toBe(false);
  });
  it("updates a name that is still our own earlier prefill", () => {
    expect(canPrefillName("RFP Alpha", "RFP Alpha")).toBe(true);
  });
});

describe("isValidContactValue", () => {
  it("accepts an object id or an email, rejects free text", () => {
    expect(isValidContactValue("507f1f77bcf86cd799439011")).toBe(true);
    expect(isValidContactValue("pm@vendor.com")).toBe(true);
    expect(isValidContactValue("John")).toBe(false);
    expect(isValidContactValue("")).toBe(false);
  });
});

describe("validateApprovalGroups", () => {
  it("ignores an untouched default row", () => {
    expect(
      validateApprovalGroups([
        { name: "", approvers: [], approvalLevel: "0", amount: "" },
      ]),
    ).toEqual([]);
  });
  it("flags a row with approvers but no name, level or amount", () => {
    const fields = validateApprovalGroups([
      { name: "", approvers: [{ id: "u1" }], approvalLevel: "0", amount: "" },
    ]).map((i) => i.field);
    expect(fields).toEqual([
      "approvalGroups.0.name",
      "approvalGroups.0.approvalLevel",
      "approvalGroups.0.amount",
    ]);
  });
  it("passes a complete row", () => {
    expect(
      validateApprovalGroups([
        { name: "Legal", approvers: [{ id: "u1" }], approvalLevel: "2", amount: 5000 },
      ]),
    ).toEqual([]);
  });
});

describe("validateLaterStep", () => {
  it("step 4 rejects half-filled deliverables only", () => {
    const issues = validateLaterStep(4, {
      deliverables: [{ name: "", dueDate: undefined }, { name: "Report" }],
    });
    expect(issues.map((i) => i.field)).toEqual(["deliverables.1.dueDate"]);
  });
  it("step 5 requires a positive value and a payment structure", () => {
    const fields = validateLaterStep(5, { contractValue: "", paymentStructure: "" }).map((i) => i.field);
    expect(fields).toEqual(["contractValue", "paymentStructure"]);
    expect(
      validateLaterStep(5, { contractValue: "1,000", paymentStructure: "monthly", holdback: "10%" }),
    ).toEqual([]);
    expect(
      validateLaterStep(5, { contractValue: 5, paymentStructure: "monthly", holdback: "150" }).map((i) => i.field),
    ).toEqual(["holdback"]);
  });
  it("step 6 needs an expiry date when insured", () => {
    expect(validateLaterStep(6, { contractSecurity: "yes" }).map((i) => i.field)).toEqual(["insuranceExpiryDate"]);
    expect(validateLaterStep(6, { contractSecurity: "no" })).toEqual([]);
  });
});

describe("submitErrorMessage", () => {
  it("shows the backend's reason for a 400", () => {
    const e = {
      response: {
        status: 400,
        data: { message: "Contract amount (900) exceeds remaining MSA budget (500) based on approved invoice spend" },
      },
    };
    expect(submitErrorMessage(e)).toMatch(/exceeds remaining MSA budget/);
  });
  it("joins a list of messages and falls back to a readable sentence", () => {
    expect(submitErrorMessage({ response: { data: { message: ["a", "b"] } } })).toBe("a b");
    expect(submitErrorMessage({})).toMatch(/could not be saved/);
  });
});
