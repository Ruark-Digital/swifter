# Responsive — TextCombo trigger overflow

**Date:** 2026-05-30
**Type:** Quick task
**Parent:** `260530-responsive-app-shell`
**Memory:** [[button-inline-flex-whitespace-nowrap-overflow]]

## Goal

Stop the `TextCombo` trigger Button from forcing its parent wider than the viewport. Clears ~14 P1 rows in `RESPONSIVE-AUDIT.md` across list pages (Contracts, MSA, Projects, Vendor, Solicitation, Profile, Dashboard).

## Root cause

`src/components/layouts/FormInputs/TextCombo.tsx:85-99` — the trigger Button has class `w-full h-12 justify-between ... truncate`. shadcn Button is `inline-flex whitespace-nowrap`. The text child (`{selectedOption ? truncate(label,60) : placeholder}`) becomes the Button's intrinsic min-content width and overrides `w-full`, pushing the parent past the viewport. `truncate` on the Button itself doesn't help — it sets `overflow:hidden` on the Button but `whitespace-nowrap` is already there, and the text node has no shrink target.

## Fix

In `src/components/layouts/FormInputs/TextCombo.tsx`:

1. Add `min-w-0` to the Button className (lets it shrink below content).
2. Drop `truncate` from the Button (wrong element).
3. Wrap the text node in `<span className="truncate min-w-0 flex-1 text-left">` so the span can shrink and truncate, leaving the `<ChevronsUpDown>` icon visible.

## Verification

- One screenshot of `/dashboard/contract-management` at 375px showing no horizontal scroll, search/select triggers visible and fitting.
- Re-run `node .qa/scripts/responsive-audit.mjs --fresh` + triage. Expect `TextCombo.tsx:113` rows to drop from ~14 → 0.
- `pnpm tsc -b` clean for the touched file (ignore pre-existing `ActionLogTabContent.tsx` TS6133 per [[parallel-worktree-commits-mid-session]]).

## Non-goals

- Other detail-tab DataTable overflows (~44 P1s). Sized separately if user wants them.
- Truncation policy on long selected labels (already capped at 60 via `truncate(label, {length: 60})` from lodash).

## Diff scope

One file, ~3 lines.
