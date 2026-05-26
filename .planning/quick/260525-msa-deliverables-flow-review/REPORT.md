---
name: msa-deliverables-flow-review
description: Per-role user-flow comparison of Deliverables tab — MSA vs Contract Management (Contract = expected behavior)
date: 2026-05-25
status: complete
---

# Deliverables — MSA vs Contract User-Flow Review

**Audit type:** Read-only static-code comparison. No HTTP calls, no UAT.
**Reference (source of truth):** Contract Management.
**Candidate:** MSA.
**Scope:** Manager, Approver, Vendor/PM (+ View-only).
**Dimensions:** Tab visibility · Action gates · Action targets · **Mutation-side-effect invalidation** · Stats layout.

> Endpoint paths shown as written in source; runtime prefix `/api/v1/dev` per `project_axios_base_url`. Spec verified against `docs/swagger-phase-2.json`.

---

## Files

| Role of file | Contract (expected) | MSA (actual) |
|---|---|---|
| Tab whitelist | [src/pages/ContractManagementPage/ContractDetailPage.tsx:124-172](src/pages/ContractManagementPage/ContractDetailPage.tsx#L124-L172) | [src/pages/MsaPage/MsaDetailPage.tsx:95-158](src/pages/MsaPage/MsaDetailPage.tsx#L95-L158) |
| Tab shell | [src/pages/ContractManagementPage/layouts/DeliverablesTabContent.tsx](src/pages/ContractManagementPage/layouts/DeliverablesTabContent.tsx) (178 lines) | [src/pages/MsaPage/layouts/Deliverables.tsx](src/pages/MsaPage/layouts/Deliverables.tsx) (265 lines) |
| Shared table + details sheet + submit dialog | [src/pages/ContractManagementPage/components/DeliverablesTable.tsx](src/pages/ContractManagementPage/components/DeliverablesTable.tsx) (955 lines — MSA imports it) | same |
| Stats cards | `DeliverablesStatsCards` (Contract uses it) | inline `StatCard` |

**Architectural posture:** Same as Amendments — MSA delegates to the shared `DeliverablesTable` rather than reimplementing inline. The `isContractManager` prop drift (audit §4) was shipped Wave 2 in `7feb7ca9d`. So most action-gate parity is preserved by construction. As with Amendments, the interesting drift lives in the shared component's hidden assumptions.

---

## Per-Role Tab Visibility

| Role | Contract whitelist | MSA whitelist | Result |
|------|---|---|---|
| Manager | ALL tabs | includes `deliverables` | ✅ Both see it |
| Vendor / PM | includes `deliverables` | includes `deliverables` | ✅ Both see it |
| Approver | includes `deliverables` | includes `deliverables` | ✅ Both see it |
| View-only | includes `deliverables` | includes `deliverables` | ✅ Both see it |

Parity. All four roles see the tab on both pages.

---

## 🚨 ROOT-CAUSE BUG #1 (SAME pattern as Amendments)

### The shared `DeliverablesTable.tsx` hardcodes Contract list/stats query keys in mutation invalidations.

Two sites:

1. **`SubmitDeliverableDialog.submitMutation.onSuccess`** ([DeliverablesTable.tsx:274-287](src/pages/ContractManagementPage/components/DeliverablesTable.tsx#L274-L287)) — vendor Submit. Invalidates `["deliverables", ...]` + `["deliverables-stats", ...]` + `["deliverable-detail", ...]`.
2. **`DeliverableDetailsSheet.approveRejectMutation.onSuccess`** ([DeliverablesTable.tsx:485-499](src/pages/ContractManagementPage/components/DeliverablesTable.tsx#L485-L499)) — approver/manager Approve/Reject. Same three keys.

**On Contract** the parent layout's list/stats keys are `["deliverables", contractId, basePath]` and `["deliverables-stats", contractId, basePath]` ([DeliverablesTabContent.tsx:65-69](src/pages/ContractManagementPage/layouts/DeliverablesTabContent.tsx#L65-L69) + [:84-88](src/pages/ContractManagementPage/layouts/DeliverablesTabContent.tsx#L84-L88)) — exact match, refetches after every mutation. ✅

**On MSA** the parent uses `useUserQueryKey(["msa-deliverables", ...])` / `useUserQueryKey(["msa-deliverables-stats", ...])` ([Deliverables.tsx:130-131](src/pages/MsaPage/layouts/Deliverables.tsx#L130-L131)) — different prefix + appended userId. Invalidation misses. ❌

The detail-key invalidation **does** work on both pages because `useUserQueryKey` appends userId to the END (verified at [src/hooks/useUserQueryKey.ts](src/hooks/useUserQueryKey.ts)), so React Query's default prefix matching catches `["deliverable-detail", contractId, deliverableId, basePath]` as a prefix of `[..., open, userId]`. List/stats fail because their prefix arrays differ at position 0 (`"deliverables"` vs `"msa-deliverables"`).

**Observable consequences on MSA:**

| Role | Mutation | What user sees on Contract | What user sees on MSA |
|---|---|---|---|
| Vendor / PM | Submit Deliverable | List flips to "Submitted" immediately | List still shows "Pending" — must refresh |
| Approver | Approve / Reject | List status updates immediately | List still shows previous status — must refresh |
| Manager | Approve / Reject | List/stats refresh after action | List doesn't refresh; stats stale |

**Fix shape:** identical to the Amendments fix already shipped in `b7e30180a`. Lift to optional `listInvalidateQueryKey` / `statsInvalidateQueryKey` props on `DeliverablesTable`, `DeliverableDetailsSheet`, and `SubmitDeliverableDialog`. Defaults preserve bare Contract keys.

This is the recurring trap documented in [`feedback_shared_component_hidden_invalidation_keys`](feedback_shared_component_hidden_invalidation_keys.md). Same component class (table + details sheet + action dialog), same fix shape.

---

## 🚨 ROOT-CAUSE BUG #2 — Personnel pool query is hardcoded to Contract path

[DeliverablesTable.tsx:199-204](src/pages/ContractManagementPage/components/DeliverablesTable.tsx#L199-L204):

```ts
const { data: personnelData } = useQuery({
  queryKey: ["deliverable-personnel", contractId],
  queryFn: async () => vendorApi.listPersonnel(contractId),
  ...
});
```

[`vendorApi.listPersonnel`](src/pages/ContractManagementPage/api/vendorApi.ts) hardcodes `url: \`/contract/vendor/contracts/${contractId}/personnel\`` — Contract path only.

Swagger has personnel routes under three shapes (all `/contracts/` plural):
- `/approver/contracts/{contractId}/personnel`
- `/vendor/contracts/{contractId}/personnel`
- `/manager/personnel/contract/{contractId}` (singular `contract`)
- `/manager/personnel` (flat — no contract context)

**No `/msa-contracts/{id}/personnel` route in current swagger.** But memory `project_msa_detail_role_gates_and_rfi` notes the MSA RFI dialog has a working responder multi-select sourced from an MSA personnel endpoint — so the BE likely has *something* MSA-shaped that the memory captured but the local swagger snapshot is missing (per `feedback_audit_findings_need_be_spec_verification`, swagger on disk may lag behind the live spec).

**Observable on MSA vendor's Submit Deliverable dialog:** the "Add Responders" multi-select fetches from the Contract-shaped URL passing an MSA contractId. Likely outcomes:
- BE returns empty list → vendor sees no options, can't add responders, submits without them.
- BE returns 404 → toast error, dialog shows empty options.
- BE returns personnel for some Contract with the same id → wrong data shown.

None of these are correct. **Worth a one-shot BE check before fixing.** Probable fix is to parameterize the personnel endpoint via a prop on `SubmitDeliverableDialog` (or factor out a `usePersonnel(contractId, contractType)` hook), since the personnel concept exists across both contract types.

---

## MANAGER FLOW

### Expected (Contract)

Manager sees Approve / Reject buttons in the detail sheet when ([DeliverablesTable.tsx:445-448](src/pages/ContractManagementPage/components/DeliverablesTable.tsx#L445-L448)):

- `isContractManager === true`
- `detail.approverStatus === "pending"`
- `!isSubmitted` (`detail.submissionStatus !== "submitted"`)

Click → Pattern B single-dialog with optional comment textarea ([:702-771](src/pages/ContractManagementPage/components/DeliverablesTable.tsx#L702-L771)). POSTs `${basePath}/{deliverableId}/approve` with `{ action, comment }` ([:474-484](src/pages/ContractManagementPage/components/DeliverablesTable.tsx#L474-L484)).

Memory confirms the gate is intentionally a single condition: [`project_deliverable_role_scoped_action_gates`](project_deliverable_role_scoped_action_gates.md) — "gate solely on `approverStatus === \"pending\"` for both approver and contract manager; the per-role manager.status variant was tried (`b794726a5`) then reverted on user direction (`cc588af18`, 260523)."

### Actual (MSA)

Identical via shared component. Manager basePath is `/contract/manager/msa-contracts/${contractId}/deliverables` ([Deliverables.tsx:115-116](src/pages/MsaPage/layouts/Deliverables.tsx#L115-L116)) — singular `msa-contracts`, plural `deliverables`. Endpoint shape matches.

### User-flow gaps for manager

- **Approve/Reject succeeds BE-side but list/stats don't refresh on MSA** — root-cause bug #1.

### Non-gaps

- Endpoint shape match.
- `isContractManager` prop is threaded from parent to shared table to details sheet ([Deliverables.tsx:256](src/pages/MsaPage/layouts/Deliverables.tsx#L256)) — the audit §4 drift shipped in Wave 2 (`7feb7ca9d`) is still in place.
- No `Create Deliverable` button on either page — deliverables are seeded elsewhere (contract creation). Parity by design.

---

## APPROVER FLOW

### Expected (Contract)

Same gate, same dialog, same endpoint. Approver and manager share the gate logic (`isApprover || isContractManager`).

### Actual (MSA)

Same shared component, same gate. Approver basePath: `/contract/approver/msa-contracts/${contractId}/deliverables` ([Deliverables.tsx:113-114](src/pages/MsaPage/layouts/Deliverables.tsx#L113-L114)).

### User-flow gaps for approver

- **Approve/Reject succeeds BE-side but list/stats don't refresh on MSA** — same root-cause bug #1.

---

## VENDOR / PM FLOW

### Expected (Contract)

Vendor / PM sees Submit Deliverable button when ([DeliverablesTable.tsx:449-453](src/pages/ContractManagementPage/components/DeliverablesTable.tsx#L449-L453)):

- `isVendor === true` (computed inside the sheet via `basePath.includes("/vendor/")`)
- `!isSubmitted`
- `!hasBeenSubmitted` (`detail.submittedBy && Array.isArray(detail.files) && detail.files.length > 0`)
- `approverStatus !== "N/A"`

The `hasBeenSubmitted` check matches memory [`project_deliverable_submitted_signal`](project_deliverable_submitted_signal.md): "submissionStatus isn't reliably set; use submittedBy && files.length > 0 to gate Submit button."

Click → `SubmitDeliverableDialog` with file uploader + responders multi-select + description. POSTs `${basePath}/{deliverableId}/submit` with `{ description, files: [...], responders: [...] }` ([:265-272](src/pages/ContractManagementPage/components/DeliverablesTable.tsx#L265-L272)).

### Actual (MSA)

Same shared component. Vendor basePath: `/contract/vendor/msa-contracts/${contractId}/deliverables` ([Deliverables.tsx:111-112](src/pages/MsaPage/layouts/Deliverables.tsx#L111-L112)). The `isVendor` string-match check (`basePath.includes("/vendor/")`) still works for MSA because the substring is present.

### User-flow gaps for vendor/PM

- **Submit succeeds BE-side but list/stats don't refresh on MSA** — root-cause bug #1.
- **Add Responders multi-select likely empty or wrong on MSA** — root-cause bug #2 (hardcoded Contract personnel path).

---

## VIEW-ONLY FLOW

Sees the tab and the table. No Submit / Approve / Reject buttons — gates require vendor/approver/manager. Both pages identical. No findings.

---

## Stats layout drift

| Metric | Contract | MSA |
|---|---|---|
| Component | `DeliverablesStatsCards` ([:163](src/pages/ContractManagementPage/layouts/DeliverablesTabContent.tsx#L163)) | inline `StatCard` × 7 ([:240-248](src/pages/MsaPage/layouts/Deliverables.tsx#L240-L248)) |
| Cards shown | 4 — All / Submitted / Pending / Late | 7 — adds Approved / Rejected / Under Review |

MSA renders **3 extra stat cards** that Contract doesn't show. Both pages consume the same `/deliverables/stats` payload, so the BE supplies all 7 values — Contract just doesn't render them.

Strictly per the user's "Contract = expected behavior" framing this is a drift. But it's MSA showing **more** information, not less — arguably a UX positive. Product call: either reduce MSA to 4 cards to match Contract, or expand Contract to 7 to match MSA. Recommendation: lift the 7-card layout into `DeliverablesStatsCards` so both pages render the same. (The `DeliverablesStats` type at [:14](src/pages/ContractManagementPage/components/DeliverablesStatsCards.tsx) only exposes 4 fields — would need extending.)

---

## Summary Matrix

| Role | Tab visibility | Action gates | Action targets | **Mutation refresh** | Personnel pool |
|------|---|---|---|---|---|
| **Manager** | ✅ | ✅ (shared) | ✅ | ❌ Approve/Reject doesn't refetch list/stats | ➖ N/A |
| **Vendor / PM** | ✅ | ✅ (shared) | ✅ | ❌ Submit doesn't refetch list/stats | ❌ Hardcoded Contract path |
| **Approver** | ✅ | ✅ (shared) | ✅ | ❌ Approve/Reject doesn't refetch list/stats | ➖ N/A |
| **View-only** | ✅ | ➖ N/A (read-only) | ➖ | ➖ | ➖ |

Plus cross-cutting: ⚠️ Stats card count diverges (4 Contract / 7 MSA).

---

## Fix recommendations (prioritized)

1. **Lift mutation invalidation keys to props on `DeliverablesTable` / `DeliverableDetailsSheet` / `SubmitDeliverableDialog`** — same refactor shape as Amendments shipped in commit `b7e30180a`. Default to the current bare `["deliverables", ...]` / `["deliverables-stats", ...]` keys so Contract is unchanged. Closes the bug that breaks every MSA Deliverables mutation flow with one change. **Highest impact.**

2. **Parameterize the personnel pool endpoint** in `SubmitDeliverableDialog` — either accept a `personnelEndpoint?: string` override prop (consistent with the `createPath` pattern in [[project-shared-dialog-contract-msa-reuse-pattern]]), or factor out a `usePersonnel(contractId, contractType)` hook. **Needs one-shot BE check first** to determine the correct MSA personnel URL (swagger snapshot may lag — see memory `project_msa_detail_role_gates_and_rfi` for an existing MSA personnel reference).

3. **(Product call) Align stats card count** — recommend lifting MSA's 7-card layout into `DeliverablesStatsCards` and extending `DeliverablesStats` type so both pages render identically. Or, if Contract is meant to stay at 4, trim MSA. Default unclear — needs user decision.

---

## Out of scope / non-issues

- `isVendor = basePath.includes("/vendor/")` ([DeliverablesTable.tsx:415](src/pages/ContractManagementPage/components/DeliverablesTable.tsx#L415)) — fragile but works for both Contract and MSA since both have `/vendor/` substring. Not worth refactoring solo.
- `useUserQueryKey(["deliverable-detail", ..., open])` ([:420](src/pages/ContractManagementPage/components/DeliverablesTable.tsx#L420)) — including the `open` boolean in the key means a fresh cache entry every time the sheet opens, wasting `staleTime`. Affects both pages equally; cosmetic.
- MSA rows pass `submissionDate` ([Deliverables.tsx:185](src/pages/MsaPage/layouts/Deliverables.tsx#L185)) that isn't in the shared `DeliverableRow` type and isn't rendered by any column — dead data, not a bug.
- Endpoint shape audit — verified, all four MSA basePaths follow the `/contract/{role}/msa-contracts/{id}/deliverables` convention. No URL drift.
