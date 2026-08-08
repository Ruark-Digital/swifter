import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { SEOWrapper } from "@/components/SEO";
import SidebarPanel from "./components/SidebarPanel";
import "@/pages/CollaborationToolPage/collaboration.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
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
import { useToastHandler } from "@/hooks/useToaster";
import {
  type RedlineSpan,
} from "./collab/redlineScan";
import type { EditorAdapter } from "./collab/editorAdapter";
import { useCollabVersions } from "./collab/useCollabVersions";
import { deriveRoomId } from "./collab/deriveRoomId";
import {
  useFileVersions,
  useDownloadLatestCollab,
} from "./collab/useFileVersionsApi";
import {
  useAiRedlineSuggestions,
  usePersistedSuggestions,
  getRedlineResolvedHolder,
  type AiRedlineSuggestion,
  type RedlineResolvedHolder,
  type SuggestionProgress,
} from "./collab/useAiRedlineSuggestions";
import {
  useRedlineTurn,
  isVersionConflict,
  type RedlineBatchItem,
} from "./collab/useRedlineTurn";
import TurnBanner from "./components/TurnBanner";
import type { ApiResponseError } from "@/types";
import type { Version } from "./components/VersionHistoryModal";

type AiItem = {
  redline: RedlineSpan;
  suggestion?: AiRedlineSuggestion;
  state: "pending" | "approved" | "dismissed";
  /** #87 — which side resolved it: "manager" → Addressed, "vendor" → Resolved. */
  resolvedByHolder?: RedlineResolvedHolder;
};

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
  anchorCommentId?: string | null;
};

type LocalComment = {
  id: string;
  author: string;
  createdAt: string;
  content: string;
  redlineId?: string | null;
  redlineKind?: "insertion" | "deletion" | null;
  anchorCommentId?: string | null;
  mentions?: Mentionable[];
};

// Legacy editors, kept as escape hatches: `?editor=yoopta` (Yoopta) and
// `?editor=tiptap` (TipTap). SuperDoc is the default (see below).
const EditorPane = lazyWithRetry(() => import("./components/EditorPanel"));
const TipTapEditorPane = lazyWithRetry(() => import("./components/TipTapEditorPanel"));
// SuperDoc runs as a separate AGPL app inside an iframe; this pane is the
// host-side postMessage bridge. It is the DEFAULT editor (requires the AGPL app
// deployed at VITE_SUPERDOC_APP_URL).
const IframeEditorPane = lazyWithRetry(() => import("./components/IframeEditorPane"));

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

