import { test, expect, Page } from "@playwright/test";

type SeedRole = "contract_manager" | "company_admin";

async function seedAuth(page: Page, role: SeedRole = "contract_manager") {
  await page.addInitScript((roleName) => {
    const auth = {
      state: {
        user: {
          _id: "test-user",
          email: "admin@swiftpro.com",
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
          contactEmail: "admin@swiftpro.com",
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

test.describe("Contract Detail (workflow)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, "contract_manager");

    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/contract/manager/contracts")) {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("[dark mode] contract detail uses theme-aware classes", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.addInitScript(() => {
      document.documentElement.classList.add("dark");
    });

    const contractId = "c-dark-1";

    await page.route("**/contract/manager/contracts**", async (route) => {
      const url = route.request().url();
      if (url.includes(`/contract/manager/contracts/${contractId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Contract fetched successfully",
            data: {
              _id: contractId,
              title: "Dark Mode Contract",
              status: "active",
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: [],
        }),
      });
    });

    await page.goto("/", { waitUntil: "commit" });
    await page.goto(`/dashboard/contract-management/${contractId}`, {
      waitUntil: "commit",
    });

    const heading = page.getByRole("heading", { name: "Dark Mode Contract" });
    await expect(heading).toBeVisible({ timeout: 60000 });
    await expect(heading).toHaveClass(/text-foreground/);

    const statusBadge = page.locator("div", { hasText: /^Active$/ }).first();
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveClass(/dark:bg-green-900/);
  });

  test("renders contract header from Contract Manager list endpoint", async ({
    page,
  }) => {
    const contractId = "c-123";

    await page.route("**/contract/manager/contracts/**", async (route) => {
      const url = route.request().url();
      if (
        !url.includes(`/contract/manager/contracts/${contractId}`) ||
        url.includes(`/contract/manager/contracts/${contractId}/`)
      ) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "Contract fetched successfully",
          data: {
            _id: contractId,
            title: "Unit Test Contract",
            status: "active",
          },
        }),
      });
    });

    await page.goto(`/dashboard/contract-management/${contractId}`);

    await expect(
      page.getByRole("heading", { name: "Unit Test Contract" }),
    ).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();
  });

  test("shows not-found state when contract is missing from list", async ({
    page,
  }) => {
    await page.route(
      "**/contract/manager/contracts/missing-id",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Contract not found",
            data: null,
          }),
        });
      },
    );

    await page.goto("/dashboard/contract-management/missing-id");
    await expect(page.locator("text=Contract not found.")).toBeVisible();
  });

  test("shows error state on network failure", async ({ page }) => {
    await page.route("**/contract/manager/contracts**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ status: 500, message: "Internal server error" }),
      });
    });

    const contractsResponse = page.waitForResponse((res) =>
      res.url().includes("/contract/manager/contracts"),
    );
    await page.goto("/dashboard/contract-management/c-err");
    const res = await contractsResponse;
    expect(res.status()).toBe(500);
    await expect(page).toHaveURL(/\/dashboard\/contract-management\/c-err/);
    await expect(
      page.locator("text=Failed to load contract details."),
    ).toBeVisible({ timeout: 15000 });
  });

  test("renders company admin overview with company admin contract endpoint", async ({
    page,
  }) => {
    await seedAuth(page, "company_admin");
    const contractId = "c-admin";

    let managerDetailRequests = 0;
    await page.route(
      `**/contract/manager/contracts/${contractId}`,
      async (route) => {
        managerDetailRequests += 1;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: {
              _id: contractId,
              title: "Company Admin Contract",
              status: "active",
            },
          }),
        });
      },
    );

    let viewOnlyRequests = 0;
    await page.route(`**/user/contract/${contractId}`, async (route) => {
      viewOnlyRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: {
            _id: contractId,
            title: "Company Admin Contract",
            contractId: "CA-001",
            contractRelationship: "standalone",
            deviationScale: 4,
            businessDivision: "Ontario",
            status: "active",
            startDate: "2025-01-01T00:00:00Z",
            endDate: "2025-12-31T00:00:00Z",
            datePublished: "2024-12-01T00:00:00Z",
            contractType: { name: "Fixed Price", _id: "ct1" },
            contractFormationStage: {
              draft: { startDate: "2024-11-01", endDate: "2024-11-10" },
              review: { startDate: "2024-11-11", endDate: "2024-11-20" },
              approval: { startDate: "2024-11-21", endDate: "2024-11-30" },
              execution: { startDate: "2024-12-01", endDate: "2024-12-05" },
            },
            creator: {
              name: "Manager Bob",
              email: "bob@example.com",
              _id: "m1",
            },
            description: "Company admin overview contract",
          },
        }),
      });
    });

    await page.goto(`/dashboard/contract-management/${contractId}`);

    await expect(
      page.getByRole("heading", { name: "Company Admin Contract" }),
    ).toBeVisible();
    await expect(page.getByText("Export")).toBeVisible();
    await expect(page.getByText("Edit Contract")).toHaveCount(0);
    await expect(page.getByText("Deviation Scale")).toBeVisible();
    await expect(page.getByText("Project Name")).toHaveCount(0);
    expect(viewOnlyRequests).toBe(0);
    expect(managerDetailRequests).toBe(1);
  });

  test("company admin deliverables use manager endpoints (not user endpoints)", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await seedAuth(page, "company_admin");
    const contractId = "c-admin-deliverables";

    await page.route(
      `**/contract/manager/contracts/${contractId}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Contract fetched successfully",
            data: {
              _id: contractId,
              title: "Company Admin Contract",
              status: "active",
            },
          }),
        });
      },
    );

    await page.route(
      `**/contract/manager/contracts/${contractId}/deliverables/stats`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { total: 1, submitted: 0, pending: 1, late: 0 },
          }),
        });
      },
    );

    await page.route(
      `**/contract/manager/contracts/${contractId}/deliverables`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: [
              {
                deliverableId: "DEL-1",
                title: "Admin Deliverable",
                date: "2025-01-10",
                submissionStatus: "pending",
                status: "pending",
                kpi: { kpi: 0, kpiDays: 0, kpiText: "—", kpiStatus: "none" },
              },
            ],
          }),
        });
      },
    );

    await page.route(
      `**/contract/user/contracts/${contractId}/deliverables/stats`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { total: 0, submitted: 0, pending: 0, late: 0 },
          }),
        });
      },
    );

    await page.route(
      `**/contract/user/contracts/${contractId}/deliverables`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok", data: [] }),
        });
      },
    );

    await page.goto("/", { waitUntil: "commit" });
    await page.goto(`/dashboard/contract-management/${contractId}`, {
      waitUntil: "commit",
    });
    await page.getByRole("tab", { name: "Deliverables" }).click();

    await expect(page.getByRole("cell", { name: "DEL-1" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Admin Deliverable" }),
    ).toBeVisible();
  });

  test("renders rate sheet summary in the details sheet", async ({ page }) => {
    const contractId = "c-rates-1";
    const sheetId = "sheet-1";

    await page.route("**/contract/manager/contracts**", async (route) => {
      const url = route.request().url();
      const path = new URL(url).pathname;

      if (
        path.endsWith(
          `/contract/manager/contracts/${contractId}/ratesheets/${sheetId}`,
        )
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Rate sheet fetched successfully",
            data: {
              sheet: {
                sheetId,
                title: "Rates 2026",
                description: "Rate sheet description",
                amount: 1000,
                status: "pending",
                files: [],
                summary: [
                  {
                    name: "Labor",
                    sheets: [
                      {
                        sheetName: "Skilled Trades",
                        headers: ["Role", "Rate"],
                        rows: [
                          { Role: "Electrician", Rate: "$120" },
                          { Role: "Plumber", Rate: "$110" },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          }),
        });
        return;
      }

      if (
        path.endsWith(`/contract/manager/contracts/${contractId}/ratesheets`)
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [
              {
                _id: "rate-1",
                sheetId,
                title: "Rates 2026",
                amount: 1000,
                createdAt: "2026-02-01T00:00:00.000Z",
              },
            ],
          }),
        });
        return;
      }

      if (path.endsWith(`/contract/manager/contracts/${contractId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Contract fetched successfully",
            data: {
              _id: contractId,
              title: "Rates Contract",
              status: "active",
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.goto("/", { waitUntil: "commit" });
    await page.goto(`/dashboard/contract-management/${contractId}`, {
      waitUntil: "commit",
    });

    await page.getByRole("tab", { name: "Rate Sheets" }).click();
    const viewButton = page.getByRole("button", { name: "View" });
    await expect(viewButton).toBeVisible({ timeout: 60000 });
    await viewButton.click();

    await expect(
      page.locator('[data-testid="rate-sheet-details-sheet"]'),
    ).toBeVisible({ timeout: 60000 });

    await page.getByRole("tab", { name: "Rate Sheet Summary" }).click();

    await expect(page.getByText("Labor")).toBeVisible();
    await expect(page.getByText("Skilled Trades")).toBeVisible();
    await expect(page.getByText("Electrician")).toBeVisible();
    await expect(page.getByText("$120")).toBeVisible();
  });

  test("rate sheet summary shows a progressive rows control for large sheets", async ({
    page,
  }) => {
    const contractId = "c-rates-big-summary-1";
    const sheetId = "sheet-big-1";

    const rows = Array.from({ length: 120 }).map((_, idx) => ({
      Role: `Role ${idx + 1}`,
      Rate: `$${100 + idx}`,
    }));

    await page.route("**/contract/manager/contracts**", async (route) => {
      const url = route.request().url();
      const path = new URL(url).pathname;

      if (
        path.endsWith(
          `/contract/manager/contracts/${contractId}/ratesheets/${sheetId}`,
        )
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Rate sheet fetched successfully",
            data: {
              sheet: {
                sheetId,
                title: "Rates 2026",
                description: "Rate sheet description",
                amount: 1000,
                status: "pending",
                files: [],
                summary: [
                  {
                    name: "Labor",
                    sheets: [
                      {
                        sheetName: "Skilled Trades",
                        headers: ["Role", "Rate"],
                        rows,
                      },
                    ],
                  },
                ],
              },
            },
          }),
        });
        return;
      }

      if (
        path.endsWith(`/contract/manager/contracts/${contractId}/ratesheets`)
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [
              {
                _id: "rate-big-1",
                sheetId,
                title: "Rates 2026",
                amount: 1000,
                createdAt: "2026-02-01T00:00:00.000Z",
              },
            ],
          }),
        });
        return;
      }

      if (path.endsWith(`/contract/manager/contracts/${contractId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Contract fetched successfully",
            data: {
              _id: contractId,
              title: "Rates Big Summary",
              status: "active",
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.goto("/", { waitUntil: "commit" });
    await page.goto(`/dashboard/contract-management/${contractId}`, {
      waitUntil: "commit",
    });

    const rateSheetsTab = page.getByRole("tab", { name: "Rate Sheets" });
    await expect(rateSheetsTab).toBeVisible({ timeout: 60000 });
    await rateSheetsTab.click();
    const viewButton = page.getByRole("button", { name: "View" });
    await expect(viewButton).toBeVisible({ timeout: 60000 });
    await viewButton.click();
    await page.getByRole("tab", { name: "Rate Sheet Summary" }).click();

    await expect(
      page.getByRole("button", { name: "Show more rows" }),
    ).toBeVisible();
  });

  test("rate sheet summary progressively renders groups and sheets", async ({
    page,
  }) => {
    const contractId = "c-rates-big-groups-1";
    const sheetId = "sheet-big-groups-1";

    const summary = Array.from({ length: 6 }).map((_, groupIndex) => ({
      name: `Group ${groupIndex + 1}`,
      sheets: Array.from({ length: 5 }).map((__, sheetIndex) => ({
        sheetName: `Sheet ${sheetIndex + 1}`,
        headers: ["Role", "Rate"],
        rows: [{ Role: "Electrician", Rate: "$120" }],
      })),
    }));

    await page.route("**/contract/manager/contracts**", async (route) => {
      const url = route.request().url();
      const path = new URL(url).pathname;

      if (
        path.endsWith(
          `/contract/manager/contracts/${contractId}/ratesheets/${sheetId}`,
        )
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Rate sheet fetched successfully",
            data: {
              sheet: {
                sheetId,
                title: "Rates 2026",
                description: "Rate sheet description",
                amount: 1000,
                status: "pending",
                files: [],
                summary,
              },
            },
          }),
        });
        return;
      }

      if (
        path.endsWith(`/contract/manager/contracts/${contractId}/ratesheets`)
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [
              {
                _id: "rate-big-groups-1",
                sheetId,
                title: "Rates 2026",
                amount: 1000,
                createdAt: "2026-02-01T00:00:00.000Z",
              },
            ],
          }),
        });
        return;
      }

      if (path.endsWith(`/contract/manager/contracts/${contractId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Contract fetched successfully",
            data: {
              _id: contractId,
              title: "Rates Big Groups",
              status: "active",
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.goto("/", { waitUntil: "commit" });
    await page.goto(`/dashboard/contract-management/${contractId}`, {
      waitUntil: "commit",
    });

    const rateSheetsTab = page.getByRole("tab", { name: "Rate Sheets" });
    await expect(rateSheetsTab).toBeVisible({ timeout: 60000 });
    await rateSheetsTab.click();

    const viewButton = page.getByRole("button", { name: "View" });
    await expect(viewButton).toBeVisible({ timeout: 60000 });
    await viewButton.click();

    await page.getByRole("tab", { name: "Rate Sheet Summary" }).click();

    await expect(
      page.getByRole("button", { name: "Show more groups" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Show more sheets" }).first(),
    ).toBeVisible();
  });

  test("contract manager approves rate sheet using sheetId in approve endpoint", async ({
    page,
  }) => {
    const contractId = "c-rates-approve-1";
    const dbId = "rate-db-99";
    const sheetId = "sheet-99";

    let approveUrl: string | null = null;
    await page.route("**/contract/manager/contracts**", async (route) => {
      const url = route.request().url();
      const path = new URL(url).pathname;

      if (
        path.includes(
          `/contract/manager/contracts/${contractId}/ratesheets/`,
        ) &&
        path.endsWith("/approve")
      ) {
        approveUrl = url;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, message: "ok", data: {} }),
        });
        return;
      }

      if (
        path.endsWith(
          `/contract/manager/contracts/${contractId}/ratesheets/${sheetId}`,
        )
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Rate sheet fetched successfully",
            data: {
              sheet: {
                _id: dbId,
                sheetId,
                title: "Rates 2026",
                description: "Rate sheet description",
                amount: 1000,
                status: "pending",
                approverStatus: "pending",
                files: [],
                summary: [],
              },
            },
          }),
        });
        return;
      }

      if (
        path.endsWith(`/contract/manager/contracts/${contractId}/ratesheets`)
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [
              {
                _id: dbId,
                sheetId,
                title: "Rates 2026",
                amount: 1000,
                createdAt: "2026-02-01T00:00:00.000Z",
              },
            ],
          }),
        });
        return;
      }

      if (path.endsWith(`/contract/manager/contracts/${contractId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Contract fetched successfully",
            data: {
              _id: contractId,
              title: "Rates Approval Contract",
              status: "active",
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.goto("/", { waitUntil: "commit" });
    await page.goto(`/dashboard/contract-management/${contractId}`, {
      waitUntil: "commit",
    });

    await expect(
      page.getByRole("heading", { name: "Rates Approval Contract" }),
    ).toBeVisible({ timeout: 60000 });

    await page.getByRole("tab", { name: "Rate Sheets" }).click();

    const viewButton = page.getByRole("button", { name: "View" });
    await expect(viewButton).toBeVisible({ timeout: 60000 });
    await viewButton.click();

    const approveButton = page.getByRole("button", { name: "Approve" });
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    await expect.poll(() => approveUrl).toContain(`/${sheetId}/approve`);
  });

  test("contract manager can approve/reject pending invoice from invoice details", async ({
    page,
  }) => {
    test.setTimeout(60000);
    const contractId = "c-123";
    const invoiceId = "inv-1";

    await page.route("**/contract/manager/contracts/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "Contract fetched successfully",
          data: {
            _id: contractId,
            title: "Unit Test Contract",
            status: "active",
          },
        }),
      });
    });

    await page.route(
      `**/contract/manager/contracts/${contractId}/invoice/stats`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { all: 1, pending: 1, accepted: 0, rejected: 0 },
          }),
        });
      },
    );

    await page.route(
      `**/contract/manager/contracts/${contractId}/invoice**`,
      async (route) => {
        const url = route.request().url();
        if (url.includes("/stats")) {
          await route.fallback();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              invoices: [
                {
                  _id: invoiceId,
                  invoiceId,
                  type: "monthly",
                  status: "pending",
                  amountBilled: 100,
                  amountRemaining: 900,
                },
              ],
              total: 1,
            },
          }),
        });
      },
    );

    await page.route(
      `**/contract/manager/contracts/invoice/${invoiceId}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              _id: invoiceId,
              invoiceId,
              type: "monthly",
              status: "pending",
              description: "Pending invoice",
              files: [],
              billed: 100,
              remaining: 900,
            },
          }),
        });
      },
    );

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await expect(
      page.getByRole("heading", { name: "Unit Test Contract" }),
    ).toBeVisible();
    await page
      .getByRole("tab", { name: "Invoice" })
      .evaluate((el) => (el as HTMLElement).click());

    await expect(page.getByTestId("invoice-table")).toBeVisible();
    await expect(page.getByPlaceholder("Search invoices")).toBeVisible();
    await page.getByTestId("view-invoice-detail").click();

    await expect(page.getByTestId("invoice-details-sheet")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
  });
});
