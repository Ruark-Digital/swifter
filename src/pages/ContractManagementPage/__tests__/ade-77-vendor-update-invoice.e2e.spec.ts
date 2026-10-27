import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    const auth = {
      state: {
        user: {
          _id: "vendor-user",
          email: "vendor@swiftpro.com",
          name: "Vendor User",
          role: { _id: "role-v", name: "vendor", __v: 0 },
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

const REJECTED_INVOICE = {
  _id: "inv-rejected",
  invoiceId: "INV-REJ-1",
  title: "Rejected Invoice",
  description: "Needs vendor fixes",
  type: "progress draw" as const,
  taxCode: "HST",
  taxValue: 13,
  amount: 100,
  status: "rejected" as const,
  fileType: "manual" as const,
  files: [],
};

const DRAFT_INVOICE = { ...REJECTED_INVOICE, status: "draft" as const };

type StubOptions = {
  invoice: typeof REJECTED_INVOICE | (Omit<typeof REJECTED_INVOICE, "status"> & {
    status: "pending" | "approved" | "rejected" | "active" | "draft";
  });
  contractStatus?: "active" | "pending_approval";
  onPut?: (body: any) => void;
};

async function stubAll(page: Page, { invoice, contractStatus = "active", onPut }: StubOptions) {
  await page.route("**/api/v1/dev/**", async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    // PUT update invoice
    if (
      method === "PUT" &&
      url.includes(`/contract/vendor/contracts/c1/invoice/${invoice._id}`)
    ) {
      let body: any = {};
      try {
        body = JSON.parse(req.postData() || "{}");
      } catch {}
      onPut?.(body);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: { ...invoice, ...body },
        }),
      });
      return;
    }

    // GET contract detail
    if (
      method === "GET" &&
      url.endsWith("/contract/vendor/contracts/c1")
    ) {
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
            status: contractStatus,
            currency: "USD",
          },
        }),
      });
      return;
    }

    // Invoice list stats
    if (url.includes("/contract/vendor/contracts/c1/invoice") && url.includes("/stats")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: { approved: 0, pending: 0, rejected: 0, draft: 1 },
        }),
      });
      return;
    }

    // Invoice detail (GET by id)
    if (
      method === "GET" &&
      url.match(/\/contract\/vendor\/contracts\/c1\/invoice\/[^/]+$/)
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", data: invoice }),
      });
      return;
    }

    // Invoice list
    if (
      method === "GET" &&
      url.includes("/contract/vendor/contracts/c1/invoice")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: { invoices: [invoice], total: 1 },
        }),
      });
      return;
    }

    // Default
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", data: [] }),
    });
  });
}

test.describe("ADE-77 Vendor update invoice flow", () => {
  test.setTimeout(120000);

  test("Edit dialog opens in edit mode for a rejected invoice, prefilled with Update Invoice action", async ({
    page,
  }) => {
    await seedAuth(page);
    await stubAll(page, { invoice: REJECTED_INVOICE, contractStatus: "active" });

    await page.goto(`${BASE_URL}/dashboard/contract-management/c1`);

    const invoiceTab = page.getByRole("tab", { name: "Invoice" });
    await expect(invoiceTab).toBeVisible({ timeout: 60000 });
    await invoiceTab.click();

    await page.getByTestId("view-invoice-detail").first().click();

    // Edit trigger present for rejected invoice + active contract
    const editTrigger = page.getByTestId("edit-invoice-trigger");
    await expect(editTrigger).toBeVisible();
    await editTrigger.click();

    // Dialog shows edit-mode title, prefilled invoice title, and the
    // Update (not Create) action — proving the new edit-mode wiring.
    await expect(page.getByRole("heading", { name: "Edit Invoice" })).toBeVisible();
    await expect(page.getByPlaceholder("Enter title")).toHaveValue("Rejected Invoice");
    await expect(page.getByRole("button", { name: "Update Invoice" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Invoice" })).toHaveCount(0);
  });

  test("Edit trigger is hidden for non-rejected statuses (draft, active, pending, approved)", async ({
    page,
  }) => {
    for (const status of ["draft", "active", "pending", "approved"] as const) {
      await seedAuth(page);
      await stubAll(page, {
        invoice: { ...REJECTED_INVOICE, status },
        contractStatus: "active",
      });

      await page.goto(`${BASE_URL}/dashboard/contract-management/c1`);
      await page.getByRole("tab", { name: "Invoice" }).click();
      await page.getByTestId("view-invoice-detail").first().click();

      await expect(
        page.getByTestId("edit-invoice-trigger"),
        `status="${status}" should not show Edit`,
      ).toHaveCount(0);

      // Close sheet for next iteration
      await page.keyboard.press("Escape");
    }
  });

  test("Edit trigger is hidden when contract is pending approval (even for rejected invoice)", async ({
    page,
  }) => {
    await seedAuth(page);
    await stubAll(page, {
      invoice: REJECTED_INVOICE,
      contractStatus: "pending_approval",
    });

    await page.goto(`${BASE_URL}/dashboard/contract-management/c1`);
    await page.getByRole("tab", { name: "Invoice" }).click();
    await page.getByTestId("view-invoice-detail").first().click();

    await expect(page.getByTestId("edit-invoice-trigger")).toHaveCount(0);
  });
});
