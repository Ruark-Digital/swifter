---
phase: 01-gdocs-editor-spec
created: 2026-06-03
ambiguity_score: 0.142
ambiguity_gate: passed
---

# SPEC — Google-Docs-style Collaborative Document Editor (Engine Spike)

## Goal

Choose an editor architecture that can render imported Word `.docx` legal contracts with **review-grade visual fidelity** matching Google Docs / Microsoft Word — including true multi-page sheets that reflow correctly under collaborative editing — while preserving the existing Yjs CRDT spine, redline marks, AI suggestions, and version history.

This SPEC scopes a **timeboxed engine evaluation (spike) that ends with a go/no-go decision and a chosen engine**. The full rebuild that follows the decision is OUT of this SPEC and will get its own spec once the engine is fixed.

## Why

The current TipTap tracer-bullet panel ([src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx](src/pages/CollaborationToolPage/components/TipTapEditorPanel.tsx)) was built as a sub-phase-1 sync proof-of-concept and has been iteratively patched throughout this session (alignment recovery, base64 images, Times-12pt page-chrome CSS, TOC double-anchor flex layout). Each patch fixed a visible regression but compounding evidence — page-break gutter rendering at top of doc, TOC alignment depending on `:has()`, Yoopta panel still broken — shows the architecture is not load-bearing for review fidelity at the level lawyers need (cross-referencing "clause 7.3, page 19" against a Word source).

The fundamental open question is whether TipTap + a custom ProseMirror `Page` node + a deterministic pagination plugin can deliver Word-equivalent rendering under CRDT sync, or whether a different engine (SuperDoc, OnlyOffice editor SDK, Slate-Pages, Yjs-on-ProseMirror-from-scratch) is the right foundation. We don't yet have evidence either way — this spike produces that evidence.

## Falsifiable Requirements

### REQ-EVAL-01: Reference doc corpus

**Current state:** No curated test set. Session has used the Hyperscale supply agreement ad-hoc.

**Target state:** A `.qa/reference-docs/` directory containing **at least 3** representative `.docx` files committed to the repo: (a) the Hyperscale supply agreement (long contract with TOC, multi-page, images), (b) a short 1–3 page contract (e.g. NDA), (c) a contract with a complex table (e.g. payment schedule or KPI table). Each file is accompanied by a `*.expected.md` describing the 15–20 visual features that must render correctly.

**Acceptance:**
- [ ] `.qa/reference-docs/` exists with ≥3 `.docx` files
- [ ] Each file has a paired `.expected.md` enumerating expected visual features (fonts, alignment, images, TOC, tables, headings, lists, page boundaries)
- [ ] Files compile-load in the existing mammoth + pdfjs pipelines without errors (baseline measurement, not pass criterion)

### REQ-EVAL-02: Screenshot-diff harness

**Current state:** Manual eyeballing in browser vs. opening source in Word.

