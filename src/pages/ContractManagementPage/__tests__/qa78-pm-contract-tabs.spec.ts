import { test, expect, Page } from "@playwright/test";

type SeedRole =
  | "vendor"
  | "procurement"
  | "contract_manager"
  | "approver"
  | "view_only"
  | "project_manager";

async function seedAuth(page: Page, role: SeedRole) {
  const now = new Date().toISOString();
  const auth = {
    state: {
      user: {
        _id: "test-user",
        email: "test@swiftpro.com",
        name: "Test User",
        role: { _id: "role-1", name: role, __v: 0 },
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

test.describe("Contract Management Page (vendor PM tabs)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("vendor PM sees All and My contract tabs from the two endpoints", async ({
    page,
  }) => {
    await seedAuth(page, "project_manager");

    await page.route("**/contract/vendor/contracts/stats**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
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

    await page.route("**/contract/vendor/contracts?*", (route) =>
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
    await page.route("**/contract/vendor/contracts/me?*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "ok",
          data: {
            contracts: [
              {
                id: "c-me-1",
                contractId: "CT-ME-1",
                title: "Assigned To Me Beta",
                status: "active",
                owner: true,
              },
            ],
            totalContracts: 1,
          },
        }),
      }),
    );

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });

    await expect(page.getByRole("tab", { name: "All Contracts" })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole("tab", { name: "My Contracts" })).toBeVisible({
      timeout: 30000,
    });

    // All tab active by default -> company-wide contract shown
    await expect(page.getByText("Company Wide Alpha")).toBeVisible({
      timeout: 30000,
    });

    // Switch to My Contracts -> assigned contract shown
    await page.getByRole("tab", { name: "My Contracts" }).click();
    await expect(page.getByText("Assigned To Me Beta")).toBeVisible({
      timeout: 30000,
    });
  });
});
