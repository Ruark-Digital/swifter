import React, { useCallback } from "react";
import { X } from "lucide-react";
import FeedItem from "./FeedItem";
import WriteComment from "./WriteComment";
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
  anchorCommentId?: string | null;
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
  /** Excerpt of the document selection the next comment will anchor to. */
  anchorExcerpt?: string | null;
  onDismissAnchor?: () => void;
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
  anchorExcerpt = null,
  onDismissAnchor,
}) => {
  const handleSubmit = useCallback(() => {
    onCommentSubmit?.();
  }, [onCommentSubmit]);

  const renderCommentItem = useCallback(
    (comment: CommentsFeedItem) => {
      const isAnchored = Boolean(comment.anchorCommentId || comment.redlineId);
      const focusMark = () => {
        // Selection-anchored comments scroll via the SuperDoc comment entity;
        // redline-anchored ones keep the legacy mark event.
        if (comment.anchorCommentId) {
          window.dispatchEvent(
            new CustomEvent("ct-focus-comment", {
              detail: { commentId: comment.anchorCommentId },
            }),
          );
          return;
        }
        if (!comment.redlineId) return;
        window.dispatchEvent(
          new CustomEvent("ct-focus-mark", {
            detail: { id: comment.redlineId },
          }),
        );
      };
      return (
        <div
          className={`space-y-2 ${
            isAnchored
              ? "cursor-pointer rounded-md transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              : ""
          }`}
          onClick={isAnchored ? focusMark : undefined}
          role={isAnchored ? "button" : undefined}
          tabIndex={isAnchored ? 0 : undefined}
          onKeyDown={
            isAnchored
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    focusMark();
                  }
                }
              : undefined
          }
        >
          <FeedItem
            avatarSrc={avatarPublic}
            name={comment.name}
            timestamp={comment.timestamp}
            message={comment.message}
            attachment={comment.attachment}
            showDot={comment.showDot}
          />
          {isAnchored && (
            <div className="pl-12 flex items-center gap-3">
              <span className="text-xs text-amber-600 dark:text-amber-400">
                anchored to document
              </span>
            </div>
          )}
        </div>
      );
    },
    [avatarPublic],
  );

  return (
    <div className="ct-comments-view my-5">
      <div className="ct-section-header">
        <span className="ct-section-title">Comments and activity</span>
      </div>

      {anchorExcerpt !== null && (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300">
          <span className="min-w-0 truncate">
            anchored to: “{anchorExcerpt || "selection"}”
          </span>
          <button
            type="button"
            aria-label="Remove anchor"
            onClick={onDismissAnchor}
            className="ml-auto shrink-0 rounded p-0.5 transition-colors hover:bg-amber-100 dark:hover:bg-amber-800/40"
          >
            <X className="h-3 w-3" />
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
        placeholder="Write a Comment… use @ to tag"
      />

      {/* Natural-flow list: comment heights vary (multi-line messages, the
          "anchored to document" footer), which a fixed-slot virtualizer
          clipped/overlapped. `.ct-feed` itself provides column+gap+scroll. */}
      <div className="ct-feed mt-5">
        {comments.map((comment) => (
          <React.Fragment key={comment.id}>
            {renderCommentItem(comment)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default React.memo(CommentsTab);
