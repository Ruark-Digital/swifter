# QA #78 Increment 2 — PM Take-Over + PL/CM Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a Vendor PM request to take over another PM's contract from the "All Contracts" tab, and let a CM/PL approve or reject that request from the contract detail page, so the company retains control.

**Architecture:** The take-over is a request→approve workflow the backend already supports. A PM self-assigns via `POST /contract/vendor/contracts/{id}/project-managers/{pmId}/assign` (no body; `pmId` = the PM's own id) which creates a **pending** `projectManager` assignment. A CM/PL then approves/rejects via `POST /contract/manager/contracts/{id}/project-manager/approval` with `{action, reason?}`. The detail page already has PM-accepts-contract approval scaffolding (`showApprovalActions`, `approvalMutation`, a reason `Dialog`) gated on `contract.status === "pending_approval"`; this increment adds a **separate** CM/PL take-over-approval affordance gated on a pending `projectManager.status` on a non-`pending_approval` contract.

**Tech Stack:** React, TypeScript, @tanstack/react-query, shadcn Dialog/ConfirmAlert, Playwright + Vitest.

## Global Constraints

- Base API prefix `/contract/...`; query keys via `useUserQueryKey`.
- Real verify gate: **`npx tsc -b`** + **`npm run lint`** (NOT `tsc --noEmit -p tsconfig.json` — that's a no-op here). `noUnusedLocals` + eslint `no-unused-vars --max-warnings 0`.
- Reject requires a non-empty `reason` (BE: "Required when action is rejected.").
- Take-over trigger appears ONLY on non-owned rows (`owner === false`) of the PM's "All Contracts" tab. Owner rows never show it.
- Reuse the existing detail-page reason dialog / `approvalMutation` pattern; do NOT add a parallel dialog system.
- Per-row dialog state in `VendorContractsTable` must NOT live inside the `openMenuRowId` `useMemo` (remount trap, commit `f5ac77c96`) — lift a single table-level dialog keyed by contractId instead.
- Scope: regular contracts, `isProjectManager` (requester) + `isManager`/CM/PL (approver). MSA take-over is a later pass.

---

### Task 1: Live verification spike (reversible) — pin the take-over state transition

**Goal:** Confirm the exact backend behavior the UI gating depends on. No app code in this task.

**Preconditions:** A second PM account for the same vendor, and at least one contract owned by a *different* PM than the test PM (so `owner === false` exists). If unavailable, STOP and report — the rest of the plan needs this test data.

- [ ] **Step 1:** As the test PM, `GET /contract/vendor/contracts` and find a row with `owner === false`. Record `contractId`.
- [ ] **Step 2:** `POST /contract/vendor/contracts/{contractId}/project-managers/{ownPmId}/assign` (no body; `ownPmId` from `useUser().projectmanagerId` / the PM's id). Record response.
- [ ] **Step 3:** `GET /contract/vendor/contracts/{contractId}` and record `contract.status` and `projectManager.status` + `projectManager.user` shape. **Question to answer:** does `projectManager.status` become `"pending"` while `contract.status` stays active/publish (NOT flipped to `pending_approval`)?
- [ ] **Step 4:** As CM, `GET /contract/manager/contracts/{contractId}` — confirm the pending `projectManager` is visible to the manager, and record where the requester name lives in the nested `projectManager.user` shape.
- [ ] **Step 5 (revert):** As CM, `POST /contract/manager/contracts/{contractId}/project-manager/approval` with `{action:"rejected", reason:"spike revert"}`. Confirm `projectManager.status` returns to a non-pending state (no permanent reassignment).
- [ ] **Step 6:** Write findings to `docs/superpowers/plans/qa78-inc2-spike-findings.md`: the exact `contract.status` + `projectManager.status` values during pending, the requester-name path, and confirm the gating condition for Task 4 (below). Commit.

**Findings feed Task 4's gating condition.** Default assumption if spike confirms: take-over pending = `projectManager.status === "pending"` AND `contract.status !== "pending_approval"`.

---

### Task 2: API methods — request take-over + approve/reject assignment

**Files:**
- Modify: `src/pages/ContractManagementPage/api/vendorApi.ts`
- Modify: `src/pages/ContractManagementPage/api/contractManagerApi.ts`
- Test: `src/pages/ContractManagementPage/__tests__/qa78-takeover-api.unit.spec.ts`

**Interfaces:**
- Produces: `vendorApi.requestContractTakeOver(contractId: string, projectManagerId: string): Promise<{data: unknown}>` → `POST /contract/vendor/contracts/{contractId}/project-managers/{projectManagerId}/assign`.
- Produces: `contractManagerApi.approveProjectManagerAssignment(contractId: string, payload: { action: "approved" | "rejected"; reason?: string }): Promise<{data: unknown}>` → `POST /contract/manager/contracts/{contractId}/project-manager/approval`.

- [ ] **Step 1: Write failing unit test** (mirror `approver-api.unit.spec.ts` — mock the `client`/request fns, assert URL + payload):

```ts
import { describe, it, expect, vi } from "vitest";
// import the factory or the concrete api per approver-api.unit.spec.ts's pattern
it("requestContractTakeOver posts to the vendor assign endpoint", async () => {
  const post = vi.fn().mockResolvedValue({ data: { message: "ok" } });
  const api = makeVendorApi({ get: vi.fn(), post, put: vi.fn(), delete: vi.fn(), patch: vi.fn() });
  await api.requestContractTakeOver("c1", "pm1");
  expect(post).toHaveBeenCalledWith({
    url: "/contract/vendor/contracts/c1/project-managers/pm1/assign",
  });
});
it("approveProjectManagerAssignment posts action + reason", async () => {
  const post = vi.fn().mockResolvedValue({ data: { message: "ok" } });
  const api = makeContractManagerApi({ get: vi.fn(), post, put: vi.fn(), delete: vi.fn(), patch: vi.fn() });
  await api.approveProjectManagerAssignment("c1", { action: "rejected", reason: "no" });
  expect(post).toHaveBeenCalledWith({
    url: "/contract/manager/contracts/c1/project-manager/approval",
    payload: { action: "rejected", reason: "no" },
  });
});
```

(Match the exact factory/export names used by `approver-api.unit.spec.ts`; if the api is a singleton not a factory, follow that file's mocking approach.)

- [ ] **Step 2: Run test to verify it fails.** `npx vitest run src/pages/ContractManagementPage/__tests__/qa78-takeover-api.unit.spec.ts` → FAIL (methods undefined).

- [ ] **Step 3: Implement.** In `vendorApi.ts`, in the factory object, add (using the existing `VENDOR_CONTRACTS_PREFIX` constant — match the file's actual constant name):

```ts
    requestContractTakeOver: async (contractId: string, projectManagerId: string) =>
      client.post({
        url: `${VENDOR_CONTRACTS_PREFIX}/${contractId}/project-managers/${projectManagerId}/assign`,
      }),
```

In `contractManagerApi.ts`, add (using `MANAGER_CONTRACTS_PREFIX`):

```ts
    approveProjectManagerAssignment: async (
      contractId: string,
      payload: { action: "approved" | "rejected"; reason?: string },
    ) =>
      client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/project-manager/approval`,
        payload,
      }),
```

- [ ] **Step 4: Run test to verify it passes.** Same command → PASS.
- [ ] **Step 5: `npx tsc -b` + `npm run lint` clean. Commit.** `git commit -m "feat(qa78): take-over request + PM-assignment approval api methods"`

---

### Task 3: "Request take-over" action on the All Contracts tab

**Files:**
- Modify: `src/pages/ContractManagementPage/components/VendorContractsTable.tsx`
- Modify: `src/pages/ContractManagementPage/index.tsx` (pass `enableTakeOver` to the All-tab table + wire the mutation)
- Test: `src/pages/ContractManagementPage/__tests__/qa78-takeover-request.spec.ts`

**Interfaces:**
- Consumes: `vendorApi.requestContractTakeOver` (Task 2), `useUser().projectmanagerId`, `VendorContractRow.isOwner` (Increment 1).
- Adds prop: `VendorContractsTable` gains `onRequestTakeOver?: (contractId: string) => void` and `enableTakeOver?: boolean`.

- [ ] **Step 1: Write the failing Playwright test** (harness from `qa78-pm-contract-tabs.spec.ts`; role `project_manager`). Mock `/contract/vendor/contracts` to return one `owner:false` row; assert a "Request take-over" menu item appears for it, clicking it (and confirming) POSTs to `**/project-managers/**/assign`:

```ts
test("PM can request take-over on a non-owned All-tab contract", async ({ page }) => {
  await seedAuth(page, "project_manager"); // seedAuth sets projectmanagerId
  // route: /contract/vendor/contracts -> [{ id:"c1", contractId:"CT-1", title:"Other PM Contract", status:"publish", owner:false }]
  // route: /contract/vendor/contracts/me -> []
  // route: /contract/vendor/contracts/stats -> zeros
  let assignHit = false;
  await page.route("**/project-managers/**/assign", (r) => { assignHit = true; r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "ok" }) }); });
  await page.goto("/dashboard/contract-management");
  await page.getByTestId("vendor-contract-actions-dropdown").first().click();
  await page.getByRole("menuitem", { name: /request take-?over/i }).click();
  await page.getByRole("button", { name: /^Submit$|^Confirm$|^Request$/ }).click();
  await expect.poll(() => assignHit).toBe(true);
});
```

- [ ] **Step 2: Run → FAIL** (no take-over menu item). `npx playwright test .../qa78-takeover-request.spec.ts --project=chromium`

- [ ] **Step 3: Implement the action cell.** In `VendorContractsTable.tsx`, add a single table-level dialog state (NOT per-row, to avoid the `openMenuRowId` remount trap):

```tsx
const [takeOverId, setTakeOverId] = React.useState<string | null>(null);
```

In `buildActionsColumn`, accept `enableTakeOver` + `onOpenTakeOver` and render a second `DropdownMenuItem` only when `enableTakeOver && row.original.isOwner === false`:

```tsx
{enableTakeOver && row.original.isOwner === false && (
  <DropdownMenuItem
    data-testid="vendor-request-takeover"
    onClick={() => onOpenTakeOver(row.original.id)}
  >
    Request take-over
  </DropdownMenuItem>
)}
```

Render ONE `ConfirmAlert` at the table root, driven by `takeOverId`:

```tsx
<ConfirmAlert
  open={Boolean(takeOverId)}
  onClose={(o) => !o && setTakeOverId(null)}
  type="info"
  title="Request take-over"
  text="Request to take over this contract? A Contract Manager or Procurement Lead must approve before it becomes yours."
  primaryButtonText="Request"
  secondaryButtonText="Cancel"
  primaryButtonLoading={/* pass from parent */ isRequestingTakeOver}
  onPrimaryAction={() => { if (takeOverId) onRequestTakeOver?.(takeOverId); }}
  onSecondaryAction={() => setTakeOverId(null)}
