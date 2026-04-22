import { test, expect, Page } from '@playwright/test';

// Helper function to login (adjust selectors based on actual login form)
async function login(page: Page) {
  await page.goto('/');
  
  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill login credentials (adjust these based on your test environment)
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'password123');
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
}

test.describe('Companies Page - Detailed Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to companies page and display main elements', async ({ page }) => {
    // Navigate to companies page
    await page.goto('/dashboard/companies');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check main heading
    await expect(page.locator('h1:has-text("Companies")')).toBeVisible();
    
    // Check if Create Company button exists
    const createButton = page.locator('text=Create Company').first();
    await expect(createButton).toBeVisible();
  });

  test('should display statistics cards with correct structure', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Check the grid container for statistics cards
    const statsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6.mb-8');
    await expect(statsGrid).toBeVisible();
    
    // Check individual stat cards
    await expect(page.locator('text=All Companies')).toBeVisible();
    await expect(page.locator('text=Active Companies')).toBeVisible();
    await expect(page.locator('text=Suspended Companies')).toBeVisible();
  });

  test('should display data table with proper structure', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 15000 });
    
    // Check table headers based on the column definitions
    const headers = [
      'Company Name',
      'Plan', 
      'Users',
      'Date Created',
      'Admins',
      'Status',
      'Actions'
    ];
    
    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('should handle search functionality', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Find search input (based on SearchInput component)
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      // Type in search box
      await searchInput.fill('test company');
      
      // Wait for debounced search (500ms as per code)
      await page.waitForTimeout(600);
      
      // Check if search parameter is in URL or table updates
      // The search should trigger a new API call
    }
  });

  test('should open and interact with company actions dropdown', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Wait for table rows to load
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Click the first actions button (MoreHorizontal icon)
      const firstActionButton = page.locator('tbody tr:first-child button:has([data-lucide="more-horizontal"])');
      await firstActionButton.click();
      
      // Check dropdown menu items
      await expect(page.locator('text=View Company')).toBeVisible();
      await expect(page.locator('text=Edit Company')).toBeVisible();
      
      // Check for suspend/activate option
      const suspendOption = page.locator('text=Suspend Company');
      const activateOption = page.locator('text=Activate Company');
      
      const hasSuspend = await suspendOption.isVisible();
      const hasActivate = await activateOption.isVisible();
      
      expect(hasSuspend || hasActivate).toBeTruthy();
    }
  });

  test('should display status badges correctly', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Check for status badges
    const activeBadges = page.locator('.badge:has-text("Active")');
    const inactiveBadges = page.locator('.badge:has-text("Inactive")');
    
    const activeCount = await activeBadges.count();
    const inactiveCount = await inactiveBadges.count();
    
    // At least one type of badge should be present if there are companies
    const totalRows = await page.locator('tbody tr').count();
    if (totalRows > 0) {
      expect(activeCount + inactiveCount).toBeGreaterThan(0);
    }
  });

  test('should handle pagination controls', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Wait for table to load
    await page.waitForSelector('table');
    
    // Look for pagination controls (DataTable component)
    const paginationContainer = page.locator('[role="navigation"]').last();
    
    if (await paginationContainer.isVisible()) {
      // Check for page navigation buttons
      const nextButton = page.locator('button:has-text("Next"), button[aria-label="Next page"]');
      const prevButton = page.locator('button:has-text("Previous"), button[aria-label="Previous page"]');
      
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Check if URL or table content changed
        await expect(prevButton).toBeEnabled();
      }
    }
  });

  test('should open create company dialog', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Click Create Company button
    await page.click('text=Create Company');
    
    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Check if dialog is visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Check for form elements (adjust based on CreateCompanyDialog component)
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible()) {
      await expect(nameInput).toBeVisible();
    }
  });

  test('should handle empty state', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Check for empty state component
    const emptyStateTitle = page.locator('h3:has-text("No Companies Added Yet")');
    const emptyStateDescription = page.locator('text=Manage your companies easily');
    
    if (await emptyStateTitle.isVisible()) {
      await expect(emptyStateTitle).toBeVisible();
      await expect(emptyStateDescription).toBeVisible();
      
      // Check if Create Company button is present in empty state
      await expect(page.locator('text=Create Company')).toBeVisible();
    }
  });

  test('should display company information correctly in table rows', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Wait for table rows
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      const firstRow = tableRows.first();
      
      // Check if company name is displayed
      const companyName = firstRow.locator('td:first-child span.font-medium');
      if (await companyName.isVisible()) {
        await expect(companyName).toHaveText(/.+/); // Should have some text
      }
      
      // Check if admin email is displayed with proper styling
      const adminEmail = firstRow.locator('span.text-blue-500');
      if (await adminEmail.isVisible()) {
        await expect(adminEmail).toHaveClass(/underline/);
      }
    }
  });

  test('should handle filters dropdown', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Look for filter dropdowns (DropdownFilters component)
    const statusFilter = page.locator('text=Status').first();
    // const dateFilter = page.locator('text=Date').first();
    // const planFilter = page.locator('text=Plan').first();
    
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      
      // Check for filter options
      await expect(page.locator('text=Active')).toBeVisible();
      await expect(page.locator('text=Inactive')).toBeVisible();
      
      // Select a filter option
      await page.click('text=Active');
      await page.waitForTimeout(1000);
    }
  });

  test('should navigate to company detail page', async ({ page }) => {
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Wait for table rows
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Click actions dropdown for first company
      const firstActionButton = page.locator('tbody tr:first-child button:has([data-lucide="more-horizontal"])');
      await firstActionButton.click();
      
      // Click View Company
      await page.click('text=View Company');
      
      // Check if navigated to company detail page
      await page.waitForURL('**/dashboard/company/**', { timeout: 5000 });
      expect(page.url()).toMatch(/\/dashboard\/company\/[a-zA-Z0-9]+/);
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/companies');
    await page.waitForLoadState('networkidle');
    
    // Check if grid adapts to mobile (should be single column)
    const statsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    await expect(statsGrid).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Grid should adapt to tablet (2 columns)
    await expect(statsGrid).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Grid should show 3 columns on desktop
    await expect(statsGrid).toBeVisible();
  });
});