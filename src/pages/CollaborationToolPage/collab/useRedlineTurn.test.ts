import { describe, it, expect } from "vitest";
import {
  redlineSideFromRole,
  buildResolvePayload,
  buildUndoPayload,
  isVersionConflict,
} from "./useRedlineTurn";

const role = (over: Partial<{
  isManager: boolean;
  isVendor: boolean;
  isProjectManager: boolean;
}>) => ({
  isManager: false,
  isVendor: false,
  isProjectManager: false,
  ...over,
});

describe("redlineSideFromRole", () => {
  it("maps the company side (CM/Procurement) to 'manager'", () => {
    expect(redlineSideFromRole(role({ isManager: true }))).toBe("manager");
  });

  it("maps vendor to 'vendor'", () => {
    expect(redlineSideFromRole(role({ isVendor: true }))).toBe("vendor");
  });

  it("maps project manager to 'vendor' (PM acts on the vendor's behalf)", () => {
    expect(redlineSideFromRole(role({ isProjectManager: true }))).toBe("vendor");
  });

  it("returns null for non-participant roles (approver/view-only/admin)", () => {
    expect(redlineSideFromRole(role({}))).toBeNull();
  });

  it("prefers the company side when a role somehow reads as both", () => {
    // Defensive: manager wins so a mis-flagged role can't land on the vendor
    // endpoint. (Not expected in practice — roles are mutually exclusive.)
    expect(
      redlineSideFromRole(role({ isManager: true, isVendor: true })),
    ).toBe("manager");
  });
});

describe("buildResolvePayload", () => {
  it("omits docName/baseVersionId/documentState when the caller omits them", () => {
    expect(buildResolvePayload({ action: "accepted" }, {})).toEqual({
      action: "accepted",
    });
  });

  it("includes tier, docName, and baseVersionId when supplied", () => {
    expect(
      buildResolvePayload(
        { action: "modified", tier: "low" },
        { docName: "room-1", baseVersionId: "v1" },
      ),
    ).toEqual({
      action: "modified",
      tier: "low",
      docName: "room-1",
      baseVersionId: "v1",
    });
  });

  it("includes an explicit null baseVersionId rather than omitting it", () => {
    expect(
      buildResolvePayload(
        { action: "rejected" },
        { docName: "room-1", baseVersionId: null },
      ),
    ).toEqual({
      action: "rejected",
      docName: "room-1",
      baseVersionId: null,
    });
  });
});

describe("buildUndoPayload", () => {
  it("returns an empty object when the scope is empty", () => {
    expect(buildUndoPayload({})).toEqual({});
  });

  it("includes docName and an explicit null baseVersionId when supplied", () => {
    expect(
      buildUndoPayload({ docName: "room-1", baseVersionId: null }),
    ).toEqual({
      docName: "room-1",
      baseVersionId: null,
    });
  });
});

describe("isVersionConflict", () => {
  it("is true for a 409 response", () => {
    expect(isVersionConflict({ response: { status: 409 } })).toBe(true);
  });

  it("is false for a non-409 response", () => {
    expect(isVersionConflict({ response: { status: 400 } })).toBe(false);
  });

  it("is false for an error with no response shape", () => {
    expect(isVersionConflict(new Error("network"))).toBe(false);
  });
});
