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

test.describe("MSA Page (stats)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/msa-contract/stats")) {
        if (url.includes("/contract/manager/")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              message: "MSA contract stats fetched successfully",
              data: {
                all: 10,
                active: 3,
                draft: 2,
                suspended: 1,
                expired: 1,
                terminated: 1,
                pending: 2,
                linked: 4,
              },
            }),
          });
          return;
        }

        if (url.includes("/contract/vendor/")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              message: "Vendor MSA stats fetched successfully",
              data: { all: 7, active: 5, draft: 1, expired: 1 },
            }),
          });
          return;
        }
      }

      if (url.includes("/msa-contract/me")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok", data: { contracts: [] } }),
        });
        return;
      }

      if (url.includes("/msa-contract")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok", data: { contracts: [] } }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("renders manager MSA stats from API", async ({ page }) => {
    await seedAuth(page, "contract_manager");

    const statsResponse = page.waitForResponse(
      (res) => res.url().includes("msa-contract/stats") && res.status() === 200,
      { timeout: 15000 },
    );

    await page.goto("/dashboard/msa");
    const statsRes = await statsResponse;
    const statsJson = await statsRes.json();
    expect(statsJson?.data?.all).toBe(10);

    await expect(page.locator('[data-testid="msa-stats-all"]')).toContainText("10");
    await expect(page.locator('[data-testid="msa-stats-active"]')).toContainText("3");
    await expect(page.locator('[data-testid="msa-stats-draft"]')).toContainText("2");
    await expect(page.locator('[data-testid="msa-stats-suspended"]')).toContainText("1");
    await expect(page.locator('[data-testid="msa-stats-expired"]')).toContainText("1");
    await expect(page.locator('[data-testid="msa-stats-terminated"]')).toContainText("1");
    await expect(page.locator('[data-testid="msa-stats-pending"]')).toContainText("2");
    await expect(page.locator('[data-testid="msa-stats-linked"]')).toContainText("4");
  });

  test("vendor does not call manager MSA stats endpoint", async ({ page }) => {
    await seedAuth(page, "vendor");

    const statsResponse = page.waitForResponse(
      (res) => res.url().includes("msa-contract/stats") && res.status() === 200,
      { timeout: 15000 },
    );

    const requests: string[] = [];
    page.on("request", (req) => {
      requests.push(req.url());
    });

    await page.goto("/dashboard/msa");
    await statsResponse;

    expect(requests.some((u) => u.includes("/contract/manager/msa-contract/stats"))).toBe(
      false,
    );
    await expect(page.locator('[data-testid="msa-stats-all"]')).toContainText("7");
    await expect(page.locator('[data-testid="msa-stats-active"]')).toContainText("5");
  });

  test("approver cannot see create MSA button", async ({ page }) => {
    await seedAuth(page, "approver");

    await page.goto("/dashboard/msa");

    await expect(page.locator('[data-testid="create-msa-button"]')).toHaveCount(0);
  });
});
