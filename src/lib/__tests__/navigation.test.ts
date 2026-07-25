import { describe, expect, it } from "vitest";
import { getNavigationForRole } from "@/lib/navigation";
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

  it("places Contract Management then Evaluation Management right after Solicitation Management for company_admin", () => {
    const items = getNavigationForRole(
      "company_admin",
      "/dashboard",
      allModules,
    );

    const solicitationIndex = items.findIndex(
      (item) => item.title === "Solicitation Management",
    );
    expect(solicitationIndex).toBeGreaterThanOrEqual(0);
    expect(items[solicitationIndex + 1]?.title).toBe("Contract Management");
    expect(items[solicitationIndex + 2]?.title).toBe("Evaluation Management");
  });
});
