import { Page, expect } from '@playwright/test';

// Test configuration
export const TEST_CONFIG = {
  baseURL: 'http://localhost:5173',
  timeout: 10000,
  credentials: {
    admin: {
      email: 'admin@test.com',
      password: 'password123'
    },
    user: {
      email: 'user@test.com', 
      password: 'password123'
    }
  }
};

// Mock company data
export const MOCK_COMPANIES = {
  active: {
    name: 'Active Test Company',
    industry: 'Technology',
    sizeCategory: 'Medium',
    maxUsers: 100,
    domain: 'activetest.com',
    status: 'active'
  },
  inactive: {
    name: 'Inactive Test Company',
    industry: 'Finance',
    sizeCategory: 'Large',
    maxUsers: 200,
    domain: 'inactivetest.com',
    status: 'inactive'
  }
};

/**
 * Login helper function
 * @param page - Playwright page object
 * @param userType - Type of user to login as ('admin' | 'user')
 */
export async function loginAs(page: Page, userType: 'admin' | 'user' = 'admin') {
  const credentials = TEST_CONFIG.credentials[userType];
  
  await page.goto('/');
  
  // Wait for login form
  await page.waitForSelector('input[type="email"]', { timeout: TEST_CONFIG.timeout });
  
  // Fill credentials
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForURL('**/dashboard**', { timeout: TEST_CONFIG.timeout });
}

/**
 * Navigate to companies page
 * @param page - Playwright page object
 */
export async function navigateToCompanies(page: Page) {
  await page.goto('/dashboard/companies');
  await page.waitForLoadState('networkidle');
  
  // Wait for main heading to ensure page is loaded
  await page.waitForSelector('h1:has-text("Companies")', { timeout: TEST_CONFIG.timeout });
}

/**
 * Wait for table to load with data
 * @param page - Playwright page object
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForTableLoad(page: Page, timeout = TEST_CONFIG.timeout) {
  await page.waitForSelector('table', { timeout });
  
  // Wait a bit more for data to load
  await page.waitForTimeout(1000);
}

/**
 * Get table row count
 * @param page - Playwright page object
 * @returns Number of table rows
 */
export async function getTableRowCount(page: Page): Promise<number> {
  await waitForTableLoad(page);
  return await page.locator('tbody tr').count();
}

/**
 * Check if element exists and is visible
 * @param page - Playwright page object
 * @param selector - CSS selector
 * @returns Boolean indicating if element is visible
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible();
  } catch {
    return false;
  }
}

/**
 * Fill form field if it exists
 * @param page - Playwright page object
 * @param selector - CSS selector for the input
 * @param value - Value to fill
 */
export async function fillIfExists(page: Page, selector: string, value: string) {
  if (await isElementVisible(page, selector)) {
    await page.fill(selector, value);
  }
}

/**
 * Click element if it exists and is visible
 * @param page - Playwright page object
 * @param selector - CSS selector
 */
export async function clickIfExists(page: Page, selector: string) {
  if (await isElementVisible(page, selector)) {
    await page.click(selector);
  }
}

/**
 * Wait for API response
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to wait for
 * @param timeout - Optional timeout
 */
export async function waitForAPIResponse(page: Page, urlPattern: string, timeout = TEST_CONFIG.timeout) {
  return await page.waitForResponse(
    response => response.url().includes(urlPattern) && response.status() === 200,
    { timeout }
  );
}

/**
 * Mock API response
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to mock
 * @param responseData - Mock response data
 */
export async function mockAPIResponse(page: Page, urlPattern: string, responseData: any) {
  await page.route(`**/${urlPattern}**`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseData)
    });
  });
}

/**
 * Take screenshot with timestamp
 * @param page - Playwright page object
 * @param name - Screenshot name
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `tests/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Check for console errors
 * @param page - Playwright page object
 */
export function setupConsoleErrorTracking(page: Page) {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Verify no console errors occurred
 * @param errors - Array of console errors
 */
export function verifyNoConsoleErrors(errors: string[]) {
  if (errors.length > 0) {
    console.warn('Console errors detected:', errors);
  }
  expect(errors.length).toBe(0);
}

/**
 * Set viewport for different device types
 * @param page - Playwright page object
 * @param device - Device type
 */
export async function setDeviceViewport(page: Page, device: 'mobile' | 'tablet' | 'desktop') {
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 }
  };
  
  await page.setViewportSize(viewports[device]);
}

/**
 * Wait for loading state to complete
 * @param page - Playwright page object
 */
export async function waitForLoadingComplete(page: Page) {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Wait for any loading spinners to disappear
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, .spinner');
    return loadingElements.length === 0;
  }, { timeout: 5000 }).catch(() => {
    // Ignore timeout - loading indicators might not exist
  });
}

/**
 * Verify table data integrity
 * @param page - Playwright page object
 * @param expectedColumns - Array of expected column headers
 */
export async function verifyTableStructure(page: Page, expectedColumns: string[]) {
  await waitForTableLoad(page);
  
  for (const column of expectedColumns) {
    await expect(page.locator(`th:has-text("${column}")`)).toBeVisible();
  }
}

/**
 * Search and verify results
 * @param page - Playwright page object
 * @param searchTerm - Term to search for
 * @param expectedResults - Expected number of results (optional)
 */
export async function performSearch(page: Page, searchTerm: string, expectedResults?: number) {
  const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
  
  if (await searchInput.isVisible()) {
    await searchInput.fill(searchTerm);
    
    // Wait for debounced search
    await page.waitForTimeout(600);
    
    if (expectedResults !== undefined) {
      const rowCount = await getTableRowCount(page);
      expect(rowCount).toBe(expectedResults);
    }
  }
}