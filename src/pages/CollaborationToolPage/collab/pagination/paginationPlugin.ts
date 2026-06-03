// Pagination plugin for REQ-05 of phase 01-gdocs-editor. Walks the
// rendered editor DOM after each transaction, measures block heights,
// and computes ProseMirror doc positions where pages break.
//
// Design constraints (from CONTEXT.md, refined after y-prosemirror
// investigation 260603):
//   • Page boundaries are derived per-client — NEVER stored in Y.Doc.
//     This plugin never modifies doc state; it only stores positions
//     in its own PluginState and emits a no-op transaction (meta-only)
//     to broadcast updates to the React layer.
//   • Pure ProseMirror plugin — no NodeView, no schema additions, no
//     y-prosemirror interaction. The React wrapper (TipTapEditorPanel)
//     subscribes to PluginState and renders the visual page chrome
//     via DOM mutation. Failure mode is "page divs briefly missing",
//     never Yjs corruption.
//   • Hybrid recompute timing: structural transactions (paste, block
//     delete, image/table insert) re-paginate on the next rAF tick
//     (within one frame, before the user sees stale boundaries);
//     pure-text transactions debounce ~150ms via setTimeout so typing
//     stays buttery.

import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension } from "@tiptap/core";
import { classifyTransaction } from "./classifyTransaction";

// Target page CONTENT height in CSS pixels. 9in × 96dpi = 864px would
// be the strict Word-page-equivalent value, but our paragraph spacing
// and font metrics don't match Word exactly — strict 864 produces ~3.5x
// more pages than Word reports for the same doc. Calibrated empirically
// 260603 to 1100px so the Hyperscale supply agreement renders in the
// ballpark of Word's reported page count (target ~27-32 pages per SPEC
// REQ-05 acceptance). If a future corpus skews this, tune here.
const TARGET_CONTENT_HEIGHT_PX = 1100;
const PAGE_MARGIN_PX = 96; // 1in at 96dpi
const TARGET_TOTAL_PAGE_HEIGHT_PX = TARGET_CONTENT_HEIGHT_PX + 2 * PAGE_MARGIN_PX;

export type PaginationState = {
  /** Doc positions where each page ENDS. pageBreaks[0] = end of page 1, etc. */
  pageBreaks: number[];
  /** Total page count, == pageBreaks.length + 1 */
  totalPages: number;
  /** Extra padding-bottom (px ABOVE the CSS default 96px = 1in) to apply
   *  to each page's page-end block so the page's total rendered height
   *  equals TARGET_TOTAL_PAGE_HEIGHT_PX. Index = page number - 1. Pages
   *  with naturally-tall content (single-block overflow like Force
   *  Majeure paragraph) get extra = 0 — those pages remain naturally
   *  tall. The decoration layer reads this and emits inline
   *  `padding-bottom` style on each page-end. */
  pageEndExtraPadding: number[];
  /** Set to "structural" or "text" by `apply` when a transaction lands
   *  that requires recompute. Cleared to null after the next compute. */
  pendingRecompute: "structural" | "text" | null;
  /** Wall-clock timestamp of last successful recompute. */
  lastRecomputeAt: number;
};

export const paginationPluginKey = new PluginKey<PaginationState>("pagination");

const arraysEqual = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
};

/**
 * Read any inline padding-bottom we previously applied to this block.
 * Returns the EXTRA padding above the CSS default (96px = 1in for
 * page-end blocks). For non-page-end blocks (no inline override),
 * returns 0. Used to subtract previously-applied extras from rect
 * heights when computing natural content heights — ensures convergence
 * of the dynamic-padding feedback loop. */
function getInlineExtraPadding(block: HTMLElement): number {
  const inlinePb = block.style.paddingBottom;
  if (!inlinePb) return 0;
  const match = inlinePb.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (!match) return 0;
  const inlineValue = parseFloat(match[1]);
  return Math.max(0, inlineValue - PAGE_MARGIN_PX);
}

/**
 * Walk the rendered editor DOM, measure each top-level block's height
 * (subtracting any previously-applied extra padding for convergence
 * stability), emit break positions and per-page natural content heights.
 *
 * Returns:
 *   breaks            - ProseMirror doc offsets where each new page starts
 *   naturalPageHeights - rendered height of each page assuming no extra
 *                        padding has been applied (so dynamic padding
 *                        computation is stable across iterations)
 */
