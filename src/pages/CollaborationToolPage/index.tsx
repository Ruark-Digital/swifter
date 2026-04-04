import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { SEOWrapper } from "@/components/SEO";
import SidebarPanel from "./components/SidebarPanel";
import "@/pages/CollaborationToolPage/collaboration.css";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { useToken } from "@/store/authSlice";
import { contractManagerApi, type ContractCommentDTO } from "@/pages/ContractManagementPage/api/contractManagerApi";
import { approverApi } from "@/pages/ContractManagementPage/api/approverApi";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";
import { useCollaborationStore } from "./store/useCollaborationStore";

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
};

type CommentTarget = "change" | "rfi" | "claim";

const EditorPane = lazy(() => import("./components/EditorPanel"));

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

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

const toAttachment = (files?: ContractCommentDTO["files"]): SidebarAttachment | null => {
  const first = files?.[0];
  if (!first) return null;
  return {
    filename: first.name || "Attachment",
    size: first.size || "",
  };
};

const extractCommentList = (payload: unknown): ContractCommentDTO[] => {
  const root = asRecord(payload);
  const data = root.data;
  if (Array.isArray(data)) return data as ContractCommentDTO[];
  const nested = asRecord(data).data;
  return Array.isArray(nested) ? (nested as ContractCommentDTO[]) : [];
};

const mapCommentsToFeed = (comments: ContractCommentDTO[]): SidebarFeed[] =>
  comments.map((comment) => ({
    id: comment._id || `${comment.createdAt || ""}-${comment.content || ""}`,
    name: comment.user?.name || "Unknown User",
    timestamp: toTimestamp(comment.createdAt),
    message: comment.content || "",
    attachment: toAttachment(comment.files),
  }));

const mapLogsToFeed = (logs: unknown[]): SidebarFeed[] =>
  logs.map((item, index) => {
    const record = asRecord(item);
    const module = asRecord(record.module);
    const moduleValue = module["stripe out contract"];
    const title = typeof record.title === "string" ? record.title : "";
    const description =
      typeof record.description === "string" ? record.description : "";
    const actionId = typeof record.actionId === "string" ? record.actionId : "";
    const reference =
      typeof record.reference === "string" ? record.reference : "";
    const actor = typeof record.actor === "string" ? record.actor : "";
    const user = typeof record.user === "string" ? record.user : "";
    const requestedBy =
      typeof record.requestedBy === "string" ? record.requestedBy : "";
    const moduleLabel = typeof moduleValue === "string" ? moduleValue : "";
    const message =
      title ||
      description ||
      [actor, actionId || reference || moduleLabel].filter(Boolean).join(" ").trim();

    return {
      id:
        (typeof record.id === "string" && record.id) ||
        (typeof record._id === "string" && record._id) ||
        `${index}-${message}`,
      name: user || requestedBy || "System",
      timestamp: toTimestamp(
        (record.createdAt as string | undefined) ||
          (record.date as string | undefined),
      ),
      message,
      showDot: false,
    };
  });

