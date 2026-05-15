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
import {
  useAddFileComment,
  useFileComments,
  type FileCommentRich,
} from "./collab/useFileComments";

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
  const fileId = searchParams.get("fileId") || "";
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

  // Backend-backed comments via /file-comment/{fileId}. When fileId is
  // present we treat the API as the source of truth; otherwise we fall
  // back to localStorage so the tool still works for ad-hoc/legacy use.
  const fileCommentsQuery = useFileComments(fileId || undefined);
  const addFileComment = useAddFileComment(fileId || undefined);

  useEffect(() => {
    if (!commentsStorageKey) {
      setLocalComments([]);
      return;
    }
    setLocalComments(readLocalComments(commentsStorageKey));
  }, [commentsStorageKey]);

  const combinedComments: LocalComment[] = useMemo(() => {
    if (fileId) {
      return (fileCommentsQuery.data ?? []).map((c: FileCommentRich) => ({
        id: c.id,
        author: c.author,
        createdAt: c.createdAt,
        content: c.content,
        parentId: c.parentId ?? null,
        redlineId: c.redlineId ?? null,
        redlineKind: c.redlineKind ?? null,
        mentions: c.mentions,
      }));
    }
    return localComments;
  }, [fileCommentsQuery.data, fileId, localComments]);

  const commentsFeed = useMemo(
    () => mapLocalCommentsToFeed(combinedComments),
    [combinedComments],
  );
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
    // Per COLLAB_WS.md the canonical env var is `VITE_WS_URL`; keep
     // `VITE_YWS_URL` as a deprecated fallback so existing local .env
     // files keep working.
    const wsUrl =
      wsUrlParam ||
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_YWS_URL ||
      "ws://localhost:1234";
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

  // When fileId is supplied we can persist to the backend; otherwise we
  // require contractId (which gates the localStorage scope).
  const canWriteComment = Boolean(fileId || contractId);

  const handleSubmitComment = useCallback(
    (parentId?: string | null) => {
      if (!canWriteComment) return;

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

      if (fileId) {
        // Persist to /file-comment/{fileId}; rich metadata is encoded
        // inside the `text` field by useAddFileComment.
        addFileComment.mutate(
          {
            id: next.id,
            author: next.author,
            createdAt: next.createdAt,
            content: next.content,
            parentId: next.parentId,
            redlineId: next.redlineId,
            redlineKind: next.redlineKind,
            mentions: next.mentions,
          },
          {
            onError: () => {
              toast({
                title: "Comment failed to save",
                description: "We'll retry next time you reload.",
                variant: "destructive",
              });
            },
          },
        );
      } else if (commentsStorageKey) {
        setLocalComments((prev) => {
          const updated = [next, ...prev];
          writeLocalComments(commentsStorageKey, updated);
          return updated;
        });
      }

      setCommentInput("");
      pendingMentionsRef.current = [];
      if (!parentId) pendingRedlineRef.current = null;
    },
    [
      addFileComment,
      canWriteComment,
      commentInput,
      commentsStorageKey,
      fileId,
      toast,
      user?.name,
    ],
  );

  return (
    <>
      <SEOWrapper
        title="Collaboration Tool - SwiftPro eProcurement Portal"
        description="Collaborate on documents with a Notion-like editor and a live comments/log panel."
        robots="noindex, nofollow"
        canonical="/collaboration-tool"
      />
      <div className="flex min-h-svh bg-white dark:bg-slate-950">
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
          isSubmittingComment={addFileComment.isPending}
          useFallbackFeed={false}
          mentionables={mentionables}
        />
      </div>
    </>
  );
};

export default CollaborationToolPage;
