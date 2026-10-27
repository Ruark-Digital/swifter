---
phase: 01-gdocs-editor
created: 2026-06-03
supersedes: ac44bfde9 (scrapped eval-spike SPEC)
---

# SPEC — Google-Docs-style rendering for the TipTap document editor

## Goal

When a lawyer opens an imported `.docx` contract in the CollaborationToolPage TipTap editor (`?editor=tiptap`), it must look the same as opening that same file in Google Docs or Microsoft Word — fonts, alignment, images, TOC, multi-page sheets, tables, lists, headings.

Build it. Don't research it. Editor engine is **TipTap** (decision locked — existing Yjs/marks/AI/versions wiring stays intact).

## Why

Current state: TipTap renders the Hyperscale supply agreement as a flat sans-serif Geist block — title left-aligned, TOC entries collapsed, images sometimes missing, no page boundaries. A lawyer cross-referencing "clause 7.3 page 19" against the Word source can't trust what they're seeing in the editor.

This session prototyped most of the fix (alignment recovery, Times-12pt, base64 images, TOC double-anchor flex layout) but the patches are uncommitted, incomplete (tables, lists, headings, true multi-page sheets), and one of them regressed (page-break gutter). The user explicitly rejected continued patch-on-patch and wants a coherent build.

## What's already prototyped this session (working-tree, uncommitted)

These land as the **starting baseline** of the build phase — committed as task 1, then extended:

- `@tiptap/extension-text-align` + 4 BubbleMenu buttons (authoring + sync)
- `@tiptap/extension-image` with `allowBase64: true` (DOCX images survive setContent)
- mammoth `transformDocument` + styleMap + post-regex injecting `style="text-align: ..."` (preserves Word paragraph alignment)
- Times-12pt serif typography on `.ct-tiptap`
- `.ct-tiptap-page` wrapper — 8.5in white sheet, 1in margins, drop shadow, flat grey backdrop
- TOC double-anchor splice with `__page` synthetic href + `:has()` flex layout w/ dot leaders

## Falsifiable Requirements

Each requirement is verified by opening the **Hyperscale supply agreement** side-by-side in Word and the editor. The named visual feature must match. If a feature requires a *second* reference doc (e.g. a complex table), that doc is added to `.qa/reference-docs/` as part of the relevant task.

### REQ-01: Body typography matches Word
**Now:** Times-12pt baseline shipped in working tree, line-height 1.15.
**Target:** Body text renders in Times New Roman 12pt at line-height 1.15 with 8pt paragraph spacing (Word defaults). Headings h1=16pt, h2=14pt, h3=12pt bold.
**Accept:** Visual diff against Word at 100% zoom — paragraphs occupy the same vertical run length ± 1 line over a 30-paragraph sample.

### REQ-02: Paragraph alignment preserved from source
**Now:** Mammoth transformDocument + styleMap pipeline shipped in working tree.
**Target:** Centered, right-aligned, and justified paragraphs in the source render identically in the editor.
**Accept:** "TABLE OF CONTENTS" and the title block render centered; any source-justified body paragraphs render justified.

### REQ-03: Inline images render at source scale
**Now:** `@tiptap/extension-image` + `allowBase64` shipped; CSS caps `max-width: 100%`.
**Target:** Images embedded in the DOCX render at source resolution scaled to fit page width, centered with 8pt vertical margin.
**Accept:** A test image embedded in a reference doc renders without distortion or being stripped.

### REQ-04: TOC entries render as 2-column rows with leader dots
**Now:** Double-anchor + `:has()` flex layout shipped in working tree.
**Target:** Each TOC entry shows title left-aligned, page number right-aligned, dotted leader between them — matching the source.
**Accept:** All ~70 TOC entries in the Hyperscale agreement render in 2-column layout with dot leaders. Clicking either anchor scrolls to the target section.

### REQ-05: Multi-page sheet rendering with visible page boundaries
**Now:** Single continuous `.ct-tiptap-page` sheet. No page boundaries.
**Target:** Document renders as discrete page-shaped sheets in a vertical stack with grey gutter between them. Each sheet shows "Page N of M" in a footer. Page breaks land at the same content positions as Word's pagination of the same doc.
**Implementation note:** Custom ProseMirror `Page` node + a pagination plugin that measures rendered content height post-transaction and emits/withdraws Page nodes to keep each page within target height. Yjs sync runs at the inner block level (paragraphs/headings/tables), NOT at the Page node level, so pagination is computed deterministically per-client from the underlying content tree — concurrent edits converge on the inner content and pagination re-runs locally.
**Accept:** Hyperscale agreement renders as ~30 page sheets. Page numbers visible. Cross-page selection works for redlining. Two clients editing the same doc concurrently end up showing the same page count after Yjs converges.

### REQ-06: Tables render with cell borders, column widths, alignment from source
**Now:** No table extension registered. Tables in source DOCX render as plain text runs.
**Target:** Tables render with visible cell borders, source column widths preserved (relative), and per-cell alignment from source.
**Implementation note:** Register `@tiptap/extension-table` + Row/Cell/Header extensions. Mammoth already emits `<table><tr><td>` HTML — TipTap parses it once the extension is registered.
**Accept:** A reference doc with a payment-schedule table renders as a bordered table with the same column count and row count as the source. Cell content alignment (left/center/right) matches source.

