import React, { useCallback, useEffect, useMemo, useRef } from "react";
import YooptaEditor, { createYooptaEditor } from "@yoopta/editor";
import Paragraph from "@yoopta/paragraph";
import { HeadingOne, HeadingTwo, HeadingThree } from "@yoopta/headings";
import { BulletedList, NumberedList, TodoList } from "@yoopta/lists";
import Blockquote from "@yoopta/blockquote";
import Divider from "@yoopta/divider";
import Code from "@yoopta/code";
import Image from "@yoopta/image";
import Link from "@yoopta/link";
import Toolbar, { DefaultToolbarRender } from "@yoopta/toolbar";
import ActionMenu, { DefaultActionMenuRender } from "@yoopta/action-menu-list";
import LinkTool, { DefaultLinkToolRender } from "@yoopta/link-tool";
import {
  Bold,
  Italic,
  Underline,
  Strike,
  CodeMark,
  Highlight,
} from "@yoopta/marks";
import { CommentMark } from "../collab/CommentMark";
import { InsertionMark, DeletionMark } from "../collab/RedlineMarks";
import { cn } from "@/lib/utils";
import "@/pages/CollaborationToolPage/collaboration.css";
import { createCollab } from "../collab/useYooptaYjs";
import Table from "@yoopta/table";
import { useNavigate } from "react-router-dom";
import { XIcon, History, Save, MessageSquarePlus, Plus, Minus, Sparkles } from "lucide-react";
import AiSuggestionsPanel from "./AiSuggestionsPanel";
import { extractRedlines, replaceRedline, type RedlineSpan } from "../collab/redlineScan";
import {
  useAiRedlineSuggestions,
  type AiRedlineSuggestion,
} from "../collab/useAiRedlineSuggestions";
import { useSearchParams } from "react-router-dom";
import VersionHistoryModal, { Version } from "./VersionHistoryModal";
import { useToastHandler } from "@/hooks/useToaster";
import { useUser } from "@/store/authSlice";

const PLUGINS = [
  Paragraph,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  BulletedList,
  NumberedList,
  TodoList,
  Blockquote,
  Divider,
  Code,
  Image,
  Link,
  Table,
];

const MARKS = [
  Bold,
  Italic,
  Underline,
  Strike,
  CodeMark,
  Highlight,
  CommentMark,
  InsertionMark,
  DeletionMark,
];

type ToolbarRenderProps = Parameters<typeof DefaultToolbarRender>[0] & {
  editor?: { formats?: Record<string, { update: (attrs: any) => void }> };
};

type RedlineToolbarRenderProps = ToolbarRenderProps & {
  authorName: string;
  authorId: string;
};

const RedlineToolbarRender = (props: RedlineToolbarRenderProps) => {
  const { authorName, authorId, ...rest } = props;
  const applyRedline = (kind: "insertion" | "deletion") => {
    const editor = (rest as any).editor as
      | { formats?: Record<string, { update: (attrs: any) => void }> }
      | undefined;
    const redlineId = crypto.randomUUID();
    editor?.formats?.[kind]?.update({
      redlineId,
      author: authorName,
      authorId,
      createdAt: new Date().toISOString(),
    });
    window.dispatchEvent(
      new CustomEvent("ct-add-redline", {
        detail: { redlineId, kind },
      }),
    );
  };
  return (
    <div className="ct-toolbar-fused">
      <DefaultToolbarRender {...(rest as any)} />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          applyRedline("insertion");
        }}
        title="Mark as insertion (redline)"
        aria-label="Mark as insertion"
        className="yoopta-toolbar-item yoopta-toolbar-item-mark"
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          applyRedline("deletion");
        }}
        title="Mark as deletion (redline)"
        aria-label="Mark as deletion"
        className="yoopta-toolbar-item yoopta-toolbar-item-mark"
      >
        <Minus className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
};

type FloatingCommentActionProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  onAddComment: () => void;
};

