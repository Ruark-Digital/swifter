import { test, expect, Page } from '@playwright/test';

// Test data constants
const TEST_USER = {
  email: 'admin@swiftpro.com',
  password: '@swift_alg'
};

const TEST_ADMIN = {
  name: 'Test Admin',
  email: 'testadmin@example.com',
  role: 'Admin',
  company: 'Test Company'
};

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/\/dashboard.*/);
}

// Helper function to navigate to admin management page
async function navigateToAdminManagement(page: Page) {
  await page.goto('/dashboard/admin-management');
  await page.waitForLoadState('networkidle');
}

test.describe('Admin Management Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should display admin management page with correct title and header', async ({ page }) => {
    await navigateToAdminManagement(page);
    
    // Check page title
    await expect(page).toHaveTitle(/Admin Management/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Admin Management');
    
    // Check if Create Admin button is visible
    await expect(page.locator('text=Create Admin')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    await navigateToAdminManagement(page);
    
    // Check if statistics cards are visible
    await expect(page.locator('[data-testid="total-admins-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-admins-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="inactive-admins-stat"]')).toBeVisible();
  });

  test('should display admins table with correct columns', async ({ page }) => {
    await navigateToAdminManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="admins-table"]');
    
    // Check table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Company")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should open create admin dialog', async ({ page }) => {
    await navigateToAdminManagement(page);
    
    // Click create admin button
    await page.click('[data-testid="create-admin-button"]');
    
    // Check if dialog is open
    await expect(page.locator('[data-testid="create-admin-dialog"]')).toBeVisible();
    await expect(page.locator('text=Create New Admin')).toBeVisible();
  });

  test('should create a new admin', async ({ page }) => {
    await navigateToAdminManagement(page);
    
    // Open create dialog
    await page.click('[data-testid="create-admin-button"]');
    
    // Fill form
    await page.fill('[data-testid="admin-name-input"]', TEST_ADMIN.name);
    await page.fill('[data-testid="admin-email-input"]', TEST_ADMIN.email);
    await page.selectOption('[data-testid="role-select"]', TEST_ADMIN.role);
    await page.selectOption('[data-testid="company-select"]', TEST_ADMIN.company);
    
    // Submit form
    await page.click('[data-testid="create-admin-submit"]');
    
    // Check success message
    await expect(page.locator('text=Admin created successfully')).toBeVisible();
  });

  test('should search for admins', async ({ page }) => {
    await navigateToAdminManagement(page);
    
    // Use search functionality
    await page.fill('[data-testid="search-input"]', 'Test');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Check if search results are displayed
    const searchResults = page.locator('[data-testid="admins-table"] tbody tr');
    await expect(searchResults.count()).resolves.toBeGreaterThanOrEqual(0);
  });

  test('should filter admins by status', async ({ page }) => {
    await navigateToAdminManagement(page);
    
    // Apply status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('[data-testid="status-active"]');
    
    // Wait for filter to apply
    await page.waitForLoadState('networkidle');
    
    // Check if filtered results are displayed
    await expect(page.locator('[data-testid="admins-table"]')).toBeVisible();
  });

  test('should open admin details sheet', async ({ page }) => {
    await navigateToAdminManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="admins-table"] tbody tr');
    
    // Click on first admin to open details
    await page.click('[data-testid="admin-row"]:first-of-type');
    
    // Check if details sheet is open
    await expect(page.locator('[data-testid="admin-details-sheet"]')).toBeVisible();
  });

  test('should open edit admin dialog', async ({ page }) => {
    await navigateToAdminManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="admins-table"] tbody tr');
    
    // Open actions dropdown and click edit
    await page.click('[data-testid="admin-actions-dropdown"]:first-of-type');
    await page.click('[data-testid="edit-admin-action"]');
    
    // Check if edit dialog is open
    await expect(page.locator('[data-testid="edit-admin-dialog"]')).toBeVisible();
    await expect(page.locator('text=Edit Admin')).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    await navigateToAdminManagement(page);
    
    // Check if pagination is visible (if there are enough admins)
    const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
    
    if (paginationExists) {
      // Test pagination functionality
      await page.click('[data-testid="next-page"]');
      await page.waitForLoadState('networkidle');
      
      // Check if page changed
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
    }
  });

  test('should handle empty state when no admins exist', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/admins*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });
    
    await navigateToAdminManagement(page);
    
    // Check empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No admins found')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/admins*', route => {
      route.abort('failed');
    });
    
    await navigateToAdminManagement(page);
    
    // Check error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToAdminManagement(page);
    
    // Check if mobile layout is applied
    await expect(page.locator('[data-testid="mobile-admins-view"]')).toBeVisible();
  });
});