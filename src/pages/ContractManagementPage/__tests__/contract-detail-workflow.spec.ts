import { test, expect, Page } from "@playwright/test";

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    const auth = {
      state: {
        user: {
          _id: "test-user",
          email: "admin@swiftpro.com",
          name: "Test User",
          role: { _id: "role-1", name: "contract_manager", __v: 0 },
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
  });
}

test.describe("Contract Detail (workflow)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);

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

  test("renders contract header from Contract Manager list endpoint", async ({ page }) => {
    const contractId = "c-123";

    await page.route("**/contract/manager/contracts/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "Contract fetched successfully",
          data: { _id: contractId, title: "Unit Test Contract", status: "active" },
        }),
      });
    });

    await page.goto(`/dashboard/contract-management/${contractId}`);

    await expect(page.getByRole("heading", { name: "Unit Test Contract" })).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();
  });

  test("shows not-found state when contract is missing from list", async ({ page }) => {
    await page.route("**/contract/manager/contracts/missing-id", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "Contract not found",
          data: null,
        }),
      });
    });

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
      res.url().includes("/contract/manager/contracts")
    );
    await page.goto("/dashboard/contract-management/c-err");
    const res = await contractsResponse;
    expect(res.status()).toBe(500);
    await expect(page).toHaveURL(/\/dashboard\/contract-management\/c-err/);
    await expect(page.locator("text=Failed to load contract details.")).toBeVisible({ timeout: 15000 });
  });
});

