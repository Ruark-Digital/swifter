# Phase 260524: MSA vs Contract Detail-Tabs Logic Parity Audit — Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Type:** Quick phase (no ROADMAP.md entry — ad-hoc audit)

<domain>
## Phase Boundary

Produce a **read-only audit report** that documents, per detail tab × per user role, every place where the MSA detail-page tab does **not** match the equivalent Contract Management detail-page tab in **behavioral logic** — role gates / action visibility, API endpoint shape, and status semantics & tone.

**In scope** — the 12 tabs the user named:
1. Compliance & Security
2. Documents
3. Amendments
4. Deliverables
5. Payment Summary
6. LEM
7. Invoice
8. Change Management
9. Claims
10. RFI
11. NCR Log
12. Vendor's Reports

**User types in scope:** Manager (+ Admin, which shares manager paths), Vendor (paired with Project Manager via `isContractVendorLike`), Approver, View-only / read-only user.

**Out of scope (this phase):**
- Fixing the divergences — separate fix phase comes after.
- Architecture critique of "MSA reimplements vs reuses Contract components" — noted incidentally, not the focus.
- Dialog / Sheet payload comparisons beyond what's needed to verify role-gates / API / status parity.
- Dark-mode / styling drift (handled separately; see `project_msa_pages_dark_mode`, `project_contract_dark_mode_patterns`).
- Overview / Approvers / Analytics / Action-Log / Clause-Library / KPI / Rate-Sheets tabs.

</domain>

<decisions>
## Implementation Decisions

### Deliverable Shape
- **D-01:** Produce **audit report only** in this phase. Fix work is a separate phase (or phases). No code changes in this phase except the report file itself.
- **D-02:** Output is a **single `REPORT.md`** with one section per tab (12 sections). Each section contains a role × dimension matrix plus a findings list under that matrix.
- **D-03:** Reports live at `.planning/quick/260524-msa-contracts-tabs-logic-parity-audit/REPORT.md` (single file, no per-tab fragmentation).

