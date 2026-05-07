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

test.describe("Release Holdback includes invoiceId", () => {
  test("POST /payment-holdbacks includes invoiceId from selection", async ({ page }) => {
    test.setTimeout(180000);
    await seedAuth(page);

    let createdPayload: any = null;

    await page.route("**/api/v1/dev/**", async (route) => {
      const req = route.request();
      const url = req.url();

      if (
        req.method() === "GET" &&
        /\/contract\/manager\/contracts(\?|$)/.test(url) &&
        !url.includes("/contract/manager/contracts/") &&
        !url.includes("/contract/manager/contracts/stats")
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [{ _id: "c1", title: "Contract 1", status: "publish" }],
          }),
        });
        return;
      }

      if (url.includes("/contract/manager/contracts/c1/invoice") && req.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: {
              invoices: [
                { _id: "inv1", invoiceId: "INV-001", title: "Invoice 1" },
              ],
              total: 1,
            },
          }),
        });
        return;
      }

      if (url.includes("/contract/manager/contracts/c1/payment-holdbacks") && req.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data: [] }),
        });
        return;
      }

      if (url.includes("/contract/manager/contracts/c1/payment-savings") && req.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data: [] }),
        });
        return;
      }

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
              status: "publish",
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

      if (url.includes("/contract/manager/contracts/c1/payment-holdbacks") && req.method() === "POST") {
        createdPayload = req.postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: { _id: "hb1", holdBackId: "HB-001" },
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

    await page.goto(BASE_URL);

    const contractManagementLink = page.getByRole("link", {
      name: /contract management/i,
    });
    await expect(contractManagementLink).toBeVisible({ timeout: 60000 });
    await contractManagementLink.click();

    await expect(page).toHaveURL(/\/dashboard\/contract-management$/, {
      timeout: 60000,
    });

    await page.goto(`${BASE_URL}/dashboard/contract-management/c1`);

    const paymentSummaryTab = page.getByRole("tab", { name: /payment summary/i });
    await expect(paymentSummaryTab).toBeVisible({ timeout: 60000 });
    await paymentSummaryTab.click();

    const releaseHoldbackBtn = page.getByRole("button", { name: /release holdback/i });
    await expect(releaseHoldbackBtn).toBeVisible({ timeout: 60000 });
    await releaseHoldbackBtn.click();

    await expect(page.getByRole("heading", { name: "Release Holdback" })).toBeVisible({
      timeout: 60000,
    });

    await page.getByText("Select Release Type", { exact: true }).click();
    await page.getByRole("option", { name: "Partial Release" }).click();

    const invoiceSelect = page.getByText("Select Invoice", { exact: true });
    await expect(invoiceSelect).toBeVisible({ timeout: 5000 });
    await invoiceSelect.click();
    await page.getByRole("option", { name: /INV-001/i }).click();

    await page.getByPlaceholder("Enter Amount").fill("100");

    const submitWait = page.waitForResponse((res) => {
      return (
        res.request().method() === "POST" &&
        res.url().includes("/contract/manager/contracts/c1/payment-holdbacks")
      );
    });

    await page.getByRole("button", { name: /^release$/i }).click();
    await submitWait;

    expect(createdPayload?.invoiceId).toBe("inv1");

    await page.screenshot({
      path: ".qa/snapshots/ade63-release-holdback.png",
      fullPage: false,
    });
  });
});
