# PLAN — CollaborationToolPage: Presence, Anchored Mentions, AI Replace, Save Status

**Phase:** quick/260517-collab-presence-mentions-redline-autosave
**Context:** [CONTEXT.md](./CONTEXT.md)
**Goal:** Ship D1–D4 from CONTEXT against `src/pages/CollaborationToolPage/`.

## Strategy

Four independent slices, in this order to minimize rework:
1. **T1 — Yjs collab plumbing extensions** (awareness presence + device-count + sync/status events). Shared infrastructure that T2 and T4 consume.
2. **T2 — Presence + save-status header bar** (D1 + D4 UI).
3. **T3 — Selection-anchored comments** (D2). Touches editor floating menu + comment plumbing.
4. **T4 — AI accept → auto-replace** (D3). Small + isolated.

Each task is a single atomic commit. No backend work in this phase; T4 ships with a tolerant fallback for the missing `replacementText` field.

## Tasks

### T1 — Extend `useYooptaYjs` with presence, device count, and sync state

**Files:**
- `src/pages/CollaborationToolPage/collab/useYooptaYjs.ts`

**Changes:**
- Extend `CollabConfig` with `localUser?: { name: string; avatarUrl?: string; color: string }`.
- After provider is created, call `provider.awareness.setLocalState({ user: localUser })` (gated on `localUser && !disable`). Replace the existing null-on-inactive behavior with: when presence is toggled inactive, set `{ user: null }` rather than `null` for the whole state, so other clients still see the row but as "away" — actually simpler: keep `null` toggle as-is and just stamp `user` whenever active.
- Export a new helper `subscribeAwareness(provider, cb)` that wires `awareness.on('change', ...)` and emits `{ clientId, user }[]` (de-duplicated, self excluded by client id).
- Export `subscribeDeviceCount(provider, cb)`. Implementation: attach a `message` listener on the underlying socket; copy `readVarUint` from `Downloads/collab-client.html:321-330`; decode `[varuint msgType][varuint count]` and call `cb(count)` when `msgType === 2`. Re-attach on `provider.on('status')` reconnects (mirror the `installAwarenessThrottle` socket-rebind pattern at lines 59-65).
- Export a `subscribeSyncState(provider, cb)` helper that emits `{ status, synced }` whenever either changes (combines `status` and `sync` events).

**Acceptance:**
- `createCollab` returns the existing handles plus `subscribeAwareness`, `subscribeDeviceCount`, `subscribeSyncState`.
- Calling `setPresenceActive(true)` after passing `localUser` results in `provider.awareness.getLocalState().user` being the user object.
- No regression: editor still loads and types when WS is disabled.

**Verify:** `pnpm tsc --noEmit` clean; manual smoke — open two tabs locally, confirm each tab sees the other's awareness entry.

---

### T2 — Presence + save-status header above the editor

**Files:**
- New: `src/pages/CollaborationToolPage/components/PresenceBar.tsx`
- `src/pages/CollaborationToolPage/components/EditorPanel.tsx` (mount the bar)
- `src/pages/CollaborationToolPage/index.tsx` (pass `localUser` through `collabMeta`, lift presence list + save status if needed for tooltips elsewhere — keep co-located if possible)

**Changes:**
- `PresenceBar` props: `users: { clientId, user }[]`, `deviceCount: number | null`, `saveState: 'offline' | 'saving' | 'saved'`, `savedAt: string | null`.
- Layout: horizontal flex bar, left = avatar stack (up to 4 avatars, then `+N` chip with tooltip listing remaining names), right = save-status label.
- Avatars: if `user.avatarUrl` present, render `<img>`; else initials from `user.name` with hash-tone background. Reuse the hash-color helper from `FeedItem.tsx` (memory: `project_collab_comments_polish`) — extract to a shared util if it's currently inline (`collab/avatarPalette.ts`).
- Fallback rendering: when `users.length === 0` but `deviceCount > 0`, show a generic "N connected" chip instead of empty space.
- Save-status label states (locked in CONTEXT D4):
  - `offline` → grey dot + "Offline"
  - `saving` → spinner + "Saving…"
  - `saved` → green dot + "Saved · <relative time>" (use `Intl.RelativeTimeFormat`, recompute every 30s via a tiny interval inside the component)
- Inside `EditorPanel`, mount `PresenceBar` directly above the editor surface. Wire it via the helpers from T1; track a local `dirty` flag in a small hook (`useCollabSaveState(provider)`):
  - On any local `ydoc` transaction whose origin is not the provider → set `dirty=true`.
  - On `sync(true)` while `dirty` → set `dirty=false`, `savedAt=Date.now()`.
  - `saveState` derives: `status !== 'connected' → 'offline'`; `dirty → 'saving'`; else `'saved'`.
- Wire `localUser` in `index.tsx`:
  ```ts
  const localUser = useMemo(() => ({
    name: user?.name || user?.email || 'You',
    avatarUrl: (user as any)?.avatar,
    color: hashColor(user?.email || user?.name || ''),
  }), [user]);
  ```
  Pass it into `collabMeta`.

**Acceptance:**
- Two browser tabs on the same `doc=` query show each other's initials/avatar in the bar.
- Typing in either tab flashes "Saving…" then settles back to "Saved · just now".
- Killing the WS server flips the label to "Offline".
- If awareness isn't populated but the BE emits the device-count message, the bar still shows "N connected".

**Verify:** Manual two-tab test; `pnpm tsc --noEmit` clean.

---

### T3 — Selection-anchored comments

