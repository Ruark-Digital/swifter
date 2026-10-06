import { describe, it, expect } from "vitest";
import { resolvePendingPmTakeover } from "../pmTakeover";

describe("resolvePendingPmTakeover (dual-read for docs v2.3.0 shape drift)", () => {
  it("detects the new pendingProjectManager shape and resolves a populated name", () => {
    const result = resolvePendingPmTakeover({
      projectManager: null as never,
      pendingProjectManager: {
        user: { _id: "pm1", name: "Pending PM" },
        status: "pending",
        actionedAt: null,
      },
    });
    expect(result).toEqual({ pending: true, requesterName: "Pending PM" });
  });

  it("prefers the nested user.user.name when the BE double-populates", () => {
    const result = resolvePendingPmTakeover({
      pendingProjectManager: {
        user: { name: "requester@swiftpro.com", user: { name: "Requesting PM" } },
        status: "pending",
      },
    });
    expect(result).toEqual({ pending: true, requesterName: "Requesting PM" });
  });

  it("returns pending with no name when user is a bare ObjectId string", () => {
    const result = resolvePendingPmTakeover({
      pendingProjectManager: {
        user: "507f1f77bcf86cd799439015",
        status: "pending",
      },
    });
    expect(result).toEqual({ pending: true, requesterName: undefined });
  });

  it("falls back to the legacy projectManager.status === 'pending' shape", () => {
    const result = resolvePendingPmTakeover({
      projectManager: {
        user: { name: "legacy@swiftpro.com", user: { name: "Legacy PM" } },
        status: "pending",
      } as never,
    });
    expect(result).toEqual({ pending: true, requesterName: "Legacy PM" });
  });

  it("is not pending once the assignment is approved (new shape)", () => {
    const result = resolvePendingPmTakeover({
      projectManager: {
        user: { _id: "pm1", name: "Approved PM" },
        status: "approved",
      },
      pendingProjectManager: undefined,
    });
    expect(result).toEqual({ pending: false });
  });

  it("is not pending when neither field carries a pending status", () => {
    expect(resolvePendingPmTakeover({})).toEqual({ pending: false });
    expect(resolvePendingPmTakeover(null)).toEqual({ pending: false });
    expect(resolvePendingPmTakeover(undefined)).toEqual({ pending: false });
  });
});
