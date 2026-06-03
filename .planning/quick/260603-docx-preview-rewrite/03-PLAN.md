---
phase: 02-docx-preview-rewrite
created: 2026-06-03
inputs:
  - .planning/quick/260603-docx-preview-rewrite/01-SPEC.md (60c151c49)
  - .planning/quick/260603-docx-preview-rewrite/02-CONTEXT.md (dc6f8bc44)
branch: docx-preview-rewrite (cut from gdocs-editor HEAD before Task 1)
estimated_duration: 6-8 working weeks
---

# PLAN — docx-preview rewrite

8 tasks, each scoped to one REQ. Mostly sequential — translation layer (Task 2) is the foundation; subsequent tasks layer on top with limited parallelism. Atomic commits per logical sub-task.

---

## Task 0 — Branch off `docx-preview-rewrite` (15 min)

**Goal:** Cut new branch from `gdocs-editor` HEAD so Phase 01 work is preserved and evaluable independently.

**read_first:**
- `git log --oneline -5` (verify current HEAD is the CONTEXT.md commit `dc6f8bc44`)

**actions:**
1. `git switch -c docx-preview-rewrite`
2. `git branch --show-current` — confirm

**acceptance_criteria:**
- [ ] Current branch is `docx-preview-rewrite`
- [ ] `git log --oneline -1` shows the Phase 02 CONTEXT commit
- [ ] `git diff gdocs-editor..docx-preview-rewrite` shows zero changes (branch is HEAD-equal at start)

---

## Task 1 — Reference corpus expansion (REQ-R-01) (~half day)

**Goal:** Add 2 more reference docs so Phase 02 is corpus-generalized, not Hyperscale-specific.

**read_first:**
- `.qa/reference-docs/hyperscale-supply-agreement.expected.md` (existing checklist pattern)

**actions:**
1. Source or synthesize an NDA-style 1-3 page contract (`.qa/reference-docs/sample-nda.docx`). Options:
   - Pull from real client data with PII/figures redacted
   - Synthesize using LawDepot / Lexology template + LLM-generated clauses
2. Source or synthesize a complex-table contract (`.qa/reference-docs/sample-with-table.docx`). Could be a payment schedule, KPI matrix, or SOW with deliverables table.
3. Write `.qa/reference-docs/sample-nda.expected.md` and `sample-with-table.expected.md` mirroring the Hyperscale checklist structure (per-REQ falsifiable visual features).
4. Run the docx-preview spike script against both new docs to confirm they parse without errors. Update spike findings if anything surprising emerges.
5. Commit: `docs(docx-preview-rewrite): add NDA + complex-table reference docs`

**acceptance_criteria:**
- [ ] `.qa/reference-docs/sample-nda.docx` exists, ~1-3 pages, exercises basic legal-doc layout
- [ ] `.qa/reference-docs/sample-with-table.docx` exists, contains at least one non-trivial table (5+ rows, multi-column)
- [ ] Both `.expected.md` files have checklist sections for REQ-R-01 through REQ-R-07
- [ ] docx-preview spike script renders both new docs without errors

---

## Task 2 — Translation layer (REQ-R-02) (~1 week, biggest task)

**Goal:** Build `convertDocxToTipTapContent()` — the new import path. Replaces mammoth entirely.

**read_first:**
- `src/lib/fileUtils.tsx` — `convertDocxToHtml` and helpers being replaced
- `.planning/quick/260603-gdocs-editor/spike/FINDINGS.md` — structure of docx-preview output
- `.planning/quick/260603-gdocs-editor/spike/docx-preview-spike.mjs` — runnable example
- `src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx` — `setContent` call site

**Sub-tasks (commit each separately):**

**2a. Skeleton + browser-side docx-preview render.** Create `convertDocxToTipTapContent(arrayBuffer)` that:
- Imports docx-preview lazily (matching current mammoth import pattern)
- Creates a detached `<div>` container
- Calls `docx.renderAsync(arrayBuffer, bodyEl, styleEl, { breakPages: true, renderHeaders: true, renderFooters: true, inWrapper: true })`
- Returns `{ html: bodyEl.innerHTML, styleHtml: styleEl.innerHTML, sectionBoundaries: [], headers: [], footers: [] }` for now (stubs)