/>
```

Thread `enableTakeOver`, `onRequestTakeOver`, `isRequestingTakeOver` through `VendorContractsTableProps` and into `tableColumns` (add `enableTakeOver` to the `useMemo` deps; `takeOverId` stays local state, not a column dep).

- [ ] **Step 4: Wire the mutation in `index.tsx`.** Add a mutation calling `vendorApi.requestContractTakeOver(contractId, user.projectmanagerId)`; on success toast "Take-over request sent for approval" + `queryClient.invalidateQueries` for `pm-contracts`/`vendor-contracts`; on error toast. Pass `enableTakeOver` (true only on the All tab's `<VendorContractsTable>`), `onRequestTakeOver={(id) => takeOverMutation.mutate(id)}`, and `isRequestingTakeOver={takeOverMutation.isPending}`. Close the dialog in the mutation's `onSettled` via a state callback.

- [ ] **Step 5: Run test → PASS. `tsc -b` + `npm run lint` clean. Commit.** `git commit -m "feat(qa78): PM request take-over action on All Contracts tab"`

---

### Task 4: CM/PL take-over approve/reject on the contract detail page

**Files:**
- Modify: `src/pages/ContractManagementPage/ContractDetailPage.tsx`
- Test: `src/pages/ContractManagementPage/__tests__/qa78-takeover-approval.spec.ts`

**Interfaces:**
- Consumes: `contractManagerApi.approveProjectManagerAssignment` (Task 2); Task 1's confirmed gating condition.

- [ ] **Step 1: Write the failing Playwright test** (role `contract_manager`; mock manager contract detail to return `projectManager.status:"pending"` on a `publish` contract). Assert a "Take-over request" section with Approve/Reject renders; Reject opens a reason field and requires it; Approve POSTs `{action:"approved"}` to `**/project-manager/approval`.

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement.** Add, near `canProjectManagerApprove` (line ~274):

```tsx
// Take-over approval is distinct from the PM-accepts-contract flow: it applies
// to a pending projectManager assignment on an already-live contract (not a
// freshly created pending_approval one), and only a CM/PL approves it.
const takeOverPending =
  contractData?.projectManager?.status === "pending" &&
  contractData?.status !== "pending_approval"; // confirm exact condition from Task 1 findings