### Audit Dimensions (what counts as a finding)
- **D-04:** Three dimensions are in scope: **Role gates & action visibility**, **API endpoint shape parity**, **Status semantics & tone**.
- **D-05:** Component reuse drift (MSA reimplementing a table inline vs reusing Contract's `*Tab` / `*Table` component) is **NOT a dimension** on its own. Mention it only when it manifests as a behavioral / API / status drift the user would notice.
- **D-06:** Dialog / Sheet body parity (Approve-Reject Pattern A vs B, comment payloads, etc.) is not its own dimension. If a dialog's role-gate or endpoint differs, capture it under D-04's three dimensions.

### Audit Order
- **D-07:** Audit in two groups, **role-aware Tables group first**:
  - **Group A (first):** Amendments, Change Management, Claims, Deliverables, NCR Log, RFI — these have the heaviest role/action gates and are where role drift bites hardest.
  - **Group B (second):** Compliance & Security, Documents, Payment Summary, LEM, Invoice, Vendor's Reports — includes the biggest line-count divergers (Invoice 127 vs 650, Compliance 78 vs 528) but mixed shapes.
- **D-08:** Group A and Group B both ship in the same `REPORT.md` — the group order controls write order, not file count.

### User-Role Coverage
- **D-09:** Every tab is evaluated against four role columns: **Manager**, **Vendor (incl. PM)**, **Approver**, **View-only / read-only**.
- **D-10:** Vendor and Project Manager are evaluated as one column — they pair via `isContractVendorLike` per `project_contract_role_guards`. Any code path that branches on raw `isVendor` without including PM is a finding (severity = Broken) — already a known foot-gun (`feedback_role_guards`).
- **D-11:** Admin is treated as Manager (admin reuses manager paths). Mention only if MSA diverges from this rule.

### Severity Rubric
- **D-12:** Four severities, in priority order:
  - **Broken** — action fails (e.g., 403, hits wrong endpoint, missing button blocks workflow, payload causes crash).
  - **Drifted** — behavior visibly differs from Contract but action still works (e.g., wrong status tone, label wording, extra/missing prompt, different polling cadence).
  - **Cosmetic** — pure style / copy that does not change behavior (still recorded so it can be filtered out later if needed).
  - **Missing** — Contract has a feature/action/status that MSA lacks (or vice versa).
- **D-13:** Every finding row gets: `severity | role(s) affected | dimension | Contract behavior | MSA behavior | evidence (file:line)`.

### Findings Format
- **D-14:** Each tab section has this structure:
  ```
  ## N. <Tab Name>
  
  ### Files
  - Contract: src/pages/ContractManagementPage/layouts/<X>.tsx
  - MSA:      src/pages/MsaPage/layouts/<Y>.tsx
  - Shared subcomponents (if any): …
  
  ### Parity Matrix
  
  | Dimension              | Manager | Vendor/PM | Approver | View-only |
  |------------------------|---------|-----------|----------|-----------|
  | Role gates & actions   | ✅ / ⚠️ / ❌ / ❓ | … | … | … |
  | API endpoint shape     | …       | …         | …        | …         |
  | Status semantics/tone  | …       | …         | …        | …         |
  
  Legend: ✅ match · ⚠️ drift · ❌ broken · ❓ missing · ➖ N/A (e.g., approver has no Compliance tab)
  
  ### Findings
  - **[S=Broken|Drifted|Cosmetic|Missing] [role]** — <Contract behavior> ↔ <MSA behavior>. Evidence: `path/file.tsx:LN-LN`.
  ```
- **D-15:** Cells in the matrix that are **N/A** (e.g., Approver has no Compliance tab — early-return at `ComplianceTabContent.tsx:57`) are marked `➖` and explained inline.

### Claude's Discretion
- **D-16:** I decide the per-tab investigation order within each group (most likely high-impact first based on memory entries and line-count gap).
- **D-17:** I decide whether a divergence belongs under Role-gates, API, or Status when ambiguous — but I pick the **most actionable** dimension for the future fixer.
- **D-18:** I decide how deep to inspect each role × dimension cell. Minimum bar: every cell is either marked ✅ with one sentence justifying it, or has at least one finding under it. No empty cells.
- **D-19:** Endpoint comparisons are **read code only** — I do NOT make HTTP calls or invoke backend. Path strings + payload shapes from code are sufficient evidence.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Codebase Map (consult before broad "where/how" questions)
- `.planning/codebase/STRUCTURE.md` — page/layout/component layout
- `.planning/codebase/ARCHITECTURE.md` — role-based API routing, query keys
- `.planning/codebase/CONVENTIONS.md` — naming, role-prefix rules
- `.planning/codebase/INTEGRATIONS.md` — axios baseURL, auth

### Contract-Page Source of Truth
- `src/pages/ContractManagementPage/ContractDetailPage.tsx` — tab orchestration + ROLE_TAB_WHITELIST hookup
- `src/pages/ContractManagementPage/layouts/` — 19 tab files; the 12 in scope listed in D-07
- `src/pages/ContractManagementPage/components/` — shared role-aware tables/sheets (ChangeTable, ChangeDetailsSheet, ComplianceSecurityTab, DocumentsList, DeliverablesTable, NcrTable, RfiTable, ClaimsTable, AmendmentsTable, InvoiceTable, LemTable, PaymentSummaryMilestonesTable, KpiTable, etc.)
- `src/pages/ContractManagementPage/api/` — `contractManagerApi.ts`, `approverApi.ts`, `vendorApi.ts`, `viewOnlyApi.ts`, `companyAdminApi.ts` — endpoint definitions per role

### MSA-Page Source of Truth
- `src/pages/MsaPage/MsaDetailPage.tsx` — tab orchestration + ROLE_TAB_WHITELIST (see `project_msa_detail_role_gates_and_rfi`)
- `src/pages/MsaPage/layouts/` — 16 layout files; the 12 in scope listed in D-07 (filename map: Amendments.tsx, ChangeManagement.tsx, Claims.tsx, Compliance.tsx, Deliverables.tsx, Documents.tsx, Invoice.tsx, Lem.tsx, NcrLog.tsx, PaymentSummary.tsx, Reports.tsx, Rfi.tsx)
- `src/pages/MsaPage/components/` — MSA-only sub-components (MSAClaimDetailsSheet, MsaReleaseHoldbackDialog, MsaUpdateSavingsDialog, MsaTable, LabelItem, StatusBadge)
- MSA has **no dedicated `api/` folder** — endpoints are inlined in each layout via `getRequest({ url: \`/contract/<role>/msa-contracts/${id}/…\` })`. This is a known divergence; document but do not refactor.

### API Documentation
- `docs/API_DOCUMENTATION_PHASE_2.md` — full route index for all 4 role prefixes (manager / vendor / approver / user); per `reference_api_doc_phase2`. Use to verify that the MSA endpoints inlined in layouts match swagger.

### Role + Auth Conventions
- `src/hooks/useUserRole.ts` — returns `isManager`, `isVendor`, `isProjectManager`, `isApprover`, `isAdmin`, `isViewOnly`. The `isContractVendorLike = isVendor || isProjectManager` derivation is the rule (`project_contract_role_guards`).
- `src/hooks/useUserQueryKey.ts` — appends `userId` to query keys; invalidation must use **bare prefixes**, never wrapped (`feedback_user_query_key_invalidation`).
- `src/lib/axiosInstance.ts` — baseURL is `/api/v1/dev` (no `/contract`); every route self-prefixes `/contract/...` (`project_axios_base_url`).

### Known Divergences Already Logged in Memory (seed list — verify each holds)
- `project_msa_detail_role_gates_and_rfi` — MSA `ROLE_TAB_WHITELIST` hides "approvers" tab from approver/vendor/PM; MSA RFI dialog gained a responder multi-select; reused Contract components leak light-only.
- `project_msa_deliverables_endpoints` — MSA per-role deliverable route list; vendor uses `/submit` not `/approve`; new `/user/contract/{id}/personnel` uses singular `contract` like manager.
- `project_msa_list_id_shape` — MSA list endpoint keys items by `id`, not `_id`. Spot-check that detail tabs read the right field.
- `project_create_list_refetch_audit_260518` — MSA invalidation wrapped-prefix bug; verify each MSA tab's create→list invalidation.
- `project_compliance_approve_reject_location` — Approve/Reject buttons removed from `ComplianceDetailsSheet`; live on parent tab only. Verify MSA respects this.
- `project_documents_tab_edit_gate` — Documents edit gating is **status === "pending_approval"**, not date-based. Verify MSA matches.
- `project_contract_role_guards` + `feedback_role_guards` — `isContractVendorLike` rule. Any MSA file with raw `isVendor` is a Broken-severity finding for PM.
- `project_contract_claims_plural` — claims endpoint is plural across roles; verify both MSA list + detail use plural.
- `project_approver_stats_field_aliases` — `/approver/.../changes/stats` returns `completed`/`cancelled` instead of `approved`/`rejected`. Check whether MSA approver stats have the same alias trap and whether MSA falls back the same way.
- `project_amendment_approve_gate` / `feedback_amendment_approve_gate` — Manager uses Assign-Approval, not Approve/Reject. Verify MSA Amendments manager behavior.
- `project_change_management_role_options` — Manager: Directive+Order; Vendor: Request+Order+Proposal (no Directive); Proposal is vendor-only. Verify MSA Change Management presents the same per-role create options.
- `project_ncr_capa_workflow` — submittedBy approves CAPA and closes NCR via 8-item checklist when status flips to `approved`. Verify MSA NCR has this flow.
- `project_deliverable_role_scoped_action_gates` — single-gate on `approverStatus === "pending"` for both approver and manager. Verify MSA Deliverables uses the same single-gate.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets the Audit Should Cross-Check
- **Contract role-aware tables** under `ContractManagementPage/components/` (ChangeTable, ClaimsTable, AmendmentsTable, DeliverablesTable, NcrTable, RfiTable, InvoiceTable, LemTable, ApproversTable, PaymentSummaryMilestonesTable, KpiTable, ContractsTable, VendorContractsTable) — these are the **role-gate / status-tone source-of-truth**. When MSA inlines a `DataTable` rather than importing one of these, role-gate logic typically drifts.
- **Contract detail sheets** under `ContractManagementPage/components/` (ChangeDetailsSheet, ClaimDetailsSheet, ComplianceDetailsSheet, ApproverChangeDetailsSheet, ActionLogDetailsSheet, HoldbackDetailsSheet, SavingsDetailsSheet) — many are reused as-is by MSA layouts (good); some (e.g., `MSAClaimDetailsSheet`) MSA reimplements (verify drift).
- **`StatusBadge` + tone helpers** — Contract has a canonical tone palette (closed=grey, approved=green, rejected=red, pending=yellow per `90c92d27c` commit). MSA layouts often inline a `statusTone()` helper (e.g., `ChangeManagement.tsx:41-47`, `Compliance.tsx:63-74`) — check each.

### Established Patterns the Audit Will Apply
- **Role prefix:** Contract → `/contract/<role>/contracts/{id}/…`, MSA → `/contract/<role>/msa-contracts/{id}/…`. Both branch over `isManager | isApprover | isContractVendorLike | (isAdmin|isViewOnly)`. Audit verifies same branch shape across both.
- **`actionsDisabled` prop:** Contract tabs accept `actionsDisabled` and pass it down to hide write actions. MSA tabs accept it too (per file scout) but verify it's wired to the same actions.
- **`ROLE_TAB_WHITELIST`:** Per `project_msa_detail_role_gates_and_rfi`, MSA hides "approvers" tab from approver/vendor/PM. Contract has its own whitelist (see `ContractDetailPage.tsx`). The audit treats these as N/A cells, not gaps.

### Integration Points
- The audit only **reads** code. No backend calls, no UI launches, no behavior tests in this phase. Evidence lines are `file:line` references to TypeScript source.
- `docs/API_DOCUMENTATION_PHASE_2.md` is the authoritative endpoint reference — when MSA layout disagrees with swagger AND with Contract, mark Broken.

### Known Architectural Pitfalls (don't get distracted by these)
- Pre-existing tsc / xlsx / mammoth / oversized-chunk warnings — `project_build_state_and_traps`. Ignore unless they obstruct reading the code.
- Yoopta vs TipTap collaborative-editor split — unrelated to detail tabs. Skip.
- Dark-mode drift in MSA — handled elsewhere (`project_msa_pages_dark_mode`); only mention if it intersects with behavior.

</code_context>

<specifics>
## Specific Ideas

- The user named the **12 tabs in a specific order** (Compliance & Security → Vendor's Reports). The report should present tabs **in audit-order** (Group A first per D-07), but the master table-of-contents at the top of `REPORT.md` should list them in the user's original 1–12 order for easy lookup.
- The user described this work as **"wherever the msa tabs does not match the corresponding tab's logic"** — this is a one-directional comparison: Contract is the reference, MSA is the candidate. Findings phrased as "MSA does X, Contract does Y". Do not flag cases where Contract is the deviant.
- The "user types" the user said to cover: implied by the role-aware Tables and codebase memory — Manager, Vendor, PM, Approver — plus View-only added per D-09 to catch `/user/` endpoint drift.

</specifics>

<deferred>
## Deferred Ideas

### To Fix Phase(s) (after this audit ships REPORT.md)
- Rewriting MSA tabs to reuse Contract's `*Tab` / `*Table` components where the audit flags repeated role-gate drift.
- Closing the MSA `useUserQueryKey` invalidation no-op trap on any tab found in this audit.
- Adding the NCR-CAPA-close checklist flow to MSA if missing.
- Aligning MSA approver stats field aliases (completed/cancelled vs approved/rejected) wherever the alias trap recurs.

### Out of Scope for This Phase
- **Component-reuse refactor architecture** (the user explicitly excluded "Component reuse + dialog parity" as an audit dimension). Note opportunistically; don't lead findings with it.
- **Dark-mode parity** between Contract and MSA tabs — already tracked in `project_msa_pages_dark_mode` and `project_contract_mgmt_dark_mode_260521`.
- **Overview / Approvers / Analytics / Action-Log / Clause-Library / KPI / Rate-Sheets tabs** — not in the user's list of 12.
- **Behavior testing / E2E** — the audit is static read of code. UAT is a different phase.

</deferred>

---

*Phase: 260524-msa-contracts-tabs-logic-parity-audit*
*Context gathered: 2026-05-24*
