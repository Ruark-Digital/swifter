import { describe, expect, it } from "vitest";
import { computeLandingTabs } from "../useLandingTabs";
import type { Modules } from "@/types";

const modulesOn: Modules = {
  _id: "m1", companyId: "c1",
  contractManagement: true, solicitationManagement: true, evaluationsManagement: true,
  vendorManagement: true, reportsAnalytics: true, vendorsQA: true,
  generalUpdatesNotifications: true, addendumManagement: true, myActions: true,
  createdAt: new Date(), updatedAt: new Date(), __v: 0,
};
const modulesOff: Modules = { ...modulesOn, contractManagement: false };

describe("computeLandingTabs", () => {
  it("procurement with flag on returns [solicitations] only", () => {
    const tabs = computeLandingTabs("procurement", modulesOn);
    expect(tabs.map((t) => t.id)).toEqual(["solicitations"]);
  });
  it("procurement with flag off returns [solicitations] only", () => {
    const tabs = computeLandingTabs("procurement", modulesOff);
    expect(tabs.map((t) => t.id)).toEqual(["solicitations"]);
  });
  it("vendor with flag on returns [invitations, contracts]", () => {
    const tabs = computeLandingTabs("vendor", modulesOn);
    expect(tabs.map((t) => t.id)).toEqual(["invitations", "contracts"]);
  });
  it("vendor with flag off returns [invitations] only", () => {
    expect(computeLandingTabs("vendor", modulesOff).map((t) => t.id)).toEqual(["invitations"]);
  });
  it("company_admin with flag on returns [overview, contracts]", () => {
    expect(
      computeLandingTabs("company_admin", modulesOn).map((t) => t.id),
    ).toEqual(["overview", "contracts"]);
  });
  it("company_admin with flag off returns [overview]", () => {
    expect(
      computeLandingTabs("company_admin", modulesOff).map((t) => t.id),
    ).toEqual(["overview"]);
  });
  it("project_manager with flag on returns [contracts]", () => {
    expect(computeLandingTabs("project_manager", modulesOn).map((t) => t.id)).toEqual(["contracts"]);
  });
  it("project_manager with flag off returns []", () => {
    expect(computeLandingTabs("project_manager", modulesOff)).toEqual([]);
  });
  it("contract_manager is unaffected (returns [])", () => {
    expect(computeLandingTabs("contract_manager", modulesOn)).toEqual([]);
  });

  // The PM (Vendor-PM / CLM) side shows only the Contracts dashboard — no
  // Solicitation toggle. Landing tabs come from the ACTIVE role, so a PM is
  // always project_manager here (even when the account also holds vendor);
  // the account-level vendor/PM switch replaces the in-dashboard toggle.
  it("project_manager landing tabs are Contracts-only (no Solicitation toggle)", () => {
    expect(computeLandingTabs("project_manager", modulesOn).map((t) => t.id)).toEqual([
      "contracts",
    ]);
  });
});
