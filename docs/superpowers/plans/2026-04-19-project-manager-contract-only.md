# Project Manager Contract-Only Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users with `user.role.name = "project_manager"` can access only Contract Management (including MSA) and Profile, and are blocked from other dashboard modules/routes.

**Architecture:** Introduce `project_manager` as a first-class `UserRole`, give it a minimal navigation config, enforce a dashboard route allowlist, and treat `project_manager` as “contract-vendor-like” only inside Contract Management pages for endpoint selection and action gating.

**Tech Stack:** React + TypeScript, React Router, @tanstack/react-query, local role helpers (`useUserRole`), navigation config (`lib/navigation`).

---

## Files & Responsibilities

- Modify: `src/types.ts`
  - Add `"project_manager"` to the `UserRole` union.
- Modify: `src/hooks/useUserRole.ts`
  - Expose `isProjectManager` boolean (do not alias to `isVendor`).
- Modify: `src/lib/navigation.ts`
  - Add `project_manager` navigation: Contract Management (+ MSA) and Profile only.
  - Ensure `getFirstAccessibleRoute("project_manager")` points to `/dashboard/contract-management`.
- Modify: `src/config/dashboardConfig.ts`
  - Add a `project_manager` entry so `getDashboardConfig(userRole)` remains exhaustive.
- Modify: `src/layouts/Dashboard.tsx`
  - Add runtime enforcement: if role is `project_manager` and path is outside allowlist, redirect to `/dashboard/contract-management`.
- Modify (contract module only): `src/pages/ContractManagementPage/**`
  - Define `isContractVendorLike = isVendor || isProjectManager` per page/tab and use it for:
    - basePath selection (`/contract/vendor/...` vs manager/approver paths)
    - vendor-only action buttons (create invoice, submit LEM, etc.)
    - contract fetch API selection (use `vendorApi` for project managers)
    - vendor tab whitelist selection where needed

---

### Task 1: Add `project_manager` role support

**Files:**
- Modify: `src/types.ts`
- Modify: `src/hooks/useUserRole.ts`

- [ ] Step 1: Extend `UserRole` union to include `"project_manager"`.
- [ ] Step 2: Add `isProjectManager` flag in `useUserRole()` and export it.
- [ ] Step 3: Run TypeScript check and fix any exhaustiveness issues triggered by the new role.

---

### Task 2: Restrict navigation and default redirect for project managers

**Files:**
- Modify: `src/lib/navigation.ts`
- Modify: `src/routes/PublicRoute.tsx` (only if needed for typing/redirect)

- [ ] Step 1: Add `project_manager` key to role navigation map.
- [ ] Step 2: Ensure first accessible route for project managers is Contract Management.

---

### Task 3: Enforce dashboard allowlist for project managers

**Files:**
- Modify: `src/layouts/Dashboard.tsx`

- [ ] Step 1: Add route allowlist for `project_manager`:
  - Allow: `/dashboard`, `/dashboard/contract-management`, `/dashboard/contract-management/*`, `/dashboard/msa`, `/dashboard/msa/*`, `/dashboard/profile`
  - Redirect `/dashboard` to `/dashboard/contract-management`
  - Redirect any other dashboard route to `/dashboard/contract-management`

---

### Task 4: Contract module treats project managers as vendor-like (only here)

**Files (expected):**
- Modify: `src/pages/ContractManagementPage/index.tsx`
- Modify: `src/pages/ContractManagementPage/ContractDetailPage.tsx`
- Modify: `src/pages/ContractManagementPage/layouts/*TabContent.tsx` where `isVendor` selects vendor base paths
- Modify: `src/pages/ContractManagementPage/layouts/OverviewTab.tsx` (vendor view gating)
- Modify: `src/pages/ContractManagementPage/components/CreateChangeDialog.tsx` (if needed)

- [ ] Step 1: In contract list/detail, treat `project_manager` as vendor-like for vendor endpoints.
- [ ] Step 2: In each tab that selects `basePath` via `isVendor`, update to use `isContractVendorLike`.
- [ ] Step 3: Update vendor-only actions in contract module (create invoice, submit LEM, etc.) to allow `project_manager`.

---

### Task 5: Verify

- [ ] Step 1: Run repo typecheck/lint/test scripts (whatever exists) and ensure no TypeScript errors.
- [ ] Step 2: Manually sanity-check key navigation flows:
  - As `project_manager`, sidebar shows only Contract Management (+ MSA) and Profile.
  - Visiting `/dashboard/solicitation` redirects to `/dashboard/contract-management`.
  - Contract pages load using vendor endpoints for project managers.

