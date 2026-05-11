import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const LOGIN_EMAIL = "adediran.dbs@gmail.com";
const LOGIN_PASSWORD = "password";

async function loginAsCompanyAdmin(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.getByLabel(/email/i).fill(LOGIN_EMAIL);
  await page.getByLabel(/password/i).fill(LOGIN_PASSWORD);
  await page.getByRole("button", { name: /sign in|log ?in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
}

async function captureErrorToast(page: Page): Promise<string | null> {
  try {
    const toast = await page.getByTestId("toast-error").or(page.getByText("Failed to update contract")).first();
    await expect(toast).toBeVisible({ timeout: 10000 });
    return await toast.textContent();
  } catch {
    return null;
  }
}

test.describe("Edit Contract — Real Auth", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("navigates to a contract detail page as Company Admin", async ({ page }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.stack || err.message));

    await loginAsCompanyAdmin(page);

    // Navigate to Contract Management list
    const contractNavItem = page.getByRole("link", { name: /contract management/i });
    await expect(contractNavItem).toBeVisible({ timeout: 10000 });
    await contractNavItem.click();

    await expect(page).toHaveURL(/\/dashboard\/contract-management$/, { timeout: 30000 });

    // Click on the first contract row
    const firstContractLink = page.locator("a[href*='/dashboard/contract-management/']").first();
    await expect(firstContractLink).toBeVisible({ timeout: 15000 });

    const contractHref = await firstContractLink.getAttribute("href");
    expect(contractHref).toBeTruthy();

    // Extract contract ID from href
    const contractIdMatch = contractHref?.match(/\/contract-management\/([a-zA-Z0-9-]+)/);
    const contractId = contractIdMatch?.[1];
    expect(contractId).toBeTruthy();
    console.log(`Contract ID: ${contractId}`);

    // Click the first contract
    await firstContractLink.click();

    // Wait for detail page to load
    await expect(page).toHaveURL(
      new RegExp(`/dashboard/contract-management/${contractId}$`),
      { timeout: 30000 },
    );

    // Verify the contract detail page loaded
    await expect(page.getByRole("heading")).toBeVisible({ timeout: 15000 });

    expect(errors.join("\n")).toBe("");
  });

  test("opens edit contract modal and captures the PUT payload on error", async ({ page }) => {
    test.setTimeout(120000);
    let contractId: string | null = null;
    let putRequestData: Record<string, unknown> | null = null;
    let putRequestUrl: string | null = null;
    let putResponseData: Record<string, unknown> | null = null;
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.stack || err.message));

    // Track all PUT requests to contract endpoints
    page.on("response", async (response) => {
      const url = response.url();
      if (response.request().method() === "PUT" && url.includes("/contract/manager/contracts/")) {
        putRequestUrl = url;
        try {
          putRequestData = await response.request().postDataJSON();
        } catch {
          putRequestData = { raw: await response.request().postData() };
        }
        try {
          putResponseData = await response.json();
        } catch {
          putResponseData = { rawText: await response.text() };
        }
        console.log("PUT URL:", url);
        console.log("PUT REQUEST DATA:", JSON.stringify(putRequestData, null, 2));
        console.log("PUT RESPONSE DATA:", JSON.stringify(putResponseData, null, 2));
        console.log("PUT RESPONSE STATUS:", response.status());
      }
    });

    await loginAsCompanyAdmin(page);

    // Navigate to Contract Management list
    await page.goto(`${BASE_URL}/dashboard/contract-management`);
    await expect(page).toHaveURL(/\/dashboard\/contract-management$/, { timeout: 30000 });

    // Click on the first contract row
    const firstContractLink = page.locator("a[href*='/dashboard/contract-management/']").first();
    await expect(firstContractLink).toBeVisible({ timeout: 15000 });

    const contractHref = await firstContractLink.getAttribute("href");
    const contractIdMatch = contractHref?.match(/\/contract-management\/([a-zA-Z0-9-]+)/);
    contractId = contractIdMatch?.[1] ?? null;
    expect(contractId).toBeTruthy();

    // Click the first contract
    await firstContractLink.click();
    await expect(page).toHaveURL(
      new RegExp(`/dashboard/contract-management/${contractId}$`),
      { timeout: 30000 },
    );

    // Wait for page to fully load and data to render
    await page.waitForTimeout(2000);

    // Click "Edit Contract" button
    const editContractBtn = page.getByRole("button", { name: /edit contract/i });
    await expect(editContractBtn).toBeVisible({ timeout: 30000 });
    await editContractBtn.click();

    // Wait for edit dialog to appear
    const editDialog = page.getByTestId("edit-contract-sheet");
    await expect(editDialog).toBeVisible({ timeout: 30000 });

    // Take a screenshot of the edit dialog
    await page.screenshot({
      path: "test-results/edit-contract-dialog.png",
      fullPage: false,
    });

    // Click "Save Changes" to trigger the error
    // The form may start on Step 1, we need to navigate to the end or find Save Changes
    // First, check if we're on step 1 of basic info
    await page.waitForTimeout(1000);

    // Try to find and click Continue to navigate through steps
    const continueBtn = page.getByRole("button", { name: /continue/i });
    const saveChangesBtn = page.getByRole("button", { name: /save changes/i });

    // Check which buttons are visible
    const continueVisible = await continueBtn.isVisible().catch(() => false);
    const saveVisible = await saveChangesBtn.isVisible().catch(() => false);

    console.log("Continue button visible:", continueVisible);
    console.log("Save Changes button visible:", saveVisible);

    if (saveVisible) {
      // Click Save Changes directly (if on final step or it's just a Save)
      await saveChangesBtn.click();
    } else if (continueVisible) {
      // Need to navigate through steps - click Continue to get to first validation step
      await continueBtn.click();
      await page.waitForTimeout(2000);

      // Check if we can see Save Changes now
      const saveNowVisible = await saveChangesBtn.isVisible().catch(() => false);
      if (saveNowVisible) {
        await saveChangesBtn.click();
      }
    }

    // Wait for PUT request
    await page.waitForTimeout(15000);

    // Capture error toast if it appears
    const errorToast = await captureErrorToast(page);
    console.log("Error toast:", errorToast);

    // Log findings
    console.log("\n=== EDIT CONTRACT DEBUG FINDINGS ===");
    console.log("Contract ID:", contractId);
    console.log("PUT URL:", putRequestUrl);
    console.log("PUT Status:", putResponseData ? "Response captured" : "No response captured");

    if (putRequestData) {
      console.log("\nPUT REQUEST PAYLOAD (full):");
      console.log(JSON.stringify(putRequestData, null, 2));

      // Check specific fields that commonly cause issues
      if (putRequestData.contractFormationStage) {
        console.log("\ncontractFormationStage present:", true);
        console.log(JSON.stringify(putRequestData.contractFormationStage, null, 2));
      }

      // Check for undefined/null fields that should be omitted
      const undefinedFields = Object.entries(putRequestData)
        .filter(([_, v]) => v === undefined)
        .map(([k]) => k);
      if (undefinedFields.length > 0) {
        console.log("\nUndefined fields in payload (should be deleted):", undefinedFields);
      }

      // Check empty string fields
      const emptyFields = Object.entries(putRequestData)
        .filter(([_, v]) => v === "")
        .map(([k]) => k);
      if (emptyFields.length > 0) {
        console.log("\nEmpty string fields in payload:", emptyFields);
      }
    }

    if (putResponseData) {
      console.log("\nPUT RESPONSE (full):");
      console.log(JSON.stringify(putResponseData, null, 2));
    }

    console.log("========================================");

    expect(errors.join("\n")).toBe("");
  });
});
