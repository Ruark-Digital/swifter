# FE Revalidation of Struck Items (2026-05-31)

Verified every struck item that has an FE component (~79 items across 7 surface families)
against the current `phase2-bug-local-fixes` branch. Each verdict is backed by `file:line`
evidence from a read-only code sweep. For `FE + BE` items only the FE side was assessed.

**Result:** the overwhelming majority are genuinely fixed. **5 struck items are NOT fixed on
the FE, 5 are PARTIAL.** Those 10 are listed first — they are the actionable gaps.

---

## ❌ Struck but NOT actually fixed (FE)

| Doc # | Item | Finding | Location |
|-------|------|---------|----------|
| 30 | RFI filter by "Issued"/"Received" | **"Issued" tab is always empty.** Filter compares `type === "issued"` but the real row value is `"issue"` (singular). "Received" works; "Issued" never matches. One-line fix. | `ContractManagementPage/layouts/RfiTabContent.tsx:560` |
| 71 | Publish date incorrect | **Still shows the draft `createdAt`**, not a real publish date. FE picks the wrong field. | `ContractManagementPage/index.tsx:324` (`published: c.createdAt …`) |
| 14 | General Updates — duplicate lines | **No dedup exists.** Transformer does a 1:1 `data.map(...)`; duplicate BE rows still render as duplicate lines. | `lib/dashboardDataTransformer.ts:2290-2367` |
| 38 | "My Action" clickable for ALL types (NCR/Deliverables/Changes) | **Only links to the generic contract page.** No per-type deep-link via `detailRef`/`detailType`; every type routes to `…/{contractRef}`. | `lib/dashboardDataTransformer.ts:2301-2316` |
| 2 | Add "Others" to category | **No FE-injected "Others" option.** Category list is purely whatever the BE returns. (Arguably a BE item — flagged for routing.) | `…/Create…/Step1BasicInfo.tsx:152-161` |

## ⚠️ Struck but only PARTIAL (FE)

| Doc # | Item | What's done / what's missing | Location |
|-------|------|------------------------------|----------|
| 68 | Clause Library full details / summary / dropdown | Expander works; Contract Value shows. But **"Not specified"** fallback remains and summary is not expanded to ~3 lines. *(Outstanding item #21 in the not-struck list already says this isn't fixed — corroborates.)* | `…/ClauseLibraryTabContent.tsx:698,716,704-717` |
| 17 | Action Log — add description | Real descriptions render when present, but **"Unknown"/"No description"** fallbacks remain for missing data. | `…/ActionLogTabContent.tsx:64-101` |
| 40 | Action Log — repetitions/order/hide vendor | Ordering consistent (sorted desc) and vendor-side excluded (query gated to internal roles). But **no dedup** for repeated entries. | `…/ActionLogTabContent.tsx:55-102` |
| 69 | Action Log View — info + X/Export spacing | "View" sheet shows full info; the **Export button was removed entirely** (so no overlap), but no deliberate spacing fix is observable. | `…/components/ActionLogDetailsSheet.tsx:219-232` |
| 27 / 66 | Vendor name in CM list columns | Renders, but the CM "Vendor" column **prefers the project-manager name over the vendor name** (`c.projectManager?.name ?? c.vendor?.name`), so it can display the PM instead of the vendor. | `ContractManagementPage/index.tsx:321` |

## 🔵 FE correct — final correctness depends on BE (noted, not a FE gap)

| Doc # | Item | Note |
|-------|------|------|
| 70 | Status "Published" vs "Pending Approval" | FE maps both statuses correctly; it renders whatever status BE returns. No FE override. |
| 34 / 49 / 50 | PL CM dashboard / dashboard "All Contracts" | FE rendering wired; no distinct `project_lead` branch — relies on BE role naming + counts. |
| (RFI Respond) | Vendor RFI "Respond" gating | Gated on row `type`/`status`; correct *if* BE flips `type→received` after the client responds. No explicit FE "client-responded" flag. |

---

## ✅ Verified FIXED with code evidence (by family)

- **Contract Creation Wizard (11/12):** deliverable stray-text removed; milestone amount/date validation; preview resolves type/category/payment-term/vendor/manager names (no ObjectIds); security fields + Title-Case; past effective & formation dates allowed; PM label reworded + greyed; multi-security + "Labour and Material Bond"; vendor personnel/PM hydration on draft re-open.
- **Save / Edit / Draft retention (6/6):** save-as-draft wired at approver stage; full edit hydration via `reset(...keepDirtyValues:true)`; Stage-1 retention; document/existingFiles retention; payload includes currency/vendor/personnel/projectManager; Projects edit reuse with `retainedExistingFiles` + PATCH.
- **Dashboard / Analytics (8/13 solid):** Create Contract button wired; vendor-label clustering fixed (tick truncation/spacing); portfolio time filters clickable; Activities month axis corrected; compact `$x.xM/K` formatting; project/category cards render names; clean contract-number/Alerts; Financial Overview defensive coercion.
- **Approver profile (7/7):** Analytics tab added; Create Contract & Create MSA gated out; assigned-approvals shows real count; My Action pulls real approver action-logs; full name+email (never ObjectId); Edit Business Division button wired.
- **RFI / Deliverables / Invoice (9/11):** RFI CM comments render; vendor can comment; deliverable status mapping; vendor=Submit / CM+approver=Approve-Reject (not reversed); CM-as-approver can approve; MSA deliverables use correct MSA `id`; invoice "Duration" placeholder gone; CM invoice Approve/Reject; vendor report accepts PDF/Word.
- **MSA / Change Mgmt / Amendments (13/13):** MSA Contract Manager name fallback chain; **real** MSA Analytics tab (11 dashboard queries, not the reverted placeholder); Edit-draft PM/stakeholder hydration; formation-stage durations from real data; per-role change submit-button labels; amendment create wired; MSA category + awarded-solicitation selection; collaboration tool loads (lazyWithRetry); KPI "last updated" guarded to "-"; key personnel render real fields; "Savings Realized" spelling; project-details Export `mr-10` clear of close X.

**Tally:** ~79 FE-component struck items → ~64 FIXED · 5 PARTIAL · 5 NOT FIXED · 5 BE-dependent (FE OK).
