import { test, expect, Page } from "@playwright/test";

type SeedRole = "vendor";

async function seedAuth(page: Page, role: SeedRole) {
  await page.addInitScript((roleName: SeedRole) => {
    const auth = {
      state: {
        user: {
          _id: "vendor-user",
          email: "vendor@swiftpro.com",
          name: "Vendor User",
          role: { _id: "role-1", name: roleName, __v: 0 },
          companyId: { name: "Test Co", _id: "company-1" },
          status: "active",
        },
        token: "test-token",
        refresh: null,
      },
      version: 0,
    };
    window.localStorage.setItem("auth", JSON.stringify(auth));
  }, role);
}

test.describe("ADE-79 ContractInvoiceDTO Phase 2 enum handling", () => {
  test.setTimeout(60000);

  test("renders Holdback type and Active status correctly", async ({ page }) => {
    await seedAuth(page, "vendor");

    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.route("**/contract/vendor/contracts/c1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: {
            _id: "c1",
            title: "Vendor Contract",
            contractId: "CON-V-1",
            status: "active",
          },
        }),
      });
    });

    await page.route("**/contract/vendor/contracts/c1/invoice**", async (route) => {
      const url = route.request().url();
      if (url.includes("/stats")) {
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

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            invoices: [
              {
                _id: "inv1",
                invoiceId: "INV-ACTIVE",
                type: "holdback",
                amount: 0,
                status: "active",
                fileType: "manual",
              },
            ],
            total: 1,
          },
        }),
      });
    });

    await page.goto("/dashboard/contract-management/c1", {
      waitUntil: "domcontentloaded",
    });

    const invoiceTab = page.getByRole("tab", { name: "Invoice" });
    await expect(invoiceTab).toBeVisible();
    await invoiceTab.click();

    await expect(page.getByRole("cell", { name: "Holdback" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Active" })).toBeVisible();
  });
});

