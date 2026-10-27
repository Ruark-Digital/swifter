import { test, expect, Page } from "@playwright/test";

type SeedRole = "approver" | "contract_manager";

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

test.describe("Contract Detail Tabs visibility", () => {
  test("approver sees the whitelisted tabs only", async ({ page }) => {
    await seedAuth(page, "approver");

    const contractId = "c-visibility-1";

    await page.route("**/contract/**", async (route) => {
      const url = route.request().url();
      if (url.includes(`/contract/approver/contracts/${contractId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Contract fetched successfully",
            data: { _id: contractId, title: "Visibility Contract", status: "active" },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: {} }),
      });
    });

    await page.goto(`/dashboard/contract-management/${contractId}`);

    const allowed = [
      "Overview",
      "Analytics",
      "Payment Summary",
      "Documents",
      "Amendments",
      "Change Management",
      "Claims",
      "Invoice",
      "RFI",
      "LEM",
      "Deliverables",
      "NCR Log",
    ];

    for (const label of allowed) {
      await expect(page.locator("button", { hasText: label })).toBeVisible();
    }

    const disallowed = [
      "KPI",
      "Compliance & Security",
      "Rate Sheets",
      "Approvers",
      "Vendor’s Reports",
      "Clause Library",
      "Action Log",
    ];

    for (const label of disallowed) {
      await expect(page.locator("button", { hasText: label })).toHaveCount(0);
    }

    await expect(page.locator("button[role=tab]")).toHaveCount(allowed.length);
  });

  test("non-approver sees all tabs", async ({ page }) => {
    await seedAuth(page, "contract_manager");

    const contractId = "c-visibility-2";

    await page.route("**/contract/**", async (route) => {
      const url = route.request().url();
      if (url.includes(`/contract/manager/contracts/${contractId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Contract fetched successfully",
            data: { _id: contractId, title: "Visibility Contract", status: "active" },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: {} }),
      });
    });

    await page.goto(`/dashboard/contract-management/${contractId}`);

    const allLabels = [
      "Overview",
      "Analytics",
      "KPI",
      "Compliance & Security",
      "Documents",
      "Amendments",
      "Deliverables",
      "Payment Summary",
      "Rate Sheets",
      "LEM",
      "Invoice",
      "Change Management",
      "Claims",
      "RFI",
      "NCR Log",
      "Approvers",
      "Vendor’s Reports",
      "Clause Library",
      "Action Log",
    ];

    for (const label of allLabels) {
      await expect(page.locator("button", { hasText: label })).toBeVisible();
    }

    await expect(page.locator("button[role=tab]")).toHaveCount(allLabels.length);
  });

  test("analytics chart range filters fetch per-chart data and remain independent", async ({ page }) => {
    await seedAuth(page, "contract_manager");

    const contractId = "c-analytics-filters-1";
    let activitiesRequestCount = 0;

    page.on("request", (req) => {
      if (req.url().includes(`/contract/manager/contracts/${contractId}/dashboard/activities`)) {
        activitiesRequestCount += 1;
      }
    });

    await page.route("**/contract/**", async (route) => {
      const requestUrl = route.request().url();
      const url = new URL(requestUrl);

      if (url.pathname.endsWith(`/contract/manager/contracts/${contractId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Contract fetched successfully",
            data: { _id: contractId, title: "Analytics Filters Contract", status: "active" },
          }),
        });
        return;
      }

      if (requestUrl.includes(`/contract/manager/contracts/${contractId}/dashboard/activities`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Activities fetched successfully",
            data: {
              current: { range: url.searchParams.get("range") ?? "YTD", labels: [], series: {} },
              previous: { range: url.searchParams.get("range") ?? "YTD", labels: [], series: {} },
            },
          }),
        });
        return;
      }

      if (requestUrl.includes(`/contract/manager/contracts/${contractId}/dashboard/delivery-summary`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Delivery summary fetched successfully",
            data: { summary: {}, deliverables: [] },
          }),
        });
        return;
      }

      if (requestUrl.includes(`/contract/manager/contracts/${contractId}/dashboard/vendor-kpi`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [],
          }),
        });
        return;
      }

      if (requestUrl.includes(`/contract/manager/contracts/${contractId}/deliverables/stats`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: { total: 0, submitted: 0, pending: 0, late: 0 },
          }),
        });
        return;
      }

      if (requestUrl.includes(`/contract/manager/contracts/${contractId}/deliverables`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: {} }),
      });
    });

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await expect(
      page.getByRole("heading", { name: "Analytics Filters Contract" }),
    ).toBeVisible();
    const analyticsTabTrigger = page
      .locator('[data-slot="tabs-trigger"]', { hasText: "Analytics" })
      .first();
    await expect(analyticsTabTrigger).toBeVisible();
    await Promise.all([
      page.waitForRequest((req) => {
        if (!req.url().includes(`/contract/manager/contracts/${contractId}/dashboard/activities`)) return false;
        const u = new URL(req.url());
        return u.searchParams.get("range") === "YTD";
      }),
      page.waitForRequest((req) => {
        if (!req.url().includes(`/contract/manager/contracts/${contractId}/dashboard/delivery-summary`)) return false;
        const u = new URL(req.url());
        return u.searchParams.get("range") === "YTD";
      }),
      analyticsTabTrigger.click(),
    ]);

    const activitiesCard = page
      .getByRole("heading", { name: "Activities" })
      .locator("..")
      .locator("..");
    const activitiesNinetyDays = activitiesCard.getByRole("button", { name: "90 days" });
    await expect(activitiesNinetyDays).toBeVisible();
    await Promise.all([
      page.waitForRequest((req) => {
        if (!req.url().includes(`/contract/manager/contracts/${contractId}/dashboard/activities`)) return false;
        const u = new URL(req.url());
        return u.searchParams.get("range") === "90";
      }),
      activitiesNinetyDays.click(),
    ]);

    const activitiesRequestCountBeforeDeliveryChange = activitiesRequestCount;

    const deliverableSummaryCard = page
      .getByRole("heading", { name: "Deliverable Summary" })
      .locator("..")
      .locator("..");
    const deliverableSevenDays = deliverableSummaryCard.getByRole("button", { name: "7 days" });
    await expect(deliverableSevenDays).toBeVisible();
    await Promise.all([
      page.waitForRequest((req) => {
        if (!req.url().includes(`/contract/manager/contracts/${contractId}/dashboard/delivery-summary`)) return false;
        const u = new URL(req.url());
        return u.searchParams.get("range") === "7";
      }),
      deliverableSevenDays.click(),
    ]);

    expect(activitiesRequestCount).toBe(activitiesRequestCountBeforeDeliveryChange);
  });
});
