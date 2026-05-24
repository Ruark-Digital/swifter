# MSA vs Contract Detail-Tabs — Logic Parity Audit

**Phase:** `260524-msa-contract-tabs-logic-parity-audit`
**Audit type:** Read-only static-code audit. No HTTP calls, no UAT.
**Reference:** Contract Management detail tabs. **Candidate:** MSA detail tabs.
**Dimensions:** Role gates & action visibility · API endpoint shape · Status semantics & tone.
**Roles audited:** Manager (+ Admin) · Vendor (+ Project Manager via `isContractVendorLike`) · Approver · View-only.
**Severity:** **Broken** (action fails / 403 / blocks workflow) · **Drifted** (visibly differs but works) · **Cosmetic** (style only) · **Missing** (Contract has it, MSA doesn't, or vice versa).
**Matrix legend:** ✅ match · ⚠️ drift · ❌ broken · ❓ missing · ➖ N/A.

> All endpoint paths in this report are **as written in source**, prefixed by `/api/v1/dev` at runtime (see `project_axios_base_url`). Evidence is `file:line` from the working tree at audit time.

---

## Post-Audit Corrections (260524, swagger-verified)

After the initial audit shipped, every finding was cross-checked against `docs/swagger-phase-2.json` (the BE swagger spec — authoritative; `docs/API_DOCUMENTATION_PHASE_2.md` is an incomplete handwritten summary, see [project_be_spec_doc_precedence](../../../../memory)). The corrections below supersede the original findings where they conflict.

**False positives — RETRACTED, do not "fix":**

- **§11 Invoice "msa-contracts (plural) typo"** ❌ **RETRACTED.** The BE genuinely accepts and routes `/manager/msa-contracts/{contractId}/invoice/{invoiceId}/approve` with plural `msa-contracts`. This is the **only** MSA endpoint that uses the plural form; every other MSA endpoint uses singular `msa-contract`. The frontend code at `Invoice.tsx:120-122` correctly mirrors this BE quirk. See memory `msa-contracts-plural-invoice-approve-quirk`.
- **§6 RFI "manager singular `/rfi` should be plural `/rfis`"** ❌ **RETRACTED.** BE genuinely uses singular `/manager/msa-contract/{id}/rfi` for MSA. The audit assumed MSA followed Contract's manager-plural quirk; it doesn't. Frontend code is correct.
- **§12 Vendor Reports "wrong endpoint family"** ❌ **RETRACTED.** No `/msa-contract/*/reports` route exists in swagger. MSA Vendor Reports correctly shares Contract endpoints under `/{role}/contracts/{id}/reports`. Frontend code is correct.
- **§3 Claims "Manager can't Create Claim on MSA"** ❌ **RETRACTED** (Wave 2 pre-flight). `/manager/msa-contract/{contractId}/claims` is GET-only on BE — no POST endpoint exists. MSA's gating to vendor/PM only is BE-correct. Contract behavior (manager can POST a claim) does not exist on MSA. Frontend code is correct.

**Confirmed findings — Wave 1 fixes shipped:**

| Finding | Wave | Status | Commit |
|---|---|---|---|
| §3 Claims `/claim` → `/claims` plural for 3 of 4 roles | 1 | ✅ Shipped | `7aa222c75` |
| §7 Compliance manager Approve add `/contract` prefix | 1 | ✅ Shipped | `369758628` |
| §5 NCR Log basePath `/contracts/` → `/msa-contract/` for all 4 roles | 1 | ✅ Shipped | `51df46d56` |
| §10 LEM basePath `/contracts/` → `/msa-contract/` for all 4 roles | 1 | ✅ Shipped | `89e453fa8` |
| §4 Deliverables pass `isContractManager` prop to shared `DeliverablesTable` | 2 | ✅ Shipped | `7feb7ca9d` |

**Source-of-truth note:** As of 260524, `docs/swagger-phase-2.json` on disk is missing the v2.3.0 MSA route additions (MSA NCR, MSA LEM endpoint families). The user's externally-provided `docs.json` is the current spec. When `swagger-phase-2.json` and the external doc disagree, the external doc wins.

**Remaining findings unchanged.** All non-endpoint findings (Documents Edit Contract dead `onClick`, LEM Submit missing, Vendor Reports Create missing, status tone drift, query-key wrapping, etc.) stand as written.

> The "Top broken behaviors" list and "Recommended fix sequencing" sections below were written before these corrections — refer to this section first when prioritizing work.

---

## Executive Summary

### Top broken behaviors (highest fix priority)

1. **MSA NCR Log, LEM, and Vendor's Reports all fetch from `/contracts/` instead of `/msa-contract/`** (§5, §10, §12) — likely returns wrong data, empty, or 404 for every role. Single most impactful family of bugs.
2. **MSA Compliance manager Approve/Reject endpoint is missing the `/contract` prefix** — resolves to wrong URL (§7).
3. **MSA Invoice manager Approve/Reject uses `msa-contracts` (with trailing `s`) where every other MSA endpoint uses `msa-contract`** — typo → 404 (§11).
4. **MSA Claims uses singular `/claim` for vendor/PM/approver/view-only** while Contract converged to plural `/claims` (§3, memory `project_claims_endpoint_pluralization`).
5. **MSA RFI manager uses singular `/rfi`** while Contract uses plural `/rfis` for manager only (§6).
6. **MSA NCR Log is functionally a read-only stub** — no Create button, no CAPA flow, no Close-NCR checklist, no responder-identity gate. Recent Contract NCR commits not propagated (§5).
7. **MSA Deliverables omits `isContractManager` prop** on the shared `DeliverablesTable` (§4). Manager-only action UX never lights up.
8. **MSA Documents "Edit Contract" button has no `onClick`** (§8) — dead button.
9. **MSA LEM has no "Submit LEM" button** (§10) — vendor/PM cannot submit.
10. **MSA Claims has no "Create Claim" button for Manager** (§3); MSA Vendor's Reports has no "Create Report" button for Vendor/PM (§12).

### Recurring drift patterns

| Pattern | Tabs affected | Severity |
|--------|---------------|----------|
| `Closed` status badge rendered red instead of grey (recent Contract fix not propagated) | NCR (§5), RFI (§6), Change Mgmt (§2), Claims (§3), Compliance (§7), Invoice (§11) | Drifted (Broken on NCR/RFI which display closed prominently) |
| Export Report button is a bare `<Button>` with no `onClick` / no `ExportReportSheet` wrapper | Amendments (§1), Change Mgmt (§2), Claims (§3), Deliverables (§4), RFI (§6), Compliance (§7), Documents (§8), Payment Summary (§9) — **8 tabs** | Broken |
| Query key wrapped via `useUserQueryKey` (memory `feedback_user_query_key_invalidation` invalidation trap) | All 12 MSA tabs | Drifted — most are wired correctly today but the pattern lurks |
| Inline `DataTable` reimplementation instead of reusing Contract's `*Tab` / `*Table` component | Change Mgmt, Claims, Compliance, NCR Log, RFI, Payment Summary, Invoice, Vendor Reports — **8 tabs** | Drifted (architectural — not the focus per CONTEXT D-05) |
| Hardcoded `limit` (50–200), no server-side pagination | Most Group A MSA tabs | Drifted — silently truncates >limit |
| Search input added MSA-only (Contract has none) | Change Mgmt, Claims, NCR, Compliance, RFI, Vendor Reports | Drifted — UX-positive divergence |
| Admin treated as Manager on MSA, treated as ViewOnly on Contract (or vice versa) | Change Mgmt (§2), Claims (§3) | Drifted — needs product clarification |
| Approver / View-only sees Compliance tab on MSA but not on Contract | Compliance (§7) | Drifted |

### Tabs with the most findings (most work to fix)

1. **NCR Log (§5)** — 11 findings, including missing CAPA workflow + wrong endpoint family + wrong status color.
2. **Claims (§3)** — 11 findings, including singular-`/claim` endpoint on 3 of 4 roles + missing Create button for manager.
3. **Change Management (§2)** — 11 findings, including approver-variant stats hardcoded.
4. **RFI (§6)** — 11 findings, including singular-`/rfi` for manager + multi-select responder.
5. **Compliance (§7)** — 11 findings, including missing `/contract` prefix on manager approve.
6. **Invoice (§11)** — 9 findings, including `msa-contracts` typo on manager approve.
7. **Payment Summary (§9)** — 7 findings, including missing per-row View action and unstyled status text.
8. **Deliverables (§4)** — 7 findings.
9. **Vendor's Reports (§12)** — 7 findings, including wrong endpoint family + missing Create button.
10. **LEM (§10)** — 6 findings, including wrong endpoint family + missing Submit button.
11. **Amendments (§1)** — 5 findings; mostly minor.
12. **Documents (§8)** — 5 findings; dead Edit Contract button is the worst.

### Recommended fix sequencing

A pragmatic fix order, based on blast radius × per-tab effort:

1. **Wave 1 — Endpoint corrections (small diff, high impact):**
   NCR (§5), LEM (§10), Vendor Reports (§12): switch `basePath` to `/msa-contract/`. Compliance manager Approve (§7): add `/contract` prefix. Invoice manager Approve (§11): fix `msa-contracts` → `msa-contract`. Claims (§3): make `/claims` plural for all roles. RFI (§6): make manager `/rfis` plural.
2. **Wave 2 — Wire missing actions:** Documents Edit Contract (§8), LEM Submit (§10), Vendor Reports Create (§12), Claims Create-for-Manager (§3). Restore Deliverables `isContractManager` prop (§4).
3. **Wave 3 — Status tone palette:** sweep all MSA `statusTone()` helpers to include `closed = grey`. Single regex pass across Group A + Compliance + Invoice.
4. **Wave 4 — Export Report:** wrap all 8 dead buttons with `ExportReportSheet contractType="MSA"` (or `"Contract"` if BE distinguishes).
5. **Wave 5 — NCR CAPA workflow restoration:** the biggest unit of work. Port `NcrTable` + `SubmitCapaDialog` + Close-NCR checklist behavior to MSA (or refactor MSA to reuse Contract's `NcrTable` with `basePath` parameterization).
6. **Wave 6+ — Pagination, search alignment, query-key un-wrapping, admin role policy** — lower priority cleanup.

> See [feedback_audit_scope_behavior_not_architecture](../../memory) — architectural drift (inline reimplementation) is intentionally **not** prioritized in this fix sequencing. Component-reuse refactor is a separate phase.

---

## Table of Contents (user-given order)

| # | Tab | Audit group | Section link |
|---|-----|-------------|--------------|
| 1 | Compliance & Security | B | [§7](#7-compliance--security) |
| 2 | Documents | B | [§8](#8-documents) |
| 3 | Amendments | A | [§1](#1-amendments) |
| 4 | Deliverables | A | [§4](#4-deliverables) |
| 5 | Payment Summary | B | [§9](#9-payment-summary) |
| 6 | LEM | B | [§10](#10-lem) |
| 7 | Invoice | B | [§11](#11-invoice) |
| 8 | Change Management | A | [§2](#2-change-management) |
| 9 | Claims | A | [§3](#3-claims) |
| 10 | RFI | A | [§6](#6-rfi) |
| 11 | NCR Log | A | [§5](#5-ncr-log) |
| 12 | Vendor's Reports | B | [§12](#12-vendors-reports) |

Sections in this document are written in **audit order** (Group A first, then Group B).

---

# Group A — Role-aware Tables

These tabs share Contract's role-aware `*Table` / `*Sheet` components. Most parity questions reduce to "does MSA pass the same `basePath` / props the component expects?" plus the shape of the endpoint behind that path.

## 1. Amendments

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/AmendmentsTabContent.tsx`
- **MSA:** `src/pages/MsaPage/layouts/Amendments.tsx`
- **Shared:** `ContractManagementPage/components/AmendmentsTable.tsx`, `AmendmentsStatsCards.tsx`. MSA imports `CreateAmendmentDialog` from Contract's `AmendmentsTabContent.tsx` (lines 89-692 of that file).

### Endpoint base-paths (per role)

| Role | Contract base | MSA base | Notes |
|------|---------------|----------|-------|
| Manager | `/contract/manager/contracts/{id}/amendments` (plural) | `/contract/manager/msa-contract/{id}/amendments` (plural) | Both manager paths plural; vendor/approver/user paths singular `amendment`. Known BE quirk. |
| Vendor / PM | `/contract/vendor/contracts/{id}/amendment` (singular) | `/contract/vendor/msa-contract/{id}/amendment` (singular) | ✅ shape matches |
| Approver | `/contract/approver/contracts/{id}/amendment` | `/contract/approver/msa-contract/{id}/amendment` | ✅ shape matches |
| View-only | `/contract/user/contracts/{id}/amendment` | `/contract/user/msa-contract/{id}/amendment` | ✅ shape matches |

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ⚠️ | ✅ | ✅ | ✅ |
| API endpoint shape     | ⚠️ | ✅ | ✅ | ✅ |
| Status semantics/tone  | ✅ | ✅ | ✅ | ✅ |

### Findings

- **[Broken] Manager** — MSA "Export Report" button is a bare `<Button>` with no `onClick` and no `ExportReportSheet` wrapper. Contract wraps the button with `<ExportReportSheet contractId contractType="Contract">…</ExportReportSheet>` so clicking opens the export sheet. On MSA it does nothing. Evidence: `MsaPage/layouts/Amendments.tsx:178-187` vs `ContractManagementPage/layouts/AmendmentsTabContent.tsx:800-811`.
- **[Drifted] Manager** — Manager stats on MSA are **derived client-side** from the rows (`derivedManagerStats` at `MsaPage/layouts/Amendments.tsx:159-165`) because the stats query is disabled for manager (`enabled: … && !isManager`, line 118) and `statsBasePath` is empty for manager (line 75). Contract calls `${basePath}/stats` for every role including manager (`AmendmentsTabContent.tsx:732`). Visible effect: MSA manager sees counts that match the *currently loaded list*, not any BE-side aggregation. Risk: pagination/filter divergence if the list endpoint ever truncates.
- **[Drifted] All roles] — query-key shape** — Contract uses bare prefixes (`["contract-amendments", contractId, basePath]`, lines 723-724); MSA uses `useUserQueryKey(["msa-amendments", …])` which **appends `userId`** (`MsaPage/layouts/Amendments.tsx:78-87`). The `CreateAmendmentDialog` here is wired correctly because the parent passes `listInvalidateQueryKey` / `statsInvalidateQueryKey` exactly (lines 194-195), but the same pattern lurking elsewhere is the documented invalidation no-op trap. See memory `feedback_user_query_key_invalidation`.
- **[Cosmetic] Manager** — Export Report button border is `dark:border-slate-800` on MSA (line 180) vs `dark:border-slate-700` on Contract (line 803). Both readable; minor token drift.
- **[Match] Vendor/PM** — Both pages call `isContractVendorLike` correctly (`AmendmentsTabContent.tsx:708`; `Amendments.tsx:50` uses the inline `isVendor || isProjectManager` form). PM is paired with Vendor in both.
- **[Match] All roles] — Approve/Reject + comment-dialog flow** — Both pages render the same `AmendmentsTable` (`Amendments.tsx:215-220` / `AmendmentsTabContent.tsx:835-840`), so the Pattern A (vendor two-dialog) / Pattern B (approver single-dialog) flow is identical. See memory `project_approve_reject_comment_dialog_pattern`.
- **[Match] Manager — Assign-Approval gate** — `AmendmentsTable` is shared; manager Assign-Approval gating (hidden on time-only amendments) is identical. See memory `feedback_amendment_approve_gate`.

## 2. Change Management

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/ChangeTabContent.tsx`
- **MSA:** `src/pages/MsaPage/layouts/ChangeManagement.tsx`
- **Shared:** `ChangeStatsCards`, `CreateChangeDialog`, `ChangeDetailsSheet` (all imported by MSA from `ContractManagementPage/components/`). **NOT shared:** Contract uses `ChangeTable`; MSA reimplements an inline `DataTable` (`ChangeManagement.tsx:172-252`).

### Endpoint base-paths (per role)

| Role | Contract base | MSA base |
|------|---------------|----------|
| Manager | `/contract/manager/contracts/{id}/changes` | `/contract/manager/msa-contract/{id}/changes` |
| Vendor / PM | `/contract/vendor/contracts/{id}/changes` | `/contract/vendor/msa-contract/{id}/changes` |
| Approver | `/contract/approver/contracts/{id}/changes` | `/contract/approver/msa-contract/{id}/changes` |
| View-only | `/contract/user/contracts/{id}/changes` | `/contract/user/msa-contract/{id}/changes` |

Plural `changes` for all roles in both pages. Shape match.

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| API endpoint shape     | ✅ | ✅ | ✅ | ✅ |
| Status semantics/tone  | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

### Findings

- **[Broken] Manager — Stats variant hardcoded to `approver`** — MSA: `<ChangeStatsCards … variant="approver" />` (`ChangeManagement.tsx:289`). Contract: `variant={isApprover ? "approver" : "manager"}` (`ChangeTabContent.tsx:203`). Memory `project_approver_stats_field_aliases` confirms only the approver stats endpoint returns the `completed`/`cancelled` aliases — managers/vendors get `approved`/`rejected`. Running the approver-variant card against a manager-shape payload either falls back through the alias chain (lucky case) or shows zeros for approved/rejected.
- **[Broken] All roles — Export Report button non-functional** — Same pattern as Amendments: bare `<Button>` with no `onClick`, no `ExportReportSheet` wrapper (`ChangeManagement.tsx:264-270`) vs Contract's functional wrapper (`ChangeTabContent.tsx:175-182`). Recurring across Group A MSA tabs.
- **[Drifted] All roles — Status tone missing `closed = grey`** — MSA inline `statusTone()` only handles `approved`/`pending`/`rejected` (`ChangeManagement.tsx:41-47`). Contract's `ChangeTable` uses the canonical tone palette where `closed = grey` (per recent commits `1749c3e00 fix(ncr): closed status uses grey, not green` and `90c92d27c fix(ncr): tone-aware status badge`). A change with `status="closed"` will render with the default slate fallback on MSA — not necessarily wrong but not the canonical grey badge, and visibly differs from any other tab that uses `StatusBadge`. This drift pattern is suspected to recur on every MSA tab with an inline `statusTone()` helper (audited per-tab below).
- **[Drifted] All roles — No pagination** — MSA hardcodes `limit=100` and `disablePagination: true` (`ChangeManagement.tsx:119, 335`). Contract paginates server-side via `PaginationState` (`ChangeTabContent.tsx:85-88, 248-300`). For a contract with >100 changes, MSA silently truncates.
- **[Drifted] All roles — Per-type filtering UX** — Contract renders one `ChangeTable` per tab via separate `TabsContent` blocks with server-fetched `type` query (`ChangeTabContent.tsx:248-300`, `?type=…` in URL line 146). MSA renders a single `DataTable` and filters **client-side** by `type` via `changeTabToApiType` only on the request (`ChangeManagement.tsx:116`), but the BE still has to return the matching subset since the tab change triggers a refetch via `activeTab` in the query key. Net: behavior is similar; difference is that MSA's table doesn't reset pagination on tab change (no pagination state to reset) and shows search across all loaded changes.
- **[Drifted] All roles — Search input added MSA-only** — MSA adds a `<Input>` search above the table (`ChangeManagement.tsx:343-349`) that does case-insensitive substring match on `changeId`/`title`/`type`. Contract has no search. Not a regression — just a UX divergence the future fixer should know about.
- **[Drifted] Admin — admin treated as manager for Create Change** — MSA: `canCreateChange = isManager || isAdmin || isProjectManager || isVendor` (`ChangeManagement.tsx:255`) AND `isManager={isManager || isAdmin}` (line 282). Contract: `(isManager || isContractVendorLike)` (`ChangeTabContent.tsx:183`) AND `isManager={isManager}` (line 194). Effect: an admin user on MSA can create a Change and sees the **manager** option set (Directive + Order per memory `project_change_management_role_options`); an admin on Contract cannot create a Change at all. Ambiguous which side is correct — flag for product clarification.
- **[Drifted] All roles — `documentType="MsaContract"` extra prop** — MSA passes `documentType="MsaContract"` to `CreateChangeDialog` (`ChangeManagement.tsx:283`); Contract does not. This is presumably wired inside `CreateChangeDialog` to route to a different `/msa-contract/` create endpoint; verify the dialog respects it (read `CreateChangeDialog.tsx` during fix).
- **[Drifted] All roles — query-key wrapping** — MSA uses `useUserQueryKey(["msaChanges", …])` (`ChangeManagement.tsx:87-98`); Contract uses bare prefix (`ChangeTabContent.tsx:101-106, 128-135`). Same invalidation trap as Amendments; verify the create dialog's invalidation hooks pass the wrapped key. (`CreateChangeDialog` is shared — needs spot-check on whether it does `queryClient.invalidateQueries({ queryKey: […] })` with a bare or wrapped key.)
- **[Match] Vendor/PM — Create-Change options** — Both pages pass `isManager={isManager}` (modulo admin drift above) to `CreateChangeDialog`, so the role-scoped option set (Manager: Directive+Order; Vendor/PM: Request+Order+Proposal per memory `project_change_management_role_options`) is consistent.
- **[Match] All roles — View action** — Both render `ChangeDetailsSheet` for the "View" action with appropriate `basePath`. Approve/Reject + comment-dialog (Pattern B per memory `project_approve_reject_comment_dialog_pattern`) is identical because the sheet is shared.

## 3. Claims

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/ClaimsTabContent.tsx`
- **MSA:** `src/pages/MsaPage/layouts/Claims.tsx`
- **Shared:** `ClaimsStatsCards`, `RequestClaimDialog` (imported by MSA from `ContractManagementPage/components/`). **NOT shared:** Contract uses `ClaimsTable` (which embeds `ClaimDetailsSheet` / `ChangeDetailsSheet` dual-purpose); MSA reimplements an inline `DataTable` AND uses a separate `MSAClaimDetailsSheet`.

### Endpoint base-paths (per role)

| Role | Contract base | MSA base | Notes |
|------|---------------|----------|-------|
| Manager | `/contract/manager/contracts/{id}/claims` | `/contract/manager/msa-contract/{id}/claims` | ✅ both plural |
| Admin | (treated as ViewOnly: `…/user/…/claims`) | `/contract/manager/msa-contract/{id}/claims` (admin treated as manager) | ⚠️ admin routes differ |
| Vendor / PM | `/contract/vendor/contracts/{id}/claims` (plural) | `/contract/vendor/msa-contract/{id}/claim` (**singular**) | ❌ MSA still singular |
| Approver | `/contract/approver/contracts/{id}/claims` (plural) | `/contract/approver/msa-contract/{id}/claim` (**singular**) | ❌ MSA still singular |
| View-only | `/contract/user/contracts/{id}/claims` (plural) | `/contract/user/msa-contract/{id}/claim` (**singular**) | ❌ MSA still singular |

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ❌ | ⚠️ | ✅ | ✅ |
| API endpoint shape     | ⚠️ | ❌ | ❌ | ❌ |
| Status semantics/tone  | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

### Findings

- **[Broken] Vendor / PM / Approver / View-only — Claims endpoint singular `/claim`** — MSA branches at `Claims.tsx:90`: `isManager || isAdmin ? \`${basePath}/claims\` : \`${basePath}/claim\``. Memory `project_claims_endpoint_pluralization` and `project_contract_claims_plural` confirm canonical is **plural across all roles**; the Contract code base was already converged to plural (`ClaimsTabContent.tsx:36-41` — every role uses `/claims`). If the MSA BE follows the same convergence, three of four MSA roles will 404 on both the list (`${claimsPath}`, line 137) and stats (`${claimsPath}/stats`, line 93). If the MSA BE still accepts singular for those roles, this is brittle — flag to BE owner.
- **[Broken] Vendor / PM — Create Claim POSTs to singular `/claim`** — `createPath` at `Claims.tsx:95-98` is `${basePath}/claim`. `RequestClaimDialog` is shared and POSTs to whatever `createPath` says. If BE wants plural here too, vendor/PM cannot create a claim on MSA. Memory `project_contract_claims_plural` follow-up note also says "RequestClaimDialog invalidate key must be bare `["contractClaims"]` to catch list+stats" — MSA passes `claimsQueryKey` (wrapped via `useUserQueryKey`, line 276) — so even if create succeeds, list+stats may not refetch.
- **[Missing] Manager — Cannot create a Claim** — MSA gates `<RequestClaimDialog>` on `createPath` being defined (`Claims.tsx:273`), and `createPath` is only set for `isVendor || isProjectManager` (lines 95-98). So **manager has no Create Claim button**. Contract gates on `(isContractVendorLike || isManager)` (`ClaimsTabContent.tsx:100`), so manager CAN create. Recheck product intent — memory `project_change_management_role_options` says claims are vendor-initiated, but Contract clearly allows manager-initiated too.
- **[Drifted] Admin — treated as Manager** — MSA routes admin to `/contract/manager/…` (line 72); Contract routes admin to `/contract/user/…` (`ClaimsTabContent.tsx:39`). Same admin/manager mixing as Change Mgmt finding above — flag for product.
- **[Broken] All roles — Export Report button non-functional** — Same bare `<Button>` pattern (`Claims.tsx:266-272`).
- **[Drifted] All roles — Separate `MSAClaimDetailsSheet` vs Contract's shared sheet** — Contract's `ClaimsTable` embeds `ChangeDetailsSheet` in dual-purpose mode (`isClaim = roleBasePath.includes("/claim")`, per memory `project_contract_claims_plural`). MSA uses `MsaPage/components/MSAClaimDetailsSheet.tsx` instead (`Claims.tsx:22, 241`). Behavioral parity of the detail view itself is **out of scope for this audit (user excluded dialog parity)** — but the **role-gate / endpoint / status** behavior inside the sheet may drift. Spot-check `MSAClaimDetailsSheet.tsx` during the fix phase: does it run Approve/Reject through `${roleBasePath}/approve`? Does it handle the Contract follow-up where vendor comment URL must use `${roleBasePath}/...` (memory)?
- **[Drifted] All roles — Status label remap to "Under Review"** — MSA renders `status === "pending"` as label "Under Review" (`Claims.tsx:222-223`). Contract's `ClaimsTable` does not. Visible behavior difference.
- **[Drifted] All roles — Status tone missing `closed = grey` + missing dark variants** — `Claims.tsx:30-38` covers only approved/pending/under review/rejected; closed and dark mode partially handled (default branch has dark, others do not). Same recurring drift pattern.
- **[Drifted] All roles — Pagination disabled, limit hardcoded 50** — `disablePagination: true` (`Claims.tsx:297`); limit 50 (line 135). Contract paginates server-side via `pagination` state (`ClaimsTabContent.tsx:30-33, 71-73`).
- **[Drifted] All roles — Search input added MSA-only** — Same as Change Mgmt; MSA has client-side substring search on claimId/title/type (`Claims.tsx:176-189`), Contract has none.
- **[Drifted] All roles — query-key wrapped via `useUserQueryKey`** — Same lurking invalidation trap. The `RequestClaimDialog` here receives `invalidateQueryKey={claimsQueryKey}` (wrapped) but does NOT invalidate the stats key — memory `project_contract_claims_plural` says invalidate must catch both list AND stats. ❌ Stats stale-on-create lives here.
- **[Match] Manager — Endpoint plural** — Manager uses `/claims` (plural) on both pages.

## 4. Deliverables

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/DeliverablesTabContent.tsx`
- **MSA:** `src/pages/MsaPage/layouts/Deliverables.tsx`
- **Shared:** `DeliverablesTable` (imported by MSA). **NOT shared:** Contract uses `DeliverablesStatsCards`; MSA reimplements an inline `StatCard` with 7 cards instead of 4.

### Endpoint base-paths (per role)

| Role | Contract base | MSA base |
|------|---------------|----------|
| Manager (+ companyAdmin/superAdmin) | `/contract/manager/contracts/{id}/deliverables` | `/contract/manager/msa-contract/{id}/deliverables` |
| Vendor / PM | `/contract/vendor/contracts/{id}/deliverables` | `/contract/vendor/msa-contract/{id}/deliverables` |
| Approver | `/contract/approver/contracts/{id}/deliverables` | `/contract/approver/msa-contract/{id}/deliverables` |
| View-only | `/contract/user/contracts/{id}/deliverables` | `/contract/user/msa-contract/{id}/deliverables` |

All plural. Per memory `project_msa_deliverables_endpoints`, MSA's `/submit` and `/approve` sub-routes exist; the shared `DeliverablesTable` interpolates `basePath` for every action.

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ❌ | ✅ | ✅ | ✅ |
| API endpoint shape     | ✅ | ✅ | ✅ | ✅ |
| Status semantics/tone  | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

### Findings

- **[Broken] Manager — `isContractManager` prop omitted on MSA** — Contract: `<DeliverablesTable … isApprover={isApprover} isContractManager={isManager} basePath={basePath} />` (`DeliverablesTabContent.tsx:165-172`). MSA: `<DeliverablesTable … isApprover={isApprover} basePath={basePath} />` (`Deliverables.tsx:248-254`) — **no `isContractManager` prop**. Per memory `project_deliverable_role_scoped_action_gates` the table's gate is now `approverStatus === "pending"`, but the table still consumes `isContractManager` to render manager-specific action UX. Practical effect on MSA: manager-only branches inside the table never light up (e.g., the "Approve / Reject" buttons that gate on a combined `isContractManager` + `approverStatus === "pending"` condition). Verify by reading `DeliverablesTable.tsx` during the fix; either MSA needs to pass it or both pages need the prop removed in lockstep.
- **[Broken] All roles — Export Report button non-functional** — Same pattern as Group A peers (`Deliverables.tsx:228-234`).
- **[Drifted] All roles — Stats card count and source** — MSA renders **7** inline `StatCard`s (All / Submitted / Pending / Late / Approved / Rejected / Under Review) at `Deliverables.tsx:237-245`. Contract renders **4** via the shared `DeliverablesStatsCards` (`DeliverablesTabContent.tsx:163`). The MSA payload supports both shapes — Contract may simply be undercounting if BE returns the larger keyset.
- **[Drifted] All roles — Stats fallback strategy differs** — Contract derives stats client-side from rows when the API stats are empty (`DeliverablesTabContent.tsx:141-149`). MSA never derives — if API stats are missing it shows zeros.
- **[Drifted] All roles — Status mapping diverges in one edge case** — Contract has a fallback: when `status` is unset but `submissionStatus === "submitted"`, label becomes "Under Review" (`DeliverablesTabContent.tsx:125-126`). MSA's final fallback when nothing matches is also "Under Review" (`Deliverables.tsx:203`) but it doesn't condition on `submissionStatus`. A deliverable with no status and no submissionStatus on MSA still renders "Under Review"; on Contract it renders "Pending". Minor.
- **[Drifted] All roles — query-key wrap** — `useUserQueryKey(["msa-deliverables", …])` on MSA (`Deliverables.tsx:129-130`); bare prefix on Contract. Approve/submit/reject inside `DeliverablesTable` must invalidate the wrapped MSA key — verify during fix.
- **[Drifted] Active-tab gating** — Contract fires queries when `contractId` is present regardless of `isActive` (`DeliverablesTabContent.tsx:76, 95`). MSA gates on `isActive` (`Deliverables.tsx:138, 149`). MSA's behavior is more efficient; Contract over-fetches on initial mount.
- **[Drifted] All roles — `contractId` source** — Contract reads from `useParams()` (`DeliverablesTabContent.tsx:18`); MSA receives via prop. Not a logic divergence, but means the Contract tab will misbehave if rendered outside a route with `:id`.
- **[Match] All roles — Approve/Reject single-gate** — Both pages funnel through the shared `DeliverablesTable`, so the single-gate-on-`approverStatus === "pending"` rule (memory `project_deliverable_role_scoped_action_gates`) applies identically — modulo the `isContractManager` prop omission noted above.

## 5. NCR Log

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/NcrLogTabContent.tsx`
- **MSA:** `src/pages/MsaPage/layouts/NcrLog.tsx`
- **Shared:** `DocumentItem` (MSA imports for attachment display). **NOT shared:** Contract uses `NcrTable`, `NcrStatsCards`, `CreateNcrDialog`, `SubmitCapaDialog`. MSA reimplements everything — including a brand-new inline `NcrDetailsSheet` (`NcrLog.tsx:82-251`) that is **read-only**.

### Endpoint base-paths (per role)

| Role | Contract base | MSA base | Notes |
|------|---------------|----------|-------|
| Manager | `/contract/manager/contracts/{id}/ncrs` | `/contract/manager/contracts/{id}/ncrs` | ❌ MSA points at **Contract** endpoint, not `/msa-contract/` |
| Vendor / PM | `/contract/vendor/contracts/{id}/ncrs` | `/contract/vendor/contracts/{id}/ncrs` | ❌ same wrong base |
| Approver | `/contract/approver/contracts/{id}/ncrs` | `/contract/approver/contracts/{id}/ncrs` | ❌ same wrong base |
| View-only | `/contract/user/contracts/{id}/ncrs` | `/contract/user/contracts/{id}/ncrs` | ❌ same wrong base |

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ❓ | ❓ | ❓ | ✅ |
| API endpoint shape     | ❌ | ❌ | ❌ | ❌ |
| Status semantics/tone  | ❌ | ❌ | ❌ | ❌ |

### Findings

- **[Broken] All roles — Endpoint targets `/contracts/`, not `/msa-contract/`** — Every branch in MSA's `basePath` memo points at the regular Contract endpoint (`NcrLog.tsx:261-276`). Other MSA tabs (Amendments, Change Mgmt, Claims, Deliverables, etc.) all use `/msa-contract/{id}/…`. Either the NCR endpoint was never moved or this is a literal copy-paste oversight. Net result for every role: MSA NCR tab fetches and displays the regular Contract's NCRs (if contractId collides), or returns empty/404. **Highest-priority fix in this audit.**
- **[Missing] Vendor / PM / Approver — Create NCR button absent on MSA** — Contract: `(isApprover || isContractVendorLike)` see a "Create NCR" button (`NcrLogTabContent.tsx:92-107`). MSA: no Create NCR button anywhere on the tab (`NcrLog.tsx:396-402` shows only the header). NCR creation impossible from MSA.
- **[Missing] Vendor / PM (responder) — Submit CAPA flow absent** — Contract's `NcrTable` embeds the `SubmitCapaDialog` flow per memory `project_ncr_capa_workflow`; the responder can submit a CAPA when status is appropriate. MSA's inline `NcrDetailsSheet` is read-only and never renders a Submit CAPA button.
- **[Missing] submittedBy identity — Approve CAPA flow absent** — Contract path: submittedBy approves the CAPA (identity-match at `user._id`, per memory). MSA has no Approve path at all.
- **[Missing] submittedBy identity — Close NCR checklist dialog absent** — Recent Contract commit `0b3ade29e feat(ncr): submittedBy can close NCR via checklist dialog once approved`. MSA NCR has neither the gate nor the dialog. Status flips remain stuck.
- **[Broken] All roles — Closed status is rendered RED** — `statusTone(status)` on MSA returns `bg-[#FEECEC] text-[#E53935]` (red) for `Closed` (`NcrLog.tsx:80`). Recent commits `1749c3e00 fix(ncr): closed status uses grey, not green` and `90c92d27c fix(ncr): tone-aware status badge in NCR detail header` made `closed = grey` on Contract. MSA reverses to red.
- **[Drifted] All roles — Binary status mapping loses fidelity** — MSA collapses every BE status into `"Closed" | "Open"` (`NcrLog.tsx:73-77`); Contract preserves the full enum (issued/received/under-review/closed/approved/rejected). Filtering/sorting/labels on MSA cannot reflect intermediate states.
- **[Drifted] All roles — NcrStatsCards reimplemented inline** — MSA renders 3 inline stat boxes for All/Issued/Received (`NcrLog.tsx:404-444`); Contract uses shared `NcrStatsCards` (`NcrLogTabContent.tsx:110-115`). The reimplementation uses the same `stats.total / stats.issue / stats.receive` keys so values agree, but layout/tone divergence is visible.
- **[Drifted] All roles — No pagination, hardcoded limit 50** — `NcrLog.tsx:297, 451`. Contract paginates server-side via `PaginationState` (`NcrLogTabContent.tsx:37-40, 121-122`).
- **[Drifted] All roles — Search input added MSA-only** — Same pattern as Change Mgmt / Claims (`NcrLog.tsx:457-465`).
- **[Drifted] All roles — query-key wrap** — `useUserQueryKey(["msa-ncr-list", …])` and `useUserQueryKey(["msa-ncr-stats", …])` (`NcrLog.tsx:278-279`).
- **[Drifted] All roles — `responder` field unread** — Memory `project_rfi_responder_singular` notes that NCR *detail GET* returns `responder` singular object (different shape from create's plural array) and broke `NcrTable`'s responder-match logic. MSA's `NcrDetailsSheet` never reads `responder` at all (`NcrLog.tsx:42-58`), so it can't gate any action on responder identity — but since MSA also has no actions, this is masked. Becomes a finding once any of the missing flows above are added.

## 6. RFI

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/RfiTabContent.tsx` *(working tree has uncommitted local changes)*
- **MSA:** `src/pages/MsaPage/layouts/Rfi.tsx`
- **Shared:** `RfiStatsCards`. **NOT shared:** Contract uses `RfiTable`; MSA reimplements `IssueRfiDialog`, `RespondToRfiDialog`, `RfiDetailsSheet` inline (~700 lines).

### Endpoint base-paths (per role)

| Role | Contract base | MSA base | Notes |
|------|---------------|----------|-------|
| Manager | `/contract/manager/contracts/{id}/rfis` (**plural**) | `/contract/manager/msa-contract/{id}/rfi` (**singular**) | ❌ MSA may 404 if BE follows Contract's quirk |
| Vendor / PM | `/contract/vendor/contracts/{id}/rfi` | `/contract/vendor/msa-contract/{id}/rfi` | ✅ |
| Approver | `/contract/approver/contracts/{id}/rfi` | `/contract/approver/msa-contract/{id}/rfi` | ✅ |
| View-only | `/contract/user/contracts/{id}/rfi` | `/contract/user/msa-contract/{id}/rfi` | ✅ |

**Personnel endpoint** (used by Issue RFI dialog for responder picker):

| Role | Contract | MSA |
|------|---------|-----|
| Manager | `/contract/manager/personnel` (no contractId scope) | `/contract/manager/personnel/contract/{id}` (contractId-scoped, singular `contract`) |
| Approver | (Contract uses `/contract/manager/personnel`) | `/contract/approver/contracts/{id}/personnel` |
| Vendor / PM | `/contract/vendor/contracts/{id}/personnel` | `/contract/vendor/contracts/{id}/personnel` (same, deliberately re-used per source comment lines 153-155) |
| View-only | (n/a — no Issue button) | `/contract/user/contracts/{id}/personnel` |

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ⚠️ | ⚠️ | ⚠️ | ✅ |
| API endpoint shape     | ❌ | ✅ | ✅ | ✅ |
| Status semantics/tone  | ❌ | ❌ | ❌ | ❌ |

### Findings

- **[Broken] Manager — Endpoint singular `rfi` vs Contract's plural `rfis`** — Contract: `/manager/contracts/{id}/rfis` (`RfiTabContent.tsx:428`). MSA: `/manager/msa-contract/{id}/rfi` (`Rfi.tsx:826`). If MSA BE follows the same singular/plural rule as Contract (manager → plural; others → singular), this 404s for manager.
- **[Broken] All roles — Closed status rendered RED** — `statusTone()` returns red for "closed" (`Rfi.tsx:113-118`). Same drift pattern as NCR Log; per recent commits and memory, closed should be grey.
- **[Broken] All roles — Export Report button non-functional** — Bare `<Button>` (`Rfi.tsx:1048-1054`); Contract wraps with `ExportReportSheet` (`RfiTabContent.tsx:496-500`).
- **[Drifted] All roles — Responder picker: MSA uses multi-select, Contract uses single** — MSA's `IssueRfiDialog` uses `TextMultiSelect` (`Rfi.tsx:31`); Contract uses `TextSelect` (`RfiTabContent.tsx:23`). Memory contradiction: `project_rfi_responder_singular` says `responder?: string` (singular ObjectId on RFI document); `project_msa_detail_role_gates_and_rfi` says MSA RFI dialog gained responder multi-select. Two interpretations:
  - **(a)** MSA POSTs an array of responder IDs and the BE picks one / stores last → silently drops responders.
  - **(b)** MSA BE schema accepts `responders: string[]` for RFI — divergent BE shape from Contract's `responder: string`.
  - Either way, the parity rule "responder is singular" (memory) is violated on MSA. Flag for product/BE confirmation.
- **[Drifted] Manager — Personnel endpoint shape differs** — MSA: `/contract/manager/personnel/contract/{id}` (`Rfi.tsx:158`). Contract: `/contract/manager/personnel` (`RfiTabContent.tsx:106`). MSA scopes by contractId; Contract returns a global personnel list. Memory `project_msa_deliverables_endpoints` notes the singular-`contract` scoping convention. Net effect: Contract's manager Issue dialog shows ALL personnel; MSA's manager Issue dialog only shows personnel attached to this contract.
- **[Drifted] All roles — Respond action gate is `type === "received"` only** — MSA action cell at `Rfi.tsx:984-1004`: `if (isReceived && !isViewOnly)` show Respond. Contract delegates to `RfiTable` (not read in this audit). Per memory `project_rfi_responder_singular` principle: "don't gate read-only content behind write-action role checks" — but the inverse rule for write-action gating is **identity**, not type. MSA's gate lets ANY non-view-only role on a received RFI see Respond, regardless of whether they are the responder. Likely too permissive — should gate on `currentUser._id === responder._id` (singular form). Spot-check `RfiTable.tsx` to confirm what Contract does.
- **[Drifted] All roles — IssueRfiDialog / RespondToRfiDialog / RfiDetailsSheet reimplemented** — ~700 lines of MSA-only implementation (`Rfi.tsx:120-810`). Behavioral parity of these reimplementations vs Contract's `RfiTable`-embedded versions is out of scope for this audit (dialog parity excluded). Spot-check during fix.
- **[Drifted] All roles — query-key wrap** — `useUserQueryKey(["msa-rfi-list", …])` (`Rfi.tsx:843`).
- **[Drifted] All roles — No pagination** — MSA hardcodes `limit` in the request and disables table pagination (same pattern as Group A MSA tabs). Contract paginates server-side via `PaginationState`.
- **[Match] All roles — Issue RFI button gating** — Both pages gate on `!isViewOnly` (Contract: `RfiTabContent.tsx:501`, MSA: `Rfi.tsx:1039, 1055`).
- **[Match] All roles — Filter tabs (All / Issued / Received)** — Both pages have the same three tabs; both filter client-side by `type`.
- **[Match] Stats card** — Both pages use the shared `RfiStatsCards` component.

---

# Group B — Shells + Special Cases

These tabs either delegate to a heavyweight Contract component (`ComplianceSecurityTab`, `DocumentsList`, `PaymentSummaryMilestonesTable`, etc.) or have one-of-a-kind logic (Invoice's submission lifecycle). MSA's divergences here tend to be bigger because the inline reimplementation is also bigger.

## 7. Compliance & Security

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/ComplianceTabContent.tsx` (78 lines — thin shell)
- **MSA:** `src/pages/MsaPage/layouts/Compliance.tsx` (528 lines — full reimplementation)
- **Shared:** `ComplianceDetailsSheet`, `SubmitPolicyDialog` (both imported by MSA). **NOT shared:** Contract uses `ComplianceSecurityTab` (a large role-aware component); MSA reimplements policies/security tables inline.

### Endpoint base-paths (per role)

| Role | Contract base | MSA base |
|------|---------------|----------|
| Manager | `/contract/manager/contracts/{id}/compliance` | `/contract/manager/msa-contract/{id}/compliance` |
| Vendor / PM | `/contract/vendor/contracts/{id}/compliance` | `/contract/vendor/msa-contract/{id}/compliance` |
| Approver | `/contract/approver/contracts/{id}/compliance` (tab hidden — early-return null) | `/contract/approver/msa-contract/{id}/compliance` (tab visible) |
| View-only | `/contract/user/contracts/{id}/compliance` (tab hidden) | `/contract/user/msa-contract/{id}/compliance` (tab visible) |

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ❌ | ✅ | ⚠️ | ⚠️ |
| API endpoint shape     | ❌ | ✅ | ✅ | ✅ |
| Status semantics/tone  | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

### Findings

- **[Broken] Manager — Approve/Reject endpoint missing `/contract` prefix** — MSA: `const endpoint = \`/manager/msa-contract/${contractId}/compliance/${activeTab}/approve\`` (`Compliance.tsx:313`). Per memory `project_axios_base_url`, baseURL is `/api/v1/dev` (no `/contract`), so every contract route must self-prefix `/contract/...`. This URL resolves to `/api/v1/dev/manager/...` (wrong) instead of `/api/v1/dev/contract/manager/...` (right). Manager bulk Approve/Reject is dead.
- **[Drifted] Approver / View-only — Compliance tab visible on MSA, hidden on Contract** — Contract returns `null` at `ComplianceTabContent.tsx:57` for `isApprover || isViewOnly`. MSA renders the tab for every role (`Compliance.tsx` has no early-return). Approvers/view-only on MSA see a compliance tab they shouldn't. Spot-check product intent — memory `project_compliance_approve_reject_location` doesn't pin this down.
- **[Broken] All roles — Export Report button non-functional** — Bare `<Button>` (`Compliance.tsx:379-385`); no `ExportReportSheet` wrapper.
- **[Drifted] Manager — role check uses raw string compare** — MSA: `isContractManager = userRole === "contract_manager"` (`Compliance.tsx:278`). Contract uses the `isManager` boolean from `useUserRole`. Brittle if role naming changes; should match Contract.
- **[Drifted] Manager — bulk-approve hardcodes comment** — MSA `approveMutation` posts `{ action, comment: "Approved all policy items via bulk action" }` (`Compliance.tsx:314-318`). Contract's `ComplianceSecurityTab` (per memory `project_approve_reject_comment_dialog_pattern`) typically opens a comment dialog for the manager to type a reason. MSA bypasses that — no comment dialog, no user input.
- **[Drifted] All roles — Tables reimplemented inline** — Contract delegates to `ComplianceSecurityTab` (1 component); MSA inlines two `DataTable`s, two column defs, search input, and stat-row layout. Maintenance debt.
- **[Drifted] All roles — Search input added MSA-only** — Same pattern as Group A; MSA filters client-side on policyId/policyName and securityId/securityType (`Compliance.tsx:164-182`).
- **[Drifted] All roles — Status tone missing `closed = grey`** — Inline `getStatusTone` covers approved/submitted/pending/pending-submission/rejected (`Compliance.tsx:63-74`). No closed mapping.
- **[Drifted] All roles — query-key wrap** — `useUserQueryKey(["msa-compliance", …])` (`Compliance.tsx:114`).
- **[Match] Vendor / PM — Submit Policy / Security flow** — Both pages reuse `SubmitPolicyDialog`; status gate `pending || rejected` (`Compliance.tsx:304-309`) and `basePath` interpolation align with Contract's gate.
- **[Match] All roles — Approve/Reject NOT on `ComplianceDetailsSheet`** — Both pages keep the buttons on the parent tab per memory `project_compliance_approve_reject_location`. ✓
- **[Match] All roles — `StatusBadge` for category status** — MSA uses `StatusBadge` from `MsaPage/components/StatusBadge` for insurance/security category status (`Compliance.tsx:412, 427`); Contract's `ComplianceSecurityTab` does the same.

## 8. Documents

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/DocumentsTabContent.tsx`
- **MSA:** `src/pages/MsaPage/layouts/Documents.tsx`
- **Shared:** `DocumentsList`, `DocumentsStatsCard` (both reused by MSA). **NOT shared:** Contract wires `EditContract` (full contract edit wizard); MSA has no equivalent.

### Endpoint base-paths (per role)

| Role | Contract | MSA |
|------|---------|-----|
| Manager | (Files come from parent contract-detail data; no role-distinct fetch.) | `/contract/manager/msa-contract/{id}` (detail endpoint) |
| Vendor / PM | (parent) | `/contract/vendor/msa-contract/{id}` |
| Approver | (parent) | `/contract/approver/msa-contract/{id}` |
| View-only | (parent) | `/contract/user/msa-contract/{id}` |
| Admin | (parent) | falls through to `/contract/manager/...` (default at `Documents.tsx:50`) |

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ❌ | ✅ | ✅ | ✅ |
| API endpoint shape     | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Status semantics/tone  | ✅ | ✅ | ✅ | ✅ |

### Findings

- **[Broken] Manager — "Edit Contract" button is a dead button** — MSA renders `<Button variant="outline">Edit Contract</Button>` with **no `onClick`** (`Documents.tsx:103-110`). Contract wires this button to open `EditContract` dialog (`DocumentsTabContent.tsx:41-50, 63-77`) which is the full contract-edit wizard. On MSA, manager cannot edit the contract from the Documents tab. Likely the equivalent should open `CreateMSADialog` in edit mode (memory `project_msa_edit_dialog`), but this is unwired.
- **[Drifted] Manager — Edit Contract visibility gating differs** — Contract: button always visible, gated only on `actionsDisabled` (`DocumentsTabContent.tsx:41-50`). MSA: gated on `isManager` (`Documents.tsx:103`). MSA's stricter gating is probably correct, but Contract's permissiveness should also be flagged for product. Two-sided drift.
- **[Broken] All roles — Export Report button non-functional** — Same recurring pattern (`Documents.tsx:97-102`).
- **[Drifted] All roles — Documents source differs** — Contract receives `files` as a prop from the parent contract-detail page; MSA does its own fetch against `/contract/{role}/msa-contract/{id}` and falls back to the prop (`Documents.tsx:53-86`). If parent and MSA fetch responses diverge (different polling intervals, parent has stale data), MSA's tab can show different files than the rest of the page. The fallback hides the bug.
- **[Drifted] All roles — query-key wrap** — `useUserQueryKey(["msa-documents", contractId])` (`Documents.tsx:44`).
- **[Match] All roles — Edit gate `status === "pending_approval"`** — Both pages pass `status` through to `DocumentsList`, which contains the canonical `canEdit = status === "pending_approval"` gate (memory `project_documents_tab_edit_gate`). ✓
- **[Match] All roles — `DocumentsList` + `DocumentsStatsCard` shared** — Both pages render the same components with the same props; the per-file Approve/Reject/Replace gating inside `DocumentsList` is identical.
- **[Match] Approver / View-only — Read-only behavior** — Both pages let `DocumentsList`'s internal logic gate the actions; no role-specific divergence in either parent.

## 9. Payment Summary

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/PaymentSummaryTabContent.tsx` (953 lines)
- **MSA:** `src/pages/MsaPage/layouts/PaymentSummary.tsx` (450 lines)
- **Shared:** None of the row tables/sheets. **NOT shared:** Contract uses `PaymentSummaryMilestonesTable`, `ReleaseHoldbackDialog`, `HoldbackDetailsSheet`, `SavingsDetailsSheet`, `getHoldbackStatusBadgeProps`. MSA uses MSA-specific `MsaReleaseHoldbackDialog` + `MsaUpdateSavingsDialog` and inlines two `DataTable`s with no row-detail sheets.

### Endpoint base-paths (per role)

| Role | Contract | MSA |
|------|---------|-----|
| Manager | `contractManagerApi.listPaymentHoldbacks/Savings(contractId)` → `/contract/manager/contracts/{id}/payment-holdbacks` and `…/payment-savings` | `/contract/manager/msa-contract/{id}/payment-holdbacks` and `…/payment-savings` |
| Vendor / PM | `/contract/vendor/contracts/{id}/payment-holdbacks` (savings intentionally skipped) | `/contract/vendor/msa-contract/{id}/payment-holdbacks` (savings intentionally skipped) |
| Approver | `/contract/approver/contracts/{id}/payment-holdbacks` and `…/payment-savings` | `/contract/approver/msa-contract/{id}/payment-holdbacks` and `…/payment-savings` |
| View-only | Not in role tree (queries never enabled) | Defensively `!isViewOnly`-gated; tab hidden by whitelist |

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ❓ | ⚠️ | ⚠️ | ✅ |
| API endpoint shape     | ✅ | ✅ | ✅ | ➖ |
| Status semantics/tone  | ❌ | ❌ | ❌ | ➖ |

### Findings

- **[Broken] All roles — Status column on holdback rows is plain text, no tone badge** — MSA: `cell: ({ getValue }) => (<div className="text-center">{getValue<string>()}</div>)` (`PaymentSummary.tsx:238-240`). Contract: imports `getHoldbackStatusBadgeProps` from `lib/holdbacks` and renders a tone-aware pill (`PaymentSummaryTabContent.tsx:84-95`). On MSA the status is unstyled raw text.
- **[Missing] All roles — Holdback / Savings rows have no "View" action** — MSA holdbackColumns and savingsColumns end at the data fields (`PaymentSummary.tsx:224-274`) — no `id: "actions"` cell. Contract attaches a `HoldbackDetailsSheet` trigger per row (`PaymentSummaryTabContent.tsx:107-121`) and likewise for savings via `SavingsDetailsSheet`. On MSA you cannot drill into a holdback or saving from the table.
- **[Broken] All roles — Export Report button non-functional** — Bare `<button>` (`PaymentSummary.tsx:302-308`).
- **[Drifted] Manager — Uses MSA-specific dialogs** — `MsaUpdateSavingsDialog` + `MsaReleaseHoldbackDialog` (`PaymentSummary.tsx:311-332`) vs Contract's `ReleaseHoldbackDialog` (and an inline savings update form). Per `gsd-discuss-phase` CONTEXT scope this dimension is excluded — verify during fix that the MSA dialogs hit the right MSA endpoints and invalidate the wrapped query keys.
- **[Drifted] Manager — Release Holdback / Update Savings gated on `!isPendingApproval`** — `PaymentSummary.tsx:309`. Contract has its own gate per `isPendingApproval` (`PaymentSummaryTabContent.tsx:564`). Spot-check whether the predicates match; both use `contract?.status === "pending_approval"`.
- **[Drifted] All roles — query-key wrap** — `useUserQueryKey(["msa-payment-holdbacks", …])` (`PaymentSummary.tsx:100`).
- **[Match] Vendor / PM — Savings intentionally skipped** — Both pages gate the savings query to `!isVendorLike` (`PaymentSummary.tsx:146`; `PaymentSummaryTabContent.tsx:632-633`). Per Contract's own comment, Phase 2 docs do not expose `/vendor/.../payment-savings`. ✓
- **[Match] View-only — Tab hidden / queries disabled** — Both pages avoid hitting `/user/.../payment-*` endpoints. MSA's defensive `!isViewOnly` gate matches Contract's role-tree omission.
- **[Match] All roles — Endpoint paths plural** — Both pages use `payment-holdbacks` / `payment-savings` plural for every role.

## 10. LEM

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/LemTabContent.tsx`
- **MSA:** `src/pages/MsaPage/layouts/Lem.tsx`
- **Shared:** `LemTable` (reused). **NOT shared:** `SubmitLemDialog` (only Contract wires it).

### Endpoint base-paths (per role)

| Role | Contract base | MSA base | Notes |
|------|---------------|----------|-------|
| Manager | `/contract/manager/contracts/{id}/lems` | `/contract/manager/contracts/{id}/lems` | ❌ MSA points at **Contract** endpoint, not `/msa-contract/` |
| Vendor / PM | `/contract/vendor/contracts/{id}/lems` | `/contract/vendor/contracts/{id}/lems` | ❌ same wrong base |
| Approver | `/contract/approver/contracts/{id}/lems` | `/contract/approver/contracts/{id}/lems` | ❌ same wrong base |
| View-only | `/contract/user/contracts/{id}/lems` | `/contract/user/contracts/{id}/lems` | ❌ same wrong base |

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ✅ | ❌ | ✅ | ✅ |
| API endpoint shape     | ❌ | ❌ | ❌ | ❌ |
| Status semantics/tone  | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

### Findings

- **[Broken] All roles — Endpoint targets `/contracts/`, not `/msa-contract/`** — Every branch in MSA's `basePath` uses `/contract/{role}/contracts/{id}/lems` (`Lem.tsx:25-40`). Same pattern as NCR Log §5. Either the MSA LEM endpoint was never moved or this is a copy-paste oversight. Recheck swagger; this is the second tab in Group B that points at the Contract endpoint.
- **[Missing] Vendor / PM — No "Submit LEM" button on MSA** — Contract renders `<SubmitLemDialog>` for `isContractVendorLike` (`LemTabContent.tsx:83-92`). MSA renders only the header (`Lem.tsx:91-97`) — no Submit button, no dialog. Vendor/PM cannot submit a LEM from MSA.
- **[Drifted] All roles — Status display not Title-Cased / underscores not stripped** — Contract: `status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")` (`LemTabContent.tsx:68-70`). MSA: passes `item?.status || "Pending"` raw (`Lem.tsx:75`). A status like `"under_review"` renders as `"under_review"` on MSA, `"Under review"` on Contract.
- **[Drifted] All roles — Page limit differs** — Contract: `limit=10` (`LemTabContent.tsx:50`). MSA: `limit=200` (`Lem.tsx:59`). No pagination on either (both use the table's built-in scrolling), but MSA fetches 20× more data per call.
- **[Drifted] All roles — query-key wrap** — `useUserQueryKey(["msa-lem-list", …])` (`Lem.tsx:42`).
- **[Match] All roles — Search wiring** — Both pages pass `searchValue` + `onSearchChange` to `LemTable`. Search debounce 400ms on both.
- **[Match] All roles — `LemTable` shared** — Both pages render the same table component, which handles per-row View / Detail behavior identically.

## 11. Invoice

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/InvoiceTabContent.tsx` (127 lines)
- **MSA:** `src/pages/MsaPage/layouts/Invoice.tsx` (650 lines)
- **Shared:** `InvoiceStatsCards`, `CreateInvoiceDialog` (both imported by MSA). **NOT shared:** Contract uses `InvoiceTable` (with embedded detail/Approve flow); MSA reimplements an inline `InvoiceDetailSheet` (~330 lines, starts at `Invoice.tsx:50`) plus an inline `DataTable`.

### Endpoint base-paths (per role)

| Role | Contract base | MSA base | Notes |
|------|---------------|----------|-------|
| Manager | `/contract/manager/contracts/{id}/invoice` | `/contract/manager/msa-contract/{id}/invoice` | ✅ list shape; ❌ **approve path uses `msa-contracts` (plural)** |
| Vendor / PM | `/contract/vendor/contracts/{id}/invoice` | `/contract/vendor/msa-contract/{id}/invoice` | ✅ |
| Approver | `/contract/approver/contracts/{id}/invoice` | `/contract/approver/msa-contract/{id}/invoice` | ✅ |
| View-only | `/contract/user/contracts/{id}/invoice` | `/contract/user/msa-contract/{id}/invoice` | ✅ |

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ❌ | ✅ | ⚠️ | ✅ |
| API endpoint shape     | ❌ | ✅ | ✅ | ✅ |
| Status semantics/tone  | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

### Findings

- **[Broken] Manager — Approve/Reject endpoint typo `msa-contracts` (plural)** — MSA: `const approvePath = isManager ? \`/contract/manager/msa-contracts/${contractId}/invoice/${invoiceId}/approve\` : \`${basePath}/${invoiceId}/approve\`` (`Invoice.tsx:120-122`). The list/detail/non-manager-approve endpoints all use **`msa-contract`** (singular) (`Invoice.tsx:404-409`). The manager-only branch on the approve mutation has a typo `msa-contracts` (with `s`). Manager Approve/Reject → 404.
- **[Drifted] Manager — Bulk-approve comment hardcoded** — `comment = status === "approved" ? "Invoice approved via bulk action" : "Invoice rejected via bulk action"` (`Invoice.tsx:116-118`). Same Compliance §7 pattern: no comment dialog, no user input. Contract's `InvoiceTable` opens a comment dialog (Pattern B per memory `project_approve_reject_comment_dialog_pattern`).
- **[Drifted] Approver — Approve action gated on `/approve/status` endpoint** — MSA hits `${basePath}/${invoiceId}/approve/status` (`Invoice.tsx:107`) to derive `canApprove` per approver. Contract's `InvoiceTable` has its own gating; verify they agree (likely Contract gates similarly — out of scope to read `InvoiceTable.tsx` deeply).
- **[Drifted] Manager — `canManagerAct` predicate is status-only** — `canManagerAct = isManager && invoice?.status === "pending"` (`Invoice.tsx:166`). Contract's table likely uses `approverStatus === "pending"` per the cross-tab pattern in memory `project_deliverable_role_scoped_action_gates`. Spot-check Contract Invoice's gate during fix.
- **[Drifted] All roles — Detail sheet reimplemented inline** — `InvoiceDetailSheet` lives entirely inside `Invoice.tsx` (lines 50-385). Contract's equivalent lives inside `InvoiceTable`. Dialog parity excluded per CONTEXT scope, but worth noting since this duplicates ~330 lines of UI.
- **[Drifted] All roles — Status tone missing `closed = grey`** — Inline status mapping covers approved/rejected/draft/pending only (`Invoice.tsx:179-186`). Closed (terminal state) defaults to yellow ("pending") fallback.
- **[Drifted] All roles — query-key wrap** — `useUserQueryKey(["msa-invoices", …])` (`Invoice.tsx:422`).
- **[Match] Vendor / PM — Create Invoice gating** — Both pages gate on `isContractVendorLike && !actionsDisabled` (Contract `InvoiceTabContent.tsx:98`; MSA gating wraps `CreateInvoiceDialog` similarly at `Invoice.tsx:592-594`). `CreateInvoiceDialog` is shared; MSA passes `createPath={basePath}` (line 594).
- **[Match] All roles — `InvoiceStatsCards` shared** — Both pages reuse the same component for the top stats row.
- **[Match] All roles — Endpoint paths singular (`invoice`)** — Both pages use `invoice` singular for every role. Per memory `feedback_manager_invoice_detail_missing_contractid` there's a manager detail-API method that was found to miss contractId; not directly relevant here since both pages interpolate contractId in the URL.

## 12. Vendor's Reports

### Files
- **Contract:** `src/pages/ContractManagementPage/layouts/VendorReportsTabContent.tsx` (553 lines)
- **MSA:** `src/pages/MsaPage/layouts/Reports.tsx` (369 lines)
- **Shared:** `CreateVendorReportDialog` (Contract uses it; MSA does not import it). **NOT shared:** detail sheets are reimplemented on both sides.

### Endpoint base-paths (per role)

| Role | Contract base | MSA base | Notes |
|------|---------------|----------|-------|
| Manager | `/contract/manager/contracts/{id}` (then `/reports`) | `/contract/manager/contracts/{id}/reports` | ❌ MSA points at **Contract** endpoint, not `/msa-contract/` |
| Vendor / PM | `/contract/vendor/contracts/{id}` | `/contract/vendor/contracts/{id}/reports` | ❌ same wrong base |
| Approver | `/contract/approver/contracts/{id}` | `/contract/approver/contracts/{id}/reports` | ❌ same wrong base |
| View-only | `/contract/user/contracts/{id}` | `/contract/user/contracts/{id}/reports` | ❌ same wrong base |

### Parity Matrix

| Dimension              | Manager | Vendor/PM | Approver | View-only |
|------------------------|---------|-----------|----------|-----------|
| Role gates & actions   | ✅ | ❌ | ✅ | ✅ |
| API endpoint shape     | ❌ | ❌ | ❌ | ❌ |
| Status semantics/tone  | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

### Findings

- **[Broken] All roles — Endpoint targets `/contracts/`, not `/msa-contract/`** — `Reports.tsx:176-182`. Third tab in Group B with the same bug (alongside NCR §5 and LEM §10). All MSA reports fetches and the detail sheet hit the Contract endpoint family.
- **[Missing] Vendor / PM — No "Create Report" button on MSA** — Contract gates `<CreateVendorReportDialog>` on `isContractVendorLike` with an `isPendingApproval` lockout (`VendorReportsTabContent.tsx:418-444`). MSA renders just the header (`Reports.tsx:307-311`) — vendor/PM cannot submit a report.
- **[Drifted] All roles — Row mapping drops the status field** — Contract's row type includes `status` (hardcoded to `"Unknown"` at `VendorReportsTabContent.tsx:382`, which is itself a probable TODO). MSA's `ReportRow` type omits status entirely (`Reports.tsx:242-262`). Both are effectively statusless today, but if BE adds status, MSA needs row + column changes.
- **[Drifted] All roles — Date format diverges** — Contract: `format(createdAt, "dd MMM yyyy")` → `"24 May 2026"` (`VendorReportsTabContent.tsx:380`). MSA: `formatDateTZ(createdAt, "dd-MM-yyyy")` → `"24-05-2026"` (`Reports.tsx:258`). Memory `project_contract_claims_plural` notes the canonical Submitted-column convention is `format(createdAt, "dd MMM yyyy")`. MSA diverges.
- **[Drifted] All roles — Stat card count** — Both pages show a single "All Report" card. MSA layout is wider (`Reports.tsx:313-327`); Contract is similar. No major divergence.
- **[Drifted] All roles — Search added MSA-only as `title` query param** — MSA passes `?title=…` to BE list endpoint (`Reports.tsx:200`). Contract does the same (`VendorReportsTabContent.tsx:348`). Match.
- **[Drifted] All roles — query-key wrap** — `useUserQueryKey(["msa-reports", …])` (`Reports.tsx:193-194`).
- **[Match] All roles — View action opens detail sheet** — Both pages render a per-row "View" button that opens a `ReportDetailsSheet` (Contract's nested at the top of `VendorReportsTabContent.tsx`; MSA's at the top of `Reports.tsx`). Sheet body parity excluded.

