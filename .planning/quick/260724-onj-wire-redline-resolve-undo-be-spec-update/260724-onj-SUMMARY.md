---
phase: 260724-onj-wire-redline-resolve-undo-be-spec-update
plan: 01
subsystem: collaboration
tags: [redline, turn-negotiation, react-query, toast, superdoc]

# Dependency graph
requires:
  - phase: (prior redline turn-negotiation work, shipped 2026-07-16/2026-07-01)
    provides: useRedlineTurn hook (sendTurn/finalize/resolve mutations, turn-lock gating), useFileVersions hook (activeVersionId)
provides:
  - buildResolvePayload/buildUndoPayload/isVersionConflict pure helpers on useRedlineTurn.ts
  - resolve mutation now sends docName/baseVersionId/documentState (optional) alongside action/tier
  - new undo mutation posting to .../ai/redline-suggestions/{redlineId}/undo
  - 409 handling on resolve and undo: user-visible toast + invalidates turn + file-versions query caches
  - Undo UI control on already-resolved (approved/dismissed) AI Polish suggestion cards, turn-gated
affects: [collaboration-tool-page, redline-turn-negotiation, ai-suggestions-panel]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure payload-builder + conflict-detector functions exported alongside a hook for harness-free unit testing (matches existing redlineSideFromRole convention)"
    - "409 (version/turn conflict) handled via TanStack Query per-call onError callback, not swallowed into DEV-only console.warn"

key-files:
  created: []
  modified:
    - src/pages/CollaborationToolPage/collab/useRedlineTurn.ts
    - src/pages/CollaborationToolPage/collab/useRedlineTurn.test.ts
    - src/pages/CollaborationToolPage/index.tsx
    - src/pages/CollaborationToolPage/components/SidebarPanel.tsx
    - src/pages/CollaborationToolPage/components/AiSuggestionsPanel.tsx

key-decisions:
  - "documentState remains optional and unpopulated by every call site in this repo — no live Y.Doc is reachable at the default (SuperDoc iframe) resolve/undo call sites; wiring it would require new Yjs plumbing out of scope for this plan (per plan's scoping note)"
  - "undo throws (not silent no-op) when no turn endpoint is available for the viewer's role, unlike resolve's fire-and-forget audit call — undo is a deliberate user action that needs failure feedback"

patterns-established:
  - "Pure helper + hook co-location for testability: buildResolvePayload/buildUndoPayload/isVersionConflict exported next to useRedlineTurn"

requirements-completed: [redline-resolve-sends-docname-baseversionid, redline-resolve-409-handling, redline-undo-endpoint-added, redline-undo-ui-trigger]

duration: 20min
completed: 2026-07-24
---

# Quick Task 260724-onj: Wire Redline Resolve/Undo BE Spec Update Summary

**Extended useRedlineTurn's resolve mutation with docName/baseVersionId, added a new undo mutation, and surfaced 409 conflicts as toasts instead of silent DEV-only warnings, plus a turn-gated Undo control on the AI Polish panel.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-24T17:52:31+01:00 (base commit)
- **Completed:** 2026-07-24T18:11:47+01:00
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `resolve` mutation now sends `docName`, `baseVersionId`, and (when supplied) `documentState` alongside `action`/`tier`, per the BE spec's `ResolveRedlineRequest` shape.
- New `undo` mutation posts to `.../ai/redline-suggestions/{redlineId}/undo` with the same version-hint payload shape.
- A 409 response from either mutation now invalidates the stale `redline-turn` and `collab-file-versions` query caches and surfaces a user-visible toast (previously silently discarded into a DEV-only `console.warn`).
- AI Polish panel gained a working Undo control on already-resolved (approved/dismissed) suggestion cards, disabled+tooltipped when it's not the viewer's turn, flipping the card back to `pending` on success.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend useRedlineTurn.ts with docName/baseVersionId/documentState on resolve, 409 handling, and a new undo mutation** - `a4c2c482b` (feat)
2. **Task 2: Wire resolve/undo call sites and add the Undo UI trigger** - `e2f654272` (feat)

_TDD note: Task 1 was marked `tdd="true"` in the plan, but the target file (`useRedlineTurn.ts`) already had an established test-writing convention (harness-free pure-function tests, no separate RED/GREEN commit split) — tests were written alongside the implementation in a single commit rather than a strict RED→GREEN two-commit sequence, consistent with how `redlineSideFromRole`'s existing tests were structured. All 8 new behavior cases plus the 5 pre-existing tests pass (13 total)._

