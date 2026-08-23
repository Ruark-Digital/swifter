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

  it("renders the activity date in the item's BE timezone with the abbreviation", () => {
    const [item] = DashboardDataTransformer.transformContractManagerDashboardActivity([
      {
        id: "gu-1",
        statusText: 'Lancaster Cole approved change request on "Office Lease Agreement"',
        status: "approved",
        contractRef: "contract-123",
        contractDef: "Contract",
        type: "ContractChange",
        date: "2026-08-12T09:49:32.333Z",
        timezone: "EST",
      },
    ]);

    // 09:49 UTC converted into US-Eastern with the zone appended. August is
    // daylight time, so the DST-aware helper resolves EST -> EDT (UTC-4) = 5:49 AM.
    expect(item.date).toBe("Aug 12, 2026 5:49 AM EDT");
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

  it("renders the my-action date from the top-level createdAt/timezone when the solicitation omits createdAt", () => {
    const [item] = DashboardDataTransformer.transformProcurementMyActions([
      {
        action: "proposal_submitted",
        createdAt: "2026-08-15T21:02:48.959Z",
        timezone: "EST",
        statusText:
          "Lennox Capital Inc. has submitted a proposal for HVAC and Cooling Infrastructure, please review",
        // The nested solicitation carries no createdAt (real BE payload shape).
        solicitation: {
          _id: "6a664a122d125dee0588cda7",
          name: "HVAC and Cooling Infrastructure",
          timezone: "EST",
        },
        evaluation: null,
      },
    ]);

    // 21:02 UTC in US-Eastern; August is daylight time -> EDT (UTC-4) = 5:02 PM.
    expect(item.date).toBe("Aug 15, 2026 5:02 PM EDT");
  });

  it("links a 'create evaluation' my-action to the solicitation (no evaluation exists yet)", () => {
    const [item] = DashboardDataTransformer.transformProcurementMyActions([
      {
        action: "create_evaluation",
        solicitation: {
          _id: "6a666cd158b11dd9e87bcb34",
          name: "2025 Member Innovation Grants – Technology Education Projects",
        },
        evaluation: null,
        statusText:
          "Deadline approaching for 2025 Member Innovation Grants – Technology Education Projects, please create evaluation",
      },
    ]);

    expect(item.text).toContain(
      '<a href="/dashboard/solicitation/6a666cd158b11dd9e87bcb34" class="underline underline-offset-4 text-blue-600">2025 Member Innovation Grants – Technology Education Projects</a>'
    );
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

  it("#194 renders Procurement General Updates in the actor's item-level timezone, not the solicitation's", () => {
    const [item] = DashboardDataTransformer.transformProcurementGeneralUpdates([
      {
        _id: "gu-1",
        createdAt: "2026-08-21T22:00:00.000Z",
        timezone: "WAT", // actor's zone (correct source, as My Actions uses)
        statusText: "Michael Duncan completed an evaluation on HVAC",
        solicitation: { _id: "sol-1", name: "HVAC", timezone: "EST" }, // wrong zone
      },
    ]);

    // WAT (UTC+1) = 11:00 PM. If it wrongly used the solicitation's EST it would
    // render 6:00 PM EDT.
    expect(item.date).toBe("Aug 21, 2026 11:00 PM WAT");
  });

  it("#194 renders Company Admin General Updates in the actor's item-level timezone, not the solicitation's", () => {
    const [item] = DashboardDataTransformer.transformCompanyAdminGeneralUpdates([
      {
        _id: "au-1",
        createdAt: "2026-08-21T22:00:00.000Z",
        timezone: "WAT",
        statusText: "Dennis Rose scored a proposal on Power Distribution",
        solicitation: { _id: "sol-2", name: "Power", timezone: "EST" },
      },
    ]);

    expect(item.date).toBe("Aug 21, 2026 11:00 PM WAT");
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
