# QA #78 Increment 1 — Vendor PM All/My Contract Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Vendor PM role an "All Contracts" / "My Contracts" two-tab view on the Contract Management list page, so a PM can see every contract awarded to their vendor (All) alongside the ones assigned to them (My).

**Architecture:** The list page (`ContractManagementPage/index.tsx`) already has a `useVendorContracts(pagination, enabled, asPM)` hook that switches between `/contract/vendor/contracts` (asPM=false, company-wide) and `/contract/vendor/contracts/me` (asPM=true, PM-assigned). Today a PM is rendered a single `/me` table. This increment renders, for `isProjectManager` only, the same two-tab layout the CM already uses — one `VendorContractsTable` per endpoint, each with its own pagination. Plain `isVendor` is unchanged. We also thread the newly-added `owner` field through the vendor data types so Increment 2 (take-over) can consume it.

**Tech Stack:** React, TypeScript, @tanstack/react-query, @tanstack/react-table, shadcn Tabs, Playwright (integration) + Vitest (component) tests.

## Global Constraints

- Base API prefix on this page is `/contract/...` (axios baseURL already includes `/api/v1/dev`).
- Query keys go through `useUserQueryKey([...])`; keep that wrapper.
- This increment is view-only: do NOT add take-over/assign actions (that is Increment 2).
- Scope is regular contracts + `isProjectManager` role only. Do not touch MSA, plain vendor, approver, manager, or view-only branches.
- Follow existing file style; no unrelated refactors.

---

### Task 1: Thread `owner` through the vendor contract data types

**Files:**
- Modify: `src/pages/ContractManagementPage/index.tsx` (`VendorContractApi` type ~83-105; `mapVendorContractsToRows` ~361-385)
- Modify: `src/pages/ContractManagementPage/components/VendorContractsTable.tsx` (`VendorContractRow` type ~16-38)

**Interfaces:**
- Produces: `VendorContractRow.isOwner?: boolean` (consumed by Increment 2); `VendorContractApi.owner?: boolean`.

- [ ] **Step 1: Add `owner` to the API type.** In `index.tsx`, add to `VendorContractApi` (after `vendor?: { name?: string };`):

```ts
  owner?: boolean;
```

- [ ] **Step 2: Add `isOwner` to the row type.** In `VendorContractsTable.tsx`, add to `VendorContractRow` (after `status: ...;` union, before the closing `}`):

```ts
  isOwner?: boolean;
```

- [ ] **Step 3: Map it.** In `index.tsx` `mapVendorContractsToRows`, add `isOwner: c.owner,` to the returned row object (alongside `status: mapVendorStatusToLabel(c.status),`).

- [ ] **Step 4: Typecheck.**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors in `index.tsx` / `VendorContractsTable.tsx`.

- [ ] **Step 5: Commit.**

```bash
git add src/pages/ContractManagementPage/index.tsx src/pages/ContractManagementPage/components/VendorContractsTable.tsx
git commit -m "feat(qa78): thread contract owner flag into vendor row type"
```

---

### Task 2: Add PM tab pagination state + a second/third vendor-contracts query

**Files:**
- Modify: `src/pages/ContractManagementPage/index.tsx` (component body ~388-434)

**Interfaces:**
- Consumes: `useVendorContracts(pagination, enabled, asPM)` (existing).
- Produces: `pmAllContractsData` / `pmAllPagination` (All tab, `/vendor/contracts`), and reuse of the existing `vendorContracts*` call as the PM My tab.

Currently a PM shares the single `useVendorContracts(vendorPagination, isContractVendorLike, isProjectManager)` call (asPM=`isProjectManager` → `/me`). Keep that call as the **My Contracts** source, and add a new call for **All Contracts** (asPM=false), enabled only for PMs.

- [ ] **Step 1: Add All-tab pagination state.** Near the other `React.useState<PaginationState>` declarations (~408-412), add:

```tsx
  const [pmAllPagination, setPmAllPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
```

- [ ] **Step 2: Add the All-tab query.** After the existing `useVendorContracts(...)` call (~427-432), add:

```tsx
  const { data: pmAllContractsData, isLoading: isPmAllContractsLoading } =
    useVendorContracts(pmAllPagination, isProjectManager, false);
```

- [ ] **Step 3: Map its rows.** Where `vendorContractsRows` is derived (search for `mapVendorContractsToRows(`), add alongside it:

```tsx
  const pmAllContractsRows = mapVendorContractsToRows(
    pmAllContractsData?.data?.contracts,
  );
```

- [ ] **Step 4: Typecheck.**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors.

- [ ] **Step 5: Commit.**

```bash
git add src/pages/ContractManagementPage/index.tsx
git commit -m "feat(qa78): add PM all-contracts query + pagination"
```

---

### Task 3: Render two tabs for the PM (keep single table for plain vendor)

**Files:**
- Modify: `src/pages/ContractManagementPage/index.tsx` (the `isContractVendorLike` branch, `VendorContractsTable` render ~498-507)

**Interfaces:**
- Consumes: `pmAllContractsRows`, `isPmAllContractsLoading`, `pmAllPagination`/`setPmAllPagination`, `pmAllContractsData`, and existing `vendorContractsRows` etc.

- [ ] **Step 1: Replace the single-table render with a role split.** Replace the `<VendorContractsTable ... />` block (~498-507) with:

