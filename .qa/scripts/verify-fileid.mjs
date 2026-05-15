import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const SHOTS = resolve(process.cwd(), ".qa", "screenshots");
mkdirSync(SHOTS, { recursive: true });
const STAMP = new Date().toISOString().replace(/[:.]/g, "-");

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();

const collabReqs = [];
page.on("request", (req) => {
  const u = req.url();
  if (/\/contract\/file-comment\//.test(u)) {
    collabReqs.push({ method: req.method(), url: u });
  }
});

try {
  await page.goto("http://localhost:5173");
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
  await page.fill('input[name="email"]', "adediran.dbs+approver@gmail.com");
  await page.fill('input[name="password"]', "password");
  await page.click('button[type="submit"]');
  await page.waitForSelector('a[href*="/dashboard/contract-management"]', {
    timeout: 30_000,
  });
  await page.locator('a[href*="/dashboard/contract-management"]').first().click();
  await page.waitForTimeout(2000);
  await page.locator('[data-testid="project-name-link"]').first().click();
  await page
    .waitForFunction(
      () => !/Loading contract details/i.test(document.body.innerText),
      { timeout: 30_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(1500);
  await page
    .locator('button:has-text("Documents"), [role="tab"]:has-text("Documents")')
    .first()
    .click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(SHOTS, `verify-fileid-${STAMP}-docs.png`) });

  await Promise.all([
    page.waitForURL(/\/collaboration-tool/, { timeout: 15_000 }),
    page.getByRole("button", { name: /Edit in Collaboration Tool/i }).first().click(),
  ]);
  await page.waitForTimeout(2500);
  const url = page.url();
  const params = new URL(url);
  console.log("\n=== RESULT ===");
  console.log("collab URL:", url);
  console.log("fileId in URL:", params.searchParams.get("fileId"));
  console.log("contractId in URL:", params.searchParams.get("contractId"));
  console.log("file-comment requests fired:");
  collabReqs.forEach((r) => console.log(" -", r.method, r.url));
  await page.screenshot({ path: resolve(SHOTS, `verify-fileid-${STAMP}-collab.png`) });
} catch (e) {
  console.log("error:", e?.message);
} finally {
  await ctx.close();
  await browser.close();
}
