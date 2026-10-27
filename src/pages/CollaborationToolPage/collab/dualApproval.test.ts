import { describe, expect, it } from "vitest";
import {
  acceptanceActor,
  dualApprovalPhase,
  effectiveApprovalPhase,
  mergeAcceptance,
  redlineHolderLabel,
  withLocalAcceptance,
} from "./useAiRedlineSuggestions";

describe("dualApprovalPhase", () => {
  it("is 'open' when nobody has accepted", () => {
    expect(dualApprovalPhase(undefined, "manager")).toBe("open");
    expect(dualApprovalPhase({ status: "pending" }, "vendor")).toBe("open");
  });

  it("is 'both' when both sides accepted", () => {
    expect(dualApprovalPhase({ status: "both_accepted" }, "manager")).toBe("both");
    expect(dualApprovalPhase({ status: "both_accepted" }, undefined)).toBe("both");
  });

  it("shows the non-accepting side an approve/reject request", () => {
    // CM accepted → the vendor must approve or reject.
    expect(dualApprovalPhase({ status: "cm_accepted" }, "vendor")).toBe("awaiting-me");
    // Vendor accepted → the CM must approve or reject.
    expect(dualApprovalPhase({ status: "vendor_accepted" }, "manager")).toBe(
      "awaiting-me",
    );
  });

  it("tells the accepting side it is waiting on the other", () => {
    expect(dualApprovalPhase({ status: "cm_accepted" }, "manager")).toBe(
      "awaiting-other",
    );
    expect(dualApprovalPhase({ status: "vendor_accepted" }, "vendor")).toBe(
      "awaiting-other",
    );
  });

  it("never hands an observer an actionable request", () => {
    expect(dualApprovalPhase({ status: "cm_accepted" }, undefined)).toBe(
      "awaiting-other",
    );
  });
});

describe("acceptanceActor", () => {
  it("returns the CM actor with who/when for a cm_accepted redline", () => {
    expect(
      acceptanceActor({
        status: "cm_accepted",
        cmAcceptedBy: { id: "u1", name: "Dana" },
        cmAcceptedAt: "2026-09-06T10:00:00Z",
      }),
    ).toEqual({ holder: "manager", name: "Dana", at: "2026-09-06T10:00:00Z" });
  });

  it("returns the vendor actor for a vendor_accepted redline", () => {
    expect(
      acceptanceActor({ status: "vendor_accepted", vendorAcceptedBy: { name: "Lee" } }),
    ).toEqual({ holder: "vendor", name: "Lee", at: undefined });
  });

  it("returns null when zero or both sides have accepted", () => {
    expect(acceptanceActor(undefined)).toBeNull();
    expect(acceptanceActor({ status: "pending" })).toBeNull();
    expect(acceptanceActor({ status: "both_accepted" })).toBeNull();
  });
});

describe("effectiveApprovalPhase (BE-authoritative projection)", () => {
  it("projects the bilateral accepted state", () => {
    expect(
      effectiveApprovalPhase({
        accepted: { status: "cm_accepted" },
        mySide: "vendor",
      }),
    ).toBe("awaiting-me");
    expect(
      effectiveApprovalPhase({
        accepted: { status: "cm_accepted" },
        mySide: "manager",
      }),
    ).toBe("awaiting-other");
    expect(
      effectiveApprovalPhase({
        accepted: { status: "both_accepted" },
        mySide: "manager",
      }),
    ).toBe("both");
  });

  it("is 'open' when the BE has sent no acceptance (or it is pending)", () => {
    expect(effectiveApprovalPhase({ mySide: "manager" })).toBe("open");
    expect(
      effectiveApprovalPhase({ accepted: { status: "pending" }, mySide: "vendor" }),
    ).toBe("open");
  });
});

describe("redlineHolderLabel", () => {
  it("labels each side", () => {
    expect(redlineHolderLabel("manager")).toBe("Contract manager");
    expect(redlineHolderLabel("vendor")).toBe("Vendor PM");
  });
});

describe("withLocalAcceptance", () => {
  it("marks the CM side and awaits the vendor from a clean slate", () => {
    const next = withLocalAcceptance(undefined, "manager");
    expect(next.cmAccepted).toBe(true);
    expect(next.status).toBe("cm_accepted");
    expect(next.shouldRemove).toBe(false);
  });

  it("finalizes to both_accepted when the other side already accepted", () => {
    const next = withLocalAcceptance({ status: "cm_accepted", cmAccepted: true }, "vendor");
    expect(next.vendorAccepted).toBe(true);
    expect(next.status).toBe("both_accepted");
    expect(next.shouldRemove).toBe(true);
  });
});

describe("mergeAcceptance", () => {
  it("adopts the other side's accept the server reports (local optimism + server truth → both)", () => {
    const local = withLocalAcceptance(undefined, "manager"); // cm_accepted
    const server = { status: "vendor_accepted", vendorAccepted: true } as const;
    const merged = mergeAcceptance(local, server);
    expect(merged?.cmAccepted).toBe(true);
    expect(merged?.vendorAccepted).toBe(true);
    expect(merged?.status).toBe("both_accepted");
    expect(merged?.shouldRemove).toBe(true);
  });

  it("keeps a fresh local accept the server has not echoed yet", () => {
    const local = withLocalAcceptance(undefined, "vendor"); // vendor_accepted
    const merged = mergeAcceptance(local, { status: "pending" });
    expect(merged?.vendorAccepted).toBe(true);
    expect(merged?.status).toBe("vendor_accepted");
    expect(merged?.shouldRemove).toBe(false);
  });

  it("takes the server's both-accepted state when there is no local optimism", () => {
    const server = {
      status: "both_accepted",
      cmAccepted: true,
      vendorAccepted: true,
      shouldRemove: true,
    } as const;
    const merged = mergeAcceptance(undefined, server);
    expect(merged?.status).toBe("both_accepted");
    expect(merged?.shouldRemove).toBe(true);
  });

  it("does not resurrect a withdrawn acceptance once local state is cleared", () => {
    // After Undo, local `accepted` is cleared and the BE has cleared it too.
    const merged = mergeAcceptance(undefined, undefined);
    expect(merged).toBeUndefined();
  });

  it("prefers the server's who/when identity fields", () => {
    const local = withLocalAcceptance(undefined, "manager");
    const server = {
      status: "cm_accepted",
      cmAccepted: true,
      cmAcceptedBy: { id: "1", name: "Kings" },
      cmAcceptedAt: "2026-09-10T20:47:54.149Z",
    } as const;
    const merged = mergeAcceptance(local, server);
    expect(merged?.cmAcceptedBy?.name).toBe("Kings");
    expect(merged?.cmAcceptedAt).toBe("2026-09-10T20:47:54.149Z");
  });
});
