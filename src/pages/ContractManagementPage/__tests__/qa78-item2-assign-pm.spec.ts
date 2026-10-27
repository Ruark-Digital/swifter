import { test, expect, Page } from "@playwright/test";

type SeedRole = "vendor" | "contract_manager";

async function seedAuth(page: Page, role: SeedRole) {
  const now = new Date().toISOString();
  const auth = {
    state: {
      user: {
        _id: "test-user",
        email: "test@swiftpro.com",
        name: "Test User",
        role: { _id: "role-1", name: role, __v: 0 },
        companyId: { name: "Test Co", _id: "company-1" },
        currency: "CAD",
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
      },
      token: "test-token",
      refresh: null,
      authorities: [],
    },
    version: 0,
  };
  await page.addInitScript((raw: string) => {
    window.localStorage.setItem("auth", raw);
  }, JSON.stringify(auth));
}

const CONTRACT_ID = "c-item2-1";

function contractDetailPayload() {
  return {
    status: 200,
    message: "ok",
    data: {
      _id: CONTRACT_ID,
      contractId: "CT-ITEM2-1",
      title: "Assign PM Contract",
      status: "publish",
      owner: true,
      currency: "CAD",
    },
  };
}

test.describe("QA #78 Item 2 Inc 1 - assign PM by email", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      }),
    );
    await page.route(`**/contract/manager/contracts/${CONTRACT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(contractDetailPayload()),
      }),
    );
  });

  test("CM owner can assign a PM by email", async ({ page }) => {
    await seedAuth(page, "contract_manager");

    let onboardPayload: unknown = null;
    await page.route("**/contract/manager/contracts/*/project-manager", (route) => {
      onboardPayload = route.request().postDataJSON();
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ status: 201, message: "ok", data: {} }),
      });
    });

    await page.goto(`/dashboard/contract-management/${CONTRACT_ID}`, {
      waitUntil: "commit",
    });

    const assignButton = page.getByRole("button", { name: /^Assign PM$/i });
    await expect(assignButton).toBeVisible({ timeout: 30000 });
    await assignButton.click();

    await page.getByPlaceholder("pm@example.com").fill("newpm@example.com");
    await page.getByRole("button", { name: /^Assign PM$/i }).last().click();

    await expect.poll(() => onboardPayload).not.toBeNull();
    expect(onboardPayload).toMatchObject({ email: "newpm@example.com" });
  });

  test("vendor does not see the Assign PM button", async ({ page }) => {
    await seedAuth(page, "vendor");
    await page.route(`**/contract/vendor/contracts/${CONTRACT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(contractDetailPayload()),
      }),
    );
    await page.goto(`/dashboard/contract-management/${CONTRACT_ID}`, {
      waitUntil: "commit",
    });
    await expect(
      page.getByRole("heading", { name: /Assign PM Contract/i }),
    ).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByRole("button", { name: /^Assign PM$/i }),
    ).toHaveCount(0);
  });
});
