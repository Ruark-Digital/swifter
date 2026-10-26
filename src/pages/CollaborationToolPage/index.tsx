import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { cn } from "@/lib/utils";
import { resolveEnvFileUrl } from "@/config";
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
  formatCommentTimestamp,
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
  useRestoreVersion,
} from "./collab/useFileVersionsApi";
import {
  useAiRedlineSuggestions,
  usePersistedSuggestions,
  getRedlineResolvedHolder,
  dualApprovalPhase,
  withLocalAcceptance,
  mergeAcceptance,
  type AiRedlineSuggestion,
  type PersistedSuggestion,
  type RedlineResolvedHolder,
  type RedlineAcceptance,
  type SuggestionProgress,
} from "./collab/useAiRedlineSuggestions";
import {
  useRedlineTurn,
  isVersionConflict,
} from "./collab/useRedlineTurn";
import { buildBatchItems } from "./collab/redlineBatch";
import TurnControls from "./components/TurnControls";
import EditorModeToggle, {
  type EditableMode,
} from "./components/EditorModeToggle";
import PresenceAvatars from "./components/PresenceAvatars";
import { superdocDocName, type PresenceUser } from "./collab/superdocBridge";
import type { ApiResponseError } from "@/types";
import type { Version } from "./components/VersionHistoryModal";

/** Map a persisted `resolution.action` to a card state. Shared by the initial
 *  rehydrate and the live poll-sync effect. */
const resolutionToState = (
  status?: string,
): "pending" | "approved" | "dismissed" => {
  if (status === "accepted" || status === "modified") return "approved";
  if (status === "rejected") return "dismissed";
  return "pending";
};

type AiItem = {
  redline: RedlineSpan;
  suggestion?: AiRedlineSuggestion;
  state: "pending" | "approved" | "dismissed";
  /** #87 — which side resolved it: "manager" → Addressed, "vendor" → Resolved. */
  resolvedByHolder?: RedlineResolvedHolder;
  /** Per-redline bilateral acceptance (BE-authoritative) driving the dual-approval UI. */
  accepted?: RedlineAcceptance;
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
  wallClock?: boolean;
};

// Legacy editors, kept as escape hatches: `?editor=yoopta` (Yoopta) and
// `?editor=tiptap` (TipTap). SuperDoc is the default (see below).
const EditorPane = lazyWithRetry(() => import("./components/EditorPanel"));
const TipTapEditorPane = lazyWithRetry(() => import("./components/TipTapEditorPanel"));
// SuperDoc runs as a separate AGPL app inside an iframe; this pane is the
// host-side postMessage bridge. It is the DEFAULT editor (requires the AGPL app
// deployed at VITE_SUPERDOC_APP_URL).
const IframeEditorPane = lazyWithRetry(() => import("./components/IframeEditorPane"));

