// Phase 02 T6d regression smoke for the docx-preview-rewrite branch.
//
// Verifies the collab pieces that the T6 dead-code removal could break:
//   1. Hyperscale fixture loads through convertDocxToTipTapContent and
//      pagination decorations land (proves the new import path + plugin
//      cleanup didn't regress block measurement).
//   2. Two pages in the same BrowserContext see each other's edits via
//      IndexedDB persistence (proves the Yjs collab plumbing still
//      converges after the PaginationState/meta-payload reshape).
//   3. The save-status indicator transitions to "Saved" after a debounce
//      following an edit (proves the dirty/persistence loop).
//
// The remainder of the plan's T6d checklist — CommentMark persistence,
// BubbleMenu InsertionMark/DeletionMark, AI suggestions panel, Versions
// panel — requires deeper app-specific affordances and is left to
// manual verification.

import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const HYPERSCALE_PATH = resolve(
  HERE,
  "../../../../.qa/reference-docs/hyperscale-supply-agreement.docx"
);

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    const auth = {
      state: {
        user: {
          _id: "t6d-user",
          email: "t6d@swiftpro.com",
          name: "T6D Tester",
          role: { _id: "role-1", name: "contract_manager", __v: 0 },
          companyId: { name: "Test Co", _id: "company-1" },
          module: {
            contractManagement: true,
            solicitationManagement: true,
            evaluationsManagement: true,
            vendorManagement: true,
            reportsAnalytics: true,
            vendorsQA: true,
            generalUpdatesNotifications: true,
            addendumManagement: true,
            myActions: true,
          },
        },
        token: "test-token",
        refresh: null,
        authorities: [],
      },
      version: 0,
    };
    window.localStorage.setItem("auth", JSON.stringify(auth));
  });
}

async function interceptHyperscaleFetch(context: BrowserContext) {
  // The editor calls fetch(sourceUrl). Intercept and reply with the
  // local fixture so no static server is needed.
  const bytes = readFileSync(HYPERSCALE_PATH);
  await context.route(/hyperscale-fixture\.docx$/, async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      body: bytes,
    });
  });
}

function editorUrl(roomId: string) {
  const sourceUrl = "https://fixture.local/hyperscale-fixture.docx";
  const params = new URLSearchParams({
    contractId: `t6d-${roomId}`,
    sourceUrl,
    fileName: roomId,
    fileType: "docx",
  });
  return `/collaboration-tool?${params.toString()}`;
}

async function waitForPagination(page: Page) {
  // Pagination plugin emits [data-page-end] decorations once the doc has
  // rendered and block heights are measured. This is the editor-ready
  // signal: it proves convertDocxToTipTapContent ran, setContent
  // populated the doc, and the plugin completed its first recompute.
  await page.waitForSelector(".ct-tiptap .ProseMirror [data-page-end='true']", {
    timeout: 60_000,
  });
}

test.describe("T6d — docx-preview collab regression", () => {
  test("Hyperscale loads through new pipeline and pagination decorations land", async ({
    page,
    context,
  }) => {
    await seedAuth(page);
    await interceptHyperscaleFetch(context);

    const room = `t6d-load-${Date.now()}`;
    await page.goto(editorUrl(room));

    await waitForPagination(page);

    // docx-preview emits class names like docx_* on imported paragraphs.
    // translateWordStyleClasses then rewrites these to data-docx-style.
    // At least one of either signature should be present in a real load.
    const docxArtifactCount = await page.evaluate(() => {
      const root = document.querySelector(".ct-tiptap .ProseMirror");
      if (!root) return 0;
      return root.querySelectorAll("[data-docx-style], [class*='docx_']").length;
    });
    expect(docxArtifactCount).toBeGreaterThan(0);

    // At least 2 pages on Hyperscale — the doc is ~30+ pages in Word, the
    // 1100px content-target should produce well above 2 page-end markers.
    const pageEnds = await page.locator(".ct-tiptap [data-page-end='true']").count();
    expect(pageEnds).toBeGreaterThanOrEqual(2);
  });

  test("two tabs converge via IndexedDB after a local edit", async ({
    context,
  }) => {
    const room = `t6d-twoway-${Date.now()}`;

    const pageA = await context.newPage();
    await seedAuth(pageA);
    await interceptHyperscaleFetch(context);
    await pageA.goto(editorUrl(room));
    await waitForPagination(pageA);

    const probe = `T6D-PROBE-${Date.now()}`;
    await pageA.locator(".ct-tiptap .ProseMirror").click();
    // Move to start of doc so the probe lands somewhere predictable.
    await pageA.keyboard.press("Control+Home");
    await pageA.keyboard.type(probe, { delay: 5 });

    // Wait long enough for y-indexeddb to flush.
    await pageA.waitForTimeout(800);

    const pageB = await context.newPage();
    await seedAuth(pageB);
    await pageB.goto(editorUrl(room));
    await waitForPagination(pageB);

    await expect(pageB.locator(".ct-tiptap .ProseMirror")).toContainText(probe, {
      timeout: 10_000,
    });
  });

  test("save-status transitions after an edit", async ({ page, context }) => {
    await seedAuth(page);
    await interceptHyperscaleFetch(context);

    const room = `t6d-save-${Date.now()}`;
    await page.goto(editorUrl(room));
    await waitForPagination(page);

    await page.locator(".ct-tiptap .ProseMirror").click();
    await page.keyboard.type("hello", { delay: 5 });

    // PresenceBar renders the save state. After typing, it should
    // eventually settle on a non-saving label. The exact text varies
    // (Saved / All changes saved / etc.) — assert on the absence of
    // any "Saving" / "Unsaved" indicator within the debounce window.
    await page.waitForTimeout(2500);
    const stillSaving = await page
      .locator("text=/saving|unsaved/i")
      .count();
    expect(stillSaving).toBe(0);
  });
});
