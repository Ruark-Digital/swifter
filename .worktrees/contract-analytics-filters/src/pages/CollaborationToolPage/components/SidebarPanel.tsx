import React, { lazy, Suspense, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import "@/pages/CollaborationToolPage/collaboration.css";
import type { CollaborationTab } from "../store/useCollaborationStore";
import type { CommentsFeedItem } from "./CommentsTab";

const CommentsTab = lazy(() => import("./CommentsTab"));
const LogTab = lazy(() => import("./LogTab"));

type FeedAttachment = {
  filename: string;
  size: string;
};

type Feed = {
  id: string;
  name: string;
  timestamp: string;
  message: string;
  showDot?: boolean;
  attachment?: FeedAttachment | null;
};

interface SidebarPanelProps {
  className?: string;
  comments?: Feed[];
  logs?: Feed[];
  activeTab: CollaborationTab;
  hasVisitedLog: boolean;
  onTabChange: (tab: CollaborationTab) => void;
  commentValue?: string;
  onCommentChange?: (value: string) => void;
  onCommentSubmit?: () => void;
  canWriteComment?: boolean;
  isSubmittingComment?: boolean;
  useFallbackFeed?: boolean;
}

const fallbackComments: Feed[] = [
  {
    id: "fallback-comment-1",
    name: "Kate Morrison",
    timestamp: "5:20pm 20 Jan 2022",
    message: "Office ipsum you must be muted. Breakout ensure what's.",
  },
  {
    id: "fallback-comment-2",
    name: "Kate Morrison",
    timestamp: "5:20pm 20 Jan 2022",
    message: "Kate Uploaded a document",
    attachment: { filename: "Tech requirements.pdf", size: "720 KB" },
    showDot: false,
  },
];

const fallbackLogs: Feed[] = [
  {
    id: "fallback-log-1",
    name: "Kate Morrison",
    timestamp: "5:20pm 20 Jan 2022",
    message: "Edited The contract",
  },
  {
    id: "fallback-log-2",
    name: "Kate Morrison",
    timestamp: "5:20pm 20 Jan 2022",
    message: "Drop a comment",
  },
  {
    id: "fallback-log-3",
    name: "Kate Morrison",
    timestamp: "5:20pm 20 Jan 2022",
    message: "Kate Uploaded a document",
    attachment: { filename: "Tech requirements.pdf", size: "720 KB" },
    showDot: false,
  },
];

const SidebarPanel: React.FC<SidebarPanelProps> = ({
  className,
  comments = [],
  logs = [],
  activeTab,
  hasVisitedLog,
  onTabChange,
  commentValue,
  onCommentChange,
  onCommentSubmit,
  canWriteComment = false,
  isSubmittingComment = false,
  useFallbackFeed = false,
}) => {
  const avatarPublic = "/assets/collaboration/avatar-user.png";
  const commentsFeed: CommentsFeedItem[] = useFallbackFeed ? fallbackComments : comments;
  const logsFeed: CommentsFeedItem[] = useFallbackFeed ? fallbackLogs : logs;
  const shouldRenderComments = activeTab === "comments" || hasVisitedLog;
  const shouldRenderLog = activeTab === "log" || hasVisitedLog;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import("./CommentsTab");
      void import("./LogTab");
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleCommentsTabClick = useCallback(() => {
    onTabChange("comments");
  }, [onTabChange]);

  const handleLogTabClick = useCallback(() => {
    onTabChange("log");
  }, [onTabChange]);

  const commentsPaneClassName = activeTab === "comments" ? "block h-full" : "hidden h-full";
  const logPaneClassName = activeTab === "log" ? "block h-full" : "hidden h-full";
  const fallbackNode = <div className="ct-feed mt-5" />;

  return (
    <div className={cn("ct-sidebar-panel", className)}>
      <div className="ct-segment">
        <button
          className={cn("ct-segment-btn", activeTab === "comments" && "ct-segment-btn-active")}
          onClick={handleCommentsTabClick}
          aria-pressed={activeTab === "comments"}
        >
          {activeTab === "comments" ? "Comments" : "Comments"}
        </button>
        <button
          className={cn("ct-segment-btn", activeTab === "log" && "ct-segment-btn-active")}
          onClick={handleLogTabClick}
          aria-pressed={activeTab === "log"}
        >
          {activeTab === "log" ? "Action Log" : "Log"}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {shouldRenderComments && (
          <div className={commentsPaneClassName}>
            <Suspense fallback={fallbackNode}>
              <CommentsTab
                avatarPublic={avatarPublic}
                comments={commentsFeed}
                commentValue={commentValue}
                onCommentChange={onCommentChange}
                onCommentSubmit={onCommentSubmit}
                canWriteComment={canWriteComment}
                isSubmittingComment={isSubmittingComment}
              />
            </Suspense>
          </div>
        )}
        {shouldRenderLog && (
          <div className={logPaneClassName}>
            <Suspense fallback={fallbackNode}>
              <LogTab avatarPublic={avatarPublic} logs={logsFeed} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};


const arePropsEqual = (prev: SidebarPanelProps, next: SidebarPanelProps) =>
  prev.className === next.className &&
  prev.activeTab === next.activeTab &&
  prev.hasVisitedLog === next.hasVisitedLog &&
  prev.onTabChange === next.onTabChange &&
  prev.commentValue === next.commentValue &&
  prev.onCommentChange === next.onCommentChange &&
  prev.onCommentSubmit === next.onCommentSubmit &&
  prev.canWriteComment === next.canWriteComment &&
  prev.isSubmittingComment === next.isSubmittingComment &&
  prev.useFallbackFeed === next.useFallbackFeed &&
  prev.comments === next.comments &&
  prev.logs === next.logs;

export default React.memo(SidebarPanel, arePropsEqual);

