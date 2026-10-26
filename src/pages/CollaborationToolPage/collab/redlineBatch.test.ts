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
      { action: "rejected", tier: "medium", mySide: "manager" },
    );
    expect(items.map((i) => i.redlineId)).toEqual(["c"]);
  });

  it("includes a pending suggestion", () => {
    const items = buildBatchItems([open("p")], {
      action: "modified",
      tier: "high",
      mySide: "vendor",
    });
    expect(items).toEqual([
      { redlineId: "p", action: "modified", tier: "high", appliedTier: "high" },
    ]);
  });

  it("excludes a suggestion this side already accepted", () => {
    const items = buildBatchItems(
      [
        { redlineId: "mine", accepted: { status: "cm_accepted", cmAccepted: true } },
        { redlineId: "theirs", accepted: { status: "vendor_accepted", vendorAccepted: true } },
      ],
      { action: "modified", tier: "medium", mySide: "manager" },
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
      buildBatchItems([candidate], { action: "rejected", tier: "low", mySide: "vendor" }),
    ).toEqual([]);
    expect(
      buildBatchItems([candidate], { action: "rejected", tier: "low", mySide: "manager" }),
    ).toHaveLength(1);
  });

  it("returns an empty batch when everything is already resolved", () => {
    const items = buildBatchItems(
      [{ redlineId: "x", resolution: { action: "modified" } }],
      { action: "modified", tier: "low", mySide: "manager" },
    );
    expect(items).toEqual([]);
  });
});

describe("buildBatchResolvePayload", () => {
  it("carries the freshly fetched baseVersionId into the body", () => {
    const items = buildBatchItems([open("p")], {
      action: "rejected",
      tier: "medium",
      mySide: "manager",
    });
    const payload = buildBatchResolvePayload(items, {
      docName: "doc",
      baseVersionId: "v-fresh",
    });
    expect(payload.baseVersionId).toBe("v-fresh");
    expect(payload).not.toHaveProperty("documentId");
  });

  it("keeps a null baseVersionId and omits an undefined one", () => {
    const items = buildBatchItems([open("p")], {
      action: "rejected",
      tier: "medium",
      mySide: "manager",
    });
    expect(buildBatchResolvePayload(items, { baseVersionId: null })).toHaveProperty(
      "baseVersionId",
      null,
    );
    expect(buildBatchResolvePayload(items, {})).not.toHaveProperty("baseVersionId");
  });
});
