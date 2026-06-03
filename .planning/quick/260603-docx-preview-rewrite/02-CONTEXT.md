---
phase: 02-docx-preview-rewrite
created: 2026-06-03
inputs:
  - .planning/quick/260603-docx-preview-rewrite/01-SPEC.md (60c151c49)
  - .planning/quick/260603-gdocs-editor/spike/FINDINGS.md (82ab8c7af)
predecessor_branch: gdocs-editor (25 commits ahead)
build_cadence: full GSD ceremony (discuss → plan → execute)
---

# CONTEXT — docx-preview rewrite implementation decisions

SPEC (`01-SPEC.md`) locks the WHAT (7 falsifiable REQs). This locks the HOW for the open implementation choices the planner needs to know before producing PLAN.md.

## Locked Decisions

### Page-break mechanism — SECTION-DERIVED, not HR-marker

**Phase 02 will refactor the pagination plugin to consume `<section>` boundaries directly from docx-preview output**, NOT continue using the HR-marker convention from Phase 01 (commit `e2f22c45c`).

- `convertDocxToTipTapContent()` walks docx-preview output, extracts `<section>` boundaries as an ordered array of doc positions, stores in plugin state via a meta-set transaction
- Pagination plugin's `computePagination()` reads these source-derived breaks INSTEAD OF / ALONGSIDE the measured-height greedy algorithm — when source breaks exist, use them; for sections without explicit page breaks (rare in legal contracts), fall back to measured-height for those regions
- HR-marker code from Phase 01 (`block.tagName === "HR"` detection in `paginationPlugin.ts`) is REMOVED. The translation layer doesn't emit HR markers; the page-boundary side channel replaces them.
- Decoration emission (`data-page-num`, `data-page-start`, `data-page-end` attrs on blocks) unchanged from Phase 01; per-page CSS chrome unchanged.

Rationale: eliminates a translation-layer indirection. docx-preview already gives us authoritative page boundaries; round-tripping through synthetic `<hr>` markers is unnecessary friction. Architectural cleanup that pays back as we add more import-pipeline features (TextStyle, headers/footers).

### Header / footer rendering — PLUGIN DECORATIONS

**Headers and footers render as `Decoration.widget` instances anchored to page-boundary positions.** No new TipTap node types; no React overlay layer above the editor.

- `convertDocxToTipTapContent()` extracts each `<section>`'s `<header>` and `<footer>` HTML (and corresponding page index) into plugin state. Side channel keyed by page number.
- Pagination plugin's `props.decorations(state)` emits `Decoration.widget(pageStartPosition, () => headerDOM, { side: -1 })` for each page's header and `Decoration.widget(pageEndPosition, () => footerDOM, { side: 1 })` for each page's footer.
- Widget DOM is built by a small `buildHeaderWidget(html)` / `buildFooterWidget(html)` helper that parses the HTML and constructs a `<div class="ct-page-header">` / `<div class="ct-page-footer">` with appropriate styling.
- CSS positions the widgets in the 1in top/bottom margins of their respective pages (using existing per-block padding-top/bottom on `[data-page-start]` / `[data-page-end]` blocks).

Trade-off accepted: decorations occasionally flicker during transaction reflow. Acceptable for a feature most users observe once per doc load.

### When source has NO header/footer — EMPTY MARGINS

**Strict source fidelity.** If docx-preview reports no `<header>` or `<footer>` for a page, the editor shows blank top/bottom margin space for that page. No auto "Page N of M" fallback.

- Phase 01's auto "Page N of M" footer (CSS `::after` on `[data-page-end="true"]`) is REMOVED in Phase 02.
- Reasoning: review tool philosophy — show what the source author chose to show. Auto fallback creates visual difference between contracts that have footers and those that don't; a reviewer toggling between docs sees inconsistent chrome.
- If users need page numbering across docs that lack source footers, that's a separate "always-on page navigation" UX feature (toolbar / scroll indicator) — not faking source footer content.

**Open for planner:** when the page-margin areas are empty and the user scrolls, the visual feedback for "I'm now on page 5" comes from where? Likely the existing PresenceBar's "Saved · just now" header area gains a "Page 5 of 27" indicator. Planner can decide; not blocking.

### Build cadence — FULL GSD CEREMONY

User picked full discuss → plan → execute sequence for Phase 02.

- This CONTEXT.md is the discuss output.
- Next: `/gsd-plan-phase` to produce `03-PLAN.md` with day-by-day task breakdown across REQ-R-01 through REQ-R-07. Plan should have explicit dependency graph (R-01 corpus → R-02 translation layer → R-03 TextStyle → R-04 headers/footers → R-05 style theming) since later REQs depend on the translation layer existing.
- Then: `/gsd-execute-phase` to ship task-by-task with atomic commits per REQ.
- Branch: cut `docx-preview-rewrite` from `gdocs-editor` HEAD (commit `60c151c49` after the SPEC and CONTEXT land) before any Phase 02 code commits. Phase 01 work stays evaluable on `gdocs-editor` indefinitely.

## Carrying Forward from Phase 01

What stays unchanged:

| Asset | Why preserved |
|---|---|
| Yjs `useCollabProvider` WebSocket layer | CRDT sync untouched (locked constraint) |
| `CommentMark`, `InsertionMark`, `DeletionMark` | Collab marks unchanged (REQ-R-06) |
| `useAiRedlineSuggestions`, `useCollabVersions`, `useFileVersionsApi`, `useFileComments`, `useContractMentionables` | AI/versions/comments hooks unchanged |
| Per-page CSS chrome (`[data-page-num]`, `[data-page-start]`, `[data-page-end]` rules) | Page sheet rendering works; only the source of break positions changes |
| `classifyTransaction()` utility (Phase 01 T5-A) | Still useful for the pagination plugin's recompute scheduling decisions |
| Re-sync from source dev button (Phase 01 commit `384f40ef7`) | Still essential for exercising import-pipeline changes against cached Yjs rooms |
| TipTap extensions: TextAlign, Image, Table family | All still registered; TextStyle + FontFamily + FontSize ADDED per REQ-R-03 |

What gets REMOVED in Phase 02 (corpus-specific Phase 01 patches that docx-preview obsoletes):

| Removed asset | Reason |
|---|---|
| `transformParagraph()` alignment-gate logic in `convertDocxToHtml` | docx-preview preserves text-align natively |
| `HEADING_STYLE_IDS` set | docx-preview preserves Word style names; REQ-R-05's `data-docx-style` attribute supersedes hard-coded heading mappings |
| Custom `Article` / `Article_L2` / `Schedule_L1` / `Schedule_L2` styleMap entries | Ditto |
| Page-break-marker styleMap (`Page Break Marker` → `<hr>`) | Section-derived breaks replace this |
| List flatten via DOMParser | docx-preview produces proper nested lists; pagination consumes section boundaries (lists no longer need to be paginable units) |
| Leading `<br>` preservation CSS rule | docx-preview output doesn't include the structural artifact `<br>` mammoth was inserting |
| Dynamic per-page padding plugin (commit `9a3db6794`) | Section-derived breaks land at SOURCE page boundaries (Word already decided each page's content); per-page padding-to-target becomes unnecessary because pages render at their source-defined dimensions (612pt × 792pt) |
| `mammoth.transforms.paragraph(transformParagraph)` | Whole function removed; `convertDocxToHtml` deleted |
| `flattenLists` / `flattenOneList` helpers | Same |
| `convertDocxToHtml` itself | Replaced by `convertDocxToTipTapContent` |

## Canonical Refs

| Ref | Purpose |
|---|---|
| `.planning/quick/260603-docx-preview-rewrite/01-SPEC.md` | Locked REQs — MUST read before planning |
| `.planning/quick/260603-gdocs-editor/spike/FINDINGS.md` | Spike evidence for docx-preview viability |
| `.planning/quick/260603-gdocs-editor/spike/docx-preview-spike.mjs` | Runnable verification script |
| [src/lib/fileUtils.tsx](src/lib/fileUtils.tsx) | Current `convertDocxToHtml` — being deleted |
| [src/pages/CollaborationToolPage/collab/pagination/paginationPlugin.ts](src/pages/CollaborationToolPage/collab/pagination/paginationPlugin.ts) | HR detection + decoration emission code — pagination plugin (refactor target) |
| [src/pages/CollaborationToolPage/collab/useTipTapEditor.ts](src/pages/CollaborationToolPage/collab/useTipTapEditor.ts) | Extension registration — adds TextStyle + FontFamily + FontSize |
| [src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx](src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx) | Editor panel — `setContent` call site (change to consume `convertDocxToTipTapContent` output) |
| [src/pages/CollaborationToolPage/collaboration.css](src/pages/CollaborationToolPage/collaboration.css) | Per-page CSS chrome — `::after` "Page N of M" rule REMOVED; new header/footer widget styles ADDED |
| TipTap extension-text-style docs | https://tiptap.dev/docs/editor/extensions/marks/text-style |
| docx-preview README | https://github.com/VolodymyrBaydalka/docxjs |
| ProseMirror Decoration widget | https://prosemirror.net/docs/ref/#view.Decoration%5Ewidget |

## Deferred Ideas

- **DOCX export** (TipTap content → .docx) — separate Phase 03
- **Source-doc comments + track changes rendering** — docx-preview supports as experimental; defer
- **Page navigation toolbar / scroll indicator** — UX improvement once empty-margin policy lands
- **Server-side conversion fallback** for docs docx-preview struggles with — kept as backup option in [spike/FINDINGS.md](../260603-gdocs-editor/spike/FINDINGS.md) #4
- **VML / EMF graphics improvements** — Phase 02 inherits docx-preview's current support level

## Constraints Repeated (from SPEC for planner convenience)

- Yjs CRDT sync preserved unchanged
- Phase 01 collab features (marks/AI/versions/presence/save-status) unchanged
- Every commit on `docx-preview-rewrite` branch passes `pnpm typecheck` AND `pnpm test`
- Atomic commits per REQ; no "miscellaneous improvements" commits
- Single new dependency: `docx-preview@0.3.7` (already installed via spike commit `82ab8c7af`)
- Branch cut from `gdocs-editor` HEAD before any Phase 02 code commits

## Next

`/gsd-plan-phase` against this CONTEXT + the SPEC. Expected output: `03-PLAN.md` with day-by-day task breakdown for the ~6-8 week build, organized by REQ with explicit dependencies (R-01 corpus → R-02 translation layer → R-03/R-04/R-05 parallelizable extensions → R-06 collab regression test pass → R-07 perf measurement).
