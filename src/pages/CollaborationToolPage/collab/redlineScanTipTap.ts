// ProseMirror-flavored version of `collab/redlineScan.ts`.
//
// Same `RedlineSpan` shape as the Yoopta scan — keeps the AI redline
// endpoint and the sidebar UI wire-compatible across both editor paths.
//
// `extractRedlines` walks the document, finds text spans carrying our
// `insertion` / `deletion` marks, de-dupes by `redlineId` (a single mark
// can span multiple ProseMirror text leaves when other marks intersect).
//
// `replaceRedline` runs a single transaction: find every range with the
// matching mark, replace the first occurrence's text with `replacement`,
// strip the mark from all matching ranges, and delete any duplicate
// trailing ranges. Mirrors the Yoopta util's "first-write-wins" approach.

import type { Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";

export type RedlineKind = "insertion" | "deletion";

export type RedlineSpan = {
  redlineId: string;
  kind: RedlineKind;
  text: string;
  author?: string;
  createdAt?: string;
};

/** Walk the doc and collect all redlined spans, de-duped by redlineId. */
export function extractRedlinesFromEditor(editor: Editor): RedlineSpan[] {
  const out = new Map<string, RedlineSpan>();
  editor.state.doc.descendants((node) => {
    if (!node.isText) return true;
    for (const mark of node.marks) {
      if (mark.type.name !== "insertion" && mark.type.name !== "deletion") {
        continue;
      }
      const redlineId = mark.attrs.redlineId as string | undefined;
      if (!redlineId) continue;
      if (out.has(redlineId)) {
        // Append text from continuation leaves so the final span text
        // contains everything the mark covers.
        const existing = out.get(redlineId)!;
        existing.text += node.text ?? "";
        continue;
      }
      out.set(redlineId, {
        redlineId,
        kind: mark.type.name as RedlineKind,
        text: node.text ?? "",
        author: (mark.attrs.author as string | undefined) ?? undefined,
        createdAt:
          (mark.attrs.createdAt as string | undefined) ?? undefined,
      });
    }
    return true;
  });
  return [...out.values()];
}

type Range = {
  from: number;
  to: number;
  kind: RedlineKind;
};

function findMarkRanges(doc: PMNode, redlineId: string): Range[] {
  const ranges: Range[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    for (const mark of node.marks) {
      if (mark.type.name !== "insertion" && mark.type.name !== "deletion") {
        continue;
      }
      if (mark.attrs.redlineId === redlineId) {
        ranges.push({
          from: pos,
          to: pos + node.nodeSize,
          kind: mark.type.name as RedlineKind,
        });
      }
    }
    return true;
  });
  return ranges;
}

/**
 * Replace every leaf carrying `redlineId` with `replacement` in a
 * single transaction. The first range receives the replacement text;
 * trailing ranges are emptied. Marks are stripped from all ranges.
 *
 * Walks ranges back-to-front so each replacement doesn't invalidate
 * subsequent positions.
 */
export function replaceRedlineInEditor(
  editor: Editor,
  redlineId: string,
  replacement: string,
): boolean {
  const ranges = findMarkRanges(editor.state.doc, redlineId);
  if (ranges.length === 0) return false;

  const { tr } = editor.state;
  const insertionType = editor.state.schema.marks.insertion;
  const deletionType = editor.state.schema.marks.deletion;

  // back-to-front so positions earlier in the doc remain valid
  ranges
    .slice()
    .sort((a, b) => b.from - a.from)
    .forEach((range, idxFromEnd) => {
      const isFirstFromStart = idxFromEnd === ranges.length - 1;
      if (insertionType) tr.removeMark(range.from, range.to, insertionType);
      if (deletionType) tr.removeMark(range.from, range.to, deletionType);
      if (isFirstFromStart) {
        // First (foremost) range gets the replacement text. We do this
        // last in the sorted iteration because it has the lowest `from`.
        if (replacement) {
          tr.insertText(replacement, range.from, range.to);
        } else {
          tr.delete(range.from, range.to);
        }
      } else {
        // Trailing ranges: drop their text so the visible result is
        // exactly one copy of the replacement, mirroring the Yoopta
        // util's first-write-wins semantics.
        tr.delete(range.from, range.to);
      }
    });

  editor.view.dispatch(tr);
  return true;
}
