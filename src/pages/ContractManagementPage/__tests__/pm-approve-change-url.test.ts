import { describe, expect, it } from "vitest";
import { getPmApproveChangeUrl } from "../lib/contractChanges";

// #57 — Vendor PM first-decision endpoint for a CM-created change order.
describe("getPmApproveChangeUrl", () => {
  it("builds the contract URL from the bare vendor prefix", () => {
    expect(
      getPmApproveChangeUrl({
        roleBasePath: "/contract/vendor/contracts",
        contractId: "c1",
        changeId: "chg1",
      }),
    ).toBe("/contract/vendor/contracts/c1/changes/chg1/pm-approve");
  });

  it("uses a full basePath ending in /{id}/changes as-is (MSA)", () => {
    expect(
      getPmApproveChangeUrl({
        roleBasePath: "/contract/vendor/msa-contracts/c1/changes",
        contractId: "c1",
        changeId: "chg1",
      }),
    ).toBe("/contract/vendor/msa-contracts/c1/changes/chg1/pm-approve");
  });

  it("rebuilds the msa-contracts resource from a bare prefix", () => {
    expect(
      getPmApproveChangeUrl({
        roleBasePath: "/contract/vendor/msa-contracts",
        contractId: "c1",
        changeId: "chg1",
      }),
    ).toBe("/contract/vendor/msa-contracts/c1/changes/chg1/pm-approve");
  });
});
