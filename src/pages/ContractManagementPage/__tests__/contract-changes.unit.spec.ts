import { test, expect } from "@playwright/test";
import {
  changeTabToApiType,
  formatChangeTypeLabel,
  getCreateChangeTypeOptionsForRole,
  pruneEmptyValuesDeep,
  shouldShowChangeDecisionActions,
  toContractChangeFileItem,
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
        changeType: "proposal",
        urgency: "high",
        description: "Desc",
      })
    ).toEqual({
      title: "Title",
      description: "Desc",
      type: "proposal",
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
      { value: "proposal", label: "Change Proposal" },
      { value: "directive", label: "Change Directive" },
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
      size: 1234,
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
});
