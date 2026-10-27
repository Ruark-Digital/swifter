---
name: msa-ncr-flow-review
description: Per-role user-flow comparison of NCR Log tab — MSA vs Contract Management (Contract = expected behavior)
date: 2026-05-25
status: complete
---

# NCR Log — MSA vs Contract User-Flow Review

**Audit type:** Read-only static-code comparison. No HTTP calls, no UAT.
**Reference (source of truth):** Contract Management.
**Candidate:** MSA.
**Scope:** Manager, Approver, Vendor/PM (+ View-only).
**Dimensions:** Tab visibility · Identity gates (CAPA workflow) · Action targets · **Mutation-side-effect invalidation**.

> Endpoint paths shown as written in source; runtime prefix `/api/v1/dev` per `project_axios_base_url`. Spec verified against attached `docs.json` (260525).

---

## Files

| Role of file | Contract (expected) | MSA (actual) |
|---|---|---|
| Tab whitelist | [ContractDetailPage.tsx:124-172](src/pages/ContractManagementPage/ContractDetailPage.tsx#L124-L172) | [MsaDetailPage.tsx:95-158](src/pages/MsaPage/MsaDetailPage.tsx#L95-L158) |
| Tab shell | [NcrLogTabContent.tsx](src/pages/ContractManagementPage/layouts/NcrLogTabContent.tsx) (130 lines) | [NcrLog.tsx](src/pages/MsaPage/layouts/NcrLog.tsx) (135 lines) |
| Shared table + details sheet + CAPA workflow | [NcrTable.tsx](src/pages/ContractManagementPage/components/NcrTable.tsx) (857 lines — MSA imports it) | same |
| Shared stats cards | `NcrStatsCards` | same |
| Shared create dialog | `CreateNcrDialog` (vendor/PM/approver use to raise NCR) | same |
| Shared CAPA submit dialog | `SubmitCapaDialog` (responder uses to submit CAPA) | same |

**Architectural posture:** Same shared-component pattern as Amendments / Deliverables. MSA was ported to the shared `NcrTable` in Wave 5 of the 260524 audit (commit `6d26a28f0`). The two parent layouts are nearly identical mod the basePath prefix and query-key prefix (`"contractNcrs"` vs `"msaNcrs"`).

---

## Per-Role Tab Visibility

| Role | Contract whitelist | MSA whitelist | Result |
|------|---|---|---|
| Manager | ALL tabs | includes `ncr-log` | ✅ Both see it |
| Vendor / PM | includes `ncr-log` | includes `ncr-log` | ✅ Both see it |
| Approver | includes `ncr-log` | includes `ncr-log` | ✅ Both see it |
| View-only | includes `ncr-log` | includes `ncr-log` | ✅ Both see it |

Parity.

---

## 🚨 ROOT-CAUSE BUG — Invalidation-key trap (same pattern as Amendments / Deliverables)

The shared NCR components hardcode `["contractNcrs", ...]` query keys in their internal mutation invalidations, in **five sites across three files**:

### 1. `NcrTable.tsx` — `NcrDetailsSheet`

[`invalidateNcrQueries`](src/pages/ContractManagementPage/components/NcrTable.tsx#L249-L251) — wide-cast prefix invalidation:
```ts
queryClient.invalidateQueries({ queryKey: ["contractNcrs"] });
```

Called from:
- `approveCapaMutation.onSuccess` ([:266-269](src/pages/ContractManagementPage/components/NcrTable.tsx#L266-L269)) — submitter approves CAPA.
- `closeNcrMutation.onSuccess` ([:286-289](src/pages/ContractManagementPage/components/NcrTable.tsx#L286-L289)) — submitter closes NCR.

Each mutation also invalidates the detail key `["contractNcrs", "detail", contractId, ncrId, basePath]` explicitly ([:266-268](src/pages/ContractManagementPage/components/NcrTable.tsx#L266-L268) and [:286-288](src/pages/ContractManagementPage/components/NcrTable.tsx#L286-L288)).

### 2. `CreateNcrDialog.tsx`

[`createNcrMutation.onSuccess`](src/pages/ContractManagementPage/components/CreateNcrDialog.tsx#L170-L178):
```ts
queryClient.invalidateQueries({ queryKey: ["contractNcrs", contractId] });
queryClient.refetchQueries({ queryKey: ["contractNcrs", contractId] });
```

### 3. `SubmitCapaDialog.tsx`

[`submitCapaMutation.onSuccess`](src/pages/ContractManagementPage/components/SubmitCapaDialog.tsx#L106-L108):
```ts
queryClient.invalidateQueries({
  queryKey: ["contractNcrs", "detail", contractId, ncrId],
});
```

### What works on Contract vs MSA

**On Contract** the parent's list/stats keys are `["contractNcrs", "stats", ...]` and `["contractNcrs", contractId, ...]` ([NcrLogTabContent.tsx:42-65](src/pages/ContractManagementPage/layouts/NcrLogTabContent.tsx#L42-L65)) — all wide-cast and parameterized invalidations match. ✅

**On MSA** the parent uses `["msaNcrs", "stats", ...]` and `["msaNcrs", contractId, ...]` ([NcrLog.tsx:54-70](src/pages/MsaPage/layouts/NcrLog.tsx#L54-L70)) — different prefix at position 0 (`"contractNcrs"` vs `"msaNcrs"`). Wide-cast `["contractNcrs"]` does NOT match `["msaNcrs", ...]`. List/stats invalidations silently miss. ❌

The **detail invalidation** works on both pages because:
- The detail query lives INSIDE the shared `NcrDetailsSheet`, so it's keyed under `useUserQueryKey(["contractNcrs", "detail", contractId, ncrId, basePath])` on both pages — same prefix because the shared component hardcodes it.
- The invalidation `["contractNcrs", "detail", contractId, ncrId, basePath]` is a prefix of the wrapped key (`useUserQueryKey` appends userId to the end), so React Query's default prefix matching catches it on both pages.

### Observable consequences on MSA

| Mutation | Contract | MSA |
|---|---|---|
| Create NCR (Create button) | List refreshes, new row appears | List doesn't refetch — must refresh page to see new NCR |
| Submit CAPA (responder) | Detail + list refresh; "Approve CAPA" button appears on the list for the submitter | Detail refreshes; list stays stale — list still shows NCR as pre-CAPA |
| Approve CAPA (submitter) | Detail + list refresh; status flips to "Approved" | Detail refreshes; list still shows old status |
| Close NCR (submitter) | Detail + list refresh; row gets "Closed" badge | Detail refreshes; list still shows "Approved" |

**Fix shape:** identical port of the Amendments fix (`b7e30180a`) and Deliverables fix (`3583a08d3`). Lift to optional `listInvalidateQueryKey` / `statsInvalidateQueryKey` / `detailInvalidateQueryKey` props on:

- `NcrTable` (outer)
- `NcrDetailsSheet` (used inside `NcrTable`)
- `CreateNcrDialog` (already shared between pages)
- `SubmitCapaDialog` (used inside `NcrDetailsSheet`)

Defaults preserve current bare `["contractNcrs", ...]` keys so Contract is unchanged when props are omitted. Both parents pass their actual keys.

This is the third known instance of [[feedback-shared-component-hidden-invalidation-keys]] in the Group A audit. See running tally in that memory.

---

## MANAGER FLOW

### Expected (Contract)

- Sees the NCR tab. Endpoint: `/contract/manager/contracts/{id}/ncrs` ([NcrLogTabContent.tsx:30](src/pages/ContractManagementPage/layouts/NcrLogTabContent.tsx#L30)).
- Does **not** see a "Create NCR" button — gate is `(isApprover || isContractVendorLike)`, manager is excluded ([NcrLogTabContent.tsx:92](src/pages/ContractManagementPage/layouts/NcrLogTabContent.tsx#L92)). Per memory `project_ncr_capa_workflow`, NCRs are raised by vendor/PM or approver, not manager.
- In the detail sheet: no action buttons unless the manager happens to also be the responder or submitter (identity match). Per `project_ncr_capa_workflow`, manager role isn't part of the CAPA workflow.

### Actual (MSA)

Endpoint: `/contract/manager/msa-contracts/{id}/ncrs` ([NcrLog.tsx:36](src/pages/MsaPage/layouts/NcrLog.tsx#L36)). Gate logic identical. Identity-based action gates inside shared sheet are also identical.

### User-flow gaps for manager

- None role-specific. The root-cause invalidation bug above doesn't bite manager directly (manager doesn't mutate) but does affect view freshness when a vendor or approver mutates while the manager is on the page.

---

## APPROVER FLOW

### Expected (Contract)

- Sees the NCR tab. Endpoint: `/contract/approver/contracts/{id}/ncrs`.
- **Can raise an NCR** — gate `(isApprover || isContractVendorLike)`. Opens `CreateNcrDialog`. Posts to `${basePath}` per the dialog.
- In the detail sheet: if the approver happens to be the responder → Submit CAPA. If the approver is the submitter of the NCR → Approve CAPA / Close NCR. Otherwise read-only.

### Actual (MSA)

Same gate, same dialog, same identity-based footer gating via shared component. Endpoint: `/contract/approver/msa-contracts/{id}/ncrs` ([NcrLog.tsx:35](src/pages/MsaPage/layouts/NcrLog.tsx#L35)).

### User-flow gaps for approver

- **MSA: Create NCR succeeds BE-side but list doesn't refresh** — root-cause bug.
- **MSA: any CAPA-workflow mutation the approver triggers (Submit CAPA as responder, Approve CAPA / Close NCR as submitter) succeeds, detail refreshes, list stays stale** — root-cause bug.

---

## VENDOR / PM FLOW

### Expected (Contract)

- Sees the NCR tab. Endpoint: `/contract/vendor/contracts/{id}/ncrs`.
- **Can raise an NCR.**
- In the detail sheet: identity-driven CAPA workflow as above. Per memory `project_ncr_capa_workflow`: responder submits CAPA; NCR submitter (which can be vendor/PM if they raised it) approves the CAPA and closes the NCR.

### Actual (MSA)

Same. Endpoint: `/contract/vendor/msa-contracts/{id}/ncrs` ([NcrLog.tsx:34](src/pages/MsaPage/layouts/NcrLog.tsx#L34)).

### User-flow gaps for vendor/PM

- Same as approver — every mutation works BE-side, but list/stats stay stale on MSA.

---

## VIEW-ONLY FLOW

Sees the tab and the list. No Create button (gate excludes view-only). No mutation buttons in detail sheet (identity match unlikely; even if matched, view-only would still see them per current code — but actioning on a view-only account is a separate concern outside this review's scope). No findings.

---

## Summary Matrix

| Role | Tab visibility | Action gates | Action targets | **Mutation refresh on MSA** |
|------|---|---|---|---|
| **Manager** | ✅ | ✅ (identity-gated; manager mostly observer) | ✅ | ➖ (manager rarely mutates) |
| **Vendor / PM** | ✅ | ✅ (Create + identity-gated CAPA workflow) | ✅ | ❌ Create/Submit-CAPA/Approve-CAPA/Close don't refetch list |
| **Approver** | ✅ | ✅ (Create + identity-gated CAPA workflow) | ✅ | ❌ Same |
| **View-only** | ✅ | ➖ N/A | ➖ | ➖ |

---

## Fix recommendations (prioritized)

1. **Lift invalidation keys to props on `NcrTable` / `NcrDetailsSheet` / `CreateNcrDialog` / `SubmitCapaDialog`** — direct port of commits `b7e30180a` (Amendments) and `3583a08d3` (Deliverables). One refactor closes all four mutation flows on MSA. Highest impact, lowest risk, zero new design decisions. **Recommended.**

2. **(Optional cleanup)** Remove the redundant `refetchQueries` call in `CreateNcrDialog` ([:175-177](src/pages/ContractManagementPage/components/CreateNcrDialog.tsx#L175-L177)). `invalidateQueries` already triggers refetch for active queries; the explicit refetch is double-work. Not a bug, just noise. Could be folded into the fix above.

---

## Out of scope / non-issues

- Endpoint shapes verified against attached spec — both pages correct. The Wave 1 fix (`51df46d56`) that swapped MSA from `/contracts/` to `/msa-contracts/` is in place.
- Tab whitelist parity verified.
- Identity-based action gates work the same on both pages via shared component (memory `project_ncr_capa_workflow` covers the workflow).
- Status tone palette (closed = slate) already aligned via Wave 3 / shared component.
- No hardcoded pool paths (`CreateNcrDialog` uses `contract?.approvers` and `contract?.internalTeam` from in-memory parent contract object, not a separate fetch).
