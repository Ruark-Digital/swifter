// Responsive audit runner.
// For each role × viewport × route: screenshots + overflow signals to JSONL.
// Output:
//   .qa/reports/responsive/<role>/<viewport>/<route-slug>.png
//   .qa/reports/responsive/findings.jsonl
// Run a small slice first:
//   node .qa/scripts/responsive-audit.mjs --roles cm --viewports mobile --routes contracts
// Full matrix:
//   node .qa/scripts/responsive-audit.mjs

import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, appendFileSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const OUT = resolve(ROOT, ".qa", "reports", "responsive");
const FINDINGS = resolve(OUT, "findings.jsonl");
const BASE = "http://localhost:5173";

const ROLES = [
  { key: "cm",       label: "Contract Manager", email: "adediran.dbs+cm@gmail.com",       password: "password" },
  { key: "vendor",   label: "Vendor 1",         email: "shsimag079@ingam.top",            password: "password" },
  { key: "approver", label: "Approver 1",       email: "adediran.dbs+approver@gmail.com", password: "password" },
  { key: "pm",       label: "Project Manager",  email: "adediran.dbs+pm@gmail.com",       password: "password" },
];

const VIEWPORTS = [
  { key: "mobile",  width: 375,  height: 812  },
  { key: "tablet",  width: 768,  height: 1024 },
  { key: "ipad",    width: 1024, height: 1366 },
  { key: "desktop", width: 1440, height: 900  },
];

// Routes visited at the top level. Detail-page tabs are handled separately.
const ROUTES = [
  { key: "login",        path: "/", requiresAuth: false },
  { key: "dashboard",    path: "/dashboard" },
  { key: "projects",     path: "/dashboard/project-management" },
  { key: "contracts",    path: "/dashboard/contract-management" },
  { key: "msa",          path: "/dashboard/msa" },
  { key: "vendor",       path: "/dashboard/vendor" },
  { key: "solicitation", path: "/dashboard/solicitation" },
  { key: "profile",      path: "/dashboard/profile" },
];

const NAV_NOISE = [/favicon/i, /sockjs-node/, /hot-update/, /\.map(\?|$)/, /chrome-extension:/];
const isNoise = (s) => NAV_NOISE.some((re) => re.test(s));

const argv = process.argv.slice(2);
function flag(name) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1]?.split(",").filter(Boolean) : null;
}
const ONLY_ROLES = flag("roles");
const ONLY_VIEWPORTS = flag("viewports");
const ONLY_ROUTES = flag("routes");
const NO_DETAIL = argv.includes("--no-detail");
const FRESH = argv.includes("--fresh");

function pick(list, only, keyFn = (x) => x.key) {
  return only ? list.filter((x) => only.includes(keyFn(x))) : list;
}

async function login(page, role) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name=email]', { timeout: 20000 });
  await page.fill('input[name=email]', role.email);
  await page.fill('input[name=password]', role.password);
  await page.click('button[type=submit]');
  await page.waitForURL(
    (u) => !/\/$|\/forgot/.test(new URL(u).pathname) || /dashboard/.test(new URL(u).pathname),
    { timeout: 25000 }
  ).catch(() => null);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(1200);
}

// Overflow / responsive signal capture. Runs in the page.
async function captureSignals(page, viewport) {
  return page.evaluate((vp) => {
    const out = {
      htmlScrollWidth: document.documentElement.scrollWidth,
      htmlClientWidth: document.documentElement.clientWidth,
      windowInnerWidth: window.innerWidth,
      bodyScroll: document.body.scrollWidth > window.innerWidth + 1,
      offenders: [],
      tablesNoScrollWrapper: [],
      fixedOffscreen: [],
    };
    const W = window.innerWidth;
    const all = document.querySelectorAll("body *");
    const seen = new Set();
    for (const el of all) {
      const r = el.getBoundingClientRect();
      // overflow offender
      if (r.width > W + 1 && r.height > 0) {
        const sig = `${el.tagName}|${el.className}|${Math.round(r.width)}`;
        if (!seen.has(sig)) {
          seen.add(sig);
          out.offenders.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: typeof el.className === "string" ? el.className.slice(0, 200) : null,
            testid: el.getAttribute("data-testid"),
            rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          });
        }
      }
      // fixed off-screen
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" && (r.right > W + 1 || r.left < -1) && r.width > 4 && r.height > 4) {
        out.fixedOffscreen.push({
          tag: el.tagName.toLowerCase(),
          className: typeof el.className === "string" ? el.className.slice(0, 200) : null,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        });
      }
    }
    // tables without a horizontal-scroll wrapper at narrow widths
    if (vp.width < 1024) {
      const tables = document.querySelectorAll("table");
      for (const t of tables) {
        let p = t.parentElement;
        let wrapped = false;
        for (let i = 0; i < 4 && p; i++, p = p.parentElement) {
          const cs = getComputedStyle(p);
          if (cs.overflowX === "auto" || cs.overflowX === "scroll") { wrapped = true; break; }
        }
        if (!wrapped) {
          const r = t.getBoundingClientRect();
          out.tablesNoScrollWrapper.push({
            className: typeof t.className === "string" ? t.className.slice(0, 200) : null,
            rect: { x: Math.round(r.x), w: Math.round(r.width) },
          });
        }
      }
    }
    return out;
  }, viewport);
}

