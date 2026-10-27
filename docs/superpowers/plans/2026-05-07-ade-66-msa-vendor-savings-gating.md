# ADE-66 (MSA Payment Summary) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vendor + project manager must not call MSA `payment-savings` endpoints and must not see the Savings sub-tab in MSA Payment Summary.

**Architecture:** Gate both the savings query `enabled` flag and the Savings tab rendering on `isVendorLike` (vendor || project manager). Keep other roles unchanged.

**Tech Stack:** React, TypeScript, TanStack React Query, Playwright.

---

### Task 1: Gate savings query + hide Savings tab for vendor/PM

**Files:**
- Modify: `src/pages/MsaPage/layouts/PaymentSummary.tsx`

- [ ] **Step 1: Add vendor-like gate**

Update role derivation:

```ts
const { isVendor, isProjectManager, isApprover, isViewOnly, isManager } =
  useUserRole();
const isVendorLike = isVendor || isProjectManager;
```

- [ ] **Step 2: Disable the savings query for vendor-like roles**

Update the savings query:

```ts
enabled: Boolean(contractId) && !!isActive && !isVendorLike,
```

- [ ] **Step 3: Hide Savings tab + content for vendor-like roles**

Render `TabsTrigger` and `TabsContent` for savings only when `!isVendorLike`.

- [ ] **Step 4: Run TypeScript check**

Run: `npm run typecheck`
Expected: Pass

---

### Task 2: Add Playwright coverage for vendor/PM (no savings call + no tab)

**Files:**
- Create: `src/pages/MsaPage/__tests__/msa-payment-summary-vendor-savings-gating.spec.ts`

- [ ] **Step 1: Write failing test**

Create a test that:
- Seeds vendor (and optionally project_manager)
- Navigates to an MSA detail page
- Opens Payment Summary
- Asserts:
  - no request contains `/payment-savings`
  - the Savings tab trigger is not present
  - Holdback Release tab trigger is present and can be opened

- [ ] **Step 2: Run Playwright to confirm failure**

Run: `npx playwright test src/pages/MsaPage/__tests__/msa-payment-summary-vendor-savings-gating.spec.ts`
Expected: Fail until gating is implemented.

- [ ] **Step 3: Update test routes/mocks until stable**

Mock:
- MSA detail endpoint used by the page
- payment-holdbacks endpoint used by Payment Summary
- payment-savings endpoint (still mock it, but it should not be called for vendor/PM)

- [ ] **Step 4: Run full Playwright suite (or relevant subset)**

Run: `npx playwright test`
Expected: Pass

---

### Task 3: Manual verification

**Files:**
- No changes

- [ ] **Step 1: Run dev server and spot-check**

Run: `npm run dev`
Check:
- Vendor/PM cannot see the Savings sub-tab on MSA Payment Summary.
- Network panel shows no MSA `payment-savings` request for vendor/PM.

