# Hyperscale Supply Agreement — Expected Rendering Checklist

**Reference doc:** `.qa/reference-docs/hyperscale-supply-agreement.docx`
**Source:** Original Word doc opened in Google Docs at https://docs.google.com/document/d/1T00-_ZCjUzsnDG36zgnzXUcq0mRAdrW_U37q-uiqV48/edit
**File size:** ~286 KB
**Doc title:** "Hyperscale Data Center – 35MW Hyperscale Data Center Shaft Project Supply Agreement"

This checklist drives acceptance review for Phase 01-gdocs-editor. Each section maps to one REQ from `01-SPEC.md`. For every checkbox: PASS only if the TipTap editor view (mounted at `?editor=tiptap`) matches the same visual feature observed in Word/Google Docs.

Format: each item is **falsifiable** — a reviewer with both views open can answer yes/no without subjective judgement.

---

## REQ-01: Body typography matches Word

- [ ] Body text renders in Times New Roman (or browser-default serif fallback if Times unavailable)
- [ ] Body font size = 12pt
- [ ] Line-height ≈ 1.15 (Word default — body paragraphs occupy similar vertical run length as source)
- [ ] Paragraph spacing ≈ 8pt (visible whitespace between paragraphs matches Word, not double-spaced)
- [ ] Heading h1 = 16pt bold (e.g. "1. DEFINITIONS AND INTERPRETATION")
- [ ] Heading h2 = 14pt bold (e.g. "1.1 Definitions")
- [ ] Heading h3 = 12pt bold

## REQ-02: Paragraph alignment preserved from source

- [ ] Document title block "Hyperscale Data Center – 35MW... Supply Agreement" renders **centered**
- [ ] "TABLE OF CONTENTS" heading renders **centered**
- [ ] "SUPPLY AGREEMENT / GENERAL TERMS AND CONDITIONS" header renders **centered**
- [ ] "THIS SUPPLY AGREEMENT is dated as of ■, 2021." renders **left-aligned**
- [ ] "BETWEEN:" renders **left-aligned**
- [ ] Body paragraphs (definitions, clauses) render **left-aligned**
- [ ] Any justified paragraphs in source render with justification

## REQ-03: Inline images render at source scale

- [ ] Any image embedded in the source DOCX renders in the editor (does not vanish)
- [ ] Image scales to fit page width without overflowing the page sheet
- [ ] Image is centered horizontally with 8pt vertical margin above and below
- [ ] Image aspect ratio is preserved (not stretched)

**Locate during review:** Note page/section reference for each embedded image in source.

## REQ-04: TOC entries render as 2-column rows with leader dots

- [ ] "TABLE OF CONTENTS" heading is centered (also covered by REQ-02)
- [ ] Each TOC entry renders as ONE visual row with title left + page number right
- [ ] Dotted leader runs between title and page number on each TOC row
- [ ] Section TOC entries are bolded or visually distinct from sub-section entries
- [ ] Clicking a TOC entry scrolls the viewport to the target section
- [ ] Following TOC entries are present and renderable (verified by visual scan):
  - [ ] 1. DEFINITIONS AND INTERPRETATION — page 7
  - [ ] 1.1 Definitions — page 7
  - [ ] 1.2 Interpretation — page 11
  - [ ] 2. AGREEMENT; SCHEDULES; CONFLICTS — page 12
  - [ ] 3. GENERAL PROVISIONS — page 14
  - [ ] 4. PAYMENT — page 15
  - [ ] 5. SUPPLIER'S OBLIGATIONS — (verify page)
  - [ ] 6. (verify section + page)
  - [ ] 7. (verify section + page)
  - [ ] 8. INSURANCE — page 21
  - [ ] 9. INTELLECTUAL PROPERTY — page 24
  - [ ] 10. REPRESENTATIONS AND WARRANTIES — page 27
  - [ ] 11. CHANGES IN THE EQUIPMENT — (verify page)
- [ ] All TOC entries link to anchors that resolve within the doc (no broken links)

## REQ-05: Multi-page sheet rendering with visible page boundaries

- [ ] Document renders as visually-distinct vertical stack of page sheets (NOT one continuous scroll)
- [ ] Page count in editor matches Word's reported page count `±2` pages

  **Get Word page count:** Open `.docx` in Word → File → Info → Pages (or look at status bar bottom-left). Record here: `__ pages`. (Visible in screenshots: TOC starts around page 7; doc has at least 27+ pages from TOC entries alone.)

