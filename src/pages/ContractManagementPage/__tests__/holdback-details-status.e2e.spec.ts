import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    const auth = {
      state: {
        user: {
          _id: "manager-user",
          email: "manager@swiftpro.com",
          name: "Manager User",
          role: { _id: "role-1", name: "contract_manager", __v: 0 },
          companyId: { name: "Test Co", _id: "company-1" },
          status: "active",
        },
        token: "test-token",
        refresh: null,
      },
      version: 0,
    };
    window.localStorage.setItem("auth", JSON.stringify(auth));
  });
}

test.describe("Holdback Details status badge", () => {
  test("renders status from API detail", async ({ page }) => {
    test.setTimeout(120000);
    await seedAuth(page);

    const seenApiRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("swiftpro.tech")) seenApiRequests.push(url);
    });

    await page.route("**/api/v1/dev/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/contract/manager/contracts/c1/payment-holdbacks")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [
              {
                holdBackId: "HB-1",
                type: "full",
                amount: 1000,
                status: "rejected",
                releasedDate: "2026-05-01T00:00:00Z",
              },
            ],
          }),
        });
        return;
      }

      if (url.includes("/contract/manager/contracts/c1/payment-savings")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data: [] }),
        });
        return;
      }

      if (url.includes("/contract/manager/contracts/c1/payment-holdbacks/HB-1")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: {
              _id: "HB-1",
              contract: "c1",
              contractRefModel: "Contract",
              company: "company-1",
              amount: 1000,
              holdBackId: "HB-1",
              type: "full",
              status: "rejected",
              approvedBy: "approver-1",
              description: "Test holdback",
              releasedDate: "2026-05-01T00:00:00Z",
              files: [],
              __v: 0,
            },
          }),
        });
        return;
      }

      if (url.endsWith("/contract/manager/contracts/c1")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: {
              _id: "c1",
              title: "Contract 1",
              currency: "USD",
              status: "publish",
              contractId: "C1",
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.goto(`${BASE_URL}/dashboard/contract-management/c1`);

    const paymentSummaryTab = page.getByRole("tab", { name: /payment summary/i });
    await expect(paymentSummaryTab).toBeVisible({ timeout: 60000 });
    await paymentSummaryTab.click();

    const holdbackReleaseTab = page.getByRole("tab", { name: /^holdback release$/i });
    await expect(holdbackReleaseTab).toBeVisible({ timeout: 60000 });
    await holdbackReleaseTab.click();

    await page.screenshot({
      path: ".qa/snapshots/ade64-holdback-release-tab.png",
      fullPage: false,
    });

    try {
      await expect(page.getByText("HB-1")).toBeVisible({ timeout: 60000 });
    } catch {
      // Provide request context for debugging failures in CI.
      throw new Error(
        `HB-1 not visible. Seen API requests:\n${seenApiRequests.slice(0, 30).join("\n")}`,
      );
    }

    await page.screenshot({
      path: ".qa/snapshots/ade64-payment-summary.png",
      fullPage: false,
    });

    const viewBtn = page.getByText("View", { exact: true }).first();
    await expect(viewBtn).toBeVisible({ timeout: 60000 });
    await viewBtn.click();

    await expect(page.getByText("Holdback Details")).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole("dialog").getByText("Rejected")).toBeVisible();

    await page.screenshot({
      path: ".qa/snapshots/ade64-holdback-status.png",
      fullPage: false,
    });
  });
});
