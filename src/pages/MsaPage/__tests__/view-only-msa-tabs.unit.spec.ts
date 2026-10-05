import { describe, it, expect } from "vitest";
import { ROLE_TAB_WHITELIST } from "../msaTabWhitelist";

describe("MSA view-only tab whitelist (QA #108)", () => {
  it("does not expose the Approvers tab to view-only users", () => {
    expect(ROLE_TAB_WHITELIST["view only"]).not.toContain("approvers");
  });

  it("keeps the read-only tabs view-only users should see", () => {
    for (const tab of ["overview", "documents", "rfi", "reports"] as const) {
      expect(ROLE_TAB_WHITELIST["view only"]).toContain(tab);
    }
  });
});
