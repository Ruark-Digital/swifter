# CONTEXT — CollaborationToolPage: Presence, Anchored Mentions, AI Replace, Save Status

**Phase:** quick/260517-collab-presence-mentions-redline-autosave
**Scope:** `src/pages/CollaborationToolPage/**`
**Date:** 2026-05-17

## Request

On the Collaboration Tool page:
1. Show an indicator of connected accounts (avatars, fallback to initials).
2. Let users reference highlighted text when they tag/mention someone in a comment.
3. AI redline "Accept" should auto-replace the existing redline span with the AI's suggestion.
4. Surface auto-save status (backend Yjs already persists over WS).

## Codebase Findings (scouted)

- **Yjs awareness is wired** in `src/pages/CollaborationToolPage/collab/useYooptaYjs.ts:121-132` via `provider.awareness`, but no local presence state (name/color/avatar) is broadcast today. Backend Yjs over WS is implemented.
- **Comment→redline anchoring already exists** via `pendingRedlineRef` in `src/pages/CollaborationToolPage/index.tsx:155-159, 258-287, 425-434`. Driven by `ct-add-redline` and `ct-add-inline-comment` window events. There's a `CommentMark` (`collab/CommentMark.tsx`) — anchored arbitrary selections can reuse the same mark.
- **AI suggestion shape lacks replacement text.** `collab/useAiRedlineSuggestions.ts:10-18, 38-44, 122-133` returns only `{ assessment, suggestion: accept|reject|negotiate, riskLevel }`. `handleApproveAi` (index.tsx:374-392) currently only mutates the doc on `suggestion === "reject"`. To make Accept auto-replace, the backend `RedlineAnalysisResultItem` schema must add `replacementText` (or equivalent).
- **No backend doc-content endpoint** exists; the document body lives in Yjs and is persisted server-side over the collab WS. So "auto-save" is already happening — we just need to reflect status.
- Mentionables list comes from `useContractMentionables(contractId)` (index.tsx:161) — reusable for the new selection-anchor flow.
- Local versions: `handleSaveVersion`/`handleRestoreVersion` (index.tsx:305-342) write to `localStorage` keyed by `doc-version-<uuid>` — keep as-is.

## Decisions (LOCKED)

### D1 — Connected-accounts indicator
- **Avatar stack on editor header**, fallback to hash-colored initials (reuse the FeedItem palette pattern from `project_collab_comments_polish` memory).
- Show up to **4 avatars**, then a `+N` overflow chip with a tooltip listing remaining users.
- **Primary source — Yjs awareness:** on connect, push local `{ name, avatarUrl?, color }` via `provider.awareness.setLocalState(...)`; subscribe to `awareness.on('change')` and render unique clients (omit self). y-websocket forwards awareness updates between clients automatically, independent of the BE's custom messages.
- **Secondary source — BE device-count message (type 2):** the collab server emits a custom binary message `[varuint msgType=2][varuint count]` with the total connected device count (see `Downloads/collab-client.html:319-341`). If awareness fails to populate (e.g. older BE that strips awareness frames), fall back to a numeric badge `N connected`.
- Place above the editor, in a small horizontal bar that also hosts the auto-save status (D4).

### D2 — Mention/comment anchoring to highlighted text
- User selects text in the editor → a floating **"Comment on selection"** action appears (reuse the same mechanism that fires `ct-add-inline-comment` today).
- Clicking it stamps a new `CommentMark` on the selection with a fresh `selectionId`, sets `pendingRedlineRef = { redlineId: selectionId, kind: "insertion" }` (reuse existing plumbing — treat selection anchors as insertion-kind for navigation parity), and focuses the comment textarea.
- Mentioning a user does **not** by itself anchor; anchoring is explicit via the selection action. Mentions inside a comment continue to live in `LocalComment.mentions` (already wired).
- Clicking a comment in the sidebar that has a `redlineId` scrolls the editor to the mark and briefly flashes it (extend existing redline-click handler to also handle plain selection marks).

