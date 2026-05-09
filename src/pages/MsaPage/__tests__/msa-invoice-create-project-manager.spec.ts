import { expect, Page, test } from "@playwright/test";

type SeedRole = "project_manager";

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
          projectmanagerId: "pm-1",
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

async function setupRoutes(page: Page, msaId: string) {
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const pathname = new URL(url).pathname;

    if (
      pathname.endsWith(`/contract/vendor/msa-contract/${msaId}`) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            _id: msaId,
            title: "MSA One",
            msaContractId: "MSA-001",
            status: "active",
            currency: "USD",
            contractValue: 1000,
          },
        }),
      });
      return;
    }

    if (
      pathname.endsWith(`/contract/vendor/msa-contract/${msaId}/invoice/stats`) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: { approved: 0, pending: 0, rejected: 0, draft: 0 },
        }),
      });
      return;
    }

    if (
      pathname.endsWith(`/contract/vendor/msa-contract/${msaId}/invoice`) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: { invoices: [], total: 0 },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "ok", data: [] }),
    });
  });
}

test.describe("MSA Invoice Create (project manager)", () => {
  test.setTimeout(120_000);
  test.skip(({ browserName }) => browserName !== "chromium");

  test("project manager sees Create Invoice button on MSA Invoice tab", async ({
    page,
  }) => {
    const msaId = "msa-1";
    await seedAuth(page, "project_manager");
    await setupRoutes(page, msaId);

    await page.goto(`/dashboard/msa/${msaId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "MSA One" })).toBeVisible({
      timeout: 30000,
    });

    await page.getByRole("tab", { name: "Invoice", exact: true }).click();
    await expect(page.getByRole("button", { name: "Create Invoice" })).toBeVisible();
  });
});

