import { test, expect } from "@playwright/test";
import {
  changeTabToApiType,
  extractLockHolderName,
  formatChangeTypeLabel,
  getApproveDraftCoUrl,
  getChangeLockUrl,
  getConvertDirectiveUrl,
  getCreateChangeTypeOptionsForRole,
  isCrCpOriginDraftCo,
  isDraftChangeOrder,
  isLockConflict,
  mergeChangeAttachments,
  pruneEmptyValuesDeep,
  shouldShowChangeDecisionActions,
  toContractChangeFileItem,
  toConvertDirectivePayload,
  toManagerCreateChangePayload,
  toVendorCreateChangePayload,
} from "../lib/contractChanges";

test.describe("contractChanges helpers (unit)", () => {
  test("maps tab values to API type filters", async () => {
    expect(changeTabToApiType("all")).toBeUndefined();
    expect(changeTabToApiType("requests")).toBe("request");
    expect(changeTabToApiType("orders")).toBe("order");
    expect(changeTabToApiType("directive")).toBe("directive");
    expect(changeTabToApiType("proposal")).toBe("proposal");
  });

  test("mergeChangeAttachments keeps existing docs and appends new uploads (QA #116)", async () => {
    const existing = [
      { name: "Prior.docx", url: "https://cdn/prior.docx", type: "docx", size: "1 MB" },
    ];
    const uploaded = [
      { name: "New.docx", url: "https://cdn/new.docx", type: "docx", size: "2 MB" },
    ];
    const merged = mergeChangeAttachments(existing, uploaded);
    expect(merged.map((f) => f.url)).toEqual([
      "https://cdn/prior.docx",
      "https://cdn/new.docx",
    ]);
  });

  test("mergeChangeAttachments de-dupes by URL and preserves existing when no uploads", async () => {
    const existing = [
      { name: "A.pdf", url: "https://cdn/a.pdf", type: "pdf", size: "1 MB" },
    ];
    // No new uploads → existing must survive (the original QA #116 wipe case).
    expect(mergeChangeAttachments(existing, [])).toEqual(existing);
    // Same URL uploaded again → not duplicated.
    expect(mergeChangeAttachments(existing, existing)).toHaveLength(1);
  });

  test("formats change type labels", async () => {
    expect(formatChangeTypeLabel("request")).toBe("Request");
    expect(formatChangeTypeLabel("order")).toBe("Order");
    expect(formatChangeTypeLabel("directive")).toBe("Directive");
    expect(formatChangeTypeLabel("proposal")).toBe("Proposal");
  });

  test("builds manager create-change payload from dialog values", async () => {
    expect(
      toManagerCreateChangePayload({
        changeName: "Title",
        changeType: "order",
        urgency: "high",
        description: "Desc",
      })
    ).toEqual({
      title: "Title",
      description: "Desc",
      type: "order",
      urgency: "high",
    });

    expect(
      toManagerCreateChangePayload({
        changeName: "Title",
        changeType: "directive",
        urgency: "urgent",
        description: "Desc",
      })
    ).toEqual({
      title: "Title",
      description: "Desc",
      type: "directive",
    });

    expect(
      toManagerCreateChangePayload({
        changeName: "Title",
        changeType: "directive",
        urgency: "high",
        description: "Desc",
        amount: "$1,500.50",
      })
    ).toEqual({
      title: "Title",
      description: "Desc",
      type: "directive",
      urgency: "high",
      amount: 1500.5,
    });
  });

  test("builds vendor create-change payload from dialog values", async () => {
    expect(
      toVendorCreateChangePayload({
        changeName: "Title",
        changeType: "request",
        urgency: "high",
        description: "Desc",
      })
    ).toEqual({
      title: "Title",
      description: "Desc",
      type: "request",
      urgency: "high",
    });

    expect(
      toVendorCreateChangePayload({
        changeName: "Title",
        changeType: "order",
        urgency: "low",
        description: "Desc",
      })
    ).toEqual({
      title: "Title",
      description: "Desc",
      type: "order",
      urgency: "low",
    });

    expect(
      toVendorCreateChangePayload({
        changeName: "Title",
        changeType: "proposal",
        urgency: "medium",
        description: "Desc",
      })
    ).toEqual({
      title: "Title",
      description: "Desc",
      type: "proposal",
      urgency: "medium",
      proposalCategory: "placeholder",
    });
  });

  test("restricts create-change type options by role", async () => {
    expect(getCreateChangeTypeOptionsForRole({ isManager: true, isVendor: false })).toEqual([
      { value: "directive", label: "Change Directive" },
      { value: "order", label: "Change Order" },
    ]);

    expect(getCreateChangeTypeOptionsForRole({ isManager: false, isVendor: true })).toEqual([
      { value: "request", label: "Change Request" },
      { value: "order", label: "Change Order" },
      { value: "proposal", label: "Change Proposal" },
    ]);
  });

  test("hides decision actions for directive changes", async () => {
    expect(shouldShowChangeDecisionActions("directive")).toBe(false);
    expect(shouldShowChangeDecisionActions("order")).toBe(true);
    expect(shouldShowChangeDecisionActions("proposal")).toBe(true);
    expect(shouldShowChangeDecisionActions("request")).toBe(true);
  });

  test("maps uploaded file response to contract file payload", async () => {
    const file = { name: "doc.pdf", size: 1234, type: "application/pdf" } as File;
    const uploaded = {
      name: "doc.pdf",
      url: "https://cdn.example.com/doc.pdf",
      type: "application/pdf",
      size: "1234",
      download: "https://cdn.example.com/doc.pdf?download=1",
    };

    expect(toContractChangeFileItem(file, uploaded)).toEqual({
      name: "doc.pdf",
      url: "https://cdn.example.com/doc.pdf",
      type: "application/pdf",
      size: "1234",
    });
  });

  test("prunes empty values deeply but keeps 0 and false", async () => {
    const payload = pruneEmptyValuesDeep({
      title: "Contract",
      emptyString: "",
      whitespace: "   ",
      nil: null,
      undef: undefined,
      zero: 0,
      nope: false,
      nested: {
        a: "",
        b: { c: [] },
        d: { e: "ok", f: " " },
      },
      arr: ["", "x", "  ", 0, false, [], {}, { y: "" }, { y: "z" }],
      keepDate: new Date("2025-01-01T00:00:00.000Z"),
    });

    expect(payload).toEqual({
      title: "Contract",
      zero: 0,
      nope: false,
      nested: { d: { e: "ok" } },
      arr: ["x", 0, false, { y: "z" }],
      keepDate: new Date("2025-01-01T00:00:00.000Z"),
    });
  });

  // ── #76 change edit/approve lock helpers ──────────────────────────
  test("builds change lock url — basePath already ends with /{id}/changes", async () => {
    expect(
      getChangeLockUrl({
        roleBasePath: "/contract/manager/contracts/C1/changes",
        contractId: "C1",
        changeId: "CHG1",
      })
    ).toBe("/contract/manager/contracts/C1/changes/CHG1/lock");
  });

  test("builds change lock url — rebuilds from role + resource segments", async () => {
    expect(
      getChangeLockUrl({
        roleBasePath: "/contract/manager/contracts",
        contractId: "C1",
        changeId: "CHG1",
      })
    ).toBe("/contract/manager/contracts/C1/changes/CHG1/lock");

    // MSA resource segment is preserved (lock exists for both resources).
    expect(
      getChangeLockUrl({
        roleBasePath: "/contract/approver/msa-contracts",
        contractId: "M1",
        changeId: "CHG9",
      })
    ).toBe("/contract/approver/msa-contracts/M1/changes/CHG9/lock");

    // Unknown/empty basePath falls back to manager + contracts.
    expect(
      getChangeLockUrl({ roleBasePath: "", contractId: "C1", changeId: "CHG1" })
    ).toBe("/contract/manager/contracts/C1/changes/CHG1/lock");
  });

  test("detects a 409 lock conflict only", async () => {
    expect(isLockConflict({ response: { status: 409 } })).toBe(true);
    expect(isLockConflict({ response: { status: 403 } })).toBe(false);
    expect(isLockConflict({ response: { status: 500 } })).toBe(false);
    expect(isLockConflict(new Error("network"))).toBe(false);
    expect(isLockConflict(undefined)).toBe(false);
  });

  test("extracts the lock holder name from varied 409 body shapes", async () => {
    expect(
      extractLockHolderName({ response: { data: { lockedBy: { name: "Ada L" } } } })
    ).toBe("Ada L");
    expect(
      extractLockHolderName({ response: { data: { data: { holder: { name: "Bob" } } } } })
    ).toBe("Bob");
    expect(
      extractLockHolderName({ response: { data: { lockedBy: "Cara" } } })
    ).toBe("Cara");
    // Holder object with only an email falls back to email.
    expect(
      extractLockHolderName({ response: { data: { holder: { email: "d@e.com" } } } })
    ).toBe("d@e.com");
    // No holder info → undefined (caller uses a generic label).
    expect(extractLockHolderName({ response: { data: {} } })).toBeUndefined();
    expect(extractLockHolderName(undefined)).toBeUndefined();
  });

  // ── #79 draft change-order finalization helpers ───────────────────
  test("detects a draft change order (type order + status draft)", async () => {
    expect(isDraftChangeOrder({ type: "order", status: "draft" })).toBe(true);
    expect(isDraftChangeOrder({ type: "Order", status: "Draft" })).toBe(true);
    // Not a draft CO:
    expect(isDraftChangeOrder({ type: "order", status: "pending" })).toBe(false);
    expect(isDraftChangeOrder({ type: "order", status: "approved" })).toBe(false);
    expect(isDraftChangeOrder({ type: "proposal", status: "draft" })).toBe(false);
    expect(isDraftChangeOrder({ type: "request", status: "draft" })).toBe(false);
    expect(isDraftChangeOrder({})).toBe(false);
    expect(isDraftChangeOrder(null)).toBe(false);
    expect(isDraftChangeOrder(undefined)).toBe(false);
  });

  test("detects CR/CP-origin draft CO (drives who acts — QA #117)", async () => {
    // CR/CP origin → Vendor PM acts.
    expect(isCrCpOriginDraftCo({ originalChangeType: "request" })).toBe(true);
    expect(isCrCpOriginDraftCo({ originalChangeType: "proposal" })).toBe(true);
    expect(isCrCpOriginDraftCo({ originalChangeType: "Proposal" })).toBe(true);
    // Directive / unknown / missing origin → CM acts (fallback).
    expect(isCrCpOriginDraftCo({ originalChangeType: "directive" })).toBe(false);
    expect(isCrCpOriginDraftCo({ originalChangeType: "" })).toBe(false);
    expect(isCrCpOriginDraftCo({})).toBe(false);
    expect(isCrCpOriginDraftCo(null)).toBe(false);
    expect(isCrCpOriginDraftCo(undefined)).toBe(false);
  });

  test("builds approve-draft-co url with dual path + resource handling", async () => {
    // basePath already ends with /{id}/changes
    expect(
      getApproveDraftCoUrl({
        roleBasePath: "/contract/vendor/contracts/C1/changes",
        contractId: "C1",
        changeId: "CO2",
      })
    ).toBe("/contract/vendor/contracts/C1/changes/CO2/approve-draft-co");

    // rebuilt from role + resource
    expect(
      getApproveDraftCoUrl({
        roleBasePath: "/contract/vendor/contracts",
        contractId: "C1",
        changeId: "CO2",
      })
    ).toBe("/contract/vendor/contracts/C1/changes/CO2/approve-draft-co");

    expect(
      getApproveDraftCoUrl({
        roleBasePath: "/contract/manager/msa-contracts",
        contractId: "M1",
        changeId: "CO9",
      })
    ).toBe("/contract/manager/msa-contracts/M1/changes/CO9/approve-draft-co");

    // unknown basePath → manager + contracts fallback
    expect(
      getApproveDraftCoUrl({ roleBasePath: "", contractId: "C1", changeId: "CO2" })
    ).toBe("/contract/manager/contracts/C1/changes/CO2/approve-draft-co");
  });

  // ── #147 convert-directive helpers ────────────────────────────────
  test("builds convert-directive url with dual path + resource handling", async () => {
    // basePath already ends with /{id}/changes
    expect(
      getConvertDirectiveUrl({
        roleBasePath: "/contract/vendor/contracts/C1/changes",
        contractId: "C1",
        changeId: "CD1",
      })
    ).toBe("/contract/vendor/contracts/C1/changes/CD1/convert-directive");

    // rebuilt from role + resource (contract + MSA)
    expect(
      getConvertDirectiveUrl({
        roleBasePath: "/contract/vendor/contracts",
        contractId: "C1",
        changeId: "CD1",
      })
    ).toBe("/contract/vendor/contracts/C1/changes/CD1/convert-directive");

    expect(
      getConvertDirectiveUrl({
        roleBasePath: "/contract/vendor/msa-contracts",
        contractId: "M1",
        changeId: "CD9",
      })
    ).toBe("/contract/vendor/msa-contracts/M1/changes/CD9/convert-directive");

    // unknown basePath → vendor + contracts fallback (vendor-only endpoint)
    expect(
      getConvertDirectiveUrl({ roleBasePath: "", contractId: "C1", changeId: "CD1" })
    ).toBe("/contract/vendor/contracts/C1/changes/CD1/convert-directive");
  });

  test("builds convert-directive payload (CO/CP) from dialog values", async () => {
    // Convert to Change Order — no proposalCategory.
    expect(
      toConvertDirectivePayload({
        type: "order",
        title: "Extra scaffolding",
        description: "Directive to add scaffolding",
        amount: "$12,000.50",
        urgency: "high",
      })
    ).toEqual({
      type: "order",
      title: "Extra scaffolding",
      description: "Directive to add scaffolding",
      amount: 12000.5,
      urgency: "high",
    });

    // Convert to Change Proposal — default placeholder category, mirrors create.
    expect(
      toConvertDirectivePayload({
        type: "proposal",
        title: "Extra scaffolding",
        description: "Directive to add scaffolding",
        amount: "5000",
      })
    ).toEqual({
      type: "proposal",
      title: "Extra scaffolding",
      description: "Directive to add scaffolding",
      amount: 5000,
      proposalCategory: "placeholder",
    });

    // Explicit category wins; invalid urgency is dropped; missing amount → 0.
    expect(
      toConvertDirectivePayload({
        type: "proposal",
        title: "T",
        description: "D",
        urgency: "urgent",
        proposalCategory: "Scope",
      })
    ).toEqual({
      type: "proposal",
      title: "T",
      description: "D",
      amount: 0,
      proposalCategory: "Scope",
    });
  });
});
