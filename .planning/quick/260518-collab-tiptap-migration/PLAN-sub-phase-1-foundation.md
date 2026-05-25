# PLAN — Sub-phase 1: Foundation (TipTap + Yjs tracer bullet)

**Phase:** quick/260518-collab-tiptap-migration · Sub-phase 1 of 4
**Context:** [CONTEXT.md](./CONTEXT.md)
**Goal:** Prove TipTap + Yjs + the existing BE collab server can deliver character-level cross-tab co-editing with presence cursors, gated behind a feature flag, **without removing Yoopta**.

## Strategy

This sub-phase is a **risk-burn-down tracer bullet**, not a feature port. We add TipTap alongside Yoopta and gate it behind `?editor=tiptap` in the URL. Yoopta remains the default and keeps the redline/comment/AI features working. If the tracer-bullet two-tab demo succeeds, SP2 begins porting features. If it fails (BE strips awareness, protocol mismatch, etc.), we revisit D2 in CONTEXT before any further work.

Tasks are ordered so each one is independently committable and reversible. Yoopta is **not** touched in this sub-phase.

## Tasks

### T1 — Add TipTap dependencies (Yoopta untouched)

**Files:**
- `package.json`
- `pnpm-lock.yaml` (regenerated)

**Changes:**
- Add the following dependencies via `pnpm add`:
  ```
  @tiptap/react
  @tiptap/core
  @tiptap/pm
  @tiptap/starter-kit
  @tiptap/extension-collaboration
  @tiptap/extension-collaboration-cursor
  ```
  Pin to the most recent stable versions compatible with React 19. If `@tiptap/react` peer-deps reject React 19, escalate — pre-release versions of TipTap v2.10+ support React 19; otherwise add an `--legacy-peer-deps` workaround in pnpm config and document it.
- Do **not** remove any `@yoopta/*` or `@slate-yjs/*` packages. Both editors coexist.
- Do **not** modify any existing source files in T1. The commit is dependency-only.

**Acceptance:**
- `pnpm install` clean.
- `pnpm exec tsc --noEmit` still passes (no consumers yet).
- `pnpm build` succeeds — confirms the bundle accepts TipTap without conflict.

**Verify:** `pnpm install && pnpm exec tsc --noEmit && pnpm build`.

---

### T2 — Extract `useCollabProvider` from `useYooptaYjs`

**Files:**
- New: `src/pages/CollaborationToolPage/collab/useCollabProvider.ts`
- `src/pages/CollaborationToolPage/collab/useYooptaYjs.ts` (unchanged, parallel)

**Changes:**
- Create `useCollabProvider.ts` with a `createCollabProvider(config: CollabConfig)` function that returns the same surface as the current `createCollab` **minus** `createSnapshotBinding`:
  - `doc`, `provider`, `destroy`
  - `setPresenceActive`, `updateLocalUser`
  - `subscribeAwareness`, `subscribeDeviceCount`, `subscribeSyncState`
