import { test, expect, Page } from "@playwright/test";

async function seedAuth(page: Page, role: "vendor") {
  await page.addInitScript((roleName) => {
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

test.describe("Vendor Contract Detail", () => {
  test("loads contract via vendor API and shows vendor-specific fields", async ({ page }) => {
    await seedAuth(page, "vendor");

    // Mock vendor API
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
            contractRelationship: "standalone",
            deviationScale: 5,
            businessDivision: "Ontario",
            status: "active",
            startDate: "2025-01-01T00:00:00Z",
            endDate: "2025-12-31T00:00:00Z",
            datePublished: "2024-12-01T00:00:00Z",
            contractType: { name: "Fixed Price", _id: "ct1" },
            contractFormationStage: {
               draft: { startDate: "2024-11-01", endDate: "2024-11-10" },
               review: { startDate: "2024-11-11", endDate: "2024-11-20" },
               approval: { startDate: "2024-11-21", endDate: "2024-11-30" },
               execution: { startDate: "2024-12-01", endDate: "2024-12-05" },
            },
            creator: { name: "Manager Bob", email: "bob@example.com", _id: "m1" },
            description: "A vendor contract description",
          },
        }),
      });
    });

    // Navigate to contract detail
    await page.goto("/dashboard/contract-management/c1");

    // Check visibility of fields
    await expect(page.getByRole("heading", { name: "Vendor Contract" })).toBeVisible();
    await expect(page.getByText("Deviation Scale")).toBeVisible();
    await expect(page.getByText("5", { exact: true })).toBeVisible(); // Deviation Scale Value
    
    // Check durations
    // Use a specific locator to avoid matching parent containers
    await expect(page.locator("div.flex.flex-col.gap-1").filter({ hasText: "Draft Duration" }).getByText("9 days")).toBeVisible();

    // Check Edit Contract button is hidden
    await expect(page.getByRole("button", { name: "Edit Contract" })).toBeHidden();
    
    // Check Project Name is hidden (since I hid it for vendor)
    await expect(page.getByText("Project Name")).toBeHidden();
  });

  test("invoice create dialog shows correct description placeholder", async ({
    page,
  }) => {
    test.setTimeout(60000);
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
          status: true,
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
          data: { invoices: [], total: 0 },
        }),
      });
    });

    await page.goto("/dashboard/contract-management/c1");

    await expect(
      page.getByRole("heading", { name: "Vendor Contract" }),
    ).toBeVisible();

    const invoiceTab = page.getByRole("tab", { name: "Invoice" });
    await expect(invoiceTab).toBeVisible();
    await invoiceTab.click();
    await page.getByRole("button", { name: "Create Invoice" }).click();

    await expect(page.getByPlaceholder("Enter description")).toBeVisible();
    await expect(page.getByPlaceholder("Duration")).toHaveCount(0);
  });

  test("deliverables default to Pending when status is missing and not submitted", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await seedAuth(page, "vendor");

    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.route("**/vendor/contract/c1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: true,
          message: "ok",
          data: {
            _id: "c1",
            title: "Vendor Contract",
            contractId: "CON-V-1",
            contractRelationship: "standalone",
            status: "active",
          },
        }),
      });
    });

    await page.route("**/contract/vendor/contracts/c1/deliverables/stats", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: { total: 1, submitted: 0, pending: 1, late: 0 },
        }),
      });
    });

    await page.route("**/contract/vendor/contracts/c1/deliverables", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: [
            {
              deliverableId: "d1",
              title: "Deliverable 1",
              dueDate: "2025-01-10",
              submissionStatus: "pending",
            },
          ],
        }),
      });
    });

    await page.goto("/dashboard/contract-management/c1");

    await page.getByRole("tab", { name: "Deliverables" }).click();

    await expect(page.getByRole("cell", { name: "Pending" }).first()).toBeVisible();
    await expect(page.getByText("Under Review")).toHaveCount(0);
  });
});
