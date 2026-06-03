# docx-preview spike — findings (260603)

**Trigger:** user strategic pivot: *"We are far behind on how the content of the document is rendered compare to how its rendered on the Google docs. I can't be sending screenshots all the time trying to perform minute changes just for it to match and when it does, what about other documents."*

**Goal of spike:** verify whether `docx-preview` (Apache 2.0 license, ~500KB minified) produces meaningfully higher-fidelity DOCX output than mammoth, and whether that output is usable as a foundation for "build SuperDoc-equivalent on this project."

**Spike script:** `docx-preview-spike.mjs` in this directory. Run with `node` from repo root after `pnpm add jsdom -D`.

**Outcome: YES, docx-preview is dramatically better than mammoth.**

## Quantitative comparison

| | mammoth (current) | docx-preview |
|---|---|---|
| Library size (min) | ~225 KB | ~500 KB |
| Body HTML output (Hyperscale) | ~170 KB | ~720 KB |
| Style output | (none) | ~160 KB |
| **Word pages preserved as `<section>`** | ❌ no | ✅ 11 sections |
| **Page dimensions in output** | ❌ no | ✅ `width: 612pt; min-height: 792pt; padding: 72pt` |
| **Centered title block detected** | ❌ required custom transformDocument gate fix (commit c0741f24b) | ✅ `style="text-align: center"` natively |
| **Page breaks** | ❌ required transformParagraph + styleMap rule (commit e2f22c45c) | ✅ natural `<section>` boundaries |
| **Headers / footers** | ❌ not supported | ✅ `<header>` and `<footer>` rendered |
| **Footnotes / endnotes** | ❌ not supported | ✅ supported via options |
| **Lists** | flat `<ol><li>` (we had to flatten to paragraphs for pagination — commit e148e60dc) | rich nested lists with proper Word numbering schemes |
| **Font specs preserved** | ❌ stripped | ✅ inline `font-family`, `font-size`, etc. |
| **Word styles preserved** | ❌ default styleMap only | ✅ class names match Word style IDs (`docx_bodytext`, `docx_prompt`, etc.) |
| **Track changes** | ❌ not supported | ✅ `renderChanges` option (experimental) |
| **Comments** | ❌ not supported | ✅ `renderComments` option (experimental) |

**Effect on the corpus-specific patches we shipped this session:** every one would have been unnecessary if we'd started with docx-preview. The fidelity ceiling that motivated each patch doesn't exist with docx-preview.

## Sample output structure

```html
<div class="docx-wrapper">
  <section class="docx" style="padding: 72pt; width: 612pt; min-height: 792pt;">
    <header style="margin-top: calc(-48px); min-height: calc(48px);">
      <p class="docx_header"></p>
    </header>
    <article>
      <p class="docx_bodytext"></p>
      <p class="docx_bodytext" style="text-align: center;">
        <span style="font-family: &quot;Times New Roman&quot;; min-height: 16pt; font-size: 16pt;">
          Hyperscale Data Center – 35MW Hyperscale Data Center
        </span>
        <span style="...">Shaft Project</span>
      </p>
      ...more paragraphs...
    </article>
  </section>
  <section class="docx">... page 2 ...</section>
  ...11 sections total...
</div>
```

Compare to mammoth's output for the same doc:
```html
<p>Hyperscale Data Center – 35MW Hyperscale Data Center Shaft Project</p>
<p>Supply Agreement</p>
<p><br />between</p>
...flat sequence of paragraphs, no page structure, no alignment, no headers...
```

## Integration with TipTap — the open question

docx-preview's output is **NOT** directly TipTap-editable without losses:

