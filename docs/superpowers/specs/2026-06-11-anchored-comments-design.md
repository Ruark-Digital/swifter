# Anchored Comments — SuperDoc iframe path

**Date:** 2026-06-11
**Repos:** `swifter` (host) + `superdoc-swiftpro` (iframe editor app)
**Status:** Approved (chip + auto-anchor UX)

## Goal

On `CollaborationToolPage`, a user can select/highlight a range in the document
and attach a panel comment to it. The range gets a visible highlight in the
document. Clicking the comment in the right panel scrolls the document to the
highlighted range. (Existing redline-anchored comments must also gain
click-to-scroll in the iframe path — today `ct-focus-mark` has no iframe
listener.)

## Approach

Use SuperDoc's native comments as the anchor mechanism, with the host panel
remaining the only comment UI ("our UI drives the tool"):

- `editor.doc.comments.create({ text, target })` creates a Word-style comment
  anchored to a text range with a visible highlight. `target` comes from
  `editor.doc.selection.current().target` (multi-block selections supported).
- `superdoc.navigateTo({ kind: 'entity', entityType: 'comment', entityId })`
  scrolls to and activates the comment's range.
- Anchors live in the document (Yjs-synced to collaborators, persisted with the
  room, included in .docx export). SuperDoc's own comments list UI is opt-in
  (`addCommentsList()`) and is NOT used.

Rejected alternatives: tracked-changes-only anchoring (can't anchor arbitrary
text); bookmark anchors (no visible highlight, manual lifecycle).

## Data flow

1. User selects text in the iframe → iframe posts debounced
   `superdoc:selection { hasSelection, excerpt }` to host.
2. Host shows a dismissible chip above the comment box:
   `anchored to: "<excerpt…>"` with an X. Chip clears when the iframe reports
   an empty selection or when dismissed.
3. User submits a comment while the chip is active → host calls
   `adapter.anchorComment(text)` → IframeEditorPane posts
   `superdoc:add-comment { requestId, text }` → iframe creates the SuperDoc
   comment at its last non-empty selection target → replies
   `superdoc:comment-created { requestId, commentId }`.
4. Host saves the backend comment (`/contract/file-comment/{fileId}` rich
   metadata, or localStorage fallback) with new field `anchorCommentId`.
5. Clicking an anchored comment in the panel dispatches a window event →
   IframeEditorPane posts `superdoc:focus-comment { commentId }` → iframe
   calls `navigateTo`.

## Changes — superdoc-swiftpro (iframe app)

- `superdocOptions.ts`: enable `modules.comments` (highlight colors aligned
  with the host's amber "anchored" accent; defaults acceptable for v1).
- `bridge.ts`: add outbound `superdoc:selection`, `superdoc:comment-created`;
  add inbound commands `superdoc:add-comment`, `superdoc:focus-comment`.
- `main.ts`:
  - In the existing `selectionUpdate` handler, capture the last non-empty
    `doc.selection.current()` target + excerpt; post deduped/debounced
    `superdoc:selection` state changes.
  - Handle `superdoc:add-comment`: `doc.comments.create({ text, target })`,
    reply with the receipt id (or `commentId: null` on failure). Defensive:
    missing editor/target → failure reply, never throw.
  - Handle `superdoc:focus-comment`: `navigateTo` entity comment; no-op on
    failure (same pattern as `focusRedline`).
- If enabling the comments module surfaces any built-in floating comment UI,
  suppress it via module config/CSS — the host panel is the only comment UI.

## Changes — swifter (host)

- `collab/superdocBridge.ts`: parse the two new inbound messages; add
  `buildAddComment(requestId, text)` and `buildFocusComment(commentId)`.
- `collab/editorAdapter.ts`: add
  `anchorComment?: (text: string) => Promise<string | null>`.
- `components/IframeEditorPane.tsx`:
  - Implement `anchorComment` via requestId correlation with a timeout
    (~5s). Timeout/failure resolves `null`.
  - Relay `superdoc:selection` to the page via window event
    `ct-selection-change { hasSelection, excerpt }` (matches existing
    window-event patterns).
  - Listen for `ct-focus-comment { commentId }` → post
    `superdoc:focus-comment`.
  - Also listen for `ct-focus-mark { id }` → post `superdoc:focus-redline`
    (fixes click-to-scroll for existing redline-anchored comments).
- `index.tsx`:
  - Track pending selection anchor state (`hasSelection` + excerpt) from
    `ct-selection-change`; pass chip props down to the comments tab.
  - `handleSubmitComment`: if the chip is active and the adapter supports
    `anchorComment`, await it; save the comment with `anchorCommentId` (null
    on failure → plain comment, no error toast; dev console warn).
- `collab/useFileComments.ts`: round-trip `anchorCommentId` through the
  sentinel metadata (`FileCommentRich`).
- `components/CommentsTab.tsx` (+ `WriteComment` if the chip renders there):
  - Render the dismissible anchor chip.
  - `CommentsFeedItem` gains `anchorCommentId`; click dispatches
    `ct-focus-comment` when present, else existing `ct-focus-mark` for
    redline anchors. Anchored comments keep the existing
    "anchored to document" affordance.

## Error handling

- Anchor create timeout/failure → comment saves unanchored; no user-facing
  error (the comment text is the primary artifact).
- Focus on a missing anchor (e.g. document-only fallback session where the
  room state was lost) → `navigateTo` no-ops; no error.
- All iframe-side SuperDoc calls wrapped defensively (existing convention:
  never crash the iframe on API throws).

## Out of scope (v1)

- Reverse direction: clicking a highlight in the document focusing the panel
  comment (redlines already do this via `redline-clicked`; comments can follow
  later with the same pattern).
- Deleting/resolving the document anchor when a panel comment is deleted (the
  panel has no comment deletion today).
- Legacy (non-iframe) editors — they keep their existing `ct-focus-mark` mark
  behavior.

## Testing

- `superdocBridge.test.ts` (host) + `bridge.test.ts` (iframe): parse/build
  round-trips for the four new messages, malformed-payload rejection.
- IframeEditorPane test: `anchorComment` resolves on matching requestId,
  resolves null on timeout; `ct-focus-comment`/`ct-focus-mark` forwarding.
- Iframe app unit tests for the add-comment handler (mock doc API): success,
  missing target, API throw.
- Manual UAT: select → chip → submit → highlight appears for both clients;
  click comment → scroll; dismiss chip → plain comment; reload → anchor
  persists; redline-anchored comment click now scrolls.
