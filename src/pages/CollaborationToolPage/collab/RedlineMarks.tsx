import { createYooptaMark } from "@yoopta/editor";

export const InsertionMark = createYooptaMark<any>({
  type: "insertion",
  hotkey: "mod+shift+i",
  render: (props) => {
    const { children, attributes, leaf } = props;
    const author = leaf.author || "Unknown";
    const createdAt = leaf.createdAt || "";
    return (
      <ins
        {...attributes}
        data-redline-id={leaf.redlineId || ""}
        data-author={leaf.authorId || ""}
        title={`Inserted by ${author}${createdAt ? ` • ${createdAt}` : ""}`}
        className="bg-green-50 text-green-800 underline decoration-green-500 decoration-2 underline-offset-2 dark:bg-green-500/15 dark:text-green-200 dark:decoration-green-400"
      >
        {children}
      </ins>
    );
  },
});

export const DeletionMark = createYooptaMark<any>({
  type: "deletion",
  hotkey: "mod+shift+d",
  render: (props) => {
    const { children, attributes, leaf } = props;
    const author = leaf.author || "Unknown";
    const createdAt = leaf.createdAt || "";
    return (
      <del
        {...attributes}
        data-redline-id={leaf.redlineId || ""}
        data-author={leaf.authorId || ""}
        title={`Deleted by ${author}${createdAt ? ` • ${createdAt}` : ""}`}
        className="bg-red-50 text-red-700 line-through decoration-red-500 decoration-2 dark:bg-red-500/15 dark:text-red-200 dark:decoration-red-400"
      >
        {children}
      </del>
    );
  },
});