**2b. Section → page boundaries.** Walk `bodyEl.querySelectorAll('section')`. For each section, record its first-child paragraph's intended doc position. Compute side-channel `sectionBoundaries: number[]` of doc positions where each new page starts.

**2c. Article unwrap + alignment passthrough.** Walk the DOM tree:
- `<article>` → unwrap (move children to parent)
- `<p style="text-align: X">` → preserve as-is (TextAlign extension handles)
- Strip `<section>` wrapper (page boundaries are in side channel now)

**2d. Headers/footers extraction.** For each `<section>`, extract `<header>` and `<footer>` content. Store in `headers: Array<{ pageIndex, html }>` and `footers: Array<{ pageIndex, html }>` side channels. Remove from main content tree.

**2e. Word-style class → data attribute.** For each `<p class="docx_*">`, translate Word style class (e.g. `docx_bodytext`) to `<p data-docx-style="BodyText">`. CSS rules (in Task 5) consume these.

**2f. TextStyle marks.** For each `<span style="font-family: X; font-size: Yp">`, wrap text in TextStyle mark with those attrs. Requires Task 3's extensions to be registered first — so order Task 3 before 2f if executing sequentially.

**2g. Wire as active import.** Update `TipTapEditorPanel.tsx` to call `convertDocxToTipTapContent` instead of `convertDocxToHtml`. Update `setContent` to pass the translated HTML + dispatch side-channel data to pagination plugin via meta-set transactions.

**acceptance_criteria:**
- [ ] `convertDocxToTipTapContent(arrayBuffer)` exists and returns `{ html, styleHtml, sectionBoundaries, headers, footers }`
- [ ] Each sub-task (2a-2g) commits independently with passing `pnpm typecheck`
- [ ] Hyperscale loads through new path without console errors
- [ ] Title block renders centered (REQ-R-02 acceptance)
- [ ] Side-channel data reaches pagination plugin (verified via DevTools inspection of plugin state)
- [ ] All Phase 01 collab features still work (smoke test: type, comment, redline, presence bar update)

---

## Task 3 — Register TipTap TextStyle + font extensions (REQ-R-03) (~2 days)

**Goal:** Install and configure extensions so inline font specs from docx-preview survive setContent.

**read_first:**
- `src/pages/CollaborationToolPage/collab/useTipTapEditor.ts` — extension array
- TipTap docs: https://tiptap.dev/docs/editor/extensions/marks/text-style

**actions:**
1. `pnpm add @tiptap/extension-text-style@3.23.4 @tiptap/extension-font-family@3.23.4 @tiptap/extension-font-size@3.23.4 --config.trust-policy=none`
2. Register in `useTipTapEditor.ts`:
   ```ts
   TextStyle,
   FontFamily.configure({ types: ['textStyle'] }),
   FontSize.configure({ types: ['textStyle'] }),
   ```
3. Verify `pnpm typecheck` passes
4. Smoke test: paste content with inline `<span style="font-family: Arial; font-size: 14pt">test</span>` into the editor; verify it renders as Arial 14pt
5. Update Task 2f to emit these marks during translation
6. Verify title block "Hyperscale Data Center..." renders in Times New Roman 16pt against source

**acceptance_criteria:**
- [ ] Three extensions installed and registered
- [ ] `pnpm typecheck` exits 0
- [ ] Title block font matches source-doc spec
- [ ] Round-trip: typing new text in editor uses editor's default font (extension doesn't break authoring)

---

## Task 4 — Header/footer decoration widgets (REQ-R-04) (~3-4 days)

**Goal:** Render source-doc headers and footers as decoration widgets at page boundaries.

**read_first:**
- `src/pages/CollaborationToolPage/collab/pagination/paginationPlugin.ts` — Decoration emission code
- ProseMirror Decoration docs: https://prosemirror.net/docs/ref/#view.Decoration%5Ewidget

