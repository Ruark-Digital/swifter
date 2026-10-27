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
  });
}

test.describe("ADE-69 MSA Payment Summary", () => {
  test.setTimeout(180000);

  test("hides manager actions when MSA is pending approval", async ({ page }) => {
    await seedAuth(page);

    await page.route("**/api/v1/dev/**", async (route) => {
      const req = route.request();
      const url = req.url();

      if (url.endsWith("/contract/manager/msa-contracts/m1") && req.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: {
              _id: "m1",
              title: "MSA 1",
              msaContractId: "MSA-001",
              status: "pending_approval",
              currency: "USD",
              contractValue: 0,
              holdBackReleased: 0,
              savingAmount: 0,
              holdBackBank: 0,
              holdBack: 0,
              contigency: 0,
              paymentStructure: "Monthly",
              paymentTerms: { name: "Monthly" },
              milestone: [],
              internalTeam: [],
              vendorPersonnel: [],
            },
          }),
        });
        return;
      }

      if (
        url.includes("/contract/manager/msa-contracts/m1/payment-holdbacks") &&
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
        url.includes("/contract/manager/msa-contracts/m1/payment-savings") &&
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

    await page.goto(`${BASE_URL}/dashboard/msa/m1`);

    const paymentSummaryTab = page.getByRole("tab", { name: /payment summary/i });
    await expect(paymentSummaryTab).toBeVisible({ timeout: 60000 });
    await paymentSummaryTab.click();

    await expect(
      page.getByRole("button", { name: /^update saving$/i }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: /^release holdback$/i }),
    ).toBeHidden();
  });
});

