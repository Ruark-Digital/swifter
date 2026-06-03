---
phase: 01-gdocs-editor
created: 2026-06-03
supersedes: none
inputs:
  - .planning/quick/260603-gdocs-editor/01-SPEC.md (commit bd0717ddc)
---

# CONTEXT — Google-Docs-style TipTap editor build

Captures implementation decisions reached in discussion. SPEC.md holds the *what* (9 falsifiable REQs); this holds the *how*. Downstream planner reads both.

## Locked Decisions

### Pagination plugin firing strategy (REQ-05)

**Hybrid: sync on structural edits, async (debounced ~150ms) on text edits.**

Detect transaction kind in the ProseMirror plugin's `appendTransaction` hook:
- **Structural** (paste, delete-block, image-insert, table-insert, redline-mark-toggle) → run pagination immediately in the same transaction.
- **Pure text** (typing, single-character inserts/deletes, mark application on existing text) → debounce 150ms after last edit; re-paginate once on the trailing tick.

Reason: keeps typing buttery while ensuring paste/image/table operations land on correct page boundaries before the user reaches for them.

**Open for planner:** exact transaction-kind detection — a single utility `classifyTransaction(tr): "structural" | "text"` examines `tr.steps` and `tr.docChanged`. Lives in `src/pages/CollaborationToolPage/collab/pagination/classifyTransaction.ts`.

### Page footer rendering (REQ-05)

**CSS counters + `::after` on `.ct-tiptap-page`. Pagination plugin sets a `--total-pages` custom property at the root.**

```css
.ct-editor-canvas { counter-reset: page; --total-pages: 1; }
.ct-tiptap-page { counter-increment: page; }
.ct-tiptap-page::after {
  content: "Page " counter(page) " of " var(--total-pages);
  /* position bottom-center of sheet */
}
```

Plugin code: after each pagination pass, `canvas.style.setProperty('--total-pages', String(pageCount))`. Footer text updates with zero re-render cost. No DOM nodes added to the editor doc; no Yjs sync impact; no NodeView complexity.

**Alternative considered:** ProseMirror Decoration widgets — rejected because CSS solves it with less code given we accept "Page N of M" as the footer's only content.

### Page nodes derived locally — NOT stored in Yjs

Pagination plugin operates on the local editor view only. The Y.Doc continues to hold the existing flat block tree (paragraphs, headings, tables, lists, images). The plugin reads that tree, measures rendered heights, and inserts `Page` boundary markers into the **local view state** via Decorations or via a transaction with a `meta.local=true` flag that the Y-prosemirror sync layer is configured to ignore.

Two clients editing concurrently:
- Inner content (paragraphs/text) syncs through Yjs as usual.
- Each client's pagination plugin re-runs locally after sync.
- Same content → same measured heights → same page boundaries on both clients.

**Open for planner:** verify y-prosemirror version supports `meta.local` filtering, OR confirm Decoration-only approach is enough (decorations live in `EditorState.editorProps.decorations`, never enter `doc`). Latter is the safer default — no Y-prosemirror plumbing.

### Branch off to `gdocs-editor` before any commits

Create `gdocs-editor` from `phase2-bug-local-fixes` HEAD (current SHA `bd0717ddc`) before the baseline-commit task runs. All build work commits onto `gdocs-editor`. When the phase ships, the PR diff is isolated from the rest of phase2 bug fixes.

```bash
git switch -c gdocs-editor
```

**Open for planner:** decide if `gdocs-editor` PRs into `phase2-bug-local-fixes` (keeps phase2 stack intact) or directly into `main` (cleaner, but requires `phase2-bug-local-fixes` to merge first). Defer until first PR-ready milestone.

### Table fidelity verified against Hyperscale only

REQ-06 acceptance runs against the Hyperscale supply agreement's existing tables. No additional reference doc is added to `.qa/reference-docs/` for tables. If post-build production docs surface pathological table layouts (merged cells, deep nesting), they get their own follow-up phase — out of scope here.

## Carrying Forward from This Session (260603-c)

Baseline commit on `gdocs-editor` (task 1) includes everything in the current working tree:

| Asset | File | Purpose |
|---|---|---|
| `@tiptap/extension-text-align@3.23.4` | `package.json` + `useTipTapEditor.ts` | Paragraph alignment authoring + sync (REQ-02) |
| `@tiptap/extension-image@3.23.4` w/ `allowBase64: true` | `package.json` + `useTipTapEditor.ts` | Inline image rendering (REQ-03) |
| mammoth `transformDocument` + styleMap + post-regex inline-style injection | `src/lib/fileUtils.tsx:226` | Source alignment recovery on DOCX import (REQ-02) |
| TOC double-anchor splice w/ `__page` synthetic href | `src/lib/fileUtils.tsx` (post-process) | Splits TOC link text + page number so TipTap doesn't merge them (REQ-04) |
| `.ct-tiptap-page` wrapper + Times-12pt typography + grey backdrop | `src/pages/CollaborationToolPage/collaboration.css` | Page chrome + body typography (REQ-01, REQ-09) |
| `:has(> a[href*="__page"])` flex layout w/ dotted leader `::before` | `collaboration.css` | TOC 2-column rendering (REQ-04) |
| 4 BubbleMenu alignment buttons + image styling | `TipTapEditorPanel.tsx` + `collaboration.css` | Authoring controls |

Page-break gutter rule (`hr.docx-page-break`) already reverted; do **not** re-introduce. Multi-page sheets ship via REQ-05 pagination plugin.

## Canonical Refs

| Ref | Purpose |
|---|---|
| `.planning/quick/260603-gdocs-editor/01-SPEC.md` | Locked requirements — MUST read before planning |
| [src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx](src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx) | Editor panel — entry point for extension wiring and canvas chrome |
| [src/pages/CollaborationToolPage/collab/useTipTapEditor.ts](src/pages/CollaborationToolPage/collab/useTipTapEditor.ts) | Extension registration — new Page/pagination/table extensions land here |
| [src/pages/CollaborationToolPage/collab/useCollabProvider.ts](src/pages/CollaborationToolPage/collab/useCollabProvider.ts) | Yjs WebSocket provider — DO NOT MODIFY without explicit reason |
| [src/lib/fileUtils.tsx](src/lib/fileUtils.tsx) | `convertDocxToHtml` — mammoth import pipeline (REQ-02/04/06 may extend) |
| [src/pages/CollaborationToolPage/collaboration.css](src/pages/CollaborationToolPage/collaboration.css) | Editor canvas styling — page chrome, typography, TOC layout |
| [src/pages/CollaborationToolPage/collab/marks/](src/pages/CollaborationToolPage/collab/marks/) | CommentMark, InsertionMark, DeletionMark — DO NOT MODIFY |
| [src/pages/CollaborationToolPage/collab/useCollabVersions.ts](src/pages/CollaborationToolPage/collab/useCollabVersions.ts) | Version history hook — DO NOT MODIFY |
| [src/pages/CollaborationToolPage/collab/useAiRedlineSuggestions.ts](src/pages/CollaborationToolPage/collab/useAiRedlineSuggestions.ts) | AI redline pipeline — DO NOT MODIFY |
| TipTap v3 docs — Custom Node guide | https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node — for Page node |
| ProseMirror Plugin guide | https://prosemirror.net/docs/guide/#state.plugins — for pagination plugin |
| ProseMirror Decorations | https://prosemirror.net/docs/guide/#view.decorations — for Page nodes derived locally |
| `@tiptap/extension-table@3.23.4` | npm — install for REQ-06 |

## Deferred Ideas

- **Source DOCX headers/footers** — extract Word's stored header/footer xml and render in Page node footer slot. Currently SPEC ships auto "Page N of M" only.
- **Print/PDF export fidelity** — `@react-pdf/renderer` or browser print w/ tuned `@page` rules. Separate phase.
- **Playwright screenshot-diff harness** — automation for fidelity regression testing. Nice-to-have once the build settles.
- **Yoopta panel parity** — apply equivalent rendering to the default Yoopta path. Separate phase if business cares.
- **Mobile/tablet** — currently desktop only; revisit if mobile contract review becomes a use case.
- **Branch hygiene** — splitting `phase2-bug-local-fixes` into separate feature PRs via filter-repo. Out of scope.

## Constraints Repeated (from SPEC for planner convenience)

- Yjs CRDT sync MUST work at every commit
- CommentMark / InsertionMark / DeletionMark / AI suggestions / version history / presence bar / save-status all unchanged
- TipTap is the engine — no swap
- Pagination is derived per-client, not synced
- Existing 260603-c patches are the baseline, committed as task 1

## Next

`/gsd-plan-phase` against this CONTEXT + the SPEC. Expected output: `03-PLAN.md` with day-by-day task breakdown for the build.
