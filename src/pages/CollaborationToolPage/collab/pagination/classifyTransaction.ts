// Transaction classifier for the pagination plugin (REQ-05 of phase
// 01-gdocs-editor). The plugin re-paginates differently based on the
// kind of edit:
//
//   "structural" — paste, block delete, image/table/block-node insert,
//                  redline mark application across paragraphs. Must
//                  re-paginate SYNCHRONOUSLY so page boundaries are
//                  correct when the user releases the action.
//
//   "text"       — single-character typing, mark application on existing
//                  text, cursor moves. Re-pagination is DEBOUNCED via
//                  requestIdleCallback (~150ms) so typing stays buttery
//                  — a few pixels of pagination drift during fast typing
//                  is invisible to the user, but per-keystroke measure+
//                  reflow on a 30-page doc would freeze the editor.
//
//   "noop"       — selection-only transactions, plugin state updates
//                  with no doc change. Skip pagination entirely.

import type { Transaction } from "@tiptap/pm/state";

export type TransactionKind = "structural" | "text" | "noop";

/**
 * Classify a ProseMirror transaction by inspecting its steps. Pure
 * function — no DOM access, no plugin state lookups. Cheap to call
 * on every transaction.
 */
export function classifyTransaction(tr: Transaction): TransactionKind {
  if (!tr.docChanged) return "noop";

  for (const step of tr.steps) {
    const json = step.toJSON() as {
      stepType?: string;
      slice?: { content?: unknown[] };
      from?: number;
      to?: number;
    };

    // Replace steps are the workhorse — both typing and paste use them.
    // Heuristic: a slice with >1 top-level node OR a slice whose top-level
    // node is anything other than a text-leaf paragraph = structural.
    // Single-char insert into an existing paragraph = text.
    if (json.stepType === "replace" || json.stepType === "replaceAround") {
      const sliceContent = json.slice?.content;

      // No slice content = pure deletion. Span size matters:
      // single-char delete (typing backspace) = text; range delete = structural.
      if (!sliceContent || sliceContent.length === 0) {
        const span = (json.to ?? 0) - (json.from ?? 0);
        return span > 1 ? "structural" : "text";
      }

      // Multi-node slice (paste of multiple paragraphs/blocks) = structural.
      if (sliceContent.length > 1) return "structural";

      // Single-node slice — check if it's a structural node type.
      // ProseMirror serializes nodes as { type, content?, text?, attrs? }.
      const firstNode = sliceContent[0] as {
        type?: string;
        content?: unknown[];
        text?: string;
      };
      const nodeType = firstNode?.type;
      if (
        nodeType === "image" ||
        nodeType === "table" ||
        nodeType === "tableRow" ||
        nodeType === "heading" ||
        nodeType === "bulletList" ||
        nodeType === "orderedList" ||
        nodeType === "blockquote" ||
        nodeType === "codeBlock" ||
        nodeType === "horizontalRule"
      ) {
        return "structural";
      }

      // Inserting a fresh paragraph (Enter at end of block) is structural
      // because it changes the block count — pagination must re-run to
      // recheck whether the new block fits.
      if (nodeType === "paragraph" && firstNode.content) {
        return "structural";
      }

      // Single text node inside an existing block = pure typing.
      return "text";
    }

    // Mark-only steps (bold, italic, link, redline marks) don't change
    // block structure, only inline formatting. Text classification is
    // correct — these can debounce.
    if (json.stepType === "addMark" || json.stepType === "removeMark") {
      return "text";
    }

    // Unknown step type — be conservative, treat as structural.
    return "structural";
  }

  return "noop";
}
