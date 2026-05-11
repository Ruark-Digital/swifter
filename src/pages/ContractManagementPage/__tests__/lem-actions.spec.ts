import { test, expect, Page } from "@playwright/test";

type SeedRole =
  | "vendor"
  | "project_manager"
  | "approver"
  | "contract_manager"
  | "procurement"
  | "view_only"
  | "company_admin"
  | "super_admin";

async function seedAuth(page: Page, role: SeedRole) {
  await page.addInitScript((roleName: SeedRole) => {
    const now = new Date().toISOString();
    const auth = {
      state: {
        user: {
          _id: "test-user",
          email: "test@swiftpro.com",
          name: "Test User",
          role: { _id: "role-1", name: roleName, __v: 0 },
          companyId: { name: "Test Co", _id: "company-1" },
          createdAt: now,
          updatedAt: now,
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
            createdAt: now,
            updatedAt: now,
            __v: 0,
          },
          isAi: false,
          isDeleted: false,
          contactEmail: "test@swiftpro.com",
          ...(roleName === "project_manager"
            ? { projectmanagerId: "pm-1" }
            : {}),
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

function getContractDetailPath(role: SeedRole, contractId: string) {
  if (role === "vendor" || role === "project_manager") {
    return `/contract/vendor/contracts/${contractId}`;
  }
  if (role === "approver") return `/contract/approver/contracts/${contractId}`;
  if (role === "view_only") return `/user/contract/${contractId}`;
  return `/contract/manager/contracts/${contractId}`;
}

function getLemBasePath(role: SeedRole, contractId: string) {
  if (role === "vendor" || role === "project_manager") {
    return `/contract/vendor/contracts/${contractId}/lems`;
  }
  if (role === "approver") return `/contract/approver/contracts/${contractId}/lems`;
  if (role === "contract_manager" || role === "procurement") {
    return `/contract/manager/contracts/${contractId}/lems`;
  }
  return `/contract/user/contracts/${contractId}/lems`;
}

async function mockContractDetailAndLems(
  page: Page,
  role: SeedRole,
  contractId: string,
) {
  const contractDetailPath = getContractDetailPath(role, contractId);
  const lemBasePath = getLemBasePath(role, contractId);

  await page.route("**/api/v1/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", data: {} }),
    });
  });

  await page.route("**/user/contract/**", async (route) => {
    const url = route.request().url();
    if (!url.includes(`/user/contract/${contractId}`)) {
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
      body: JSON.stringify({
        status: 200,
        message: "Contract fetched successfully",
        data: { _id: contractId, title: "LEM Contract", status: "active" },
      }),
    });
  });

  await page.route("**/contract/**", async (route) => {
    const requestUrl = route.request().url();
    const url = new URL(requestUrl);

    if (url.pathname.endsWith(contractDetailPath)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "Contract fetched successfully",
          data: { _id: contractId, title: "LEM Contract", status: "active" },
        }),
      });
      return;
    }

    if (url.pathname.endsWith(lemBasePath)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "Contract LEMs fetched successfully",
          data: {
            page: 1,
            limit: 10,
            resp: [
              {
                _id: "lem-db-id-1",
                lemId: "LEM-001",
                title: "Pending LEM",
                amount: 10000,
                createdAt: "2026-03-08T12:39:51.301Z",
                status: "pending",
              },
            ],
            count: 1,
          },
        }),
      });
      return;
    }

    if (url.pathname.endsWith(`${lemBasePath}/LEM-001`)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "Contract LEM fetched successfully",
          data: {
            _id: "lem-db-id-1",
            lemId: "LEM-001",
            title: "Pending LEM",
            amount: 10000,
            createdAt: "2026-03-08T12:39:51.301Z",
            status: "pending",
            approverStatus: "pending",
            files: [],
          },
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
}

async function openLemDetailsSheet(page: Page) {
  await page.getByRole("tab", { name: "LEM" }).click();
  await expect(page.locator('[data-testid="lem-table"]')).toBeVisible({
    timeout: 30000,
  });
  await page
    .locator('[data-testid="lem-table"]')
    .getByText("View")
    .first()
    .click();
  await expect(page.locator('[data-testid="lem-details-sheet"]')).toBeVisible({
    timeout: 30000,
  });
}

