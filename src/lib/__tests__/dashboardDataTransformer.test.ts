import { describe, expect, it } from "vitest";
import { DashboardDataTransformer } from "@/lib/dashboardDataTransformer";

describe("DashboardDataTransformer", () => {
  it("keeps contract manager my actions as plain text", () => {
    const [item] = DashboardDataTransformer.transformContractManagerDashboardActivity([
      {
        id: "log-1",
        actionText: "Review the update on Contract",
        statusText: "Pre Engineered Building Updated - Review Required",
        contractRef: "contract-123",
        contractDef: "Contract",
        detailType: "ContractInvoice",
        createdAt: "2026-06-27T18:23:00.000Z",
      },
    ]);

    expect(item.text).toContain("Review the update on Contract");
    expect(item.text).toContain("Pre Engineered Building Updated - Review Required");
    expect(item.text).toContain("/dashboard/contract-management/contract-123?tab=invoice");
    expect(item.text).not.toContain("<strong>");
  });

  describe("transformSubDistribution", () => {
    it("computes a real percentage per plan from counts", () => {
      const result = DashboardDataTransformer.transformSubDistribution({
        totalActive: 30,
        distribution: [
          { plan: "Basic", count: 10 },
          { plan: "Pro", count: 20 },
        ],
      });

      expect(result).toEqual([
        expect.objectContaining({ name: "Basic", value: 10, percentage: 33 }),
        expect.objectContaining({ name: "Pro", value: 20, percentage: 67 }),
      ]);
    });

    it("returns the 3-entry zeroed fallback with percentage: 0 when data is undefined", () => {
      const result = DashboardDataTransformer.transformSubDistribution(undefined);

      expect(result).toEqual([
        expect.objectContaining({ name: "Basic", value: 0, percentage: 0 }),
        expect.objectContaining({ name: "Pro", value: 0, percentage: 0 }),
        expect.objectContaining({ name: "Enterprise", value: 0, percentage: 0 }),
      ]);
    });
  });
});
