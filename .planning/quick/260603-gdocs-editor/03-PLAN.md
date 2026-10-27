---
phase: 01-gdocs-editor
created: 2026-06-03
inputs:
  - .planning/quick/260603-gdocs-editor/01-SPEC.md (bd0717ddc)
  - .planning/quick/260603-gdocs-editor/02-CONTEXT.md (7240796ec)
branch: gdocs-editor (cut from phase2-bug-local-fixes HEAD)
estimated_duration: 5 working days
---

# PLAN — Google-Docs-style TipTap editor build

7 tasks, sequential by default (each task lands a focused commit). Acceptance for the phase = all 9 REQs in SPEC pass side-by-side review against the Hyperscale supply agreement.

---

## Task 1 — Branch + commit baseline (Day 0, ~30 min)

**Goal:** Isolate gdocs-editor work from rest of phase2-bug-local-fixes. Commit the uncommitted 260603-c session patches as the build's starting point.

**read_first:**
- `package.json` (verify `@tiptap/extension-text-align@3.23.4` and `@tiptap/extension-image@3.23.4` are in deps)
- `src/lib/fileUtils.tsx:226` (current state of `convertDocxToHtml` with transformDocument + TOC double-anchor)
- `src/pages/CollaborationToolPage/collab/useTipTapEditor.ts` (extensions array)
- `src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx` (page wrapper + BubbleMenu alignment buttons)
- `src/pages/CollaborationToolPage/collaboration.css` (`.ct-tiptap-page` + Times-12pt + TOC flex)

**actions:**
1. From current `phase2-bug-local-fixes` HEAD (`7240796ec`): `git switch -c gdocs-editor`
2. `git status` — confirm working-tree contains only the 5 expected files (package.json, pnpm-lock.yaml, fileUtils.tsx, useTipTapEditor.ts, TipTapEditorPanel.tsx, collaboration.css)
3. `git add` those files only — verify nothing unrelated is staged
4. Commit with message: `feat(gdocs-editor): baseline — alignment + images + Times-12pt + TOC + page chrome`

**acceptance_criteria:**
- [ ] Current branch is `gdocs-editor`
- [ ] `git log --oneline -1` shows the baseline commit
- [ ] `git diff phase2-bug-local-fixes..gdocs-editor` shows the 6 file deltas + the SPEC/CONTEXT/PLAN commits
- [ ] `pnpm typecheck` exits 0 (already verified earlier this session — sanity check)
- [ ] App boots: `pnpm dev` → open `/collaboration-tool?sourceUrl=...&editor=tiptap` → editor mounts without errors

---

## Task 2 — Reference corpus (Day 1 AM, ~1 hour)

**Goal:** Curate `.qa/reference-docs/` with the Hyperscale agreement and an annotated feature checklist that drives REQ acceptance reviews.

**read_first:**
- The Hyperscale supply agreement source `.docx` (path: ask user OR check `Supply Agreement Powell Comments 8.11.21.docx` referenced in earlier screenshots — likely in `~/Downloads`)
- `.qa/scripts/contract-roles-smoke.mjs` (reference for `.qa/` directory conventions)

**actions:**
1. `mkdir -p .qa/reference-docs`
2. Copy the Hyperscale `.docx` to `.qa/reference-docs/hyperscale-supply-agreement.docx`. If the document contains real client confidential data, redact names/numbers in a copy first (Keembody → Acme, etc.) before committing.
3. Write `.qa/reference-docs/hyperscale-supply-agreement.expected.md` with a checklist enumerating per-REQ visual features observable in the doc:
   - REQ-01: Body Times 12pt, line-height 1.15, paragraph 8pt spacing
   - REQ-02: Title block centered, "TABLE OF CONTENTS" centered, signature blocks left-aligned
   - REQ-03: At least one embedded image — record page/section reference
   - REQ-04: ~70 TOC entries, link-styled, 2-column with page number right
   - REQ-05: Source paginates to ~30 pages in Word (capture from File → Info → Pages count)
   - REQ-06: Table at section X.Y (locate one — payment schedule or schedule of equipment); record column count + row count
   - REQ-07: Section "1. DEFINITIONS AND INTERPRETATION" → "1.1 Definitions" → letter sub-items; record nesting depth
   - REQ-08: Heading hierarchy h1/h2/h3 observable in outline view
   - REQ-09: 8.5×11 with 1in margins (Word default)
