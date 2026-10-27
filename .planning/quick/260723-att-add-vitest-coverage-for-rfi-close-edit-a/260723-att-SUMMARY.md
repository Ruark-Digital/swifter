---
phase: 260723-att-add-vitest-coverage-for-rfi-close-edit-a
plan: 01
subsystem: testing
tags: [vitest, rfi, vendor-personnel, regression-coverage]
dependency-graph:
  requires: []
  provides:
    - test-coverage-rfi-close-singular-url
    - test-coverage-rfi-edit-parity
    - test-coverage-vendor-personnel-status-gate
  affects:
    - src/pages/ContractManagementPage/components/RfiTable.tsx
    - src/pages/MsaPage/layouts/Rfi.tsx
    - src/pages/ContractManagementPage/layouts/VendorPersonnelTabContent.tsx
tech-stack:
  added: []
  patterns:
    - "Real (unmocked) DataTable for Contract RfiTable and VendorPersonnelTabContent tests — the real component correctly invokes column cell() renderers via TanStack Table's flexRender, so no custom cell-invoking mock was needed there."
    - "Custom cell-invoking DataTable mock only where an existing test file already had pagination-attribute assertions tied to a simplified stub (MSA rfi.test.tsx) — extended in place to also invoke cell() per row/column."
    - "Gating driven off the row's raw rfi/fallback prop, not the detail query — both RfiDetailsSheet implementations fall back to prop data when the (disabled, since sheet isn't opened) detail query hasn't resolved."
key-files:
  created:
    - src/pages/ContractManagementPage/__tests__/rfi-close-edit.test.tsx
    - src/pages/ContractManagementPage/__tests__/vendor-personnel-tab.test.tsx
  modified:
    - src/pages/MsaPage/__tests__/rfi.test.tsx
decisions:
  - "Used the real @/components/layouts/DataTable in the two new test files instead of mocking it — its real cell renderers work correctly under jsdom via TanStack Table, avoiding the risk of a custom mock diverging from real invocation semantics."
  - "Extended (rather than replaced) the existing MSA rfi.test.tsx DataTable mock to keep the pre-existing pagination-attribute assertions passing while also invoking cell() renderers for the new gating tests."
metrics:
  duration: "~45m"
  completed: "2026-07-23"
---

# Phase 260723-att Plan 01: Vitest coverage for RFI close/edit URLs and Vendor Personnel gating Summary

Added three Vitest files (two new, one extended) asserting the singular `/rfi/{id}/close` URL, the plural-vs-singular RFI edit path split, and the Vendor Personnel status/owner gate + PUT url/payload — regression coverage for flows hand-fixed earlier this session.

## What was built

1. **`src/pages/ContractManagementPage/__tests__/rfi-close-edit.test.tsx`** (new, 5 tests) — mounts the default-exported `RfiTable` with the real (unmocked) `DataTable` so the "actions" column's `RfiRowActions`/`RfiDetailsSheet` mounts naturally via TanStack Table's `flexRender`. `IssueRfiDialog` (imported from `../layouts/RfiTabContent`) is mocked to a stub that serializes its `basePath`/`mode`/`editPath` props to a `data-testid="issue-rfi-dialog-props"` element, making the plural-vs-singular edit-URL wiring assertable without driving a real form submission.
   - Issuer + status "open": close button posts to singular `/contract/manager/contracts/{contractId}/rfi/{rfiId}/close` (not `/rfis/`).
   - Non-issuer: close button absent.
   - Issuer + status "closed": close button absent even for the issuer.
   - Issuer, contract-manager role: edit dialog wired to plural `/contract/manager/contracts/{contractId}/rfis`.
   - Issuer, approver role: edit dialog wired to singular `/contract/approver/contracts/{contractId}/rfi` (no trailing `s`).