```tsx
          {isProjectManager ? (
            <Tabs
              defaultValue="all"
              className="w-full bg-transparent space-y-4"
              onValueChange={() => setStatusFilter("all")}
            >
              <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
                <TabsTrigger
                  value="all"
                  className="dark:text-slate-400 data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  All Contracts
                </TabsTrigger>
                <TabsTrigger
                  value="mine"
                  className="dark:text-slate-400 data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  My Contracts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <VendorContractsTable
                  rows={pmAllContractsRows}
                  isLoading={isPmAllContractsLoading}
                  totalCount={pmAllContractsData?.data.totalContracts}
                  isReadOnly={isViewOnly}
                  pagination={pmAllPagination}
                  setPagination={setPmAllPagination}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
              </TabsContent>
              <TabsContent value="mine">
                <VendorContractsTable
                  rows={vendorContractsRows}
                  isLoading={isVendorContractsLoading}
                  totalCount={vendorContractsData?.data.totalContracts}
                  isReadOnly={isViewOnly}
                  pagination={vendorPagination}
                  setPagination={setVendorPagination}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <VendorContractsTable
              rows={vendorContractsRows}
              isLoading={isVendorContractsLoading}
              totalCount={vendorContractsData?.data.totalContracts}
              isReadOnly={isViewOnly}
              pagination={vendorPagination}
              setPagination={setVendorPagination}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          )}
```

- [ ] **Step 2: Confirm `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` are imported** (they are — line 10). Build + lint (this task consumes the `pmAll*` identifiers Task 2 introduced, so the branch becomes green here):

Run: `npx tsc -b` then `npm run lint`
Expected: both clean. NOTE: `npx tsc --noEmit -p tsconfig.json` is a **no-op** on this repo (root tsconfig is references-only) — always use `tsc -b` / `npm run lint` as the real gate. The project uses `noUnusedLocals` + eslint `no-unused-vars` with `--max-warnings 0`.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/ContractManagementPage/index.tsx
git commit -m "feat(qa78): render All/My contract tabs for vendor PM"
```

---

### Task 4: Integration test — PM sees both tabs backed by the two endpoints

**Files:**
- Create: `src/pages/ContractManagementPage/__tests__/qa78-pm-contract-tabs.spec.ts`

Follow the existing Playwright harness in `contract-management.spec.ts` (the `seedAuth(page, role)` helper and `page.route(...)` mocking). Use role `project_manager`.

- [ ] **Step 1: Write the failing test.** Mirror `contract-management.spec.ts` setup (copy its imports + `seedAuth`), then:

```ts
test("vendor PM sees All and My contract tabs from the two endpoints", async ({ page }) => {
  await seedAuth(page, "project_manager");

  await page.route("**/contract/vendor/contracts?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: {
          contracts: [
            { id: "c-all-1", contractId: "CT-ALL-1", title: "Company Wide Alpha", status: "active", owner: false },
          ],
          totalContracts: 1,
        },
      }),
    }),
  );
  await page.route("**/contract/vendor/contracts/me?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: {
          contracts: [
            { id: "c-me-1", contractId: "CT-ME-1", title: "Assigned To Me Beta", status: "active", owner: true },
          ],
          totalContracts: 1,
        },
      }),
    }),
  );

  await page.goto("/dashboard/contract-management");

  await expect(page.getByRole("tab", { name: "All Contracts" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "My Contracts" })).toBeVisible();

  // All tab active by default → company-wide contract shown
  await expect(page.getByText("Company Wide Alpha")).toBeVisible();

  // Switch to My Contracts → assigned contract shown
  await page.getByRole("tab", { name: "My Contracts" }).click();
  await expect(page.getByText("Assigned To Me Beta")).toBeVisible();
});
```

- [ ] **Step 2: Run to verify it fails first (before Tasks 2-3 wiring).** If running after implementation, skip. Run:

`npx playwright test src/pages/ContractManagementPage/__tests__/qa78-pm-contract-tabs.spec.ts`
Expected before wiring: FAIL (no "All Contracts" tab for PM). After Tasks 2-3: PASS.

- [ ] **Step 3: Run to verify it passes.**

Run: `npx playwright test src/pages/ContractManagementPage/__tests__/qa78-pm-contract-tabs.spec.ts`
Expected: PASS (2 assertions for tabs, both contracts visible on their tabs).

- [ ] **Step 4: Commit.**

```bash
git add src/pages/ContractManagementPage/__tests__/qa78-pm-contract-tabs.spec.ts
git commit -m "test(qa78): vendor PM All/My contract tabs integration test"
```

---

## Increment 2 (separate plan — pending a live probe)

Increment 2 (self-service take-over + CM/PL approve/reject) is deliberately **not** planned here. Before writing its tasks, run a short live probe (evaluator/PM + CM logins on staging) to confirm:

1. Whether `POST /vendor/contracts/{contractId}/project-managers/{ownId}/assign` sets `projectManager.status = "pending"` (and does NOT immediately assign).
2. Whether the CM/PL take-over approval reuses the same `projectManager.status` track already read on `ContractDetailPage.tsx:270-277` (currently used for the PM-accepts-contract flow gated on `status === "pending_approval"`), or is a separate state.
3. That `POST /manager/contracts/{contractId}/project-manager/approval` `{action, reason?}` transitions that status.

The existing `canProjectManagerApprove` / `approvalMutation` scaffolding on the detail page means Increment 2 likely extends that area rather than adding a parallel one — the probe decides the exact wiring. A separate plan (`2026-07-07-qa78-increment-2-takeover-approval.md`) will be written once the probe resolves these.

## Self-Review

- **Spec coverage:** Increment 1 of the spec (All/My tabs, `owner` threaded, All view-only, plain vendor unchanged, PM-only) — covered by Tasks 1-4. Increment 2 explicitly deferred with a defined gate. ✔
- **Placeholder scan:** none — all steps carry exact code/commands. ✔
- **Type consistency:** `owner` (API) → `isOwner` (row) used consistently across Tasks 1-3; `pmAllContractsData/pmAllPagination/isPmAllContractsLoading` names consistent between Tasks 2 and 3. ✔