function slug(s) {
  return s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

async function captureOne({ page, role, viewport, route, kind = "route", label, listeners }) {
  const finalLabel = label ?? route.key;
  const dir = resolve(OUT, role.key, viewport.key);
  ensureDir(dir);
  const shotPath = resolve(dir, `${kind}-${slug(finalLabel)}.png`);

  const beforeErrs = listeners.consoleErrors.length;
  const beforeReqs = listeners.failedRequests.length;

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  if (kind === "route") {
    await page.goto(BASE + route.path, { waitUntil: "domcontentloaded" }).catch(() => null);
  }
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => null);
  await page.waitForTimeout(700);

  let signals = null;
  try { signals = await captureSignals(page, viewport); } catch (e) { signals = { error: String(e?.message || e) }; }

  await page.screenshot({ path: shotPath, fullPage: false }).catch(() => null);

  const finding = {
    ts: new Date().toISOString(),
    role: role.key,
    viewport: viewport.key,
    width: viewport.width,
    kind,
    routeKey: route?.key ?? null,
    routePath: route?.path ?? page.url(),
    label: finalLabel,
    url: page.url(),
    screenshot: shotPath.replace(ROOT + "\\", "").replace(/\\/g, "/"),
    signals,
    consoleErrors: listeners.consoleErrors.slice(beforeErrs),
    failedRequests: listeners.failedRequests.slice(beforeReqs),
  };
  appendFileSync(FINDINGS, JSON.stringify(finding) + "\n");
  return finding;
}

async function openFirstContractDetail(page) {
  await page.goto(BASE + "/dashboard/contract-management", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const kebab = page.locator('table tbody tr').first().locator('button[aria-haspopup="menu"], button:has(svg)').last();
  if (!(await kebab.count())) return null;
  await kebab.click({ timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(400);
  const item = page.locator('[role=menuitem]:has-text("View"), [role=menuitem]:has-text("Details"), button:has-text("View Details")').first();
  if (await item.count()) await item.click({ timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(3000);
  return /contract-management\/[^/]+/.test(page.url()) ? page.url() : null;
}

async function run() {
  if (FRESH && existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
  ensureDir(OUT);
  if (!existsSync(FINDINGS)) writeFileSync(FINDINGS, "");

  const roles = pick(ROLES, ONLY_ROLES);
  const viewports = pick(VIEWPORTS, ONLY_VIEWPORTS);
  const routes = pick(ROUTES, ONLY_ROUTES);

  const browser = await chromium.launch({ headless: true });
  const summary = [];

  for (const role of roles) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const listeners = { consoleErrors: [], failedRequests: [] };
    page.on("pageerror", (e) => listeners.consoleErrors.push(`pageerror: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const t = msg.text();
      if (!isNoise(t)) listeners.consoleErrors.push(t);
    });
    page.on("response", (res) => {
      const url = res.url();
      if (isNoise(url)) return;
      const st = res.status();
      if (st >= 400) listeners.failedRequests.push(`${st} ${res.request().method()} ${url}`);
    });

    let loggedIn = false;
    let detailUrl = null;

    for (const route of routes) {
      if (route.requiresAuth === false) {
        // run login screenshot only for one viewport per role to avoid double-login; do all here.
        for (const vp of viewports) {
          await page.context().clearCookies().catch(() => null);
          await captureOne({ page, role, viewport: vp, route, listeners });
        }
        continue;
      }
      if (!loggedIn) {
        await page.setViewportSize({ width: 1440, height: 900 });
        await login(page, role);
        loggedIn = true;
      }
      for (const vp of viewports) {
        await captureOne({ page, role, viewport: vp, route, listeners });
      }
    }

    // Detail-page tabs at every viewport (one contract per role)
    if (!NO_DETAIL && loggedIn) {
      await page.setViewportSize({ width: 1440, height: 900 });
      detailUrl = await openFirstContractDetail(page);
      if (detailUrl) {
        const tabHandles = await page.locator('[role=tab]').all();
        const tabNames = [];
        for (const t of tabHandles) {
          const text = (await t.textContent().catch(() => ""))?.trim();
          if (text) tabNames.push(text);
        }
        for (const tabName of tabNames) {
          const tab = page.locator(`[role=tab]:has-text("${tabName.replace(/"/g, '\\"')}")`).first();
          await tab.click({ timeout: 5000 }).catch(() => null);
          await page.waitForTimeout(1500);
          for (const vp of viewports) {
            await captureOne({
              page, role, viewport: vp,
              route: { key: `detail-${slug(tabName)}`, path: detailUrl },
              kind: "tab",
              label: `tab-${tabName}`,
              listeners,
            });
          }
        }
      }
    }

    summary.push({ role: role.key, detailUrl, errors: listeners.consoleErrors.length, failed: listeners.failedRequests.length });
    console.log(`[${role.label}] errs=${listeners.consoleErrors.length} 4xx=${listeners.failedRequests.length} detail=${detailUrl ? "ok" : "miss"}`);
    await ctx.close();
  }

  await browser.close();
  writeFileSync(resolve(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(`\nFindings: ${FINDINGS}`);
  console.log(`Screens : ${OUT}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
