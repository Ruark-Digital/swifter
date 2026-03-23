import { test, expect, Page } from "@playwright/test";

type SeedRole = "vendor" | "procurement" | "contract_manager" | "approver" | "view_only";

async function seedAuth(page: Page, role: SeedRole) {
  await page.addInitScript((roleName) => {
    const auth = {
      state: {
        user: {
          _id: "test-user",
          email: "test@swiftpro.com",
          name: "Test User",
          role: { _id: "role-1", name: roleName, __v: 0 },
          companyId: { name: "Test Co", _id: "company-1" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active",
          module: {
            contractManagement: true,
            _id: "m-1",
            companyId: "company-1",
            solicitationManagement: true,
            evaluationsManagement: true,
            vendorManagement: true,
            reportsAnalytics: true,
            vendorsQA: true,
            generalUpdatesNotifications: true,
            addendumManagement: true,
            myActions: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0,
          },
          isAi: false,
          isDeleted: false,
          contactEmail: "test@swiftpro.com",
        },
        token: "test-token",
        refresh: null,
        authorities: [],
      },
      version: 0,
    };

    window.localStorage.setItem("auth", JSON.stringify(auth));
  }, role);
}

async function mockContractManagerDashboardEndpoints(page: Page) {
  await page.route(
    "**/contract/manager/contracts/dashboard/cards/total**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            allContracts: { value: 42, change: 5.2, trend: "up" },
            activeContracts: { value: 28, change: 2.1, trend: "up" },
            draftContracts: { value: 6, change: -1, trend: "down" },
            suspendedContracts: { value: 2, change: 0, trend: "none" },
            expiredContracts: { value: 3, change: 0.5, trend: "up" },
            terminatedContracts: { value: 3, change: 0, trend: "none" },
            totalContractValue: { value: 12500000, currency: "CAD" },
            committedVsActual: {
              committed: 12500000,
              actual: 5400000,
              percentage: 43.2,
              trend: { value: 5400000, change: 4.8, trend: "up" },
            },
            savingsRealized: {
              value: 320000,
              percentage: 2.6,
              trend: { value: 320000, change: 1.2, trend: "up" },
            },
            upcomingRenewals: { count: 4, days: 90 },
            highRiskContracts: { count: 5 },
            holdbacks: { value: 120000, trend: { value: 120000, change: 0.8, trend: "up" } },
          },
        }),
      });
    }
  );

  await page.route(
    "**/contract/manager/contracts/dashboard/cards/ytd**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            allContracts: { value: 18, change: 3.5, trend: "up" },
            activeContracts: { value: 12, change: 1.4, trend: "up" },
            draftContracts: { value: 2, change: 0, trend: "none" },
            suspendedContracts: { value: 1, change: 0, trend: "none" },
            expiredContracts: { value: 2, change: 0.5, trend: "up" },
            terminatedContracts: { value: 1, change: 0, trend: "none" },
            totalContractValue: { value: 6500000, currency: "CAD" },
            committedVsActual: {
              committed: 6500000,
              actual: 2800000,
              percentage: 43.1,
              trend: { value: 2800000, change: 2.6, trend: "up" },
            },
            savingsRealized: {
              value: 180000,
              percentage: 2.8,
              trend: { value: 180000, change: 1.1, trend: "up" },
            },
            upcomingRenewals: { count: 2, days: 90 },
            highRiskContracts: { count: 3 },
            holdbacks: { value: 60000, trend: { value: 60000, change: 0.4, trend: "up" } },
          },
        }),
      });
    }
  );

  await page.route(
    "**/contract/manager/contracts/dashboard/action-logs**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: [
            {
              id: "log-1",
              title: "Invoice INV-2024-089 awaiting approval",
              description: "Submitted by BuildCorp Ltd",
              status: "pending",
              requestedBy: "BuildCorp Ltd",
              contractTitle: "Office Lease Agreement",
              createdAt: "2025-03-01T10:30:00.000Z",
              type: "ContractInvoice",
            },
          ],
        }),
      });
    }
  );

  await page.route(
    "**/contract/manager/contracts/dashboard/general-updates**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: [
            {
              id: "upd-1",
              title: "Change Submitted",
              description: "Submitted by BuildCorp Ltd",
              status: "pending",
              requestedBy: "BuildCorp Ltd",
              contractTitle: "Office Lease Agreement",
              createdAt: "2025-03-05T09:15:00.000Z",
              type: "ContractChange",
            },
          ],
        }),
      });
    }
  );

  await page.route("**/contract/manager/contracts/dashboard/cycle-time**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: {
          stages: [
            { name: "Drafting", days: 12, percentage: 24 },
            { name: "Review", days: 18, percentage: 36 },
            { name: "Approval", days: 10, percentage: 20 },
            { name: "Execution", days: 10, percentage: 20 },
          ],
          bottleneck: { stage: "Review", days: 18, reason: "Pending approvals" },
        },
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/invoice-status**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: { approved: 6, pending: 4, rejected: 1 },
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/committed-vs-actual**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: { committed: 12500000, actual: 5400000, percentage: 43.2 },
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/vendor-contract-value**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: [
          { name: "BuildCorp Ltd", value: 3500000, contractCount: 8 },
          { name: "TechServices Inc", value: 2800000, contractCount: 6 },
        ],
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/project-contract-value**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: [
          { name: "City Hall Renovation", value: 2200000, contractCount: 3 },
          { name: "Warehouse Expansion", value: 1800000, contractCount: 2 },
        ],
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/risk-distribution**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: { low: 12, medium: 8, high: 5 },
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/change-order-impact**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: {
          totalCOs: 6,
          valueIncrease: 350000,
          percentageIncrease: 8.5,
          chartData: [
            { date: "2025-01", original: 200000, revised: 240000 },
            { date: "2025-02", original: 200000, revised: 260000 },
          ],
        },
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/category-value**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: [
          { name: "Construction", value: 4200000, contractCount: 9 },
          { name: "IT Services", value: 3100000, contractCount: 6 },
        ],
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/compliance-status**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: {
          insuranceActive: { current: 12, total: 20, percentage: 60 },
          securitySubmission: { current: 8, total: 20, percentage: 40 },
          missedApprovals: 8,
          ncrs: 3,
          auditTrailCompleteness: 89,
        },
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/clause-intelligence**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: {
          mostNegotiatedClauses: [
            { category: "Liquidated Damages", count: 78 },
            { category: "Indemnities", count: 65 },
          ],
          highRiskClauseTypes: [
            { category: "Liquidated Damages", contracts: 78, severity: "high" },
          ],
        },
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/contract-status**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: {
          active: 18,
          pendingApproval: 4,
          completed: 6,
          terminated: 1,
          suspended: 2,
          draft: 3,
        },
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/vendor-summary**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: {
          layout: {
            title: "Vendor Performance Summary",
            columns: ["vendor", "contracts", "riskScore", "claims", "changeOrders", "performance"],
          },
          rows: [
            {
              vendor: "BuildCorp Ltd",
              contracts: 8,
              riskScore: 65,
              claims: 2,
              changeOrders: 12,
              performance: "critical",
            },
          ],
        },
      }),
    });
  });

  await page.route("**/contract/manager/contracts/dashboard/renewals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: {
          timeline: [
            {
              contractRef: "c-1",
              contractTitle: "AWS Cloud Services",
              contractCode: "CON-2024-001",
              vendor: "BlueCorp Industries",
              value: 2500000,
              daysToExpiry: 30,
              timelineStatus: "critical",
              label: "Expires in 30 days",
              stage: "executed",
            },
          ],
        },
      }),
    });
  });
}

