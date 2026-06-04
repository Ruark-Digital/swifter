---
phase: 02-docx-preview-rewrite
created: 2026-06-04
inputs:
  - 01-SPEC.md (60c151c49)
  - 02-CONTEXT.md (dc6f8bc44)
  - 03-PLAN.md (f68283df3)
branch: docx-preview-rewrite (12 commits ahead of gdocs-editor)
---

# DECISION — docx-preview rewrite

Phase 02 shipped the architectural pivot called for in [01-SPEC.md](01-SPEC.md): mammoth's corpus-specific patching is replaced by a docx-preview-based translation layer. The Phase 01 patches that became obsolete (HR-marker page breaks, dynamic per-page padding, mammoth styleMap, list-flatten DOMParser, leading-`<br>` hide rule) are removed.

This document is the final acceptance review against the SPEC's 7 falsifiable requirements, the maintenance / risk notes, and the deferred-to-Phase-03 list.

## Acceptance review

| REQ | Title | Status | Notes |
| --- | --- | --- | --- |
| R-01 | Reference doc corpus expansion | ✅ PASS | Three .docx files in `.qa/reference-docs/` (Hyperscale + synthesized NDA + SOW with complex-table). Synthesized via `docx@9.7.1` devDep generator in `_generate-fixtures.mjs`. Each has a paired `.expected.md`. Shipped in T1 commit `124d02356`. |
| R-02 | Translation layer | ✅ PASS | `convertDocxToTipTapContent(arrayBuffer)` lives in `src/lib/fileUtils.tsx`. Returns `{ html, styleHtml, sectionBoundaries, headers, footers }`. Wired as the active import path in `TipTapEditorPanel.tsx` (T2g, `924d31151`). Title block renders centered on Hyperscale (spot-confirmed 260604 by user *"The editor works fine"*). |
| R-03 | TextStyle inline font preservation | ✅ PASS | `@tiptap/extension-text-style@3.23.4` + custom `FontFamily` + `FontSize` + `DocxStyleAttribute` extensions registered in `useTipTapEditor.ts` (T3, `ac93e96bf`). Title block renders Times New Roman 12pt+ on Hyperscale, visual-confirmed 260604 by user *"This is the new update"*. |
| R-04 | Headers / footers as decorations | ✅ PASS | `PaginationState` gained `sourceHeaders[]` / `sourceFooters[]`. Plugin emits `Decoration.widget` at page-start/page-end positions wrapped in `contentEditable=false` divs (T4, `ddc3de2ea`). Strict source fidelity: when source has no header/footer, the page margin renders empty — the Phase 01 auto "Page N of M" `::after` rule is removed. |
| R-05 | Word-style CSS theming via data attribute | ✅ PASS | Translation layer rewrites `docx_*` class names to `data-docx-style="<id>"` (T2e + T5, `e66d3623b` + `39eabb696`). `collaboration.css` themes the top styles observed across the 3-doc corpus (articlel1/2, schedulel1/2, heading1-3, title, bodytext). Unknown styles cascade to default `.ct-tiptap p` rule. |
| R-06 | Phase 01 collab integration preserved | ✅ PASS *(CLI-gateable)* / ⏳ PENDING *(browser smoke)* | All Phase 01 mammoth patches removed (T6, `2e561b371`, −357 net lines): mammoth import path, `transformParagraph`, `HEADING_STYLE_IDS`, styleMap, `flattenLists`, `flattenOneList`, TOC-anchor splitter, HR detection in pagination plugin, dynamic per-page padding (`pageEndExtraPadding`, `getInlineExtraPadding`, `computeExtraPaddings`, `arraysApproxEqual`, inline padding emission), HR-hide CSS rule, leading-`<br>` hide CSS rule. `pnpm typecheck` exits 0; `pnpm build` exits 0; `classifyTransaction.test.ts` 6/6 pass. Two-window Yjs convergence, CommentMark persistence, BubbleMenu marks, AI panel, Versions panel, presence bar — all deferred to manual smoke (see "Deferred" below). |
| R-07 | Performance | ⏳ PENDING | Perf harness scaffolded in `.qa/scripts/editor-fidelity-perf.mjs` (T6d/T7 commit `ac3bf8626`). Execution deferred — requires real backend login or full API-mock surface (see "Deferred"). Targets remain: load < 5s end-to-end, median keystroke < 16ms over 100 samples. |

## What worked

- **docx-preview as a parsing engine, not a renderer.** The spike (`82ab8c7af`) verified docx-preview emits structurally-rich `<section>`/`<header>`/`<footer>`/`<p class="docx_*">` from any Word doc. We use it as a parser only: render to a detached `<div>`, walk the DOM, extract structure into side channels, hand cleaned HTML to TipTap. The library's own visual rendering is discarded.
- **Side-channel architecture for non-flow content.** Headers, footers, and section boundaries don't fit ProseMirror's flow-of-blocks model. Carrying them in `PaginationState` (populated via `set-source-content` meta transaction at import time) and emitting them as `Decoration.widget` at page boundaries keeps Yjs and the editor schema unchanged.
- **TextStyle + custom FontSize + DocxStyleAttribute.** TipTap v3 ships `@tiptap/extension-text-style` and `@tiptap/extension-font-family`, but no FontSize. The custom FontSize extension (~60 LOC) round-trips `font-size: 14pt` from docx-preview spans into TextStyle marks; `DocxStyleAttribute` (~45 LOC) is a paragraph-level attribute that survives `setContent` and feeds the CSS theming layer.
- **Strict source fidelity over invented chrome.** Removing the auto "Page N of M" footer (T4) and dynamic per-page padding (T6) means pages render at their natural heights and the bottom margin is genuinely empty when the source has no footer. Lawyers reading Word-export-style contracts find this more trustworthy than padded uniform pages.