**Files:**
- `src/pages/CollaborationToolPage/components/EditorPanel.tsx`
- `src/pages/CollaborationToolPage/collab/CommentMark.tsx` (confirm it can carry an arbitrary `commentId`/`selectionId` not tied to an AI redline)
- `src/pages/CollaborationToolPage/index.tsx` (already handles `ct-add-inline-comment` — no new wiring needed)

**Changes:**
- In `EditorPanel`, when there is a non-collapsed text selection, render a small floating toolbar (Yoopta exposes a `SelectionToolbar` or similar — use existing pattern; if none, render an absolute-positioned button near the selection rect via `window.getSelection().getRangeAt(0).getBoundingClientRect()`).
- The button is **"Comment on selection"**. On click:
  - Generate `const selectionId = crypto.randomUUID()`.
  - Apply a `CommentMark` to the current Slate selection with `{ commentId: selectionId }` (reuse the existing addMark path — confirm `CommentMark` accepts the id; if it's hardcoded to an AI redline shape, extend the mark schema to accept `{ commentId }`).
  - Dispatch `window.dispatchEvent(new CustomEvent('ct-add-inline-comment', { detail: { commentId: selectionId } }))` — this triggers the existing handler in `index.tsx:270-280` which sets `pendingRedlineRef` and switches to the Comments tab.
- Click-to-scroll: in `SidebarPanel`/`FeedItem`, when a feed item has `redlineId` and the user clicks it, dispatch a `ct-focus-mark` event with the id. In `EditorPanel`, listen for it, find the DOM node carrying `data-comment-id={id}` (or `data-redline-id`), `scrollIntoView({ block: 'center' })`, and toggle a `.ct-mark-flash` class for ~800ms.
- Add the `.ct-mark-flash` keyframe in `collaboration.css` (brief yellow-tinted outline → fade).

**Acceptance:**
- Select arbitrary text → "Comment on selection" appears → click → Comments tab focused with composer ready → submitting attaches `redlineId = selectionId`.
- Clicking that comment in the sidebar scrolls and flashes the highlighted text.
- Mentions inside the comment continue to work (no regression on `pendingMentionsRef`).

**Verify:** Manual; `pnpm tsc --noEmit` clean.

---

### T4 — AI Accept = auto-replace with `replacementText`

**Files:**
- `src/pages/CollaborationToolPage/collab/useAiRedlineSuggestions.ts`
- `src/pages/CollaborationToolPage/index.tsx` (handleApproveAi)

**Changes:**
- Add `replacementText?: string` to `AiRedlineSuggestion` and to the `ApiResponseBody.data.redlineAnalysis[]` shape. Parser reads `s.replacementText` (defaults to `undefined`).
- Update `handleApproveAi` in `index.tsx:374-392`:
  - `accept`: if `item.suggestion.replacementText` is a non-empty string → `editor.setEditorValue(replaceRedline(editor.getEditorValue(), item.redline.redlineId, item.suggestion.replacementText))`. If missing → log a `console.warn` in dev (`import.meta.env.DEV`) and fall through to no-op (current behavior).
  - `reject`: keep existing branch (replaces insertion with empty, restores deletion).
  - `negotiate`: no doc mutation, only mark approved (acknowledgment).
- `replaceRedline` in `collab/redlineScan.ts` already supports arbitrary replacement text (verified at line 90-117) — no change needed.

**Acceptance:**
- When the AI endpoint returns `replacementText: "the agreed-upon term"` for an accept suggestion, clicking Accept replaces the redline span in the editor with that text and strips the mark.
- When `replacementText` is absent, accept still marks the item approved without mutating the doc, and a dev warning is logged.
- Reject and negotiate behaviors unchanged.

**Verify:** Mock the mutation in a unit test that asserts both branches (replacement present vs. absent). `pnpm tsc --noEmit` clean.

---

## Cross-cutting

- **No backend work in this phase.** T4 ships tolerant of the missing field; BE will add `replacementText` separately.
- **Dark mode:** The new `PresenceBar` must use the slate-900/800 palette pattern from `project_contract_dark_mode_patterns` memory. `.ct-mark-flash` keyframe needs a dark-mode variant.
- **Tests:** Unit test for T4 handleApproveAi branches; no new tests for T1–T3 (manual two-tab verification + existing collab smoke).
- **Telemetry / logging:** None added.

## Verification Plan

| Slice | Check |
| --- | --- |
| T1 | `pnpm tsc --noEmit`; two-tab manual — both tabs print awareness entries via `subscribeAwareness` |
| T2 | Two-tab — avatars/initials appear, save label transitions saving→saved on edit, offline on WS kill |
| T3 | Manual — select text, comment, sidebar click flashes the mark |
| T4 | Unit test passes for accept-with-replacement, accept-without, reject; manual run against staging AI endpoint |

## Risks / Mitigations

- **y-websocket strips awareness frames** → D1 degrades to count-only badge (D1 already designed for this fallback).
- **CommentMark schema is hardcoded to AI redline shape** → extend it to a discriminated union `{ kind: 'ai-redline' | 'user-comment'; id }` rather than adding a parallel mark, to keep one click-to-scroll path.
- **`provider.synced` not reliable** for clearing dirty flag → fallback: debounce the dirty flag to clear after 1.5s of no local edits while connected, in addition to the sync event.
- **Floating "Comment on selection" toolbar** may conflict with Yoopta's built-in selection menu → if Yoopta already provides one, register a new entry there instead of building a custom popover.

## Out of Scope

- Backend `replacementText` field addition (separate BE phase).
- New backend endpoints for doc-content persistence.
- Multi-cursor / caret rendering inside the editor body.
- Auto-snapshotting named Versions on an interval.
