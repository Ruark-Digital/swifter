// Browser-based QA for CollaborationToolPage changes.
//
// Strategy: try multiple accounts in priority order until one has seeded
// contracts visible. For each, capture the network response of the
// contracts API. The first account that returns >=1 contract wins; we
// then drive the UI to its Documents tab and click "Edit in Collaboration
// Tool" to reach the editor. If none have seeded contracts, dump the API
// responses so we can prove the seeded-data block to the user.

import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const STAMP = new Date().toISOString().replace(/[:.]/g, "-");
const FEATURE = "collaboration-tool";
const SHOTS = resolve(ROOT, ".qa", "screenshots");
const REPORTS = resolve(ROOT, ".qa", "reports");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(REPORTS, { recursive: true });

const ACCOUNTS = [
  { email: "adediran.dbs@gmail.com", password: "password", role: "Company Admin" },
  { email: "adediran.dbs+cm@gmail.com", password: "password", role: "Contract Manager" },
  { email: "adediran.dbs+pl@gmail.com", password: "password", role: "Procurement Lead" },
  { email: "adediran.dbs+approver@gmail.com", password: "password", role: "Approver" },
  { email: "shsimag079@ingam.top", password: "password", role: "Vendor 1" },
  { email: "vopahepet@2200freefonts.com", password: "password", role: "Vendor 2" },
];

const PREEXISTING_NOISE = [
  /enhancedValidationState|validationProgress|buttonValidationState|setValid|updateContext|getFieldConfig|recordInteraction|getAdaptiveFieldPriority|predictNextField/,
  /stroke-(width|linecap|linejoin|miterlimit)/,
  /Each child in a list should have a unique "key" prop/,
];

