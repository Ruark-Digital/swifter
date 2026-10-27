import { test, expect } from "@playwright/test";

test.describe("Document Viewer Split-Pane Layout", () => {
  test("renders the native document viewer instead of text conversion for PDFs", async ({ page }) => {
    // Setup auth and navigate to collaboration tool with a PDF file
    await page.addInitScript(() => {
      window.localStorage.setItem("auth", JSON.stringify({
        state: { token: "test-token" }
      }));
    });

    // Mock the backend API that might be called for document
    await page.route("**/api/document/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: "%PDF-1.4...", // Fake PDF buffer
      });
    });

    // Navigate to collaboration page with a mock PDF
    await page.goto("/dashboard/collaboration?url=/api/document/test.pdf&fileName=test.pdf&fileType=application/pdf");

    // The editor panel should be rendered
    await expect(page.locator(".ct-editor-panel")).toBeVisible();

    // Verify split-pane layout exists
    const leftPane = page.locator(".ct-document-viewer");
    await expect(leftPane).toBeVisible();

    // Verify it uses react-pdf or similar native viewer
    await expect(page.locator(".react-pdf__Document")).toBeVisible();
    
    // YooptaEditor should still be visible on the right pane
    await expect(page.locator(".yoopta-editor")).toBeVisible();
  });
});
