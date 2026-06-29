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
});
