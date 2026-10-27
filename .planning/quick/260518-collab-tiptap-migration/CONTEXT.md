# CONTEXT — Migrate CollaborationToolPage to TipTap + Yjs

**Phase:** quick/260518-collab-tiptap-migration
**Scope:** `src/pages/CollaborationToolPage/**` editor replacement
**Date:** 2026-05-18
**Budget:** 3–4 weeks (production-grade)

## Why we're here

The current Yoopta-based collab broke in two compounding ways:

1. **No real cross-client sync.** Each Yoopta editor instance assigns a random `yoo.id`, and each instance generates its own block IDs at init. The Yjs fragment key `yoopta:${yoo.id}:block:${blockId}` therefore differs between tabs — fragments never converge, edits never propagate.
2. **Snapshot-sync workaround is a dead end for the product.** Storing the whole editor value in a single `Y.Map` entry technically syncs but causes cursor jumps and last-write-wins on concurrent edits. Acceptable for a side-tool; unacceptable for a Word-document review platform.

The product is a contract-review tool where two or more reviewers edit the same document. Standard for the category is Google Docs / Office 365 feel — character-level CRDT, no jumps. **Yoopta was not designed for this.**

## Decisions (LOCKED)

### D1 — Quality bar: Google Docs feel
- Character-level CRDT, no cursor jumps, presence cursors visible.
- Two reviewers can type in the same paragraph concurrently and see each other's letters appear in real time.

### D2 — Editor: TipTap + Yjs
- ProseMirror under the hood, official Yjs integration via `@tiptap/extension-collaboration` and `@tiptap/extension-collaboration-cursor`.
- y-websocket protocol — **the existing BE collab server stays as-is** (`wss://api.swiftpro.tech/api/v1/dev/contract/collab?doc=<docName>`, JWT in `Sec-WebSocket-Protocol`, custom msg type 2 for device count). TipTap's `Collaboration` extension speaks raw Yjs over y-websocket — protocol-compatible.

### D3 — Must-have features
- **Track changes (redline accept/reject):** carry over insertion/deletion marks from current Yoopta implementation. Build as custom TipTap marks (skip the paid TipTap Pro TrackChanges extension unless we hit a wall).
- **Anchored comments + @mentions:** custom comment mark with `commentId`, side-panel composer (already built — port the UI, change the editor binding). @mention rendering via `@tiptap/extension-mention`.
- **AI redline suggestions w/ auto-replace:** existing `/ai/redline-suggestions` endpoint stays; replace `replaceRedline` util with a ProseMirror transaction that swaps the marked span text.
- **DOCX round-trip:** import via existing mammoth pipeline (mammoth → HTML → TipTap). Export via a pure-JS path — leading candidate is converting TipTap's HTML output through `html-docx-js-typescript` or generating via `docx` library directly from the TipTap JSON. **Do not** assume TipTap Pro Convert extension.

### D4 — Out of scope for this phase
- Presence cursors styling polish beyond a basic per-user color.
- Comments threading / replies (current code stripped replies — keep flat).
- AI-driven suggestion comments separate from redline suggestions.
- Mobile / touch UX optimization.
- Offline editing past the existing IndexedDB persistence.

## Key Trade-offs Acknowledged

- **TipTap Pro extensions are paid.** Decision: build redlines, comments, and DOCX export ourselves with OSS pieces. If track-changes UX becomes unmanageable, revisit purchasing the Pro TrackChanges extension at end of phase.
- **Yoopta-specific UI flourishes will need re-implementing.** The slash-menu (`ActionMenu`), block-drag handle, and `LinkTool` have TipTap equivalents but require mapping work.
- **Existing tests + memory notes** referencing Yoopta selection, `CommentMark`, `RedlineMarks`, `useYooptaYjs` need to be ported or deleted.
- **`@slate-yjs/core`, `@slate-yjs/react`, all `@yoopta/*` packages** will be removed at the end of the phase — non-trivial dependency cleanup.

## Architecture (target)

