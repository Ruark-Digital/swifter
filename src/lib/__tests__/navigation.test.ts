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
});