4. Commit: `docs(gdocs-editor): add Hyperscale reference doc + expected-features checklist`

**acceptance_criteria:**
- [ ] `.qa/reference-docs/hyperscale-supply-agreement.docx` exists in repo (or symlinked from external store w/ documented fetch step)
- [ ] `.qa/reference-docs/hyperscale-supply-agreement.expected.md` has one checklist section per REQ-01 through REQ-09
- [ ] Each checklist item is a falsifiable visual observation (no "looks good" language)

---

## Task 3 — Tables (REQ-06) (Day 1 PM, ~3 hours)

**Goal:** Tables in imported DOCX render with cell borders, column widths from source, and correct per-cell alignment.

**read_first:**
- `src/pages/CollaborationToolPage/collab/useTipTapEditor.ts` (extensions array — see line 49)
- `src/pages/CollaborationToolPage/collaboration.css` (`.ct-tiptap .ProseMirror` rules — table CSS lines exist but minimal)
- TipTap v3 Table docs: https://tiptap.dev/docs/editor/extensions/nodes/table

**actions:**
1. Install: `pnpm add @tiptap/extension-table@3.23.4 @tiptap/extension-table-row@3.23.4 @tiptap/extension-table-cell@3.23.4 @tiptap/extension-table-header@3.23.4 --config.trust-policy=none`
2. In `useTipTapEditor.ts`, register the four table extensions inside the `extensions` array after Image:
   ```ts
   Table.configure({ resizable: true, HTMLAttributes: { class: 'ct-tiptap-table' } }),
   TableRow,
   TableHeader,
   TableCell,
   ```
3. In `collaboration.css`, replace the minimal table rules at the bottom of the `.ct-tiptap .ProseMirror` block with Word-faithful styling:
   ```css
   .ct-tiptap .ProseMirror table.ct-tiptap-table { border-collapse: collapse; margin: 8pt 0; width: 100%; table-layout: fixed; }
   .ct-tiptap .ProseMirror table.ct-tiptap-table td,
   .ct-tiptap .ProseMirror table.ct-tiptap-table th { border: 1px solid #000; padding: 4pt 6pt; vertical-align: top; }
   .ct-tiptap .ProseMirror table.ct-tiptap-table th { background: #f3f4f6; font-weight: 700; }
   .dark .ct-tiptap .ProseMirror table.ct-tiptap-table td,
   .dark .ct-tiptap .ProseMirror table.ct-tiptap-table th { border-color: #475569; }
   .dark .ct-tiptap .ProseMirror table.ct-tiptap-table th { background: #1e293b; }
   ```
4. In `convertDocxToHtml` (fileUtils.tsx:226), confirm mammoth's default styleMap emits `<table><tr><td>` HTML for Word tables — no extra config needed (mammoth supports tables out of box). Add an inline-test in a comment if needed.
5. Verify by loading the Hyperscale doc in `?editor=tiptap` and locating the table identified in Task 2's checklist.

**acceptance_criteria:**
- [ ] `pnpm typecheck` exits 0
- [ ] Table from REQ-06 checklist renders with visible cell borders
- [ ] Column count matches source `±0`
- [ ] Row count matches source `±0`
- [ ] At least one cell with right- or center-aligned content renders with that alignment preserved

---

## Task 4 — Nested lists + headings (REQ-07, REQ-08) (Day 2, ~3 hours)

**Goal:** Verify and fix nested ordered lists (3+ levels deep) and heading hierarchy rendering.

**read_first:**
- `src/pages/CollaborationToolPage/collaboration.css` (existing list rules `.ct-tiptap .ProseMirror ul, .ct-tiptap .ProseMirror ol`)
- Output of mammoth on Hyperscale section "1. DEFINITIONS AND INTERPRETATION" — quick repro: `node -e "const m=require('mammoth');m.convertToHtml({path:'.qa/reference-docs/hyperscale-supply-agreement.docx'}).then(r=>console.log(r.value.substring(0,5000)))"`

