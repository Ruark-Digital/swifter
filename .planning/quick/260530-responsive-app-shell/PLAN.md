# Responsive App Shell — collapsible Sidebar + Header trigger

**Date:** 2026-05-30
**Type:** Quick task
**Parent:** [`.planning/quick/260529-responsive-audit/RESPONSIVE-AUDIT.md`](../260529-responsive-audit/RESPONSIVE-AUDIT.md)
**Memory:** [[sidebar-collapsible-none-dead-drawer]]

## Goal

Replace the dead-drawer `collapsible="none"` wiring so the shadcn Sidebar collapses to a Sheet on mobile/tablet. Re-run the responsive audit to confirm headline P0s evaporate.

**Success = audit re-run on this branch shows the 64 P0s drop to ≤ 10 P0 residual (cross-cutting overflow inside specific tabs, not shell clipping).**

## Root cause recap

`src/layouts/Sidebar.tsx:40` sets `collapsible="none"`. Per `src/components/ui/sidebar.tsx:178-191` this branches BEFORE the `if (isMobile) → Sheet` path, unconditionally rendering a 256px (`w-[--sidebar-width]`) div at every viewport. Mobile drawer + `useIsMobile` hook are dead code today.

## Non-goals

- Per-tab DataTable redesigns. They get their own follow-ups after the second audit pass.
- TextCombo overflow (`src/components/layouts/FormInputs/TextCombo.tsx:113`) — separate ticket; covered by [[button-inline-flex-whitespace-nowrap-overflow]] pattern.
- Dark-mode regression hunting in the Sheet variant beyond a single sanity check.
- Raising `useIsMobile` threshold above 768. Tablet/iPad behavior decision is in scope (see Task 3) but the hook itself stays.

## Tasks

### 1. Flip the sidebar primitive

**File:** `src/layouts/Sidebar.tsx`
**Change:** Line 40, `collapsible="none"` → `collapsible="offcanvas"`.

Verify in source that nothing else in the layout assumes the sidebar always renders inline. Grep for `peer`, `group-data-`, and `data-state` references that might rely on the `<div>` shape from the `"none"` branch.

**Verify:**
- `pnpm tsc -b` clean (no type drift from collapsible union)
- Dev server boots without runtime warning

### 2. Surface `<SidebarTrigger>` in Header

**File:** `src/layouts/Header.tsx`
**Change:** Add `<SidebarTrigger>` (from `@/components/ui/sidebar`) as the leftmost element on mobile/tablet. Hidden ≥ `lg` if the sidebar is meant to stay inline at desktop.

Mirror the brand colors of the existing Header — match the chevron/menu icon size to other Header buttons.

**Verify:**
- Click trigger at 375px → Sheet opens, nav clickable, ESC/overlay closes.
- Click trigger at 768px → same.
- At 1440px desktop, trigger is hidden (or no-op if visible).

### 3. Decide tablet/iPad behavior

`useIsMobile` triggers Sheet at `< 768`. iPad portrait is 768 (exclusive boundary → desktop sidebar) and iPad Pro 1024 is solidly desktop. With sidebar at 256px that leaves 512px / 768px usable on those viewports — still degraded for 13-tab detail pages.

**Decision options** (pick one in a brief AskUserQuestion before implementing):

- **A.** Keep `useIsMobile` at 768. Tablet (768) gets desktop sidebar (256px content squeeze).
- **B.** Raise threshold to 1024. iPad portrait + Pro both get the drawer; only ≥1024 sees inline sidebar.
- **C.** Raise threshold to 1280. Drawer at tablet AND iPad Pro. Desktop-only inline.

Recommend **B** for an enterprise app with dense tables. Implement only after user picks.

**Decision (2026-05-30):** Option B — raise `MOBILE_BREAKPOINT` in `src/hooks/use-mobile.tsx:3` from `768` to `1024`. iPad portrait + iPad Pro both get the drawer; ≥1024 inline.

**Verify:**
- Decision documented in this PLAN before editing `use-mobile.tsx`.
- After change, viewport probe in DevTools at 767/768/1023/1024/1279/1280 confirms the boundary.

### 4. Smoke: super_admin purple bg survives Sheet variant

`Sidebar.tsx:43` sets `bg-[#2A4467]` only when `userRole === "super_admin"`. The shadcn Sheet path applies `bg-sidebar` on `SheetContent` (`sidebar.tsx:199`). Confirm the role-conditional class still reaches the Sheet (className prop propagates) and the super-admin variant looks correct at 375px.

**Verify:** Manual screenshot at 375px logged in as super_admin showing purple drawer.

### 5. Re-run the audit

```
node .qa/scripts/responsive-audit.mjs --fresh
node .qa/scripts/responsive-triage.mjs
```

Compare new `.planning/quick/260529-responsive-audit/RESPONSIVE-AUDIT.md` row counts against the baseline preserved at `.planning/quick/260530-responsive-app-shell/AUDIT-BASELINE.md` (copy the original before re-running — see Task 0 below).

**Verify gate:**
- New P0 count ≤ 10 (the shell-clipping mass disappears).
- Counts of "element wider than viewport" P1s may still be high — those are non-goals.
- If P0 count > 10, stop and investigate before merging.

### 0. Snapshot the baseline before any edits

```
cp .planning/quick/260529-responsive-audit/RESPONSIVE-AUDIT.md \
   .planning/quick/260530-responsive-app-shell/AUDIT-BASELINE.md
```

Do this FIRST. Re-running the triage will overwrite the original file.

## Verification (whole task)

- `src/` diff is exactly 2 files (`Sidebar.tsx`, `Header.tsx`) + maybe `use-mobile.tsx` if Task 3 lands.
- `pnpm tsc -b` clean.
- `pnpm build` clean (no new chunk warnings beyond [[build-state-and-traps]] baseline).
- Second audit shows P0 collapse per gate above.
- Manual sanity at 375 / 768 / 1024 / 1440 for one Contract Manager detail page: drawer opens, nav works, content uses full viewport width below the chosen breakpoint.

## Anticipated next follow-up (NOT in scope here)

`260531-responsive-residuals` — sized from the post-merge audit. Likely covers:
- TextCombo trigger overflow on list pages
- Per-tab DataTable min-width offenders inside detail pages
- Wizard/dialog overflows (Step4Form, CreateContract steps)

Don't pre-commit; size from evidence.
