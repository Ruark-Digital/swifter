import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const LOGIN_EMAIL = "adediran.dbs+pm@gmail.com";
const LOGIN_PASSWORD = "password";

async function loginAsVendorLike(page: Page) {
  await page.goto(BASE_URL);
  const emailInput = page.locator("input[name='email']");
  const passwordInput = page.locator("input[name='password']");

  await expect(emailInput).toBeVisible({ timeout: 60000 });
  await expect(passwordInput).toBeVisible({ timeout: 60000 });

  await emailInput.fill(LOGIN_EMAIL);
  await passwordInput.fill(LOGIN_PASSWORD);

  const submitButton = page.locator("button[type='submit']").or(
    page.getByRole("button", { name: /log ?in/i }),
  );
  await expect(submitButton).toBeVisible({ timeout: 60000 });
  await submitButton.click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60000 });
}

async function seedVendorChange(page: Page, contractId: string) {
  const token = await page.evaluate(() => {
    const raw = window.localStorage.getItem("auth");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token ?? null;
    } catch {
      return null;
    }
  });

  if (!token) throw new Error("Missing auth token after login.");

  const res = await page.request.post(
    `https://dev.swiftpro.tech/api/v1/dev/contract/vendor/contracts/${contractId}/changes`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {
        title: `ADE-87 Seed Change ${Date.now()}`,
        description: "Seeding a change to validate comments for ADE-87.",
        type: "request",
        urgency: "low",
      },
    },
  );

  if (!res.ok()) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to seed vendor change (status ${res.status()}): ${body}`,
    );
  }
}

async function navigateToContractWithChanges(page: Page) {
  const contractNavItem = page.getByRole("link", { name: /contract management/i });
  await expect(contractNavItem).toBeVisible({ timeout: 30000 });
  await contractNavItem.click();
  await expect(page).toHaveURL(/\/dashboard\/contract-management$/, { timeout: 60000 });

  const emptyState = page.getByText(/no contracts yet/i);
  let lastSeedError: unknown = null;

  for (let listPage = 1; listPage <= 5; listPage++) {
    const contractLinks = page.locator("a[href*='/dashboard/contract-management/']");

    await Promise.race([
      contractLinks.first().waitFor({ state: "visible", timeout: 30000 }),
      emptyState.waitFor({ state: "visible", timeout: 30000 }),
    ]);

    const contractCount = await contractLinks.count();
    if (contractCount < 1) throw new Error("No contracts were found for this vendor.");

    for (let i = 0; i < Math.min(contractCount, 10); i++) {
      const href = await contractLinks.nth(i).getAttribute("href");
      if (!href) continue;

      await contractLinks.nth(i).click();
      await expect(page).toHaveURL(/\/dashboard\/contract-management\/.+/, {
        timeout: 60000,
      });

      const url = page.url();
      const match = url.match(/\/dashboard\/contract-management\/([^/?#]+)/);
      const contractId = match?.[1];
      if (!contractId) throw new Error(`Unable to parse contractId from URL: ${url}`);

      const changeManagementTab = page.getByRole("tab", { name: /change management/i });
      await expect(changeManagementTab).toBeVisible({ timeout: 60000 });
      await changeManagementTab.click();

      const changesTableRowMenu = page.getByRole("button", { name: "⋮" }).first();
      const hasRowMenu = await changesTableRowMenu.isVisible().catch(() => false);
      if (hasRowMenu) return;

      try {
        await seedVendorChange(page, contractId);

        await page.reload({ waitUntil: "domcontentloaded" });
        const changeManagementTabAfter = page.getByRole("tab", { name: /change management/i });
        await expect(changeManagementTabAfter).toBeVisible({ timeout: 60000 });
        await changeManagementTabAfter.click();

        await expect(changesTableRowMenu).toBeVisible({ timeout: 60000 });
        return;
      } catch (err) {
        lastSeedError = err;
      }

      const breadcrumbContracts = page
        .getByRole("navigation", { name: /breadcrumb/i })
        .getByRole("link", { name: /contracts/i })
        .first();
      await expect(breadcrumbContracts).toBeVisible({ timeout: 60000 });
      await breadcrumbContracts.click();
      await expect(page).toHaveURL(/\/dashboard\/contract-management$/, { timeout: 60000 });
    }

    const pagination = page.getByRole("navigation", { name: /pagination/i });
    const nextPageLink = pagination.getByRole("link", { name: String(listPage + 1) });
    const canGoNext = await nextPageLink.isVisible().catch(() => false);

    if (!canGoNext) break;
    await nextPageLink.click();
    await expect(page).toHaveURL(/\/dashboard\/contract-management$/, { timeout: 60000 });
  }

  await page.screenshot({
    path: "test-results/ade87-vendor-comments-blocked.png",
    fullPage: false,
  });

  const lastSeedMsg =
    lastSeedError instanceof Error ? lastSeedError.message : String(lastSeedError ?? "");

  throw new Error(
    `Unable to find (or seed) a contract change to test comments. ${lastSeedMsg}`,
  );
}

test.describe("ADE-87 Vendor Change Comments — Real Auth", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("loads and posts vendor-like change comments via Phase 2 endpoints", async ({ page }) => {
    test.setTimeout(180000);

    const seenRequests: Array<{ method: string; url: string }> = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/vendor/contracts/") && url.includes("/comment")) {
        seenRequests.push({ method: req.method(), url });
      }
    });

    await loginAsVendorLike(page);

    await page.screenshot({
      path: "test-results/ade87-after-login.png",
      fullPage: false,
    });

    await navigateToContractWithChanges(page);

    const firstRowMenu = page.getByRole("button", { name: "⋮" }).first();
    await expect(firstRowMenu).toBeVisible({ timeout: 60000 });
    await firstRowMenu.click();

    const viewDetails = page.getByRole("menuitem", { name: /view details/i });
    await expect(viewDetails).toBeVisible({ timeout: 60000 });
    await viewDetails.click();

    const sheet = page.getByTestId("change-details-sheet");
    await expect(sheet).toBeVisible({ timeout: 60000 });

    const commentsTab = page.getByRole("tab", { name: /^comments$/i });
    await expect(commentsTab).toBeVisible({ timeout: 60000 });
    await commentsTab.click();

    await page.waitForTimeout(1500);
    expect(seenRequests.some((r) => r.method === "GET")).toBeTruthy();

    const editor = page.locator(".ql-editor").first();
    await expect(editor).toBeVisible({ timeout: 60000 });
    await editor.click();
    await page.keyboard.type(`ADE-87 automated test ${Date.now()}`);

    const sendBtn = page.getByRole("button", { name: /send question|send response/i });
    await expect(sendBtn).toBeVisible({ timeout: 60000 });

    const postWait = page.waitForRequest((req) => {
      return (
        req.method() === "POST" &&
        req.url().includes("/vendor/contracts/") &&
        req.url().includes("/comment")
      );
    });

    await sendBtn.click();
    await postWait;

    await page.screenshot({
      path: "test-results/ade87-vendor-comments.png",
      fullPage: false,
    });
  });
});