### REQ-07: Numbered lists nested ≥3 levels with correct markers
**Now:** StarterKit `OrderedList` registered. Nested numbering not verified.
**Target:** Three-level nested ordered lists (1, 1.1, 1.1.1 style or 1/a/i style) render with the source's marker style at each level.
**Accept:** Section "1. DEFINITIONS AND INTERPRETATION" → "1.1 Definitions" → letter sub-items in the Hyperscale agreement renders as a 3-level numbered list (or visually equivalent) with the same numbering scheme as the source.

### REQ-08: Headings preserve source hierarchy
**Now:** Mammoth maps Word `Heading 1`-`Heading 6` styles to `<h1>`-`<h6>`; CSS styles them. Some headings collide with the alignment override (see SPEC ambiguity).
**Target:** Section titles ("1. DEFINITIONS AND INTERPRETATION", "1.1 Definitions") render with the correct heading level and typography — bold, sized per REQ-01, with section numbering preserved either inline or via list-style.
**Accept:** Headings are visually distinct from body text and the hierarchy (h1 > h2 > h3) reads as the same outline as Word's outline view.

### REQ-09: Page chrome matches Google Docs visual style
**Now:** `.ct-tiptap-page` wrapper shipped — white 8.5in sheet, 1in margins, drop shadow, `#f1f3f4` backdrop.
**Target:** Same as now — locks the visual style. Multi-page (REQ-05) stacks multiple of these sheets.
**Accept:** Editor canvas shows white sheets on grey backdrop, 8.5×11 ratio, ~24pt gap between stacked sheets in REQ-05.

## Boundaries

### In scope
- TipTap editor rendering layer (`src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx`, `collab/useTipTapEditor.ts`)
- mammoth import pipeline (`src/lib/fileUtils.tsx` — `convertDocxToHtml`)
- CSS / typography in `src/pages/CollaborationToolPage/collaboration.css`
- New ProseMirror `Page` node + pagination plugin (REQ-05)
- New TipTap table extension wiring (REQ-06)
- A small reference corpus under `.qa/reference-docs/` — at minimum the Hyperscale supply agreement, plus a complex-table example for REQ-06 if Hyperscale lacks one

### Out of scope (explicit)
- **Yoopta editor panel** — default panel (`EditorPanel.tsx`) untouched. Only the TipTap path.
- **Authoring fidelity** — creating new docs from blank canvas with Word-quality typography. Editing imported docs is in; designing from scratch is out.
- **Print / PDF export fidelity** — exporting a PDF that re-imports cleanly to Word.
- **PDF and `.doc` import fidelity** — only `.docx` is held to the new bar; PDFs and `.doc` render at whatever quality the current pdfjs/mammoth paths deliver.
- **Source DOCX headers/footers** — Word's stored header/footer content is dropped. Pages render with auto-generated "Page N of M" footer only (REQ-05).
- **Engine switching** — locked to TipTap. SuperDoc / OnlyOffice / Slate / custom ProseMirror are explicitly off the table for this phase.
- **Mobile / tablet** — desktop browsers only (Chrome / Edge / Safari / Firefox latest 2).
- **Automated screenshot-diff harness** — verification is side-by-side human review against the Hyperscale agreement. A Playwright harness is nice-to-have for a future phase, not a gating requirement here.

## Constraints

- **Yjs CRDT sync preserved.** All edits sync through the existing `useCollabProvider` WebSocket layer unchanged.
- **Existing collab features untouched** — CommentMark, InsertionMark, DeletionMark, AI suggestions (`useAiRedlineSuggestions`), version history (`useCollabVersions`, `useFileVersionsApi`), presence bar, save-status indicator all keep working at every commit.
- **Pagination is deterministic per-client.** Page nodes are NOT stored in the Yjs doc — they are derived from the underlying block content by a local pagination plugin. Content edits sync; pagination re-runs locally. Two clients converging on the same content show the same pages.
- **Existing 260603 session patches are the baseline.** Task 1 of execution is to commit the working-tree changes as-is (after removing the page-break gutter regression, already reverted). Build phase extends from there.

## Acceptance Criteria (Phase Done When)

- [ ] All 9 requirements (REQ-01 through REQ-09) pass side-by-side review against the Hyperscale supply agreement
- [ ] Reference corpus exists under `.qa/reference-docs/` with at minimum the Hyperscale agreement + a complex-table example doc
- [ ] Yjs sync, redline marks, comments, AI suggestions, version history, presence bar all work at every commit (no regression)
- [ ] Two-client concurrent edit converges on identical page boundaries (REQ-05 acceptance)
- [ ] All changes committed on `phase2-bug-local-fixes` (or a follow-on branch if the user opts for one before execution)

## Next

`/gsd-discuss-phase` to lock the remaining implementation choices (table extension version, pagination algorithm specifics, page-footer DOM strategy) → `/gsd-plan-phase` to produce a day-by-day task breakdown → `/gsd-execute-phase` to build.
