import { test, expect, Page } from "@playwright/test";

async function seedAuth(page: Page, role: "contract_manager" | "vendor" = "contract_manager") {
  await page.addInitScript((roleName) => {
    const auth = {
      state: {
        user: {
          _id: "collab-user",
          email: "collab@swiftpro.com",
          name: "Collab User",
          role: { _id: "role-1", name: roleName, __v: 0 },
          companyId: { name: "Test Co", _id: "company-1" },
          module: {
            contractManagement: true,
            solicitationManagement: true,
            evaluationsManagement: true,
            vendorManagement: true,
            reportsAnalytics: true,
            vendorsQA: true,
            generalUpdatesNotifications: true,
            addendumManagement: true,
            myActions: true,
          },
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

test.describe("Collaboration Tool", () => {
  test("navigate and toggle views", async ({ page }) => {
    await seedAuth(page);
    await page.goto("/collaboration-tool");
    await expect(page.getByText("Document Editor")).toBeVisible();
    await expect(page.getByRole("button", { name: "Comments" })).toBeVisible();
    await page.locator(".ct-segment button").nth(1).click();
    await expect(page.getByText("Log")).toBeVisible();
  });

  test("allows typing a contract-level comment when contractId is present", async ({ page }) => {
    await seedAuth(page);
    await page.goto("/collaboration-tool?contractId=contract-1");

    const input = page.getByLabel("Write a Comment");
    await expect(input).toBeEnabled();

    await input.fill("Hello from contract comment");
    await input.press("Enter");

    await expect(page.getByText("Hello from contract comment")).toBeVisible();
  });

  test("notifies when offline and back online", async ({ page }) => {
    await seedAuth(page);
    await page.goto("/collaboration-tool?contractId=contract-1");
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      window.dispatchEvent(new Event("offline"));
    });
    await expect(page.getByText("You're offline", { exact: true }).first()).toBeVisible();

    await page.evaluate(() => {
      window.dispatchEvent(new Event("online"));
    });
    await expect(page.getByText("Back online")).toBeVisible();
  });

  test("keeps tab switch below interaction budget", async ({ page }) => {
    await seedAuth(page);
    await page.goto("/collaboration-tool");
    await expect(page.getByRole("button", { name: "Comments" })).toBeVisible();
    await page.waitForTimeout(500);
    await page.locator(".ct-segment button").nth(1).click();
    await page.locator(".ct-segment button").nth(0).click();

    const switchDuration = await page.evaluate(async () => {
      const commentsButton = document.querySelector(
        'button[aria-pressed="true"]',
      ) as HTMLButtonElement | null;
      const logButton = Array.from(document.querySelectorAll("button")).find(
        (node) => node.textContent?.includes("Log"),
      ) as HTMLButtonElement | null;
      if (!commentsButton || !logButton) return Number.POSITIVE_INFINITY;

      const start = performance.now();
      logButton.click();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return performance.now() - start;
    });

    expect(switchDuration).toBeLessThan(50);
  });
});

