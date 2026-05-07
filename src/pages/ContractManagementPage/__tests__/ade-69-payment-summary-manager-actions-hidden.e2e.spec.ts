import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    const auth = {
      state: {
        user: {
          _id: "cm-user",
          email: "adediran.dbs+cm@gmail.com",
          name: "Contract Manager",
          role: { _id: "role-cm", name: "contract_manager", __v: 0 },
          companyId: { name: "Test Co", _id: "company-1" },
          status: "active",
          module: {
            _id: "module-1",
            companyId: "company-1",
            contractManagement: true,
            solicitationManagement: false,
            evaluationsManagement: false,
            vendorManagement: false,
            reportsAnalytics: true,
            vendorsQA: false,
            generalUpdatesNotifications: false,
            addendumManagement: false,
            myActions: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0,
          },
        },
        token: "test-token",
        refresh: null,
      },
      version: 0,
    };
    window.localStorage.setItem("auth", JSON.stringify(auth));
  });
}

test.describe("ADE-69 Contract Payment Summary", () => {
  test.setTimeout(180000);

  test("hides manager actions when contract is pending approval", async ({ page }) => {
    await seedAuth(page);

    await page.route("**/api/v1/dev/**", async (route) => {
      const req = route.request();
      const url = req.url();

      if (url.endsWith("/contract/manager/contracts/c1") && req.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: {
              _id: "c1",
              title: "Contract 1",
              currency: "USD",
              status: "pending_approval",
              holdBackBank: 0,
              contigency: 0,
              contractAmount: 1000,
              paymentStructure: "Monthly",
              paymentTerms: { name: "Monthly" },
            },
          }),
        });
        return;
      }

      if (
        url.includes("/contract/manager/contracts/c1/payment-holdbacks") &&
        req.method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data: [] }),
        });
        return;
      }

      if (
        url.includes("/contract/manager/contracts/c1/payment-savings") &&
        req.method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data: [] }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.goto(`${BASE_URL}/dashboard/contract-management/c1`);

    const paymentSummaryTab = page.getByRole("tab", { name: /payment summary/i });
    await expect(paymentSummaryTab).toBeVisible({ timeout: 60000 });
    await paymentSummaryTab.click();

    await expect(
      page.getByRole("button", { name: /^update savings$/i }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: /^release holdback$/i }),
    ).toBeHidden();
  });
});

