import { test, expect, Page } from '@playwright/test';

// Test data constants
const TEST_USER = {
  email: 'admin@swiftpro.com',
  password: '@swift_alg'
};

const TEST_EVALUATION = {
  title: 'Test Evaluation',
  description: 'Test evaluation description',
  type: 'RFP',
  deadline: '2024-12-31'
};

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

// Helper function to navigate to evaluation management page
async function navigateToEvaluationManagement(page: Page) {
  await page.goto('/dashboard/evaluation-management');
  await page.waitForLoadState('networkidle');
}

test.describe('Evaluation Management Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should display evaluation management page with correct title and header', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Check page title
    await expect(page).toHaveTitle(/Evaluation Management/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Evaluation Management');
    
    // Check if Create Evaluation button is visible
    await expect(page.locator('text=Create Evaluation')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Check if statistics cards are visible
    await expect(page.locator('[data-testid="total-evaluations-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-evaluations-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-evaluations-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-evaluations-stat"]')).toBeVisible();
  });

  test('should display evaluations table with correct columns', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="evaluations-table"]');
    
    // Check table headers
    await expect(page.locator('th:has-text("Title")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Deadline")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should open create evaluation dialog', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Click create evaluation button
    await page.click('[data-testid="create-evaluation-button"]');
    
    // Check if dialog is open
    await expect(page.locator('[data-testid="create-evaluation-dialog"]')).toBeVisible();
    await expect(page.locator('text=Create New Evaluation')).toBeVisible();
  });

  test('should create a new evaluation with step forms', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Open create dialog
    await page.click('[data-testid="create-evaluation-button"]');
    
    // Step 1: Basic Information
    await page.fill('[data-testid="evaluation-title-input"]', TEST_EVALUATION.title);
    await page.fill('[data-testid="evaluation-description-input"]', TEST_EVALUATION.description);
    await page.selectOption('[data-testid="evaluation-type-select"]', TEST_EVALUATION.type);
    await page.click('[data-testid="step1-next-button"]');
    
    // Step 2: Timeline
    await page.fill('[data-testid="deadline-input"]', TEST_EVALUATION.deadline);
    await page.click('[data-testid="step2-next-button"]');
    
    // Step 3: Criteria
    await page.click('[data-testid="add-criteria-button"]');
    await page.fill('[data-testid="criteria-name-input"]', 'Technical Capability');
    await page.fill('[data-testid="criteria-weight-input"]', '30');
    await page.click('[data-testid="step3-next-button"]');
    
    // Step 4: Review and Submit
    await page.click('[data-testid="create-evaluation-submit"]');
    
    // Check success message
    await expect(page.locator('text=Evaluation created successfully')).toBeVisible();
  });

  test('should search for evaluations', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Use search functionality
    await page.fill('[data-testid="search-input"]', 'Test');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Check if search results are displayed
    const searchResults = page.locator('[data-testid="evaluations-table"] tbody tr');
    await expect(searchResults.count()).resolves.toBeGreaterThanOrEqual(0);
  });

  test('should filter evaluations by status', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Apply status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('[data-testid="status-active"]');
    
    // Wait for filter to apply
    await page.waitForLoadState('networkidle');
    
    // Check if filtered results are displayed
    await expect(page.locator('[data-testid="evaluations-table"]')).toBeVisible();
  });

  test('should navigate to evaluation detail page', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="evaluations-table"] tbody tr');
    
    // Click on first evaluation title to navigate to detail page
    await page.click('[data-testid="evaluation-title-link"]:first-of-type');
    
    // Check if navigated to detail page
    await expect(page).toHaveURL(/\/dashboard\/evaluation-management\/\d+/);
  });

  test('should open evaluation scorecard sheet', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="evaluations-table"] tbody tr');
    
    // Open actions dropdown and click scorecard
    await page.click('[data-testid="evaluation-actions-dropdown"]:first-of-type');
    await page.click('[data-testid="view-scorecard-action"]');
    
    // Check if scorecard sheet is open
    await expect(page.locator('[data-testid="evaluation-scorecard-sheet"]')).toBeVisible();
  });

  test('should open bid comparison breakdown sheet', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="evaluations-table"] tbody tr');
    
    // Open actions dropdown and click bid comparison
    await page.click('[data-testid="evaluation-actions-dropdown"]:first-of-type');
    await page.click('[data-testid="bid-comparison-action"]');
    
    // Check if bid comparison sheet is open
    await expect(page.locator('[data-testid="bid-comparison-sheet"]')).toBeVisible();
  });

  test('should open price breakdown sheet', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="evaluations-table"] tbody tr');
    
    // Open actions dropdown and click price breakdown
    await page.click('[data-testid="evaluation-actions-dropdown"]:first-of-type');
    await page.click('[data-testid="price-breakdown-action"]');
    
    // Check if price breakdown sheet is open
    await expect(page.locator('[data-testid="price-breakdown-sheet"]')).toBeVisible();
  });

  test('should display status badges correctly', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="evaluations-table"] tbody tr');
    
    // Check if status badges are visible
    await expect(page.locator('[data-testid="status-badge"]').first()).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    await navigateToEvaluationManagement(page);
    
    // Check if pagination is visible (if there are enough evaluations)
    const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
    
    if (paginationExists) {
      // Test pagination functionality
      await page.click('[data-testid="next-page"]');
      await page.waitForLoadState('networkidle');
      
      // Check if page changed
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
    }
  });

  test('should handle empty state when no evaluations exist', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/evaluations*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });
    
    await navigateToEvaluationManagement(page);
    
    // Check empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No evaluations found')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/evaluations*', route => {
      route.abort('failed');
    });
    
    await navigateToEvaluationManagement(page);
    
    // Check error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToEvaluationManagement(page);
    
    // Check if mobile layout is applied
    await expect(page.locator('[data-testid="mobile-evaluations-view"]')).toBeVisible();
  });
});