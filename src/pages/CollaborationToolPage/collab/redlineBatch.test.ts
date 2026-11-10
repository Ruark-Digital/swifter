import { describe, expect, it } from "vitest";
import { buildBatchItems, type BatchCandidate } from "./redlineBatch";
import { buildBatchResolvePayload } from "./useRedlineTurn";

const open = (redlineId: string): BatchCandidate => ({ redlineId });

describe("buildBatchItems", () => {
  it("excludes a suggestion the server already shows as resolved", () => {
    const items = buildBatchItems(
      [
        { redlineId: "a", resolution: { action: "accepted" } },
        { redlineId: "b", resolution: { action: "rejected" } },
        open("c"),
      ],
      { decision: "reject", tier: "medium", mySide: "manager" },
    );
    expect(items.map((i) => i.redlineId)).toEqual(["c"]);
  });

  it("sends a pending approve as accepted with appliedTier and no tier", () => {
    const items = buildBatchItems([open("p")], {
      decision: "approve",
      tier: "high",
      mySide: "vendor",
    });
    expect(items).toEqual([
      { redlineId: "p", action: "accepted", appliedTier: "high" },
    ]);
    expect(items[0]).not.toHaveProperty("tier");
  });

  it("sends a pending reject as rejected", () => {
    const items = buildBatchItems([open("p")], {
      decision: "reject",
      tier: "low",
      mySide: "manager",
    });
    expect(items).toEqual([{ redlineId: "p", action: "rejected" }]);
  });

  it("excludes a suggestion this side already accepted", () => {
    const items = buildBatchItems(
      [
        { redlineId: "mine", accepted: { status: "cm_accepted", cmAccepted: true } },
        { redlineId: "theirs", accepted: { status: "vendor_accepted", vendorAccepted: true } },
      ],
      { decision: "approve", tier: "medium", mySide: "manager" },
    );
    // The other side's acceptance still needs this side's answer, so it stays.
    expect(items.map((i) => i.redlineId)).toEqual(["theirs"]);
  });

  it("excludes a vendor-accepted suggestion for the vendor side only", () => {
    const candidate: BatchCandidate = {
      redlineId: "v",
      accepted: { status: "vendor_accepted", vendorAccepted: true },
    };
    expect(
      buildBatchItems([candidate], { decision: "reject", tier: "low", mySide: "vendor" }),
    ).toEqual([]);
    expect(
      buildBatchItems([candidate], { decision: "reject", tier: "low", mySide: "manager" }),
    ).toHaveLength(1);
  });

  it("returns an empty batch when everything is already resolved", () => {
    const items = buildBatchItems(
      [{ redlineId: "x", resolution: { action: "modified" } }],
      { decision: "approve", tier: "low", mySide: "manager" },
    );
    expect(items).toEqual([]);
  });
});

describe("buildBatchResolvePayload", () => {
  it("sends documentId as a string when the file has an ID", () => {
    const items = buildBatchItems([open("p")], {
      decision: "reject",
      tier: "medium",
      mySide: "manager",
    });
    const payload = buildBatchResolvePayload(items, {
      documentId: "file-123",
      docName: "doc",
      baseVersionId: "v-fresh",
    });
    expect(payload.documentId).toBe("file-123");
    expect(typeof payload.documentId).toBe("string");
    expect(payload.baseVersionId).toBe("v-fresh");
  });

  it("keeps a null baseVersionId and omits an undefined one", () => {
    const items = buildBatchItems([open("p")], {
      decision: "reject",
      tier: "medium",
      mySide: "manager",
    });
    expect(
      buildBatchResolvePayload(items, { documentId: "file-123", baseVersionId: null }),
    ).toHaveProperty("baseVersionId", null);
    expect(
      buildBatchResolvePayload(items, { documentId: "file-123" }),
    ).not.toHaveProperty("baseVersionId");
  });
});