test.describe("LEM role actions", () => {
  test.describe.configure({ mode: "serial" });
  test("view_only cannot approve/reject LEMs", async ({ page }) => {
    const contractId = "lem-view-only";
    await seedAuth(page, "view_only");
    await mockContractDetailAndLems(page, "view_only", contractId);

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await openLemDetailsSheet(page);

    const sheet = page.locator('[data-testid="lem-details-sheet"]');
    await expect(sheet.getByRole("button", { name: "Approve" })).toHaveCount(0);
    await expect(
      sheet.getByRole("button", { name: "Reject Change" }),
    ).toHaveCount(0);
  });

  test("admins cannot approve/reject LEMs", async ({ page }) => {
    const contractId = "lem-company-admin";
    await seedAuth(page, "company_admin");
    await mockContractDetailAndLems(page, "company_admin", contractId);

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await openLemDetailsSheet(page);

    const sheet = page.locator('[data-testid="lem-details-sheet"]');
    await expect(sheet.getByRole("button", { name: "Approve" })).toHaveCount(0);
    await expect(
      sheet.getByRole("button", { name: "Reject Change" }),
    ).toHaveCount(0);
  });

  test("super_admin cannot approve/reject LEMs", async ({ page }) => {
    const contractId = "lem-super-admin";
    await seedAuth(page, "super_admin");
    await mockContractDetailAndLems(page, "super_admin", contractId);

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await openLemDetailsSheet(page);

    const sheet = page.locator('[data-testid="lem-details-sheet"]');
    await expect(sheet.getByRole("button", { name: "Approve" })).toHaveCount(0);
    await expect(
      sheet.getByRole("button", { name: "Reject Change" }),
    ).toHaveCount(0);
  });

  test("project_manager behaves like vendor (can submit, cannot approve/reject)", async ({
    page,
  }) => {
    const contractId = "lem-project-manager";
    await seedAuth(page, "project_manager");
    await mockContractDetailAndLems(page, "project_manager", contractId);

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await page.getByRole("tab", { name: "LEM" }).click();
    await expect(page.getByRole("button", { name: "Submit LEM" })).toBeVisible();
    await openLemDetailsSheet(page);

    const sheet = page.locator('[data-testid="lem-details-sheet"]');
    await expect(sheet.getByRole("button", { name: "Approve" })).toHaveCount(0);
    await expect(
      sheet.getByRole("button", { name: "Reject Change" }),
    ).toHaveCount(0);
  });

  test("approver can approve/reject pending LEMs", async ({ page }) => {
    const contractId = "lem-approver";
    await seedAuth(page, "approver");
    await mockContractDetailAndLems(page, "approver", contractId);

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await openLemDetailsSheet(page);

    const sheet = page.locator('[data-testid="lem-details-sheet"]');
    await expect(sheet.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(
      sheet.getByRole("button", { name: "Reject Change" }),
    ).toBeVisible();
  });

  test("contract_manager can approve/reject pending LEMs", async ({ page }) => {
    const contractId = "lem-manager";
    await seedAuth(page, "contract_manager");
    await mockContractDetailAndLems(page, "contract_manager", contractId);

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await openLemDetailsSheet(page);

    const sheet = page.locator('[data-testid="lem-details-sheet"]');
    await expect(sheet.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(
      sheet.getByRole("button", { name: "Reject Change" }),
    ).toBeVisible();
  });

  test("contract_manager does not call lem approve/status for gating", async ({
    page,
  }) => {
    const contractId = "lem-manager-no-approve-status";
    await seedAuth(page, "contract_manager");
    await mockContractDetailAndLems(page, "contract_manager", contractId);

    let approveStatusCallCount = 0;
    await page.route("**/approve/status", async (route) => {
      approveStatusCallCount += 1;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ status: 500, message: "unexpected" }),
      });
    });

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await openLemDetailsSheet(page);

    expect(approveStatusCallCount).toBe(0);
  });
});
