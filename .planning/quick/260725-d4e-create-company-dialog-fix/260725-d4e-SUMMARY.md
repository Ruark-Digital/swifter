---
phase: 260725-d4e-create-company-dialog-fix
plan: 01
subsystem: frontend
tags: [dialog, select, forms, companies-admin]
dependency-graph:
  requires: []
  provides: [create-company-dialog-max-height-scroll, create-company-dialog-duration-select-persists]
  affects: [src/pages/CompaniesPage/components/CreateCompanyDialog.tsx]
tech-stack:
  added: []
  patterns: [max-h-[90vh] overflow-y-auto DialogContent convention, string-typed Select value contract]
key-files:
  created: []
  modified:
    - src/pages/CompaniesPage/components/CreateCompanyDialog.tsx
decisions:
  - "Cast duration back to Number(data.duration) only at the API boundary (createCompany mutationFn), keeping form state as string end-to-end to satisfy Radix Select's string-value contract."
metrics:
  duration: "~10 minutes"
  completed: 2026-07-25
---

# Phase 260725-d4e Plan 01: Create Company Dialog Fix Summary

Fixed two FE-only bugs in `CreateCompanyDialog.tsx`: an uncapped dialog height that grew indefinitely instead of scrolling, and a Subscription Duration select whose numeric option values broke the "selected value persists in trigger" behavior that Subscription Plan and Currency already had.

## What Was Built

**Task 1 — Capped dialog height with internal scroll**
`DialogContent`'s className changed from `" transition-colors duration-200"` to `"max-h-[90vh] overflow-y-auto transition-colors duration-200"`, matching the exact convention already used by `CreateVendorDialog.tsx`, `CreateMSADialog.tsx`, and `CreateEvaluationDialog.tsx`. The whole dialog (header + form + footer) now scrolls as one unit within a 90vh cap — no sticky header/footer split was introduced, consistent with sibling dialogs.

**Task 2 — Fixed Subscription Duration select value type mismatch**
Root cause: `subscriptionDurationOptions` was the only options array in this dialog using numeric `value`s (`1`-`5`), while `TextSelect`'s `options` prop is typed `{ label: string; value: string }[]` (confirmed by reading `src/components/layouts/FormInputs/TextSelect.tsx`) and Radix's underlying `Select.Item` requires string values. This is why Subscription Plan and Currency (both string-valued) worked but Duration didn't.

Fix applied across all four coupled spots:
1. `subscriptionDurationOptions` values changed from numbers to strings: `"1"`..`"5"`.
2. `defaultValues.duration` changed from `1` to `"1"`.
3. yup schema's `duration` field changed from `yup.number().positive().integer().required(...)` to `yup.string().required("Subscription duration is required")`.
4. `createCompany` mutationFn's `transformedData.duration` now casts `Number(data.duration)` before the `POST /onboarding/company` request, preserving the existing numeric wire payload.

## Verification

- `npx tsc -b` — no errors after either task (ran after each commit).
- Static code review confirms:
  - `DialogContent` className includes both `max-h-[90vh]` and `overflow-y-auto`.
  - `subscriptionDurationOptions` values are strings, matching the type contract enforced by `TextSelect` (`options: { label: string; value: string; disabled?: boolean }[]`) and the pattern used by the working `subscriptionOptions` (Subscription Plan) and `currencyOptions` (Currency) arrays.
  - `transformedData.duration` is `Number(data.duration)`, so the POST payload's numeric shape is unchanged from pre-fix behavior.

**Live browser verification was not performed in this run** (no human present / no dev server exercised in this session). The checkpoint's manual verification steps (open dialog, confirm scroll behavior, pick "2 years" and confirm it persists across other field changes, submit and confirm the request payload) should still be run by a human or a future browser-driven QA pass before considering this fully closed end-to-end.

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `918ff66e7` — fix(companies): cap Create Company dialog height with internal scroll
- `04e5e59ae` — fix(companies): make Subscription Duration select persist its value

## Self-Check: PASSED

- FOUND: src/pages/CompaniesPage/components/CreateCompanyDialog.tsx (DialogContent max-h-[90vh] overflow-y-auto confirmed; subscriptionDurationOptions string values confirmed; yup schema duration: string confirmed; transformedData.duration: Number(data.duration) confirmed)
- FOUND: commit 918ff66e7 in git log
- FOUND: commit 04e5e59ae in git log
