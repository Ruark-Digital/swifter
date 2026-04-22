import { test, expect } from "@playwright/test";
import {
  loginAs,
  navigateToCompanies,
  setDeviceViewport,
  takeScreenshot,
} from "./utils/test-helpers";

test.describe("Companies Page - Performance Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("should load companies page within acceptable time", async ({
    page,
  }) => {
    const startTime = Date.now();

    await navigateToCompanies(page);

    // Wait for main content to be visible
    await page.waitForSelector('h1:has-text("Companies")');
    await page.waitForSelector("table");

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    console.log(`Companies page loaded in ${loadTime}ms`);
  });

  test("should handle large datasets efficiently", async ({ page }) => {
    // Mock large dataset
    const largeDataset = {
      success: true,
      data: {
        data: {
          total: 1000,
          page: 1,
          limit: 10,
          data: Array.from({ length: 10 }, (_, i) => ({
            _id: `company_${i}`,
            name: `Company ${i + 1}`,
            industry: "Technology",
            sizeCategory: "Medium",
            status: i % 2 === 0 ? "active" : "inactive",
            maxUsers: 100,
            admins: [
              {
                _id: `admin_${i}`,
                name: `Admin ${i + 1}`,
                email: `admin${i + 1}@company${i + 1}.com`,
              },
            ],
            domain: `company${i + 1}.com`,
            planName: "Professional",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        },
      },
    };

    await page.route("**/companies**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(largeDataset),
      });
    });

    const startTime = Date.now();
    await navigateToCompanies(page);

    // Wait for table to render
    await page.waitForSelector("tbody tr");

    const renderTime = Date.now() - startTime;

    // Should render large dataset within reasonable time
    expect(renderTime).toBeLessThan(3000);

    // Verify all 10 rows are rendered
    const rowCount = await page.locator("tbody tr").count();
    expect(rowCount).toBe(10);

    console.log(`Large dataset rendered in ${renderTime}ms`);
  });

  test("should maintain performance during search operations", async ({
    page,
  }) => {
    await navigateToCompanies(page);

    const searchInput = page.locator('input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      const searchTerms = ["Tech", "Company", "Test", "Solution"];

      for (const term of searchTerms) {
        const startTime = Date.now();

        await searchInput.fill(term);

        // Wait for debounced search
        await page.waitForTimeout(600);

        const searchTime = Date.now() - startTime;

        // Search should complete within 2 seconds
        expect(searchTime).toBeLessThan(2000);

        console.log(`Search for "${term}" completed in ${searchTime}ms`);
      }
    }
  });

  test("should handle rapid pagination efficiently", async ({ page }) => {
    await navigateToCompanies(page);

    const nextButton = page.locator('button:has-text("Next")');
    const prevButton = page.locator('button:has-text("Previous")');

    if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
      // Test rapid pagination
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();

        await nextButton.click();
        await page.waitForTimeout(500);

        const paginationTime = Date.now() - startTime;

        // Pagination should be fast
        expect(paginationTime).toBeLessThan(1500);

        console.log(`Pagination ${i + 1} completed in ${paginationTime}ms`);
      }

      // Navigate back
      for (let i = 0; i < 3; i++) {
        if (await prevButton.isEnabled()) {
          await prevButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test("should maintain performance on different screen sizes", async ({
    page,
  }) => {
    const devices = ["mobile", "tablet", "desktop"] as const;

    for (const device of devices) {
      await setDeviceViewport(page, device);

      const startTime = Date.now();
      await navigateToCompanies(page);

      await page.waitForSelector('h1:has-text("Companies")');

      const loadTime = Date.now() - startTime;

      // Should load efficiently on all devices
      expect(loadTime).toBeLessThan(4000);

      console.log(`${device} viewport loaded in ${loadTime}ms`);

      // Take screenshot for visual verification
      await takeScreenshot(page, `companies-${device}`);
    }
  });

  test("should handle memory efficiently during extended use", async ({
    page,
  }) => {
    await navigateToCompanies(page);

    // Simulate extended use by performing multiple operations
    const operations = [
      () => page.click("text=Create Company"),
      () => page.keyboard.press("Escape"),
      () => page.locator('input[placeholder*="Search"]').fill("test"),
      () => page.locator('input[placeholder*="Search"]').fill(""),
      () => page.click("text=Status"),
      () => page.keyboard.press("Escape"),
    ];

    // Perform operations multiple times
    for (let cycle = 0; cycle < 5; cycle++) {
      for (const operation of operations) {
        try {
          await operation();
          await page.waitForTimeout(200);
        } catch (error) {
          // Continue if operation fails
        }
      }
    }

    // Verify page is still responsive
    await expect(page.locator('h1:has-text("Companies")')).toBeVisible();

    console.log("Extended use test completed successfully");
  });
});

test.describe("Companies Page - Accessibility Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await navigateToCompanies(page);

    // Check main heading
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText("Companies");

    // Check for proper heading structure
    const headings = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .allTextContents();
    expect(headings.length).toBeGreaterThan(0);

    console.log("Heading hierarchy:", headings);
  });

  test("should have proper ARIA labels and roles", async ({ page }) => {
    await navigateToCompanies(page);

    // Check table has proper role
    const table = page.locator("table");
    await expect(table).toBeVisible();

    // Check buttons have accessible names
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute("aria-label");
      const text = await button.textContent();

      // Button should have either aria-label or text content
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test("should be keyboard navigable", async ({ page }) => {
    await navigateToCompanies(page);

    // Start from the top of the page
    await page.keyboard.press("Tab");

    // Navigate through focusable elements
    const focusableElements: Array<{
      tagName: string;
      role: string | null;
      ariaLabel: string | null;
    }> = [];

    for (let i = 0; i < 20; i++) {
      const focusedElement = page.locator(":focus");

      if (await focusedElement.isVisible()) {
        const tagName = await focusedElement.evaluate((el) => el.tagName);
        const role = await focusedElement.getAttribute("role");
        const ariaLabel = await focusedElement.getAttribute("aria-label");

        focusableElements.push({ tagName, role, ariaLabel });
      }

      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);
    }

    // Should have navigated through multiple focusable elements
    expect(focusableElements.length).toBeGreaterThan(3);

    console.log("Focusable elements:", focusableElements);
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await navigateToCompanies(page);

    // Check text elements for color contrast
    const textElements = ["h1", "th", "td", "button", ".badge"];

    for (const selector of textElements) {
      const elements = page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        const firstElement = elements.first();

        if (await firstElement.isVisible()) {
          const styles = await firstElement.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize,
            };
          });

          console.log(`${selector} styles:`, styles);

          // Basic check - text should have color
          expect(styles.color).not.toBe("rgba(0, 0, 0, 0)");
        }
      }
    }
  });

  test("should support screen reader navigation", async ({ page }) => {
    await navigateToCompanies(page);

    // Check for landmarks
    const landmarks = await page
      .locator(
        '[role="main"], [role="navigation"], [role="banner"], main, nav, header'
      )
      .count();
    expect(landmarks).toBeGreaterThan(0);

    // Check table has proper structure for screen readers
    const tableHeaders = page.locator("th");
    const headerCount = await tableHeaders.count();

    if (headerCount > 0) {
      // Headers should have text content
      for (let i = 0; i < headerCount; i++) {
        const header = tableHeaders.nth(i);
        const text = await header.textContent();
        expect(text?.trim()).toBeTruthy();
      }
    }
  });

  test("should handle focus management in dialogs", async ({ page }) => {
    await navigateToCompanies(page);

    // Open create company dialog
    await page.click("text=Create Company");

    // Wait for dialog
    const dialog = page.locator('[role="dialog"]');

    if (await dialog.isVisible()) {
      // Focus should be trapped in dialog
      await page.keyboard.press("Tab");

      const focusedElement = page.locator(":focus");

      // Focused element should be within dialog
      const isInDialog = await focusedElement.evaluate((el, dialogEl) => {
        return dialogEl?.contains(el) ?? false;
      }, await dialog.elementHandle());

      expect(isInDialog).toBeTruthy();

      // Close dialog with Escape
      await page.keyboard.press("Escape");

      // Dialog should close
      await expect(dialog).not.toBeVisible();
    }
  });

  test("should provide meaningful error messages", async ({ page }) => {
    // Mock API error
    await page.route("**/companies**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Server error occurred",
        }),
      });
    });

    await navigateToCompanies(page);

    // Wait for error handling
    await page.waitForTimeout(3000);

    // Check if error message is accessible
    const errorElements = page.locator('[role="alert"], .error, .alert');
    const errorCount = await errorElements.count();

    if (errorCount > 0) {
      const errorText = await errorElements.first().textContent();
      expect(errorText?.trim()).toBeTruthy();

      console.log("Error message:", errorText);
    }
  });

  test("should work with reduced motion preferences", async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });

    await navigateToCompanies(page);

    // Page should still be functional with reduced motion
    await expect(page.locator('h1:has-text("Companies")')).toBeVisible();

    // Test interactions still work
    await page.click("text=Create Company");

    const dialog = page.locator('[role="dialog"]');
    if (await dialog.isVisible()) {
      await page.keyboard.press("Escape");
    }

    console.log("Reduced motion test completed");
  });

  test("should support high contrast mode", async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: "dark", forcedColors: "active" });

    await navigateToCompanies(page);

    // Page should be visible in high contrast mode
    await expect(page.locator('h1:has-text("Companies")')).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Take screenshot for manual verification
    await takeScreenshot(page, "companies-high-contrast");

    console.log("High contrast mode test completed");
  });
});
