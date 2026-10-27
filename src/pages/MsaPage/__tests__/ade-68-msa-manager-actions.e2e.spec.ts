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

test.describe("ADE-68 MSA Payment Summary manager actions", () => {
  test.setTimeout(180000);

  test("manager can create MSA saving and holdback (invoiceId required)", async ({
    page,
  }) => {
    await seedAuth(page);

    let createdSavingPayload: any = null;
    let createdHoldbackPayload: any = null;

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
              status: "publish",
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

      if (
        url.includes("/contract/manager/msa-contracts/m1/invoice") &&
        req.method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: {
              invoices: [{ _id: "inv1", invoiceId: "INV-001", title: "Invoice 1" }],
              total: 1,
            },
          }),
        });
        return;
      }

      if (url.includes("/upload") && req.method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [{ url: "https://files.test/1", size: "1KB" }],
          }),
        });
        return;
      }

      if (
        url.includes("/contract/manager/msa-contracts/m1/payment-savings") &&
        req.method() === "POST"
      ) {
        createdSavingPayload = req.postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data: {} }),
        });
        return;
      }

      if (
        url.includes("/contract/manager/msa-contracts/m1/payment-holdbacks") &&
        req.method() === "POST"
      ) {
        createdHoldbackPayload = req.postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data: {} }),
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

    const updateSavingBtn = page.getByRole("button", { name: /update saving/i });
    await expect(updateSavingBtn).toBeVisible({ timeout: 60000 });
    await updateSavingBtn.click();

    await expect(page.getByText(/update savings/i)).toBeVisible({ timeout: 60000 });

    await page.getByPlaceholder("Enter Title").fill("Saving 1");
    await page.getByPlaceholder("Enter Amount").fill("100");
    await page.getByText("Select Category", { exact: true }).click();
    await page.getByRole("option", { name: "Direct Negotiations" }).click();

    const waitSavingPost = page.waitForResponse((res) => {
      return (
        res.request().method() === "POST" &&
        res.url().includes("/contract/manager/msa-contracts/m1/payment-savings")
      );
    });
    await page.getByRole("button", { name: /^update$/i }).click();
    await waitSavingPost;

    expect(createdSavingPayload?.title).toBe("Saving 1");
    expect(createdSavingPayload?.amount).toBe(100);

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

    await page.getByPlaceholder("Enter Amount").fill("10");

    const waitHoldbackPost = page.waitForResponse((res) => {
      return (
        res.request().method() === "POST" &&
        res.url().includes("/contract/manager/msa-contracts/m1/payment-holdbacks")
      );
    });

    await page.getByRole("button", { name: /^release$/i }).click();
    await waitHoldbackPost;

    expect(createdHoldbackPayload?.invoiceId).toBe("inv1");
    expect(createdHoldbackPayload?.type).toBe("partial");
    expect(createdHoldbackPayload?.amount).toBe(10);
  });
});

