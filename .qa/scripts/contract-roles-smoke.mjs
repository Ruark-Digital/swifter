// Contract Management smoke test across 4 user roles.
// Logs in as each role, opens the first contract in the list, clicks every
// visible tab, and records:
//   - JS console errors / React warnings
//   - Failed network requests (status >= 400)
//   - Per-tab screenshot
// Produces a single JSON + markdown report in .qa/reports/.

import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const STAMP = new Date().toISOString().replace(/[:.]/g, "-");
const SHOTS = resolve(ROOT, ".qa", "screenshots", `contract-roles-${STAMP}`);
const REPORTS = resolve(ROOT, ".qa", "reports");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(REPORTS, { recursive: true });

const BASE = "http://localhost:5173";

const ROLES = [
  { key: "cm",       label: "Contract Manager", email: "adediran.dbs+cm@gmail.com",       password: "password" },
  { key: "vendor",   label: "Vendor 1",         email: "shsimag079@ingam.top",            password: "password" },
  { key: "approver", label: "Approver 1",       email: "adediran.dbs+approver@gmail.com", password: "password" },
  { key: "pm",       label: "Project Manager",  email: "adediran.dbs+pm@gmail.com",       password: "password" },
];

const NAV_NOISE = [
  /favicon/i,
  /sockjs-node/,
  /hot-update/,
  /\.map(\?|$)/,
  /chrome-extension:/,
];

function isNoise(url) {
  return NAV_NOISE.some((re) => re.test(url));
}

async function login(page, role) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name=email]', { timeout: 20000 });
  await page.fill('input[name=email]', role.email);
  await page.fill('input[name=password]', role.password);
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !/\/$|\/forgot/.test(new URL(u).pathname) || /dashboard/.test(new URL(u).pathname), { timeout: 25000 }).catch(() => null);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(1500);
}

async function gotoContracts(page) {
  // Click sidebar "Contract Management" link if present, else navigate.
  const link = page.locator('a:has-text("Contract Management")').first();
  if (await link.count()) {
    await link.click().catch(() => null);
  } else {
    await page.goto(BASE + "/dashboard/contract-management");
  }
  await page.waitForTimeout(2500);
}

