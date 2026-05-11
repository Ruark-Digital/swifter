import { test, expect, Page } from "@playwright/test";

type SeedRole = "approver";

async function seedAuth(page: Page, role: SeedRole) {
  await page.addInitScript((roleName: SeedRole) => {
    const auth = {
      state: {
        user: {
          _id: "approver-user",
          email: "approver@swiftpro.com",
          name: "Approver User",
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

const contractId = "c1";
const invoiceId = "INV-001";

function setupCommonRoutes(page: Page) {
  return Promise.all([
    page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    }),
    page.route(`**/contract/approver/contracts/${contractId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: { _id: contractId, title: "Approver Contract", contractId: "CON-A-1", status: "active" },
        }),
      });
    }),
    page.route(`**/contract/approver/contracts/${contractId}/invoice**`, async (route) => {
      const url = route.request().url();
      if (url.includes("/stats")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { approved: 0, pending: 1, rejected: 0, draft: 0 },
          }),
        });
        return;
      }
      if (url.includes(`/invoice/${invoiceId}`) && !url.includes("/approve/status")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              _id: "inv1",
              invoiceId: "INV-001",
              title: "Invoice 1",
              type: "monthly payment",
              taxCode: "HST",
              description: "Invoice description",
              amount: 0,
              status: "pending",
              files: [],
            },
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
              { _id: "inv1", invoiceId: "INV-001", type: "monthly payment", amount: 0, status: "pending" },
            ],
            total: 1,
          },
        }),
      });
    }),
  ]);
}

async function openInvoiceDetails(page: Page) {
  await page.goto(`/dashboard/contract-management/${contractId}`, {
    waitUntil: "domcontentloaded",
  });

  const invoiceTab = page.getByRole("tab", { name: "Invoice" });
  await expect(invoiceTab).toBeVisible();
  await invoiceTab.click();

  await page.getByTestId("view-invoice-detail").click();
  await expect(page.getByTestId("invoice-details-sheet")).toBeVisible();
}

test.describe("ADE-76 Contract Invoice approve/status gating", () => {
  test.setTimeout(60000);

  test("shows Approve/Reject when approve/status allows", async ({ page }) => {
    await seedAuth(page, "approver");
    await setupCommonRoutes(page);

    await page.route(
      `**/contract/approver/contracts/${contractId}/invoice/${invoiceId}/approve/status`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok", data: { status: true } }),
        });
      },
    );

    await openInvoiceDetails(page);

    await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).toBeVisible();
  });

  test("hides Approve/Reject when approve/status denies", async ({ page }) => {
    await seedAuth(page, "approver");
    await setupCommonRoutes(page);

    await page.route(
      `**/contract/approver/contracts/${contractId}/invoice/${invoiceId}/approve/status`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok", data: { status: false } }),
        });
      },
    );

    await openInvoiceDetails(page);

    await expect(page.getByRole("button", { name: "Approve" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Reject" })).toBeHidden();
  });
});
