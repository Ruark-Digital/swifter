// Phase 02 T7 perf benchmark for the docx-preview-rewrite branch.
//
// Boots a Chromium browser via @playwright/test (assumes the dev server
// is already running on $BASE — defaults to http://localhost:5175 to
// match the rest of the .qa/scripts/ conventions), navigates to the
// TipTap editor with a fixture-served Hyperscale docx, measures the
// end-to-end load time and a 100-keystroke typing latency series, and
// writes a JSON report under .qa/reports/.
//
// REQ-R-07 targets:
//   - Hyperscale load < 5 seconds end-to-end on dev machine
//   - Per-keystroke latency < 16ms (60fps) median over 100 keystrokes
//
// Usage:
//   pnpm dev &              # or already-running dev server
//   node .qa/scripts/editor-fidelity-perf.mjs
//
// Env overrides:
//   BASE      - dev server base URL (default http://localhost:5175)
//   HEADLESS  - "false" to watch the run (default true)
//   ROOM      - explicit Yjs room id (default per-run timestamp)

import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const HYPERSCALE_PATH = resolve(
  REPO_ROOT,
  ".qa/reference-docs/hyperscale-supply-agreement.docx"
);
const REPORTS_DIR = resolve(REPO_ROOT, ".qa/reports");

const BASE = process.env.BASE || "http://localhost:5175";
const HEADLESS = process.env.HEADLESS !== "false";
const ROOM = process.env.ROOM || `perf-${Date.now()}`;

const TARGET_LOAD_MS = 5000;
const TARGET_KEYSTROKE_MS = 16;

function authPayload() {
  return {
    state: {
      user: {
        _id: "perf-user",
        email: "perf@swiftpro.com",
        name: "Perf Tester",
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
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main() {
  const hyperscaleBytes = readFileSync(HYPERSCALE_PATH);
  const sourceUrl = "https://fixture.local/hyperscale-perf.docx";
  const editorPath = `/collaboration-tool?${new URLSearchParams({
    contractId: `perf-${ROOM}`,
    sourceUrl,
    fileName: ROOM,
    fileType: "docx",
  })}`;

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();
  const auth = JSON.stringify(authPayload());
  await context.addInitScript((authBlob) => {
    window.localStorage.setItem("auth", authBlob);
  }, auth);

  await context.route(/hyperscale-perf\.docx$/, async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      body: hyperscaleBytes,
    });
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on("pageerror", (err) => consoleErrors.push(`PAGE: ${err.message}`));

  // -- Load timing --------------------------------------------------------
  const loadStart = Date.now();
  await page.goto(`${BASE}${editorPath}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".ct-tiptap .ProseMirror [data-page-end='true']", {
    timeout: 60_000,
  });
  const loadElapsedMs = Date.now() - loadStart;

  const pageCount = await page
    .locator(".ct-tiptap [data-page-end='true']")
    .count();
  const blockCount = await page.evaluate(
    () =>
      document.querySelectorAll(".ct-tiptap .ProseMirror > *").length || 0
  );

  // -- Keystroke latency --------------------------------------------------
  // Type 100 single characters at the END of the doc, measuring the delta
  // between each keydown's dispatch and the next animation frame paint.
  // Uses a per-keystroke perf.now bracket inside the page so we don't
  // double-count the Playwright IPC round-trip.
  await page.locator(".ct-tiptap .ProseMirror").click();
  await page.keyboard.press("Control+End");

  const keystrokeSamples = await page.evaluate(async () => {
    const samples = [];
    const charset = "abcdefghijklmnopqrstuvwxyz ";
    const root = document.querySelector(".ct-tiptap .ProseMirror");
    if (!root) return samples;
    const dispatch = (ch) => {
      const opts = { key: ch, bubbles: true, cancelable: true };
      root.dispatchEvent(new KeyboardEvent("keydown", opts));
      // TipTap's ProseMirror view listens via DOM mutation + selection
      // — for measurement we synthesize the textContent change directly
      // by executing the editor's typing path through an input event.
      root.dispatchEvent(
        new InputEvent("beforeinput", {
          data: ch,
          inputType: "insertText",
          bubbles: true,
          cancelable: true,
        })
      );
    };
    for (let i = 0; i < 100; i += 1) {
      const ch = charset[i % charset.length];
      const t0 = performance.now();
      dispatch(ch);
      await new Promise((r) => requestAnimationFrame(() => r()));
      samples.push(performance.now() - t0);
    }
    return samples;
  });

  await browser.close();

  // -- Report -------------------------------------------------------------
  const report = {
    branch: "docx-preview-rewrite",
    phase: "02-T7",
    timestamp: new Date().toISOString(),
    base: BASE,
    room: ROOM,
    fixture: "hyperscale-supply-agreement.docx",
    load: {
      elapsedMs: loadElapsedMs,
      targetMs: TARGET_LOAD_MS,
      pass: loadElapsedMs < TARGET_LOAD_MS,
      blockCount,
      pageCount,
    },
    keystroke: {
      sampleCount: keystrokeSamples.length,
      medianMs: keystrokeSamples.length ? median(keystrokeSamples) : null,
      p95Ms: keystrokeSamples.length ? percentile(keystrokeSamples, 95) : null,
      maxMs: keystrokeSamples.length ? Math.max(...keystrokeSamples) : null,
      targetMs: TARGET_KEYSTROKE_MS,
      pass:
        keystrokeSamples.length > 0 &&
        median(keystrokeSamples) < TARGET_KEYSTROKE_MS,
    },
    consoleErrors,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  const outPath = resolve(
    REPORTS_DIR,
    `editor-perf-${report.timestamp.replace(/[:.]/g, "-")}.json`
  );
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf-8");

  const status =
    report.load.pass && report.keystroke.pass ? "PASS" : "FAIL/PARTIAL";
  console.log(
    `[T7 perf] ${status} | load=${loadElapsedMs}ms (target <${TARGET_LOAD_MS}) ` +
      `| keystroke median=${report.keystroke.medianMs?.toFixed(2)}ms ` +
      `(target <${TARGET_KEYSTROKE_MS}) | pages=${pageCount} | report=${outPath}`
  );
  if (consoleErrors.length) {
    console.log(`[T7 perf] ${consoleErrors.length} console error(s) captured`);
  }
  process.exit(report.load.pass && report.keystroke.pass ? 0 : 1);
}

main().catch((err) => {
  console.error("[T7 perf] fatal", err);
  process.exit(2);
});