**actions:**
1. Create `src/pages/CollaborationToolPage/collab/pagination/headerFooterWidgets.ts`:
   - `buildHeaderWidget(html: string): HTMLElement` — parses HTML, returns `<div class="ct-page-header">` wrapper
   - `buildFooterWidget(html: string): HTMLElement` — same with `<div class="ct-page-footer">`
   - Inline styles in widgets are namespaced (`docx_*` classes scoped to the wrapper)
2. Update `paginationPlugin.ts`:
   - Add `headers: Array<{ pageIndex, html }>` and `footers: Array<{ pageIndex, html }>` to PaginationState
   - `set-pagination` meta transaction carries these
   - `props.decorations(state)`: for each page-start block, find the corresponding `headers[pageIndex]` and emit `Decoration.widget(pageStartPos, () => buildHeaderWidget(html), { side: -1 })`
   - Same for footers at page-end positions with `side: 1`
3. Update `collaboration.css`:
   - `.ct-page-header { position: absolute; top: -1in; left: 0; right: 0; font: ... }` (relative to the page-start block via `position: relative`)
   - `.ct-page-footer { position: absolute; bottom: -1in; left: 0; right: 0; }`
   - Remove `.ct-tiptap .ProseMirror > [data-page-end="true"]::after` rule (the auto "Page N of M")
4. Wire Task 2d's extraction to populate plugin state via meta-set
5. Verify against Hyperscale (has headers + footers) and against sample-nda.docx (likely no headers/footers — should render empty margins)

**acceptance_criteria:**
- [ ] Hyperscale's source headers render at top of each page
- [ ] Hyperscale's source footers render at bottom of each page
- [ ] Word's `{ PAGE }` field renders as actual page number
- [ ] sample-nda.docx (no source header/footer) renders with empty top/bottom margins — no auto Page N of M
- [ ] `pnpm typecheck` exits 0

---

## Task 5 — Word-style CSS theming (REQ-R-05) (~3-4 days)

**Goal:** Translate Word style names to CSS-targetable `data-docx-style` attribute; theme top 10 Word styles for visual fidelity.

**read_first:**
- Output of docx-preview's `parseAsync(...).styleMap` to enumerate Word styles in each corpus doc
- `src/pages/CollaborationToolPage/collaboration.css` — where new style rules land

**actions:**
1. Update Task 2e to set `data-docx-style` attribute on paragraphs based on docx-preview's class names (e.g. `docx_bodytext` → `data-docx-style="BodyText"`)
2. Identify the union of Word styles across all 3 corpus docs (Hyperscale + NDA + complex-table). Likely set: `Normal`, `BodyText`, `Heading 1`, `Heading 2`, `Heading 3`, `Title`, `Subtitle`, `Article`, `ArticleL2`, `ScheduleL1`, `ScheduleL2`, `TOC1`, `TOC2`, `Centre`, etc.
3. Write CSS rules in `collaboration.css` for the top 10 most common:
   ```css
   .ct-tiptap [data-docx-style="Heading 1"] { font-size: 16pt; font-weight: 700; ... }
   .ct-tiptap [data-docx-style="BodyText"] { font-size: 11pt; line-height: 1.15; ... }
   .ct-tiptap [data-docx-style="Title"] { font-size: 28pt; font-weight: 700; text-align: center; ... }
   /* ... etc */
   ```
4. Default cascade for unknown styles: existing `.ct-tiptap p` rules apply (Times 12pt 1.15 line-height)
5. Verify against all 3 corpus docs — at least 80% of paragraphs in each render with a recognized `data-docx-style`

**acceptance_criteria:**
- [ ] All paragraphs in Hyperscale carry `data-docx-style`
- [ ] CSS rules for top 10 styles produce visually-distinct rendering
- [ ] Adding NDA + complex-table doc doesn't crash; falls back to default cascade for unfamiliar styles
- [ ] `pnpm typecheck` exits 0

---

## Task 6 — Dead-code removal + Phase 01 collab regression (REQ-R-06) (~3 days)