| docx-preview output | TipTap preserves? | Notes |
|---|---|---|
| `<section>` | ❌ stripped | Not a TipTap node; need custom Page extension OR pre-process to `<hr>` markers |
| `<article>` | ❌ stripped | Decorative wrapper; can be stripped during translation |
| `<header>`, `<footer>` | ❌ stripped | Need custom extensions or render as decorations |
| `<p style="text-align: ...">` | ✅ preserved | Our TextAlign extension handles this |
| `<span style="font-family: ...">` | ❌ stripped | TipTap's default text mark doesn't carry inline style; needs custom extension or extract→class |
| `<span class="docx_*">` | ❌ stripped | Class info lost; needs custom extension |
| `<p class="docx_*">` | ❌ stripped | Same |
| Word styles via `<style>` block | ✅ stays in DOM | Survives TipTap because it's outside the editor content |
| `<table>`, `<ol>`, `<ul>` | ✅ preserved | Standard nodes, current extensions handle them |
| `<img>` | ✅ preserved | Image extension already registered |
| `<a href>` | ✅ preserved | Link mark |

## Recommended integration path

**Phase 1 (POC, ~1 week):** Translation layer
- Add `convertDocxViaDocxPreview()` to `fileUtils.tsx` alongside existing `convertDocxToHtml()`
- Inside: call docx-preview's `renderAsync`, extract the resulting HTML
- Translate to TipTap-compatible HTML:
  - `<section>` → emit `<hr class="docx-page-break">` markers (already wired into pagination plugin)
  - `<header>` / `<footer>` → ignore for now (could be decoration overlay in phase 2)
  - `<article>` → unwrap
  - `<span style="font-family/font-size">` → preserve as inline style on a TextStyle mark (need to register the extension)
  - `<p class="docx_*">` → extract Word-style class as data attribute for CSS hooks
  - Keep `<style>` block, prefix all `docx_*` classes for CSS scoping
- Wire `convertDocxViaDocxPreview` as the active path in `TipTapEditorPanel.tsx`
- Verify against Hyperscale + 2 other reference docs (need to source)

**Phase 2 (MVP, ~2-3 weeks):** Custom extensions for fidelity
- TipTap `TextStyle` extension for inline font-family / font-size preservation
- Decoration-based header/footer rendering (overlay layer on top of editor)
- Page-aware pagination using `<section>`-derived breaks (instead of measured-height greedy)
- Word style → CSS variable system for consistent rendering across docs

**Phase 3 (Production, ~2-3 weeks additional):** Export pipeline
- TipTap content → DOCX writer (separate library; `docx` npm package handles writing)
- Round-trip verification

**Effort estimate:** ~6-8 weeks total. Replaces ~150 LOC of mammoth patches with a cleaner architecture.

## Concerns / open risks

1. **docx-preview maintainership** — single maintainer (Volodymyr Baydalka, also Ukrainian indie dev). Last release Apr 2024. Could become unmaintained. Mitigation: we own the integration layer, can fork docx-preview if needed.
2. **Large output size** — 720KB body HTML for one doc. May affect Yjs sync payload sizes for the initial doc seed. Worth measuring.
3. **VML graphics handling** — Hyperscale has some VML (vector graphics from older Word versions); docx-preview tries to render via `requestAnimationFrame` + `getBBox`. Works in browser; may need polish if we encounter docs heavy in VML.
4. **Class collision** — docx-preview's CSS rules apply to `.docx-*` classes globally. If we ever have a `.docx-foo` class for other purposes (we don't currently), there'd be conflict. Mitigation: scope via wrapper class in our translation layer.

## Decision point for user

- **(A) Commit to the rewrite** — abandon mammoth, write a new SPEC for the docx-preview-based pipeline, plan/execute as Phase 02. ~6-8 weeks.
- **(B) Hybrid for now** — keep mammoth as the editing import path, add docx-preview as a separate READ-ONLY preview pane next to the editor (a la VSCode markdown preview). User edits in TipTap; reads in docx-preview's render. ~1-2 weeks.
- **(C) Hold** — defer the rewrite, ship current branch as-is with documented fidelity gaps. Revisit when another corpus surfaces blocking bugs.
