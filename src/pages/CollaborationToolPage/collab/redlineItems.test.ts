import { describe, expect, it } from "vitest";
import { enrichWithLive, stalePendingIds } from "./redlineItems";
import type { RedlineSpan } from "./redlineScan";

const item = (
  id: string,
  state: "pending" | "approved" | "dismissed" = "pending",
  extra: Partial<RedlineSpan> = {},
) => ({
  redline: { redlineId: id, kind: "insertion", text: "ProfilePrincipal", ...extra } as RedlineSpan,
  state,
});

describe("enrichWithLive", () => {
  it("splits a replacement card into Original / New once the editor reports it", () => {
    const live: RedlineSpan[] = [
      { redlineId: "a", kind: "insertion", text: "Principal", deletedText: "Profile", insertedText: "Principal" },
    ];
    const [out] = enrichWithLive([item("a")], live);
    expect(out.redline.deletedText).toBe("Profile");
    expect(out.redline.insertedText).toBe("Principal");
  });

  it("returns the same array when nothing changes", () => {
    const items = [item("a")];
    expect(enrichWithLive(items, [{ redlineId: "a", kind: "insertion", text: "x" }])).toBe(items);
    expect(enrichWithLive(items, [])).toBe(items);
  });
});

describe("stalePendingIds", () => {
  const live: RedlineSpan[] = [{ redlineId: "a", kind: "insertion", text: "x" }];

  it("flags pending cards whose change is not in the document", () => {
    expect(stalePendingIds([item("a"), item("b")], live, true)).toEqual(["b"]);
  });

  it("never flags resolved cards (an applied change is expected to be gone)", () => {
    expect(stalePendingIds([item("b", "approved"), item("c", "dismissed")], live, true)).toEqual([]);
  });

  it("flags nothing before the editor has reported its redlines", () => {
    expect(stalePendingIds([item("b")], [], false)).toEqual([]);
  });

  it("a diverged document (no tracked changes at all) marks every pending card stale", () => {
    expect(stalePendingIds([item("a"), item("b")], [], true)).toEqual(["a", "b"]);
  });
});
