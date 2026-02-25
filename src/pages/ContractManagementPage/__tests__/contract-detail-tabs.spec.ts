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
      "Analytics",
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
});
