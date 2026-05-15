import React, { useCallback } from "react";
import FeedItem from "./FeedItem";
import WriteComment from "./WriteComment";
import VirtualizedFeedList from "./VirtualizedFeedList";
import type { Mentionable } from "../collab/useContractMentionables";

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
  redlineId?: string | null;
  mentions?: Mentionable[];
};

type CommentsTabProps = {
  avatarPublic: string;
  comments: CommentsFeedItem[];
  commentValue?: string;
  onCommentChange?: (value: string, mentions: Mentionable[]) => void;
  onCommentSubmit?: () => void;
  canWriteComment?: boolean;
  isSubmittingComment?: boolean;
  mentionables?: Mentionable[];
};

const CommentsTab: React.FC<CommentsTabProps> = ({
  avatarPublic,
  comments,
  commentValue,
  onCommentChange,
  onCommentSubmit,
  canWriteComment = false,
  isSubmittingComment = false,
  mentionables = [],
}) => {
  const handleSubmit = useCallback(() => {
    onCommentSubmit?.();
  }, [onCommentSubmit]);

  const renderCommentItem = useCallback(
    (comment: CommentsFeedItem) => (
      <div className="space-y-2">
        <FeedItem
          avatarSrc={avatarPublic}
          name={comment.name}
          timestamp={comment.timestamp}
          message={comment.message}
          attachment={comment.attachment}
          showDot={comment.showDot}
        />
        {comment.redlineId && (
          <div className="pl-12 flex items-center gap-3">
            <span className="text-xs text-amber-600 dark:text-amber-400">redline thread</span>
          </div>
        )}
      </div>
    ),
    [avatarPublic],
  );

  return (
    <div className="ct-comments-view my-5">
      <div className="ct-section-header">
        <span className="ct-section-title">Comments and activity</span>
      </div>

      <WriteComment
        value={commentValue}
        onChange={onCommentChange}
        onSubmit={handleSubmit}
        disabled={!canWriteComment}
        isSubmitting={isSubmittingComment}
        mentionables={mentionables}
        placeholder="Write a Comment… use @ to tag"
      />

      <VirtualizedFeedList
        className="ct-feed mt-5"
        items={comments}
        itemHeight={72}
        getItemKey={(item) => item.id}
        renderItem={renderCommentItem}
      />
    </div>
  );
};

export default React.memo(CommentsTab);