function computePagination(view: EditorView): {
  breaks: number[];
  naturalPageHeights: number[];
} {
  const root = view.dom;
  const blocks = Array.from(root.children) as HTMLElement[];

  const offsets: number[] = [];
  view.state.doc.forEach((_node, offset) => {
    offsets.push(offset);
  });

  const breaks: number[] = [];
  const naturalPageHeights: number[] = [];
  let accumulated = 0;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const rect = block.getBoundingClientRect().height;
    if (rect === 0) continue;
    // Subtract any previously-applied extra padding so the height we
    // accumulate represents the block's "natural" rendered size. This
    // makes the dynamic-padding feedback loop converge: new_extra is
    // computed from natural heights, not heights already inflated by
    // last iteration's extras.
    const height = rect - getInlineExtraPadding(block);

    if (accumulated + height > TARGET_CONTENT_HEIGHT_PX && accumulated > 0) {
      // Break BEFORE this block. Previous block was the page-end.
      const pos = offsets[i];
      if (pos !== undefined && pos > 0) breaks.push(pos);
      naturalPageHeights.push(accumulated);
      accumulated = height;
    } else {
      accumulated += height;
    }
  }
  // Last page (no trailing break).
  if (accumulated > 0) naturalPageHeights.push(accumulated);

  return { breaks, naturalPageHeights };
}

/**
 * Compute the per-page extra padding needed to make every page reach
 * TARGET_TOTAL_PAGE_HEIGHT_PX. Pages with naturally-tall content
 * (overflow case, e.g. Force Majeure single paragraph) get extra = 0
 * — those pages remain at their natural height. All other pages get
 * padded to exactly TARGET_TOTAL_PAGE_HEIGHT_PX.
 */
function computeExtraPaddings(naturalPageHeights: number[]): number[] {
  return naturalPageHeights.map((h) =>
    Math.max(0, TARGET_TOTAL_PAGE_HEIGHT_PX - h)
  );
}

const arraysApproxEqual = (a: number[], b: number[], epsilon = 1): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (Math.abs(a[i] - b[i]) > epsilon) return false;
  }
  return true;
};

