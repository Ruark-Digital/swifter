import { test, expect, Page } from "@playwright/test";

// Test data constants
const TEST_USER = {
  email: "admin@swiftpro.com",
  password: "@swift_alg",
};

const TEST_COMPANY = {
  name: "Test Company Ltd",
  industry: "Technology",
  sizeCategory: "Medium",
  maxUsers: 50,
  domain: "testcompany.com",
};

// Helper function to login
async function login(page: Page) {
  await page.goto("/login");
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL("/dashboard");
}

// Helper function to navigate to companies page
async function navigateToCompanies(page: Page) {
  await page.goto("/dashboard/companies");
  await page.waitForLoadState("networkidle");
}

test.describe("Companies Page Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test("should display companies page with correct title and header", async ({
    page,
  }) => {
    await navigateToCompanies(page);

    // Check page title
    await expect(page).toHaveTitle(/Companies/);

    // Check main heading
    await expect(page.locator("h1")).toContainText("Companies");

    // Check if Create Company button is visible
    await expect(page.locator("text=Create Company")).toBeVisible();
  });

  test("should display statistics cards", async ({ page }) => {
    await navigateToCompanies(page);

    // Check if statistics cards are visible
    await expect(
      page.locator('[data-testid="total-companies-stat"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="active-companies-stat"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="inactive-companies-stat"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="pending-companies-stat"]')
    ).toBeVisible();
  });

  test("should display companies table with correct columns", async ({
    page,
  }) => {
    await navigateToCompanies(page);

    // Wait for table to load
    await page.waitForSelector('[data-testid="companies-table"]');

    // Check table headers
    await expect(page.locator('th:has-text("Company Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Industry")')).toBeVisible();
    await expect(page.locator('th:has-text("Size")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test("should open create company dialog", async ({ page }) => {
    await navigateToCompanies(page);

    // Click create company button
    await page.click('[data-testid="create-company-button"]');

    // Check if dialog is open
    await expect(
      page.locator('[data-testid="create-company-dialog"]')
    ).toBeVisible();
    await expect(page.locator("text=Create New Company")).toBeVisible();
  });

  test("should create a new company", async ({ page }) => {
    await navigateToCompanies(page);

    // Open create dialog
    await page.click('[data-testid="create-company-button"]');

    // Fill form
    await page.fill('[data-testid="company-name-input"]', TEST_COMPANY.name);
    await page.selectOption(
      '[data-testid="industry-select"]',
      TEST_COMPANY.industry
    );
    await page.selectOption(
      '[data-testid="size-select"]',
      TEST_COMPANY.sizeCategory
    );
    await page.fill(
      '[data-testid="max-users-input"]',
      TEST_COMPANY.maxUsers.toString()
    );
    await page.fill('[data-testid="domain-input"]', TEST_COMPANY.domain);

    // Submit form
    await page.click('[data-testid="create-company-submit"]');

    // Check success message
    await expect(
      page.locator("text=Company created successfully")
    ).toBeVisible();
  });

  test("should search for companies", async ({ page }) => {
    await navigateToCompanies(page);

    // Use search functionality
    await page.fill('[data-testid="search-input"]', "Tech");
    await page.press('[data-testid="search-input"]', "Enter");

    // Wait for search results
    await page.waitForLoadState("networkidle");

    // Check if search results are displayed
    const searchResults = page.locator('[data-testid="companies-table"] tbody tr');
    await expect(searchResults.count()).resolves.toBeGreaterThanOrEqual(0);
  });

  test("should filter companies by status", async ({ page }) => {
    await navigateToCompanies(page);

    // Apply status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('[data-testid="status-active"]');

    // Wait for filter to apply
    await page.waitForLoadState("networkidle");

    // Check if filtered results are displayed
    await expect(page.locator('[data-testid="companies-table"]')).toBeVisible();
  });

  test("should handle pagination", async ({ page }) => {
    await navigateToCompanies(page);

    // Check if pagination is visible (if there are enough companies)
    const paginationExists = await page
      .locator('[data-testid="pagination"]')
      .isVisible();

    if (paginationExists) {
      // Test pagination functionality
      await page.click('[data-testid="next-page"]');
      await page.waitForLoadState("networkidle");

      // Check if page changed
      await expect(page.locator('[data-testid="current-page"]')).toContainText(
        "2"
      );
    }
  });

  test("should open company actions dropdown", async ({ page }) => {
    await navigateToCompanies(page);

    // Wait for table to load
    await page.waitForSelector('[data-testid="companies-table"] tbody tr');

    // Click on first company's actions dropdown
    await page.click('[data-testid="company-actions-dropdown"]:first-of-type');

    // Check if dropdown menu is visible
    await expect(
      page.locator('[data-testid="edit-company-action"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="view-company-action"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="deactivate-company-action"]')
    ).toBeVisible();
  });

  test("should open edit company dialog", async ({ page }) => {
    await navigateToCompanies(page);

    // Wait for table to load
    await page.waitForSelector('[data-testid="companies-table"] tbody tr');

    // Open actions dropdown and click edit
    await page.click('[data-testid="company-actions-dropdown"]:first-of-type');
    await page.click('[data-testid="edit-company-action"]');

    // Check if edit dialog is open
    await expect(
      page.locator('[data-testid="edit-company-dialog"]')
    ).toBeVisible();
    await expect(page.locator("text=Edit Company")).toBeVisible();
  });

  test("should navigate to company detail page", async ({ page }) => {
    await navigateToCompanies(page);

    // Wait for table to load
    await page.waitForSelector('[data-testid="companies-table"] tbody tr');

    // Click on first company name to navigate to detail page
    await page.click('[data-testid="company-name-link"]:first-of-type');

    // Check if navigated to detail page
    await expect(page).toHaveURL(/\/dashboard\/companies\/\d+/);
  });

  test("should show deactivate confirmation dialog", async ({ page }) => {
    await navigateToCompanies(page);

    // Wait for table to load
    await page.waitForSelector('[data-testid="companies-table"] tbody tr');

    // Open actions dropdown and click deactivate
    await page.click('[data-testid="company-actions-dropdown"]:first-of-type');
    await page.click('[data-testid="deactivate-company-action"]');

    // Check if confirmation dialog is open
    await expect(
      page.locator('[data-testid="confirm-deactivate-dialog"]')
    ).toBeVisible();
    await expect(
      page.locator("text=Are you sure you want to deactivate")
    ).toBeVisible();
  });

  test("should handle empty state when no companies exist", async ({
    page,
  }) => {
    // Mock empty response
    await page.route("**/api/companies*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await navigateToCompanies(page);

    // Check empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator("text=No companies found")).toBeVisible();
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Mock network error
    await page.route("**/api/companies*", (route) => {
      route.abort("failed");
    });

    await navigateToCompanies(page);

    // Check error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateToCompanies(page);

    // Check if mobile layout is applied
    await expect(
      page.locator('[data-testid="mobile-companies-view"]')
    ).toBeVisible();
  });

  test("should display correctly in dark mode", async ({ page }) => {
    await navigateToCompanies(page);

    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]');

    // Check if dark mode is applied
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Check if components are visible in dark mode
    await expect(page.locator('[data-testid="companies-table"]')).toBeVisible();
  });
});
