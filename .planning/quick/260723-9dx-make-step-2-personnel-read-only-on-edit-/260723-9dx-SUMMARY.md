---
phase: 260723-9dx-make-step-2-personnel-read-only-on-edit-
plan: 01
subsystem: contract-management, msa
tags: [ui, forms, personnel, edit-mode]
dependency-graph:
  requires: []
  provides: [personnelReadOnly-prop]
  affects: [Step2ContractTeam.tsx (contract), Step2ContractTeam.tsx (msa), EditContract.tsx, CreateMSADialog.tsx]
tech-stack:
  added: []
  patterns: [conditional Forger vs static read-only block, gated by boolean prop]
key-files:
  created: []
  modified:
    - src/pages/ContractManagementPage/components/Step2ContractTeam.tsx
    - src/pages/ContractManagementPage/components/EditContract.tsx
    - src/pages/MsaPage/components/Step2ContractTeam.tsx
    - src/pages/MsaPage/layouts/CreateMSADialog.tsx
decisions:
  - "personnelReadOnly defaults to false so CREATE flows (CreateContractSheet, MSA create) require no changes"
  - "MSA edit/create share one component (CreateMSADialog), so personnelReadOnly={isEditing} gates it dynamically instead of a static true/false"
metrics:
  duration: "~15 min"
  completed: 2026-07-23
---

# Phase 260723-9dx Plan 01: Make Step 2 Personnel Read-Only on Edit Summary

Added a `personnelReadOnly` prop to both Step2ContractTeam components (Contract and MSA) that swaps the editable `TextTagInput` personnel field for a static read-only list plus a "Manage vendor personnel from the Vendor Personnel tab." note, wired true on Contract EditContract.tsx and conditionally via `isEditing` on MSA CreateMSADialog.tsx, since personnel edits made there are silently discarded on save (personnel is now owned solely by the Vendor Personnel tab, per commits 6cd5433f2/e79037cfd/d23fcfcf9).

## What Was Built

### Task 1: Contract Step2ContractTeam + EditContract
- `src/pages/ContractManagementPage/components/Step2ContractTeam.tsx`: added `personnelReadOnly?: boolean` (default `false`) to `Props`; added a `useWatch` on the `personnel` field via the existing `formContext`; the personnel `Forger` block is now conditional — when `personnelReadOnly` is true it renders a static list of `{ text, meta.email }` entries (or "No personnel on record." if empty) plus a helper note, otherwise the original `<Forger name="personnel" component={TextTagInput} .../>` renders unchanged.
- `src/pages/ContractManagementPage/components/EditContract.tsx`: added `personnelReadOnly` (unconditionally true, since this file only renders the edit flow) to the Step2ContractTeam render call.
- `CreateContractSheet.tsx` was **not touched** — it renders `<Step2ContractTeam setValue={setValue} />` with no `personnelReadOnly`, so it defaults to `false` and stays fully editable.

### Task 2: MSA Step2ContractTeam + CreateMSADialog
- `src/pages/MsaPage/components/Step2ContractTeam.tsx`: same pattern as Task 1 — added `personnelReadOnly?: boolean` to `Props`, watched `personnel` via existing `formContext`, and mirrored the same read-only rendering block.
- `src/pages/MsaPage/layouts/CreateMSADialog.tsx`: passed `personnelReadOnly={isEditing}` to the Step2ContractTeam render call (this file handles both create `isEditing=false` and edit `isEditing=true` in one component, so create stays editable and edit becomes read-only).

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc -b` completed with zero errors (clean build across the whole project).
- Confirmed via diff: `CreateContractSheet.tsx` and MSA create path (`isEditing=false`) receive no `personnelReadOnly=true` — only `EditContract.tsx` unconditionally and `CreateMSADialog.tsx` conditionally via `isEditing`.

## Known Stubs

None.

## Threat Flags

None — this change only alters client-side form rendering; no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- FOUND: src/pages/ContractManagementPage/components/Step2ContractTeam.tsx
- FOUND: src/pages/ContractManagementPage/components/EditContract.tsx
- FOUND: src/pages/MsaPage/components/Step2ContractTeam.tsx
- FOUND: src/pages/MsaPage/layouts/CreateMSADialog.tsx
- FOUND commit: 1b2b3ecc3