- [ ] Each page sheet shows "Page N of M" in a footer at the bottom-center
- [ ] Footer page numbers are sequential (1, 2, 3, ...) and "M" matches the total page count
- [ ] Page boundaries land at the same content positions as Word's pagination (verify by spot-checking 3 page breaks: where does Word break vs where does editor break for the same content)
- [ ] Cross-page text selection works: select last sentence of page N through first sentence of page N+1, redline both, both highlights render correctly across the boundary
- [ ] Two browser windows on the same room produce the same page count after Yjs converges
- [ ] Typing into a near-full page causes overflow content to flow onto the next page within ~200ms of pausing typing
- [ ] Pasting a large block re-paginates immediately (synchronous, no debounce)

## REQ-06: Tables render with cell borders, column widths, alignment

**Locate during review:** Identify at least one table in the Hyperscale doc. Likely candidates: payment schedule, schedule of equipment, KPI matrix in any Appendix/Schedule. Record table location: `Section/page ____`.

- [ ] Table has visible cell borders (1px black/dark)
- [ ] Table column count matches source `±0`
- [ ] Table row count matches source `±0`
- [ ] Header row (if any) is visually distinct (bold + grey background)
- [ ] Per-cell text alignment matches source (left / center / right)
- [ ] Cells with multi-line content render the line wraps correctly
- [ ] Table doesn't overflow the page width

## REQ-07: Numbered lists nested 3+ levels with correct markers

- [ ] Section "1. DEFINITIONS AND INTERPRETATION" → "1.1 Definitions" structure visible
- [ ] Lettered sub-items under definitions (a), (b), (c) render with letter markers (or with letters inline in source text — mammoth's default behavior is acceptable)
- [ ] At least one definition with roman-numeral sub-items (i), (ii) renders correctly if present in source
- [ ] Nesting depth visually communicated via indentation
- [ ] Number/letter markers do not collide with body text

## REQ-08: Headings preserve source hierarchy

- [ ] "1. DEFINITIONS AND INTERPRETATION" renders as h1-equivalent (largest heading style)
- [ ] "1.1 Definitions" renders as h2-equivalent (one level smaller than h1)
- [ ] "(a) A.M. Best." (definition entries) renders as body text, NOT as a heading
- [ ] Hierarchy reads as outline-equivalent to Word's outline view (Word: View → Outline)
- [ ] Section numbers (1., 1.1, 1.1.1) are visible either inline or via list-style markers
- [ ] **No regression from heading-vs-alignment override collision:** "1. DEFINITIONS AND INTERPRETATION" still renders as h1 even though it may have explicit alignment in source. (This is the known trade-off from [[feedback_mammoth_drops_alignment]] — if collision is visible, gate the transform on `!element.styleId`.)

## REQ-09: Page chrome matches Google Docs visual style

- [ ] Each page sheet has white background (`#ffffff` light / `#0f172a` dark)
- [ ] Canvas backdrop is flat grey (`#f1f3f4` light / `#0b1220` dark) — NOT the old dotted grid
- [ ] Each page is ~8.5in wide × 11in tall (aspect ratio matches Word page)
- [ ] Each page has 1in inner margins (1in top, 1in left, 1in right, ~1.25in bottom for footer)
- [ ] Drop shadow visible around each page sheet
- [ ] ~24pt vertical gap between stacked page sheets in REQ-05's multi-page layout

---

## Non-rendering acceptance items (Phase Done When)

- [ ] Yjs CRDT sync working (test: open in two browser windows, type in one, see edits appear in other within ~300ms)
- [ ] CommentMark survives across page boundaries (test: add comment on a sentence that spans a page break)
- [ ] InsertionMark / DeletionMark render and survive page boundaries (test: redline a sentence, verify highlight persists)
- [ ] AI redline suggestions panel still opens and emits suggestions
- [ ] Version history panel still shows snapshots
- [ ] Presence bar shows other users in the room
- [ ] Save-status indicator transitions Saving → Saved → just now
- [ ] `pnpm typecheck` exits 0 at every commit

## Out-of-scope deviations (acceptable degradations)

Items that may diverge from Word/Google Docs but are explicitly OUT of this phase's scope per SPEC:
- Word's stored header/footer content (we show auto "Page N of M" only)
- Print-equivalent PDF export
- Mobile / tablet layout
- `.doc` (legacy) and `.pdf` file types — only `.docx` is held to this bar

If a deviation falls into one of these categories, mark it `OUT OF SCOPE` instead of FAIL.

---

## Review log (to be filled during Task 7)

**Reviewer:** ____________
**Date:** ____________
**Editor commit:** ____________
**Word/Google Docs version:** ____________

| REQ | Status (PASS/FAIL/PARTIAL/OUT-OF-SCOPE) | Notes |
|---|---|---|
| REQ-01 | | |
| REQ-02 | | |
| REQ-03 | | |
| REQ-04 | | |
| REQ-05 | | |
| REQ-06 | | |
| REQ-07 | | |
| REQ-08 | | |
| REQ-09 | | |

**Overall phase acceptance:** PASS / FAIL
