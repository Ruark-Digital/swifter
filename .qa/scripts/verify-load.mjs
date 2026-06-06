// One-off load verification: hit the app, capture console errors, uncaught
// exceptions, and failing network requests. No auth, no clicks. Just verifies
// the bundle loads and the login screen renders without exploding.

import { chromium } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:5175";
const NAV_NOISE = [/favicon/i, /sockjs-node/, /hot-update/, /\.map(\?|$)/, /chrome-extension:/];
const isNoise = (url) => NAV_NOISE.some((re) => re.test(url));

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

page.on("console", (msg) => {
  const t = msg.type();
  if (t === "error" || t === "warning") {
    const text = msg.text();
    if (/Failed to load resource|favicon|hot-update|ServiceWorker/i.test(text)) return;
    consoleErrors.push({ level: t, text });
  }
});
page.on("pageerror", (err) => {
  pageErrors.push({ message: err.message, stack: err.stack?.split("\n").slice(0, 6).join("\n") });
});
page.on("requestfailed", (req) => {
  const url = req.url();
  if (isNoise(url)) return;
  failedRequests.push({ url, failure: req.failure()?.errorText });
});
page.on("response", async (resp) => {
  const url = resp.url();
  if (isNoise(url)) return;
  if (resp.status() >= 500) {
    let body = "";
    try { body = (await resp.text()).slice(0, 800); } catch {}
    failedRequests.push({ url, status: resp.status(), body });
  }
});

try {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(2000);
  const title = await page.title();
  const hasEmailField = await page.locator('input[name=email]').count() > 0;
  const hasLoginButton = await page.locator('button[type=submit]').count() > 0;
  console.log(JSON.stringify({
    ok: pageErrors.length === 0 && failedRequests.length === 0 && consoleErrors.length === 0,
    title,
    hasEmailField,
    hasLoginButton,
    consoleErrors,
    pageErrors,
    failedRequests,
  }, null, 2));
} catch (e) {
  console.log(JSON.stringify({ ok: false, fatal: e.message }));
} finally {
  await browser.close();
}
