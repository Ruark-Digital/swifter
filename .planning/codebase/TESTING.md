# Testing Patterns

**Analysis Date:** 2026-07-22

## Test Framework

This codebase runs **two parallel test systems** that must not be confused:

1. **Vitest** — component/hook unit tests, file extension `*.test.ts` / `*.test.tsx`
2. **Playwright Test** — both true browser E2E specs *and* dependency-injection-based "unit" specs that reuse the Playwright `test`/`expect` API without a browser, file extension `*.spec.ts` / `*.spec.tsx`

**Vitest:**
- Version: `vitest@^2.1.9`
- Config: `vitest.config.ts` — `environment: 'jsdom'`, `globals: true`, setup file `vitest.setup.ts`, alias `@` → `./src`
- Excludes: `**/.worktrees/**`, `**/.qa/**`
- **No `test`/`test:unit` script wired up in `package.json`** — the `"test"` script is bound to Playwright (`playwright test`). Run Vitest directly: `npx vitest run` (single pass) or `npx vitest` (watch).
- Setup file `vitest.setup.ts` imports `@testing-library/jest-dom` and polyfills `ResizeObserver` globally for jsdom — do not re-polyfill per test file.

**Playwright:**
- Version: `@playwright/test` (see `package.json` devDependencies)
- Config: `playwright.config.ts` — `testDir: './src'`, `testMatch: ['**/*.spec.ts', '**/*.spec.tsx']`, `baseURL` from `E2E_BASE_URL` env var (default `http://localhost:5173`), loads `.env`, then `.env.e2e`, then `.env.local` (later overrides earlier)
- `fullyParallel: true`; `forbidOnly`/`retries`/`workers` are CI-gated via `process.env.CI`
- Projects: chromium, firefox, webkit (mobile viewport projects present but commented out)
- Trace collection: `on-first-retry`

