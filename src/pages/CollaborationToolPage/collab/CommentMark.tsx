import { createYooptaMark } from '@yoopta/editor';

export const CommentMark = createYooptaMark<any>({
  type: 'comment',
  hotkey: 'mod+shift+m',
  render: (props) => {
    const { children, attributes, leaf } = props;
    return (
      <mark
        {...attributes}
        data-comment-id={leaf.commentId}
        className="bg-yellow-200 cursor-pointer border-b-2 border-yellow-400 hover:bg-yellow-300 transition-colors duration-150 dark:bg-amber-500/30 dark:border-amber-400 dark:text-amber-100 dark:hover:bg-amber-500/50"
        title="Click to view comment"
      >
        {children}
      </mark>
    );
  },
});
