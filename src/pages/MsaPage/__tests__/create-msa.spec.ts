import { test, expect, Page } from "@playwright/test";

type SeedRole =
  | "vendor"
  | "procurement"
  | "contract_manager"
  | "approver"
  | "view_only";

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

test.describe("Create MSA (API integration)", () => {
  test.setTimeout(60_000);
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/contract/manager/types")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [{ _id: "type-1", name: "Master Service Agreement" }],
          }),
        });
        return;
      }

      if (url.includes("/contract/manager/terms")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [{ _id: "term-1", name: "Fixed" }],
          }),
        });
        return;
      }

      if (url.includes("/contract/manager/payment-terms")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [{ _id: "pay-1", name: "NET 30" }],
          }),
        });
        return;
      }

      if (url.includes("/contract/manager/personnel")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [
              {
                _id: "u-1",
                firstName: "Alex",
                lastName: "Smith",
                email: "a@b.com",
              },
            ],
          }),
        });
        return;
      }

      if (url.includes("/upload")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [
              {
                name: "file.pdf",
                url: "https://cdn.example.com/file.pdf",
                type: "application/pdf",
                size: "123",
              },
            ],
          }),
        });
        return;
      }

      if (
        url.includes("/contract/manager/msa-contract") &&
        route.request().method() === "POST"
      ) {
        const body = route.request().postDataJSON() as any;

        expect(body.contractRelationship).toBe("msa_project");
        expect(body.msaType).toBe("type-1");
        expect(body.contractType).toBeUndefined();
        expect(body.category).toBe("Master Service Agreement");
        expect(body.status).toBe("publish");
        expect(body.currency).toBe("USD");

        expect(body.contigency).toBeUndefined();
        expect(body.holdBack).toBeUndefined();
        expect(body.milestone).toBeUndefined();
        expect(body.insurance).toEqual({
          insurance: "No",
          contractSecurity: false,
        });
        expect(body.files).toBeUndefined();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: { _id: "msa-1" },
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
  });

  test("submits pruned payload and respects dependent visibility rules", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");

    await page.goto("/dashboard/msa");

    await page.locator('[data-testid="create-msa-button"]').click();

    await expect(
      page.locator('[data-testid="create-msa-dialog"]'),
    ).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toHaveClass(
      /sm:max-w-\[550px\]/,
    );

    await page.locator('[data-testid="msa-name-input"]').fill("Test MSA");

    const msaTypeTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: "Select MSA type" })
      .first();
    await expect(msaTypeTrigger).toBeVisible();
    await msaTypeTrigger.click();
    await page
      .getByRole("option", { name: "Master Service Agreement", exact: true })
      .click();

    await page.locator('[data-testid="msa-currency-select"]').click();
    await page.getByPlaceholder("Search currency...").fill("USD");
    await page
      .locator('[data-slot="command-item"]')
      .filter({ hasText: /^USD/ })
      .first()
      .click();

    await page
      .locator('[data-testid="create-msa-dialog"]')
      .getByText("1", { exact: true })
      .first()
      .click();

    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    const paymentTermTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: "Select payment term" })
      .first();
    await expect(paymentTermTrigger).toBeVisible();
    await paymentTermTrigger.click();
    await page.getByRole("option", { name: "NET 30", exact: true }).click();

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("button", { name: "Send for Approval" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Send for Approval" }).click();

    const createDialog = page.locator('[data-testid="create-msa-dialog"]');
    await expect(
      createDialog.getByText("Master Service Agreement", { exact: true }),
    ).toBeVisible();
    await expect(createDialog.getByText("type-1", { exact: true })).toHaveCount(
      0,
    );

    await createDialog
      .getByRole("button", { name: "3. Contract Value & Payments" })
      .click();
    await expect(
      createDialog.getByText("NET 30", { exact: true }),
    ).toBeVisible();
    await expect(createDialog.getByText("pay-1", { exact: true })).toHaveCount(
      0,
    );

    const createRequest = page.waitForRequest(
      (req) =>
        req.url().includes("/contract/manager/msa-contract") &&
        req.method() === "POST",
      { timeout: 15000 },
    );

    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
    await page.getByRole("button", { name: "Publish" }).click();

    await createRequest;

    await page.locator('[data-testid="create-msa-button"]').click();
    await expect(
      page.locator('[data-testid="create-msa-dialog"]'),
    ).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toHaveClass(
      /sm:max-w-\[550px\]/,
    );
  });
});
