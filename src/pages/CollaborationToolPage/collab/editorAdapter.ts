// EditorAdapter — a small uniform API that both the Yoopta and TipTap
// panels publish to the page (`index.tsx`) so the shared AI / redline /
// version-history flows can drive either editor.
//
// The two editors have very different state models (Yoopta JSON tree vs
// ProseMirror state) so this adapter intentionally keeps the surface
// narrow: just the operations the page actually needs.

import type * as Y from "yjs";
import type { RedlineSpan } from "./redlineScan";
import type { DocumentMode } from "./superdocBridge";

export type EditorKind = "yoopta" | "tiptap" | "superdoc";

export type EditorAdapter = {
  /** Identifies which editor is mounted. Mainly for debug. */
  kind: EditorKind;
  /** The Y.Doc backing this editor. Shared with other clients via the
   *  collab provider; used by `useCollabVersions` to persist the
   *  version history list/snapshots into a place every client sees.
   *  Absent for the SuperDoc iframe adapter (no host-side Y.Doc). */
  doc?: Y.Doc;
  /** Serialize the current document for version snapshots. */
  getSnapshot: () => unknown;
  /** Restore a previous snapshot. */
  setSnapshot: (snapshot: unknown) => void;
  /** Extract every redlined span (insertion + deletion marks). */
  extractRedlines: () => RedlineSpan[];
  /** Replace the text of a redlined span by id. Strips the mark in the
   *  process (so accepted/rejected redlines no longer render). */
  replaceRedline: (redlineId: string, replacement: string) => void;
  /** Anchor a comment at the editor's current selection. Resolves the new
   *  document-comment id, or null when anchoring fails/times out (caller
   *  saves the comment unanchored). Only the SuperDoc iframe adapter
   *  implements this. */
  anchorComment?: (text: string) => Promise<string | null>;
  /** Switch the editor's live edit permission after load — used by the
   *  turn-based redline negotiation to make the non-turn-holder read-only.
   *  Only the SuperDoc iframe adapter implements this. */
  setMode?: (mode: DocumentMode) => void;
};
