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

async function mockContractManagerEndpoints(page: Page) {
  await page.route("**/contract/manager/contracts/stats**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 200,
        message: "ok",
        data: {
          all: 0,
          draft: 0,
          pending_approval: 0,
          active: 0,
          completed: 0,
          suspended: 0,
          expired: 0,
          terminated: 0,
        },
      }),
    });
  });

  await page.route("**/contract/manager/contracts/me**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 200,
        message: "ok",
        data: { contracts: [], totalContracts: 0 },
      }),
    });
  });

  await page.route("**/contract/manager/contracts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 200,
        message: "ok",
        data: { contracts: [], totalContracts: 0 },
      }),
    });
  });
}

async function mockApproverEndpoints(page: Page) {
  await page.route("**/approver/contract/stats**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 200,
        message: "ok",
        data: {
          all: 0,
          draft: 0,
          pending_approval: 0,
          active: 0,
          completed: 0,
          suspended: 0,
          expired: 0,
          terminated: 0,
        },
      }),
    });
  });

  await page.route("**/approver/contract**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 200,
        message: "ok",
        data: {
          docs: [],
          totalDocs: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      }),
    });
  });
}

async function mockVendorEndpoints(page: Page) {
  await page.route("**/vendor/contract/stats**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: {
          all: 0,
          active: 0,
          completed: 0,
          cancelled: 0,
          suspended: 0,
          expired: 0,
        },
      }),
    });
  });

  await page.route("**/vendor/contract**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: { contracts: [], totalContracts: 0 },
      }),
    });
  });
}

test.describe("Contract Management Page (roles)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("renders procurement/manager view with actions and tabs", async ({ page }) => {
    await seedAuth(page, "contract_manager");
    await mockContractManagerEndpoints(page);

    await page.goto("/dashboard/contract-management");

    await expect(page.getByText("Export")).toBeVisible();
    await expect(page.locator('[data-testid="create-contracts-button"]')).toBeVisible();
    await expect(page.getByRole("tab", { name: "All Contracts" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "My Contracts" })).toBeVisible();
    await expect(page.locator('[data-testid="contracts-stats-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="contracts-table"]')).toBeVisible();
  });

  test("renders vendor view and does not call manager endpoints", async ({ page }) => {
    await seedAuth(page, "vendor");
    await mockVendorEndpoints(page);

    let managerRequests = 0;
    await page.route("**/contract/manager/contracts**", async (route) => {
      managerRequests += 1;
      await route.abort();
    });

    await page.goto("/dashboard/contract-management");

    await expect(page.locator('[data-testid="vendor-contracts-stats-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-contracts-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-contracts-button"]')).toHaveCount(0);
    await expect(page.getByText("Export")).toHaveCount(0);
    expect(managerRequests).toBe(0);
  });

  test("renders approver view and uses approver endpoints", async ({ page }) => {
    await seedAuth(page, "approver");
    await mockApproverEndpoints(page);

    let managerRequests = 0;
    await page.route("**/contract/manager/contracts**", async (route) => {
      managerRequests += 1;
      await route.abort();
    });

    await page.goto("/dashboard/contract-management");

    await expect(page.locator('[data-testid="contracts-stats-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="contracts-table"]')).toBeVisible();
    expect(managerRequests).toBe(0);
  });

  test("renders view-only mode and hides create/export actions", async ({ page }) => {
    await seedAuth(page, "view_only");
    await mockContractManagerEndpoints(page);

    await page.goto("/dashboard/contract-management");

    await expect(page.getByRole("heading", { name: "Contracts" })).toBeVisible();
    await expect(page.getByText("Read-only")).toBeVisible();
    await expect(page.locator('[data-testid="create-contracts-button"]')).toHaveCount(0);
    await expect(page.getByText("Export")).toHaveCount(0);
    await expect(page.locator('[data-testid="search-input"]')).toBeDisabled();
    await expect(page.locator('[data-testid="create-contract-cta"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="contracts-table"]')).toBeVisible();
  });
});
