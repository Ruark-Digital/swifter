// TipTap editor hook bound to a Yjs doc + WebsocketProvider.
//
// Created for phase quick/260518-collab-tiptap-migration sub-phase 1.
// Tracer-bullet wiring only — no redline marks, no comment marks, no AI
// extensions yet. Those land in sub-phases 2 & 3 against this hook.

import { useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { CollabUser } from "./useCollabProvider";
import { CommentMark } from "./marks/commentMark";
import { InsertionMark } from "./marks/insertionMark";
import { DeletionMark } from "./marks/deletionMark";

// NOTE on presence carets (in-editor cursors):
// `@tiptap/extension-collaboration-cursor@2.x` is the only published
// cursor extension at install time, and it crashes against TipTap v3's
// `Collaboration` extension — they ship different `ySyncPluginKey`
// instances (cursor v2 imports from `y-prosemirror`, Collaboration v3
// from `@tiptap/y-tiptap`), so the cursor plugin's `ystate` lookup
// returns undefined and reading `ystate.doc` throws. Until a v3 cursor
// extension lands upstream, we ship without in-editor carets — the
// PresenceBar at the top of the page (avatar stack from Yjs awareness)
// still works. Re-introduce by wrapping `yCursorPlugin` from
// `@tiptap/y-tiptap` directly in a custom Extension.

export type UseTipTapEditorArgs = {
  doc: Y.Doc;
  provider: WebsocketProvider | undefined;
  localUser: CollabUser | null;
};

export function useTipTapEditor({
  doc,
  provider,
  localUser,
}: UseTipTapEditorArgs): Editor | null {
  // Silence unused-arg warnings — `provider` and `localUser` are kept
  // in the signature so the hook is ready to accept them once we wrap
  // `@tiptap/y-tiptap`'s yCursorPlugin in a custom v3-compatible
  // extension.
  void provider;
  void localUser;

  const extensions = [
    // Yjs handles undo/redo via Y.UndoManager; disable StarterKit's
    // local history extension to avoid two competing history stacks.
    // (TipTap v3 renamed the option from `history` to `undoRedo`.)
    StarterKit.configure({ undoRedo: false }),
    Collaboration.configure({ document: doc }),
    // Per-block alignment (left/center/right/justify). Adds a `textAlign`
    // attr to paragraph + heading nodes; round-trips through getJSON /
    // setContent and syncs over the Y.Doc like any other node attribute.
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    // Enable <img> nodes so mammoth's base64 inline images survive
    // setContent. Without this StarterKit silently strips <img> tags
    // on import and embedded DOCX images vanish. `inline: false` keeps
    // images as block-level (matches Word's default behavior).
    Image.configure({ inline: false, allowBase64: true }),
    CommentMark,
    InsertionMark,
    DeletionMark,
  ];

  // Key the editor on doc identity — when the room changes the parent
  // creates a fresh Y.Doc; useEditor cleans up the previous instance.
  const editor = useEditor(
    {
      extensions,
      // Don't seed initial content here. Collaboration extension hydrates
      // from the Y.Doc once provider sync completes. Setting content
      // synchronously would race with sync and overwrite remote state.
      content: undefined,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc, provider],
  );

  return editor;
}
