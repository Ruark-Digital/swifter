# SP1 Verification — TipTap + Yjs Tracer Bullet

Status: **PENDING USER TESTING** · Phase: quick/260518-collab-tiptap-migration

Fill this in by walking the test matrix from `PLAN-sub-phase-1-foundation.md` § T5. Each row must record evidence (network excerpt, screenshot path, or console output). Decision gate at the bottom.

## How to run each test

> **Note:** TipTap is now the **default** editor — the regular Document edit link from `DocumentList` opens it directly. Append `?editor=yoopta` to fall back to the legacy editor (still used for redlines/comments/AI/version-history until SP2-4 lands them on TipTap).

1. **Bring up the dev server:** `pnpm dev`.
2. Open a contract via the Documents list "Edit" pencil → lands on TipTap with the file imported (DOCX/PDF via mammoth).
3. Repeat in a second tab (or second browser profile for test #4). Both must share the same `fileName` so they land in the same `?doc=` Yjs room.
4. To exercise the legacy editor explicitly, append `&editor=yoopta` to either URL.

## Test matrix

| # | Setup | Expected | Result | Evidence |
|---|---|---|---|---|
| 1 | Tab A + Tab B, same `?doc&editor=tiptap`, **local docker BE** | Type "hello" in A → "hello" appears in B character-by-character within 100ms | ⬜ TBD | |
| 2 | Same as #1 but **prod BE** (`wss://api.swiftpro.tech/...`) | Same | ⬜ TBD | |
| 3 | #2 setup, then disconnect B's network for 10s, type in A, reconnect B | B converges on A's state, no data loss, no duplicates | ⬜ TBD | |
| 4 | Two browser profiles (different users) on prod BE | A's caret-colored chip visible in B's editor; vice versa with correct user names | ⬜ TBD | |
| 5 | Single tab + `?debug=collab` console open | `provider.awareness.getStates().size === 1` alone; `=== 2` when B joins | ⬜ TBD | |

## Decision gate

Mark the outcome:

- ⬜ **PROCEED to SP2** — all 5 tests pass. CONTEXT D2 (TipTap) confirmed.
- ⬜ **BE ESCALATION** — #1 passes, #2 fails. Capture WS frames from prod (DevTools Network → Messages tab → save HAR) and open ticket.
- ⬜ **T6 REQUIRED** — #5 fails (BE strips awareness). Run T6 from the PLAN.
- ⬜ **RECONSIDER D2** — #1 fails. TipTap+Yjs basic integration is wrong on our side; do not blame BE.

## Notes from testing

_(Fill in any surprises, version mismatches, peer-dep warnings, etc.)_

---

## Code shipped in SP1

- `src/pages/CollaborationToolPage/collab/useCollabProvider.ts` — editor-agnostic Y.Doc + WS + IDB + presence helpers (clone of useYooptaYjs.ts minus the snapshot binding).
- `src/pages/CollaborationToolPage/collab/useTipTapEditor.ts` — `useEditor` with StarterKit (history off), Collaboration, CollaborationCursor.
- `src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx` — parallel panel with PresenceBar + EditorContent only. No marks, no AI, no comments.
- `src/pages/CollaborationToolPage/index.tsx` — `?editor=tiptap` switch routes to TipTapEditorPane.
- `package.json` — added `@tiptap/react`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-collaboration`, `@tiptap/extension-collaboration-cursor`.

Yoopta path untouched: `EditorPanel.tsx`, `useYooptaYjs.ts`, all `@yoopta/*` and `@slate-yjs/*` packages remain installed and operational at the default URL.
