// TipTap DeletionMark — track-changes deletion (red strikethrough).
// Port of `collab/RedlineMarks.tsx::DeletionMark`. See insertionMark.ts
// for attribute conventions.

import { Mark, mergeAttributes } from "@tiptap/core";

export interface DeletionMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

export type DeletionMarkAttrs = {
  redlineId: string;
  author: string;
  authorId: string;
  createdAt: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    deletionMark: {
      setDeletionMark: (attrs: DeletionMarkAttrs) => ReturnType;
      unsetDeletionMark: () => ReturnType;
    };
  }
}

export const DeletionMark = Mark.create<DeletionMarkOptions>({
  name: "deletion",
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
    return [{ tag: "del[data-redline-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const author = (HTMLAttributes["data-author-name"] as string) || "Unknown";
    const createdAt = (HTMLAttributes["data-created-at"] as string) || "";
    return [
      "del",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        title: `Deleted by ${author}${createdAt ? ` • ${createdAt}` : ""}`,
        class:
          "bg-red-50 text-red-700 line-through decoration-red-500 decoration-2 dark:bg-red-500/15 dark:text-red-200 dark:decoration-red-400",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setDeletionMark:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      unsetDeletionMark:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
