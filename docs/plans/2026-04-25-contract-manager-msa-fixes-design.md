# Contract Manager + MSA Fixes Design

## Problem Statement
This change set aligns Contract Manager and MSA creation behavior with current backend responses and role expectations. The core goals are to ensure MSA create payload schema correctness (`msaType`), preserve user-selected currency, clean upload state after successful submission, display project manager name in the contract table vendor column, keep resend action unavailable for active project managers, correct security ID/detail rendering in compliance views, increase create MSA dialog width by 5%, and remove Vendor Management from Contract Manager dashboard navigation only.

## Architecture Overview
The implementation is a targeted UI/data-mapping update with no backend or route-auth redesign. Existing request abstractions, page queries, and mutation hooks remain in place. Changes are isolated to page layout/components and role-based navigation config. MSA submit flow remains the single source of truth for payload construction and post-submit cleanup. Contract table and compliance screens update field mapping only.

## Component Breakdown
1. `src/pages/MsaPage/layouts/CreateMSADialog.tsx`
- Ensure create payload uses `msaType`.
- Ensure payload `currency` uses current form selection.
- Increase dialog width by ~5%.
- On successful submit, reset upload-related state and form.

2. `src/pages/MsaPage/components/Step7Documents.tsx` (or current upload step component)
- Ensure upload display state clears on successful form reset/submission.

3. `src/pages/VendorManagementPage/VendorDetailPage.tsx`
- Keep resend action disabled/non-clickable when project manager is active.

4. `src/pages/ContractManagementPage/index.tsx`
- Vendor column maps to `projectManager.name` (with safe fallback).

5. `src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx`
- Security ID references `securityTypeId`.

6. `src/pages/ContractManagementPage/components/ComplianceDetailsSheet.tsx`
- Render security rows accurately from API security objects.

7. `src/lib/navigation.ts`
- Remove Vendor Management menu entry for `contract_manager` role only.

## Data and State Model
- MSA form values remain in existing form control state.
- Payload mapping:
  - `type -> msaType`
  - `currency (selected value) -> currency`
- Upload UI state must be reset together with successful form submit to avoid stale visual remnants.
- Contract list row mapping must prioritize `projectManager.name` for vendor display.
- Compliance/security mapping should use `securityTypeId`, `securityType`, `amount`, and `dueDate` from API response objects with safe empty fallbacks.

## Error Handling and Edge Cases
- Only clear form/upload state after successful submit.
- Preserve user-entered form/upload state when submit fails.
- Vendor resend remains disabled for active status and must not trigger action handlers.
- For missing project manager/security fields, render fallback placeholders (e.g. `-`) without crashes.
- Navigation change must affect `contract_manager` menu only and leave other roles unchanged.

## Testing Strategy
- Add/update targeted unit tests for:
  - MSA payload contains `msaType`.
  - Selected currency is sent, not always CAD.
  - Upload state clears after successful submit.
  - Contract table vendor uses `projectManager.name`.
  - Compliance security ID uses `securityTypeId`.
  - Security details sheet renders API values accurately.
  - Contract manager navigation hides Vendor Management.
  - Resend action remains disabled for active project managers.
- Run requested browser QA flow:
  - Verify create MSA dialog width increase.
  - Verify non-CAD selection is sent in network payload.
  - Verify upload UI clears after successful submit.
  - Verify vendor column, security ID/detail rendering, and dashboard navigation behavior.
  - Verify no console/network errors for touched flows.

## Out of Scope
- Route guard/authorization rewrites for vendor routes.
- Backend endpoint/schema changes.
- Unrequested UX redesign beyond the specified fixes.
- Global currency policy changes outside the create MSA payload path.