const FloatingCommentAction: React.FC<FloatingCommentActionProps> = ({
  containerRef,
  onAddComment,
}) => {
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(
    null,
  );

  React.useEffect(() => {
    const compute = () => {
      const sel = window.getSelection();
      const container = containerRef.current;
      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !container) {
        setPos(null);
        return;
      }
      const anchor = sel.anchorNode;
      if (!anchor || !container.contains(anchor)) {
        setPos(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      // pin to the right edge of the selection (Google Docs style),
      // but clamp inside the canvas so the page never has to scroll
      // horizontally to reveal the button.
      const BUTTON = 32;
      const GAP = 12;
      const desiredLeft = rect.right - containerRect.left + GAP;
      const maxLeft = container.clientWidth - BUTTON - 4;
      const left = Math.max(0, Math.min(desiredLeft, maxLeft));
      setPos({
        top: rect.top - containerRect.top + rect.height / 2,
        left,
      });
    };
    const onChange = () => window.requestAnimationFrame(compute);
    document.addEventListener("selectionchange", onChange);
    window.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);
    return () => {
      document.removeEventListener("selectionchange", onChange);
      window.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
    };
  }, [containerRef]);

  if (!pos) return null;
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // preserve selection until after the click handler runs
        e.preventDefault();
      }}
      onClick={() => {
        onAddComment();
        setPos(null);
      }}
      aria-label="Add comment to selection"
      title="Add comment"
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        transform: "translateY(-50%)",
      }}
      className="z-50 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300"
    >
      <MessageSquarePlus className="w-4 h-4" />
    </button>
  );
};

