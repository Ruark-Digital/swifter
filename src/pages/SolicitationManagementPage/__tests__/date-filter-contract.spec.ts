import { test, expect, Page } from "@playwright/test";

/**
 * Backend contract regression test for the list date filter.
 *
 * The solicitation / vendor / admin list endpoints filter by date via SEPARATE
 * `startDate` and `endDate` query params. A combined `date=start-end` string
 * (what the UI sent before this fix) crashes the procurement endpoints with a
 * 500 and returns no results on /admins. This logs in and asserts the contract
 * so we can't silently regress back to the combined param.
 */

const BASE_URL = "http://localhost:5173";
const LOGIN_EMAIL = "adediran.dbs+pm@gmail.com";
const LOGIN_PASSWORD = "password";

const START = "2026-10-04";
const END = "2026-10-11";

async function login(page: Page) {
  await page.goto(BASE_URL);
  const email = page.locator("input[name='email']");
  const password = page.locator("input[name='password']");
  await expect(email).toBeVisible({ timeout: 60000 });
  await email.fill(LOGIN_EMAIL);
  await password.fill(LOGIN_PASSWORD);
  await page
    .locator("button[type='submit']")
    .or(page.getByRole("button", { name: /log ?in/i }))
    .click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60000 });
}

test("list endpoints filter by separate startDate/endDate, not combined date=", async ({
  page,
}) => {
  test.setTimeout(120000);

  // Capture the real solicitations request so we hit the configured backend.
  let capturedUrl: string | null = null;
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes("/procurement/solicitations") && !capturedUrl) capturedUrl = u;
  });

  await login(page);
  await page.goto(`${BASE_URL}/dashboard/solicitation`).catch(() => {});
  await page.waitForTimeout(3000);

  const token = await page.evaluate(() => {
    const raw = window.localStorage.getItem("auth");
    try {
      return raw ? JSON.parse(raw)?.state?.token ?? null : null;
    } catch {
      return null;
    }
  });
  expect(token, "auth token after login").toBeTruthy();

  let apiBase = "https://dev.swiftpro.tech/api/v1/dev";
  if (capturedUrl) {
    const url = new URL(capturedUrl);
    apiBase = `${url.origin}${url.pathname.replace(/\/procurement\/solicitations.*/, "")}`;
  }

  const get = (path: string, qs: Record<string, string>) =>
    page.request.get(
      `${apiBase}${path}?${new URLSearchParams({ page: "1", limit: "10", ...qs })}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

  // The format the fixed UI now sends: separate params -> 200 on every list.
  for (const path of ["/procurement/solicitations", "/procurement/vendors/", "/admins"]) {
    const res = await get(path, { startDate: START, endDate: END });
    expect(res.status(), `${path} with startDate/endDate`).toBe(200);
  }

  // The old combined param crashed the procurement endpoints: guard against it.
  const combined = await get("/procurement/solicitations", { date: `${START}-${END}` });
  expect(combined.status(), "solicitations with combined date= must not be 200").not.toBe(200);
});