test.describe("Dashboard (Contract Manager)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("renders contract manager dashboard using main dashboard endpoints", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");
    await mockContractManagerDashboardEndpoints(page);

    await page.goto("/dashboard");

    const totalAllContractsTitle = page.getByText("All Contracts").first();
    await expect(totalAllContractsTitle).toBeVisible();
    await expect(totalAllContractsTitle.locator("..").locator("p").nth(1)).toHaveText("42");

    await expect(page.getByText("Invoice INV-2024-089 awaiting approval")).toBeVisible();

    await page.getByRole("tab", { name: "YTD Contracts" }).click();
    const ytdAllContractsTitle = page.getByText("All Contracts").first();
    await expect(ytdAllContractsTitle.locator("..").locator("p").nth(1)).toHaveText("18");

    await page.getByRole("tab", { name: "Analytics" }).click();

    await expect(page.getByText("Average Cycle Time per Stage")).toBeVisible();
    await expect(page.getByText("Invoice Status")).toBeVisible();
    await expect(page.getByText("Committed vs Actual Spend")).toBeVisible();
    await expect(page.getByText("Contract Value by vendors")).toBeVisible();
    await expect(page.getByText("Contract Value by Project")).toBeVisible();
    await expect(page.getByText("Risk Distribution")).toBeVisible();
    await expect(page.getByText("Change Orders Impact")).toBeVisible();
    await expect(page.getByText("Contract Value by Category")).toBeVisible();
    await expect(page.getByText("Compliance Status")).toBeVisible();
    await expect(page.getByText("Clause Intelligence (Portfolio Level)")).toBeVisible();
    await expect(page.getByText("Contract Status")).toBeVisible();
    await expect(page.getByText("Vendor Performance Summary")).toBeVisible();
    await expect(page.getByText("Renewals & Expiry Timeline")).toBeVisible();
  });

  test("does not call contract manager main dashboard endpoints for vendor", async ({
    page,
  }) => {
    await seedAuth(page, "vendor");

    let managerRequests = 0;
    await page.route("**/contract/manager/contracts/dashboard/**", async (route) => {
      managerRequests += 1;
      await route.abort();
    });

    await page.goto("/dashboard");

    expect(managerRequests).toBe(0);
  });
});
