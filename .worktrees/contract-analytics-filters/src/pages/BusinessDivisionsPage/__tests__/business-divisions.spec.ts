import { test, expect, Page } from "@playwright/test";

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    const auth = {
      state: {
        user: {
          _id: "test-user",
          email: "admin@swiftpro.com",
          name: "Company Admin",
          role: { _id: "role-1", name: "company_admin", __v: 0 },
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
          contactEmail: "admin@swiftpro.com",
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

test.describe("Business Divisions", () => {
  test("opens edit dialog from division details sheet", async ({ page }) => {
    await seedAuth(page);

    await page.route("**/contract/manager/business-division/stats", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", data: { totalDivisions: 1 } }),
      });
    });

    await page.route("**/contract/manager/business-division?page=1&limit=10**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            docs: [
              {
                _id: "div-1",
                name: "Ontario Operations",
                location: "Toronto",
                totalProjects: 2,
                totalContracts: 3,
                totalProjectValue: 1200000,
                totalContractValue: 900000,
              },
            ],
            totalDocs: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        }),
      });
    });

    await page.route("**/contract/manager/business-division/div-1", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Business division updated successfully",
            data: { _id: "div-1", name: "Ontario Operations", location: "Toronto" },
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
            _id: "div-1",
            name: "Ontario Operations",
            location: "Toronto",
            totalProjects: 2,
            totalContracts: 3,
            totalProjectValue: 1200000,
            totalContractValue: 900000,
          },
        }),
      });
    });

    await page.goto("/dashboard/business-divisions");

    await page.getByRole("button", { name: "View" }).first().click();
    await expect(page.getByRole("heading", { name: "Business Division Details" })).toBeVisible();

    await page.getByRole("button", { name: "Edit Business Division" }).click();
    await expect(page.getByTestId("edit-division-dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Edit Division" })).toBeVisible();
  });
});
