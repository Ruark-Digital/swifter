---
name: msa-claims-flow-review
description: Per-role user-flow review of MSA Claims vs Contract. All six findings shipped — most-drift Group A tab restored to parity via two-commit sequence (4 one-liners + shared-table swap). MSA Claims now Profile A.
date: 2026-05-25
status: complete
---

# Summary

Reviewed Claims user-flow across manager, approver, vendor/PM, and view-only on MSA vs Contract Management. Surfaced six bugs — the most-drift Group A tab. MSA Claims was Profile B+ (inline table + forked details sheet), with the URL plurality bug causing 75% of roles to silently 404 and the forked sheet missing every claim-action affordance.

## Findings

| # | Finding | Shipped? |
|---|---|---|
| 1 | URL plurality flip — MSA always sent plural `claims`; BE has manager plural, approver/vendor/view-only singular. Three roles 404. | ✅ Shipped `f50774bf1` |
| 2 | `MSAClaimDetailsSheet` missing every claim-action affordance (Approve/Reject/Send-for-Approval/identity-gated approver flow) | ✅ Shipped `0f50a3d12` (via shared-table swap) |
| 3 | Comment POST submitted `{ comment }`; BE expects `{ content }` | ✅ Shipped `f50774bf1` |
| 4 | Hardcoded Contract paths in `ChangeDetailsSheet` claim branch — blocked the swap fix | ✅ Shipped `0f50a3d12` (parameterized) |
| 5 | Create Claim manager gate dropped on MSA | ✅ Shipped `f50774bf1` |
| 6 | Details sheet read `detail.documents`; BE returns `detail.files` | ✅ Shipped `f50774bf1` |

Plus bonus fix: comment render `c.comment` → `c.content` (same field-name-mismatch class as #3).

## What shipped

1. **`e356ceb47`** — `fix(msa): invert actionsDisabled gate, unlocking Create/Approve buttons on active MSAs`. Not a Claims finding strictly, but Claims is one of the five tabs that benefited. User surfaced via screenshot when Create Change button looked greyed out. Single replace_all in `MsaDetailPage.tsx` flipped 5 inverted `actionsDisabled` props from `"publish"` to `"pending_approval"`.

2. **`f50774bf1`** — `fix(claims): role-aware URL plurality + comment payload field + files vs documents + manager Create gate`. Five trivial edits across `Claims.tsx` and `MSAClaimDetailsSheet.tsx`. Closed BUGS #1, #3, #5, #6 + the comment render bonus. After this commit, approver / vendor / view-only could finally load the Claims tab on MSA without 404s.

3. **`0f50a3d12`** — `fix(claims): swap MSA inline table for shared ClaimsTable, restoring full claim workflow`. Parameterized `ChangeDetailsSheet`'s claim-flow hardcodes (`claimAssignUrl?`, context-aware default `listInvalidateQueryKey`), threaded new props through `ClaimsTable` via `meta`, refactored MSA `Claims.tsx` from inline DataTable to `<ClaimsTable />`. Net −98 lines across 3 files. MSA Claims collapses from **Profile B+ → Profile A**, converging with the rest of Group A.

## Architectural transition

| Aspect | Before | After |
|---|---|---|
| MSA Claims profile | B+ (inline table + forked details sheet) | A (delegate to shared `ClaimsTable` + `ChangeDetailsSheet`) |
| MSA `Claims.tsx` size | 349 lines | 203 lines |
| Roles that can load Claims tab | 1 of 4 (manager only) | 4 of 4 |
| Roles that can act on claims | 0 of 4 | All applicable roles (manager + approver per gate logic) |
| `MSAClaimDetailsSheet.tsx` | 357 lines, actively used | 357 lines, **dead code** — pending cleanup |

## Verification

- `pnpm exec tsc -b` exit 0 after each commit.
- UI not exercised in dev server. UAT recommended on MSA:
  - **Manager**: open Claims → "Create Claim" button now visible (was hidden); click → dialog opens, submit creates a claim; on detail sheet, can Approve / Reject cost claims directly or Send-for-Approval for time-impact claims.
  - **Approver**: list loads (was 404'ing); open a time-impact claim → Identity-gated Approve / Reject buttons appear at the active approval level.
  - **Vendor / PM**: list loads; can create claims; can add comments and have them actually post to BE; can view attached files in details sheet (was empty before due to documents/files mismatch).
  - **View-only**: list loads.

## Sidebar cleanup

`MSAClaimDetailsSheet.tsx` (357 lines) is now dead code. Not deleted because a test mock at `src/pages/MsaPage/__tests__/claims.test.tsx:88` still references the path. Deletion is a separate concern — either update/remove the mock and delete the file, or leave for the next grooming pass.

`ClaimDetailsSheet.tsx` (390 lines in `ContractManagementPage/components/`) — separately dead code, also not imported anywhere. Pre-existing dead code unrelated to this work. Same disposition: leave for grooming.

## Cross-cutting tally

Five Group A invalidation-trap instances, all shipped:

| # | Component | Commit |
|---|---|---|
| 1 | `AmendmentsTable.tsx` | `b7e30180a` |
| 2 | `DeliverablesTable.tsx` | `3583a08d3` |
| 3 | `NcrTable.tsx` + `CreateNcrDialog.tsx` | `84cae6903` |
| 4 | `ChangeDetailsSheet.tsx` line 298 (changes mode) | `8d8f2e7d8` |
| 5 | `ChangeDetailsSheet.tsx` line 700 (claims mode) | `0f50a3d12` |

Plus the parent-layout actionsDisabled inversion fix (`e356ceb47`) that's a different bug class entirely and unblocked all five action tabs on MSA simultaneously.

## Group A status — all six tabs reviewed and shipped

| Tab | Final Profile | Status |
|---|---|---|
| Compliance | B (inline) | ✅ |
| Amendments | A | ✅ |
| Deliverables | A | ✅ |
| NCR Log | A | ✅ |
| RFI | B (inline) | ✅ |
| Change Mgmt | A (was Hybrid, collapsed via swap) | ✅ |
| **Claims** | **A (was B+, collapsed via swap)** | ✅ |

Group A complete. Two MSA tabs (Compliance, RFI) intentionally remain Profile B because of UX/feature complexity that didn't warrant a swap; both have their findings closed within the Profile B shape.

## Memory updates this session

- `project_msa_claims_flow_findings` → flip to SHIPPED with three commit refs.
- `feedback_shared_component_hidden_invalidation_keys` → tally to 5 instances; add the claim-flow-specific dual-purpose-sheet variant.
- `project_msa_url_routing_bug_classes` → Class 4 entry (role-asymmetric noun plurality within a tab) already added previously; Claims is the canonical confirmed instance.
