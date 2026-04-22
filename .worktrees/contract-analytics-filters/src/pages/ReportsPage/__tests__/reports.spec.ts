import { test, expect, Page } from '@playwright/test';

// Test data constants
const TEST_USER = {
  email: 'admin@swiftpro.com',
  password: '@swift_alg'
};

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

// Helper function to navigate to reports page
async function navigateToReports(page: Page) {
  await page.goto('/dashboard/reports');
  await page.waitForLoadState('networkidle');
}

test.describe('Reports Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should display reports page with correct title and header', async ({ page }) => {
    await navigateToReports(page);
    
    // Check page title
    await expect(page).toHaveTitle(/Reports/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Reports & Analytics');
    
    // Check if Generate Report button is visible
    await expect(page.locator('text=Generate Report')).toBeVisible();
  });

  test('should display report categories', async ({ page }) => {
    await navigateToReports(page);
    
    // Check if report category cards are visible
    await expect(page.locator('[data-testid="procurement-reports-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-reports-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="financial-reports-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-reports-card"]')).toBeVisible();
  });

  test('should display dashboard overview with key metrics', async ({ page }) => {
    await navigateToReports(page);
    
    // Check if key metrics are visible
    await expect(page.locator('[data-testid="total-spend-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="cost-savings-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-contracts-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-count-metric"]')).toBeVisible();
  });

  test('should display charts and visualizations', async ({ page }) => {
    await navigateToReports(page);
    
    // Check if charts are visible
    await expect(page.locator('[data-testid="spend-trend-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-breakdown-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-performance-chart"]')).toBeVisible();
  });

  test('should open generate report dialog', async ({ page }) => {
    await navigateToReports(page);
    
    // Click generate report button
    await page.click('[data-testid="generate-report-button"]');
    
    // Check if dialog is open
    await expect(page.locator('[data-testid="generate-report-dialog"]')).toBeVisible();
    await expect(page.locator('text=Generate Custom Report')).toBeVisible();
  });

  test('should generate procurement report', async ({ page }) => {
    await navigateToReports(page);
    
    // Open generate report dialog
    await page.click('[data-testid="generate-report-button"]');
    
    // Select report type
    await page.selectOption('[data-testid="report-type-select"]', 'procurement');
    
    // Set date range
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    
    // Select format
    await page.selectOption('[data-testid="report-format-select"]', 'pdf');
    
    // Generate report
    await page.click('[data-testid="generate-report-submit"]');
    
    // Check success message
    await expect(page.locator('text=Report generated successfully')).toBeVisible();
  });

  test('should generate vendor performance report', async ({ page }) => {
    await navigateToReports(page);
    
    // Click on vendor reports card
    await page.click('[data-testid="vendor-reports-card"]');
    
    // Select vendor performance report
    await page.click('[data-testid="vendor-performance-report"]');
    
    // Configure report parameters
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    
    // Generate report
    await page.click('[data-testid="generate-report-submit"]');
    
    // Check success message
    await expect(page.locator('text=Vendor performance report generated')).toBeVisible();
  });

  test('should generate financial summary report', async ({ page }) => {
    await navigateToReports(page);
    
    // Click on financial reports card
    await page.click('[data-testid="financial-reports-card"]');
    
    // Select financial summary report
    await page.click('[data-testid="financial-summary-report"]');
    
    // Configure report parameters
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    
    // Select departments
    await page.click('[data-testid="department-filter"]');
    await page.click('[data-testid="department-all"]');
    
    // Generate report
    await page.click('[data-testid="generate-report-submit"]');
    
    // Check success message
    await expect(page.locator('text=Financial report generated')).toBeVisible();
  });

  test('should filter reports by date range', async ({ page }) => {
    await navigateToReports(page);
    
    // Apply date range filter
    await page.fill('[data-testid="date-range-start"]', '2024-01-01');
    await page.fill('[data-testid="date-range-end"]', '2024-06-30');
    await page.click('[data-testid="apply-date-filter"]');
    
    // Wait for data to update
    await page.waitForLoadState('networkidle');
    
    // Check if charts are updated
    await expect(page.locator('[data-testid="spend-trend-chart"]')).toBeVisible();
  });

  test('should filter reports by department', async ({ page }) => {
    await navigateToReports(page);
    
    // Apply department filter
    await page.click('[data-testid="department-filter"]');
    await page.click('[data-testid="department-it"]');
    
    // Wait for data to update
    await page.waitForLoadState('networkidle');
    
    // Check if data is filtered
    await expect(page.locator('[data-testid="filtered-data-indicator"]')).toBeVisible();
  });

  test('should export chart as image', async ({ page }) => {
    await navigateToReports(page);
    
    // Hover over chart to show export options
    await page.hover('[data-testid="spend-trend-chart"]');
    
    // Click export button
    await page.click('[data-testid="export-chart-button"]');
    
    // Select export format
    await page.click('[data-testid="export-png"]');
    
    // Check download initiated
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export"]');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.png');
  });

  test('should view recent reports list', async ({ page }) => {
    await navigateToReports(page);
    
    // Check if recent reports section is visible
    await expect(page.locator('[data-testid="recent-reports-section"]')).toBeVisible();
    await expect(page.locator('text=Recent Reports')).toBeVisible();
    
    // Check if reports list is displayed
    await expect(page.locator('[data-testid="recent-reports-list"]')).toBeVisible();
  });

  test('should download existing report', async ({ page }) => {
    await navigateToReports(page);
    
    // Wait for recent reports to load
    await page.waitForSelector('[data-testid="recent-reports-list"] [data-testid="report-item"]');
    
    // Click download button for first report
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-report-button"]:first-of-type');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('should delete existing report', async ({ page }) => {
    await navigateToReports(page);
    
    // Wait for recent reports to load
    await page.waitForSelector('[data-testid="recent-reports-list"] [data-testid="report-item"]');
    
    // Click delete button for first report
    await page.click('[data-testid="delete-report-button"]:first-of-type');
    
    // Confirm deletion
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Check success message
    await expect(page.locator('text=Report deleted successfully')).toBeVisible();
  });

  test('should schedule automated report', async ({ page }) => {
    await navigateToReports(page);
    
    // Click schedule report button
    await page.click('[data-testid="schedule-report-button"]');
    
    // Check if schedule dialog is open
    await expect(page.locator('[data-testid="schedule-report-dialog"]')).toBeVisible();
    
    // Configure schedule
    await page.selectOption('[data-testid="report-type-select"]', 'procurement');
    await page.selectOption('[data-testid="frequency-select"]', 'weekly');
    await page.fill('[data-testid="recipient-email"]', 'admin@swiftpro.com');
    
    // Save schedule
    await page.click('[data-testid="save-schedule-button"]');
    
    // Check success message
    await expect(page.locator('text=Report scheduled successfully')).toBeVisible();
  });

  test('should display data comparison view', async ({ page }) => {
    await navigateToReports(page);
    
    // Click comparison view button
    await page.click('[data-testid="comparison-view-button"]');
    
    // Check if comparison view is displayed
    await expect(page.locator('[data-testid="comparison-view"]')).toBeVisible();
    
    // Select comparison periods
    await page.selectOption('[data-testid="period-1-select"]', 'Q1-2024');
    await page.selectOption('[data-testid="period-2-select"]', 'Q2-2024');
    
    // Apply comparison
    await page.click('[data-testid="apply-comparison"]');
    
    // Check if comparison chart is displayed
    await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible();
  });

  test('should handle empty state when no data available', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/reports/data*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], metrics: {} })
      });
    });
    
    await navigateToReports(page);
    
    // Check empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No data available')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/reports*', route => {
      route.abort('failed');
    });
    
    await navigateToReports(page);
    
    // Check error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToReports(page);
    
    // Check if mobile layout is applied
    await expect(page.locator('[data-testid="mobile-reports-view"]')).toBeVisible();
    
    // Check if charts are responsive
    await expect(page.locator('[data-testid="responsive-chart-container"]')).toBeVisible();
  });

  test('should display correctly in dark mode', async ({ page }) => {
    await navigateToReports(page);
    
    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]');
    
    // Check if dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Check if charts are visible in dark mode
    await expect(page.locator('[data-testid="spend-trend-chart"]')).toBeVisible();
  });

  test('should validate report generation form', async ({ page }) => {
    await navigateToReports(page);
    
    // Open generate report dialog
    await page.click('[data-testid="generate-report-button"]');
    
    // Try to submit without required fields
    await page.click('[data-testid="generate-report-submit"]');
    
    // Check validation errors
    await expect(page.locator('[data-testid="report-type-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="date-range-error"]')).toBeVisible();
  });
});