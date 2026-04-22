import React, { useCallback } from "react";
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
};

type CommentsTabProps = {
  avatarPublic: string;
  comments: CommentsFeedItem[];
  commentValue?: string;
  onCommentChange?: (value: string) => void;
  onCommentSubmit?: () => void;
  canWriteComment?: boolean;
  isSubmittingComment?: boolean;
};

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
      p.attachment?.filename !== n.attachment?.filename ||
      p.attachment?.size !== n.attachment?.size
    ) {
      return false;
    }
  }
  return true;
};

const CommentsTab: React.FC<CommentsTabProps> = ({
  avatarPublic,
  comments,
  commentValue,
  onCommentChange,
  onCommentSubmit,
  canWriteComment = false,
  isSubmittingComment = false,
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
      />
    ),
    [avatarPublic],
  );

  return (
    <div className="ct-comments-view my-5">
      <div className="ct-section-header">
        <span className="ct-section-title">Comments and activity</span>
        <div className="ct-avatars-cluster">
          <img src={avatarPublic} alt="Kate" className="ct-avatar-cluster-item" />
          <img src={avatarPublic} alt="Kate" className="ct-avatar-cluster-item second" />
          <img src={avatarPublic} alt="Kate" className="ct-avatar-cluster-item second" />
        </div>
      </div>

      <WriteComment
        value={commentValue}
        onChange={onCommentChange}
        onSubmit={onCommentSubmit}
        disabled={!canWriteComment}
        isSubmitting={isSubmittingComment}
      />

      <VirtualizedFeedList
        className="ct-feed mt-5"
        items={comments}
        itemHeight={96}
        getItemKey={(item) => item.id}
        renderItem={renderCommentItem}
      />
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
  areCommentFeedsEqual(prev.comments, next.comments);

export default React.memo(CommentsTab, arePropsEqual);