const canApproveTakeOver = isManager && isContractOwner && takeOverPending;
```

Add a dedicated approval section (mirroring `showApprovalActions` block at line 494) shown when `canApproveTakeOver`, labelled "Take-over request from {requesterName}" where `requesterName` reads the nested path confirmed in Task 1 (e.g. `projectManager.user.user?.name ?? projectManager.user.name`). Reuse the existing reason `Dialog` (line 657) — add a second mutation `takeOverApprovalMutation` calling `contractManagerApi.approveProjectManagerAssignment(id, { action, reason: comment })`, with reject requiring non-empty `comment`. On success: toast + invalidate the detail query key.

- [ ] **Step 4: Run test → PASS. `tsc -b` + `npm run lint` clean. Commit.** `git commit -m "feat(qa78): CM/PL take-over approve/reject on contract detail"`

---

## Out of scope
- MSA take-over (later pass; MSA approval endpoint `/manager/msa-contracts/{id}/project-manager/approval` exists).
- The dashboard "My Action" feed notification to CM/PL — BE-emitted; FE just renders the existing feed.
- Per-row "Pending take-over" badge on the list (list DTO has no `projectManager.status`).

## Self-Review
- **Spec coverage:** requester take-over (Task 3), CM/PL approval w/ required reject reason (Task 4), api layer (Task 2), behavior confirmation (Task 1). ✔
- **Placeholder scan:** Task 1 is a spike whose findings parameterize Task 4's one gating condition — flagged explicitly, not a hidden TODO. API constant names (`VENDOR_CONTRACTS_PREFIX`/`MANAGER_CONTRACTS_PREFIX`) must be matched to the files' actual names during Task 2. ✔
- **Type consistency:** `requestContractTakeOver(contractId, projectManagerId)` and `approveProjectManagerAssignment(contractId, {action, reason?})` used identically in Tasks 2/3/4. `enableTakeOver`/`onRequestTakeOver`/`isRequestingTakeOver` prop names consistent across Task 3. ✔
