---
date: 2026-06-05
topic: superdoc-bridge-redlines-comments
status: approved-design
branch: feat-collab-superdoc-editor
builds-on: 2026-06-05-superdoc-iframe-editor-design.md
repos: swifter (host) + superdoc-swiftpro (AGPL app)
---

# Design — wire SwiftPro's sidebar features to the SuperDoc iframe

## Goal

The SuperDoc iframe renders documents (shipped). Now connect SwiftPro's
**existing** sidebar features to the SuperDoc document, without rebuilding them in
SuperDoc:

1. **Editing toolbar** — give the user formatting controls in the SuperDoc app.
2. **Redlines / AI Polish** — the Redline tab's AI-suggestion flow operates on the
   SuperDoc document: extract the document's redlines (tracked changes), and when
   the user **accepts** a suggestion, **replace that span's text in SuperDoc**.
   Focusing a redline in the sidebar highlights/scrolls to it in SuperDoc.
3. **Comments anchored to highlight** — a comment links to a selected range in
   SuperDoc; clicking it highlights/scrolls to the range; clicking a marked area
   in the doc focuses its comment in the sidebar.

## Architecture (decided 260605)

SwiftPro's sidebar stays the **UI and source of truth**. The bridge connects its
actions to SuperDoc: **read marked areas out of SuperDoc, write changes in on
accept, and highlight/scroll for linking.** This is the `editorAdapter` role
(`extractRedlines`/`replaceRedline`) — currently `null` for the iframe —
re-implemented over `postMessage`.

User's words (260605): *"I'm talking about linking the marked area to superDoc
and updating the superdoc area when the user accept."*

"Redline / marked area" = **SuperDoc tracked changes** (insertions/deletions),
matching the legacy Yoopta insertion/deletion model and the AI Polish wording
"every redline currently in this document". (User-selected-text marking is a
possible later extension, out of scope here.)

## The key insight (keeps it small)

`index.tsx` already drives the AI flow through the adapter:
- `runAiSuggestions()` → `adapter.extractRedlines()`
- `handleApproveAi()` → `adapter.replaceRedline(redlineId, replacement)` + snapshot

So instead of `onEditorReady(null)`, `IframeEditorPane` publishes a
**bridge-backed adapter**. The existing Redline tab / AI Polish / accept flow then
works against SuperDoc with minimal change to the page. `extractRedlines()` must
stay synchronous, so the iframe **pushes** the current redlines and the host
**caches** them.

## Bridge protocol additions

Mirrored in `swifter/.../collab/superdocBridge.ts` and
`superdoc-swiftpro/src/bridge.ts`. All messages keep the existing
`{ type, payload? }` shape and strict origin checks.

### Redlines (slice 2)
| Direction | `type` | `payload` |
|---|---|---|
| iframe → host | `superdoc:redlines` | `{ redlines: RedlineSpan[] }` — pushed after init and on every `onTrackedChangesUpdate`; host caches |
| host → iframe | `superdoc:apply-redline` | `{ redlineId: string, replacement: string }` |
| host → iframe | `superdoc:focus-redline` | `{ redlineId: string }` |
| iframe → host | `superdoc:redline-clicked` | `{ redlineId: string }` |

`RedlineSpan` reuses the existing shape from `redlineScan.ts`:
`{ redlineId, kind: "insertion" | "deletion", text, author?, createdAt? }`.

### Comments (slice 3)
| Direction | `type` | `payload` |
|---|---|---|
| iframe → host | `superdoc:selection` | `{ hasSelection: boolean, text: string }` |
| host → iframe | `superdoc:add-comment` | `{ commentId: string, text: string }` (anchor to current selection) |
| host → iframe | `superdoc:focus-comment` | `{ commentId: string }` |
| iframe → host | `superdoc:comment-clicked` | `{ commentId: string }` |

## SuperDoc app side (`superdoc-swiftpro`)

- **Toolbar (slice 1):** add a toolbar mount element in `index.html` / the app
  shell and pass `toolbar: '#superdoc-toolbar'` in the SuperDoc options.
- **Redlines (slice 2):** map `trackedChanges.list()` → `RedlineSpan[]`
  (`change.id`→`redlineId`; insertion/deletion→`kind`; change text→`text`).
  Wire `onTrackedChangesUpdate` → post `superdoc:redlines`. Handle
  `superdoc:apply-redline` → replace the change's text via the editor command;
  `superdoc:focus-redline` → scroll/select the change. Enable `documentMode`
  control so new edits can be tracked (suggesting); extraction works regardless
  of mode (existing tracked changes in the `.docx` are surfaced).
- **Comments (slice 3):** on `onEditorSelectionUpdate`/`onSelectionUpdate` post
  `superdoc:selection`; `superdoc:add-comment` → `comments.create({ target:
  currentSelection })`; `onCommentClicked` → post `superdoc:comment-clicked`;
  `superdoc:focus-comment` → focus the comment's anchor.

## SwiftPro host side (`swifter`)

- `IframeEditorPane`:
  - Cache `redlines` from `superdoc:redlines`; cache `selection` from
    `superdoc:selection`.
  - Build an `editorAdapter`:
    - `extractRedlines()` → returns the cached array (sync).
    - `replaceRedline(id, text)` → posts `superdoc:apply-redline`.
    - `getSnapshot()/setSnapshot()` → no-op (version history stays deferred).
    - `kind` → add `"superdoc"` to `EditorKind`.
    - `doc` → `EditorAdapter.doc` becomes optional (`doc?: Y.Doc`); the iframe
      has no host-side Y.Doc. `useCollabVersions(undefined)` already tolerates a
      missing doc.
  - Pass the adapter to `onEditorReady` (no longer `null`).
  - On `superdoc:redline-clicked` → `window.dispatchEvent(new CustomEvent(
    "ct-add-redline", { detail: { redlineId, kind } }))` (reuses the page's
    existing listener that switches to the Comments tab + snapshots).
- Sidebar "focus a redline" affordance (if any) → call a new adapter method or
  dispatch a host→iframe `superdoc:focus-redline`. (Wiring the focus direction
  from the sidebar is part of slice 2; the AI list already renders per redline.)

## Out of scope

- Version history over the bridge (`getSnapshot`/`setSnapshot` stay stubbed).
- Persisting SuperDoc comments to the `/file-comment` backend (comments live in
  the SuperDoc doc for now; surfacing in the sidebar is slice 3).
- User-selected-text "mark as redline" (redlines = tracked changes this phase).

## Verification

- **Slice 1:** toolbar renders above the document; formatting buttons affect the
  doc. `pnpm typecheck` + app build clean.
- **Slice 2:** open a `.docx` with tracked changes (the Powell Comments file) →
  Redline tab lists them → AI Polish "Generate suggestions" returns rephrases →
  accept → the text changes in the SuperDoc document. Unit-test the bridge
  protocol additions (parse/build) on both sides; the host adapter returns the
  cached redlines and posts `apply-redline` on accept. E2E (Playwright, the
  established harness): editor-ready → `superdoc:redlines` received → accept path
  posts `apply-redline`.
- **Slice 3:** select text → add comment from sidebar → range highlighted in
  SuperDoc; click comment → scrolls/highlights; click highlight → sidebar opens
  the comment.

## Slice order

1. Toolbar — small, self-contained, independent.
2. Redline bridge — the core of the request.
3. Comments anchored to highlight.

Each slice is independently shippable and verifiable.
