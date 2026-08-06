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

  it("links a project general-update to the project list, not the contract endpoint (#85)", () => {
    const [item] = DashboardDataTransformer.transformContractManagerDashboardActivity([
      {
        id: "6a6fd1b0cfbedafceac39bd0",
        statusText:
          'Kaitlyn Wilkins updated project "35MW Hyperscale Data Center (120,000 sq ft)"',
        status: "active",
        type: "Project",
        entityRef: "6a66660a4b066e51a31d5063",
        entityType: "Project",
        entityId: "PJTMC7918",
        date: "2026-08-02T23:24:32.254Z",
      },
    ]);

    expect(item.text).toContain(
      '<a href="/dashboard/project-management" class="underline underline-offset-4 text-blue-600">35MW Hyperscale Data Center (120,000 sq ft)</a>',
    );
    // The human code must never be used as a contract id (it 404s).
    expect(item.text).not.toContain("contract-management/PJTMC7918");
    expect(item.text).not.toContain("PJTMC7918");
  });

  it("links contract updates when the API provides detailRef", () => {
    const [item] = DashboardDataTransformer.transformContractManagerDashboardActivity([
      {
        statusText: 'Finch Monica created contract "Fire Protection Systems Installation".',
        detailRef: "contract-456",
        contractDef: "Contract",
        createdAt: "2026-07-27T18:14:00.000Z",
      },
    ]);

    expect(item.text).toContain(
      '<a href="/dashboard/contract-management/contract-456" class="underline underline-offset-4 text-blue-600">Fire Protection Systems Installation</a>',
    );
  });

  it.each(["approve_invoice", "project_created"])(
    "links status text for the backend activity name %s",
    (name) => {
      const [item] =
        DashboardDataTransformer.transformContractManagerDashboardActivity([
          {
            name,
            statusText: "Office Lease Agreement requires attention",
            detailRef: "contract-789",
            contractDef: "Contract",
          },
        ]);

      expect(item.text).toBe(
        '<a href="/dashboard/contract-management/contract-789" class="underline underline-offset-4 text-blue-600">Office Lease Agreement requires attention</a>',
      );
    },
  );

  it("does not link unrecognized backend activity names without a link target in the text", () => {
    const [item] =
      DashboardDataTransformer.transformContractManagerDashboardActivity([
        {
          name: "unknown_activity",
          statusText: "Office Lease Agreement requires attention",
          detailRef: "contract-789",
          contractDef: "Contract",
        },
      ]);

    expect(item.text).toBe("Office Lease Agreement requires attention");
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
