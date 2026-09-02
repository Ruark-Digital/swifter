import React, { useCallback } from "react";
import { MessagesSquare } from "lucide-react";
import FeedItem from "./FeedItem";
import WriteComment from "./WriteComment";
import VirtualizedFeedList from "./VirtualizedFeedList";

type FeedAttachment = {
  filename: string;
  size: string;
};

export type CommentsFeedItem = {
  id: string;
  name: string;
  timestamp: string;
  message: string;
  showDot?: boolean;
  attachment?: FeedAttachment | null;
  /** Document anchor id. When present, the row locates the comment on click. */
  anchorId?: string;
};

type CommentsTabProps = {
  avatarPublic: string;
  comments: CommentsFeedItem[];
  commentValue?: string;
  onCommentChange?: (value: string) => void;
  onCommentSubmit?: () => void;
  canWriteComment?: boolean;
  isSubmittingComment?: boolean;
  /** Fired when a comment row is activated; carries the row's document anchor. */
  onCommentSelect?: (comment: CommentsFeedItem) => void;
  /** Id of the comment currently focused in the document. */
  activeCommentId?: string;
};

const ROW_HEIGHT = 104;

const areCommentFeedsEqual = (prev: CommentsFeedItem[], next: CommentsFeedItem[]) => {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    const p = prev[i];
    const n = next[i];
    if (
      p.id !== n.id ||
      p.name !== n.name ||
      p.timestamp !== n.timestamp ||
      p.message !== n.message ||
      p.showDot !== n.showDot ||
      p.anchorId !== n.anchorId ||
      p.attachment?.filename !== n.attachment?.filename ||
      p.attachment?.size !== n.attachment?.size
    ) {
      return false;
    }
  }
  return true;
};

const CommentsEmptyState: React.FC = () => (
  <div className="ct-empty">
    <span className="ct-empty-icon">
      <MessagesSquare size={20} strokeWidth={1.75} />
    </span>
    <p className="ct-empty-title">No comments yet</p>
    <p className="ct-empty-hint">Start the thread — mention a teammate with @ to loop them in.</p>
  </div>
);

const CommentsTab: React.FC<CommentsTabProps> = ({
  avatarPublic,
  comments,
  commentValue,
  onCommentChange,
  onCommentSubmit,
  canWriteComment = false,
  isSubmittingComment = false,
  onCommentSelect,
  activeCommentId,
}) => {
  const renderCommentItem = useCallback(
    (comment: CommentsFeedItem) => (
      <FeedItem
        avatarSrc={avatarPublic}
        name={comment.name}
        timestamp={comment.timestamp}
        message={comment.message}
        attachment={comment.attachment}
        showDot={comment.showDot}
        interactive={Boolean(comment.anchorId)}
        isActive={Boolean(comment.anchorId) && comment.anchorId === activeCommentId}
        onSelect={comment.anchorId ? () => onCommentSelect?.(comment) : undefined}
      />
    ),
    [avatarPublic, activeCommentId, onCommentSelect],
  );

  return (
    <div className="ct-comments-view">
      <div className="ct-section-header">
        <span className="ct-section-title">Comments and activity</span>
        {comments.length > 0 && (
          <span className="ct-count-pill">{comments.length}</span>
        )}
      </div>

      <WriteComment
        value={commentValue}
        onChange={onCommentChange}
        onSubmit={onCommentSubmit}
        disabled={!canWriteComment}
        isSubmitting={isSubmittingComment}
      />

      {comments.length === 0 ? (
        <CommentsEmptyState />
      ) : (
        <VirtualizedFeedList
          className="ct-feed"
          items={comments}
          itemHeight={ROW_HEIGHT}
          getItemKey={(item) => item.id}
          renderItem={renderCommentItem}
        />
      )}
    </div>
  );
};

const arePropsEqual = (prev: CommentsTabProps, next: CommentsTabProps) =>
  prev.avatarPublic === next.avatarPublic &&
  prev.commentValue === next.commentValue &&
  prev.canWriteComment === next.canWriteComment &&
  prev.isSubmittingComment === next.isSubmittingComment &&
  prev.onCommentChange === next.onCommentChange &&
  prev.onCommentSubmit === next.onCommentSubmit &&
  prev.onCommentSelect === next.onCommentSelect &&
  prev.activeCommentId === next.activeCommentId &&
  areCommentFeedsEqual(prev.comments, next.comments);

export default React.memo(CommentsTab, arePropsEqual);
