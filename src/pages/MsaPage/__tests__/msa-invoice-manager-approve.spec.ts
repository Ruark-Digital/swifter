import { expect, Page, test } from "@playwright/test";

type SeedRole = "contract_manager";

async function seedAuth(page: Page, role: SeedRole) {
  await page.addInitScript((roleName) => {
    const auth = {
      state: {
        user: {
          _id: "cm-user",
          email: "cm@swiftpro.com",
          name: "Contract Manager",
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
          contactEmail: "cm@swiftpro.com",
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

async function setupRoutes(page: Page, msaId: string, invoiceId: string) {
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const pathname = new URL(url).pathname;

    if (
      pathname.endsWith(`/contract/manager/msa-contracts/${msaId}`) &&
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
      pathname.endsWith(`/contract/manager/msa-contracts/${msaId}/invoice/stats`) &&
      method === "GET"
    ) {
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

    if (
      pathname.endsWith(`/contract/manager/msa-contracts/${msaId}/invoice`) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            invoices: [
              {
                _id: invoiceId,
                invoiceId: "INV-001",
                type: "monthly payment",
                amount: 0,
                status: "pending",
              },
            ],
            total: 1,
          },
        }),
      });
      return;
    }

    if (
      pathname.endsWith(`/contract/manager/msa-contracts/${msaId}/invoice/${invoiceId}`) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            _id: invoiceId,
            invoiceId: "INV-001",
            title: "Invoice 1",
            type: "monthly payment",
            description: "Invoice description",
            taxCode: "HST",
            taxValue: 0,
            amount: 0,
            status: "pending",
            files: [],
          },
        }),
      });
      return;
    }

    if (
      pathname.endsWith(
        `/contract/manager/msa-contracts/${msaId}/invoice/${invoiceId}/approve`,
      ) &&
      method === "POST"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok" }),
      });
      return;
    }

    if (pathname.includes("/approve/status")) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "unexpected" }),
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

test.describe("MSA Invoice manager approve", () => {
  test.setTimeout(120_000);
  test.skip(({ browserName }) => browserName !== "chromium");

  test("manager sees Approve/Reject on pending invoice and calls manager approve endpoint", async ({
    page,
  }) => {
    const msaId = "msa-1";
    const invoiceId = "inv-1";
    await seedAuth(page, "contract_manager");
    await setupRoutes(page, msaId, invoiceId);

    const requests: string[] = [];
    page.on("request", (req) => requests.push(req.url()));

    await page.goto(`/dashboard/msa/${msaId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "MSA One" })).toBeVisible({
      timeout: 30000,
    });

    await page.getByRole("tab", { name: "Invoice", exact: true }).click();
    await page.getByRole("button", { name: "View", exact: true }).click();

    await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).toBeVisible();

    const approveReq = page.waitForRequest(
      (req) =>
        req.method() === "POST" &&
        req.url().includes(
          `/contract/manager/msa-contracts/${msaId}/invoice/${invoiceId}/approve`,
        ),
      { timeout: 30000 },
    );

    await page.getByRole("button", { name: "Approve" }).click();
    await approveReq;

    expect(requests.some((u) => u.includes("/approve/status"))).toBe(false);
  });
});