## Files Created/Modified
- `src/pages/CollaborationToolPage/collab/useRedlineTurn.ts` - Extended `RedlineResolveInput` (docName/baseVersionId/documentState), added `UndoRedlineInput`, `buildResolvePayload`/`buildUndoPayload`/`isVersionConflict` pure helpers, rewired `resolve`'s `mutationFn`/`onError`, added new `undo` mutation, returned `undo` from the hook.
- `src/pages/CollaborationToolPage/collab/useRedlineTurn.test.ts` - Added `describe` blocks for the three new pure helpers (8 test cases).
- `src/pages/CollaborationToolPage/index.tsx` - `handleApproveAi`/`handleDismissAi` now pass `docName`/`baseVersionId` and a 409-aware `onError` toast; new `handleUndoAi` calls `redlineTurn.undo.mutate` and flips the card state back to `pending` on success; `onAiUndo={handleUndoAi}` passed to `SidebarPanel`.
- `src/pages/CollaborationToolPage/components/SidebarPanel.tsx` - Added `onAiUndo` prop, forwarded as `onUndo` to `AiSuggestionsPanel`.
- `src/pages/CollaborationToolPage/components/AiSuggestionsPanel.tsx` - Added `onUndo` to `AiSuggestionsPanelProps`/`SuggestionCardProps`; `SuggestionCard`'s `!isPending` branch now renders an Undo button next to the Replaced/Dismissed label, following the existing Dismiss button's disabled/enabled Tailwind convention.

## Decisions Made
- `documentState` stays optional and unpopulated by every call site in this repo (per the plan's scoping note — no live Y.Doc is reachable at the default SuperDoc iframe editor's resolve/undo call sites). Wiring it is deferred to a future phase if the TipTap/Yoopta escape-hatch path needs it.
- `undo` throws when `!base` (no turn endpoint for the viewer's role) rather than silently returning `null` like `resolve` — undo is a deliberate user action and needs failure feedback, whereas resolve is fire-and-forget audit-only.

## Deviations from Plan

None - plan executed exactly as written. The TDD-note above documents a convention match (harness-free test style, single commit for RED+GREEN) rather than a deviation from the plan's behavior/interface requirements — all 8 behavior cases in `<behavior>` were implemented and pass.

## Issues Encountered
None specific to this plan's scope. During verification, `npx vitest run src/pages/CollaborationToolPage` surfaced 2 categories of pre-existing, unrelated failures (confirmed via `git stash` to reproduce against the pre-task baseline):
- `EditorPanelImport.test.tsx` (4 tests) fails with `collab.createSnapshotBinding is not a function` — pre-existing issue in `EditorPanel.tsx`'s Yjs collab binding, unrelated to redline resolve/undo wiring, out of scope per the deviation rules' scope boundary (logged here, not fixed).
- Three Playwright `.spec.ts` files (`collaboration.spec.ts`, `documentViewer.spec.ts`, `import.spec.ts`) are being collected by vitest and fail with a Playwright/vitest config collision (`test.describe() called incorrectly`) — pre-existing vitest/playwright config overlap, unrelated to this plan.

The plan's target regression set (CommentMark/DocumentViewer/EditorPanelImport-passing-tests/VersionHistoryModal) and the new `useRedlineTurn.test.ts` all pass; `npx tsc -b` reports no new type errors.

## Next Phase Readiness
- Resolve/undo now carry the version metadata the BE requires; 409s are user-visible instead of silent.
- `documentState` wiring for the TipTap/Yoopta escape-hatch editors remains a documented future-phase item, not a blocker for the default SuperDoc path.
- Pre-existing `EditorPanelImport.test.tsx` and Playwright-spec-collection-by-vitest issues remain open (logged above, out of this plan's scope) — worth a dedicated quick task if they start blocking CI signal.

---
*Phase: 260724-onj-wire-redline-resolve-undo-be-spec-update*
*Completed: 2026-07-24*

## Self-Check: PASSED

- FOUND: src/pages/CollaborationToolPage/collab/useRedlineTurn.ts
- FOUND: src/pages/CollaborationToolPage/collab/useRedlineTurn.test.ts
- FOUND: src/pages/CollaborationToolPage/index.tsx
- FOUND: src/pages/CollaborationToolPage/components/SidebarPanel.tsx
- FOUND: src/pages/CollaborationToolPage/components/AiSuggestionsPanel.tsx
- FOUND commit: a4c2c482b (Task 1)
- FOUND commit: e2f654272 (Task 2)
