# Testing Patterns

**Analysis Date:** 2026-05-17

## Test Frameworks

The repo runs **two** test runners side-by-side:

| Runner | Purpose | File pattern |
|--------|---------|--------------|
| **Playwright** (`@playwright/test` ^1.53) | Full-flow e2e in real browsers; also used for some lightweight unit specs that don't need a DOM (e.g. badge helpers). | `**/*.spec.ts`, `**/*.spec.tsx`, `**/*.e2e.spec.ts` |
| **Vitest** (`vitest` ^2.1.9) + `@testing-library/react` ^16.3 + `jsdom` ^29 | Component / unit tests with React rendering. | `**/*.test.ts`, `**/*.test.tsx`, `**/*.unit.spec.ts` (run directly via `vitest` even though the name says `.spec`) |

Vitest config: `vitest.config.ts:1-18` — `environment: 'jsdom'`, `globals: true`, setup file `./vitest.setup.ts`, excludes `**/.worktrees/**` and `**/.qa/**`.

Vitest setup: `vitest.setup.ts:1-11` — imports `@testing-library/jest-dom` matchers and polyfills `ResizeObserver`. No MSW; API mocking happens in-test with `vi.mock` for module-level units, or via Playwright `page.route(...)` for e2e.

Playwright config: `playwright.config.ts:1-80` — `testDir: './src'`, runs against Chromium / Firefox / WebKit / Microsoft Edge, `baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173'`, auto-starts `npm run dev` via `webServer`. Env loaded from `.env`, then `.env.e2e`, then `.env.local` (override order).

## Test File Organization

Tests live alongside the page they exercise, in a `__tests__/` folder:

```text
src/pages/<Page>/__tests__/
  some-flow.spec.ts          # Playwright e2e
  some-flow.e2e.spec.ts      # Playwright e2e (explicit suffix used for newer JIRA-tagged specs)
  some-helper.unit.spec.ts   # Pure-unit, runnable with either runner (no DOM)
  SomeComponent.test.tsx     # Vitest + RTL component test
```

Cross-cutting tests live under `src/hooks/__tests__/` (`useUserRole.test.tsx`) and `src/lib/__tests__/` (`contractFormValues.spec.ts`, `navigation.test.ts`, `fileUtils.pdf-fast.spec.ts`).

## Sample Specs

**Playwright e2e** (mocks the API via `page.route`, seeds auth via `localStorage`):

- `src/pages/ContractManagementPage/__tests__/contract-management.spec.ts`
- `src/pages/ContractManagementPage/__tests__/contract-detail-tabs.spec.ts`
- `src/pages/ContractManagementPage/__tests__/contract-detail-workflow.spec.ts`
- `src/pages/ContractManagementPage/__tests__/edit-contract.spec.ts`
- `src/pages/ContractManagementPage/__tests__/edit-contract-real-auth.spec.ts`
- `src/pages/ContractManagementPage/__tests__/ade-69-payment-summary-manager-actions-hidden.e2e.spec.ts`
- `src/pages/ContractManagementPage/__tests__/ade-76-invoice-approve-status.e2e.spec.ts`
- `src/pages/ContractManagementPage/__tests__/ade-77-vendor-update-invoice.e2e.spec.ts`
- `src/pages/ContractManagementPage/__tests__/ade-78-invoice-id-filter.e2e.spec.ts`
- `src/pages/ContractManagementPage/__tests__/ade-79-invoice-dto.e2e.spec.ts`
- `src/pages/ContractManagementPage/__tests__/holdback-details-status.e2e.spec.ts`
- `src/pages/MsaPage/__tests__/msa.spec.ts`
- `src/pages/MsaPage/__tests__/create-msa.spec.ts`
- `src/pages/MsaPage/__tests__/msa-compliance-flow.spec.ts`
- `src/pages/CollaborationToolPage/__tests__/collaboration.spec.ts`
- `src/pages/__tests__/dashboard-contract-manager.spec.ts`

**Playwright unit-style** (pure helpers, no browser navigation):

- `src/pages/ContractManagementPage/__tests__/holdbacks-status-badge.unit.spec.ts`
- `src/pages/ContractManagementPage/__tests__/view-only-api.unit.spec.ts`
- `src/pages/ContractManagementPage/__tests__/vendor-api.unit.spec.ts`
- `src/pages/ContractManagementPage/__tests__/approver-api.unit.spec.ts`
- `src/pages/ContractManagementPage/__tests__/contract-manager-api.unit.spec.ts`
- `src/pages/ContractManagementPage/__tests__/contract-changes.unit.spec.ts`
- `src/pages/ContractManagementPage/__tests__/ade85-manager-approve-change-url.unit.spec.ts`

