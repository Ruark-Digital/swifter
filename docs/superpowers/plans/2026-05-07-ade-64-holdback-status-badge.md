# ADE-64 Holdback Status Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In Holdback Details, show the status badge based on the holdback detail API response (not a hard-coded “Pending”), with consistent styling across the holdback table and details sheet.

**Architecture:** Extract a small shared status→badge mapping helper and reuse it in both the holdback list table (Payment Summary) and the holdback details sheet. Keep logic centralized and UI-only (no API changes).

**Tech Stack:** React, TypeScript, TanStack Table, Tailwind utility classes, Playwright tests.

---

## File Map

**Create**
- `src/pages/ContractManagementPage/lib/holdbacks.ts` (shared status label + styles)

**Modify**
- `src/pages/ContractManagementPage/layouts/PaymentSummaryTabContent.tsx` (reuse shared helper for holdback table status cell)
- `src/pages/ContractManagementPage/components/HoldbackDetailsSheet.tsx` (derive status badge from API response)

**Test**
- `src/pages/ContractManagementPage/__tests__/holdbacks-status-badge.unit.spec.ts` (new unit test for helper)
- `src/pages/ContractManagementPage/__tests__/holdback-details-status.e2e.spec.ts` (new Playwright E2E test for details sheet)

---

### Task 1: Add shared holdback status helper (RED → GREEN)

**Files:**
- Create: `src/pages/ContractManagementPage/lib/holdbacks.ts`
- Test: `src/pages/ContractManagementPage/__tests__/holdbacks-status-badge.unit.spec.ts`

- [ ] **Step 1: Write failing tests for status mapping**

```ts
import { test, expect } from "@playwright/test";
import { getHoldbackStatusBadgeProps } from "../lib/holdbacks";

test.describe("holdbacks status badge helper", () => {
  test("maps known statuses to label + className", () => {
    expect(getHoldbackStatusBadgeProps("pending")).toEqual({
      label: "Pending",
      className: "bg-[#FEF9C3] text-[#CA8A04]",
    });

    expect(getHoldbackStatusBadgeProps("approved")).toEqual({
      label: "Approved",
      className: "bg-[#EAF7EE] text-[#16A34A]",
    });

    expect(getHoldbackStatusBadgeProps("rejected")).toEqual({
      label: "Rejected",
      className: "bg-[#FEE2E2] text-[#DC2626]",
    });
  });

  test("handles missing/unknown status safely", () => {
    expect(getHoldbackStatusBadgeProps(undefined)).toEqual({
      label: "—",
      className: "bg-[#F3F4F6] text-[#6B7280]",
    });

    expect(getHoldbackStatusBadgeProps("something_new")).toEqual({
      label: "Something New",
      className: "bg-[#F3F4F6] text-[#6B7280]",
    });
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
pnpm test:contract src/pages/ContractManagementPage/__tests__/holdbacks-status-badge.unit.spec.ts --project=chromium
```

Expected: FAIL because `getHoldbackStatusBadgeProps` does not exist yet.

- [ ] **Step 3: Implement minimal helper**

```ts
type HoldbackStatusBadgeProps = { label: string; className: string };

const normalizeLabel = (value: string) =>
  value
    .trim()
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const getHoldbackStatusBadgeProps = (
  status?: string | null,
): HoldbackStatusBadgeProps => {
  const raw = typeof status === "string" ? status.trim() : "";
  const normalized = raw.toLowerCase();

  if (!raw) {
    return { label: "—", className: "bg-[#F3F4F6] text-[#6B7280]" };
  }

  if (normalized === "approved") {
    return { label: "Approved", className: "bg-[#EAF7EE] text-[#16A34A]" };
  }
  if (normalized === "pending") {
    return { label: "Pending", className: "bg-[#FEF9C3] text-[#CA8A04]" };
  }
  if (normalized === "rejected") {
    return { label: "Rejected", className: "bg-[#FEE2E2] text-[#DC2626]" };
  }

  return {
    label: normalizeLabel(raw),
    className: "bg-[#F3F4F6] text-[#6B7280]",
  };
};
```

- [ ] **Step 4: Re-run the test to confirm it passes**

