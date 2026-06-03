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
  let accumulated = 0;

  for (const block of blocks) {
    const height = block.getBoundingClientRect().height;
    if (height === 0) continue; // Skip hidden/detached

    if (accumulated + height > TARGET_CONTENT_HEIGHT_PX && accumulated > 0) {
      // This block would overflow — break BEFORE it.
      try {
        const pos = view.posAtDOM(block, 0);
        if (pos > 0) breaks.push(pos);
      } catch {
        // posAtDOM throws if block isn't actually in editor DOM yet
        // (e.g. between transactions). Skip — next recompute catches it.
      }
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
      }),
    ];
  },
});