2. **`src/pages/MsaPage/__tests__/rfi.test.tsx`** (extended, existing pagination test + 4 new) — added a mutable `@/store/authSlice` mock (`useUser`/`useSetReset`), extended the `@/components/ui/dialog` mock with `DialogHeader`/`DialogDescription` (required by the real, unmocked `ConfirmAlert`), and replaced the row-count-only `DataTable` stub with one that both preserves the pre-existing pagination-attribute assertions and invokes each column's `cell()` per row so the "actions" column (and thus `RfiDetailsSheet`) mounts.
   - Issuer + status "open": close button posts to singular `/contract/manager/msa-contracts/{contractId}/rfi/{rfiId}/close`.
   - Non-issuer: close and edit triggers both absent.
   - Issuer + status "closed": close and edit triggers both absent (MSA gates edit on the same `isIssuer && !isClosed` condition as close — unlike Contract, where only close is closed-gated).
   - Issuer + status "open": edit trigger renders the real, unmocked `IssueRfiDialog` with title "Edit RFI" (MSA has no plural/singular split — same `basePath` serves close and edit for every role).

3. **`src/pages/ContractManagementPage/__tests__/vendor-personnel-tab.test.tsx`** (new, 6 tests) — mounts the default-exported `VendorPersonnelTabContent` with the real `DataTable` and real `Input`/`Dialog` form fields (dialog primitives mocked as inert pass-throughs, not hidden).
   - Draft status + owner + manager: "Add Personnel" and per-row Edit/Remove absent.
   - Active status + owner + manager: all present.
   - Publish status + owner + company-admin (non-manager): all present — confirms company-admin is an equally valid manage-capable role.
   - Active status + non-owner + manager: "Add Personnel" absent — active status alone isn't sufficient without ownership.
   - Contract type: Save PUTs to `/contract/manager/contracts/{contractId}/vendor-personnel` with a `personnel` array payload containing the entered name/email.
   - MsaContract type: Save PUTs to `/contract/manager/msa-contracts/{contractId}/vendor-personnel`.

## Verification

```
npx vitest run src/pages/ContractManagementPage/__tests__/rfi-close-edit.test.tsx src/pages/MsaPage/__tests__/rfi.test.tsx src/pages/ContractManagementPage/__tests__/vendor-personnel-tab.test.tsx
```
Result: 3 files passed, 16/16 tests passed.

Grep-confirmed singular `/rfi/{id}/close` assertions exist in both `rfi-close-edit.test.tsx` (line 175: `` `/contract/manager/contracts/${CONTRACT_ID}/rfi/${RFI_ID}/close` ``) and the MSA test's new Test 1, plus an explicit `not.toMatch(/\/rfis\//)` guard in both — a regression back to the plural close path would fail these tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] `TabsContent` requires a `Tabs` provider**
- **Found during:** Task 3 (Vendor Personnel tab test), first run.
- **Issue:** `VendorPersonnelTabContent` renders a real `@/components/ui/tabs` `TabsContent` as its root element. Radix's `TabsContent` throws `"TabsContent must be used within Tabs"` when mounted standalone (the real app always nests it inside a parent `Tabs`, which the plan didn't anticipate needing for this isolated component test).
- **Fix:** Added a `vi.mock("@/components/ui/tabs", ...)` stubbing `TabsContent` as an inert `<div>` pass-through, consistent with how `Tabs`/`TabsContent` are already mocked in the other two files in this plan.
- **Files modified:** `src/pages/ContractManagementPage/__tests__/vendor-personnel-tab.test.tsx`
- **Commit:** 06d5a0489

No other deviations — the plan's guidance to use the real `DataTable` (confirmed correct after reading `src/components/layouts/DataTable/index.tsx`, which uses TanStack Table's `flexRender` and works correctly with real `cell()` renderers under jsdom) meant Tasks 1 and 3 needed no custom cell-invoking mock at all, simplifying those two files relative to the plan's fallback guidance.

## Known Stubs

None — all three files exercise real component render paths; no hardcoded empty/placeholder data flows into assertions.

## Threat Flags

None — test-only changes, no new production surface introduced.

## Self-Check: PASSED

- FOUND: `src/pages/ContractManagementPage/__tests__/rfi-close-edit.test.tsx`
- FOUND: `src/pages/ContractManagementPage/__tests__/vendor-personnel-tab.test.tsx`
- FOUND: `src/pages/MsaPage/__tests__/rfi.test.tsx` (modified)
- FOUND commit: `06d5a0489`
