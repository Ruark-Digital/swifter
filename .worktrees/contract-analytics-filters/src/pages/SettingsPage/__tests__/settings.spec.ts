import { test, expect, Page } from '@playwright/test';

// Test data constants
const TEST_USER = {
  email: 'admin@swiftpro.com',
  password: '@swift_alg'
};

const TEST_SETTINGS = {
  companyName: 'SwiftPro Test Corp',
  email: 'test@swiftpro.com',
  phone: '+1234567890',
  address: '123 Test Street, Test City, TC 12345'
};

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

// Helper function to navigate to settings page
async function navigateToSettings(page: Page) {
  await page.goto('/dashboard/settings');
  await page.waitForLoadState('networkidle');
}

test.describe('Settings Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should display settings page with correct title and header', async ({ page }) => {
    await navigateToSettings(page);
    
    // Check page title
    await expect(page).toHaveTitle(/Settings/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Settings');
    
    // Check if settings navigation is visible
    await expect(page.locator('[data-testid="settings-navigation"]')).toBeVisible();
  });

  test('should display settings navigation tabs', async ({ page }) => {
    await navigateToSettings(page);
    
    // Check if all navigation tabs are visible
    await expect(page.locator('[data-testid="general-settings-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="account-settings-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="security-settings-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-settings-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="integration-settings-tab"]')).toBeVisible();
  });

  test('should display general settings by default', async ({ page }) => {
    await navigateToSettings(page);
    
    // Check if general settings tab is active
    await expect(page.locator('[data-testid="general-settings-tab"]')).toHaveClass(/active/);
    
    // Check if general settings content is visible
    await expect(page.locator('[data-testid="general-settings-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="company-info-section"]')).toBeVisible();
  });

  test('should update company information', async ({ page }) => {
    await navigateToSettings(page);
    
    // Update company information
    await page.fill('[data-testid="company-name-input"]', TEST_SETTINGS.companyName);
    await page.fill('[data-testid="company-email-input"]', TEST_SETTINGS.email);
    await page.fill('[data-testid="company-phone-input"]', TEST_SETTINGS.phone);
    await page.fill('[data-testid="company-address-input"]', TEST_SETTINGS.address);
    
    // Save changes
    await page.click('[data-testid="save-general-settings"]');
    
    // Check success message
    await expect(page.locator('text=Settings updated successfully')).toBeVisible();
  });

  test('should navigate to account settings', async ({ page }) => {
    await navigateToSettings(page);
    
    // Click account settings tab
    await page.click('[data-testid="account-settings-tab"]');
    
    // Check if account settings content is visible
    await expect(page.locator('[data-testid="account-settings-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="preferences-section"]')).toBeVisible();
  });

  test('should update user profile information', async ({ page }) => {
    await navigateToSettings(page);
    
    // Navigate to account settings
    await page.click('[data-testid="account-settings-tab"]');
    
    // Update profile information
    await page.fill('[data-testid="first-name-input"]', 'John');
    await page.fill('[data-testid="last-name-input"]', 'Doe');
    await page.fill('[data-testid="job-title-input"]', 'Procurement Manager');
    
    // Save changes
    await page.click('[data-testid="save-profile-settings"]');
    
    // Check success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
  });

  test('should update user preferences', async ({ page }) => {
    await navigateToSettings(page);
    
    // Navigate to account settings
    await page.click('[data-testid="account-settings-tab"]');
    
    // Update preferences
    await page.selectOption('[data-testid="language-select"]', 'en');
    await page.selectOption('[data-testid="timezone-select"]', 'America/New_York');
    await page.selectOption('[data-testid="date-format-select"]', 'MM/DD/YYYY');
    
    // Toggle dark mode
    await page.click('[data-testid="dark-mode-toggle"]');
    
    // Save changes
    await page.click('[data-testid="save-preferences-settings"]');
    
    // Check success message
    await expect(page.locator('text=Preferences updated successfully')).toBeVisible();
  });

  test('should navigate to security settings', async ({ page }) => {
    await navigateToSettings(page);
    
    // Click security settings tab
    await page.click('[data-testid="security-settings-tab"]');
    
    // Check if security settings content is visible
    await expect(page.locator('[data-testid="security-settings-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="two-factor-section"]')).toBeVisible();
  });

  test('should change password', async ({ page }) => {
    await navigateToSettings(page);
    
    // Navigate to security settings
    await page.click('[data-testid="security-settings-tab"]');
    
    // Fill password change form
    await page.fill('[data-testid="current-password-input"]', '@swift_alg');
    await page.fill('[data-testid="new-password-input"]', '@swift_new_password');
    await page.fill('[data-testid="confirm-password-input"]', '@swift_new_password');
    
    // Submit password change
    await page.click('[data-testid="change-password-button"]');
    
    // Check success message
    await expect(page.locator('text=Password changed successfully')).toBeVisible();
  });

  test('should enable two-factor authentication', async ({ page }) => {
    await navigateToSettings(page);
    
    // Navigate to security settings
    await page.click('[data-testid="security-settings-tab"]');
    
    // Enable 2FA
    await page.click('[data-testid="enable-2fa-button"]');
    
    // Check if 2FA setup dialog is open
    await expect(page.locator('[data-testid="2fa-setup-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
  });

  test('should navigate to notification settings', async ({ page }) => {
    await navigateToSettings(page);
    
    // Click notification settings tab
    await page.click('[data-testid="notification-settings-tab"]');
    
    // Check if notification settings content is visible
    await expect(page.locator('[data-testid="notification-settings-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-notifications-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="push-notifications-section"]')).toBeVisible();
  });

  test('should update email notification preferences', async ({ page }) => {
    await navigateToSettings(page);
    
    // Navigate to notification settings
    await page.click('[data-testid="notification-settings-tab"]');
    
    // Update email notification settings
    await page.check('[data-testid="email-new-orders"]');
    await page.check('[data-testid="email-contract-expiry"]');
    await page.uncheck('[data-testid="email-weekly-reports"]');
    
    // Save changes
    await page.click('[data-testid="save-notification-settings"]');
    
    // Check success message
    await expect(page.locator('text=Notification preferences updated')).toBeVisible();
  });

  test('should update push notification preferences', async ({ page }) => {
    await navigateToSettings(page);
    
    // Navigate to notification settings
    await page.click('[data-testid="notification-settings-tab"]');
    
    // Update push notification settings
    await page.check('[data-testid="push-urgent-alerts"]');
    await page.check('[data-testid="push-approval-requests"]');
    
    // Save changes
    await page.click('[data-testid="save-notification-settings"]');
    
    // Check success message
    await expect(page.locator('text=Notification preferences updated')).toBeVisible();
  });

  test('should navigate to integration settings', async ({ page }) => {
    await navigateToSettings(page);
    
    // Click integration settings tab
    await page.click('[data-testid="integration-settings-tab"]');
    
    // Check if integration settings content is visible
    await expect(page.locator('[data-testid="integration-settings-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-keys-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="webhooks-section"]')).toBeVisible();
  });

  test('should generate new API key', async ({ page }) => {
    await navigateToSettings(page);
    
    // Navigate to integration settings
    await page.click('[data-testid="integration-settings-tab"]');
    
    // Generate new API key
    await page.click('[data-testid="generate-api-key-button"]');
    
    // Fill API key details
    await page.fill('[data-testid="api-key-name-input"]', 'Test API Key');
    await page.selectOption('[data-testid="api-key-permissions-select"]', 'read-write');
    
    // Create API key
    await page.click('[data-testid="create-api-key-button"]');
    
    // Check if API key is displayed
    await expect(page.locator('[data-testid="new-api-key"]')).toBeVisible();
  });

  test('should add webhook endpoint', async ({ page }) => {
    await navigateToSettings(page);
    
    // Navigate to integration settings
    await page.click('[data-testid="integration-settings-tab"]');
    
    // Add webhook
    await page.click('[data-testid="add-webhook-button"]');
    
    // Fill webhook details
    await page.fill('[data-testid="webhook-url-input"]', 'https://example.com/webhook');
    await page.selectOption('[data-testid="webhook-events-select"]', 'order.created');
    
    // Save webhook
    await page.click('[data-testid="save-webhook-button"]');
    
    // Check success message
    await expect(page.locator('text=Webhook added successfully')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await navigateToSettings(page);
    
    // Try to save with invalid email
    await page.fill('[data-testid="company-email-input"]', 'invalid-email');
    await page.click('[data-testid="save-general-settings"]');
    
    // Check validation error
    await expect(page.locator('[data-testid="email-validation-error"]')).toBeVisible();
  });

  test('should handle password validation', async ({ page }) => {
    await navigateToSettings(page);
    
    // Navigate to security settings
    await page.click('[data-testid="security-settings-tab"]');
    
    // Try to change password with mismatched confirmation
    await page.fill('[data-testid="current-password-input"]', '@swift_alg');
    await page.fill('[data-testid="new-password-input"]', '@swift_new_password');
    await page.fill('[data-testid="confirm-password-input"]', '@different_password');
    
    await page.click('[data-testid="change-password-button"]');
    
    // Check validation error
    await expect(page.locator('[data-testid="password-mismatch-error"]')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/settings*', route => {
      route.abort('failed');
    });
    
    await navigateToSettings(page);
    
    // Try to save settings
    await page.fill('[data-testid="company-name-input"]', 'Test Company');
    await page.click('[data-testid="save-general-settings"]');
    
    // Check error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToSettings(page);
    
    // Check if mobile layout is applied
    await expect(page.locator('[data-testid="mobile-settings-view"]')).toBeVisible();
    
    // Check if navigation is collapsed on mobile
    await expect(page.locator('[data-testid="mobile-settings-menu"]')).toBeVisible();
  });

  test('should display correctly in dark mode', async ({ page }) => {
    await navigateToSettings(page);
    
    // Navigate to account settings and toggle dark mode
    await page.click('[data-testid="account-settings-tab"]');
    await page.click('[data-testid="dark-mode-toggle"]');
    
    // Check if dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Check if settings components are visible in dark mode
    await expect(page.locator('[data-testid="settings-navigation"]')).toBeVisible();
  });

  test('should reset settings to default', async ({ page }) => {
    await navigateToSettings(page);
    
    // Click reset to defaults button
    await page.click('[data-testid="reset-defaults-button"]');
    
    // Confirm reset in dialog
    await expect(page.locator('[data-testid="reset-confirmation-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-reset-button"]');
    
    // Check success message
    await expect(page.locator('text=Settings reset to defaults')).toBeVisible();
  });
});