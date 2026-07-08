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
        ...(role === "project_manager" ? { projectmanagerId: "pm-1" } : {}),
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

test.describe("QA #78 Increment 2 - PM request take-over", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("PM can request take-over on a non-owned All-tab contract", async ({
    page,
  }) => {
    await seedAuth(page, "project_manager");

    await page.route("**/contract/vendor/contracts/stats**", (route) =>
      route.fulfill({
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
      }),
    );

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
                id: "c1",
                contractId: "CT-1",
                title: "Other PM Contract",
                status: "publish",
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
          data: { contracts: [], totalContracts: 0 },
        }),
      }),
    );

    let assignHit = false;
    await page.route("**/project-managers/**/assign", (route) => {
      assignHit = true;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok" }),
      });
    });

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });

    await expect(page.getByText("Other PM Contract")).toBeVisible({
      timeout: 30000,
    });

    await page.getByTestId("vendor-contract-actions-dropdown").first().click();
    await page.getByRole("menuitem", { name: /request take-?over/i }).click();
    await page
      .getByRole("button", { name: /^Submit$|^Confirm$|^Request$/ })
      .click();

    await expect.poll(() => assignHit).toBe(true);
  });

  test("take-over is hidden on a non-owned but non-active (expired) contract", async ({
    page,
  }) => {
    await seedAuth(page, "project_manager");

    await page.route("**/contract/vendor/contracts/stats**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            all: 1,
            active: 0,
            completed: 0,
            cancelled: 0,
            suspended: 0,
            expired: 1,
          },
        }),
      }),
    );

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
                id: "c-exp",
                contractId: "CT-EXP",
                title: "Expired Other PM Contract",
                status: "expired",
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
          data: { contracts: [], totalContracts: 0 },
        }),
      }),
    );

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });

    await expect(page.getByText("Expired Other PM Contract")).toBeVisible({
      timeout: 30000,
    });

    await page.getByTestId("vendor-contract-actions-dropdown").first().click();
    // View Details is always present; take-over must NOT be offered on an
    // expired contract (backend 403s the assign — see live spike 2026-07-08).
    await expect(
      page.getByRole("menuitem", { name: /view details/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /request take-?over/i }),
    ).toHaveCount(0);
  });
});
