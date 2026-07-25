---
phase: 260725-eb2-fix-4-qa-bugs-registration-password-togg
plan: 01
subsystem: ui
tags: [react, forge, forms, react-router, yup, multiselect]

requires: []
provides:
  - Working password-visibility toggle on Complete Registration page
  - Company Modules tab toggles that never surface raw yup validation errors
  - Solicitation/Evaluation creation forms that no longer auto-submit on multi-select interaction
  - Users page Role/Status filters that update in place instead of hitting the route error fallback
affects: [onboarding, companies, solicitation, evaluation, user-management]

tech-stack:
  added: []
  patterns:
    - "Forge Forger memoization requires primitive props (not baked-in closures) to detect changes — module-scope component + explicit props, not useCallback-wrapped inline components"
    - "toBool() defensive coercion at the form-entry boundary (defaultValues + reset) normalizes ambiguous upstream shapes before they hit a yup.boolean() schema"
    - "All native <button> elements inside a Forge <form> must have explicit type=\"button\" unless they are the intended submit button"

key-files:
  created: []
  modified:
    - src/pages/OnboardingPage/index.tsx
    - src/pages/CompaniesPage/CompanyDetailPage.tsx
    - src/components/ui/multiselect.tsx
    - src/pages/UserManagementPage/UserManagementPage.tsx

key-decisions:
  - "Task 1: relocated password/confirm-password rendering into one module-scope PasswordFieldInput taking showPassword/onToggle as explicit Forger props, matching the working pattern already used in VendorStep1Form.tsx/PmOnboardingForm.tsx"
  - "Task 2: toBool() also recursively unwraps a stray { enabled: ... } object shape, not just string/boolean, since that was the exact shape named in the reported error text"
  - "Task 3: placed type=\"button\" after {...props} on the PopoverTrigger Button so a caller-supplied type in props can never re-enable submit behavior"
  - "Task 4: only handleFilterChange's two navigate() calls were changed; URLSearchParams construction, filter state setters, and the mount-time useEffect were already correct and left untouched"

requirements-completed: [EB2-01, EB2-02, EB2-03, EB2-04]

duration: 4min
completed: 2026-07-25
---

# Quick Task 260725-eb2: Fix 4 unrelated QA bugs Summary

**Fixed Forge-memoization freeze on the registration password toggle, non-boolean module-flag coercion, native-button default-submit on the shared multiselect component, and a dead /dashboard/users route reference — 4 distinct root causes, 4 surgical single-file fixes.**

## Performance

- **Duration:** ~4 min (commit-to-commit)
- **Started:** 2026-07-25T10:52:29+01:00 (Task 1 commit)
- **Completed:** 2026-07-25T10:55:49+01:00 (Task 4 commit)
- **Tasks:** 4/4 completed
- **Files modified:** 4

## Accomplishments
- Complete Registration page's Password/Confirm Password eye-icon toggles now correctly switch input type between masked and visible text.
- Admin > Companies > Modules tab toggles update immediately; no raw yup validation error text can render for untouched fields anymore, regardless of the shape `portalSettingsData` returns for a given field.
- The shared `MultipleSelector` component (used by Solicitation's vendor picker, Evaluation's evaluators picker, and `RoleComboField`) no longer submits its ancestor Forge form when its popover trigger, tag-remove, "+N more", or "clear all" buttons are clicked.
- Selecting a Role or Status filter on the Users page navigates to the real `/dashboard/user-management` route instead of the nonexistent `/dashboard/users`, so it no longer falls through to the generic `RouteErrorFallback` page.

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Complete Registration password-visibility toggle (EB2-01)** - `34a1367fc` (fix)
2. **Task 2: Fix Company Modules tab boolean coercion (EB2-02)** - `5a3484769` (fix)
3. **Task 3: Fix Solicitation + Evaluation creation forms auto-submitting (EB2-03)** - `2fce7a055` (fix)
4. **Task 4: Fix User Management Role filter navigating to a broken route (EB2-04)** - `dff1430f3` (fix)

**Plan metadata:** committed separately by the orchestrator (docs artifacts excluded from this agent's commits per constraints).

## Files Created/Modified
- `src/pages/OnboardingPage/index.tsx` - Replaced useCallback-wrapped `PasswordInput`/`ConfirmPasswordInput` closures with a module-scope `PasswordFieldInput` receiving `showPassword`/`onToggle` as explicit Forger props.
- `src/pages/CompaniesPage/CompanyDetailPage.tsx` - Added `toBool()` helper; wrapped every module field in both `defaultValues` and the `reset()` effect.
- `src/components/ui/multiselect.tsx` - Added `type="button"` to all 4 native buttons (popover trigger + 3 remove/clear buttons).
- `src/pages/UserManagementPage/UserManagementPage.tsx` - Changed both `navigate()` calls in `handleFilterChange` from `/dashboard/users` to `/dashboard/user-management`.

## Decisions Made
- See `key-decisions` in frontmatter above. All four fixes stayed within the single file each task specified — no changes made to `CreateSolicitationDialog.tsx`, `CreateEvaluationDialog.tsx`, `ModuleToggle.tsx`, `PortalSettingsPage/components/ModulesManagement.tsx`, or `routes/index.tsx`, matching the plan's scoping.

## Deviations from Plan

None — plan executed exactly as written. All four verify commands matched the plan's expected output exactly:
- `grep -c "showPassword={showPassword}"` → 1 (plan expected >= 1)
- `grep -c "toBool("` → 20 (plan's stated range was ~19-20; actual count includes the helper's own definition line, its one internal recursive call, 9 `defaultValues` fields, and 10 `reset()` fields — no discrepancy in intent, all module fields in both blocks are wrapped)
- `grep -c 'type="button"'` in multiselect.tsx → exactly 4 (plan expected exactly 4)
- `/dashboard/users?` count → 0, `/dashboard/user-management?` count → 2 (plan expected exactly this)

One pre-existing, out-of-scope observation (not fixed, per surgical-change scope): in `CompanyDetailPage.tsx`, the `defaultValues` block was missing a `vendorManagement` field entirely (present in the schema and in the `reset()` effect, but absent from `defaultValues`). This is unrelated to the boolean-coercion bug being fixed (Task 2's scope was to wrap existing field expressions, not add missing ones) and was left untouched.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All 4 QA bugs in this batch are fixed, `tsc -b` is clean project-wide, and each fix is committed individually on `worktree-agent-a4e88163841bbae2a` (based on `fix/phase2-qa260719-fe-only`) ready to ship in the next PR to `fix/phase2-bug-fixes`. No blockers.

---
*Quick task: 260725-eb2*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: src/pages/OnboardingPage/index.tsx
- FOUND: src/pages/CompaniesPage/CompanyDetailPage.tsx
- FOUND: src/components/ui/multiselect.tsx
- FOUND: src/pages/UserManagementPage/UserManagementPage.tsx
- FOUND: .planning/quick/260725-eb2-fix-4-qa-bugs-registration-password-togg/260725-eb2-SUMMARY.md
- FOUND: commit 34a1367fc (Task 1)
- FOUND: commit 5a3484769 (Task 2)
- FOUND: commit 2fce7a055 (Task 3)
- FOUND: commit dff1430f3 (Task 4)