const CollaborationToolPage: React.FC = () => {
  const toastHandler = useToastHandler();
  const { userRole, isVendor, isApprover, isManager, isCompanyAdmin } = useUserRole();
  const token = useToken();
  const queryClient = useQueryClient();
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
  const changeId = searchParams.get("changeId") || "";
  const rfiId = searchParams.get("rfiId") || "";
  const claimId = searchParams.get("claimId") || "";
  const collabDoc = searchParams.get("doc") || searchParams.get("docId") || "";
  const wsUrlParam = searchParams.get("wsUrl") || searchParams.get("collabWsUrl") || "";

  const commentTarget = useMemo<CommentTarget | null>(() => {
    if (changeId) return "change";
    if (rfiId) return "rfi";
    if (claimId) return "claim";
    return null;
  }, [changeId, rfiId, claimId]);

  const canResolveComments = useMemo(() => {
    if (!commentTarget) return false;
    if (!contractId && commentTarget !== "claim") return false;
    if (isVendor || isManager || isCompanyAdmin) return true;
    if (!isApprover) return false;
    return commentTarget !== "claim";
  }, [commentTarget, contractId, isApprover, isCompanyAdmin, isManager, isVendor]);

  const commentsQueryKey = useUserQueryKey([
    "collaboration-comments",
    userRole,
    commentTarget,
    contractId,
    changeId,
    rfiId,
    claimId,
  ]);

  const logsQueryKey = useUserQueryKey([
    "collaboration-logs",
    userRole,
    contractId,
  ]);

  const commentsQuery = useQuery({
    queryKey: commentsQueryKey,
    queryFn: async (): Promise<ContractCommentDTO[]> => {
      if (!commentTarget) return [];

      if (isApprover) {
        if (commentTarget === "change") {
          const response = await approverApi.listChangeComments(contractId, changeId);
          return extractCommentList(response);
        }
        if (commentTarget === "rfi") {
          const response = await approverApi.listRfiComments(contractId, rfiId);
          return extractCommentList(response);
        }
        return [];
      }

      if (isVendor) {
        const endpoint =
          commentTarget === "change"
            ? `/vendor/contracts/${contractId}/change/${changeId}/comment`
            : commentTarget === "rfi"
              ? `/vendor/contracts/${contractId}/rfi/${rfiId}/comment`
              : `/vendor/contracts/${contractId}/claim/${claimId}/comment`;
        const response = await getRequest({ url: endpoint });
        return extractCommentList(response.data);
      }

      if (commentTarget === "change") {
        const response = await contractManagerApi.listChangeComments(changeId);
        return extractCommentList(response);
      }
      if (commentTarget === "rfi") {
        const response = await contractManagerApi.listRfiComments(contractId, rfiId);
        return extractCommentList(response);
      }
      const response = await contractManagerApi.listClaimComments(claimId);
      return extractCommentList(response);
    },
    enabled: canResolveComments,
    staleTime: 10000,
  });

  const canWriteComment = useMemo(() => {
    if (!canResolveComments || !commentTarget) return false;
    if (!contractId && commentTarget !== "claim") return false;
    if (isApprover) return commentTarget !== "claim";
    return true;
  }, [canResolveComments, commentTarget, contractId, isApprover]);

  const addCommentMutation = useMutation({
    mutationKey: useUserQueryKey([
      "collaboration-add-comment",
      userRole,
      commentTarget,
      contractId,
      changeId,
      rfiId,
      claimId,
    ]),
    mutationFn: async (content: string) => {
      if (!commentTarget) return;
      const payload = { content };

      if (isApprover) {
        if (commentTarget === "change") {
          await approverApi.addChangeComment(contractId, changeId, payload);
          return;
        }
        if (commentTarget === "rfi") {
          await approverApi.addRfiComment(contractId, rfiId, payload);
        }
        return;
      }

      if (isVendor) {
        const endpoint =
          commentTarget === "change"
            ? `/vendor/contracts/${contractId}/change/${changeId}/comment`
            : commentTarget === "rfi"
              ? `/vendor/contracts/${contractId}/rfi/${rfiId}/comment`
              : `/vendor/contracts/${contractId}/claim/${claimId}/comment`;
        await postRequest({ url: endpoint, payload });
        return;
      }

      if (commentTarget === "change") {
        await contractManagerApi.addChangeComment(changeId, contractId, payload);
        return;
      }
      if (commentTarget === "rfi") {
        await contractManagerApi.addRfiComment(contractId, rfiId, payload);
        return;
      }
      await contractManagerApi.addClaimComment(claimId, contractId, payload);
    },
    onSuccess: async () => {
      setCommentInput("");
      await queryClient.invalidateQueries({ queryKey: commentsQueryKey });
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("Add Comment", error);
    },
  });

  const canResolveLogs = isManager || isCompanyAdmin || isVendor;
  const logsQuery = useQuery({
    queryKey: logsQueryKey,
    queryFn: async (): Promise<unknown[]> => {
      if (contractId && (isManager || isCompanyAdmin)) {
        const response = await contractManagerApi.listLogs(contractId, { limit: 100 });
        return response.data?.logs ?? [];
      }

      if (isVendor) {
        const response = await getRequest({
          url: "/vendor/contracts/dashboard/action-logs",
        });
        const data = asRecord(response.data).data;
        return Array.isArray(data) ? data : [];
      }

      const response = await getRequest({
        url: "/manager/contracts/dashboard/action-logs",
      });
      const data = asRecord(response.data).data;
      return Array.isArray(data) ? data : [];
    },
    enabled: canResolveLogs,
    staleTime: 10000,
  });

  const commentsFeed = useMemo(
    () => mapCommentsToFeed(commentsQuery.data ?? []),
    [commentsQuery.data],
  );
  const logsFeed = useMemo(
    () => mapLogsToFeed(logsQuery.data ?? []),
    [logsQuery.data],
  );

  const shouldUseFallbackFeed = !canResolveComments && !canResolveLogs;

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
    [sourceUrl, fileName, fileType],
  );

  const handleCommentChange = useCallback((value: string) => {
    setCommentInput(value);
  }, []);

  const handleTabChange = useCallback((tab: "comments" | "log") => {
    setActiveTab(tab);
  }, [setActiveTab]);

  const handleSubmitComment = useCallback(async () => {
    const trimmed = commentInput.trim();
    if (!trimmed || !canWriteComment || addCommentMutation.isPending) return;
    await addCommentMutation.mutateAsync(trimmed);
  }, [
    addCommentMutation,
    canWriteComment,
    commentInput,
  ]);

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
          isSubmittingComment={addCommentMutation.isPending}
          useFallbackFeed={shouldUseFallbackFeed}
        />
      </div>
    </>
  );
};

export default CollaborationToolPage;
