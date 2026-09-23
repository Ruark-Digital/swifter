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

    // Trailing ** also matches the detail GET's pagination/search query params.
    await page.route("**/contract/manager/business-division/div-1**", async (route) => {
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

  test("shows linked projects and contracts in division details sheet", async ({ page }) => {
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
                totalProjects: 1,
                totalContracts: 1,
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

    await page.route("**/contract/manager/business-division/div-1?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            _id: "div-1",
            businessId: "DIV-001",
            name: "Ontario Operations",
            location: "Toronto",
            totalProjects: 1,
            totalContracts: 1,
            totalProjectValue: 1200000,
            totalContractValue: 900000,
            createdAt: "2025-01-15T10:00:00.000Z",
            // The API returns each list as a paginated object.
            projects: {
              docs: [
                {
                  _id: "proj-1",
                  projectId: "PRJ-001",
                  // The API returns the project's display name as `name`.
                  name: "North Plant Upgrade",
                  budget: 1200000,
                  status: "active",
                },
              ],
              totalDocs: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
            contracts: {
              docs: [
                {
                  _id: "con-1",
                  contractId: "CON-001",
                  title: "Electrical Works Contract",
                  contractValue: 900000,
                  currency: "USD",
                  status: "publish",
                },
              ],
              totalDocs: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          },
        }),
      });
    });

    await page.goto("/dashboard/business-divisions");

    await page.getByRole("button", { name: "View" }).first().click();
    await expect(page.getByRole("heading", { name: "Business Division Details" })).toBeVisible();

    // "Total Project Budget" replaces the old "Total Project Value" label.
    await expect(page.getByText("Total Project Budget")).toBeVisible();
    await expect(page.getByText("Jan 15, 2025")).toBeVisible();

    // Projects tab is the default; its rows are visible up-front.
    await expect(page.getByText("North Plant Upgrade")).toBeVisible();
    await expect(page.getByText("PRJ-001")).toBeVisible();

    // Contracts live behind their own tab.
    await page.getByRole("tab", { name: /Contracts/ }).click();
    const contractLink = page.getByRole("link", { name: /Electrical Works Contract/ });
    await expect(contractLink).toBeVisible();
    await expect(page.getByText("CON-001")).toBeVisible();
    // Raw "publish" status renders with the system label "Published".
    await expect(page.getByText("Published")).toBeVisible();

    // The contract name links straight to the contract detail page.
    await expect(contractLink).toHaveAttribute(
      "href",
      "/dashboard/contract-management/con-1",
    );
  });

  test("searches and pages division projects/contracts via query params", async ({ page }) => {
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
            docs: [{ _id: "div-1", name: "Ontario Operations", location: "Toronto" }],
            totalDocs: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        }),
      });
    });

    const detailParams: URLSearchParams[] = [];
    await page.route("**/contract/manager/business-division/div-1?**", async (route) => {
      const params = new URL(route.request().url()).searchParams;
      detailParams.push(params);
      const projectPage = Number(params.get("projectPage") ?? 1);
      const contractQuery = params.get("contractQuery");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            _id: "div-1",
            name: "Ontario Operations",
            location: "Toronto",
            totalProjects: 12,
            totalContracts: 2,
            projects: {
              docs: [
                {
                  _id: `proj-${projectPage}`,
                  projectId: `PRJ-P${projectPage}`,
                  name: `Project on page ${projectPage}`,
                  status: "active",
                },
              ],
              totalDocs: 12,
              page: projectPage,
              limit: 10,
              totalPages: 2,
            },
            contracts: {
              docs: contractQuery
                ? [{ _id: "con-2", contractId: "CON-002", title: "Roofing Contract" }]
                : [
                    { _id: "con-1", contractId: "CON-001", title: "Electrical Works Contract" },
                    { _id: "con-2", contractId: "CON-002", title: "Roofing Contract" },
                  ],
              totalDocs: contractQuery ? 1 : 2,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          },
        }),
      });
    });

    await page.goto("/dashboard/business-divisions");
    await page.getByRole("button", { name: "View" }).first().click();

    await expect(page.getByText("Project on page 1")).toBeVisible();
    await expect(page.getByText("Page 1 of 2")).toBeVisible();

    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByText("Project on page 2")).toBeVisible();
    expect(detailParams.at(-1)?.get("projectPage")).toBe("2");

    await page.getByRole("tab", { name: /Contracts/ }).click();
    await expect(page.getByText("Electrical Works Contract")).toBeVisible();
    await page.getByPlaceholder("Search contracts by title or ID").fill("roof");
    await expect(page.getByText("Electrical Works Contract")).toBeHidden();
    await expect(page.getByText("Roofing Contract")).toBeVisible();
    expect(detailParams.at(-1)?.get("contractQuery")).toBe("roof");
    expect(detailParams.at(-1)?.get("contractPage")).toBe("1");
  });
});
