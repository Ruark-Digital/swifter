import { describe, expect, it } from "vitest";
import { computeLandingTabs, resolveLandingTabRole } from "../useLandingTabs";
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
});

describe("resolveLandingTabRole (QA #225)", () => {
  it("PM-only account resolves to project_manager (no Solicitation surface)", () => {
    expect(resolveLandingTabRole("project_manager", ["project_manager"])).toBe(
      "project_manager",
    );
  });

  it("PM + vendor account resolves to vendor (Solicitation returns)", () => {
    expect(
      resolveLandingTabRole("project_manager", ["project_manager", "vendor"]),
    ).toBe("vendor");
  });

  it("non-PM active roles pass through unchanged", () => {
    expect(resolveLandingTabRole("vendor", ["vendor"])).toBe("vendor");
    expect(resolveLandingTabRole("company_admin", ["company_admin"])).toBe(
      "company_admin",
    );
    expect(resolveLandingTabRole("procurement", ["procurement"])).toBe(
      "procurement",
    );
  });

  it("PM-only landing tabs omit the Solicitation toggle, leaving only Contracts", () => {
    const role = resolveLandingTabRole("project_manager", ["project_manager"]);
    expect(computeLandingTabs(role, modulesOn).map((t) => t.id)).toEqual([
      "contracts",
    ]);
  });

  it("PM + vendor landing tabs include the Solicitation toggle", () => {
    const role = resolveLandingTabRole("project_manager", [
      "project_manager",
      "vendor",
    ]);
    expect(computeLandingTabs(role, modulesOn).map((t) => t.id)).toEqual([
      "invitations",
      "contracts",
    ]);
  });
});