**Assertion Library:**
- Vitest: built-in `expect` (Vitest's Jest-compatible matchers) plus `@testing-library/jest-dom` matchers (`toBeInTheDocument`, etc.)
- Playwright: built-in `expect` from `@playwright/test`

**Run Commands:**
```bash
npx vitest run                                    # Run all Vitest unit/hook/component tests once
npx vitest                                         # Vitest watch mode
npm run test                                       # Run ALL Playwright specs (playwright test) — includes e2e + DI-unit specs
npm run test:contract                              # Playwright specs scoped to ContractManagementPage/__tests__/
npm run test:admin / :evaluation / :vendor / :project / :reports / :settings   # Per-feature Playwright scoping
npm run test:all-features                          # Runs all the above feature scripts sequentially
npm run test:companies                             # Special-cased: node script, not playwright test directly
npm run test:headed / :ui / :debug / :report        # Playwright dev/debug modes
```

**Note:** `vitest scans stale .claude/worktrees` — Vitest's default glob will pick up duplicate test files under `.claude/worktrees/*/src/...` unless explicitly excluded; the config's `exclude: ['**/.worktrees/**', ...]` does not match `.claude/worktrees` (different path), so stray/duplicate test runs from old worktree snapshots can appear. When running Vitest, prefer filtering to `src/` explicitly if duplicate/stale results show up: `npx vitest run src`.

## Test File Organization

**Location:**
- Co-located `__tests__/` folders inside each feature/page directory, not a separate top-level test tree, e.g.:
  - `src/hooks/__tests__/useDashboardData.test.tsx`
  - `src/pages/ContractManagementPage/__tests__/*.spec.ts` (dozens of specs, both `.unit.spec.ts` and `.e2e.spec.ts` suffixed and plain `.spec.ts`)
  - `src/pages/CollaborationToolPage/collab/*.test.ts` (some collab-layer tests sit next to source rather than in `__tests__/`)
- One root-level smoke test: `src/App.test.tsx`

**Naming:**
- `<feature>.test.ts(x)` for Vitest component/hook tests
- `<feature>.spec.ts` for Playwright — further disambiguated with `.unit.spec.ts` (DI-faked, no browser) vs `.e2e.spec.ts` (real browser + route mocking) vs plain `.spec.ts` (usually also browser-driven)
- QA-ticket-numbered specs use the ticket id as a prefix: `ade-76-invoice-approve-status.e2e.spec.ts`, `ade85-manager-approve-change-url.unit.spec.ts`

**Structure:**
```
src/
  hooks/__tests__/<hook>.test.ts(x)
  lib/__tests__/<module>.test.ts
  pages/<Feature>Page/
    __tests__/
      <feature>.spec.ts            # playwright e2e or DI-unit
      <ticket>-<desc>.e2e.spec.ts  # ticket-scoped e2e
      <ticket>-<desc>.unit.spec.ts # ticket-scoped DI-unit
    api/<role>Api.ts               # tested by <role>-api.unit.spec.ts
```

## Test Structure

**Vitest suite (hooks/components):**
```typescript
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn(),
}));

describe("useDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetRequest.mockResolvedValue({ data: { data: [] } } as any);
  });

  test("requests AI insights for procurement from the contract manager dashboard endpoint", async () => {
    renderHook(() => useDashboardData("procurement"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: "/contract/manager/contracts/dashboard/ai-insights" })
      );
    });
  });
});
```
Reference: `src/hooks/__tests__/useDashboardData.test.tsx`

**Playwright DI-"unit" spec (no browser, API-client contract tests):**
```typescript
import { test, expect } from "@playwright/test";
import { createApproverApi } from "../api/approverApi";

test.describe("approverApi (unit)", () => {
  test("getContract calls correct endpoint", async () => {
    const getSpy = createAsyncSpy<{ url: string }>();
    const api = createApproverApi({ get: getSpy.fn, post: async () => ({}) as any });
    await api.getContract("c1");
    expect(getSpy.calls[0]).toEqual({ url: "/contract/approver/contracts/c1" });
  });
});
```
Reference: `src/pages/ContractManagementPage/__tests__/approver-api.unit.spec.ts`. This pattern hand-rolls a spy (`createAsyncSpy`) instead of using a mocking library — API client factories are designed to accept injected `get`/`post` functions specifically to enable this DI-based test style without needing a browser or network mocking.

**Playwright true e2e spec (browser + route interception):**
```typescript
import { test, expect, Page } from "@playwright/test";

async function seedAuth(page: Page, role: SeedRole) {
  await page.addInitScript((roleName) => {
    window.localStorage.setItem("auth", JSON.stringify({ state: { user: {...}, token: "test-token" }, version: 0 }));
  }, role);
}

function setupCommonRoutes(page: Page) {
  return Promise.all([
    page.route("**/api/v1/**", async (route) => { await route.fulfill({ status: 200, body: JSON.stringify({...}) }); }),
    page.route(`**/contract/approver/contracts/${contractId}`, async (route) => { ... }),
  ]);
}
```
Reference: `src/pages/ContractManagementPage/__tests__/ade-76-invoice-approve-status.e2e.spec.ts`

**Patterns:**
- Auth is seeded via `page.addInitScript` writing directly to `localStorage` under the `"auth"` key with the same shape as the Zustand `authSlice` persisted store (`{ state: { user, token, refresh }, version }`) — do not attempt real login flows in e2e specs; seed localStorage instead.
- Network calls are intercepted with `page.route(pattern, handler)` and `route.fulfill(...)` returning the app's real envelope shape (`{ status, message, data }`); a catch-all `**/api/v1/**` route is registered first, then more specific routes for the endpoints under test.
- Vitest tests mock at the module level with `vi.mock("@/lib/axiosInstance", ...)` rather than intercepting network calls — reserve real network route mocking for Playwright specs, use `vi.mock` for Vitest.

## Mocking

**Vitest:**
```typescript
vi.mock("@/lib/axiosInstance", () => ({ getRequest: vi.fn() }));
vi.mock("@/hooks/useUserQueryKey", () => ({ useUserQueryKey: (key: unknown[]) => key }));
const mockedGetRequest = vi.mocked(getRequest);
```
- Mock the axios helper module (`getRequest`/`postRequest`/etc.), not `axios` itself.
- Wrap hook renders that use React Query in a `QueryClientProvider` with `retry: false` (`createWrapper()` helper) so failed-mock assertions don't hang on retries.

**Playwright (DI-unit specs):**
- Hand-rolled spy factories (`createAsyncSpy`) recording `calls` array and returning a resolved fake response — no jest/sinon-style mocking library used here.

**Playwright (e2e specs):**
- `page.route()` interception is the only mocking mechanism; no MSW or similar service-worker mocking library is used.

**What to Mock:**
- The axios request helpers (`getRequest`/`postRequest`/`patchRequest`/`putRequest`/`deleteRequest`) or, in Playwright e2e, the network layer via `page.route`.
- Custom hooks that wrap query-key generation (`useUserQueryKey`) when they're not the subject under test.

**What NOT to Mock:**
- Do not mock React Query itself — use a real `QueryClient` with `retry: false` and assert via `waitFor`.
- Do not mock component internals; e2e specs assert against rendered DOM/localStorage state, not internal implementation.

## Fixtures and Factories

**Test Data:**
- No shared fixtures directory; response payloads are inlined per test/spec matching the app's real API envelope shape (`{ status, message, data }`).
- `@faker-js/faker` is a dependency (`package.json`) available for generating fixture data where used, but most current specs hardcode literal fixture objects inline instead.

**Location:**
- No dedicated `fixtures/` or `factories/` folder detected — fixtures live inline in the test/spec file that consumes them.

## Coverage

**Requirements:** No coverage threshold enforced in `vitest.config.ts` or CI config found — coverage is not gated.

**View Coverage:**
```bash
npx vitest run --coverage
```
(Requires `@vitest/coverage-v8` or similar provider to be installed if not already present — check `package.json` devDependencies before relying on this.)

## Test Types

**Unit Tests:**
- Vitest: hooks (`renderHook`) and small pure modules (`src/lib/__tests__/*.test.ts`, e.g. `dashboardDataTransformer.test.ts`, `navigation.test.ts`)
- Playwright "`.unit.spec.ts`": API-client factories tested via dependency injection, no browser/network involved despite using the Playwright test runner

**Integration Tests:**
- Vitest component tests (`@testing-library/react`) that render a component tree with a real `QueryClientProvider` and mocked network layer, e.g. `src/components/layouts/RoleBasedDashboard/analytics/__tests__/dashboard-analytics-cards.test.tsx`

**E2E Tests:**
- Playwright `.e2e.spec.ts` / plain `.spec.ts` files that launch a real browser against `baseURL`, seed auth via localStorage, and intercept all network calls with `page.route`. These require the dev server running (or `E2E_BASE_URL` pointed at a running instance) — they are not fully hermetic like the DI-unit specs.
- A separate ad hoc Playwright-based screenshot/manual-QA driver exists at `.qa/driver.mjs` for interactive browser probing (see `.qa/TESTING.md` for credentials/usage) — this is a QA tool, not part of the automated test suite.

## Common Patterns

**Async Testing (Vitest):**
```typescript
await waitFor(() => {
  expect(mockedGetRequest).toHaveBeenCalledWith(
    expect.objectContaining({ url: "...", config: expect.objectContaining({ params: expect.objectContaining({ type: "Contract" }) }) })
  );
});
```

**Async Testing (Playwright e2e):**
```typescript
await page.route(pattern, async (route) => {
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({...}) });
});
```

**Error Testing:**
- Vitest: `mockedGetRequest.mockRejectedValue(...)` then assert the component/hook's error-handling path (toast call, fallback UI) — follow the `useToastHandler` convention from CONVENTIONS.md when asserting error UI text.
- Playwright e2e: `route.fulfill({ status: 4xx/5xx, body: JSON.stringify({ message: "..." }) })` to simulate API error envelopes and assert the resulting toast/error state.

---

*Testing analysis: 2026-07-22*
