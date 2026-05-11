import { expect, Page, test } from "@playwright/test";

type SeedRole =
  | "vendor"
  | "procurement"
  | "contract_manager"
  | "approver"
  | "view_only"
  | "project_manager"
  | "company_admin";

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

async function setupRoutes(page: Page, msaId: string) {
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const pathname = new URL(url).pathname;

    if (
      pathname.endsWith(`/contract/vendor/msa-contract/${msaId}`) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: {
            _id: msaId,
            title: "MSA One",
            msaContractId: "MSA-001",
            status: "active",
            currency: "USD",
            contractValue: 1000,
            holdBackBank: 100,
            holdBackReleased: 0,
            savingAmount: 50,
            milestone: [],
          },
        }),
      });
      return;
    }

    if (
      pathname.endsWith(`/contract/vendor/msa-contract/${msaId}/payment-holdbacks`) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: [
            {
              holdBackId: "HB-1",
              type: "full",
              amount: 10,
              status: "pending",
              releasedDate: "2026-05-01T00:00:00.000Z",
            },
          ],
        }),
      });
      return;
    }

    if (
      pathname.endsWith(`/contract/vendor/msa-contract/${msaId}/payment-savings`) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "ok",
          data: [
            {
              savingId: "SAV-1",
              title: "Saving One",
              category: "cost",
              amount: 5,
              submittedDate: "2026-05-01T00:00:00.000Z",
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "ok", data: [] }),
    });
  });
}

async function assertVendorLikeSavingsGating(page: Page, msaId: string) {
  const requests: string[] = [];
  page.on("request", (req) => requests.push(req.url()));

  await page.goto(`/dashboard/msa/${msaId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "MSA One" })).toBeVisible({
    timeout: 30000,
  });

  const holdbacksResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/msa-contract/${msaId}/payment-holdbacks`) &&
      res.status() === 200,
    { timeout: 30000 },
  );
  await page.getByRole("tab", { name: "Payment Summary", exact: true }).click();
  await holdbacksResponse;

  await expect(
    page.getByRole("tab", { name: "Saving Reaized", exact: true }),
  ).toHaveCount(0);

  expect(requests.some((u) => u.includes(`/msa-contract/${msaId}/payment-savings`))).toBe(
    false,
  );

  await page
    .getByRole("tab", { name: "Holdback Release", exact: true })
    .click();
  await expect(page.getByText("HB-1", { exact: true })).toBeVisible({
    timeout: 30000,
  });
}

test.describe("MSA Payment Summary (vendor-like)", () => {
  test.setTimeout(120_000);
  test.skip(({ browserName }) => browserName !== "chromium");

  test("vendor does not call payment-savings and cannot see Savings tab", async ({
    page,
  }) => {
    const msaId = "msa-1";
    await seedAuth(page, "vendor");
    await setupRoutes(page, msaId);
    await assertVendorLikeSavingsGating(page, msaId);
  });

  test("project manager does not call payment-savings and cannot see Savings tab", async ({
    page,
  }) => {
    const msaId = "msa-1";
    await seedAuth(page, "project_manager");
    await setupRoutes(page, msaId);
    await assertVendorLikeSavingsGating(page, msaId);
  });
});
