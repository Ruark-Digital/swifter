import { test, expect, Page } from "@playwright/test";

type SeedRole = "vendor" | "project_manager" | "contract_manager";

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

test.describe("MSA Compliance & Security flow", () => {
  test("project manager can submit policy when pending; CM-only approve/reject hidden", async ({
    page,
  }) => {
    await seedAuth(page, "project_manager");

    const msaId = "msa-1";
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(String(err)));
    page.on("requestfailed", (req) => failedRequests.push(req.url()));

    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      const pathname = new URL(url).pathname;

      if (
        pathname.endsWith(`/contract/vendor/msa-contracts/${msaId}`) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { _id: msaId, title: "MSA One", status: "active" },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(`/contract/vendor/msa-contracts/${msaId}/compliance`) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              details: {
                policyStatus: { status: "pending" },
                securityStatus: { status: "submitted" },
                coverage: 1,
                security: true,
              },
              policy: [],
              security: [],
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

    await page.goto(`/dashboard/msa/${msaId}`);

    await page.getByRole("tab", { name: "Compliance & Security" }).click();

    await expect(page.getByRole("button", { name: "Submit Policies" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reject" })).toHaveCount(0);

    await page.screenshot({
      path: ".qa/screenshots/msa-compliance-pm-submit.png",
      fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("contract manager sees approve/reject; submit hidden when submitted", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");

    const msaId = "msa-2";
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(String(err)));
    page.on("requestfailed", (req) => failedRequests.push(req.url()));

    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      const pathname = new URL(url).pathname;

      if (
        pathname.endsWith(`/contract/manager/msa-contracts/${msaId}`) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { _id: msaId, title: "MSA Two", status: "active" },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(`/contract/manager/msa-contracts/${msaId}/compliance`) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              details: {
                policyStatus: { status: "submitted" },
                securityStatus: { status: "submitted" },
                coverage: 1,
                security: true,
              },
              policy: [],
              security: [],
            },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(`/manager/msa-contracts/${msaId}/compliance/policy/approve`) &&
        route.request().method() === "POST"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: {} }),
      });
    });

    await page.goto(`/dashboard/msa/${msaId}`);
    await page.getByRole("tab", { name: "Compliance & Security" }).click();

    await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Policies" })).toHaveCount(0);

    await page.screenshot({
      path: ".qa/screenshots/msa-compliance-cm-approve.png",
      fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
});

