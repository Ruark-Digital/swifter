import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SEOWrapper } from "@/components/SEO";
import SidebarPanel from "./components/SidebarPanel";
import "@/pages/CollaborationToolPage/collaboration.css";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useToken, useUser } from "@/store/authSlice";
import { useCollaborationStore } from "./store/useCollaborationStore";
import {
  useContractMentionables,
  type Mentionable,
} from "./collab/useContractMentionables";

type SidebarAttachment = {
  filename: string;
  size: string;
};

type SidebarFeed = {
  id: string;
  name: string;
  timestamp: string;
  message: string;
  showDot?: boolean;
  attachment?: SidebarAttachment | null;
  redlineId?: string | null;
  parentId?: string | null;
  replies?: SidebarFeed[];
};

type LocalComment = {
  id: string;
  author: string;
  createdAt: string;
  content: string;
  parentId?: string | null;
  redlineId?: string | null;
  redlineKind?: "insertion" | "deletion" | null;
  mentions?: Mentionable[];
};

const EditorPane = lazy(() => import("./components/EditorPanel"));

const toTimestamp = (value?: string | Date) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const mapLocalCommentsToFeed = (comments: LocalComment[]): SidebarFeed[] => {
  const byParent = new Map<string, LocalComment[]>();
  for (const c of comments) {
    if (!c.parentId) continue;
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }
  return comments
    .filter((c) => !c.parentId)
    .map((comment) => ({
      id: comment.id,
      name: comment.author || "Unknown User",
      timestamp: toTimestamp(comment.createdAt),
      message: comment.content,
      redlineId: comment.redlineId ?? null,
      replies: (byParent.get(comment.id) ?? []).map((r) => ({
        id: r.id,
        name: r.author || "Unknown User",
        timestamp: toTimestamp(r.createdAt),
        message: r.content,
      })),
    }));
};

const readLocalComments = (storageKey: string): LocalComment[] => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalComment[]) : [];
  } catch {
    return [];
  }
};

const writeLocalComments = (storageKey: string, comments: LocalComment[]) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(comments));
  } catch {
    // ignore storage failures
  }
};

