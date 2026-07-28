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

  it("links procurement evaluation actions when the solicitation is nested in evaluation", () => {
    const [item] = DashboardDataTransformer.transformProcurementMyActions([
      {
        evaluation: {
          _id: "evaluation-123",
          solicitation: {
            _id: "solicitation-123",
            name: "Mechanical and Piping Installation",
          },
        },
        action: "score solicitation",
        statusText:
          "Commercial group for Mechanical and Piping Installation has been released for evaluation, please proceed with scoring",
      },
    ]);

    expect(item.text).toContain('<a href="/dashboard/evaluation/evaluation-123" class="underline underline-offset-4 text-blue-600">Mechanical and Piping Installation</a>');
  });

  it("links Company Admin scoring updates to the evaluation detail", () => {
    const [item] = DashboardDataTransformer.transformCompanyAdminGeneralUpdates([
      {
        evaluation: { _id: "evaluation-456" },
        statusText: "Maddison Construction Ltd. was scored on Relevant Project Experience by Dennis Rose",
        createdAt: "2026-07-27T12:00:00.000Z",
      },
    ]);

    expect(item.text).toContain(
      '<a href="/dashboard/evaluation/evaluation-456" class="underline underline-offset-4 text-blue-600">Maddison Construction Ltd.</a>'
    );
  });

  it("links scoring updates when only the solicitation target is available", () => {
    const [item] = DashboardDataTransformer.transformCompanyAdminGeneralUpdates([
      {
        solicitation: { _id: "solicitation-789" },
        statusText: "ME Industrial Services scored on Execution Methodology by Lorne Hambleton",
        createdAt: "2026-07-27T12:00:00.000Z",
      },
    ]);

    expect(item.text).toContain(
      '<a href="/dashboard/solicitation/solicitation-789" class="underline underline-offset-4 text-blue-600">ME Industrial Services</a>'
    );
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

    it("apportions percentages that total exactly 100 for equal shares", () => {
      const result = DashboardDataTransformer.transformSubDistribution({
        totalActive: 3,
        distribution: [
          { plan: "Basic", count: 1 },
          { plan: "Pro", count: 1 },
          { plan: "Enterprise", count: 1 },
        ],
      });

      // Rounding each third independently gave 33+33+33 = 99 (QA #260).
      expect(result.reduce((sum, slice) => sum + slice.percentage, 0)).toBe(100);
      expect(result.map((slice) => slice.percentage)).toEqual([34, 33, 33]);
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