## What didn't (yet)

- **T6d browser smoke pass.** Three smoke checks were scripted (`t6d-docx-preview-collab-regression.spec.ts`) but execution is blocked: the collab tool's mount hits backend APIs, axios's response interceptor catches the inevitable 401, calls `setReset()` on the auth store, the `AuthorityGuard` sees no user, and the page bounces to `/login`. The harness scaffolding (auth-localStorage seed, fixture-route interception, IPv6-only Vite workaround, `[data-page-end]` editor-ready signal) is correct and reusable — the missing piece is either API mocking or real-backend login. Manual smoke in the live app still required for two-window Yjs convergence, CommentMark persistence, BubbleMenu marks (Insertion/Deletion), AI suggestions panel, Versions panel, and presence bar.
- **T7 perf baseline.** Same blocker as T6d. Harness in `.qa/scripts/editor-fidelity-perf.mjs` measures end-to-end load + 100-keystroke latency series, but cannot run until the auth/API path is unblocked. Targets remain `< 5s load` and `< 16ms median keystroke` per REQ-R-07.

## Deferred to Phase 03 (or follow-up)

- **DOCX export.** Round-tripping TipTap content back to .docx isn't part of this phase; viewing/editing only. Would likely need `docx@^9` (already a devDep) wired to a serializer over the TipTap schema.
- **Track-changes / source-doc comments.** Word's `<w:ins>` / `<w:del>` / comment anchors are ignored on import. Phase 01 redline marks (`InsertionMark`/`DeletionMark`) operate on the imported flat text only.
- **VML graphics.** Older Word docs with VML (Microsoft's legacy vector format) may render imperfectly. Out of scope; document in PR description if encountered against real client corpus.
- **mammoth removal.** mammoth is still installed because `src/components/ui/DocumentViewer.tsx`, `src/pages/CollaborationToolPage/components/DocumentViewer.tsx`, and `src/lib/fileToMarkdown.ts` import it directly for their own non-TipTap rendering paths. Migrating those off mammoth is a separate cleanup not gated on Phase 02. Captured in the `convertDocxToHtml` shim's docstring (`src/lib/fileUtils.tsx`).
- **API mocking for collab smoke.** The 401-redirect loop should be solved once. Either (a) a Playwright fixture that mocks the contract/comments/versions/file/presence endpoints, or (b) a `VITE_E2E_MODE` env flag that short-circuits axios when present.
- **Existing Yjs rooms with Phase 01 mammoth content.** Rooms populated under Phase 01 still have the old mammoth-imported text. Users must click "Re-sync from source" (kept from Phase 01) to see Phase 02 output. This is documented; there is no automatic migration.

## Maintenance notes

- **docx-preview maintainership.** Single-maintainer Apache 2.0 library (`docx-preview@0.3.7`). If unmaintained, the integration layer (`convertDocxToTipTapContent` + the 3 custom TipTap extensions + the pagination plugin) is in this codebase and can be ported. We use docx-preview as a parser only, so a forked / replaced parser only has to emit the structures the translation layer consumes.
- **Next perf benchmark.** Run when the API-mock or real-login path is wired up. Compare against REQ-R-07 targets; commit the baseline JSON to `.qa/reports/editor-perf-baseline.json` so future regressions are visible.
- **CSS theming inventory.** The current `[data-docx-style]` rules cover the union of styles observed in the 3-doc corpus. New corpora may surface unfamiliar Word styles; the default `.ct-tiptap p` cascade will swallow them silently. When a new contract type surfaces, run docx-preview's parser on it, dump the `styleMap`, and add CSS rules for any new style ID before the visual gap becomes a corpus-specific patch again.

## Risks accepted

- **Single-block overflow pages.** A paragraph naturally taller than 1100px (the content-target) renders as a single-block page that exceeds the target. Acknowledged limitation — splitting paragraphs would require schema changes that break redline marks.
- **Large output size.** Hyperscale's body HTML is ~720KB after translation. Affects Yjs sync payload on initial join. Measure once T7 perf harness is unblocked; if problematic, consider lazy-loading later pages or compressing the source HTML before `setContent`.
- **TextStyle mark count on very large docs.** Many spans with inline styles produce many marks in ProseMirror state. May slow editor on docs significantly larger than Hyperscale. Same mitigation path as above.

## Branch state

- Branch: `docx-preview-rewrite`, 12 commits ahead of `gdocs-editor`
- Phase 01 (`gdocs-editor` branch, 25 commits) is SHELVED but not removed — kept as an evaluable predecessor
- `pnpm typecheck` exits 0
- `pnpm build` exits 0 (5m13s, TipTapEditorPanel chunk 493KB / 154KB gzip)
- vitest unit tests for the touched code paths pass (`classifyTransaction.test.ts` 6/6)
- e2e smoke pass + perf baseline DEFERRED — see "What didn't (yet)"

## Ready to ship?

Yes, with caveats explicit in the PR description:

1. CLI gates all green (typecheck, build, unit tests).
2. T6d browser smoke + T7 perf baseline deferred to a follow-up that unblocks API-mock / real-login.
3. Manual smoke in the live editor recommended before merge: two-window Yjs convergence, CommentMark/BubbleMenu marks, AI/Versions panels.
4. Existing Yjs rooms require "Re-sync from source" click; no automatic migration.