**Vitest + React Testing Library** (rendering with mocks):

- `src/pages/ContractManagementPage/__tests__/invoice-table.test.tsx`
- `src/pages/ContractManagementPage/__tests__/DocumentItem.test.tsx`
- `src/pages/ContractManagementPage/__tests__/compliance-security.test.tsx`
- `src/pages/ContractManagementPage/__tests__/create-amendment-payload.test.tsx`
- `src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx`
- `src/pages/MsaPage/__tests__/compliance-flow.test.tsx`
- `src/pages/MsaPage/__tests__/EmptyState.test.tsx`
- `src/pages/MsaPage/__tests__/msa-invoice-placeholder.test.tsx`
- `src/pages/VendorManagementPage/__tests__/vendor-detail-project-managers.test.tsx`
- `src/pages/CollaborationToolPage/__tests__/CommentMark.test.tsx`
- `src/pages/CollaborationToolPage/__tests__/DocumentViewer.test.tsx`
- `src/pages/CollaborationToolPage/__tests__/VersionHistoryModal.test.tsx`
- `src/hooks/__tests__/useUserRole.test.tsx`

## CI Hooks (`package.json` scripts)

```text
test                 playwright test                       # default = all Playwright specs
test:contract        playwright test src/pages/ContractManagementPage/__tests__/
test:admin           playwright test src/pages/AdminManagementPage/__tests__/
test:evaluation      playwright test src/pages/EvaluationManagementPage/__tests__/
test:vendor          playwright test src/pages/VendorManagementPage/__tests__/
test:project         playwright test src/pages/ProjectManagementPage/__tests__/
test:reports         playwright test src/pages/ReportsPage/__tests__/
test:settings        playwright test src/pages/SettingsPage/__tests__/
test:companies       node src/pages/CompaniesPage/__tests__/run-tests.cjs
test:all-features    runs companies + admin + evaluation + vendor + project + contract + reports + settings
test:headed          playwright test --headed
test:ui              playwright test --ui
test:debug           playwright test --debug
test:report          playwright show-report
```

There is **no top-level `vitest` script** — run vitest directly via `pnpm exec vitest` or `pnpm vitest <file>`. CI flips `process.env.CI`, which enables `forbidOnly`, sets `retries: 2`, and forces `workers: 1` in `playwright.config.ts:20-24`.

No coverage thresholds are configured.

## Test Patterns

### Vitest + RTL component test

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/ui/DocumentViewer", () => ({ DocumentViewer: () => null }));

describe("InvoiceTable", () => {
  it("uses an invoice-specific search placeholder", async () => {
    const { default: InvoiceTable } = await import("../components/InvoiceTable");
    render(
      <InvoiceTable
        contractId="c-1"
        pagination={{ pageIndex: 0, pageSize: 10 }}
        setPagination={vi.fn() as any}
        rows={[]}
      />,
    );
    expect(screen.getByPlaceholderText("Search invoices")).toBeInTheDocument();
  }, 20000);
});
```

Source: `src/pages/ContractManagementPage/__tests__/invoice-table.test.tsx:1-29`.

Conventions:
- Use **dynamic `import()`** inside `it` when the component touches modules you've just `vi.mock`ed — guarantees the mock is registered before evaluation.
- Always import `@testing-library/jest-dom/vitest` (or rely on the global setup) before asserting `.toBeInTheDocument()`.
- Pass a generous timeout (`20000`) to tests that render heavy trees (DataTable, Yoopta, react-pdf).

### Playwright unit-style (pure function)

```ts
import { test, expect } from "@playwright/test";
import { getHoldbackStatusBadgeProps } from "../lib/holdbacks";

test.describe("holdbacks status badge helper", () => {
  test("maps known statuses to label + className", () => {
    expect(getHoldbackStatusBadgeProps("pending")).toEqual({
      label: "Pending",
      className: "bg-[#FEF9C3] text-[#CA8A04] hover:bg-[#FEF9C3]",
    });
  });
});
```

Source: `src/pages/ContractManagementPage/__tests__/holdbacks-status-badge.unit.spec.ts:1-33`.

These don't open a page; they just exercise the function. They're the cheapest way to lock badge palettes, URL builders, and DTO mappers.

### Playwright e2e — auth seeding + API mocking

E2E specs **bypass the login flow** by pre-seeding Zustand's `auth` slice into `localStorage` via `page.addInitScript`, then **mock the API** with `page.route`. Always shape the user payload to match `useUserRole` expectations (`role.name` is the discriminator).

```ts
import { test, expect, Page } from "@playwright/test";

