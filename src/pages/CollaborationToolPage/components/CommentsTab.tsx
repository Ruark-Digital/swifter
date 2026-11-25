import React, { useCallback } from "react";
import { ArrowUpRight, CheckCircle2, MessageSquareText, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import FeedItem from "./FeedItem";
import WriteComment from "./WriteComment";
import type { Mentionable } from "../collab/useContractMentionables";

type FeedAttachment = {
  filename: string;
  size: string;
};

export type CommentReply = {
  id: string;
  name: string;
  timestamp: string;
  message: string;
  /** The viewer wrote it, so they may delete it. */
  canDelete?: boolean;
};

export type CommentsFeedItem = {
  id: string;
  name: string;
  timestamp: string;
  /** Full time with the zone, for the hover tooltip. */
  timestampTitle?: string;
  message: string;
  /** Thread controls (file-backed comments only). */
  replies?: CommentReply[];
  resolved?: boolean;
  canDelete?: boolean;
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
  /** Thread actions. When omitted (local-only comments) no controls render. */
  onReply?: (rootId: string, text: string) => void;
  onResolveToggle?: (rootId: string, resolved: boolean) => void;
  onDeleteComment?: (commentId: string) => void;
};

/** Reply box + resolve / delete actions under a thread. */
const ThreadActions: React.FC<{
  item: CommentsFeedItem;
  onReply?: (rootId: string, text: string) => void;
  onResolveToggle?: (rootId: string, resolved: boolean) => void;
  onDeleteComment?: (commentId: string) => void;
}> = ({ item, onReply, onResolveToggle, onDeleteComment }) => {
  const [replying, setReplying] = React.useState(false);
  const [text, setText] = React.useState("");
  const send = () => {
    const t = text.trim();
    if (!t) return;
    onReply?.(item.id, t);
    setText("");
    setReplying(false);
  };
  const btn =
    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100";
  return (
    <div className="mt-1 pl-[52px]" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-1">
        {onReply && (
          <button type="button" className={btn} onClick={() => setReplying((v) => !v)}>
            Reply
          </button>
        )}
        {onResolveToggle && (
          <button
            type="button"
            className={btn}
            onClick={() => onResolveToggle(item.id, !item.resolved)}
          >
            {item.resolved ? (
              <>
                <Undo2 className="h-3 w-3" /> Reopen
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" /> Resolve
              </>
            )}
          </button>
        )}
        {onDeleteComment && item.canDelete && (
          <button
            type="button"
            className={cn(btn, "hover:text-red-600 dark:hover:text-red-400")}
            onClick={() => onDeleteComment(item.id)}
          >
            Delete
          </button>
        )}
      </div>
      {replying && (
        <div className="mt-1.5 flex gap-1.5">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            rows={2}
            placeholder="Write a reply…"
            className="min-w-0 flex-1 resize-none rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            type="button"
            disabled={!text.trim()}
            onClick={send}
            className="self-end rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
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
  onReply,
  onResolveToggle,
  onDeleteComment,
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
          className={cn(
            "group rounded-xl border border-transparent px-3 py-2.5 transition-colors",
            comment.resolved && "opacity-60",
            isAnchored &&
              "cursor-pointer hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/50",
          )}
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
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <FeedItem
                avatarSrc={avatarPublic}
                name={comment.name}
                timestamp={comment.timestamp}
                timestampTitle={comment.timestampTitle}
                message={comment.message}
                attachment={comment.attachment}
                showDot={comment.showDot}
              />
            </div>
            {isAnchored && (
              <span
                aria-hidden="true"
                title="Go to this comment in the document"
                className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:bg-slate-100 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:bg-slate-700/60 dark:group-hover:text-indigo-400"
              >
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
              </span>
            )}
          </div>
          {comment.resolved && (
            <div className="mt-1 pl-[52px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                resolved
              </span>
            </div>
          )}
          {(comment.replies ?? []).map((reply) => (
            <div key={reply.id} className="mt-2 border-l-2 border-slate-100 pl-3 ml-[26px] dark:border-slate-800">
              <FeedItem
                avatarSrc={avatarPublic}
                name={reply.name}
                timestamp={reply.timestamp}
                message={reply.message}
              />
              {onDeleteComment && reply.canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComment(reply.id);
                  }}
                  className="ml-[52px] rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
          {(onReply || onResolveToggle || onDeleteComment) && (
            <ThreadActions
              item={comment}
              onReply={onReply}
              onResolveToggle={onResolveToggle}
              onDeleteComment={onDeleteComment}
            />
          )}
          {isAnchored && (
            <div className="mt-1.5 pl-[52px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/25 dark:text-amber-300">
                <MessageSquareText className="h-3 w-3" strokeWidth={2} />
                anchored to document
              </span>
            </div>
          )}
        </div>
      );
    },
    [avatarPublic, onReply, onResolveToggle, onDeleteComment],
  );

  return (
    <div className="ct-comments-view my-5">
      <div className="ct-section-header">
        <div className="flex items-center gap-2">
          <span className="ct-section-title">Comments and activity</span>
          {comments.length > 0 && (
            <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {comments.length}
            </span>
          )}
        </div>
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

      {comments.length === 0 ? (
        <div className="mx-[23px] mt-5 flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-8 text-center dark:border-slate-700 dark:bg-slate-800/30">
          <span className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <MessageSquareText className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No comments yet
          </p>
          <p className="max-w-[240px] text-xs text-slate-500 dark:text-slate-400">
            Start the thread — use @ to tag a teammate, or select text in the
            document to anchor a comment.
          </p>
        </div>
      ) : (
        /* Natural-flow list: comment heights vary (multi-line messages, the
           "anchored to document" footer), which a fixed-slot virtualizer
           clipped/overlapped. `.ct-feed` itself provides column+gap+scroll. */
        <div className="ct-feed mt-5">
          {comments.map((comment) => (
            <React.Fragment key={comment.id}>
              {renderCommentItem(comment)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(CommentsTab);
