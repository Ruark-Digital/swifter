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

const json = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ status: 200, message: "ok", data }),
});

test.describe("Project linked contracts", () => {
  test("renders the paginated contracts payload and sends filters as query params", async ({
    page,
  }) => {
    await seedAuth(page);

    await page.route("**/contract/manager/projects?**", (route) =>
      route.fulfill(
        json([{ _id: "proj-1", name: "Mid North Refinery", status: "active" }])
      )
    );
    await page.route("**/contract/manager/projects/stats", (route) =>
      route.fulfill(json({ all: 1, active: 1, completed: 0, cancelled: 0 }))
    );
    await page.route("**/contract/manager/projects/proj-1", (route) =>
      route.fulfill(
        json({ _id: "proj-1", name: "Mid North Refinery", status: "active", contract: [] })
      )
    );

    const contractParams: URLSearchParams[] = [];
    await page.route("**/contract/manager/projects/proj-1/contracts?**", (route) => {
      const params = new URL(route.request().url()).searchParams;
      contractParams.push(params);
      const title = params.get("title");
      const pageNo = Number(params.get("page") ?? 1);
      // The API returns { contracts, totalContracts, page, limit }.
      const contracts = title
        ? [{ _id: "con-roof", title: "Roofing Contract", status: "publish" }]
        : [{ _id: `con-p${pageNo}`, title: `Contract on page ${pageNo}`, status: "publish" }];
      return route.fulfill(
        json({
          contracts,
          totalContracts: title ? 1 : 12,
          page: pageNo,
          limit: 10,
        })
      );
    });

    await page.goto("/dashboard/project-management");
    await page.getByTestId("project-name-link").first().click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("tab", { name: "Linked Contract" }).click();

    await expect(page.getByText("Contract on page 1")).toBeVisible();
    expect(contractParams.at(-1)?.get("page")).toBe("1");
    expect(contractParams.at(-1)?.get("limit")).toBe("10");

    await sheet.getByTestId("next-page").click();
    await expect(page.getByText("Contract on page 2")).toBeVisible();
    expect(contractParams.at(-1)?.get("page")).toBe("2");

    await sheet.getByPlaceholder("Search contract").fill("roof");
    await expect(page.getByText("Roofing Contract")).toBeVisible();
    expect(contractParams.at(-1)?.get("title")).toBe("roof");
    // A new search starts again from the first page.
    expect(contractParams.at(-1)?.get("page")).toBe("1");
  });
});
