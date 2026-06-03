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

// Target page CONTENT height in CSS pixels. 9in × 96dpi = 864px.
// This is the height available for content INSIDE a page after the
// 1in top/bottom margins (page is 11in total). The React layer reads
// the corresponding CSS custom property (--page-content-height) to
// keep page-sheet dimensions in sync with the measurement target.
const TARGET_CONTENT_HEIGHT_PX = 864;

export type PaginationState = {
  /** Doc positions where each page ENDS. pageBreaks[0] = end of page 1, etc. */
  pageBreaks: number[];
  /** Total page count, == pageBreaks.length + 1 */
  totalPages: number;
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
 * Walk the rendered editor DOM, measuring each top-level block's
 * height, emit break positions whenever accumulated height exceeds the
 * target. Returns ProseMirror doc positions (use editor.state.doc.resolve
 * on them to verify validity).
 */
function computePageBreaks(view: EditorView): number[] {
  const breaks: number[] = [];
  const root = view.dom; // the .ProseMirror element
  const blocks = Array.from(root.children) as HTMLElement[];

  // Collect doc-offset positions for each top-level node, in order. These
  // are BEFORE-block positions (state.doc.forEach gives us the offset
  // right before each child). props.decorations walks the same forEach
  // and compares `from === pageBreaks[i]`, so the positions we push here
  // MUST be these before-block offsets — NOT view.posAtDOM(block, 0)
  // which returns the INSIDE-block position (offset+1).
  //
  // Bug caught 260603 after T5-C shipped: I had push(posAtDOM(...)) which
  // returned N+1 while props.decorations compared against N. No block was
  // ever recognized as a page-start → no chrome rendered.
  const offsets: number[] = [];
  view.state.doc.forEach((_node, offset) => {
    offsets.push(offset);
  });

  let accumulated = 0;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const height = block.getBoundingClientRect().height;
    if (height === 0) continue; // Skip hidden/detached

    if (accumulated + height > TARGET_CONTENT_HEIGHT_PX && accumulated > 0) {
      // This block would overflow — break BEFORE it. Push the doc offset
      // for this block (NOT a posAtDOM call). Assumes 1:1 correspondence
      // between view.dom.children and state.doc's top-level children,
      // which holds for all TipTap StarterKit + Table + Image nodes.
      const pos = offsets[i];
      if (pos !== undefined && pos > 0) breaks.push(pos);
      accumulated = height;
    } else {
      accumulated += height;
    }
  }

  return breaks;
}

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
            pendingRecompute: "structural", // recompute on first mount
            lastRecomputeAt: 0,
          }),

          apply(tr, prev) {
            // Internal meta-set transaction from view().recompute below.
            const meta = tr.getMeta(paginationPluginKey) as
              | { type: "set-breaks"; breaks: number[] }
              | undefined;
            if (meta?.type === "set-breaks") {
              return {
                pageBreaks: meta.breaks,
                totalPages: meta.breaks.length + 1,
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
            const breaks = computePageBreaks(view);
            const cur = paginationPluginKey.getState(view.state);
            if (!cur) return;
            // Skip dispatch if breaks haven't changed — avoid useless
            // re-renders and React subscriber thrash.
            if (arraysEqual(breaks, cur.pageBreaks) && cur.pendingRecompute === null) {
              return;
            }
            view.dispatch(
              view.state.tr.setMeta(paginationPluginKey, {
                type: "set-breaks",
                breaks,
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
              if (m.isPageEnd) attrs["data-page-end"] = "true";
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