**actions:**
1. Inspect mammoth's HTML for the Definitions section. Word numbered headings typically come through as `<h1>1. DEFINITIONS...</h1>` then `<p>` sub-items rather than `<ol>` — confirm. If sub-items are `<p>` not `<ol>/<li>`, that's correct mammoth behavior; CSS doesn't need to add list markers since the numbers are in the text.
2. For REQ-07 nested numbered lists (the genuine nested list cases — usually under "Definitions" subsections), check whether mammoth emits `<ol><li><ol><li>` correctly. If yes, ensure CSS handles 3 levels:
   ```css
   .ct-tiptap .ProseMirror ol { list-style: decimal; }
   .ct-tiptap .ProseMirror ol ol { list-style: lower-alpha; }
   .ct-tiptap .ProseMirror ol ol ol { list-style: lower-roman; }
   ```
3. For REQ-08 headings: confirm h1/h2/h3 sizes from existing CSS (16pt/14pt/12pt bold) are correct against Word source. If Word headings use different sizes for the Hyperscale agreement specifically, tune sizes — but only with concrete source measurements (don't tune to taste).
4. Edge case: Word's "Heading 1" style is often left-aligned with section number prefix; if our alignment-override transform (260603-b in fileUtils.tsx) over-zealously synthesizes `styleName` for headings, they may render as `<p style="text-align: left">` instead of `<h1>`. Inspect a generated HTML sample — if collisions found, gate the transform on `!element.styleId` (memory note: [[feedback_mammoth_drops_alignment]] flagged this trade-off).

**acceptance_criteria:**
- [ ] `pnpm typecheck` exits 0
- [ ] "1. DEFINITIONS AND INTERPRETATION" renders as h1 with the section number visible (whether inline or via list-style)
- [ ] "1.1 Definitions" renders as h2 visually nested under h1
- [ ] Lettered sub-items (a, b, c) under definitions render with letter markers OR with the letters inline in source text (mammoth's default)
- [ ] Heading hierarchy reads as outline-equivalent to Word's outline view

---

## Task 5 — Multi-page sheets (REQ-05, the hard one) (Day 3-Day 4, ~12 hours)

**Goal:** Document renders as discrete page-shaped sheets with content split at page boundaries that match Word's pagination. Pagination is derived locally per-client via ProseMirror Decorations — NOT stored in Yjs.

**read_first:**
- `src/pages/CollaborationToolPage/collab/useTipTapEditor.ts` (where the pagination plugin will be registered)
- `src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx:392-398` (the `.ct-tiptap-page` wrapper currently wraps the whole document — this changes to wrapping individual pages)
- `src/pages/CollaborationToolPage/collaboration.css` (`.ct-tiptap-page` styles)
- ProseMirror Plugin docs: https://prosemirror.net/docs/guide/#state.plugins
- ProseMirror Decoration docs: https://prosemirror.net/docs/guide/#view.decorations

**actions:**
1. **Create the transaction classifier:** `src/pages/CollaborationToolPage/collab/pagination/classifyTransaction.ts`
   ```ts
   import type { Transaction } from "@tiptap/pm/state";
   export function classifyTransaction(tr: Transaction): "structural" | "text" | "noop" {
     if (!tr.docChanged) return "noop";
     // Structural if any step is ReplaceStep with sliceSize > 1 (paste/block-delete)
     // or any step affects a non-text node (table-insert, image-insert)
     for (const step of tr.steps) {
       const json = step.toJSON();
       if (json.stepType === "replace" && json.slice?.content?.length > 1) return "structural";
       if (json.stepType === "addMark" || json.stepType === "removeMark") return "text";
     }
     return "text";
   }
   ```
2. **Create the pagination plugin:** `src/pages/CollaborationToolPage/collab/pagination/paginationPlugin.ts`
   - Plugin key, plugin state holding `{ pageBreaks: number[]; totalPages: number }`
   - `apply`: on every transaction, classify; if structural, recompute immediately; if text, schedule recompute via debounced async (`requestIdleCallback` with 150ms fallback timeout)
   - **Page break computation algorithm:**
     - Walk the doc top to bottom, accumulating rendered height per block (use `view.coordsAtPos(pos)` for each block boundary to get pixel offsets)
     - Target page content height = 9in × 96dpi = 864px (11in page - 2×1in margins). Use a CSS variable `--page-content-height` set on `.ct-editor-canvas` so it's tunable.
     - Emit a break position whenever accumulated height ≥ target
     - Return list of break positions + total pages
   - `props.decorations`: return a `DecorationSet` with widget decorations at each break position, each widget = a `<div class="ct-page-break-marker">` empty element
   - `view.dispatch` a no-op transaction with `meta('paginationUpdated', { totalPages })` after recompute so React can mirror state for the footer CSS var
3. **Register the plugin** in `useTipTapEditor.ts` via `Extension.create({ addProseMirrorPlugins() { return [paginationPlugin] } })`
4. **Restructure DOM** in `TipTapEditorPanel.tsx` — drop the single outer `.ct-tiptap-page` wrapper around `<EditorContent>`. Pages are now rendered by the plugin's decorations splitting the visual flow. The CSS approach:
   - Each `.ct-page-break-marker` becomes a hard visual boundary via CSS sibling selectors: blocks between two markers (or from doc-start to first marker, or from last marker to doc-end) get bundled into a CSS-styled "page" via `.ct-tiptap .ProseMirror > *` siblings flowing into stacked containers.
   - Alternative if CSS-sibling approach is fragile: render decoration as a **section-end marker** that closes a `display: contents` wrapper. Use whichever proves more stable in browser testing.
5. **Set `--total-pages` CSS var** when plugin reports new totalPages: in TipTapEditorPanel, subscribe to plugin state via an editor update handler and write `document.querySelector('.ct-editor-canvas')?.style.setProperty('--total-pages', String(totalPages))`.
6. **Page footer styling** in `collaboration.css`:
   ```css
   .ct-editor-canvas { counter-reset: page; --total-pages: 1; }
   .ct-tiptap-page { counter-increment: page; position: relative; }
   .ct-tiptap-page::after {
     content: "Page " counter(page) " of " var(--total-pages);
     position: absolute;
     bottom: 0.5in;
     left: 50%;
     transform: translateX(-50%);
     font-family: "Times New Roman", serif;
     font-size: 10pt;
     color: #6b7280;
   }
   ```
7. **CRDT-safe verification:** open two browser windows on the same room. Type in window A on what would be page 3; verify window B sees content sync via Yjs AND its local pagination plugin re-runs producing the same page break positions.

**acceptance_criteria:**
- [ ] `pnpm typecheck` exits 0
- [ ] Hyperscale agreement renders as ~30 visually-distinct page sheets stacked vertically (count ±2 of Word's reported page count)
- [ ] Each page shows "Page N of M" footer at the bottom
- [ ] Typing into a near-full page that would overflow causes the next paragraph to flow onto the next page within ~200ms of pause
- [ ] Pasting a 5-paragraph block at end of page 3 re-paginates synchronously (no visible flicker)
- [ ] Cross-page text selection works (select last line of page 3 through first line of page 4)
- [ ] Two clients on the same room produce the same page count for the same document state
- [ ] CommentMark/InsertionMark/DeletionMark still render and survive page boundaries (test: redline a sentence that crosses a page break)
- [ ] Save-status indicator still updates, presence bar still shows, version history snapshot still records

---

## Task 6 — TOC anchor scroll within multi-page view (REQ-04 refinement) (Day 5 AM, ~2 hours)

**Goal:** Clicking a TOC entry scrolls to the target section, which now lives on a specific page. Anchor positioning must work across the multi-page layout.

**read_first:**
- `src/lib/fileUtils.tsx` (TOC post-process — `__page` synthetic href trick)
- TipTap's anchor handling — does the Link mark preserve `href="#_Toc..."` and is anchor-scroll automatic via browser default?

**actions:**
1. Test: click "1.1 Definitions 7" in the rendered TOC — does the browser scroll to the Definitions heading? mammoth emits `<a id="_Toc..." />` anchors at heading positions, so default browser anchor-scroll should work.
2. If broken (likely because TipTap may strip empty `<a id>` anchors during setContent), add anchor preservation: register an `Extension.create` with `addProseMirrorPlugins` that augments the schema or use a Decoration to inject `<span id="...">` markers at heading positions during import.
3. Verify the synthetic `__page` href doesn't break navigation — second anchor with `#_Toc1__page` should resolve to the same target; if not, change post-process to make the second anchor share the original href (we did the rename only to defeat link-mark merging, not for navigation).

**acceptance_criteria:**
- [ ] Clicking "1. DEFINITIONS AND INTERPRETATION" in the rendered TOC scrolls the viewport to that section
- [ ] Clicking either the title anchor OR the page-number anchor produces the same scroll
- [ ] Scroll position lands within 50px of the heading top

---

## Task 7 — Side-by-side review + gap fixes (Day 5 PM, ~3 hours)

**Goal:** Run the acceptance review against the Hyperscale agreement and address gaps.

**read_first:**
- `.qa/reference-docs/hyperscale-supply-agreement.expected.md` (the checklist)

**actions:**
1. Open Hyperscale `.docx` in Microsoft Word (or Google Docs if Word unavailable) — call this the SOURCE.
2. Open the same file in the editor at `?editor=tiptap` — call this the TARGET.
3. Walk through every checklist item in the expected.md. For each: PASS, FAIL, or PARTIAL. Record observations.
4. For each FAIL or PARTIAL: triage — is the gap (a) acceptable degradation, (b) fixable in a small follow-up task, or (c) a real REQ failure?
5. If any (c) gaps: add a small task here, fix, re-review.
6. Commit final pass with `feat(gdocs-editor): pass acceptance review against Hyperscale supply agreement`.

**acceptance_criteria:**
- [ ] All 9 SPEC REQs marked PASS in the expected.md checklist
- [ ] Any deviations documented as out-of-scope follow-ups (separate `.planning/quick/` phases)
- [ ] Yjs sync, marks, AI, versions, presence, save-status all working at final commit
- [ ] `pnpm typecheck` exits 0

---

## Verification

Phase done when all 7 tasks have their acceptance criteria checked. Run final verification by:
1. Loading Hyperscale agreement at `?editor=tiptap`
2. Opening same `.docx` in Word side-by-side
3. Confirming every REQ checklist item in the expected.md passes
4. Two-client concurrent edit test (REQ-05 acceptance)

## must_haves (goal-backward)

The phase delivers user-observable value only if:
- A lawyer can open an imported Hyperscale agreement in the editor and trust the rendering matches Word
- Centered titles, TOC with leader dots, page boundaries, tables, headings all visible
- Existing collab/redline/comment/AI/version features keep working at every commit on `gdocs-editor`

If any of these are not true at phase end, the phase failed regardless of green typecheck.

## Open risks

- **Decoration-based page rendering may be fragile** — if CSS sibling-grouping approach doesn't hold up, fall back to wrapping each detected page region in a real (non-doc-state) DOM container via NodeView rendering. Adds 2-4 hours.
- **mammoth heading-vs-alignment override collision** flagged in Task 4 may need a tighter gate. Catch in Task 4 verification, fix-in-place if needed.
- **Anchor preservation in TipTap setContent** is the riskiest part of Task 6 — if `<a id>` anchors are stripped, navigation breaks. Mitigation in Task 6 step 2.
- **Pagination perf on 70+ page docs** unknown — if Hyperscale stresses the per-transaction measurement, the structural-edit sync path will be visible. Mitigation: measure render times in dev tools, profile-and-optimize as a follow-up if needed.

## Next

`/gsd-execute-phase` to start Task 1, OR start manually (`git switch -c gdocs-editor` and commit baseline) and step through the plan task-by-task.