**Goal:** Remove every Phase 01 mammoth patch obsoleted by Phase 02. Verify all Phase 01 collab features still work.

**read_first:**
- `.planning/quick/260603-docx-preview-rewrite/02-CONTEXT.md` — list of explicit removals
- `src/lib/fileUtils.tsx` — current mammoth path
- `src/pages/CollaborationToolPage/collab/pagination/paginationPlugin.ts` — HR detection + dynamic padding

**actions:**

**6a. File deletions / function removals:**
- Delete `convertDocxToHtml()` from `fileUtils.tsx`
- Delete `flattenLists()`, `flattenOneList()` helpers
- Delete `transformParagraph()` callback
- Delete `HEADING_STYLE_IDS` set
- Remove all mammoth styleMap entries (alignment, Article, Schedule, Centre, Page Break Marker)
- Remove `import('mammoth')` reference
- `pnpm remove mammoth` (uninstall the dependency)

**6b. Pagination plugin cleanup:**
- Remove `block.tagName === "HR"` detection in `computePagination` (replaced by section-derived breaks)
- Remove HR-skipping logic in `props.decorations`
- Remove dynamic per-page padding (`pageEndExtraPadding`, `getInlineExtraPadding`, `computeExtraPaddings`, `arraysApproxEqual`)
- Plugin state simplifies to `{ pageBreaks, totalPages, pendingRecompute, lastRecomputeAt, headers, footers }`
- Inline padding-bottom on page-end blocks REMOVED — pages render at source-defined heights
- `setTotalPagesCssVar` updates `--total-pages` for any future use (kept defensively)

**6c. CSS cleanup:**
- Remove `.ct-tiptap .ProseMirror > hr` rule (no more HR markers)
- Remove `[data-page-end="true"]::after` content rule (no more auto Page N of M)
- Remove `.ct-tiptap .ProseMirror p:not([style]) > br:first-child { display: none }` (no more mammoth leading-br artifacts)
- Remove `[data-page-end="true"] { min-height: ... }` if any vestige remains

**6d. Collab regression test pass:**
- Run `pnpm test` — fix any regressions (classifyTransaction, EditorPanelImport tests likely affected)
- Two-window concurrent edit test: open Hyperscale in two browser windows, type concurrently, verify Yjs convergence
- Add a CommentMark to a paragraph; verify it persists across browser reload
- Add an InsertionMark + DeletionMark via BubbleMenu; verify they render and sync
- Open the AI suggestions panel; verify it loads without errors
- Open the Versions panel; verify version history is preserved
- Verify presence bar shows other users
- Verify save-status indicator transitions Saving → Saved

**acceptance_criteria:**
- [ ] mammoth dependency removed from `package.json`
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] Two-window concurrent edit converges (Yjs sync intact)
- [ ] Every Phase 01 collab feature works in the new editor (smoke-tested above)

---

## Task 7 — Performance benchmark + tuning (REQ-R-07) (~2-3 days)

**Goal:** Measure Hyperscale load time and keystroke latency against targets. Optimize if needed.

**read_first:**
- `src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx` — import flow

**actions:**
1. Create `.qa/scripts/editor-fidelity-perf.mjs` (Playwright runner):
   - Boot dev server
   - Navigate to `?editor=tiptap&sourceUrl=<Hyperscale>` in fresh room
   - Click "Re-sync from source"
   - Measure: fetch → docx-preview render → translation → setContent → first paint
   - Type 100 characters in the middle of the doc; measure per-keystroke latency
   - Dump JSON report to `.qa/reports/editor-perf-{timestamp}.json`
2. Run benchmark on Hyperscale; record baseline
3. If targets missed (< 5s load, < 16ms keystroke):
   - Profile via Chrome DevTools Performance tab
   - Common offenders: docx-preview rendering speed (large styleHTML), TipTap setContent on big doc, decoration recompute frequency
   - Optimize the hottest path
4. Re-run benchmark; commit final numbers as `.qa/reports/editor-perf-baseline.json`