export const PaginationExtension = Extension.create({
  name: "pagination",

  addProseMirrorPlugins() {
    return [
      new Plugin<PaginationState>({
        key: paginationPluginKey,

        state: {
          init: () => ({
            pageBreaks: [],
            totalPages: 1,
            pageEndExtraPadding: [],
            pendingRecompute: "structural", // recompute on first mount
            lastRecomputeAt: 0,
          }),

          apply(tr, prev) {
            // Internal meta-set transaction from view().recompute below.
            const meta = tr.getMeta(paginationPluginKey) as
              | {
                  type: "set-pagination";
                  breaks: number[];
                  pageEndExtraPadding: number[];
                }
              | undefined;
            if (meta?.type === "set-pagination") {
              return {
                pageBreaks: meta.breaks,
                totalPages: meta.breaks.length + 1,
                pageEndExtraPadding: meta.pageEndExtraPadding,
                pendingRecompute: null,
                lastRecomputeAt: performance.now(),
              };
            }

            const kind = classifyTransaction(tr);
            if (kind === "structural") {
              return { ...prev, pendingRecompute: "structural" };
            }
            // Don't downgrade a pending structural recompute to text.
            if (kind === "text" && prev.pendingRecompute !== "structural") {
              return { ...prev, pendingRecompute: "text" };
            }
            return prev;
          },
        },

        view(view) {
          let textDebounceTimer: number | null = null;
          let rafHandle: number | null = null;
          let destroyed = false;

          const setTotalPagesCssVar = (totalPages: number) => {
            // Walk up from view.dom to find the .ct-tiptap-multipage
            // container (where the CSS default `--total-pages: "1"`
            // lives, alongside the counter-reset). Set the inline style
            // ON THAT element — inline style wins over the stylesheet
            // default on the same element via cascade.
            //
            // BUG FIXED 260603: previously set the var on the OUTER
            // .ct-editor-canvas. The default declaration on the inner
            // multipage container shadowed the inherited value from
            // canvas — descendants read the default "1" instead of the
            // runtime total. Footer rendered as "Page 5 of 1".
            //
            // QUOTING: the value must be wrapped in CSS string quotes
            // so it can concatenate with the rest of the `content:`
            // string in the ::after rule. Unquoted numbers resolve as
            // <integer> tokens which CSS `content:` won't mix with
            // <string> tokens — pseudo-element silently fails to render.
            let el: HTMLElement | null = view.dom as HTMLElement;
            while (el && !el.classList.contains("ct-tiptap-multipage")) {
              el = el.parentElement;
            }
            if (el) {
              el.style.setProperty("--total-pages", `"${totalPages}"`);
            }
          };

          const recompute = () => {
            if (destroyed) return;
            rafHandle = null;
            const { breaks, naturalPageHeights } = computePagination(view);
            const pageEndExtraPadding = computeExtraPaddings(naturalPageHeights);
            const cur = paginationPluginKey.getState(view.state);
            if (!cur) return;
            // Skip dispatch if both breaks AND extras are unchanged.
            // Approximate-equal on extras (1px tolerance) so floating-
            // point drift doesn't cause continuous re-dispatches.
            if (
              arraysEqual(breaks, cur.pageBreaks) &&
              arraysApproxEqual(pageEndExtraPadding, cur.pageEndExtraPadding) &&
              cur.pendingRecompute === null
            ) {
              return;
            }
            view.dispatch(
              view.state.tr.setMeta(paginationPluginKey, {
                type: "set-pagination",
                breaks,
                pageEndExtraPadding,
              }),
            );
            setTotalPagesCssVar(breaks.length + 1);
          };

          const scheduleStructural = () => {
            if (rafHandle !== null) return;
            rafHandle = requestAnimationFrame(recompute);
          };

          const scheduleText = () => {
            if (textDebounceTimer !== null) clearTimeout(textDebounceTimer);
            textDebounceTimer = window.setTimeout(() => {
              textDebounceTimer = null;
              recompute();
            }, 150);
          };

          // Initial pagination after mount — wait one frame so the
          // editor has actually rendered before we measure.
          scheduleStructural();

          // Initial CSS var write so footer renders even before first
          // recompute lands (avoids briefly showing "Page 1 of 0").
          setTotalPagesCssVar(1);

          return {
            update(view, prevState) {
              const prev = paginationPluginKey.getState(prevState);
              const cur = paginationPluginKey.getState(view.state);
              if (!cur || cur.pendingRecompute === null) return;
              if (prev?.pendingRecompute === cur.pendingRecompute) {
                // Already scheduled.
                return;
              }
              if (cur.pendingRecompute === "structural") {
                scheduleStructural();
              } else {
                scheduleText();
              }
            },
            destroy() {
              destroyed = true;
              if (textDebounceTimer !== null) clearTimeout(textDebounceTimer);
              if (rafHandle !== null) cancelAnimationFrame(rafHandle);
            },
          };
        },

        props: {
          // Emit node decorations marking which top-level block belongs
          // to which page, and which blocks are page-start / page-end.
          // CSS uses these attrs (collaboration.css) to render the
          // visual page chrome: white sheet backgrounds via
          // [data-page-start] gradients, drop shadows via
          // [data-page-end], and the "Page N of M" footer via
          // [data-page-end]::after using attr(data-page-num) and
          // var(--total-pages).
          decorations(state) {
            const ps = paginationPluginKey.getState(state);
            if (!ps) return null;
            const { pageBreaks, totalPages } = ps;
            const decorations: Decoration[] = [];

            // Walk top-level blocks. Track each block's start position
            // and which page it belongs to.
            let blockIndex = 0;
            let currentPage = 1;
            let pageBreakIdx = 0;
            const blockMeta: Array<{
              from: number;
              to: number;
              page: number;
              isPageStart: boolean;
              isPageEnd: boolean;
            }> = [];

            state.doc.forEach((node, offset) => {
              const from = offset;
              const to = offset + node.nodeSize;

              // Did we just cross a page break? pageBreaks[pageBreakIdx]
              // is the position where the next page STARTS. If this
              // block's `from` equals that position, we're now on the
              // next page and this block is its first.
              if (
                pageBreakIdx < pageBreaks.length &&
                from === pageBreaks[pageBreakIdx]
              ) {
                currentPage += 1;
                pageBreakIdx += 1;
              }

              blockMeta.push({
                from,
                to,
                page: currentPage,
                isPageStart: false,
                isPageEnd: false,
              });
              blockIndex += 1;
            });

            // Mark page-start / page-end. A block is page-start if it's
            // index 0 OR if the previous block is on a different page.
            // A block is page-end if it's the last block OR if the next
            // block is on a different page.
            for (let i = 0; i < blockMeta.length; i += 1) {
              const cur = blockMeta[i];
              const prev = i > 0 ? blockMeta[i - 1] : null;
              const next = i < blockMeta.length - 1 ? blockMeta[i + 1] : null;
              if (!prev || prev.page !== cur.page) cur.isPageStart = true;
              if (!next || next.page !== cur.page) cur.isPageEnd = true;
            }

            blockMeta.forEach((m) => {
              const attrs: Record<string, string> = {
                "data-page-num": String(m.page),
              };
              if (m.isPageStart) attrs["data-page-start"] = "true";
              if (m.isPageEnd) {
                attrs["data-page-end"] = "true";
                // Dynamic per-page padding so every page reaches
                // TARGET_TOTAL_PAGE_HEIGHT_PX. extras are computed in
                // view().recompute from natural per-page content heights
                // (subtracting any previously-applied extras for
                // convergence stability). Pages with naturally-tall
                // content (single-block overflow like Force Majeure
                // paragraph) get extra = 0; those pages remain at their
                // natural height.
                const extra = ps.pageEndExtraPadding[m.page - 1] ?? 0;
                const totalPaddingBottomPx = PAGE_MARGIN_PX + extra;
                attrs.style = `padding-bottom: ${totalPaddingBottomPx}px; box-sizing: border-box;`;
              }
              decorations.push(Decoration.node(m.from, m.to, attrs));
            });

            // totalPages reference — kept to silence unused-var if we
            // ever drop the CSS-var path; CSS reads it via --total-pages.
            void totalPages;
            void blockIndex;

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