```
src/pages/CollaborationToolPage/
├── index.tsx                  # page shell, URL params, sidebar wiring (stays)
├── collab/
│   ├── useCollabProvider.ts   # NEW — Yjs Y.Doc + WebsocketProvider + IndexedDB
│   │                          #       (extracted from useYooptaYjs.ts, reuses
│   │                          #        makeAuthWebSocketClass, device-count,
│   │                          #        awareness, sync-state helpers)
│   ├── useTipTapEditor.ts     # NEW — useEditor() with Collaboration +
│   │                          #       CollaborationCursor + custom marks
│   ├── marks/
│   │   ├── insertion.ts       # NEW — TipTap Mark for redline insertions
│   │   ├── deletion.ts        # NEW — TipTap Mark for redline deletions
│   │   └── comment.ts         # NEW — TipTap Mark for anchored comments
│   ├── extensions/
│   │   └── ai-redline.ts      # NEW — ProseMirror transactions for accept/reject
│   ├── redlineScan.ts         # PORT — extractRedlines over TipTap JSON
│   ├── docxImport.ts          # PORT — mammoth → HTML → TipTap setContent
│   ├── docxExport.ts          # NEW — TipTap JSON → docx file
│   ├── useFileComments.ts     # STAYS — backend comment API unchanged
│   ├── useContractMentionables.ts  # STAYS
│   └── useAiRedlineSuggestions.ts  # STAYS
├── components/
│   ├── EditorPanel.tsx        # REWRITE — host TipTap, presence bar, toolbar
│   ├── PresenceBar.tsx        # STAYS
│   ├── SidebarPanel.tsx       # STAYS
│   ├── CommentsTab.tsx        # STAYS
│   ├── WriteComment.tsx       # STAYS
│   ├── FeedItem.tsx           # STAYS
│   ├── AiSuggestionsPanel.tsx # MINOR — adapt to new redlineScan output
│   └── VersionsTab.tsx        # MINOR — version JSON shape changes
└── store/
    └── useCollaborationStore.ts  # STAYS
```

## Phase Breakdown (proposed 4 sub-phases)

**Sub-phase 1 — Foundation (week 1):**
- Add TipTap dependencies, remove Yoopta + slate-yjs.
- Build `useCollabProvider` (Y.Doc + WS + IDB + presence/sync/device helpers).
- Stand up a minimal TipTap editor with `Collaboration` + `CollaborationCursor` + StarterKit.
- Two-tab smoke test: typing in tab A appears in tab B character-by-character with cursors.

**Sub-phase 2 — Marks + redlines (week 2):**
- Port `CommentMark`, `InsertionMark`, `DeletionMark` as TipTap marks with metadata attrs.
- Port floating selection toolbar (Bold/Italic/+/−/Comment) into TipTap's `BubbleMenu`.
- Port `extractRedlines` + `replaceRedline` to operate on TipTap JSON / ProseMirror state.
- AI suggestions accept/reject working end-to-end.

**Sub-phase 3 — Comments + mentions + sidebar wiring (week 3):**
- Wire comment marks to sidebar (existing event plumbing — `ct-add-inline-comment`, `ct-focus-mark` — stays).
- @mention extension fed by `useContractMentionables`.
- File-comment API persistence unchanged.
- Version history snapshot/restore against TipTap JSON.

**Sub-phase 4 — DOCX round-trip + polish (week 4):**
- DOCX import: keep mammoth → HTML, feed to TipTap's `editor.commands.setContent(html)`.
- DOCX export: TipTap JSON → docx library. Smoke-test round-trip on real contract files.
- Dark mode, cursor color assignment from `localUser`, presence-cursor labels.
- Tear out remaining Yoopta code + dependencies.
- Regression QA against the existing test suite under `__tests__/`.

## BE Coordination

- **No backend changes expected.** y-websocket protocol is the same wire format. `Sec-WebSocket-Protocol` JWT auth unchanged. `msgType=2` device count handler stays.
- **Sanity check during sub-phase 1:** confirm BE's Yjs server doesn't strip awareness frames — TipTap's `CollaborationCursor` needs awareness to propagate cursor positions. If stripped, BE work required.
- **AI redline endpoint:** add `replacementText` field to `RedlineAnalysisResultItem` (already flagged in the prior phase's CONTEXT). Still pending.

## Open Questions for Researcher / Planner

1. **DOCX export quality target.** Round-trip fidelity vs. "good enough export" — does the user actually need to re-import the exported docx, or is export read-only? Affects whether we invest in a custom serializer or use a quick HTML-to-DOCX path.
2. **Track-changes UX.** Show inline (current Yoopta model) or in a side panel (Word's Reviewing Pane)? Inline is what we have; side panel scales better for many changes.
3. **Comment threading.** Current product is flat (replies removed per memory note `project_collab_comments_polish`). Reaffirm or revisit during sub-phase 3.
4. **Awareness forwarding by BE.** Need a one-line test on the live server early in sub-phase 1.
5. **Yoopta-shaped data in the DB.** Are existing saved drafts in Yoopta JSON anywhere on the server? If yes, write a one-shot migration to TipTap JSON, or render a "re-open in v2" prompt.

## Files Confirmed Untouched

- `src/store/authSlice.ts`
- `src/lib/axiosInstance.ts`
- The `/contract/file-comment/{fileId}` API and its hooks
- `useContractMentionables`, `useAiRedlineSuggestions` (return shapes stay; only consumer changes)
- `src/lib/fileToMarkdown.ts`, mammoth usage

## Next Steps

Proceed to **plan-phase** with this CONTEXT. Planner should produce four PLAN.md files (one per sub-phase) so each week's work can be reviewed and executed independently. Sub-phase 1 should ship a tracer-bullet two-tab demo before any port work begins — if that fails, we revisit D2.