const mapLocalCommentsToFeed = (comments: LocalComment[]): SidebarFeed[] =>
  comments.map((comment) => ({
    id: comment.id,
    name: comment.author || "Unknown User",
    timestamp: formatCommentTimestamp(comment.createdAt, comment.wallClock),
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
    // BE RedlineAnalysisDTO requires the document (file) id in the request body.
    fileId: searchParams.get("fileId") || undefined,
    isMsa: Boolean(msaContractIdParam),
  });
  // Turn-based redline negotiation (company side ⇄ vendor side).
  const redlineTurn = useRedlineTurn({
    documentId: msaContractIdParam || contractIdParam,
    // Required by the resolve/batch-resolve request bodies.
    fileId: searchParams.get("fileId") || undefined,
    isMsa: Boolean(msaContractIdParam),
  });
  // While it's the other side's turn, this viewer can't act — poll the persisted
  // suggestions so the other side's edits/approvals appear without a manual
  // refresh. `useRedlineTurn` polls its own endpoint on the same condition, so
  // the turn flipping back is picked up too.
  const isWaitingForOtherSide =
    redlineTurn.isParticipant &&
    redlineTurn.turnGateReady &&
    !redlineTurn.isMyTurn &&
    !redlineTurn.isFinalized;
  const persistedQuery = usePersistedSuggestions({
    documentId: msaContractIdParam || contractIdParam,
    // GET list route requires the document (file) id in the path.
    fileId: searchParams.get("fileId") || undefined,
    isMsa: Boolean(msaContractIdParam),
    pollWhileWaiting: isWaitingForOtherSide,
  });
  // Suggesting ⇄ Editing: when the viewer can edit, they choose whether their
  // typing is tracked (suggesting) or written directly (editing). Read-only
  // ("viewing") is forced when they can't act, regardless of this preference.
  const [editorMode, setEditorMode] = useState<EditableMode>("editing");
  const [aiItems, setAiItems] = useState<AiItem[]>([]);
  const [aiHasRun, setAiHasRun] = useState(false);
  const [aiNoRedlines, setAiNoRedlines] = useState(false);
  const [aiProgress, setAiProgress] = useState<SuggestionProgress>({});

  // The stored document URL carries the API host baked in at upload time, so on
  // its own it doesn't follow VITE_API_BASE_URL. Re-home it onto the env base so
  // the document is fetched from the current environment like every other call.
  const sourceUrl = resolveEnvFileUrl(searchParams.get("sourceUrl") || "");
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
  // Room peers (self excluded by the iframe relay) — rendered as avatars in the
  // header beside the Download button. Empty until collaboration connects.
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  // Mobile layout: the editor and the sidebar can't sit side-by-side on a phone
  // (the 420px sidebar overflows), so on small screens we show one at a time and
  // toggle between them. On md+ both render side-by-side as before.
  const [mobileView, setMobileView] = useState<"document" | "panel">("document");

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
        wallClock: c.wallClock,
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
  //
  // The docName MUST match the `?doc=` the active editor sends over the WS —
  // that's the key the BE stores collab versions/snapshots/redline-turns under.
  // The default SuperDoc iframe joins the `-superdoc`-suffixed room
  // (superdocDocName / buildInitPayload), so HTTP calls must use the same
  // suffixed name or they query an empty doc and no versions return. The
  // legacy `?editor=tiptap|yoopta` escape hatches join the bare room, so keep
  // the bare name for them.
  const usesSuperdocEditor =
    searchParams.get("editor") !== "tiptap" &&
    searchParams.get("editor") !== "yoopta";
  const docName =
    collabMeta.roomId && collabMeta.roomId !== "collab:editor"
      ? usesSuperdocEditor
        ? superdocDocName(collabMeta.roomId)
        : collabMeta.roomId
      : undefined;
  const fileVersionsQuery = useFileVersions(docName);
  const downloadLatestMutation = useDownloadLatestCollab();
  const restoreVersionMutation = useRestoreVersion();
  // Id of the BE version currently being restored (drives the row's pending
  // state); null when no restore is in flight.
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(
    null,
  );

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
      const version = versions.find((v) => v.id === versionId);

      // BE-persisted version: POST to the server-provided restore path. The BE
      // makes it the new active version; we refetch the list and ask the user
      // to reload so the editor rehydrates from the restored snapshot (the live
      // Y.Doc in the iframe isn't retroactively rewritten by a server restore).
      if (version?.source === "be") {
        if (!version.restorable || !version.restorePath || !docName) {
          toastHandler.error(
            "Restore unavailable",
            "This version can't be restored.",
          );
          return;
        }
        setRestoringVersionId(versionId);
        restoreVersionMutation.mutate(
          { restorePath: version.restorePath, docName },
          {
            onSuccess: () => {
              toastHandler.success(
                "Version restored",
                "This version is now the active document. Reload to view it in the editor.",
              );
            },
            onError: (err) => {
              const message =
                err instanceof Error ? err.message : "Could not restore version.";
              toastHandler.error("Restore failed", message);
            },
            onSettled: () => setRestoringVersionId(null),
          },
        );
        return;
      }

      // Local Y.Doc snapshot: restore client-side, in place.
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
    [versions, docName, restoreVersionMutation, getVersionSnapshot, toastHandler],
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
    if (persistedQuery.isLoading) return;

    const persisted = persistedQuery.data;
    if (persisted && persisted.suggestions.length > 0) {
      // #189: the persisted GET payload has no `kind`, so recover the real
      // insertion/deletion classification from the live editor redlines
      // (keyed by redlineId) instead of labelling every suggestion an
      // insertion. Falls back to "insertion" only when the redline mark is
      // no longer present in the document.
      const kindById = new Map(
        (editorAdapterRef.current?.extractRedlines() ?? []).map(
          (r) => [r.redlineId, r.kind] as const,
        ),
      );
      setAiItems(
        persisted.suggestions.map((s) => ({
          redline: {
            redlineId: s.redlineId,
            kind: kindById.get(s.redlineId) ?? ("insertion" as const),
            text: s.sourceText ?? "",
          },
          suggestion: s,
          state: resolutionToState(s.resolution?.action),
          resolvedByHolder: getRedlineResolvedHolder(s.resolution),
          accepted: s.accepted,
        })),
      );
      setAiProgress(persisted.progress);
      setAiHasRun(true);
      return;
    }

    // Nothing persisted yet. Only the side whose turn it is generates (POST) —
    // the waiting side (and observers) load whatever the other side has already
    // generated above and view it read-only, rather than being shown an empty
    // "Generate suggestions" prompt.
    if (redlineTurn.canAct) {
      void runAiSuggestions();
    }
  }, [activeTab, aiHasRun, runAiSuggestions, redlineTurn.canAct, persistedQuery.isLoading, persistedQuery.data]);

  // Keep the header progress counts (CM/PM addressed, resolved) live. The
  // rehydrate above seeds them once; this syncs them on every subsequent
  // persisted refetch — e.g. after a side approves/rejects — so "PM addressed"
  // updates without a full reload.
  useEffect(() => {
    const progress = persistedQuery.data?.progress;
    if (progress) setAiProgress(progress);
  }, [persistedQuery.data?.progress]);

  // Keep per-redline dual-approval state live after the initial rehydrate.
  //
  // The rehydrate above runs once (`aiHasRun` guard). But in a live two-user
  // session the OTHER side's acceptance arrives later, via the 10s poll and the
  // post-resolve refetch — and without this it never reaches `aiItems`, so the
  // reconcile effect never sees `phase === "both"` and the replacement is never
  // applied. This merges the latest persisted state into the matching cards.
  //
  // BE-authoritative, but a just-made local optimistic accept the server hasn't
  // echoed yet is kept (unioned in), so an approved card never flickers back to
  // a pending request. An explicit Undo clears the local acceptance first, so it
  // correctly reopens rather than resurrecting here.
  useEffect(() => {
    if (!aiHasRun) return;
    const persisted = persistedQuery.data?.suggestions;
    if (!persisted || persisted.length === 0) return;
    const byId = new Map(persisted.map((s) => [s.redlineId, s] as const));
    setAiItems((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        const s = byId.get(p.redline.redlineId);
        if (!s) return p;
        const serverState = resolutionToState(s.resolution?.action);
        // Adopt the server's resolution when it has one; otherwise keep this
        // side's optimistic state (server still catching up).
        const mergedState = serverState !== "pending" ? serverState : p.state;
        const mergedHolder =
          getRedlineResolvedHolder(s.resolution) ?? p.resolvedByHolder;
        const rawAccepted = mergeAcceptance(p.accepted, s.accepted);
        const acceptedChanged =
          (rawAccepted?.status ?? undefined) !==
            (p.accepted?.status ?? undefined) ||
          Boolean(rawAccepted?.cmAccepted) !== Boolean(p.accepted?.cmAccepted) ||
          Boolean(rawAccepted?.vendorAccepted) !==
            Boolean(p.accepted?.vendorAccepted);
        const mergedAccepted = acceptedChanged ? rawAccepted : p.accepted;
        if (
          mergedState === p.state &&
          mergedHolder === p.resolvedByHolder &&
          mergedAccepted === p.accepted
        ) {
          return p;
        }
        changed = true;
        return {
          ...p,
          state: mergedState,
          resolvedByHolder: mergedHolder,
          accepted: mergedAccepted,
        };
      });
      return changed ? next : prev;
    });
  }, [persistedQuery.data, aiHasRun]);

  // Push the current edit permission into the SuperDoc iframe. When the viewer
  // can act, honour their Suggesting/Editing choice; otherwise force read-only
  // "viewing". Runs after the editor mounts and on every turn/mode flip. Only
  // participants with authoritative turn state drive this; non-participants keep
  // the editor's default mode (pre-existing behavior).
  useEffect(() => {
    const adapter = editorAdapterRef.current;
    if (!adapter?.setMode) return;
    if (!redlineTurn.turnGateReady) return;
    adapter.setMode(redlineTurn.canAct ? editorMode : "viewing");
  }, [editorReady, redlineTurn.turnGateReady, redlineTurn.canAct, editorMode]);

  // Apply accepted recommendations to the document, client-side.
  //
  // The backend records dual-approval state but does NOT modify the document.
  // So when both sides have approved a redline, THIS side (whichever currently
  // holds the turn / can edit) writes the recommended text into the shared
  // SuperDoc; the change then propagates to the other peer via Yjs. Driven off
  // the authoritative both-accepted state rather than a single click, so it
  // still fires when the pair is completed on the other client. Idempotent — a
  // per-id guard plus the live-set check stop double-applies, and it no-ops once
  // the mark is gone.
  const reconciledRedlinesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const adapter = editorAdapterRef.current;
    // Only the side that can currently edit may mutate the shared doc; the
    // waiting (viewing) side receives the applied change through Yjs.
    if (!adapter || !redlineTurn.canAct) return;
    const live = new Set(adapter.extractRedlines().map((r) => r.redlineId));
    for (const item of aiItems) {
      const id = item.redline.redlineId;
      // Accepted/modified only — never a rejection (a dismissed card can also
      // read "resolved").
      if (item.state !== "approved") continue;
      if (reconciledRedlinesRef.current.has(id)) continue;
      if (!live.has(id)) continue; // already applied / removed
      // Apply only on the BE's authoritative "both accepted" signal.
      const bothAccepted =
        Boolean(item.accepted?.shouldRemove) ||
        dualApprovalPhase(item.accepted, redlineTurn.mySide ?? undefined) ===
          "both";
      if (!bothAccepted) continue;
      // Prefer the BE-recorded applied text; else derive from the applied (or
      // resolved) tier's alternative language, then the legacy field.
      const resolution = (item.suggestion as PersistedSuggestion | undefined)
        ?.resolution;
      const alt = item.suggestion?.alternativeLanguage;
      const tier = resolution?.appliedTier ?? resolution?.tier ?? "medium";
      const replacement =
        resolution?.appliedText ||
        (alt?.[tier] ??
          alt?.medium ??
          alt?.low ??
          alt?.high ??
          item.suggestion?.replacementText);
      if (typeof replacement !== "string" || replacement.length === 0) continue;
      reconciledRedlinesRef.current.add(id);
      adapter.replaceRedline(id, replacement);
    }
  }, [aiItems, redlineTurn.canAct, redlineTurn.mySide]);

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
      const mySide = redlineTurn.mySide;

      // The backend applies the accepted recommendation to the document (find +
      // replace + version) from the `documentState` we submit — the FE no longer
      // mutates the doc. Send `appliedTier` so the BE records which tier/text it
      // applied. Capture the current Yjs snapshot (if the iframe can provide one)
      // and submit it with the acceptance; the applied change reaches every
      // editor via the backend.
      const submitResolve = (documentState?: string) =>
        redlineTurn.resolve.mutate(
          {
            redlineId: item.redline.redlineId,
            action: "modified",
            tier,
            appliedTier: tier,
            docName,
            baseVersionId: fileVersionsQuery.data?.activeVersionId ?? null,
            documentState,
          },
          {
            onSuccess: () => {
              persistedQuery.refetch();
            },
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

      const statePromise = adapter.getDocumentState?.();
      if (statePromise) {
        void statePromise.then((state) => submitResolve(state ?? undefined));
      } else {
        submitResolve();
      }

      // Optimistically flip the card: "awaiting other side", or resolved when
      // this was the finalizing approval.
      setAiItems((prev) =>
        prev.map((p) =>
          p.redline.redlineId === item.redline.redlineId
            ? {
                ...p,
                state: "approved",
                resolvedByHolder: mySide ?? undefined,
                accepted: mySide
                  ? withLocalAcceptance(p.accepted, mySide)
                  : p.accepted,
              }
            : p,
        ),
      );
    },
    [
      redlineTurn,
      toastHandler,
      docName,
      fileVersionsQuery.data?.activeVersionId,
      persistedQuery,
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
          onSuccess: () => {
            persistedQuery.refetch();
          },
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
    [
      redlineTurn,
      docName,
      fileVersionsQuery.data?.activeVersionId,
      toastHandler,
      persistedQuery,
    ],
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
                  ? {
                      ...p,
                      state: "pending",
                      resolvedByHolder: undefined,
                      // Clear the withdrawn acceptance so the poll-sync union
                      // doesn't resurrect it (BE has cleared it too).
                      accepted: undefined,
                    }
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
    async (action: "modified" | "rejected", tier: "low" | "medium" | "high" = "medium") => {
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
      // The backend requires the file id in the batch body. Stop here rather
      // than send a request it will reject.
      if (!fileId) {
        toastHandler.error(
          "Redline",
          "Cannot approve: the file ID is missing. Reload the page and try again.",
        );
        return;
      }

      // Refetch before building the batch. The local cards can be stale (the
      // other side may have resolved or accepted since they loaded), and a batch
      // built from them is what the server rejects with a 409.
      const [freshSuggestions, freshVersions] = await Promise.all([
        persistedQuery.refetch(),
        fileVersionsQuery.refetch(),
      ]);
      if (
        freshSuggestions.isError ||
        !freshSuggestions.data ||
        freshVersions.isError
      ) {
        toastHandler.error(
          "Redline",
          "Could not refresh the suggestions. Try again.",
        );
        return;
      }

      // Record this side's approval/rejection for every still-open redline. The
      // backend applies the bilateral-accepted ones to the document from the
      // submitted `documentState`; the FE no longer mutates the doc itself.
      const resolutions = buildBatchItems(freshSuggestions.data.suggestions, {
        action,
        tier,
        mySide: redlineTurn.mySide,
      });
      if (resolutions.length === 0) {
        toastHandler.success("Redline", "Nothing left to resolve.");
        return;
      }
      const baseVersionId = freshVersions.data?.activeVersionId ?? null;

      const resolvedIds = new Set(resolutions.map((r) => r.redlineId));
      const nextState: AiItem["state"] =
        action === "modified" ? "approved" : "dismissed";
      const submitBatch = (documentState?: string) =>
        redlineTurn.batchResolve.mutate(
        {
          resolutions,
          docName,
          baseVersionId,
          documentState,
        },
        {
          onSuccess: () => {
            setAiItems((prev) =>
              prev.map((p) =>
                resolvedIds.has(p.redline.redlineId)
                  ? {
                      ...p,
                      state: nextState,
                      resolvedByHolder: redlineTurn.mySide ?? undefined,
                      accepted:
                        action === "modified" && redlineTurn.mySide
                          ? withLocalAcceptance(p.accepted, redlineTurn.mySide)
                          : p.accepted,
                    }
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
            if (isVersionConflict(error)) {
              toastHandler.error(
                "Redline",
                "Some suggestions changed. The list has been refreshed.",
              );
              void persistedQuery.refetch();
              return;
            }
            toastHandler.error("Redline", error as ApiResponseError);
          },
        },
      );

      // Submit the current Yjs snapshot with the batch so the backend can apply
      // the accepted redlines; not needed for a pure rejection batch.
      const statePromise =
        action === "modified" ? adapter?.getDocumentState?.() : undefined;
      if (statePromise) {
        void statePromise.then((state) => submitBatch(state ?? undefined));
      } else {
        submitBatch();
      }
    },
    [redlineTurn, docName, fileId, fileVersionsQuery, toastHandler, persistedQuery],
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
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Back to contract</span>
          </button>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {fileName || "Document Editor"}
          </h1>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {/* Suggesting ⇄ Editing — shown whenever the viewer can edit, so
                free authoring doesn't have to be tracked as a redline. */}
            {redlineTurn.canAct && (
              <>
                <EditorModeToggle mode={editorMode} onChange={setEditorMode} />
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
              </>
            )}
            {/* Redline turn controls — compact, tooltip-driven, shown in the
                header while reviewing redlines so the negotiation status/actions
                stay visible without a full-width in-panel banner. */}
            {activeTab === "redline" && (
              <>
                <TurnControls
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
                        toastHandler.error(
                          "Send redline turn",
                          e as ApiResponseError,
                        ),
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
                        toastHandler.error(
                          "Finalize redline",
                          e as ApiResponseError,
                        ),
                    })
                  }
                  isSending={redlineTurn.sendTurn.isPending}
                  isFinalizing={redlineTurn.finalize.isPending}
                />
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
              </>
            )}
            {/* Live presence — peers only (self excluded); nothing renders when
                you're alone. Sits to the left of Download in the header. */}
            <PresenceAvatars users={presenceUsers} />
            {docName && (
              <button
                type="button"
                onClick={handleDownloadLatestVersion}
                disabled={downloadLatestMutation.isPending}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="Download latest version"
                title="Download the latest saved snapshot as a .yjs file"
              >
                {downloadLatestMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {downloadLatestMutation.isPending ? "Downloading…" : "Download"}
                </span>
              </button>
            )}
          </div>
        </header>
        {/* Mobile-only switch: the editor and the activity panel each take the
            full width on a phone, so toggle between them. Hidden on md+ where
            they sit side-by-side. */}
        <div className="flex shrink-0 gap-1 border-b border-slate-200 p-1.5 md:hidden dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMobileView("document")}
            aria-pressed={mobileView === "document"}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
              mobileView === "document"
                ? "bg-[#2a4467] text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
            )}
          >
            Document
          </button>
          <button
            type="button"
            onClick={() => setMobileView("panel")}
            aria-pressed={mobileView === "panel"}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
              mobileView === "panel"
                ? "bg-[#2a4467] text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
            )}
          >
            Activity
          </button>
        </div>
        <div className="flex min-h-0 flex-1">
          <div
            className={cn(
              "flex-1 max-w-7xl overflow-auto",
              // On mobile, only show the editor in "document" view; always show
              // it on md+ (side-by-side layout).
              mobileView === "panel" ? "hidden md:block" : "block",
            )}
          >
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
                  // Seed the *initial* edit permission so redlining works the
                  // moment the editor opens — the iframe honors this at
                  // construction. Without it the editor starts in "editing"
                  // (changes untracked, so the insertion/deletion redline
                  // controls stay inactive) and only the live `setMode` effect
                  // below could fix it. `canAct` is the same turn gate the
                  // sidebar uses; the acting side opens in their chosen editor
                  // mode (editing by default), everyone else in "viewing".
                  documentMode={redlineTurn.canAct ? editorMode : "viewing"}
                  onEditorReady={handleEditorReady}
                  onPresenceChange={setPresenceUsers}
                />
              );
            })()}
          </Suspense>
        </div>
        <SidebarPanel
          className={cn(mobileView === "document" && "hidden md:flex")}
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
          activeVersionId={fileVersionsQuery.data?.activeVersionId ?? null}
          restoringVersionId={restoringVersionId}
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
          aiMySide={redlineTurn.mySide}
        />
        </div>
      </div>
    </>
  );
};

export default CollaborationToolPage;