**Target state:** A Playwright-based runner under `.qa/scripts/editor-fidelity.mjs` that:
1. Loads each reference doc into a candidate editor at a fixed viewport (1280×1600, deterministic font availability via the test runner's stylesheets).
2. Captures full-page screenshots of the rendered doc, one per page boundary.
3. Compares against a baseline image set checked into `.qa/reference-docs/baselines/{engine}/` using pixel-diff with configurable tolerance.
4. Emits a JSON report (`.qa/reports/fidelity-{engine}.json`) with per-feature pass/fail derived from the `.expected.md` checklist (manual annotation step; harness does NOT auto-detect features — it executes the comparison).

**Acceptance:**
- [ ] Runner produces deterministic output on the same machine (idempotent)
- [ ] Runner works offline (no external font/image fetches)
- [ ] Tolerance threshold documented (e.g. 2% pixel difference allowed for anti-aliasing)
- [ ] Runner generates baselines via `--update-baselines` flag

### REQ-EVAL-03: Engine candidates evaluated

**Current state:** Two engines partially explored — TipTap (tracer bullet), Yoopta (default panel).

**Target state:** The following candidates are evaluated against the harness, with **a written one-page-max evaluation note per candidate** under `.planning/quick/260603-gdocs-editor-spec/eval/{candidate}.md`:

1. **TipTap + custom `Page` ProseMirror node + pagination plugin** (extends current architecture)
2. **SuperDoc** (TipTap-based commercial doc editor with built-in pagination)
3. **OnlyOffice Document Editor SDK** (commercial; iframe-embedded full Office stack)
4. **Slate.js with `slate-pages`** (community pagination plugin)
5. **Custom ProseMirror + Yjs** (no TipTap, schema designed from scratch around pages)

Each note must answer: (a) fidelity score on the harness against all 3 reference docs, (b) preservation cost for existing Yjs sync / redline marks / comments / AI suggestions / version history, (c) license and hosting constraints, (d) maintainability evidence (last release, GitHub activity, paid-support availability).

**Acceptance:**
- [ ] 5 evaluation notes written
- [ ] Each has a fidelity score from the harness
- [ ] Each has an integration-cost estimate for the existing collab spine
- [ ] Each has a license/cost summary

### REQ-EVAL-04: CRDT-safe pagination is investigated, not just rendered

**Current state:** No client has exercised concurrent pagination behavior.

**Target state:** For the top-2 candidates by REQ-EVAL-03 fidelity score, a 2-client concurrent-edit test is run: User A inserts ~200 words on page 3 while User B inserts ~200 words on page 7. The test passes if (a) both clients converge to the same document state per Yjs guarantees AND (b) the page-break positions in the converged state are identical on both clients. Failure modes (duplicate inserted pages, page numbering drift, infinite reflow loops) are documented in the evaluation note.

**Acceptance:**
- [ ] Concurrent-edit test specification written
- [ ] Test executed on top-2 candidates
- [ ] Results documented in each candidate's evaluation note with screenshots

### REQ-EVAL-05: Decision document

**Current state:** Architecture is undecided.

**Target state:** A `.planning/quick/260603-gdocs-editor-spec/DECISION.md` that names the chosen engine, lists the top-3 reasons for choosing it over the runners-up, identifies the top-3 known risks of the choice, and recommends a follow-up spec scope for the actual rebuild.

**Acceptance:**
- [ ] DECISION.md written and committed
- [ ] Names a single chosen engine
- [ ] References evaluation notes for justification
- [ ] Lists ≥3 risks of the choice

## Boundaries

### In Scope

- Evaluating 5 candidate engines against a curated 3-doc test corpus
- Building the screenshot-diff fidelity harness
- Investigating CRDT-safe pagination behavior on the top-2 candidates
- Producing per-candidate evaluation notes and a final DECISION.md
- Curating the test corpus (3 representative `.docx` files + expected-features lists)

### Out of Scope (Explicit)

- **Implementing the chosen architecture.** Build phase is a SEPARATE spec written AFTER this one ships.
- **Authoring fidelity.** Users creating new docs from blank canvas with Word-quality typography is not a goal; new docs may look basic.
- **Print / PDF export fidelity.** No requirement that exported PDFs match Word.
- **PDF and `.doc` (legacy) import fidelity.** Only `.docx` is held to the new bar; PDFs and `.doc` render at whatever quality the current `pdfjs`/`mammoth` paths deliver.
- **Yoopta editor panel parity.** The default Yoopta panel ([src/pages/CollaborationToolPage/components/EditorPanel.tsx](src/pages/CollaborationToolPage/components/EditorPanel.tsx)) is untouched. Only the `?editor=tiptap`-or-replacement path is in scope for the rebuild.
- **Pre-existing TipTap session patches.** All uncommitted working-tree changes (TextAlign extension, Image extension, mammoth alignment recovery, Times-12pt CSS, TOC double-anchor) are REVERTED at the start of this phase so the evaluation runs against a clean baseline. They are reinstated only if TipTap wins the evaluation.

### Assumptions (Below-minimum dimensions flagged in Ambiguity Report — none — but noted for planner)

- **Source headers/footers from DOCX**: Not explicitly excluded by the user. Assumption: the chosen engine renders auto-generated "Page N of M" footers; reproducing the source DOCX's stored header/footer content is a *nice-to-have* for the build phase, not an evaluation criterion. Confirm in build-phase spec.
- **Mobile / tablet support**: Not explicitly excluded. Assumption: desktop browsers (Chrome / Edge / Safari / Firefox latest 2 versions) are the evaluation target; mobile is unconstrained.

## Constraints

- **Yjs CRDT sync MUST be preserved.** Any candidate that requires abandoning Yjs is automatically disqualified.
- **Existing collab features must have a clear preservation path** in the chosen engine — redline marks (CommentMark, InsertionMark, DeletionMark), AI suggestions ([collab/useAiRedlineSuggestions.ts](src/pages/CollaborationToolPage/collab/useAiRedlineSuggestions.ts)), version history ([collab/useCollabVersions.ts](src/pages/CollaborationToolPage/collab/useCollabVersions.ts), [collab/useFileVersionsApi.ts](src/pages/CollaborationToolPage/collab/useFileVersionsApi.ts)), presence bar, save-status indicator. "Clear preservation path" means a documented mapping for each feature in the candidate's evaluation note, not a working port.
- **No SaaS-only dependencies** that send doc content off-customer-VPC. Self-hostable engines only; SaaS engines (e.g. if SuperDoc requires a hosted API) must be ruled out unless they offer an on-prem deployment.
- **Timebox: 1 calendar week** for the spike. If the harness can't be built or evaluations can't complete in that window, surface the slip explicitly and re-scope; do not silently extend.

## Acceptance Criteria (Phase Done When)

- [ ] `.qa/reference-docs/` corpus exists (3 `.docx` + 3 `.expected.md`)
- [ ] `.qa/scripts/editor-fidelity.mjs` runner works deterministically and offline
- [ ] 5 evaluation notes written, each with fidelity score + integration cost + license
- [ ] CRDT-safe pagination tested on top-2 candidates
- [ ] `DECISION.md` names a chosen engine with reasoning and risks
- [ ] All artifacts committed
- [ ] User has reviewed DECISION.md and approved (or rejected → re-scope)

## Ambiguity Report

| Dimension | Final Score | Min | Status |
|---|---|---|---|
| Goal Clarity | 0.92 | 0.75 | ✓ |
| Boundary Clarity | 0.92 | 0.70 | ✓ |
| Constraint Clarity | 0.75 | 0.65 | ✓ |
| Acceptance Criteria | 0.78 | 0.70 | ✓ |

**Final ambiguity: 0.142** (gate ≤ 0.20 — passed)

### Resolved through interview

- **Use case** locked to *review fidelity* (lawyers comparing against source), not authoring or print
- **Input type** locked to `.docx` only — PDFs and `.doc` excluded
- **Page model** locked to *true multi-page sheets* (non-negotiable for the "see clause 7.3 on page 19" workflow)
- **Verification method** locked to *automated screenshot-diff harness* (Playwright + baseline PNGs + tolerance)
- **Working-tree state** locked to *revert and start clean* before evaluation
- **Scope structure** locked to *spike-then-build* — this SPEC covers only the spike

### Open (acknowledged, planner-driven)

- The specific tolerance threshold for pixel-diff (REQ-EVAL-02) — to be tuned during baseline curation
- Whether SuperDoc has an on-prem deployment option (REQ-EVAL-03 line item)
- The exact viewport / font-stack the harness runs against — picked deterministically by planner

## Next

`/gsd-discuss-phase` — load this SPEC and produce a PLAN.md with concrete tasks, owner assignments, and the 1-week timeline broken into days.
