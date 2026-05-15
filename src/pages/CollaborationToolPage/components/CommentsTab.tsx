import React, { useCallback, useState } from "react";
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
  parentId?: string | null;
  redlineId?: string | null;
  mentions?: Mentionable[];
  replies?: CommentsFeedItem[];
};

type CommentsTabProps = {
  avatarPublic: string;
  comments: CommentsFeedItem[];
  commentValue?: string;
  onCommentChange?: (value: string, mentions: Mentionable[]) => void;
  onCommentSubmit?: (parentId?: string | null) => void;
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
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    onCommentSubmit?.(replyTo);
    setReplyTo(null);
  }, [onCommentSubmit, replyTo]);

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
        <div className="pl-12 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReplyTo(comment.id)}
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Reply
          </button>
          {comment.redlineId && (
            <span className="text-xs text-amber-600 dark:text-amber-400">redline thread</span>
          )}
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="pl-12 border-l-2 border-slate-200 ml-6 space-y-2 dark:border-slate-800">
            {comment.replies.map((r) => (
              <FeedItem
                key={r.id}
                avatarSrc={avatarPublic}
                name={r.name}
                timestamp={r.timestamp}
                message={r.message}
                attachment={r.attachment}
                showDot={r.showDot}
              />
            ))}
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
        <div className="ct-avatars-cluster">
          <img src={avatarPublic} alt="" className="ct-avatar-cluster-item" />
          <img src={avatarPublic} alt="" className="ct-avatar-cluster-item second" />
          <img src={avatarPublic} alt="" className="ct-avatar-cluster-item second" />
        </div>
      </div>

      {replyTo && (
        <div className="flex items-center justify-between bg-slate-100 px-3 py-1 rounded text-xs text-slate-600 mb-1 dark:bg-slate-800 dark:text-slate-300">
          <span>Replying to comment</span>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="font-semibold text-red-500 hover:underline dark:text-red-400"
          >
            Cancel
          </button>
        </div>
      )}

      <WriteComment
        value={commentValue}
        onChange={onCommentChange}
        onSubmit={handleSubmit}
        disabled={!canWriteComment}
        isSubmitting={isSubmittingComment}
        mentionables={mentionables}
        placeholder={replyTo ? "Write a reply… use @ to tag" : "Write a Comment… use @ to tag"}
      />

      <VirtualizedFeedList
        className="ct-feed mt-5"
        items={comments.filter((c) => !c.parentId)}
        itemHeight={140}
        getItemKey={(item) => item.id}
        renderItem={renderCommentItem}
      />
    </div>
  );
};

export default React.memo(CommentsTab);