type SeedRole = "vendor" | "procurement" | "contract_manager" | "approver" | "view_only";

async function seedAuth(page: Page, role: SeedRole) {
  const now = new Date().toISOString();
  const auth = {
    state: {
      user: {
        _id: "test-user",
        email: "test@swiftpro.com",
        name: "Test User",
        role: { _id: "role-1", name: role, __v: 0 },
        companyId: { name: "Test Co", _id: "company-1" },
        currency: "CAD",
        createdAt: now, updatedAt: now,
        status: "active",
        module: { contractManagement: true, /* ...other module flags */ },
        isAi: false, isDeleted: false,
        contactEmail: "test@swiftpro.com",
      },
      token: "test-token",
      refresh: null,
      authorities: [],
    },
    version: 0,
  };
  await page.addInitScript((raw: string) => {
    window.localStorage.setItem("auth", raw);
  }, JSON.stringify(auth));
}

async function mockContractManagerEndpoints(page: Page) {
  await page.route("**/contract/manager/contracts/stats", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 200, message: "ok",
        data: { all: 0, draft: 0, pending_approval: 0, active: 0, completed: 0, suspended: 0, expired: 0, terminated: 0 },
      }),
    });
  });
}

test("manager sees empty contracts state", async ({ page }) => {
  await seedAuth(page, "contract_manager");
  await mockContractManagerEndpoints(page);
  await page.goto("/contract-management");
  await expect(page.getByText("No contracts")).toBeVisible();
});
```

Source pattern: `src/pages/ContractManagementPage/__tests__/contract-management.spec.ts:1-77`.

Conventions:
- Match URLs with `**/contract/<role>/...` glob — the dev server proxies to the API host.
- Response envelope is always `{ status, message, data }` — match the real backend shape.
- For role-specific specs, name the role in the URL prefix (`/contract/manager/...` vs `/contract/vendor/...`) — see `CONVENTIONS.md` "Role-Prefix URL Pattern".
- Use `*-real-auth.spec.ts` suffix when the test should log in for real instead of seeding (e.g. `edit-contract-real-auth.spec.ts`, `ade87-vendor-change-comments-real-auth.spec.ts`).
- JIRA-tagged regression specs are named `ade<NN>-<slug>.e2e.spec.ts` and live alongside their feature page.

## Test Data Shapes

- **User object** (for `seedAuth`) must include `_id`, `email`, `name`, `role: { name }`, `companyId: { _id, name }`, `currency`, `module` flags, and timestamp fields.
- **API envelope**: `{ status: number, message: string, data: ... }` everywhere. Lists return `data: { items: [...], total: N }` or `data: [...]` depending on endpoint — match the real route's shape.
- **MSA list endpoint** returns `id`, not `_id` (memory: `project_msa_list_id_shape.md`). Mock accordingly.
- **File-comment** GETs return `data.comments` (plural) with server `_id` (memory: `project_file_comment_api_shape.md`).
- **Compliance/Security** APIs return `data.details`, not `data.items` (memory: `project_compliance_api_shape.md`).

## Mocking Approach

- **Module-level mocks** (component/unit tests): `vi.mock("@/path")` at top of file. Mock heavy/IO-bound dependencies (DocumentViewer, Yoopta editor, react-pdf workers) to keep jsdom fast.
- **Network mocks** (e2e): `page.route(urlGlob, handler)`. Group related routes into per-role helpers (`mockContractManagerEndpoints`, `mockVendorEndpoints`, …) and call them from each test's setup.
- **Auth mocks**: always `seedAuth(page, role)` before `page.goto`, never via UI login (except in `*-real-auth.spec.ts`).
- **Time**: use `vi.useFakeTimers()` / `vi.setSystemTime()` in vitest; Playwright relies on real time but you can pin via mocked API responses.

## Anti-Patterns

- ❌ Don't read `file.size` in tests asserting upload payloads — assert the string from `res.data.data[0].size`.
- ❌ Don't assert `isVendor` paths without also asserting the `project_manager` branch — the contract guard is `isContractVendorLike = isVendor || isProjectManager`.
- ❌ Don't add new `.test.tsx` files expecting Playwright to pick them up — they only run under vitest.
- ❌ Don't rely on global fetch mocks — there is no MSW layer; mock per-test.

---

*Testing analysis: 2026-05-17*
