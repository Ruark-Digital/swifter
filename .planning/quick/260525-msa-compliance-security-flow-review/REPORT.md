---
name: msa-compliance-security-flow-review
description: Per-role user-flow comparison of Compliance & Security tab — MSA vs Contract Management (Contract = expected behavior)
date: 2026-05-25
status: complete
---

# Compliance & Security — MSA vs Contract User-Flow Review

**Audit type:** Read-only static-code comparison. No HTTP calls, no UAT.
**Reference (source of truth):** Contract Management.
**Candidate:** MSA.
**Scope:** Manager, Approver, Vendor/PM. (View-only included where it diverges.)
**Dimensions:** Tab visibility · Action gates · Action targets (endpoints/payloads) · What the user sees.

> Endpoint paths shown as written in source; runtime prefix `/api/v1/dev` per `project_axios_base_url`.

---

## Files

| Role of file | Contract (expected) | MSA (actual) |
|---|---|---|
| Tab whitelist | [src/pages/ContractManagementPage/ContractDetailPage.tsx:124-172](src/pages/ContractManagementPage/ContractDetailPage.tsx#L124-L172) | [src/pages/MsaPage/MsaDetailPage.tsx:95-158](src/pages/MsaPage/MsaDetailPage.tsx#L95-L158) |
| Tab shell | [src/pages/ContractManagementPage/layouts/ComplianceTabContent.tsx](src/pages/ContractManagementPage/layouts/ComplianceTabContent.tsx) (78 lines, delegates) | [src/pages/MsaPage/layouts/Compliance.tsx](src/pages/MsaPage/layouts/Compliance.tsx) (533 lines, inline reimplementation) |
| Tab body | [src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx) (role-aware, ~600 lines) | inline in `Compliance.tsx` |
| Details sheet | [src/pages/ContractManagementPage/components/ComplianceDetailsSheet.tsx](src/pages/ContractManagementPage/components/ComplianceDetailsSheet.tsx) (shared — MSA imports it) | same |
| Submit dialog | `SubmitPolicyDialog` (shared — MSA imports it) | same |

---

## Per-Role Tab Visibility

| Role | Contract whitelist | MSA whitelist | Result |
|------|---|---|---|
| Manager | ALL tabs (incl. compliance) | includes `compliance` | ✅ Both see it |
| Vendor / PM | includes `compliance` | includes `compliance` | ✅ Both see it |
| Approver | omits `compliance` (+ defense-in-depth early-return at [ComplianceTabContent.tsx:57](src/pages/ContractManagementPage/layouts/ComplianceTabContent.tsx#L57)) | omits `compliance` | ✅ Both hide it |
| View-only | omits `compliance` (+ same early-return) | omits `compliance` | ✅ Both hide it |

Tab visibility is now at parity. The MSA `Compliance.tsx` component still carries dead `basePath` branches for `isApprover` and `isViewOnly` ([Compliance.tsx:100-106](src/pages/MsaPage/layouts/Compliance.tsx#L100-L106)) but those branches are unreachable through the whitelist.

---

## MANAGER FLOW

### Expected (Contract) — [ComplianceSecurityTab.tsx](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx)

The manager sees Approve / Reject **only when all three are true** ([ComplianceSecurityTab.tsx:104-116](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx#L104-L116)):

1. `userRole === "contract_manager"`
2. `hasFiles` — the active category has at least one uploaded file ([:63-78](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx#L63-L78))
3. The active category's submission status is one of: `submitted`, `pending approval`, `pending_approval`, `awaiting approval`

Clicking Approve / Reject posts to `contract/manager/contracts/{id}/compliance/{policy|security}/approve` with `{ action, comment }` (the comment is auto-generated bulk text — there is no comment dialog on either page).

### Actual (MSA) — [Compliance.tsx](src/pages/MsaPage/layouts/Compliance.tsx)

The manager sees Approve / Reject when **only one** thing is true ([Compliance.tsx:343-363](src/pages/MsaPage/layouts/Compliance.tsx#L343-L363)):

1. `userRole === "contract_manager"`

There is **no `hasFiles` check** and **no submission-status check**. The buttons are always visible to the manager regardless of whether the category has been submitted or even has files attached.

The endpoint shape itself is correct ([Compliance.tsx:316](src/pages/MsaPage/layouts/Compliance.tsx#L316)) — `/contract/manager/msa-contract/{id}/compliance/{policy|security}/approve` — the missing-`/contract`-prefix bug from the earlier audit (Wave 1, `369758628`) has shipped.

### User-flow gap

- **MSA Manager: can attempt to Approve / Reject in invalid states.** On Contract the buttons disappear until the vendor has submitted files; on MSA they are always live for the manager, so a manager can click Approve before anything has been submitted (or while the status is `approved` / `rejected` / `closed`). Best case: BE rejects with 400 and the toast surfaces it. Likely case: surprises and noise. This is the single behavioral drift in the manager flow.

### Non-gaps (already parity, do not "fix")

- Comment dialog vs auto-comment — both pages auto-generate the bulk comment. No dialog on either.
- Raw `userRole === "contract_manager"` string compare — both pages do this.
- Endpoint shape — fixed in Wave 1, currently correct.

---

## VENDOR / PM FLOW

### Expected (Contract)

Vendor / PM sees a single **Submit Policies / Submit Security** button when ([ComplianceSecurityTab.tsx:96-102](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx#L96-L102)):

1. `isVendor || isProjectManager`
2. **Either:** active category status is `pending` or `rejected`, **or** there is no status string AND no files yet (first-time submission).

Clicking opens the shared `SubmitPolicyDialog`, which posts to `/{role-base-path}/submit` for the active sub-tab (policy or security).

### Actual (MSA) — [Compliance.tsx:307-312](src/pages/MsaPage/layouts/Compliance.tsx#L307-L312)

Vendor / PM gate:

1. `isVendor || isProjectManager`
2. Status is `pending` or `rejected`. **No "first-submission" fallback.**

### User-flow gap

- **MSA Vendor/PM: cannot make the first-ever submission if the BE returns no status yet.** Contract has a fallback (`!status && !hasFiles → can submit`); MSA does not. If the BE convention is that a fresh MSA returns no `details.policyStatus` at all, the Submit button will be hidden and the vendor is stuck. (If BE always seeds a `pending` status on contract creation this is moot — worth a single API check.)

### Non-gaps

- `SubmitPolicyDialog` is shared, payload is identical.
- `basePath` shape `/contract/vendor/msa-contract/{id}/compliance` matches the Contract shape mod the `msa-contract` segment.

---

## APPROVER FLOW

Approver does not see the Compliance tab on either page. Whitelist-gated.

The MSA `Compliance.tsx` component carries a dead `isApprover` branch in `basePath` ([Compliance.tsx:100-101](src/pages/MsaPage/layouts/Compliance.tsx#L100-L101)) — harmless because the whitelist prevents the component from mounting for an approver, but should be trimmed during the eventual inline → shared-component refactor.

> Sanity-check the product spec: if approvers were ever expected to see Compliance, both pages currently hide it. Memory `project_compliance_approve_reject_location` (260524) confirms compliance Approve/Reject is *manager-only*, so approver-hidden is correct.

---

## VIEW-ONLY FLOW

Same as approver — tab hidden on both pages via whitelist. The MSA component again carries a dead `isViewOnly` branch ([Compliance.tsx:104-105](src/pages/MsaPage/layouts/Compliance.tsx#L104-L105)) but it is unreachable.

---

## Visible-data differences (what the user sees inside the tab body)

| Element | Contract | MSA | Notes |
|---|---|---|---|
| Header row | Title + Approve/Reject (when gated) + Submit (when gated) + Export Report | Same composition | ✅ |
| Stats grid layout | 2-column with formatted strings ([:458-509](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx#L458-L509)) | 3-column with `LabelItem` + `StatusBadge` chips for Insurance/Security status ([Compliance.tsx:400-433](src/pages/MsaPage/layouts/Compliance.tsx#L400-L433)) | Cosmetic. MSA actually surfaces the category status badges, which Contract doesn't — minor UX positive for MSA. |
| Security table — **Date column** | Has `dueDate` + `dueIn` derived from `s.dueDate` ([:258-283](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx#L258-L283), [:355-364](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx#L355-L364)) | **Missing entirely** — `SecurityRow` type has no `dueDate` / `dueIn`, no Date column in `securityColumns` ([Compliance.tsx:38-44](src/pages/MsaPage/layouts/Compliance.tsx#L38-L44), [:234-279](src/pages/MsaPage/layouts/Compliance.tsx#L234-L279)) | **Real drift.** MSA user cannot see when a security expires from the table. |
| Security row `id` priority | `securityTypeId` then `_id` ([:368](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx#L368)) | `_id` then `securityTypeId` ([Compliance.tsx:158-159](src/pages/MsaPage/layouts/Compliance.tsx#L158-L159)) | Per memory `project_compliance_api_shape`, security uses `securityTypeId`. MSA may show MongoDB ObjectIds in the visible Security ID column where Contract shows the human-meaningful `securityTypeId`. **Real drift.** |
| Closed-status tone | Falls through to default gray ([:288-305](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx#L288-L305)) | Explicit slate-100 / dark slate-800 ([Compliance.tsx:74-75](src/pages/MsaPage/layouts/Compliance.tsx#L74-L75)) | MSA is more correct here per canonical tone palette memory. Out-of-scope as a "fix" for MSA. |
| Search input | Present | Present | ✅ |
| Export Report | `ExportReportSheet contractType="Contract"` | `ExportReportSheet contractType="MsaContract"` | ✅ functional |
| `ComplianceDetailsSheet` per row | Shared | Shared (same `actionsDisabled` prop) | ✅ |

---

## Summary Matrix

| Role | Tab visibility | Action gates | Action target | Visible data |
|------|---|---|---|---|
| **Manager** | ✅ Match | ❌ MSA missing `hasFiles` + status gates | ✅ Match (endpoint fixed Wave 1) | ⚠️ Security table missing Date column |
| **Vendor / PM** | ✅ Match | ⚠️ MSA missing "first-submission" fallback | ✅ Match | ⚠️ Security table missing Date column; ID column may show ObjectId |
| **Approver** | ✅ Match (hidden on both) | ➖ N/A | ➖ N/A | ➖ N/A |
| **View-only** | ✅ Match (hidden on both) | ➖ N/A | ➖ N/A | ➖ N/A |

---

## Fix recommendations (prioritized)

1. **MSA Manager: gate Approve / Reject buttons** — port `canManagerActOnActive` from [ComplianceSecurityTab.tsx:104-116](src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx#L104-L116) into [Compliance.tsx](src/pages/MsaPage/layouts/Compliance.tsx) (introduce `hasFiles` helper + status set check). Highest-impact single fix in this tab.

2. **MSA Security table: add Date column** — port `dueDate` / `dueIn` derivation and the dual-line cell renderer from `ComplianceSecurityTab.tsx`. Security expiry visibility is a vendor / manager workflow concern.

3. **MSA Security row `id` priority: flip to `securityTypeId` first** — match the Contract shape and the documented API shape from memory.

4. **MSA Vendor/PM: add first-submission fallback** — extend `canSubmitActiveCategory` with the `!status && !hasFiles → true` branch from Contract. Confirm BE behavior on a freshly-created MSA before shipping; if BE seeds `pending`, this is a no-op and can be skipped.

5. **(Architectural, optional)** — collapse MSA's inline reimplementation into the shared `ComplianceSecurityTab` parameterized on `basePath` + `contractType`. Same approach as Wave 5 NCR Log refactor (`6d26a28f0`). Would close all the per-role drift at the source. Out of scope per the audit-scope memory (`feedback_audit_scope_behavior_not_architecture`), but the cleanest long-term answer.

---

## Out of scope / non-issues observed

- Inline `DataTable` reimplementation (architectural, intentionally not in scope).
- Search input MSA-only (UX-positive divergence, not a parity bug).
- `useUserQueryKey` wrapping in MSA — wired correctly here; the invalidation trap (memory `feedback_user_query_key_invalidation`) doesn't currently bite this tab.
- Stats grid layout difference (cosmetic).
- Dead `isApprover` / `isViewOnly` basePath branches in MSA `Compliance.tsx` (unreachable but tidy them during refactor).
