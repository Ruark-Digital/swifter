import { test, expect } from "@playwright/test";
import { getManagerApproveChangeUrl } from "../lib/contractChanges";

test.describe("ADE-85 manager approve change URL", () => {
  test("always includes contractId segment", () => {
    expect(
      getManagerApproveChangeUrl({
        contractId: "c1",
        changeId: "chg1",
        roleBasePath: "/contract/manager/contracts/changes",
      }),
    ).toBe("/contract/manager/contracts/c1/changes/chg1/approve");

    expect(
      getManagerApproveChangeUrl({
        contractId: "c1",
        changeId: "chg1",
        roleBasePath: "/contract/manager/contracts/c1/changes",
      }),
    ).toBe("/contract/manager/contracts/c1/changes/chg1/approve");

    expect(
      getManagerApproveChangeUrl({
        contractId: "c1",
        changeId: "chg1",
        roleBasePath: "/contract/manager/contracts",
      }),
    ).toBe("/contract/manager/contracts/c1/changes/chg1/approve");
  });
});

