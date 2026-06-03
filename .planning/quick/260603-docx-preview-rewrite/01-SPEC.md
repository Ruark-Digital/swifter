---
phase: 02-docx-preview-rewrite
created: 2026-06-03
supersedes_scope_of: .planning/quick/260603-gdocs-editor/01-SPEC.md (continues from Phase 01)
spike: .planning/quick/260603-gdocs-editor/spike/FINDINGS.md
predecessor_branch: gdocs-editor (23 commits ahead of phase2-bug-local-fixes)
---

# SPEC — Replace mammoth with docx-preview-based DOCX rendering pipeline

## Goal

Replace the current mammoth-based DOCX import path in the TipTap editor with a docx-preview-based pipeline that produces **structurally faithful** TipTap content from any Word document — not just the Hyperscale corpus. After this phase, adding a new contract should not require new mammoth patches; the rendering quality should match Google Docs / Word out-of-the-box across reasonably-formatted legal documents.

## Why

Phase 01-gdocs-editor shipped 23 commits to make Hyperscale render acceptably in TipTap. Every fix is corpus-specific: mammoth alignment-gate, list flatten via DOMParser, custom heading-style mappings (`Article` / `Article_L2`), inline page-break detection via transformDocument (since `br[type='page']` styleMap doesn't intercept inline runs), leading-`<br>` preservation rules, dynamic per-page padding to fake uniform heights, etc.

User feedback (verbatim 260603):
> *"We are far behind on how the content of the document is rendered compare to how its rendered on the Google docs. I can't be sending screenshots all the time trying to perform minute changes just for it to match and when it does, what about other documents, so we need to find a better way to pick the document layout properly."*

This SPEC addresses that strategic concern. mammoth is a deliberately-minimalist DOCX→Markdown-ish converter; we've been fighting its design choice. docx-preview (Apache 2.0, verified in [spike/FINDINGS.md](../260603-gdocs-editor/spike/FINDINGS.md)) is purpose-built for high-fidelity DOCX rendering and produces structurally-rich output that already handles every corpus-specific patch we added.

## Falsifiable Requirements

Verified against the Hyperscale supply agreement PLUS at least one additional contract (sourced during Phase R-01) so the implementation is corpus-generalized.

### REQ-R-01: Reference doc corpus expansion

**Now:** Single reference doc (Hyperscale) under `.qa/reference-docs/`.

**Target:** At minimum 3 reference docs covering different layout patterns: (a) Hyperscale (multi-page legal contract with TOC, schedules, tables), (b) a short NDA / 1-3 page agreement (proves no-page-break case), (c) a contract with a complex table OR embedded image (proves table/image fidelity).

**Accept:**
- [ ] `.qa/reference-docs/` contains ≥3 `.docx` files
- [ ] Each file has a paired `.expected.md` enumerating visual features
- [ ] All 3 files render successfully through the new pipeline without console errors

### REQ-R-02: Translation layer (docx-preview → TipTap-compatible HTML)

**Now:** mammoth direct → TipTap setContent.

**Target:** A new `convertDocxToTipTapContent(arrayBuffer)` function in `src/lib/fileUtils.tsx` that:
1. Runs the DOCX through `docx-preview`'s `renderAsync` into an off-screen container
2. Walks the resulting HTML, translating it to TipTap-compatible content:
   - `<section>` → emit `<hr class="docx-page-break">` between sections (already wired into pagination plugin from Phase 01)
   - `<header>` / `<footer>` → extract to side-channel for decoration overlay (REQ-R-04); strip from main content
   - `<article>` → unwrap (decorative)
   - `<p style="text-align: ...">` → preserve as-is (TextAlign extension handles)
   - `<span style="font-family/font-size">` → wrap in TextStyle mark (REQ-R-03)
   - `<p class="docx_*">` → translate Word style class to data attribute the editor's CSS uses for per-style theming
3. Returns clean HTML ready for `editor.commands.setContent()`

**Accept:**
- [ ] `convertDocxToTipTapContent` exists and replaces `convertDocxToHtml` in the import path
- [ ] Hyperscale renders without ANY of the 11+ corpus-specific patches the mammoth pipeline needed (`transformParagraph`, custom `HEADING_STYLE_IDS`, list flatten, page-break detection, etc. all removed)
- [ ] Visual fidelity on Hyperscale matches or exceeds the current Phase 01 result
- [ ] All 3 reference docs render correctly

### REQ-R-03: TipTap TextStyle extension for inline font preservation

**Now:** TipTap strips inline `font-family` / `font-size` on `<span>` elements.

**Target:** Register `@tiptap/extension-text-style` and `@tiptap/extension-font-family` / `@tiptap/extension-font-size`. Translation layer (REQ-R-02) sets these marks on text runs that carry font specs in docx-preview's output.

**Accept:**
- [ ] Both extensions installed and registered
- [ ] Title block "Hyperscale Data Center..." renders in Times New Roman 16pt (per docx-preview's preserved style)
- [ ] Body text renders in source-doc's body font
- [ ] Round-trip: type new text, type carries the editor's default font (verifies extensions don't break authoring)

### REQ-R-04: Headers / footers as overlay decorations

**Now:** No header/footer support (mammoth doesn't expose them).

**Target:** docx-preview exposes Word's `<header>` and `<footer>` elements. Translation layer extracts these to plugin state. New TipTap extension renders them as fixed overlays in the top and bottom 1in margin of each page. Use the existing pagination plugin's page-boundary detection.

**Accept:**
- [ ] Page headers render at top of each page in the editor view
- [ ] Page footers render at bottom of each page
- [ ] Word's auto page-number field (`{ PAGE }`) renders as the actual page number (1, 2, 3…)
- [ ] The current auto "Page N of M" footer from Phase 01 is REMOVED — replaced by source-doc footers OR the auto footer only when source has no footers

### REQ-R-05: Word-style CSS theming via data attributes

**Now:** mammoth doesn't preserve Word styles; we have custom heading-style mappings hard-coded for Hyperscale's `Article`/`Article_L2` styles.

**Target:** Each paragraph carries a `data-docx-style="<style-name>"` attribute. CSS rules in `collaboration.css` define visual styling per Word style:
- `[data-docx-style="Heading 1"]` → font-size: 16pt; font-weight: bold; etc.
- `[data-docx-style="BodyText"]` → font-size: 11pt; etc.
- `[data-docx-style="Article"]` → ... etc

Style name set is data-driven from each loaded doc's `styles.xml` (docx-preview exposes it). For unknown styles, a sensible default cascade applies.

**Accept:**
- [ ] At least 80% of paragraphs in the Hyperscale doc carry a `data-docx-style` matching their source Word style
- [ ] CSS rules for the 10 most common Word styles (Heading 1-3, Normal, Body Text, Title, Subtitle, etc.) produce visually-distinct rendering
- [ ] Adding a new doc with unfamiliar styles doesn't crash; falls back to default cascade

### REQ-R-06: Phase 01 collab integration preserved

**Now:** Yjs sync, CommentMark, InsertionMark, DeletionMark, AI redline suggestions, version history, presence bar, save-status indicator all work in Phase 01.

**Target:** All of the above continue to work after the rewrite. No regression in the collab features.

**Accept:**
- [ ] `pnpm test` passes for collab-related tests (CommentMark, classifyTransaction, EditorPanelImport)
- [ ] Yjs sync works in two-window concurrent edit test
- [ ] Adding a comment / insertion mark / deletion mark in the new editor functions identically to Phase 01
- [ ] AI suggestion panel opens and emits suggestions
- [ ] Version history records snapshots
- [ ] No console errors during a full doc load + 30-second edit session

### REQ-R-07: Performance acceptable

**Now:** mammoth converts Hyperscale in ~200ms; setContent loads it in ~500ms.

**Target:** docx-preview + translation layer should be within 3× mammoth's time for the same doc. Acceptable if absolute time stays under 2 seconds for the Hyperscale corpus.

**Accept:**
- [ ] Hyperscale loads from URL fetch to fully rendered editor in < 5 seconds on a typical dev machine
- [ ] Initial Yjs sync payload after import is documented (may be larger than mammoth's; that's fine if < 1MB)
- [ ] No editor-blocking work during a typical 30-second edit session (typing remains <16ms per keystroke)

## Boundaries

### In Scope

- Replacement of `convertDocxToHtml` import path with docx-preview-based pipeline
- Custom TipTap extensions needed to preserve docx-preview's output fidelity (TextStyle, header/footer decoration, Word-style data attributes)
- Reference corpus expansion to 3+ docs
- Pagination plugin update to use `<section>`-derived breaks instead of measured-height greedy (the current dynamic-padding approach stays as fallback for sections that don't have explicit Word page boundaries)
- Removal of dead code: all corpus-specific patches from Phase 01 that the new pipeline obsoletes (transformParagraph gates, custom heading styleMap entries, list flatten, leading-br rules, dynamic padding plugin, etc.) — keep what still adds value (page break decoration, footer pseudo-element)
- New `convertDocxToTipTapContent` exposed as the active import path
- Documentation in `.planning/quick/260603-docx-preview-rewrite/` covering the new architecture

### Out of Scope (Explicit)

- **DOCX export pipeline** (TipTap content → .docx). Deferred to a Phase 03. Most users in the review workflow consume contracts; export-back-to-Word is a secondary need.
- **Yoopta editor panel** — unchanged. Only the `?editor=tiptap` path is rewritten.
- **Authoring fidelity** — creating new docs from blank canvas with Word-quality typography. The editor must let users type/edit imported docs cleanly; whether their authored output looks like Word-from-scratch is a separate concern.
- **PDF / `.doc` (legacy) import fidelity** — only `.docx` is held to the new bar.
- **Mobile / tablet UI** — desktop browsers only.
- **Track changes / source-doc comments** — docx-preview supports these as experimental options; deferred to a future phase. The editor's own CommentMark and InsertionMark/DeletionMark continue to work for live collaborative redlining.
- **Server-side conversion alternatives** (LibreOffice, Pandoc, SaaS) — considered in [spike/FINDINGS.md](../260603-gdocs-editor/spike/FINDINGS.md); not pursued in this phase. Could be added later as a fallback for docs docx-preview can't handle, OR as a higher-fidelity primary path with this phase's translation layer.
- **Migration of existing Yjs rooms** — rooms populated under Phase 01's mammoth output will continue to display that old content until a Re-sync from source is performed. No automatic migration.

## Constraints

- **Yjs CRDT sync preserved unchanged.** All edits sync through the existing `useCollabProvider` WebSocket layer. No changes to the Yjs schema or sync protocol.
- **All Phase 01 collab features preserved** — CommentMark, InsertionMark, DeletionMark, AI suggestions, version history, presence bar, save-status indicator continue to function.
- **No regression in Phase 01's typecheck-clean state.** Every commit on this phase must pass `pnpm typecheck` and `pnpm test`.
- **Branch:** new branch `docx-preview-rewrite` cut from `gdocs-editor` HEAD so Phase 01 work is preserved and this phase can be evaluated independently.
- **Atomic commits with falsifiable scope** — each commit either implements one REQ or fixes one regression; no "miscellaneous improvements" commits.
- **Single dependency added:** `docx-preview` (already installed via spike commit `82ab8c7af`). No additional editor framework adoption (no SuperDoc migration, no OnlyOffice).

## Acceptance Criteria (Phase Done When)

- [ ] All 7 REQs above pass against 3 reference docs
- [ ] All Phase 01 corpus-specific patches removed (or explicitly justified for retention)
- [ ] Yjs sync, redline marks, comments, AI suggestions, version history, presence bar all work at final commit
- [ ] `pnpm typecheck` + `pnpm test` exit 0
- [ ] User has verified visual fidelity against Hyperscale + at least one other doc
- [ ] DECISION.md written documenting: what worked, what didn't, what's deferred to Phase 03 export

## Next

`/gsd-discuss-phase` to lock implementation details (TextStyle extension version, header/footer overlay approach, performance benchmarking method) → `/gsd-plan-phase` to produce day-by-day task breakdown for the ~6-8 week build → `/gsd-execute-phase` to implement.
