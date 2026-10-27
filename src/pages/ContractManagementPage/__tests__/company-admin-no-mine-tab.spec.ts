import { test, expect, Page } from "@playwright/test";

async function seedAuth(page: Page) {
  const now = new Date().toISOString();
  const auth = {
    state: {
      user: {
        _id: "test-user",
        email: "test@swiftpro.com",
        name: "Test User",
        role: { _id: "role-1", name: "company_admin", __v: 0 },
        companyId: { name: "Test Co", _id: "company-1" },
        currency: "CAD",
        createdAt: now,
        updatedAt: now,
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
          createdAt: now,
          updatedAt: now,
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

  const authRaw = JSON.stringify(auth);
  await page.addInitScript((raw: string) => {
    window.localStorage.setItem("auth", raw);
  }, authRaw);
}

test.describe("Contract Management Page (company_admin scope, QA #266)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("company_admin sees only All Contracts, no My Contracts tab", async ({
    page,
  }) => {
    await seedAuth(page);

    await page.route("**/contract/manager/contracts/stats**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            all: 1,
            active: 1,
            draft: 0,
            suspended: 0,
            expired: 0,
            cancelled: 0,
            pending: 0,
          },
        }),
      });
    });

    await page.route("**/contract/manager/contracts?*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "ok",
          data: {
            contracts: [
              {
                id: "c-all-1",
                contractId: "CT-ALL-1",
                title: "Company Wide Alpha",
                status: "active",
                owner: false,
              },
            ],
            totalContracts: 1,
          },
        }),
      }),
    );

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });

    await expect(page.getByText("Company Wide Alpha")).toBeVisible({
      timeout: 30000,
    });

    await expect(
      page.getByRole("tab", { name: "My Contracts" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("tab", { name: "All Contracts" }),
    ).toHaveCount(0);
  });
});
