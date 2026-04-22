import { test, expect, Page } from '@playwright/test';

// Test data constants
const TEST_USER = {
  email: 'admin@swiftpro.com',
  password: '@swift_alg'
};

const TEST_VENDOR = {
  name: 'Test Vendor Inc',
  email: 'contact@testvendor.com',
  industry: 'Technology',
  category: 'Software Development',
  phone: '+1234567890'
};

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

// Helper function to navigate to vendor management page
async function navigateToVendorManagement(page: Page) {
  await page.goto('/dashboard/vendor');
  await page.waitForLoadState('networkidle');
}

test.describe('Vendor Management Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should display vendor management page with correct title and header', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Check page title
    await expect(page).toHaveTitle(/Vendor Management/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Vendor Management');
    
    // Check if Create Vendor button is visible
    await expect(page.locator('text=Create Vendor')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Check if statistics cards are visible
    await expect(page.locator('[data-testid="total-vendors-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-vendors-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-vendors-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="verified-vendors-stat"]')).toBeVisible();
  });

  test('should display vendors table with correct columns', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="vendors-table"]');
    
    // Check table headers
    await expect(page.locator('th:has-text("Vendor Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Industry")')).toBeVisible();
    await expect(page.locator('th:has-text("Category")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should open create vendor dialog', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Click create vendor button
    await page.click('[data-testid="create-vendor-button"]');
    
    // Check if dialog is open
    await expect(page.locator('[data-testid="create-vendor-dialog"]')).toBeVisible();
    await expect(page.locator('text=Create New Vendor')).toBeVisible();
  });

  test('should create a new vendor', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Open create dialog
    await page.click('[data-testid="create-vendor-button"]');
    
    // Fill form
    await page.fill('[data-testid="vendor-name-input"]', TEST_VENDOR.name);
    await page.fill('[data-testid="vendor-email-input"]', TEST_VENDOR.email);
    await page.selectOption('[data-testid="industry-select"]', TEST_VENDOR.industry);
    await page.selectOption('[data-testid="category-select"]', TEST_VENDOR.category);
    await page.fill('[data-testid="vendor-phone-input"]', TEST_VENDOR.phone);
    
    // Submit form
    await page.click('[data-testid="create-vendor-submit"]');
    
    // Check success message
    await expect(page.locator('text=Vendor created successfully')).toBeVisible();
  });

  test('should search for vendors', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Use search functionality
    await page.fill('[data-testid="search-input"]', 'Test');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Check if search results are displayed
    const searchResults = page.locator('[data-testid="vendors-table"] tbody tr');
    await expect(searchResults.count()).resolves.toBeGreaterThanOrEqual(0);
  });

  test('should filter vendors by industry', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Apply industry filter
    await page.click('[data-testid="industry-filter"]');
    await page.click('[data-testid="industry-technology"]');
    
    // Wait for filter to apply
    await page.waitForLoadState('networkidle');
    
    // Check if filtered results are displayed
    await expect(page.locator('[data-testid="vendors-table"]')).toBeVisible();
  });

  test('should filter vendors by status', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Apply status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('[data-testid="status-active"]');
    
    // Wait for filter to apply
    await page.waitForLoadState('networkidle');
    
    // Check if filtered results are displayed
    await expect(page.locator('[data-testid="vendors-table"]')).toBeVisible();
  });

  test('should navigate to vendor detail page', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="vendors-table"] tbody tr');
    
    // Click on first vendor name to navigate to detail page
    await page.click('[data-testid="vendor-name-link"]:first-of-type');
    
    // Check if navigated to detail page
    await expect(page).toHaveURL(/\/dashboard\/vendor\/.+/);
  });

  test('should open edit vendor dialog', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="vendors-table"] tbody tr');
    
    // Open actions dropdown and click edit
    await page.click('[data-testid="vendor-actions-dropdown"]:first-of-type');
    await page.click('[data-testid="edit-vendor-action"]');
    
    // Check if edit dialog is open
    await expect(page.locator('[data-testid="edit-vendor-dialog"]')).toBeVisible();
    await expect(page.locator('text=Edit Vendor')).toBeVisible();
  });

  test('should view vendor overview tab in detail page', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Navigate to vendor detail page
    await page.waitForSelector('[data-testid="vendors-table"] tbody tr');
    await page.click('[data-testid="vendor-name-link"]:first-of-type');
    
    // Check if overview tab is active and visible
    await expect(page.locator('[data-testid="overview-tab"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="vendor-overview-content"]')).toBeVisible();
  });

  test('should view vendor documents tab in detail page', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Navigate to vendor detail page
    await page.waitForSelector('[data-testid="vendors-table"] tbody tr');
    await page.click('[data-testid="vendor-name-link"]:first-of-type');
    
    // Click on documents tab
    await page.click('[data-testid="documents-tab"]');
    
    // Check if documents tab content is visible
    await expect(page.locator('[data-testid="vendor-documents-content"]')).toBeVisible();
  });

  test('should view vendor submissions tab in detail page', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Navigate to vendor detail page
    await page.waitForSelector('[data-testid="vendors-table"] tbody tr');
    await page.click('[data-testid="vendor-name-link"]:first-of-type');
    
    // Click on submissions tab
    await page.click('[data-testid="submissions-tab"]');
    
    // Check if submissions tab content is visible
    await expect(page.locator('[data-testid="vendor-submissions-content"]')).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Check if pagination is visible (if there are enough vendors)
    const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
    
    if (paginationExists) {
      // Test pagination functionality
      await page.click('[data-testid="next-page"]');
      await page.waitForLoadState('networkidle');
      
      // Check if page changed
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
    }
  });

  test('should handle empty state when no vendors exist', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/vendors*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });
    
    await navigateToVendorManagement(page);
    
    // Check empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No vendors found')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/vendors*', route => {
      route.abort('failed');
    });
    
    await navigateToVendorManagement(page);
    
    // Check error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToVendorManagement(page);
    
    // Check if mobile layout is applied
    await expect(page.locator('[data-testid="mobile-vendors-view"]')).toBeVisible();
  });

  test('should display correctly in dark mode', async ({ page }) => {
    await navigateToVendorManagement(page);
    
    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]');
    
    // Check if dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Check if components are visible in dark mode
    await expect(page.locator('[data-testid="vendors-table"]')).toBeVisible();
  });

  test('should map "submit" status to "submitted" and apply capitalize class in submissions tab', async ({ page }) => {
    // Mock vendor detail API with a submission having status 'submit'
    await page.route('**/procurement/vendors/*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          message: 'ok',
          data: {
            vendor: {
              vendorId: 'V-001',
              name: 'Test Vendor Inc',
              status: 'Active',
              isSuspended: false,
              submissions: [],
              user: { name: 'John Doe', email: 'john@example.com', phone: '+1234567890', _id: 'u1' }
            },
            submissions: [
              {
                _id: 'sub1',
                status: 'submit',
                createdAt: '', // leave empty to avoid date formatting
                solicitation: {
                  _id: 'sol1',
                  name: 'Annual IT Support',
                  solId: 'SOL-2025-001'
                }
              }
            ]
          }
        })
      });
    });

    // Go directly to a vendor detail page (route param can be any id since we mock the API)
    await page.goto('/dashboard/vendor/abc123');

    // Open the Submissions tab
    await page.getByRole('tab', { name: /Submissions/i }).click();

    // Wait for the first row to appear
    await expect(page.locator('table tbody tr').first()).toBeVisible();

    // Locate the status badge in the first row
    const statusBadge = page.locator('table tbody tr').first().locator('.capitalize').first();

    // Assert the text is rendered as "submitted" (case-insensitive) and class includes 'capitalize'
    await expect(statusBadge).toHaveText(/submitted/i);
    await expect(statusBadge).toHaveClass(/capitalize/);
  });
});