### D3 — AI Accept = auto-replace
- Extend `AiRedlineSuggestion` (and the backend `RedlineAnalysisResultItem` schema) with **`replacementText: string`** (required when `suggestion === "accept"` or `"negotiate"`; optional/empty for `"reject"`).
- `handleApproveAi` becomes: if `suggestion === "accept"` and `replacementText` present → `replaceRedline(value, redlineId, replacementText)`; if `"reject"` → existing behavior (clear insertion / restore deletion); if `"negotiate"` → no doc mutation, just mark approved (acts as acknowledgment).
- `replaceRedline` already exists in `collab/redlineScan.ts` — verify it handles non-empty replacement text for both insertion and deletion kinds; extend if not.
- Backend coordination needed: confirm the AI route returns `replacementText`. Until backend ships, frontend should tolerate its absence (fall back to today's accept = no-op-on-doc behavior, log a console warning in dev).

### D4 — Auto-save status indicator
- **Status indicator only** — no new persistence code path. Backend Yjs over WS already auto-persists.
- Render compact label next to the presence row driven by:
  - `provider.on('status', ({ status }) => ...)` — values `connecting | connected | disconnected` (verified in `collab-client.html:383-390`).
  - `provider.on('sync', (synced: boolean) => ...)` — flips `true` once the initial state is reconciled.
  - A local "dirty" flag toggled on `ytext`/Yoopta-fragment local updates and cleared on the next sync event.
- States: `Offline` (status !== connected) → `Saving…` (dirty & connected) → `Saved • <relative time>` (synced & not dirty).
- Keep manual **Save Version** button untouched (named restore points are still useful).

## Out of Scope / Deferred

- Adding new backend endpoints for document content persistence (Yjs WS already handles it).
- Auto-snapshotting named Versions on an interval — deferred until users ask.
- Multi-cursor rendering inside the editor (only the presence header is in scope).
- Replacing the manual Save Version button.

## Files Expected to Change

- `src/pages/CollaborationToolPage/index.tsx` — wire presence state, save-status, selection-anchor plumbing, extended AI-accept handler.
- `src/pages/CollaborationToolPage/collab/useYooptaYjs.ts` — expose awareness subscription helper + accept local-presence input (name/avatar/color).
- `src/pages/CollaborationToolPage/components/EditorPanel.tsx` — emit "Comment on selection" floating action; render presence + save-status header.
- `src/pages/CollaborationToolPage/components/SidebarPanel.tsx` / `CommentsTab.tsx` / `FeedItem.tsx` — click-to-scroll for selection-anchored comments.
- `src/pages/CollaborationToolPage/collab/useAiRedlineSuggestions.ts` — add `replacementText` to type + parser.
- `src/pages/CollaborationToolPage/collab/redlineScan.ts` — verify/extend `replaceRedline` for arbitrary text.
- `src/pages/CollaborationToolPage/collab/CommentMark.tsx` — confirm it can mark plain selections (not only AI-generated redlines).
- New: a small `PresenceBar.tsx` (or inline in EditorPanel) for the avatar stack + save-status.

## Open Questions for Researcher / Planner

- Does the backend AI redline endpoint already include `replacementText` in any environment, or is a backend change required? (Check OpenAPI / swagger 2.3.x + ask BE.)
- Confirm the BE forwards Yjs awareness frames between clients (default y-websocket behavior). If it strips them, D1 degrades to count-only badge from msg-type-2.
- User identity for awareness presence: `useUser()` returns `{ name, email, avatar? }` — confirm `avatar` field exists; if not, render initials only.

## BE Reference Notes (from Downloads/collab-client.html)

- WS URL: `ws://host:port/collab?doc=<docName>` — matches our `makeAuthWebSocketClass`.
- Auth: JWT as `Sec-WebSocket-Protocol: ['access_token', token]` — already implemented.
- Custom server message type **2** = connected-device count, encoded as `[varuint msgType][varuint count]`. We can decode this with a small `readVarUint` helper (copy from the reference client) attached to `provider.ws.addEventListener('message', ...)`.
- `provider.on('sync', synced => ...)` fires once initial state is reconciled — gives us the cue to clear the dirty flag.

## Next Steps

Proceed to **plan-phase** with this CONTEXT.md. Planner should map each of D1–D4 to atomic tasks, identify the redlineScan/CommentMark refactor first, and flag the backend dependency for D3.