const CollaborationToolPage: React.FC = () => {
  const token = useToken();
  const user = useUser();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [commentInput, setCommentInput] = useState("");

  const activeTab = useCollaborationStore((state) => state.activeTab);
  const hasVisitedLog = useCollaborationStore((state) => state.hasVisitedLog);
  const presenceActive = useCollaborationStore((state) => state.presenceActive);
  const setActiveTab = useCollaborationStore((state) => state.setActiveTab);
  const setPresenceActive = useCollaborationStore((state) => state.setPresenceActive);

  const sourceUrl = searchParams.get("sourceUrl") || "";
  const fileName = searchParams.get("fileName") || "";
  const fileType = searchParams.get("fileType") || "";
  const contractId = searchParams.get("contractId") || "";
  const collabDoc = searchParams.get("doc") || searchParams.get("docId") || "";
  const wsUrlParam = searchParams.get("wsUrl") || searchParams.get("collabWsUrl") || "";

  const commentsStorageKey = useMemo(
    () => (contractId ? `ct:contract-comments:${contractId}` : ""),
    [contractId]
  );

  const [localComments, setLocalComments] = useState<LocalComment[]>([]);
  const pendingMentionsRef = useRef<Mentionable[]>([]);
  const pendingRedlineRef = useRef<{
    redlineId: string;
    kind: "insertion" | "deletion";
  } | null>(null);

  const { data: mentionables = [] } = useContractMentionables(contractId);

  useEffect(() => {
    if (!commentsStorageKey) {
      setLocalComments([]);
      return;
    }
    setLocalComments(readLocalComments(commentsStorageKey));
  }, [commentsStorageKey]);

  const commentsFeed = useMemo(() => mapLocalCommentsToFeed(localComments), [localComments]);
  const logsFeed = useMemo<SidebarFeed[]>(() => [], []);

  useEffect(() => {
    const handleOffline = () => {
      toast({
        title: "You're offline",
        description: "Changes will be saved locally and sync when you're back online.",
        variant: "destructive",
      });
    };
    const handleOnline = () => {
      toast({
        title: "Back online",
        description: "Syncing changes...",
        variant: "default",
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [toast]);

  useEffect(() => {
    if (activeTab === "comments") {
      const timer = window.setTimeout(() => {
        setPresenceActive(true);
      }, 50);
      return () => {
        window.clearTimeout(timer);
      };
    }
    setPresenceActive(false);
    return undefined;
  }, [activeTab, setPresenceActive]);

  const collabMeta = useMemo(() => {
    const wsUrl = wsUrlParam || import.meta.env.VITE_YWS_URL || "ws://localhost:1234";
    const roomId = collabDoc || contractId || fileName || "collab:editor";
    return {
      wsUrl,
      roomId,
      token: token || "",
      disable: !roomId,
      presenceActive,
    };
  }, [collabDoc, contractId, fileName, presenceActive, token, wsUrlParam]);

  const importMeta = useMemo(
    () => ({ sourceUrl, fileName, fileType }),
    [sourceUrl, fileName, fileType]
  );

  useEffect(() => {
    const onRedline = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { redlineId?: string; kind?: "insertion" | "deletion" }
        | undefined;
      if (!detail?.redlineId || !detail?.kind) return;
      pendingRedlineRef.current = {
        redlineId: detail.redlineId,
        kind: detail.kind,
      };
      setActiveTab("comments");
    };
    const onInlineComment = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { commentId?: string }
        | undefined;
      if (!detail?.commentId) return;
      pendingRedlineRef.current = {
        redlineId: detail.commentId,
        kind: "insertion",
      };
      setActiveTab("comments");
    };
    window.addEventListener("ct-add-redline", onRedline);
    window.addEventListener("ct-add-inline-comment", onInlineComment);
    return () => {
      window.removeEventListener("ct-add-redline", onRedline);
      window.removeEventListener("ct-add-inline-comment", onInlineComment);
    };
  }, [setActiveTab]);

  const handleCommentChange = useCallback(
    (value: string, mentions: Mentionable[]) => {
      setCommentInput(value);
      pendingMentionsRef.current = mentions;
    },
    [],
  );

  const handleTabChange = useCallback(
    (tab: "comments" | "log") => {
      setActiveTab(tab);
    },
    [setActiveTab]
  );

  const canWriteComment = Boolean(contractId);

  const handleSubmitComment = useCallback(
    (parentId?: string | null) => {
      if (!canWriteComment || !commentsStorageKey) return;

      const trimmed = commentInput.trim();
      if (!trimmed) return;

      const redline = pendingRedlineRef.current;
      const next: LocalComment = {
        id: crypto.randomUUID(),
        author: user?.name || "Unknown User",
        createdAt: new Date().toISOString(),
        content: trimmed,
        parentId: parentId ?? null,
        // only the root comment of a thread carries the redline link
        redlineId: parentId ? null : redline?.redlineId ?? null,
        redlineKind: parentId ? null : redline?.kind ?? null,
        mentions: pendingMentionsRef.current,
      };

      setLocalComments((prev) => {
        const updated = [next, ...prev];
        writeLocalComments(commentsStorageKey, updated);
        return updated;
      });

      setCommentInput("");
      pendingMentionsRef.current = [];
      if (!parentId) pendingRedlineRef.current = null;
    },
    [canWriteComment, commentInput, commentsStorageKey, user?.name],
  );

  return (
    <>
      <SEOWrapper
        title="Collaboration Tool - SwiftPro eProcurement Portal"
        description="Collaborate on documents with a Notion-like editor and a live comments/log panel."
        robots="noindex, nofollow"
        canonical="/collaboration-tool"
      />
      <div className="flex min-h-svh bg-white">
        <div className="flex-1 max-w-7xl  overflow-auto">
          <Suspense fallback={<div className="ct-editor-panel" />}>
            <EditorPane importMeta={importMeta} collabMeta={collabMeta} />
          </Suspense>
        </div>
        <SidebarPanel
          comments={commentsFeed}
          logs={logsFeed}
          activeTab={activeTab}
          hasVisitedLog={hasVisitedLog}
          onTabChange={handleTabChange}
          commentValue={commentInput}
          onCommentChange={handleCommentChange}
          onCommentSubmit={handleSubmitComment}
          canWriteComment={canWriteComment}
          isSubmittingComment={false}
          useFallbackFeed={false}
          mentionables={mentionables}
        />
      </div>
    </>
  );
};

export default CollaborationToolPage;