Run:
```bash
pnpm test:contract src/pages/ContractManagementPage/__tests__/holdbacks-status-badge.unit.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ContractManagementPage/lib/holdbacks.ts src/pages/ContractManagementPage/__tests__/holdbacks-status-badge.unit.spec.ts
git commit -m "feat(contract): add holdback status badge helper"
```

---

### Task 2: Use shared helper in Holdback Details (RED → GREEN)

**Files:**
- Modify: `src/pages/ContractManagementPage/components/HoldbackDetailsSheet.tsx`
- Test: `src/pages/ContractManagementPage/__tests__/holdback-details-status.e2e.spec.ts`

- [ ] **Step 1: Write a Playwright E2E test that opens Holdback Details and asserts badge**

Create:

```tsx
import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    const auth = {
      state: {
        user: {
          _id: "manager-user",
          email: "manager@swiftpro.com",
          name: "Manager User",
          role: { _id: "role-1", name: "contract_manager", __v: 0 },
          companyId: { name: "Test Co", _id: "company-1" },
          status: "active",
        },
        token: "test-token",
        refresh: null,
      },
      version: 0,
    };
    window.localStorage.setItem("auth", JSON.stringify(auth));
  });
}

test.describe("Holdback Details status badge", () => {
  test("renders status from API detail", async ({ page }) => {
    await seedAuth(page);

    await page.route("**/contract/manager/contracts/payment-holdbacks/HB-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: {
            _id: "HB-1",
            contract: "c1",
            contractRefModel: "Contract",
            company: "company-1",
            amount: 1000,
            holdBackId: "HB-1",
            type: "full",
            status: "rejected",
            approvedBy: "approver-1",
            description: "Test holdback",
            releasedDate: "2026-05-01T00:00:00Z",
            files: [],
            __v: 0,
          },
        }),
      });
    });

    await page.goto(`${BASE_URL}/dashboard/contract-management/c1`);

    // The Payment Summary UI opens HoldbackDetailsSheet via "View" in Holdback Release table.
    // If the app route/layout changes, update these selectors to match the current UI.
    const paymentSummaryTab = page.getByRole("tab", { name: /payment summary/i });
    await expect(paymentSummaryTab).toBeVisible({ timeout: 60000 });
    await paymentSummaryTab.click();

    const viewBtn = page.getByRole("button", { name: /^view$/i }).first();
    await expect(viewBtn).toBeVisible({ timeout: 60000 });
    await viewBtn.click();

    await expect(page.getByText("Holdback Details")).toBeVisible({ timeout: 60000 });
    await expect(page.getByText("Rejected")).toBeVisible();
  });
});
```

- [ ] **Step 2: Implement status badge in HoldbackDetailsSheet**

Replace the hard-coded badge block with:
- `const badge = getHoldbackStatusBadgeProps(detail?.status)`
- Render `badge.label` and apply `badge.className` plus existing pill sizing classes.

- [ ] **Step 3: Run tests**

Run:
```bash
pnpm test:contract src/pages/ContractManagementPage/__tests__/holdback-details-status.e2e.spec.ts --project=chromium
```

Expected: PASS. If any unrelated failures, isolate with the targeted test file first.

- [ ] **Step 4: Browser QA**

Manual navigation (or scripted) to verify:
- Payment Summary → Holdback Release table → open any holdback “View”
- Holdback Details shows the correct status badge and styling.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ContractManagementPage/components/HoldbackDetailsSheet.tsx src/pages/ContractManagementPage/__tests__/holdback-details-status.e2e.spec.ts
git commit -m "fix(contract): show holdback status from API"
```

---

### Task 3: Use shared helper in Holdback table (REFACTOR)

**Files:**
- Modify: `src/pages/ContractManagementPage/layouts/PaymentSummaryTabContent.tsx`

- [ ] **Step 1: Replace inline status styling logic**

In the holdback table status column, replace the current local style logic with:
- `const { label, className } = getHoldbackStatusBadgeProps(value)`
- Render the same pill with `className`.

- [ ] **Step 2: Run targeted contract tests**

Run:
```bash
pnpm test:contract src/pages/ContractManagementPage/__tests__/contract-detail-tabs.spec.ts --project=chromium
```

(Or whichever existing contract test suite exercises Payment Summary; adjust based on failures.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/ContractManagementPage/layouts/PaymentSummaryTabContent.tsx
git commit -m "refactor(contract): reuse holdback status badge helper"
```