**acceptance_criteria:**
- [ ] Hyperscale loads in < 5 seconds end-to-end on dev machine
- [ ] Per-keystroke latency < 16ms (60fps) median over 100 keystrokes
- [ ] Baseline perf report committed for regression tracking
- [ ] If targets missed, document why in DECISION.md (Task 8)

---

## Task 8 — DECISION.md + final review + ship (~1-2 days)

**Goal:** Final acceptance review against all 7 REQs + corpus + DECISION.md write-up.

**read_first:**
- `.planning/quick/260603-docx-preview-rewrite/01-SPEC.md` (acceptance criteria)
- All 3 reference docs' `expected.md` checklists

**actions:**
1. For each of the 3 reference docs:
   - Open in Word / Google Docs (source)
   - Open in editor at `?editor=tiptap` (target)
   - Walk the expected.md checklist; record PASS / FAIL / PARTIAL per item
2. Fix any FAIL items that aren't acceptable degradations
3. Write `.planning/quick/260603-docx-preview-rewrite/DECISION.md`:
   - What worked (docx-preview's coverage, TextStyle marks, decoration widgets, etc.)
   - What didn't (any REQs PARTIAL'd, any docs that exposed gaps)
   - What's deferred to Phase 03 (DOCX export, source comments, track changes, etc.)
   - Maintenance notes (docx-preview maintainership concerns, when to next benchmark)
4. Update the Hyperscale `.expected.md` with the final review log
5. Commit DECISION.md
6. Open PR from `docx-preview-rewrite` → wherever phase2 stack lands

**acceptance_criteria:**
- [ ] All 9 REQ checklist items in each `.expected.md` pass for all 3 corpus docs
- [ ] DECISION.md written and committed
- [ ] PR opened with clear summary of architectural pivot rationale (link to spike FINDINGS.md + Phase 02 SPEC)
- [ ] `pnpm typecheck` + `pnpm test` + `pnpm build` all pass

---

## must_haves (goal-backward)

The phase delivers user-observable value only if:

- ANY Word doc (not just Hyperscale) imports with reasonable visual fidelity matching Google Docs/Word
- Lawyers can read imported contracts without trusting source-doc layout being wrong
- All Phase 01 collab features (Yjs, marks, AI, versions, presence) work unchanged
- Adding a new contract type doesn't require new mammoth-style patches
- mammoth dependency is removed from package.json

If any of these are not true at phase end, the phase failed regardless of green typecheck.

## Open risks (from SPEC + spike)

- **docx-preview maintainership** — single maintainer; could become unmaintained. Mitigation: fork if needed; our integration layer (translation, extensions) is in our codebase.
- **Large output size** — 720KB body HTML for Hyperscale. May affect Yjs sync payload. Measure in Task 7.
- **VML graphics handling** — docs heavy in VML (Microsoft's older vector format) may render imperfectly. Mitigation: out of scope for Phase 02; document in DECISION.md if encountered.
- **TextStyle extension performance** — many spans with inline styles produce many marks in ProseMirror state. May slow editor on very large docs. Measure in Task 7.
- **Existing Yjs rooms** — rooms populated under Phase 01 still have mammoth content. Users must click "Re-sync from source" (kept from Phase 01) to see Phase 02 output. Documented; no automatic migration.

## Dependency graph

```
Task 0 (branch)
  └→ Task 1 (corpus) ─┐
                       ├→ Task 2 (translation layer)
                       │     ├→ Task 3 (TextStyle)
                       │     ├→ Task 4 (header/footer widgets)
                       │     └→ Task 5 (style theming)
                       │           └→ Task 6 (dead-code removal + collab regression)
                       │                 └→ Task 7 (perf benchmark)
                       │                       └→ Task 8 (DECISION + ship)
```

Task 3, 4, 5 can parallelize after Task 2's translation layer skeleton exists. Tasks 6-8 are strictly sequential.

## Next

`/gsd-execute-phase` to start Task 0 (cut the branch) and proceed through tasks sequentially. OR start manually with `git switch -c docx-preview-rewrite` and step through.
