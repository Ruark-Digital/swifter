// TipTap InsertionMark — track-changes insertion (green underline).
// Port of `collab/RedlineMarks.tsx::InsertionMark` to a ProseMirror mark.
//
// Attributes (kept identical to the Yoopta path so the existing
// `extractRedlines` shape and the AI redline-suggestion API stay
// wire-compatible):
//   • redlineId  — opaque id, used by AI suggestions + `replaceRedline`
//   • author     — display name shown in tooltip
//   • authorId   — user id (email or _id)
//   • createdAt  — ISO timestamp
// Renders <ins data-redline-id …> so the existing `ct-focus-mark`
// scroll-and-flash logic continues to find these by attribute.

import { Mark, mergeAttributes } from "@tiptap/core";

export interface InsertionMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

export type InsertionMarkAttrs = {
  redlineId: string;
  author: string;
  authorId: string;
  createdAt: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insertionMark: {
      setInsertionMark: (attrs: InsertionMarkAttrs) => ReturnType;
      unsetInsertionMark: () => ReturnType;
    };
  }
}

export const InsertionMark = Mark.create<InsertionMarkOptions>({
  name: "insertion",
  inclusive: false,
  exitable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      redlineId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-redline-id"),
        renderHTML: (attrs) =>
          attrs.redlineId ? { "data-redline-id": attrs.redlineId } : {},
      },
      author: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-author-name"),
        renderHTML: (attrs) =>
          attrs.author ? { "data-author-name": attrs.author } : {},
      },
      authorId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-author"),
        renderHTML: (attrs) =>
          attrs.authorId ? { "data-author": attrs.authorId } : {},
      },
      createdAt: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-created-at"),
        renderHTML: (attrs) =>
          attrs.createdAt ? { "data-created-at": attrs.createdAt } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "ins[data-redline-id]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    void node;
    const author = (HTMLAttributes["data-author-name"] as string) || "Unknown";
    const createdAt = (HTMLAttributes["data-created-at"] as string) || "";
    return [
      "ins",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        title: `Inserted by ${author}${createdAt ? ` • ${createdAt}` : ""}`,
        class:
          "bg-green-50 text-green-800 underline decoration-green-500 decoration-2 underline-offset-2 dark:bg-green-500/15 dark:text-green-200 dark:decoration-green-400",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setInsertionMark:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      unsetInsertionMark:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
