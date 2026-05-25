---
name: msa-rfi-flow-review
description: Per-role user-flow review of MSA RFI vs Contract Management. All four findings shipped — three direct fixes and one product-decided gate narrowing. RFI is the first reviewed Profile B tab in this audit run.
date: 2026-05-25
status: complete
---

# Summary

Reviewed RFI user-flow across manager, approver, vendor/PM, and view-only on MSA vs Contract Management. Unlike Amendments / Deliverables / NCR, **RFI is not a shared-component delegate** — MSA `Rfi.tsx` is 1147 lines of inline reimplementation, closer to Compliance's profile. The invalidation-key trap that bit the prior three audits is genuinely absent here. Drift surface was data shape + missing features + gate width.

## Findings

| # | Finding | Roles affected | Shipped? |
|---|---|---|---|
| 1 | `responder` field shape (MSA submitted comma-joined display labels instead of single ObjectId; multi-select for a singular BE field) | All MSA-created RFIs | ✅ Shipped `96d9f0f98` |
| 2 | MSA detail sheet missing Comments + Response tabs | All 4 roles on MSA | ✅ Shipped `af7106e70` (inline mirror) |
| 3 | Personnel pool path used outdated `/contracts/` assumption | Vendor/PM/Approver/Manager personnel pickers in IssueRfiDialog | ✅ Shipped `af7106e70` (same commit as #2) |
| 4 | Respond action gate wider on MSA than Contract (BE permits 3 roles; Contract restricts to approver-only; MSA allowed all 3) | Manager + Vendor/PM on MSA | ✅ Shipped `2f4363a35` — product picked "narrow MSA to approver-only" |

## What shipped (in commit order)

1. **`96d9f0f98`** — `fix(rfi): submit responder as singular ObjectId, not comma-joined labels`. Swapped `TextMultiSelect` → `TextSelect`, dropped the `responderLabels = options.map(.label).join(", ")` join, submit `data.responder` (the `_id`) directly. Mirrors Contract's `IssueRfiDialog` exactly. Closes the data-corrupting bug.

2. **`2f4363a35`** — `fix(rfi): narrow MSA Respond to approver-only via toast guard, mirroring Contract`. Added `!isApprover` early-return + toast in `RespondToRfiDialog.handleSubmit`. Per the user's product decision via AskUserQuestion 260525, narrow MSA to match Contract's approver-only restriction (rather than loosen Contract or switch both to identity-gating).

3. **`af7106e70`** — `fix(rfi): add Comments + Response tabs to MSA detail sheet, route personnel to /msa-contract/`. Inline mirror per user's scope decision: added `Tabs` wrapper with three tabs (Overview / Response (conditional on `isResponse`) / Comments), inline `RfiResponseContent` component, inline comments query + add-comment mutation + `MessageComposer` integration. Plus cleaned up the outdated personnel path comment and routed all four role branches to `/msa-contract/` per `project_be_msa_parallel_endpoints_default_assumption`. +325 / -66 lines.

## Verification

- `pnpm exec tsc -b` exit 0 after each commit.
- UI not exercised in dev server. UAT recommended on MSA:
  - **Issue RFI**: select a responder (single-select now), confirm the BE stores `responder` as the user's `_id` not their display name.
  - **Respond to RFI**: try as manager + vendor/PM (should toast-error with "Only approvers can respond to RFIs."); try as approver (should succeed).
  - **Detail sheet**: open any RFI, confirm Comments tab loads and "no comments yet" placeholder + composer render; post a comment, confirm it appears.
  - **Detail sheet**: open an RFI that has a response submitted, confirm the Response tab appears and renders the response description + files.
  - **Issue RFI personnel dropdown**: confirm it populates (was on `/contracts/`, now on `/msa-contract/`).

## Architectural note

RFI is the **first Profile B tab reviewed in this audit run** (per `feedback_bug_profile_tracks_architecture_not_wave_history`). The bug profile was entirely different from Amendments / Deliverables / NCR (Profile A, shared-component-delegate). Specifically:

- **Profile A trap absent**: MSA RFI uses `msa-rfi-*` query keys throughout its inline implementation — no `["contractRfis"]` hardcoding.
- **Profile B traps present**: data shape divergence (#1), feature-poor detail surface (#2), outdated endpoint assumption (#3), action gate width drift (#4).

Two Group A tabs remain (Change Mgmt §2 and Claims §3) — both Profile B per memory `project_msa_inline_vs_contract_delegate`. Expect more #1-#3-style findings, not the invalidation trap.

## Memory updates this session

- `project_msa_rfi_inline_reimpl_findings` — new finding-level capture (will be updated to reflect SHIPPED status post-checkpoint).
- `feedback_bug_profile_tracks_architecture_not_wave_history` — new audit heuristic. Architecture (inline vs delegate, signaled by file size) determines bug class, not wave history.
- `feedback_parity_direction_trim_msa_dont_expand_contract` — extended with action-gate nuance (ask product before narrowing capability BE permits).
- `MEMORY.md` index updated.