- Copy (don't move) the supporting helpers needed: `installAwarenessThrottle`, `makeAuthWebSocketClass`, `readVarUint`, the `CollabConfig` / `CollabUser` / `AwarenessEntry` / `CollabSyncState` types.
- Export the types from `useCollabProvider.ts`. `useYooptaYjs.ts` re-exports them from there to keep its callers compiling.
- `useYooptaYjs.ts` is **left intact** for now (still services Yoopta). Internal duplication is acceptable for 4 weeks until SP4 deletes Yoopta.

**Rationale for duplication over refactor:** keeping the working Yoopta path untouched eliminates risk of breaking redlines/comments while TipTap is unproven. SP4 will delete `useYooptaYjs.ts` entirely along with its imports.

**Acceptance:**
- `useCollabProvider.ts` exports the helpers listed above.
- Importing `createCollabProvider` and calling it returns a working `Y.Doc` + provider against `wss://localhost:1234` (smoke).
- `useYooptaYjs.ts` still compiles; no regression in the existing Yoopta editor.

**Verify:** `pnpm exec tsc --noEmit`; manually open the existing editor and confirm presence bar + save status still work.

---

### T3 — Build `useTipTapEditor` hook

**Files:**
- New: `src/pages/CollaborationToolPage/collab/useTipTapEditor.ts`

**Changes:**
- Hook signature:
  ```ts
  type UseTipTapEditorArgs = {
    doc: Y.Doc;
    provider: WebsocketProvider | undefined;
    localUser: CollabUser | null;
  };
  function useTipTapEditor(args: UseTipTapEditorArgs): Editor | null
  ```
- Inside the hook:
  - Call `useEditor` from `@tiptap/react`.
  - Extensions:
    - `StarterKit.configure({ history: false })` — Yjs handles history, disable Slate-style local history.
    - `Collaboration.configure({ document: args.doc })`.
    - `CollaborationCursor.configure({ provider: args.provider, user: args.localUser ?? undefined })` when `provider` is defined.
  - Re-create the editor when `doc` identity changes (keyed on `args.doc`). Cleanup with `editor.destroy()`.
- Use a stable cursor color derived from `localUser.color` (already produced by EditorPanel's `hashColor`); pass `{ name, color }` into `CollaborationCursor`.
- The hook returns the `Editor` instance (or `null` while initializing).

**Acceptance:**
- Hook compiles, runs without errors when given a fresh `Y.Doc` and `undefined` provider.
- When given a connected provider, TipTap's `Collaboration` extension binds to the doc (verified by `editor.getJSON()` reflecting Yjs state).

**Verify:** `pnpm exec tsc --noEmit`; unit-test optional, manual integration test happens in T5.

---

### T4 — TipTap editor panel behind a feature flag

**Files:**
- New: `src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx`
- `src/pages/CollaborationToolPage/index.tsx`

**Changes:**
- `TipTapEditorPanel.tsx` is a parallel sibling to `EditorPanel.tsx`. It receives the same `importMeta` / `collabMeta` / `onEditorReady` props. Internals:
  - Build `localUser` from `useUser()` exactly like the existing panel.
  - Call `createCollabProvider({ ...collabMeta, localUser })` in a `useMemo` keyed on the stable inputs.
  - Pass `doc`/`provider`/`localUser` into `useTipTapEditor`.
  - Render `<EditorContent editor={tiptapEditor} />` from `@tiptap/react`.
  - Mount the existing `PresenceBar` above the editor (it already takes `AwarenessEntry[]` + `CollabSyncState` + `deviceCount`; subscribe via the new provider's helpers).
  - **Skip:** redline marks, comment marks, AI suggestions, version history, file import. This panel is a tracer bullet — text only.
- In `index.tsx`:
  - Read `?editor=tiptap` from `useSearchParams()`.
  - When set, render `<TipTapEditorPanel />` instead of `<EditorPane />` (the lazy-loaded Yoopta panel).
  - Default behavior unchanged when the flag is absent.

**Acceptance:**
- Visit `/collaboration-tool?doc=test-room&editor=tiptap` and the TipTap editor mounts.
- Visit `/collaboration-tool?doc=test-room` (no flag) and Yoopta still mounts — zero regression.

**Verify:** `pnpm exec tsc --noEmit`; load both URL variants in a single browser; visually confirm.

---

### T5 — Two-tab smoke + awareness sanity check (the gate)

**Files:**
- None (manual verification + small instrumentation only).
- Temp diagnostic logging may be added to `useCollabProvider.ts` under a `?debug=collab` flag; removed before commit.

**Test matrix:**

| # | Setup | Expected | Pass/Fail criteria |
|---|---|---|---|
| 1 | Tab A + Tab B, same `?doc=foo&editor=tiptap`, **local docker BE** | Type "hello" in A → "hello" appears in B character-by-character within 100ms | Letters appear incrementally, not in a debounced batch |
| 2 | Same as #1, but **prod BE** (`wss://api.swiftpro.tech/...`) | Same as #1 | Same as #1 |
| 3 | Same as #2, then **disconnect B's network for 10s**, type in A | B reconnects and converges on A's state | No data loss, no duplicate text |
| 4 | Two browser profiles (different users) on prod BE | A's caret colored chip appears in B's editor; vice versa | Both presence cursors render with correct user name labels |
| 5 | Tab A only, with `?debug=collab` and dev-tools console open | `provider.awareness.getStates().size === 1` when alone; `=== 2` when B joins | If `awareness.getStates().size` stays at 1 even when B is in the same room → BE strips awareness; T6 required |

**Decision gate:**
- **All 5 pass →** SP1 succeeds. CONTEXT D2 (TipTap) is confirmed. Proceed to SP2 planning.
- **#1 passes, #2 fails →** local Yjs OK, prod gateway issue. Capture WS frames in prod (DevTools Network → Messages) and open a ticket with BE before SP2.
- **#5 fails (awareness stripped) →** add T6 to this sub-phase.
- **#1 fails →** TipTap+Yjs basic integration is wrong on our side. Re-examine extension config; do **not** blame BE.

**Acceptance:**
- Markdown verification log committed to `.planning/quick/260518-collab-tiptap-migration/SP1-VERIFICATION.md` with one row per test and screenshots/network excerpts.

---

### T6 (conditional) — BE awareness coordination

**Trigger:** Only if T5 test #5 fails (BE strips Yjs awareness frames).

**Files:**
- New: `.planning/quick/260518-collab-tiptap-migration/BE-AWARENESS-ISSUE.md` (handoff doc)
- Possibly: `src/pages/CollaborationToolPage/collab/useCollabProvider.ts` (workaround)

**Changes:**
- Write a one-page issue doc for the BE team with:
  - Reproduction steps (the test #5 procedure).
  - The Yjs awareness wire format reference (link to y-protocols spec).
  - Expected behavior: y-websocket server should forward awareness messages (msgType=1) between clients in the same room.
- Fallback workaround if BE can't fix quickly: piggyback presence/cursor data on the existing custom msgType=2 mechanism, or implement a simple side-channel (e.g. `/contract/file-comment/<fileId>/presence` poll). Document the trade-off.

**Acceptance:**
- Issue doc handed off to BE team or, if no BE owner is available, workaround merged behind the same `?editor=tiptap` flag.

**Verify:** Manual two-tab test against the chosen path passes test #4 (presence cursors visible).

---

## Cross-cutting

- **No Yoopta code is removed.** Both editors coexist until SP4.
- **No backend changes** unless T6 fires.
- **Dependency bloat is temporary.** TipTap adds ~80 KB gzipped on top of Yoopta. Acceptable for 4 weeks.
- **No tests added** in this sub-phase. SP1 is a tracer bullet; tests come with SP2/3 when real features land.
- **No telemetry.** Log additions in T5 are dev-only and removed before commit.

## Verification Plan

| Task | Check |
|---|---|
| T1 | `pnpm install && pnpm exec tsc --noEmit && pnpm build` all green |
| T2 | `tsc --noEmit`; manual confirm existing Yoopta editor still works |
| T3 | `tsc --noEmit`; hook returns a non-null editor when fed a `Y.Doc` |
| T4 | `?editor=tiptap` mounts TipTap; default URL still mounts Yoopta |
| T5 | All 5 rows of the test matrix pass (or trigger T6) |
| T6 (cond.) | Awareness/presence cursors visible across two tabs |

## Risks / Mitigations

- **TipTap v2 + React 19 peer-dep mismatch.** Mitigation: pin to the latest TipTap v2.10+ which supports React 19; if conflict, use `pnpm.overrides` in `package.json`. Document in T1 commit message.
- **`pnpm-workspace.yaml` `onlyBuiltDependencies`** may need TipTap's native deps (none expected, but ProseMirror has `prosemirror-model` and friends — all pure JS). Re-run `pnpm install` after adding; check for ERR_PNPM_IGNORED_BUILDS per `fix_pnpm10_amplify_build` memory.
- **`Y.Doc` GC and IndexedDB persistence** behave differently with TipTap's Collaboration extension. Mitigation: the existing IDB persistence keyed by `roomId` (file name) should Just Work because we feed the same `Y.Doc` to both providers. Verify in T5 test #3.
- **Vite dev-server HMR with two providers in memory.** Mitigation: T4's URL flag means only one provider is alive at a time during a given page load. Hot-reload may double-create — accept it for the sub-phase; full reload between tests.
- **Cursor color collisions** when two users hash to the same palette index. Cosmetic only — defer to SP4 polish.

## Out of Scope (for SP1)

- Porting redline / comment / AI / version-history features (SP2 + SP3).
- DOCX import/export (SP4).
- Removing Yoopta or `@slate-yjs/*` dependencies (SP4).
- Custom toolbar / slash menu styling (SP2/SP3).
- Production routing — `?editor=tiptap` stays as a dev-only flag until SP4 swap.

## Definition of Done

1. T1-T5 complete.
2. SP1-VERIFICATION.md committed with test-matrix evidence.
3. Decision recorded: "Proceed to SP2" OR "Block on BE / re-think D2".
4. No regression in the existing Yoopta editor — confirmed by opening any contract document without the flag.