async function openFirstContract(page) {
  // Open the first row's kebab (action menu) in Actions column, then click View Details.
  const kebab = page.locator('table tbody tr').first().locator('button[aria-haspopup="menu"], button:has(svg)').last();
  if (await kebab.count()) {
    await kebab.click({ timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(400);
    const item = page.locator('[role=menuitem]:has-text("View"), [role=menuitem]:has-text("Details"), button:has-text("View Details")').first();
    if (await item.count()) await item.click({ timeout: 5000 }).catch(() => null);
  }
  await page.waitForTimeout(3000);
  const url = page.url();
  return /contract-management\/[^/]+/.test(url) ? url : null;
}

async function listTabs(page) {
  const tabs = await page.locator('[role=tab]').all();
  const out = [];
  for (const t of tabs) {
    const text = (await t.textContent().catch(() => ""))?.trim() || "";
    if (text) out.push({ text, locator: t });
  }
  return out;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const role of ROLES) {
    const roleResult = { role: role.label, key: role.key, errors: [], detailUrl: null, tabs: [], topLevel: { consoleErrors: [], failedRequests: [] } };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    page.on("pageerror", (e) => roleResult.topLevel.consoleErrors.push(`pageerror: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!isNoise(text)) roleResult.topLevel.consoleErrors.push(text);
      }
    });
    page.on("response", (res) => {
      const url = res.url();
      if (isNoise(url)) return;
      const st = res.status();
      if (st >= 400) roleResult.topLevel.failedRequests.push(`${st} ${res.request().method()} ${url}`);
    });

    try {
      await login(page, role);
      await page.screenshot({ path: resolve(SHOTS, `${role.key}-01-after-login.png`), fullPage: false });

      await gotoContracts(page);
      await page.screenshot({ path: resolve(SHOTS, `${role.key}-02-contracts-list.png`), fullPage: false });

      const detailUrl = await openFirstContract(page);
      roleResult.detailUrl = detailUrl;
      if (!detailUrl) {
        roleResult.errors.push("Could not open a contract detail page (no contracts visible or click failed).");
        await page.screenshot({ path: resolve(SHOTS, `${role.key}-03-no-detail.png`), fullPage: true });
      } else {
        await page.screenshot({ path: resolve(SHOTS, `${role.key}-03-detail.png`), fullPage: false });

        const tabs = await listTabs(page);
        roleResult.tabsFound = tabs.map((t) => t.text);

        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i];
          const tabSnapshot = { name: tab.text, consoleErrors: [], failedRequests: [] };
          const beforeErr = roleResult.topLevel.consoleErrors.length;
          const beforeReq = roleResult.topLevel.failedRequests.length;
          try {
            await tab.locator.click({ timeout: 5000 });
            await page.waitForTimeout(1800);
            const safe = tab.text.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
            await page.screenshot({ path: resolve(SHOTS, `${role.key}-tab-${String(i + 1).padStart(2, "0")}-${safe}.png`), fullPage: false });
          } catch (e) {
            tabSnapshot.clickError = String(e?.message || e);
          }
          tabSnapshot.consoleErrors = roleResult.topLevel.consoleErrors.slice(beforeErr);
          tabSnapshot.failedRequests = roleResult.topLevel.failedRequests.slice(beforeReq);
          roleResult.tabs.push(tabSnapshot);
        }
      }
    } catch (e) {
      roleResult.errors.push(`Fatal: ${e?.message || e}`);
    } finally {
      await ctx.close();
      results.push(roleResult);
      console.log(`[${role.label}] tabs=${roleResult.tabs.length} errors=${roleResult.topLevel.consoleErrors.length} failedReqs=${roleResult.topLevel.failedRequests.length}`);
    }
  }

  await browser.close();

  const jsonPath = resolve(REPORTS, `contract-roles-${STAMP}.json`);
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  let md = `# Contract Roles Smoke Test — ${STAMP}\n\n`;
  for (const r of results) {
    md += `## ${r.role} (${r.key})\n`;
    md += `- Detail URL: ${r.detailUrl ?? "**not reached**"}\n`;
    md += `- Tabs found: ${r.tabsFound?.length ?? 0}${r.tabsFound ? ` — ${r.tabsFound.join(", ")}` : ""}\n`;
    md += `- Top-level console errors: ${r.topLevel.consoleErrors.length}\n`;
    md += `- Top-level failed requests: ${r.topLevel.failedRequests.length}\n`;
    if (r.errors.length) md += `- **Fatal:** ${r.errors.join(" | ")}\n`;
    if (r.tabs.length) {
      md += `\n| # | Tab | Console errs | 4xx/5xx | Click error |\n|---|---|---|---|---|\n`;
      r.tabs.forEach((t, i) => {
        md += `| ${i + 1} | ${t.name} | ${t.consoleErrors.length} | ${t.failedRequests.length} | ${t.clickError ?? ""} |\n`;
      });
    }
    if (r.topLevel.consoleErrors.length) {
      md += `\n<details><summary>Console errors</summary>\n\n\`\`\`\n${r.topLevel.consoleErrors.join("\n")}\n\`\`\`\n</details>\n`;
    }
    if (r.topLevel.failedRequests.length) {
      md += `\n<details><summary>Failed requests</summary>\n\n\`\`\`\n${r.topLevel.failedRequests.join("\n")}\n\`\`\`\n</details>\n`;
    }
    md += `\n`;
  }
  const mdPath = resolve(REPORTS, `contract-roles-${STAMP}.md`);
  writeFileSync(mdPath, md);
  console.log(`\nReport: ${mdPath}`);
  console.log(`Screens: ${SHOTS}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
