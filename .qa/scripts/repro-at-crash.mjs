import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const STAMP = new Date().toISOString().replace(/[:.]/g, "-");
const SHOTS = resolve(ROOT, ".qa", "screenshots");
const REPORTS = resolve(ROOT, ".qa", "reports");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(REPORTS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();

const allConsole = [];
const pageErrors = [];
page.on("console", (m) =>
  allConsole.push({ type: m.type(), text: m.text().slice(0, 600) }),
);
page.on("pageerror", (e) => pageErrors.push(e?.message || String(e)));

try {
  // login as Contract Manager
  await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
  await page.fill('input[name="email"]', "adediran.dbs+cm@gmail.com");
  await page.fill('input[name="password"]', "password");
  await page.click('button[type="submit"]');
  await page.waitForSelector('a[href*="/dashboard/contract-management"]', {
    timeout: 30_000,
  });

  // contract management → first contract via approver-shared link if needed
  await page.locator('a[href*="/dashboard/contract-management"]').first().click();
  await page
    .waitForResponse(
      (r) => /\/manager\/contracts\?/.test(r.url()) && r.status() < 500,
      { timeout: 15_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(1500);

  // click first contract title link
  const link = page.locator('[data-testid="project-name-link"]').first();
  if ((await link.count()) === 0) {
    // fall back to approver
    await ctx.clearCookies();
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', "adediran.dbs+approver@gmail.com");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForSelector('a[href*="/dashboard/contract-management"]', {
      timeout: 30_000,
    });
    await page.locator('a[href*="/dashboard/contract-management"]').first().click();
    await page.waitForTimeout(2_000);
  }

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

  const edit = page
    .getByRole("button", { name: /Edit in Collaboration Tool/i })
    .first();
  if ((await edit.count()) === 0) {
    throw new Error("No 'Edit in Collaboration Tool' button — no doc seeded");
  }

  await Promise.all([
    page.waitForURL(/\/collaboration-tool/, { timeout: 15_000 }),
    edit.click(),
  ]);

  // Wait for editor + comments to render
  await page
    .waitForSelector(".ct-editor-canvas, .yoopta-editor", { timeout: 20_000 })
    .catch(() => {});
  await page.waitForTimeout(2_500);
  await page
    .screenshot({ path: resolve(SHOTS, `repro-at-crash-${STAMP}-before.png`) })
    .catch(() => {});

  // Find the comment input (textarea now)
  const cb = page
    .locator('textarea[aria-label="Write a Comment"]')
    .first();
  const cbCount = await cb.count();
  console.log("comment box count:", cbCount);
  if (cbCount === 0) {
    await page
      .screenshot({ path: resolve(SHOTS, `repro-at-crash-${STAMP}-nocb.png`) })
      .catch(() => {});
    writeFileSync(
      resolve(REPORTS, `repro-at-crash-${STAMP}.json`),
      JSON.stringify(
        { reason: "comment textarea not found", allConsole, pageErrors },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  await cb.click();
  await cb.type("@", { delay: 60 });
  await page.waitForTimeout(1200);
  await page
    .screenshot({ path: resolve(SHOTS, `repro-at-crash-${STAMP}-after.png`) })
    .catch(() => {});

  writeFileSync(
    resolve(REPORTS, `repro-at-crash-${STAMP}.json`),
    JSON.stringify(
      {
        pageErrors,
        consoleErrors: allConsole.filter((c) => c.type === "error"),
        consoleWarningTail: allConsole.filter((c) => c.type === "warning").slice(-10),
        consoleLogTail: allConsole.slice(-20),
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ pageErrors, errors: allConsole.filter((c) => c.type === "error") }, null, 2));
} catch (e) {
  console.log("crash in script:", e?.message);
  await page
    .screenshot({ path: resolve(SHOTS, `repro-at-crash-${STAMP}-crash.png`) })
    .catch(() => {});
} finally {
  await ctx.close();
  await browser.close();
}