interface EditorPanelProps {
  className?: string;
  importMeta?: {
    sourceUrl: string;
    fileName: string;
    fileType: string;
  };
  collabMeta?: {
    wsUrl: string;
    roomId: string;
    token?: string;
    disable?: boolean;
    presenceActive?: boolean;
  };
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  className,
  importMeta,
  collabMeta,
}) => {
  const navigate = useNavigate();
  const editor = useMemo(() => createYooptaEditor(), []);
  const toast = useToastHandler();
  const user = useUser();
  const [isVersionModalOpen, setIsVersionModalOpen] = React.useState(false);
  const [versions, setVersions] = React.useState<Version[]>([]);
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get("contractId") || undefined;
  const msaContractId = searchParams.get("msaContractId") || undefined;
  const aiMutation = useAiRedlineSuggestions({
    documentId: msaContractId || contractId,
    isMsa: Boolean(msaContractId),
  });
  const [aiOpen, setAiOpen] = React.useState(false);
  type AiItem = {
    redline: RedlineSpan;
    suggestion?: AiRedlineSuggestion;
    state: "pending" | "approved" | "dismissed";
  };
  const [aiItems, setAiItems] = React.useState<AiItem[]>([]);
  // Tracks whether the user has actually triggered a run yet, so the
  // panel can distinguish "never asked" from "asked, no redlines found"
  // (otherwise aiMutation never fires for empty docs and the status
  // permanently reads `idle`).
  const [aiHasRun, setAiHasRun] = React.useState(false);
  const [aiNoRedlines, setAiNoRedlines] = React.useState(false);

  const runAiSuggestions = React.useCallback(async () => {
    setAiHasRun(true);
    const redlines = extractRedlines(editor.getEditorValue() as any);
    if (redlines.length === 0) {
      setAiItems([]);
      setAiNoRedlines(true);
      return;
    }
    setAiNoRedlines(false);
    const analysis = await aiMutation.mutateAsync(redlines);
    const byId = new Map(
      analysis.suggestions.map((s) => [s.redlineId, s]),
    );
    setAiItems(
      redlines.map((r) => ({
        redline: r,
        suggestion: byId.get(r.redlineId),
        state: "pending" as const,
      })),
    );
  }, [aiMutation, editor]);

  const handleOpenAi = React.useCallback(() => {
    setAiOpen(true);
    // Only auto-fetch on the very first open; afterwards the user
    // drives generation explicitly via the panel's Generate button.
    if (!aiHasRun) {
      void runAiSuggestions();
    }
  }, [aiHasRun, runAiSuggestions]);

  const handleApproveAi = React.useCallback(
    (item: AiItem) => {
      if (!item.suggestion) return;
      // The swagger AI endpoint returns an accept/reject/negotiate verdict +
      // assessment text, not a replacement string. We surface the verdict in
      // the panel; if the user clicks "Apply recommendation" and the verdict
      // is "reject", revert the redline; otherwise just mark it reviewed.
      if (item.suggestion.suggestion === "reject") {
        const next = replaceRedline(
          editor.getEditorValue() as any,
          item.redline.redlineId,
          item.redline.kind === "insertion" ? "" : item.redline.text,
        );
        editor.setEditorValue(next as any);
      }
      setAiItems((prev) =>
        prev.map((p) =>
          p.redline.redlineId === item.redline.redlineId
            ? { ...p, state: "approved" }
            : p,
        ),
      );
    },
    [editor],
  );

  const handleDismissAi = React.useCallback((item: AiItem) => {
    setAiItems((prev) =>
      prev.map((p) =>
        p.redline.redlineId === item.redline.redlineId
          ? { ...p, state: "dismissed" }
          : p,
      ),
    );
  }, []);

  const aiStatus: "idle" | "loading" | "ready" | "error" | "empty" =
    aiMutation.isPending
      ? "loading"
      : aiMutation.isError
        ? "error"
        : aiNoRedlines
          ? "empty"
          : aiItems.length > 0 || aiMutation.isSuccess
            ? "ready"
            : "idle";
  const didImportRef = useRef(false);
  const draftKey = useMemo(
    () => `ct:draft:${collabMeta?.roomId ?? "collab:editor"}`,
    [collabMeta?.roomId]
  );
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveValueRef = useRef<unknown>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const handleSaveVersion = useCallback(() => {
    const newVersion: Version = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      author: user?.name || "Unknown User",
    };
    try {
      const editorState = editor.getEditorValue();
      localStorage.setItem(
        `doc-version-${newVersion.id}`,
        JSON.stringify(editorState)
      );
      setVersions((prev) => [newVersion, ...prev]);
      toast.success("Version saved", "Document version saved successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Version save failed", message);
    }
  }, [editor, toast, user?.name]);

  const handleRestoreVersion = useCallback((versionId: string) => {
    try {
      const savedState = localStorage.getItem(`doc-version-${versionId}`);
      if (!savedState) return;
      editor.setEditorValue(JSON.parse(savedState));
      setIsVersionModalOpen(false);
      toast.success("Version restored", "Document version restored successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Version restore failed", message);
    }
  }, [editor, toast]);

  const handleEditorChange = useCallback(
    (value: unknown) => {
      autosaveValueRef.current = value;
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = window.setTimeout(() => {
        try {
          window.localStorage.setItem(draftKey, JSON.stringify(autosaveValueRef.current));
        } catch {
          // ignore storage failures
        }
      }, 2000);
    },
    [draftKey]
  );

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (didImportRef.current) return;
    const current = editor.getEditorValue();
    if (current && Object.keys(current).length > 0) return;

    const rawDraft = window.localStorage.getItem(draftKey);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft);
      editor.setEditorValue(draft);
      didImportRef.current = true;
    } catch {
      // ignore invalid drafts
    }
  }, [draftKey, editor]);
  const collab = useMemo(() => {
    // y-websocket attaches `?<params>` itself, so we pass token via the
    // params option rather than mutating wsUrl — avoids the double `?` bug
    // when wsUrl already carries query state.
    const wsUrl =
      collabMeta?.wsUrl ||
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_YWS_URL ||
      "ws://localhost:1234";

    return createCollab({
      wsUrl,
      roomId: collabMeta?.roomId || "collab:editor",
      disable: collabMeta?.disable ?? false,
      token: collabMeta?.token || undefined,
    });
  }, [collabMeta?.disable, collabMeta?.roomId, collabMeta?.token, collabMeta?.wsUrl]);

  const collabPlugins = useMemo(() => collab.wrapPluginsWithCollab(PLUGINS), [collab]);

  const tools = useMemo(() => {
    const authorName = user?.name || "Unknown User";
    const authorId = user?._id || user?.email || "";
    return {
      Toolbar: {
        tool: Toolbar,
        render: (props: any) => (
          <RedlineToolbarRender
            {...props}
            authorName={authorName}
            authorId={authorId}
          />
        ),
      },
      ActionMenu: { tool: ActionMenu, render: DefaultActionMenuRender },
      LinkTool: { tool: LinkTool, render: DefaultLinkToolRender },
    };
  }, [user?._id, user?.email, user?.name]);
  const handleNavigateBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(
    () => () => {
      collab.destroy();
    },
    [collab]
  );

  useEffect(() => {
    collab.setPresenceActive(collabMeta?.presenceActive ?? true);
  }, [collab, collabMeta?.presenceActive]);

  useEffect(() => {
    if (!importMeta?.sourceUrl) return;
    if (didImportRef.current) return;

    let active = true;

    (async () => {
      const importState = collab.doc.getMap<string>("ct:import");
      const clientId = String(collab.doc.clientID);

      const current = editor.getEditorValue();
      if (current && Object.keys(current).length > 0) {
        importState.set("imported", "true");
        if (importState.get("lock") === clientId) {
          importState.delete("lock");
        }
        didImportRef.current = true;
        return;
      }

      const claimLock = () => {
        if (!importState.get("lock")) {
          importState.set("lock", clientId);
        }
        return importState.get("lock") === clientId;
      };

      if (!claimLock()) {
        for (let attempt = 0; attempt < 25; attempt += 1) {
          if (!active) return;
          await new Promise<void>((resolve) => {
            window.setTimeout(() => resolve(), 100);
          });
          if (claimLock()) break;
        }
      }

      if (importState.get("lock") !== clientId) return;

      try {
        const { convertFileUrlToYoopta } = await import("@/lib/fileToYoopta");
        const content = await convertFileUrlToYoopta(
          editor,
          importMeta.sourceUrl,
          importMeta.fileName,
          importMeta.fileType
        );

        if (!active) return;
        editor.setEditorValue(content);
        importState.set("imported", "true");
        didImportRef.current = true;
      } finally {
        if (importState.get("lock") === clientId) {
          importState.delete("lock");
        }
      }
    })().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Import failed", message);
    });

    return () => {
      active = false;
    };
  }, [collab.doc, editor, importMeta?.fileName, importMeta?.fileType, importMeta?.sourceUrl, toast]);

  return (
    <div className={cn("ct-editor-panel", className)}>
      <div className="ct-editor-header">
        <span className="ct-editor-title">Document Editor</span>
        <div className="flex items-center gap-4">
          <button
            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60"
            onClick={handleSaveVersion}
            aria-label="Save Version"
          >
            <Save className="w-4 h-4" />
            <span className="sr-only">Save Version</span>
          </button>
          <button
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center gap-1 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => setIsVersionModalOpen(true)}
            aria-label="View Version History"
          >
            <History className="w-4 h-4" />
            <span className="sr-only">History</span>
          </button>
          <button
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200 transition-colors flex items-center gap-1 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
            onClick={handleOpenAi}
            aria-label="AI Polish redlines"
            title="AI Polish — suggest professional rephrases for redlines"
          >
            <Sparkles className="w-4 h-4" />
            <span className="sr-only">AI Polish</span>
          </button>
          <div
            className="ct-dismiss-pill cursor-pointer"
            onClick={handleNavigateBack}
          >
            <XIcon className="ct-editor-dismiss w-6 h-6" />
          </div>
        </div>
      </div>
      <div
        ref={canvasRef}
        className="ct-editor-canvas pl-[4.5rem] mt-5"
        style={{ position: "relative", overflowX: "clip" }}
      >
        <YooptaEditor
          editor={editor}
          plugins={collabPlugins}
          marks={MARKS}
          tools={tools}
          onChange={(value) => handleEditorChange(value)}
          placeholder="Type text.."
          className="yoopta-editor w-full"
          style={{ width: "100%", paddingBottom: "120px" }}
        />
        <FloatingCommentAction
          containerRef={canvasRef}
          onAddComment={() => {
            const commentId = crypto.randomUUID();
            editor.formats.comment.update({ commentId });
            window.dispatchEvent(
              new CustomEvent("ct-add-inline-comment", {
                detail: { commentId },
              }),
            );
          }}
        />
      </div>
      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        versions={versions}
        onRestore={handleRestoreVersion}
      />
      <AiSuggestionsPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        status={aiStatus}
        errorMessage={(aiMutation.error as Error | undefined)?.message}
        items={aiItems}
        onApprove={handleApproveAi}
        onDismiss={handleDismissAi}
        onRetry={runAiSuggestions}
      />
    </div>
  );
};

const arePropsEqual = (prev: EditorPanelProps, next: EditorPanelProps) =>
  prev.className === next.className &&
  prev.importMeta?.sourceUrl === next.importMeta?.sourceUrl &&
  prev.importMeta?.fileName === next.importMeta?.fileName &&
  prev.importMeta?.fileType === next.importMeta?.fileType &&
  prev.collabMeta?.wsUrl === next.collabMeta?.wsUrl &&
  prev.collabMeta?.roomId === next.collabMeta?.roomId &&
  prev.collabMeta?.disable === next.collabMeta?.disable &&
  prev.collabMeta?.token === next.collabMeta?.token &&
  prev.collabMeta?.presenceActive === next.collabMeta?.presenceActive;

export default React.memo(EditorPanel, arePropsEqual);
