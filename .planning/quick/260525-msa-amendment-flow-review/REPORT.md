---
name: msa-amendment-flow-review
description: Per-role user-flow comparison of Amendments tab — MSA vs Contract Management (Contract = expected behavior)
date: 2026-05-25
status: complete
---

# Amendments — MSA vs Contract User-Flow Review

**Audit type:** Read-only static-code comparison. No HTTP calls, no UAT.
**Reference (source of truth):** Contract Management.
**Candidate:** MSA.
**Scope:** Manager, Approver, Vendor/PM (+ View-only where it diverges).
**Dimensions:** Tab visibility · Action gates · Action targets (endpoints/payloads) · **Mutation-side-effect invalidation** · What the user sees.

> Endpoint paths shown as written in source; runtime prefix `/api/v1/dev` per `project_axios_base_url`. Spec verified against `docs/swagger-phase-2.json`.

---

## Files

| Role of file | Contract (expected) | MSA (actual) |
|---|---|---|
| Tab whitelist | [src/pages/ContractManagementPage/ContractDetailPage.tsx:124-172](src/pages/ContractManagementPage/ContractDetailPage.tsx#L124-L172) | [src/pages/MsaPage/MsaDetailPage.tsx:95-158](src/pages/MsaPage/MsaDetailPage.tsx#L95-L158) |
| Tab shell | [src/pages/ContractManagementPage/layouts/AmendmentsTabContent.tsx](src/pages/ContractManagementPage/layouts/AmendmentsTabContent.tsx) (846 lines — shell + `CreateAmendmentDialog`) | [src/pages/MsaPage/layouts/Amendments.tsx](src/pages/MsaPage/layouts/Amendments.tsx) (229 lines — thin reuse) |
| Shared table + details sheet + assign dialog | [src/pages/ContractManagementPage/components/AmendmentsTable.tsx](src/pages/ContractManagementPage/components/AmendmentsTable.tsx) (1317 lines — MSA imports it) | same |
| Shared stats cards | [src/pages/ContractManagementPage/components/AmendmentsStatsCards.tsx](src/pages/ContractManagementPage/components/AmendmentsStatsCards.tsx) (MSA imports it) | same |
| Shared create dialog | `CreateAmendmentDialog` exported from `AmendmentsTabContent.tsx:89` (MSA imports it) | same |

**Architectural posture:** Unlike Compliance, Amendments on MSA does **not** reimplement the table inline. It delegates to the same `AmendmentsTable` Contract uses, and reuses `CreateAmendmentDialog` via the `createPath`/`invalidateQueryKey` override pattern from memory `project_shared_dialog_contract_msa_reuse_pattern`. This means most behavior is at parity by construction — but it also makes one root-cause bug surface on every mutation flow.

---

## Per-Role Tab Visibility

| Role | Contract whitelist | MSA whitelist | Result |
|------|---|---|---|
| Manager | ALL tabs (incl. amendments) | includes `amendments` | ✅ Both see it |
| Vendor / PM | includes `amendments` | includes `amendments` | ✅ Both see it |
| Approver | includes `amendments` | includes `amendments` | ✅ Both see it |
| View-only | includes `amendments` | includes `amendments` | ✅ Both see it |

Tab visibility is at parity for all four roles.

---

## 🚨 ROOT-CAUSE BUG (affects ALL roles on MSA Amendments)

### The shared `AmendmentsTable.tsx` hardcodes Contract query keys in its internal mutation invalidations.

When MSA reuses the component with `useUserQueryKey(["msa-amendments", …])` keys, every mutation's "refresh-the-list" side-effect silently misses, because `queryClient.invalidateQueries({ queryKey: ["contract-amendments", …] })` doesn't match `["msa-amendments", …userId]`.

**Three invalidation sites are affected:**

1. **`AssignApprovalDialog.assignMutation.onSuccess`** ([AmendmentsTable.tsx:371-376](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L371-L376)) —
   ```ts
   queryClient.invalidateQueries({
     queryKey: ["contract-amendments", contractId, basePath],
   });
   queryClient.invalidateQueries({
     queryKey: ["contract-amendments-stats", contractId, basePath],
   });
   ```
2. **`AmendmentDetailsSheet.invalidateAll`** ([AmendmentsTable.tsx:646-654](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L646-L654)) — same two hardcoded keys, called from both `vendorStatusMutation.onSuccess` and `approverActionMutation.onSuccess`.

**On Contract** the parent layout's query keys are `["contract-amendments", …]` ([AmendmentsTabContent.tsx:723-724](src/pages/ContractManagementPage/layouts/AmendmentsTabContent.tsx#L723-L724)). Invalidation matches and lists/stats refetch. ✅

**On MSA** the parent uses `useUserQueryKey(["msa-amendments", …])` ([Amendments.tsx:79-88](src/pages/MsaPage/layouts/Amendments.tsx#L79-L88)). Invalidation misses. ❌

**Observable consequences:**

| Role | Mutation | What user sees on Contract | What user sees on MSA |
|---|---|---|---|
| Vendor / PM | Accept / Reject amendment | List vendor-status updates immediately | List still shows "Pending" — user must refresh |
| Approver | Approve / Reject amendment | List status updates immediately | List still shows "Pending" — user must refresh |
| Manager | Send for Approval (Assign) | List/stats refetch after assignment | List doesn't refetch; manager sees stale "Pending" state and may re-trigger the action |

The detail-sheet itself does update because `detailQueryKey` is wrapped via `useUserQueryKey` consistently ([AmendmentsTable.tsx:583-588](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L583-L588)) — so the user sees the success toast and the updated sheet — but the underlying list/stats on the page behind the sheet stays stale.

**Memory pointer:** `feedback_user_query_key_invalidation` documents this trap class; this is its largest live instance. The 260524 audit noted "the same pattern lurking elsewhere is the documented invalidation no-op trap" but didn't actually trace the shared component's internal invalidations to flag this specific failure.

**Fix shape:** lift the invalidation keys to props on `AmendmentDetailsSheet` and `AssignApprovalDialog` (same shape `CreateAmendmentDialog` already accepts via `listInvalidateQueryKey`/`statsInvalidateQueryKey`). MSA's `Amendments.tsx` already constructs `amendmentsQueryKey`/`statsQueryKey` locally and could pass them down. Contract's parent passes the bare prefix as a default.

---

## MANAGER FLOW

### Tab parent (`Amendments.tsx` vs `AmendmentsTabContent.tsx`)

**Expected (Contract):**
- Stats query enabled for all roles including manager; URL `/contract/manager/contracts/{id}/amendments/stats` ([AmendmentsTabContent.tsx:726-740](src/pages/ContractManagementPage/layouts/AmendmentsTabContent.tsx#L726-L740)).
- Create Amendment button uses `CreateAmendmentDialog` with default `createPath` (`/contract/manager/contracts/{id}/amendments`).

**Actual (MSA):**
- Stats query is **disabled for manager** — `enabled: Boolean(contractId) && !!isActive && !isManager` ([Amendments.tsx:119](src/pages/MsaPage/layouts/Amendments.tsx#L119)).
- `statsBasePath` is **empty string for manager** ([Amendments.tsx:69-77](src/pages/MsaPage/layouts/Amendments.tsx#L69-L77)).
- For manager, MSA **derives stats client-side from the loaded list** via `derivedManagerStats` ([Amendments.tsx:160-166](src/pages/MsaPage/layouts/Amendments.tsx#L160-L166)).
- Create Amendment correctly overrides `createPath` to `/contract/manager/msa-contracts/{id}/amendments` and passes invalidation keys ([Amendments.tsx:192-212](src/pages/MsaPage/layouts/Amendments.tsx#L192-L212)).

### User-flow gaps for manager

- **Stats are derived client-side, not fetched.** Swagger has the manager stats endpoint for MSA: `/manager/msa-contracts/{contractId}/amendments/stats` (plural `msa-contracts`, line 31830 of `docs/swagger-phase-2.json`). Note: this endpoint uses the **plural `msa-contracts` quirk** seen on Invoice (memory `msa-contracts-plural-invoice-approve-quirk`) — it's the second known endpoint where MSA breaks its singular-`msa-contracts` convention. Client-derived stats are bounded by whatever the list query returned and will drift from the true totals as soon as the list endpoint paginates or filters server-side. Wire the stats fetch.
- **Send for Approval (Assign Approval) succeeds but list does not refetch** — root-cause bug above.
- **Approver pool path is hardcoded to Contract shape** — `AssignApprovalDialog` queries `/contract/manager/contracts/${contractId}/approvers` ([AmendmentsTable.tsx:304](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L304)). Swagger has both `/manager/contracts/{id}/approvers` (line 18701) and `/manager/msa-contracts/{id}/approvers` (line 29598). If the BE backs both with the same user pool (likely — approvers are user-level config, not contract-level) this is benign. If not, MSA manager sees the wrong pool. **Worth a one-shot BE check before fixing.**

### Non-gaps (already parity)

- Assign-Approval gate (`!assignApprover && !hasApprovals && isTimeImpact && vendorAccepted`) is identical via shared `AmendmentDetailsSheet` ([AmendmentsTable.tsx:1134-1138](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L1134-L1138)). Memory `feedback_amendment_approve_gate` confirms.
- Create Amendment payload shape (changes[], files[], impact type branching) is shared via `CreateAmendmentDialog`. Memory `project_amendment_detail_data_wiring` covers it.
- Endpoint base-path for the manager list (`/manager/{contracts|msa-contracts}/{id}/amendments` plural for both) is correct.

---

## VENDOR / PM FLOW

### Expected (Contract)

When the amendment detail's `vendorStatus === "pending"`, the sticky footer of `AmendmentDetailsSheet` shows two buttons that follow Pattern A (memory `project_approve_reject_comment_dialog_pattern`):

1. **Reject Amendment** — opens `VendorRejectDialog` with a free-text reason textarea ([AmendmentsTable.tsx:226-284](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L226-L284)).
2. **Accept Amendment** — opens `VendorAcceptDialog`, a confirmation card with no input ([:187-224](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L187-L224)).

Both fire `vendorStatusMutation` → `PATCH ${basePath}/{amendmentId}/status` with `{ status }` ([:656-682](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L656-L682)), then call `invalidateAll`.

### Actual (MSA)

Same shared component, same gate, same mutation, same payload, same dialogs — and same hardcoded invalidation that silently misses on MSA.

### User-flow gaps for vendor/PM

- **Accept and Reject succeed BE-side but list stays stale on MSA** — root-cause bug.
- **`Edit Submission` button on rejected "Other Combination" amendments is a dead button (no `onClick`)** ([AmendmentsTable.tsx:977-986](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L977-L986)) — this is **a parity bug, not a drift**: both Contract and MSA ship the same dead button because they share the component. Worth noting in the MSA review because the user's audit dimensions include vendor flow.
- Endpoint shape matches: `/vendor/msa-contracts/{id}/amendment/{amendmentId}/status` exists in swagger (line 46893). ✅

---

## APPROVER FLOW

### Expected (Contract)

When `detail.approverStatus === "pending"`, the sticky footer shows Approve / Reject buttons following Pattern B (single-dialog flip):

- Click → opens a single `Dialog` with action-aware copy (`Approve Amendment` / `Reject Amendment`), an optional comment textarea, and Confirm Approve / Confirm Reject button styled green/red ([AmendmentsTable.tsx:1033-1125](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L1033-L1125)).
- Fires `approverActionMutation` → `POST ${basePath}/{amendmentId}/approve` with `{ action, comment }` ([:684-713](src/pages/ContractManagementPage/components/AmendmentsTable.tsx#L684-L713)), then calls `invalidateAll`.

### Actual (MSA)

Same shared component, same gate, same mutation, same payload — and same hardcoded invalidation that silently misses on MSA.

### User-flow gaps for approver

- **Approve/Reject succeeds BE-side but list stays stale on MSA** — root-cause bug.
- Endpoint shape matches: `/approver/msa-contracts/{id}/amendment/{amendmentId}/approve` exists (line 13137). ✅
- Memory `feedback_amendment_approve_gate` notes "no /approve/status endpoint" — that memory is **out of date on the schema side** (swagger has `/approver/msa-contracts/{id}/amendment/{amendmentId}/approve/status` at line 13068) but **still correct on the frontend side** (the gate uses `detail.approverStatus`, not a separate status fetch). No action required.

---

## VIEW-ONLY FLOW

Both pages render the tab and the shared table; view-only sees neither vendor-accept/reject nor approver-approve/reject (gates require `isContractVendorLike` or `isApprover`). The Edit Submission dead button and the invalidation root-cause bug don't bite view-only because there are no mutations. Parity, no findings.

---

## Summary Matrix

| Role | Tab visibility | Action gates | Action targets | **Mutation refresh** |
|------|---|---|---|---|
| **Manager** | ✅ | ✅ (Assign-Approval gate shared) | ⚠️ Stats not wired (BE endpoint exists); approver pool path hardcoded to Contract | ❌ Assign-Approval doesn't refetch list |
| **Vendor / PM** | ✅ | ✅ (Accept/Reject Pattern A) + ⚠️ dead Edit Submission button (parity) | ✅ | ❌ Accept/Reject doesn't refetch list |
| **Approver** | ✅ | ✅ (Approve/Reject Pattern B) | ✅ | ❌ Approve/Reject doesn't refetch list |
| **View-only** | ✅ | ➖ N/A (read-only) | ➖ | ➖ |

---

## Fix recommendations (prioritized)

1. **Lift mutation invalidation keys to props on the shared `AmendmentsTable` / `AmendmentDetailsSheet` / `AssignApprovalDialog`** — same shape `CreateAmendmentDialog` already exposes (`listInvalidateQueryKey`, `statsInvalidateQueryKey`, `detailInvalidateQueryKey`). Default to the current Contract-shaped bare keys so Contract behavior is unchanged. MSA's `Amendments.tsx` passes the `useUserQueryKey`-wrapped variants. **Closes the single bug that breaks every MSA Amendments mutation flow.** Highest-impact change.

2. **Wire manager stats fetch for MSA** — endpoint is `/contract/manager/msa-contracts/{contractId}/amendments/stats` (plural `msa-contracts`, second known instance of the plural quirk after Invoice approve). Drop the `!isManager` gate, change `statsBasePath` for manager from `""` to the plural path (or accept a separate `statsBasePath` prop), and drop `derivedManagerStats`. Manager stats then match what the BE actually has.

3. **Verify and (if needed) parameterize the approver-pool path** — `AssignApprovalDialog` line 304 hardcodes `/contract/manager/contracts/${contractId}/approvers`. Confirm via a one-shot HTTP check whether the BE serves the same pool for `/manager/msa-contracts/{id}/approvers`. If yes, leave alone and document. If no, parameterize via prop (`approverPoolPath` or similar).

4. **(Cross-cutting parity)** Wire the `Edit Submission` button's `onClick` — currently dead on Contract and MSA. Not strictly an MSA-vs-Contract drift, but the user's audit dimensions include vendor flow.

---

## Out of scope / non-issues

- Inline reimplementation — Amendments doesn't have this. Architecture is at parity by reuse.
- `CreateAmendmentDialog` invalidations — already correctly parameterized via props; MSA wires them properly (memory `project_shared_dialog_contract_msa_reuse_pattern`).
- Endpoint shape audit — already done in §1 of the parity audit and re-verified against swagger here. No URL drift on MSA Amendments.
- Pattern A / Pattern B comment-dialog flows — shared via `AmendmentsTable`, behaviorally identical.
- Export Report wrapping (`ExportReportSheet contractType="MsaContract"`) — already shipped Wave 4 (`2f8b27204`).
- Memory `feedback_amendment_approve_gate` "no /approve/status endpoint" — out of date on the schema side, but the frontend code doesn't use it either way; no action needed.
