import { describe, expect, it } from "vitest";
import { getNavigationForRole, getFirstAccessibleRoute } from "@/lib/navigation";
import type { Modules } from "@/types";

const allModules: Modules = {
  _id: "module-1",
  companyId: "company-1",
  contractManagement: true,
  solicitationManagement: true,
  evaluationsManagement: true,
  vendorManagement: true,
  reportsAnalytics: true,
  vendorsQA: true,
  generalUpdatesNotifications: true,
  addendumManagement: true,
  myActions: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  __v: 0,
};

describe("navigation role access", () => {
  it("hides Vendor Management for contract manager", () => {
    const items = getNavigationForRole(
      "contract_manager",
      "/dashboard/contract-management",
      allModules,
    );

    expect(items.some((item) => item.title === "Vendor Management")).toBe(false);
  });

  it("keeps Vendor Management for procurement", () => {
    const items = getNavigationForRole(
      "procurement",
      "/dashboard/vendor",
      allModules,
    );

    expect(items.some((item) => item.title === "Vendor Management")).toBe(true);
  });

  it("shows Dashboard for project_manager when contractManagement is on", () => {
    const items = getNavigationForRole(
      "project_manager",
      "/dashboard",
      allModules,
    );
    expect(items.some((i) => i?.title === "Dashboard")).toBe(true);
  });

  it("hides Dashboard for project_manager when contractManagement is off", () => {
    const items = getNavigationForRole(
      "project_manager",
      "/dashboard",
      { ...allModules, contractManagement: false },
    );
    expect(items.some((i) => i?.title === "Dashboard")).toBe(false);
  });

  it("hides Dashboard for view_only regardless of flag", () => {
    const items = getNavigationForRole(
      "view_only",
      "/dashboard",
      allModules,
    );
    expect(items.some((i) => i?.title === "Dashboard")).toBe(false);
  });

  it("places Evaluation Management then Projects then Contract Management right after Solicitation Management for company_admin", () => {
    const items = getNavigationForRole(
      "company_admin",
      "/dashboard",
      allModules,
    );

    const solicitationIndex = items.findIndex(
      (item) => item.title === "Solicitation Management",
    );
    expect(solicitationIndex).toBeGreaterThanOrEqual(0);
    expect(items[solicitationIndex + 1]?.title).toBe("Evaluation Management");
    expect(items[solicitationIndex + 2]?.title).toBe("Projects");
    expect(items[solicitationIndex + 3]?.title).toBe("Contract Management");
  });

  it("hides Projects for company_admin when contractManagement is off", () => {
    const items = getNavigationForRole(
      "company_admin",
      "/dashboard",
      { ...allModules, contractManagement: false },
    );

    expect(items.some((item) => item.title === "Projects")).toBe(false);
  });
});

// The RoleSwitcher routes to this on a role switch so the user never lingers on
// the previous role's now-unreachable page. It must return the first item that
// role's sidebar actually shows.
describe("getFirstAccessibleRoute", () => {
  it("returns the (role-aware) dashboard when the role shows one", () => {
    expect(getFirstAccessibleRoute("company_admin", allModules)).toBe(
      "/dashboard",
    );
  });

  it("returns the first role-specific item when the role has no dashboard", () => {
    // view_only never gets a Dashboard entry, so its first accessible item is
    // Contract Management.
    expect(getFirstAccessibleRoute("view_only", allModules)).toBe(
      "/dashboard/contract-management",
    );
  });

  it("skips module-gated items and returns the first that survives", () => {
    // view_only with contractManagement off loses Contract Management, leaving
    // Profile as the only (and therefore first) accessible route.
    expect(
      getFirstAccessibleRoute("view_only", {
        ...allModules,
        contractManagement: false,
      }),
    ).toBe("/dashboard/profile");
  });
});
