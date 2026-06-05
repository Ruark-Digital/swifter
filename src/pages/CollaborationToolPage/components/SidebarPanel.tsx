import React, { Suspense, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import "@/pages/CollaborationToolPage/collaboration.css";
import type { CollaborationTab } from "../store/useCollaborationStore";
import type { CommentsFeedItem } from "./CommentsTab";
import type { Mentionable } from "../collab/useContractMentionables";
import type { Version } from "./VersionHistoryModal";
import type { RedlineSpan } from "../collab/redlineScan";
import type { AiRedlineSuggestion } from "../collab/useAiRedlineSuggestions";

const CommentsTab = lazyWithRetry(() => import("./CommentsTab"));
const VersionsTab = lazyWithRetry(() => import("./VersionsTab"));
const AiSuggestionsPanel = lazyWithRetry(() => import("./AiSuggestionsPanel"));

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

type AiItem = {
  redline: RedlineSpan;
  suggestion?: AiRedlineSuggestion;
  state: "pending" | "approved" | "dismissed";
};

interface SidebarPanelProps {
  className?: string;
  comments?: Feed[];
  activeTab: CollaborationTab;
  onTabChange: (tab: CollaborationTab) => void;
  commentValue?: string;
  onCommentChange?: (value: string, mentions: Mentionable[]) => void;
  onCommentSubmit?: () => void;
  canWriteComment?: boolean;
  isSubmittingComment?: boolean;
  useFallbackFeed?: boolean;
  mentionables?: Mentionable[];
  // Versions — auto-saved; no manual save button anymore.
  versions: Version[];
  onRestoreVersion: (versionId: string) => void;
  isLoadingVersions?: boolean;
  // AI / Redline
  aiStatus: "idle" | "loading" | "ready" | "error" | "empty";
  aiItems: AiItem[];
  aiErrorMessage?: string;
  onAiApprove: (item: AiItem) => void;
  onAiDismiss: (item: AiItem) => void;
  onAiRetry: () => void;
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

const SidebarPanel: React.FC<SidebarPanelProps> = ({
  className,
  comments = [],
  activeTab,
  onTabChange,
  commentValue,
  onCommentChange,
  onCommentSubmit,
  canWriteComment = false,
  isSubmittingComment = false,
  useFallbackFeed = false,
  mentionables = [],
  versions,
  onRestoreVersion,
  isLoadingVersions = false,
  aiStatus,
  aiItems,
  aiErrorMessage,
  onAiApprove,
  onAiDismiss,
  onAiRetry,
}) => {
  const avatarPublic = "/assets/collaboration/avatar-user.png";
  const commentsFeed: CommentsFeedItem[] = useFallbackFeed ? fallbackComments : comments;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import("./CommentsTab");
      void import("./VersionsTab");
      void import("./AiSuggestionsPanel");
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleCommentsTabClick = useCallback(() => {
    onTabChange("comments");
  }, [onTabChange]);

  const handleRedlineTabClick = useCallback(() => {
    onTabChange("redline");
  }, [onTabChange]);

  const handleVersionsTabClick = useCallback(() => {
    onTabChange("versions");
  }, [onTabChange]);

  const fallbackNode = <div className="ct-feed mt-5" />;

  return (
    <div className={cn("ct-sidebar-panel", className)}>
      <div className="ct-segment">
        <button
          className={cn("ct-segment-btn", activeTab === "comments" && "ct-segment-btn-active")}
          onClick={handleCommentsTabClick}
          aria-pressed={activeTab === "comments"}
        >
          Comments
        </button>
        <button
          className={cn("ct-segment-btn", activeTab === "redline" && "ct-segment-btn-active")}
          onClick={handleRedlineTabClick}
          aria-pressed={activeTab === "redline"}
        >
          Redline
        </button>
        <button
          className={cn("ct-segment-btn", activeTab === "versions" && "ct-segment-btn-active")}
          onClick={handleVersionsTabClick}
          aria-pressed={activeTab === "versions"}
        >
          Versions
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "comments" && (
          <Suspense fallback={fallbackNode}>
            <CommentsTab
              avatarPublic={avatarPublic}
              comments={commentsFeed}
              commentValue={commentValue}
              onCommentChange={onCommentChange}
              onCommentSubmit={onCommentSubmit}
              canWriteComment={canWriteComment}
              isSubmittingComment={isSubmittingComment}
              mentionables={mentionables}
            />
          </Suspense>
        )}
        {activeTab === "redline" && (
          <Suspense fallback={fallbackNode}>
            <AiSuggestionsPanel
              open={true}
              variant="inline"
              status={aiStatus}
              errorMessage={aiErrorMessage}
              items={aiItems}
              onApprove={onAiApprove}
              onDismiss={onAiDismiss}
              onRetry={onAiRetry}
            />
          </Suspense>
        )}
        {activeTab === "versions" && (
          <Suspense fallback={fallbackNode}>
            <VersionsTab
              versions={versions}
              onRestore={onRestoreVersion}
              isLoading={isLoadingVersions}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default React.memo(SidebarPanel);
