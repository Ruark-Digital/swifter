import { describe, expect, it } from "vitest";
import { publishedDateOf } from "../components/contractLifecycle";

describe("publishedDateOf", () => {
  const d = "2026-11-26T10:00:00.000Z";
  it.each(["draft", "pending_approval", "Pending Approval"])(
    "hides the stamped datePublished while %s",
    (status) => expect(publishedDateOf(status, d)).toBeUndefined(),
  );
  it.each(["publish", "Published", "active", "suspended", "expired", "terminated"])(
    "shows it once %s",
    (status) => expect(publishedDateOf(status, d)).toBe(d),
  );
  it("is undefined without a datePublished", () => {
    expect(publishedDateOf("active", undefined)).toBeUndefined();
  });
});
