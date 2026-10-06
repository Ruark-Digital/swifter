# Project State — SwiftPro FE

**Milestone:** v1.0 — Phase-2 QA + BE-Gap Remediation
**Current phase:** Phase 3 (FE Cleanup & Hardening) — Phases 1 & 2 largely shipped incrementally
Last activity: 2026-10-05 - Completed quick tasks 261005-sig (view-only MSA fixes #108/#105/#103 + #106 read tabs), 261005-pe7 (QA #135 action-log export + #115 Company Activity chart), and 261005-opo (Contract PM take-over detection reconciled to pendingProjectManager shape, QA #78 unblocked)

## Status

Brownfield app under incremental remediation. Much of Phase 1 (BE-unblocked FE gaps) shipped in PR #267 on `fix/phase2-qa260719-fe-only` → `fix/phase2-bug-fixes`. Phase 2 QA batches are ongoing per the review docs. Phase 3 cleanup (dead-branch prune, test coverage, tab sole-owner) is next.

## Key Decisions

- GSD is the default workflow (CLAUDE.md §0). Quick-task mode is the common case.
- PRs target `fix/phase2-bug-fixes`; `main` is dead.
- FE absorbs BE field-name drift via dual-read where the spec is ambiguous.

## Blockers/Concerns

- QA78 "pick existing PM by id" is now BE-UNBLOCKED: endpoints are in docs.json v2.3.0 (`/vendor/contracts/{id}/project-managers/{pmId}/assign`, `/manager/contracts/{id}/project-manager/approval`) and BE shipped FE_IMPLEMENTATION_GUIDE_PM_ASSIGNMENT.md. FE reconciled to the deployed `pendingProjectManager` shape in 261005-opo (dual-read with legacy fallback).
- Vendor-personnel redesign (tab + strip-from-edit + read-only) was REVERTED (ef058ecd3) — it was built on a triage assumption, not the BE spec. `PUT /manager/contracts/{id}` accepts personnel (CreateContractInput), so form-based edit is correct and restored. Any future vendor-personnel tab must be an ADDITIONAL, active-contract-only surface — never a replacement for form editing (drafts need the form). Verify docs.json before redesigning a flow.

## Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260723-0y0 | Prune dead approver/user redline-suggestion branches | 2026-07-23 | 4129d0daf | [260723-0y0-prune-dead-approver-user-redline-suggest](./quick/260723-0y0-prune-dead-approver-user-redline-suggest/) |
| 260723-91v | Make Vendor Personnel tab sole owner (stop EditContract/CreateMSADialog edit-PUT sending personnel) | 2026-07-23 | e79037cfd, d23fcfcf9 | [260723-91v-make-vendor-personnel-tab-sole-owner-sto](./quick/260723-91v-make-vendor-personnel-tab-sole-owner-sto/) |
| 260723-9dx | Make Step 2 personnel read-only on edit forms (REVERTED by ef058ecd3; superseded by status-gated tab fb389beaa) | 2026-07-23 | 1b2b3ecc3 | [260723-9dx-make-step-2-personnel-read-only-on-edit-](./quick/260723-9dx-make-step-2-personnel-read-only-on-edit-/) |
| 260723-att | Add Vitest coverage for RFI close/edit + Vendor Personnel gating (HARD-02) | 2026-07-23 | 06d5a0489 | [260723-att-add-vitest-coverage-for-rfi-close-edit-a](./quick/260723-att-add-vitest-coverage-for-rfi-close-edit-a/) |
| 260724-onj | Wire redline resolve/undo BE spec update: docName/baseVersionId + 409 handling on resolve, new undo endpoint + turn-gated UI | 2026-07-24 | a4c2c482b, e2f654272 | [260724-onj-wire-redline-resolve-undo-be-spec-update](./quick/260724-onj-wire-redline-resolve-undo-be-spec-update/) |
| 260724-t75 | Fix 9 QA bugs (#253 vendor-personnel refetch, #256 redline turn-gate, #258 admin delete endpoint, #259/260+#261+#264 dashboard chart/legend bugs, #262/263 Company Admin contract data wiring, #265/266 nav reorder, #269 role-aware AI chat prompts) | 2026-07-24 | 2607d33f8, cb7ee3e96, 6e6a25655, c4e7f1b19, c521d31f3 | [260724-t75-fix-9-confirmed-qa-bugs-vendor-personnel](./quick/260724-t75-fix-9-confirmed-qa-bugs-vendor-personnel/) |
| 260724-fast | Hide My Actions on Company Admin Contracts tab (permanently empty for this role), expand General Updates to full width | 2026-07-24 | ee4d69628 | (gsd-fast, no quick-task directory) |
| 260725-d4e | Fix Create New Company dialog: cap height with internal scroll, fix Subscription Duration select not persisting its value | 2026-07-25 | 918ff66e7, 04e5e59ae | [260725-d4e-create-company-dialog-fix](./quick/260725-d4e-create-company-dialog-fix/) |
| 260725-eb2 | Fix 4 QA bugs: registration password-visibility toggle (Forger memo froze inline closure), Company Modules tab raw yup errors (boolean coercion), Solicitation/Evaluation forms auto-submitting (multiselect.tsx buttons missing type="button"), User Management Role/Status filter crash (navigated to unregistered /dashboard/users route) | 2026-07-25 | 34a1367fc, 5a3484769, 2fce7a055, dff1430f3 | [260725-eb2-fix-4-qa-bugs-registration-password-togg](./quick/260725-eb2-fix-4-qa-bugs-registration-password-togg/) |
| 261005-opo | Reconcile Contract PM take-over detection to the deployed `pendingProjectManager` response shape (dual-read helper + legacy `projectManager.status==="pending"` fallback; requester-name resolution incl. bare ObjectId). QA #78 PM-assignment unblocked by BE (FE_IMPLEMENTATION_GUIDE_PM_ASSIGNMENT.md). | 2026-10-05 | 8bb6528da | [261005-opo-reconcile-contract-pm-take-over-detectio](./quick/261005-opo-reconcile-contract-pm-take-over-detectio/) |
| 261005-pe7 | QA #135 full contract action-log export (fetch all pages) + QA #115 Company Activity chart now reads the BE `{labels,datasets}` shape (was empty). QA #116 module-usage: FE verified correct from live payloads — BE returns zero-valued daily buckets for 30/7-day ranges (BE-side). | 2026-10-05 | 21625f39b, 9ec9d5dcf | [261005-pe7-fix-qa-115-116-135-super-admin-company-a](./quick/261005-pe7-fix-qa-115-116-135-super-admin-company-a/) |
| 261005-sig | View-only batch MSA-side: QA #108 hide approvers tab, #105 MSA linked contracts (/user), #103 hide "My MSA", #106 add read tabs (rate sheets, vendor key personnel, action log, clause library) wired to /user base paths. Extracted msaTabWhitelist.ts. #106 analytics/kpi/compliance/payment-summary + #104 remain BE-blocked. | 2026-10-05 | cd0c45c35, 8cf2dfa2a | [261005-sig-qa-103-105-108-view-only-msa-fixes-hide](./quick/261005-sig-qa-103-105-108-view-only-msa-fixes-hide/) |

