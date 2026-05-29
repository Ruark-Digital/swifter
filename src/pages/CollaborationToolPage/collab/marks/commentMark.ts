// TipTap CommentMark — yellow highlight anchor for sidebar comments.
// Port of `collab/CommentMark.tsx` (Yoopta) to a ProseMirror mark.
//
// Attribute: `commentId` (string) — opaque id matching the comment in
// the sidebar feed. The mark renders <mark data-comment-id> so the
// existing `ct-focus-mark` event handler (queries `[data-comment-id=…]`
// to scroll/flash) keeps working.

import { Mark, mergeAttributes } from "@tiptap/core";

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commentMark: {
      setCommentMark: (attrs: { commentId: string }) => ReturnType;
      unsetCommentMark: () => ReturnType;
    };
  }
}

export const CommentMark = Mark.create<CommentMarkOptions>({
  name: "commentMark",
  inclusive: false,
  exitable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-comment-id"),
        renderHTML: (attrs) =>
          attrs.commentId ? { "data-comment-id": attrs.commentId } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "mark[data-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class:
          "bg-yellow-200 cursor-pointer border-b-2 border-yellow-400 hover:bg-yellow-300 transition-colors duration-150 dark:bg-amber-500/30 dark:border-amber-400 dark:text-amber-100 dark:hover:bg-amber-500/50",
        title: "Click to view comment",
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-m": () =>
        this.editor.commands.setCommentMark({
          commentId: crypto.randomUUID(),
        }),
    };
  },

  addCommands() {
    return {
      setCommentMark:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      unsetCommentMark:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