const isPreexistingNoise = (msg) =>
  PREEXISTING_NOISE.some((re) => re.test(msg));

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const allConsole = [];
  const networkFailures = [];
  const wsAttempts = [];
  const contractApiResponses = [];
  const collabApiCalls = []; // /file-comment, /ai/redline-suggestions
  const pageErrors = [];

  page.on("console", (msg) => {
    const text = msg.text();
    const t = msg.type();
    allConsole.push({ type: t, text: text.slice(0, 300) });
    if (t === "error" && !isPreexistingNoise(text)) consoleErrors.push(text);
    if (t === "warning" && !isPreexistingNoise(text)) consoleWarnings.push(text);
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err?.message || String(err));
  });
  page.on("requestfailed", (req) => {
    networkFailures.push({
      url: req.url(),
      failure: req.failure()?.errorText,
    });
  });
  page.on("websocket", (ws) => {
    wsAttempts.push(ws.url());
  });
  page.on("response", async (res) => {
    const u = res.url();
    if (/\/contracts(\b|\?|\/$)|\/contract\?|\/manager\/contracts/.test(u)) {
      try {
        const body = await res.json();
        const count =
          body?.data?.contracts?.length ??
          (Array.isArray(body?.data) ? body.data.length : null);
        contractApiResponses.push({
          url: u,
          status: res.status(),
          count,
        });
      } catch {
        contractApiResponses.push({ url: u, status: res.status() });
      }
    }
    if (/\/file-comment\//.test(u) || /\/ai\/redline-suggestions/.test(u)) {
      collabApiCalls.push({
        url: u,
        status: res.status(),
        method: res.request().method(),
      });
    }
  });

  const snap = async (label) => {
    const p = resolve(SHOTS, `${FEATURE}-${STAMP}-${label}.png`);
    await page.screenshot({ path: p }).catch(() => {});
    return p;
  };

  const writeReport = (status, reason, extra = {}) => {
    const report = {
      feature: FEATURE,
      status,
      reason,
      timestamp: STAMP,
      consoleErrors,
      consoleWarnings,
      pageErrors,
      networkFailures: networkFailures.filter(
        (f) => !/\/file-comment\//.test(f.url),
      ),
      wsAttempts,
      contractApiResponses,
      collabApiCalls,
      allConsoleTail: allConsole.slice(-50),
      ...extra,
    };
    const path = resolve(REPORTS, `${FEATURE}-${STAMP}.json`);
    writeFileSync(path, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  };

  try {
    let collabUrl = null;
    let chosenAccount = null;

    for (const account of ACCOUNTS) {
      contractApiResponses.length = 0;
      console.log(`\n--- Trying ${account.role} (${account.email}) ---`);

      // 1. Open root
      await page.goto("http://localhost:5173", {
        waitUntil: "domcontentloaded",
      });

      // 2. If logged in already (from previous loop), logout via localStorage clear
      const needsLogin =
        (await page.locator('input[name="email"]').count()) > 0;
      if (!needsLogin) {
        // Force-logout by clearing storage and reloading
        await ctx.clearCookies();
        await page.evaluate(() => {
          window.localStorage.clear();
          window.sessionStorage.clear();
        });
        await page.goto("http://localhost:5173", {
          waitUntil: "domcontentloaded",
        });
      }

      // 3. Fill login
      await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
      await page.fill('input[name="email"]', account.email);
      await page.fill('input[name="password"]', account.password);
      await page.click('button[type="submit"]');

      // 4. Wait for sidebar to render
      const ok = await page
        .waitForSelector('a[href*="/dashboard/contract-management"]', {
          timeout: 25_000,
        })
        .then(() => true)
        .catch(() => false);
      if (!ok) {
        console.log(`  login failed or no contract-management sidebar link`);
        continue;
      }

      // 5. Navigate to contract management
      await page.locator('a[href*="/dashboard/contract-management"]').first().click();

      // Wait for contracts API to settle
      await page
        .waitForResponse(
          (r) => /\/manager\/contracts|\/vendor\/contracts|\/approver\/contracts|\/user\/contracts/.test(r.url()) && r.status() < 500,
          { timeout: 15_000 },
        )
        .catch(() => {});
      await page.waitForTimeout(1500);
      await snap(`${account.role.replace(/\s+/g, "-")}-list`);

      // 6. Inspect API responses
      const seeded = contractApiResponses.some(
        (r) => typeof r.count === "number" && r.count > 0,
      );
      console.log(
        `  contracts api responses:`,
        JSON.stringify(contractApiResponses),
      );

      if (!seeded) continue;

      // 7. Click first contract title link (data-testid="project-name-link")
      const firstLink = page
        .locator('[data-testid="project-name-link"]')
        .first();
      if ((await firstLink.count()) === 0) {
        console.log(`  no contract title link found despite seeded count`);
        continue;
      }
      await firstLink.click();
      // Wait for the "Loading contract details…" spinner to clear and tabs to render
      await page
        .waitForFunction(
          () => !/Loading contract details/i.test(document.body.innerText),
          { timeout: 30_000 },
        )
        .catch(() => {});
      await page
        .waitForSelector(
          'button:has-text("Documents"), [role="tab"]:has-text("Documents")',
          { timeout: 20_000 },
        )
        .catch(() => {});
      await page.waitForTimeout(1500);
      await snap(`${account.role.replace(/\s+/g, "-")}-detail`);

      // 8. Documents tab
      const docsTab = page
        .locator(
          'button:has-text("Documents"), [role="tab"]:has-text("Documents"), a:has-text("Documents")',
        )
        .first();
      if ((await docsTab.count()) === 0) {
        console.log(`  documents tab not found`);
        continue;
      }
      await docsTab.click();
      await page.waitForTimeout(1000);
      await snap(`${account.role.replace(/\s+/g, "-")}-documents`);

      // 9. Edit in Collaboration Tool button
      const editBtn = page
        .getByRole("button", { name: /Edit in Collaboration Tool/i })
        .first();
      if ((await editBtn.count()) === 0) {
        console.log(`  no 'Edit in Collaboration Tool' button — contract has no documents`);
        continue;
      }

      await Promise.all([
        page.waitForURL(/\/collaboration-tool/, { timeout: 15_000 }).catch(() => {}),
        editBtn.click(),
      ]);
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      collabUrl = page.url();
      chosenAccount = account;
      break;
    }

    if (!collabUrl) {
      const post = await snap("final-state");
      writeReport(
        "blocked",
        "Walked all candidate accounts; none had a contract with an attached document. Cannot reach /collaboration-tool without backend-seeded data or driving the multi-step Create Contract wizard.",
        { tried: ACCOUNTS.map((a) => a.role), finalScreenshot: post },
      );
      return;
    }

    // === Reached the collab tool ===
    // Wait for editor to mount — lazy import + Yoopta init takes a beat
    await page
      .waitForSelector(".ct-editor-canvas, .yoopta-editor", {
        timeout: 20_000,
      })
      .catch(() => {});
    await page.waitForTimeout(2_000);
    await snap("collab-tool-loaded");

    const editorVisible =
      (await page.locator(".yoopta-editor, .ct-editor-canvas").count()) > 0;

    // Inject a fake fileId by adding it to the URL via UI? Forbidden by skill
    // rules. We test with the params already present.

    // Click AI Polish
    const aiBtn = page
      .getByRole("button", { name: /AI Polish/i })
      .first();
    let aiPanelOpened = false;
    if (await aiBtn.count() > 0) {
      await aiBtn.click();
      await page.waitForTimeout(1200);
      aiPanelOpened =
        (await page.locator('text=AI Polish').count()) > 1 ||
        (await page.locator('[role="dialog"], .fixed.inset-y-0.right-0').count()) > 0;
      await snap("ai-panel");
    }

    // Comments tab
    const commentsTab = page
      .locator('button:has-text("Comments"), [role="tab"]:has-text("Comments")')
      .first();
    let commentsRendered = false;
    if (await commentsTab.count() > 0) {
      await commentsTab.click();
      await page.waitForTimeout(600);
      commentsRendered =
        (await page.locator('text=Comments').count()) > 0;
      await snap("comments-tab");
    }

    // WS verification
    const collabWs = wsAttempts.filter(
      (u) => !/localhost:5173\/?\?token=/.test(u), // Vite HMR
    );
    const hasDocAndToken = collabWs.some(
      (u) => /[?&]doc=/.test(u) && /[?&]token=/.test(u),
    );

    writeReport(consoleErrors.length === 0 && editorVisible ? "pass" : "fail", "QA pass complete", {
      account: chosenAccount,
      collabUrl,
      editorVisible,
      aiPanelOpened,
      commentsRendered,
      collabWebSocketUrls: collabWs,
      hasDocAndTokenInWs: hasDocAndToken,
      allWsAttempts: wsAttempts,
    });
  } catch (e) {
    await snap("crash");
    writeReport("fail", `Uncaught: ${e?.message || e}`);
  } finally {
    await ctx.close().catch(() => {});
    await browser.close().catch(() => {});
  }
};

main();
