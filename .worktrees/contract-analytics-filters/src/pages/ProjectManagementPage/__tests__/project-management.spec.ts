import { test, expect, Page } from '@playwright/test';

// Test data constants
const TEST_USER = {
  email: 'admin@swiftpro.com',
  password: '@swift_alg'
};

const TEST_PROJECT = {
  name: 'Test Project Alpha',
  description: 'A comprehensive test project for validation',
  category: 'Software Development',
  budget: '100000',
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

// Helper function to navigate to project management page
async function navigateToProjectManagement(page: Page) {
  await page.goto('/dashboard/project-management');
  await page.waitForLoadState('networkidle');
}

test.describe('Project Management Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should display project management page with correct title and header', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Check page title
    await expect(page).toHaveTitle(/Project Management/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Project Management');
    
    // Check if Create Project button is visible
    await expect(page.locator('text=Create Project')).toBeVisible();
  });

  test('should display project statistics cards', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Check if statistics cards are visible
    await expect(page.locator('[data-testid="total-projects-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-projects-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-projects-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="overdue-projects-stat"]')).toBeVisible();
  });

  test('should display projects table with correct columns', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="projects-table"]');
    
    // Check table headers
    await expect(page.locator('th:has-text("Project Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Category")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Budget")')).toBeVisible();
    await expect(page.locator('th:has-text("Deadline")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should open create project dialog', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Click create project button
    await page.click('[data-testid="create-project-button"]');
    
    // Check if dialog is open
    await expect(page.locator('[data-testid="create-project-dialog"]')).toBeVisible();
    await expect(page.locator('text=Create New Project')).toBeVisible();
  });

  test('should create a new project with step form', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Open create dialog
    await page.click('[data-testid="create-project-button"]');
    
    // Step 1: Basic Information
    await page.fill('[data-testid="project-name-input"]', TEST_PROJECT.name);
    await page.fill('[data-testid="project-description-input"]', TEST_PROJECT.description);
    await page.selectOption('[data-testid="category-select"]', TEST_PROJECT.category);
    await page.click('[data-testid="next-step-button"]');
    
    // Step 2: Budget and Timeline
    await page.fill('[data-testid="budget-input"]', TEST_PROJECT.budget);
    await page.fill('[data-testid="deadline-input"]', TEST_PROJECT.deadline);
    await page.click('[data-testid="next-step-button"]');
    
    // Step 3: Review and Submit
    await expect(page.locator('[data-testid="review-project-name"]')).toContainText(TEST_PROJECT.name);
    await page.click('[data-testid="create-project-submit"]');
    
    // Check success message
    await expect(page.locator('text=Project created successfully')).toBeVisible();
  });

  test('should search for projects', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Use search functionality
    await page.fill('[data-testid="search-input"]', 'Alpha');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Check if search results are displayed
    const searchResults = page.locator('[data-testid="projects-table"] tbody tr');
    await expect(searchResults.count()).resolves.toBeGreaterThanOrEqual(0);
  });

  test('should filter projects by status', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Apply status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('[data-testid="status-active"]');
    
    // Wait for filter to apply
    await page.waitForLoadState('networkidle');
    
    // Check if filtered results are displayed
    await expect(page.locator('[data-testid="projects-table"]')).toBeVisible();
  });

  test('should filter projects by category', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Apply category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('[data-testid="category-software"]');
    
    // Wait for filter to apply
    await page.waitForLoadState('networkidle');
    
    // Check if filtered results are displayed
    await expect(page.locator('[data-testid="projects-table"]')).toBeVisible();
  });

  test('should navigate to project detail page', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="projects-table"] tbody tr');
    
    // Click on first project name to navigate to detail page
    await page.click('[data-testid="project-name-link"]:first-of-type');
    
    // Check if navigated to detail page
    await expect(page).toHaveURL(/\/dashboard\/project-management\/\d+/);
  });

  test('should open edit project dialog', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="projects-table"] tbody tr');
    
    // Open actions dropdown and click edit
    await page.click('[data-testid="project-actions-dropdown"]:first-of-type');
    await page.click('[data-testid="edit-project-action"]');
    
    // Check if edit dialog is open
    await expect(page.locator('[data-testid="edit-project-dialog"]')).toBeVisible();
    await expect(page.locator('text=Edit Project')).toBeVisible();
  });

  test('should view project overview tab in detail page', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Navigate to project detail page
    await page.waitForSelector('[data-testid="projects-table"] tbody tr');
    await page.click('[data-testid="project-name-link"]:first-of-type');
    
    // Check if overview tab is active and visible
    await expect(page.locator('[data-testid="overview-tab"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="project-overview-content"]')).toBeVisible();
  });

  test('should view project timeline tab in detail page', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Navigate to project detail page
    await page.waitForSelector('[data-testid="projects-table"] tbody tr');
    await page.click('[data-testid="project-name-link"]:first-of-type');
    
    // Click on timeline tab
    await page.click('[data-testid="timeline-tab"]');
    
    // Check if timeline tab content is visible
    await expect(page.locator('[data-testid="project-timeline-content"]')).toBeVisible();
  });

  test('should view project team tab in detail page', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Navigate to project detail page
    await page.waitForSelector('[data-testid="projects-table"] tbody tr');
    await page.click('[data-testid="project-name-link"]:first-of-type');
    
    // Click on team tab
    await page.click('[data-testid="team-tab"]');
    
    // Check if team tab content is visible
    await expect(page.locator('[data-testid="project-team-content"]')).toBeVisible();
  });

  test('should view project documents tab in detail page', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Navigate to project detail page
    await page.waitForSelector('[data-testid="projects-table"] tbody tr');
    await page.click('[data-testid="project-name-link"]:first-of-type');
    
    // Click on documents tab
    await page.click('[data-testid="documents-tab"]');
    
    // Check if documents tab content is visible
    await expect(page.locator('[data-testid="project-documents-content"]')).toBeVisible();
  });

  test('should display project status badges correctly', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="projects-table"] tbody tr');
    
    // Check if status badges are visible
    const statusBadges = page.locator('[data-testid="project-status-badge"]');
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should handle project deletion', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Wait for table to load
    await page.waitForSelector('[data-testid="projects-table"] tbody tr');
    
    // Open actions dropdown and click delete
    await page.click('[data-testid="project-actions-dropdown"]:first-of-type');
    await page.click('[data-testid="delete-project-action"]');
    
    // Confirm deletion in dialog
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Check success message
    await expect(page.locator('text=Project deleted successfully')).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Check if pagination is visible (if there are enough projects)
    const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
    
    if (paginationExists) {
      // Test pagination functionality
      await page.click('[data-testid="next-page"]');
      await page.waitForLoadState('networkidle');
      
      // Check if page changed
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
    }
  });

  test('should handle empty state when no projects exist', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/projects*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });
    
    await navigateToProjectManagement(page);
    
    // Check empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No projects found')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/projects*', route => {
      route.abort('failed');
    });
    
    await navigateToProjectManagement(page);
    
    // Check error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToProjectManagement(page);
    
    // Check if mobile layout is applied
    await expect(page.locator('[data-testid="mobile-projects-view"]')).toBeVisible();
  });

  test('should display correctly in dark mode', async ({ page }) => {
    await navigateToProjectManagement(page);
    
    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]');
    
    // Check if dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Check if components are visible in dark mode
    await expect(page.locator('[data-testid="projects-table"]')).toBeVisible();
  });
});