const mapLocalCommentsToFeed = (comments: LocalComment[]): SidebarFeed[] =>
  comments.map((comment) => ({
    id: comment.id,
    name: comment.author || "Unknown User",
    timestamp: toTimestamp(comment.createdAt),
    message: comment.content,
    redlineId: comment.redlineId ?? null,
    anchorCommentId: comment.anchorCommentId ?? null,
  }));

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
  const toastHandler = useToastHandler();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [commentInput, setCommentInput] = useState("");

  const activeTab = useCollaborationStore((state) => state.activeTab);
  const presenceActive = useCollaborationStore((state) => state.presenceActive);
  const setActiveTab = useCollaborationStore((state) => state.setActiveTab);
  const setPresenceActive = useCollaborationStore((state) => state.setPresenceActive);

  // Editor adapter is owned by whichever panel is mounted (Yoopta or
  // TipTap) and published up here so the sidebar (Redline + Versions
  // tabs) can drive AI runs and version snapshots without depending on
  // a specific editor's API.
  const editorAdapterRef = useRef<EditorAdapter | null>(null);
  // Mirror the adapter's Y.Doc into state so the version-history hook
  // can subscribe — refs don't trigger re-renders, but the hook needs
  // re-renders when the doc identity changes (room/token swap).
  //
  // Named `collabYDoc` to avoid colliding with the `collabDoc` URL
  // search-param string declared further down.
  const [collabYDoc, setCollabYDoc] = useState<
    EditorAdapter["doc"] | undefined
  >(undefined);
  // Re-render signal so effects that drive the (ref-held) adapter re-run once
  // the editor is actually mounted — e.g. pushing the initial redline-turn mode.
  const [editorReady, setEditorReady] = useState(false);
  const handleEditorReady = useCallback((adapter: EditorAdapter | null) => {
    editorAdapterRef.current = adapter;
    setCollabYDoc(adapter?.doc);
    setEditorReady(Boolean(adapter));
  }, []);

  // Version history backed by Yjs so every client in the same room
  // sees the same timeline.
  const {
    versions: localVersions,
    addVersion,
    getSnapshot: getVersionSnapshot,
  } = useCollabVersions(collabYDoc);

  // AI redline suggestions (moved out of EditorPanel)
  const contractIdParam = searchParams.get("contractId") || undefined;
  const msaContractIdParam = searchParams.get("msaContractId") || undefined;
  const aiMutation = useAiRedlineSuggestions({
    documentId: msaContractIdParam || contractIdParam,
    isMsa: Boolean(msaContractIdParam),
  });
  const persistedQuery = usePersistedSuggestions({
    documentId: msaContractIdParam || contractIdParam,
    isMsa: Boolean(msaContractIdParam),
  });
  // Turn-based redline negotiation (company side ⇄ vendor side).
  const redlineTurn = useRedlineTurn({
    documentId: msaContractIdParam || contractIdParam,
    isMsa: Boolean(msaContractIdParam),
  });
  const [aiItems, setAiItems] = useState<AiItem[]>([]);
  const [aiHasRun, setAiHasRun] = useState(false);
  const [aiNoRedlines, setAiNoRedlines] = useState(false);
  const [aiProgress, setAiProgress] = useState<SuggestionProgress>({});

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
  // Selection-anchor chip state, fed by `ct-selection-change` from the
  // SuperDoc iframe. While set, the next submitted comment anchors to the
  // document selection. Dismissible (the X on the chip).
  const [pendingAnchor, setPendingAnchor] = useState<{ excerpt: string } | null>(null);

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
        redlineId: c.redlineId ?? null,
        redlineKind: c.redlineKind ?? null,
        anchorCommentId: c.anchorCommentId ?? null,
        mentions: c.mentions,
      }));
    }
    return localComments;
  }, [fileCommentsQuery.data, fileId, localComments]);

  const commentsFeed = useMemo(
    () => mapLocalCommentsToFeed(combinedComments),
    [combinedComments],
  );

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
    // Collab room is scoped per (contract, document) so the same file
    // opened from two different contracts stays in two independent rooms
    // (edits/presence/version history don't leak across contracts). An
    // explicit `?doc=` query param still wins (lets ops pin a room id).
    const roomId = deriveRoomId({ collabDoc, fileId, fileName, contractId });
    return {
      wsUrl,
      roomId,
      token: token || "",
      disable: !roomId,
      presenceActive,
    };
  }, [collabDoc, contractId, fileId, fileName, presenceActive, token, wsUrlParam]);

  // Server-stored version history (GET /file/versions/{docName}) and
  // latest-snapshot download (GET /collab-export/{docName}/download).
  // The fallback room id "collab:editor" is excluded so we don't pin a
  // shared global key on the BE when no real document is loaded.
  const docName =
    collabMeta.roomId && collabMeta.roomId !== "collab:editor"
      ? collabMeta.roomId
      : undefined;
  const fileVersionsQuery = useFileVersions(docName);
  const downloadLatestMutation = useDownloadLatestCollab();

  // Merge BE-fetched versions on top of in-memory Yjs snapshots. BE
  // entries carry `source: "be"` so the Versions tab knows to suppress
  // the per-row Restore button (no client-side snapshot to apply).
  const versions: Version[] = useMemo(() => {
    const be = fileVersionsQuery.data?.versions ?? [];
    const combined = [...be, ...localVersions];
    return combined.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [fileVersionsQuery.data?.versions, localVersions]);

  const handleDownloadLatestVersion = useCallback(() => {
    if (!docName) {
      toastHandler.error(
        "Download unavailable",
        "Open a document before downloading the latest version.",
      );
      return;
    }
    downloadLatestMutation.mutate(
      { docName },
      {
        onError: (err) => {
          const message =
            err instanceof Error ? err.message : "Could not download snapshot.";
          toastHandler.error("Download failed", message);
        },
      },
    );
  }, [docName, downloadLatestMutation, toastHandler]);

  const importMeta = useMemo(
    () => ({ sourceUrl, fileName, fileType }),
    [sourceUrl, fileName, fileType]
  );

  // `saveVersionSnapshot` is declared further down (after version
  // history wiring). Read it through a ref so this listener-mount
  // effect doesn't hit the TDZ on first render.
  const saveVersionSnapshotRef = useRef<
    ((label: string, kind: Version["kind"]) => void) | null
  >(null);

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
      // Track-change snapshot — versions tab becomes the timeline so
      // users can revert "before this insertion" / "before this deletion".
      saveVersionSnapshotRef.current?.(
        detail.kind === "insertion"
          ? "Inserted redline"
          : "Deleted redline",
        detail.kind,
      );
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
    // Debounced plain-text-edit signal from the editor panel — turns
    // every "pause after typing" into a versions-tab snapshot so users
    // can revert ordinary edits, not just track-changes events.
    const onDocEdit = () => {
      saveVersionSnapshotRef.current?.("Document edit", "edit");
    };
    window.addEventListener("ct-add-redline", onRedline);
    window.addEventListener("ct-add-inline-comment", onInlineComment);
    window.addEventListener("ct-doc-edit", onDocEdit);
    return () => {
      window.removeEventListener("ct-add-redline", onRedline);
      window.removeEventListener("ct-add-inline-comment", onInlineComment);
      window.removeEventListener("ct-doc-edit", onDocEdit);
    };
  }, [setActiveTab]);

  useEffect(() => {
    const onSelectionChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { hasSelection?: boolean; excerpt?: string }
        | undefined;
      setPendingAnchor(
        detail?.hasSelection ? { excerpt: detail.excerpt ?? "" } : null,
      );
    };
    window.addEventListener("ct-selection-change", onSelectionChange);
    return () =>
      window.removeEventListener("ct-selection-change", onSelectionChange);
  }, []);

  const handleCommentChange = useCallback(
    (value: string, mentions: Mentionable[]) => {
      setCommentInput(value);
      pendingMentionsRef.current = mentions;
    },
    [],
  );

  const handleTabChange = useCallback(
    (tab: "comments" | "redline" | "versions") => {
      setActiveTab(tab);
    },
    [setActiveTab]
  );

  // ── Version history handlers ────────────────────────────────────────
  // Backed by `useCollabVersions` — the version list + snapshots live in
  // the shared Y.Doc, so other clients see new entries automatically.
  // There is no manual Save button; every entry comes from a track-
  // change event (redline, AI apply, comment) so the call is always
  // silent (no toast).
  const saveVersionSnapshot = useCallback(
    (label: string, kind: Version["kind"]) => {
      const adapter = editorAdapterRef.current;
      if (!adapter) return;
      try {
        const snapshot = adapter.getSnapshot();
        addVersion({
          label,
          kind: kind ?? "comment",
          author: user?.name || "Unknown User",
          snapshot,
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[versions] save failed", error);
        }
      }
    },
    [addVersion, user?.name],
  );

  // Keep the ref used by the early useEffect listeners in sync with
  // the latest callback identity.
  useEffect(() => {
    saveVersionSnapshotRef.current = saveVersionSnapshot;
  }, [saveVersionSnapshot]);

  const handleRestoreVersion = useCallback(
    (versionId: string) => {
      const adapter = editorAdapterRef.current;
      if (!adapter) return;
      try {
        const snapshot = getVersionSnapshot(versionId);
        if (snapshot == null) {
          toastHandler.error(
            "Version restore failed",
            "Snapshot is no longer available.",
          );
          return;
        }
        adapter.setSnapshot(snapshot);
        toastHandler.success(
          "Version restored",
          "Document version restored successfully.",
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toastHandler.error("Version restore failed", message);
      }
    },
    [getVersionSnapshot, toastHandler],
  );

  // ── AI redline suggestion handlers ──────────────────────────────────
  const runAiSuggestions = useCallback(async () => {
    const adapter = editorAdapterRef.current;
    if (!adapter) return;
    setAiHasRun(true);
    const redlines = adapter.extractRedlines();
    if (redlines.length === 0) {
      setAiItems([]);
      setAiNoRedlines(true);
      return;
    }
    setAiNoRedlines(false);
    const analysis = await aiMutation.mutateAsync(redlines);
    const byId = new Map(analysis.suggestions.map((s) => [s.redlineId, s]));
    setAiItems(
      redlines.map((r) => ({
        redline: r,
        suggestion: byId.get(r.redlineId),
        state: "pending" as const,
      })),
    );
  }, [aiMutation]);

  // QA #232/#237: load persisted suggestions from GET before generating new
  // ones. When persisted data exists, rehydrate aiItems with the saved
  // resolution state and skip the POST entirely. Only generate (POST) when
  // the GET returns an empty array or on explicit "Regenerate".
  useEffect(() => {
    if (activeTab !== "redline") return;
    if (aiHasRun) return;
    if (!redlineTurn.canAct) return;
    if (persistedQuery.isLoading) return;

    const persisted = persistedQuery.data;
    if (persisted && persisted.suggestions.length > 0) {
      const resolutionToState = (
        status?: string,
      ): AiItem["state"] => {
        if (status === "accepted" || status === "modified") return "approved";
        if (status === "rejected") return "dismissed";
        return "pending";
      };
      setAiItems(
        persisted.suggestions.map((s) => ({
          redline: {
            redlineId: s.redlineId,
            kind: "insertion" as const,
            text: s.sourceText ?? "",
          },
          suggestion: s,
          state: resolutionToState(s.resolution?.action),
          resolvedByHolder: getRedlineResolvedHolder(s.resolution),
        })),
      );
      setAiProgress(persisted.progress);
      setAiHasRun(true);
      return;
    }

    void runAiSuggestions();
  }, [activeTab, aiHasRun, runAiSuggestions, redlineTurn.canAct, persistedQuery.isLoading, persistedQuery.data]);

  // Push the current turn's edit permission into the SuperDoc iframe. The init
  // payload sets "editing" once; here we correct it — "suggesting" on your turn,
  // "viewing" while you wait. Runs after the editor mounts and on every flip.
  // Only participants with authoritative turn state drive this; non-participants
  // keep the editor's default mode (pre-existing behavior).
  useEffect(() => {
    const adapter = editorAdapterRef.current;
    if (!adapter?.setMode) return;
    if (!redlineTurn.turnGateReady) return;
    adapter.setMode(redlineTurn.isMyTurn ? "suggesting" : "viewing");
  }, [editorReady, redlineTurn.turnGateReady, redlineTurn.isMyTurn]);

  const handleApproveAi = useCallback(
    (item: AiItem, tier: "low" | "medium" | "high" = "medium") => {
      const adapter = editorAdapterRef.current;
      if (!adapter || !item.suggestion) return;
      // Turn gate: only the current holder may mutate redlines (buttons are
      // already disabled; this is defense-in-depth).
      if (redlineTurn.isLocked) {
        toastHandler.error(
          "Redline",
          redlineTurn.isParticipant
            ? "It's not your turn — wait for the other side to hand the document back."
            : "Only the contract manager and vendor can modify redlines.",
        );
        return;
      }
      // Pick the user's chosen alternative-language tier (or fall back
      // through the others, then to the legacy `replacementText` field
      // for older BE deployments).
      const alt = item.suggestion.alternativeLanguage;
      const replacement =
        alt?.[tier] ??
        alt?.medium ??
        alt?.low ??
        alt?.high ??
        item.suggestion.replacementText;
      if (typeof replacement === "string" && replacement.length > 0) {
        adapter.replaceRedline(item.redline.redlineId, replacement);
        // Auto-snapshot so the user can revert the AI-applied change.
        saveVersionSnapshot(`Applied AI suggestion (${tier})`, "ai-apply");
        // Audit-only; does not mutate the doc. Fire-and-forget (errors are
        // handled below — a 409 surfaces a toast instead of vanishing).
        redlineTurn.resolve.mutate(
          {
            redlineId: item.redline.redlineId,
            action: "modified",
            tier,
            docName,
            baseVersionId: fileVersionsQuery.data?.activeVersionId ?? null,
          },
          {
            onError: (error) => {
              if (isVersionConflict(error)) {
                toastHandler.error(
                  "Redline",
                  "This document changed since you loaded it. Reload the latest version, then try again.",
                );
              }
            },
          },
        );
      } else if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          "[ai-redline] apply clicked but no alternativeLanguage / replacementText available; doc not mutated.",
          item.redline.redlineId,
        );
      }
      setAiItems((prev) =>
        prev.map((p) =>
          p.redline.redlineId === item.redline.redlineId
            ? { ...p, state: "approved", resolvedByHolder: redlineTurn.mySide ?? undefined }
            : p,
        ),
      );
    },
    [
      saveVersionSnapshot,
      redlineTurn,
      toastHandler,
      docName,
      fileVersionsQuery.data?.activeVersionId,
    ],
  );

  const handleDismissAi = useCallback(
    (item: AiItem) => {
      if (redlineTurn.isLocked) return;
      setAiItems((prev) =>
        prev.map((p) =>
          p.redline.redlineId === item.redline.redlineId
            ? { ...p, state: "dismissed", resolvedByHolder: redlineTurn.mySide ?? undefined }
            : p,
        ),
      );
      // Audit-only. Fire-and-forget (errors handled below — a 409 surfaces a toast).
      redlineTurn.resolve.mutate(
        {
          redlineId: item.redline.redlineId,
          action: "rejected",
          docName,
          baseVersionId: fileVersionsQuery.data?.activeVersionId ?? null,
        },
        {
          onError: (error) => {
            if (isVersionConflict(error)) {
              toastHandler.error(
                "Redline",
                "This document changed since you loaded it. Reload the latest version, then try again.",
              );
            }
          },
        },
      );
    },
    [redlineTurn, docName, fileVersionsQuery.data?.activeVersionId, toastHandler],
  );

  const handleUndoAi = useCallback(
    (item: AiItem) => {
      if (redlineTurn.isLocked) return;
      redlineTurn.undo.mutate(
        {
          redlineId: item.redline.redlineId,
          docName,
          baseVersionId: fileVersionsQuery.data?.activeVersionId ?? null,
        },
        {
          onSuccess: () => {
            setAiItems((prev) =>
              prev.map((p) =>
                p.redline.redlineId === item.redline.redlineId
                  ? { ...p, state: "pending", resolvedByHolder: undefined }
                  : p,
              ),
            );
            toastHandler.success("Redline", "Resolution undone.");
          },
          onError: (error) => {
            toastHandler.error(
              "Undo redline",
              isVersionConflict(error)
                ? "This document changed since the resolution. Reload the latest version and try again."
                : (error as ApiResponseError),
            );
          },
        },
      );
    },
    [docName, fileVersionsQuery.data?.activeVersionId, redlineTurn, toastHandler],
  );

  // Bulk "resolve all pending": apply one action/tier to every pending
  // suggestion, then record them in a SINGLE batch-resolve call (vs one audit
  // POST per card). For "modified" we apply each item's chosen-tier replacement
  // to the document first (mirroring handleApproveAi), then batch-record.
  const handleResolveAllAi = useCallback(
    (action: "modified" | "rejected", tier: "low" | "medium" | "high" = "medium") => {
      const adapter = editorAdapterRef.current;
      if (redlineTurn.isLocked) {
        toastHandler.error(
          "Redline",
          redlineTurn.isParticipant
            ? "It's not your turn — wait for the other side to hand the document back."
            : "Only the contract manager and vendor can modify redlines.",
        );
        return;
      }
      const pending = aiItems.filter((i) => i.state === "pending");
      if (pending.length === 0) return;

      const resolutions: RedlineBatchItem[] = [];
      if (action === "modified") {
        for (const item of pending) {
          const alt = item.suggestion?.alternativeLanguage;
          const replacement =
            alt?.[tier] ??
            alt?.medium ??
            alt?.low ??
            alt?.high ??
            item.suggestion?.replacementText;
          if (adapter && typeof replacement === "string" && replacement.length > 0) {
            adapter.replaceRedline(item.redline.redlineId, replacement);
            resolutions.push({
              redlineId: item.redline.redlineId,
              action: "modified",
              tier,
            });
          }
        }
        if (resolutions.length > 0) {
          saveVersionSnapshot(
            `Applied ${resolutions.length} AI suggestions (${tier})`,
            "ai-apply",
          );
        }
      } else {
        for (const item of pending) {
          resolutions.push({ redlineId: item.redline.redlineId, action: "rejected" });
        }
      }
      if (resolutions.length === 0) return;

      const resolvedIds = new Set(resolutions.map((r) => r.redlineId));
      const nextState: AiItem["state"] =
        action === "modified" ? "approved" : "dismissed";
      redlineTurn.batchResolve.mutate(
        {
          resolutions,
          docName,
          baseVersionId: fileVersionsQuery.data?.activeVersionId ?? null,
        },
        {
          onSuccess: () => {
            setAiItems((prev) =>
              prev.map((p) =>
                resolvedIds.has(p.redline.redlineId)
                  ? { ...p, state: nextState, resolvedByHolder: redlineTurn.mySide ?? undefined }
                  : p,
              ),
            );
            // Refresh persisted resolutions + progress counts.
            persistedQuery.refetch();
            toastHandler.success(
              "Redline",
              `Resolved ${resolutions.length} suggestion${
                resolutions.length === 1 ? "" : "s"
              }.`,
            );
          },
          onError: (error) => {
            toastHandler.error(
              "Redline",
              isVersionConflict(error)
                ? "This document changed since you loaded it. Reload the latest version, then try again."
                : (error as ApiResponseError),
            );
          },
        },
      );
    },
    [
      aiItems,
      redlineTurn,
      docName,
      fileVersionsQuery.data?.activeVersionId,
      saveVersionSnapshot,
      toastHandler,
      persistedQuery,
    ],
  );

  // Clicking a suggestion card scrolls the editor to that redline.
  // IframeEditorPane listens for `ct-focus-redline` and forwards it to the
  // SuperDoc iframe (buildFocusRedline → navigateTo).
  const handleFocusAi = useCallback((item: AiItem) => {
    window.dispatchEvent(
      new CustomEvent("ct-focus-redline", {
        detail: { redlineId: item.redline.redlineId },
      }),
    );
  }, []);

  const aiStatus: "idle" | "loading" | "ready" | "error" | "empty" =
    aiMutation.isPending || (persistedQuery.isLoading && activeTab === "redline")
      ? "loading"
      : aiMutation.isError
        ? "error"
        : aiNoRedlines
          ? "empty"
          : aiItems.length > 0 || aiMutation.isSuccess
            ? "ready"
            : "idle";

  // When fileId is supplied we can persist to the backend; otherwise we
  // require contractId (which gates the localStorage scope).
  const canWriteComment = Boolean(fileId || contractId);

  const handleSubmitComment = useCallback(async () => {
    if (!canWriteComment) return;

    const trimmed = commentInput.trim();
    if (!trimmed) return;

    // Anchor to the live document selection when the chip is active. A null
    // result (timeout/failed create) degrades to a plain comment — saving
    // never blocks on the iframe.
    let anchorCommentId: string | null = null;
    const adapter = editorAdapterRef.current;
    if (pendingAnchor && adapter?.anchorComment) {
      anchorCommentId = await adapter.anchorComment(trimmed);
      if (!anchorCommentId && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("[anchored-comment] anchor failed; saving unanchored");
      }
    } else if (pendingAnchor && import.meta.env.DEV) {
      // Chip active but no usable adapter — typically a stale-HMR tab where
      // IframeEditorPane's effect cleanup nulled the adapter and the iframe
      // never re-announced editor-ready. A full page reload fixes it.
      // eslint-disable-next-line no-console
      console.warn("[anchored-comment] chip active but no adapter", {
        hasAdapter: Boolean(adapter),
        hasAnchorComment: Boolean(adapter?.anchorComment),
      });
    }

    const redline = pendingRedlineRef.current;
    const next: LocalComment = {
      id: crypto.randomUUID(),
      author: user?.name || "Unknown User",
      createdAt: new Date().toISOString(),
      content: trimmed,
      redlineId: redline?.redlineId ?? null,
      redlineKind: redline?.kind ?? null,
      anchorCommentId,
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
          redlineId: next.redlineId,
          redlineKind: next.redlineKind,
          anchorCommentId: next.anchorCommentId,
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
    pendingRedlineRef.current = null;
    setPendingAnchor(null);
    // Auto-snapshot — a new comment is part of the document timeline.
    saveVersionSnapshot(
      redline?.redlineId || anchorCommentId
        ? "Added anchored comment"
        : "Added comment",
      "comment",
    );
  }, [
    addFileComment,
    canWriteComment,
    commentInput,
    commentsStorageKey,
    fileId,
    pendingAnchor,
    saveVersionSnapshot,
    toast,
    user?.name,
  ]);

  return (
    <>
      <SEOWrapper
        title="Collaboration Tool - SwiftPro eProcurement Portal"
        description="Collaborate on documents with a Notion-like editor and a live comments/log panel."
        robots="noindex, nofollow"
        canonical="/collaboration-tool"
      />
      <div className="flex h-svh flex-col overflow-hidden bg-white dark:bg-slate-950">
        {/* Header — lets the user close the editor and return to the contract
            detail they came from (same-tab navigation). */}
        <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Close editor and return to contract"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to contract
          </button>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {fileName || "Document Editor"}
          </h1>
          {docName && (
            <button
              type="button"
              onClick={handleDownloadLatestVersion}
              disabled={downloadLatestMutation.isPending}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Download latest version"
              title="Download the latest saved snapshot as a .yjs file"
            >
              {downloadLatestMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {downloadLatestMutation.isPending ? "Downloading…" : "Download"}
            </button>
          )}
        </header>
        <div className="flex min-h-0 flex-1">
          <div className="flex-1 max-w-7xl overflow-auto">
            <Suspense fallback={<div className="ct-editor-panel" />}>
            {(() => {
              // SuperDoc is the default editor. TipTap/Yoopta stay reachable as
              // escape hatches via `?editor=tiptap` / `?editor=yoopta`.
              const editorParam = searchParams.get("editor");
              if (editorParam === "tiptap") {
                return (
                  <TipTapEditorPane
                    importMeta={importMeta}
                    collabMeta={collabMeta}
                    onEditorReady={handleEditorReady}
                  />
                );
              }
              if (editorParam === "yoopta") {
                return (
                  <EditorPane
                    importMeta={importMeta}
                    collabMeta={collabMeta}
                    onEditorReady={handleEditorReady}
                  />
                );
              }
              return (
                <IframeEditorPane
                  importMeta={importMeta}
                  collabMeta={collabMeta}
                  onEditorReady={handleEditorReady}
                />
              );
            })()}
          </Suspense>
        </div>
        <SidebarPanel
          comments={commentsFeed}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          commentValue={commentInput}
          onCommentChange={handleCommentChange}
          onCommentSubmit={handleSubmitComment}
          canWriteComment={canWriteComment}
          isSubmittingComment={addFileComment.isPending}
          anchorExcerpt={pendingAnchor?.excerpt ?? null}
          onDismissAnchor={() => setPendingAnchor(null)}
          useFallbackFeed={false}
          mentionables={mentionables}
          versions={versions}
          onRestoreVersion={handleRestoreVersion}
          isLoadingVersions={fileVersionsQuery.isLoading}
          aiStatus={aiStatus}
          aiItems={aiItems}
          aiProgress={aiProgress}
          aiErrorMessage={(aiMutation.error as Error | undefined)?.message}
          onAiApprove={handleApproveAi}
          onAiDismiss={handleDismissAi}
          onAiUndo={handleUndoAi}
          onAiResolveAll={handleResolveAllAi}
          onAiFocus={handleFocusAi}
          onAiRetry={runAiSuggestions}
          isMyTurn={redlineTurn.canAct}
          redlineTurnBanner={
            <TurnBanner
              mySide={redlineTurn.mySide}
              turn={redlineTurn.turn}
              isMyTurn={redlineTurn.isMyTurn}
              isFinalized={redlineTurn.isFinalized}
              pendingCount={
                aiItems.filter((i) => i.state === "pending").length
              }
              onSend={() =>
                redlineTurn.sendTurn.mutate(undefined, {
                  onSuccess: () =>
                    toastHandler.success(
                      "Redline",
                      "Document sent to the other side.",
                    ),
                  onError: (e) =>
                    toastHandler.error("Send redline turn", e as ApiResponseError),
                })
              }
              onFinalize={() =>
                redlineTurn.finalize.mutate(undefined, {
                  onSuccess: () =>
                    toastHandler.success(
                      "Redline",
                      "Redline negotiation finalized.",
                    ),
                  onError: (e) =>
                    toastHandler.error("Finalize redline", e as ApiResponseError),
                })
              }
              isSending={redlineTurn.sendTurn.isPending}
              isFinalizing={redlineTurn.finalize.isPending}
            />
          }
        />
        </div>
      </div>
    </>
  );
};

export default CollaborationToolPage;
