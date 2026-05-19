import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import YooptaEditor, { createYooptaEditor } from "@yoopta/editor";

type YooptaEditorInstance = ReturnType<typeof createYooptaEditor>;
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
import { createCollab, type AwarenessEntry, type CollabSyncState, type CollabUser } from "../collab/useYooptaYjs";
import PresenceBar from "./PresenceBar";
import { extractRedlines, replaceRedline } from "../collab/redlineScan";
import type { EditorAdapter } from "../collab/editorAdapter";
import Table from "@yoopta/table";
import { useNavigate } from "react-router-dom";
import { XIcon, MessageSquare, Plus, Minus } from "lucide-react";
import { useToastHandler } from "@/hooks/useToaster";
import { useUser } from "@/store/authSlice";

const USER_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#8b5cf6",
];
const hashColor = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

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
  const applyComment = () => {
    const editor = (rest as any).editor as
      | { formats?: Record<string, { update: (attrs: any) => void }> }
      | undefined;
    const commentId = crypto.randomUUID();
    editor?.formats?.comment?.update({ commentId });
    window.dispatchEvent(
      new CustomEvent("ct-add-inline-comment", {
        detail: { commentId },
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
          applyComment();
        }}
        title="Comment on selection"
        aria-label="Comment on selection"
        className="yoopta-toolbar-item yoopta-toolbar-item-mark"
      >
        <MessageSquare className="w-4 h-4" strokeWidth={2} />
      </button>
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
  /** Publish an EditorAdapter so index.tsx can drive AI / redline /
   *  version-history flows against either editor uniformly. */
  onEditorReady?: (adapter: EditorAdapter | null) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  className,
  importMeta,
  collabMeta,
  onEditorReady,
}) => {
  const navigate = useNavigate();
  const editor = useMemo(() => createYooptaEditor(), []);
  const toast = useToastHandler();
  const user = useUser();
  const didImportRef = useRef(false);

  useEffect(() => {
    const adapter: EditorAdapter = {
      kind: "yoopta",
      doc: collab.doc,
      getSnapshot: () => editor.getEditorValue(),
      setSnapshot: (snapshot) => {
        if (snapshot && typeof snapshot === "object") {
          editor.setEditorValue(
            snapshot as Parameters<typeof editor.setEditorValue>[0],
          );
        }
      },
      extractRedlines: () =>
        extractRedlines(editor.getEditorValue() as never),
      replaceRedline: (redlineId, replacement) => {
        const next = replaceRedline(
          editor.getEditorValue() as never,
          redlineId,
          replacement,
        );
        editor.setEditorValue(next as Parameters<typeof editor.setEditorValue>[0]);
      },
    };
    onEditorReady?.(adapter);
    return () => onEditorReady?.(null);
  }, [collab, editor, onEditorReady]);
  const draftKey = useMemo(
    () => `ct:draft:${collabMeta?.roomId ?? "collab:editor"}`,
    [collabMeta?.roomId]
  );
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveValueRef = useRef<unknown>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Held in a ref because the snapshot binding is declared further down
  // (it depends on `collab`, which depends on `localUser`); reading it
  // through a ref keeps `handleEditorChange` from creating a TDZ.
  const collabBindingRef = useRef<{ markLocalChange: (v: unknown) => void } | null>(null);

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
      // Push the change through the snapshot binding so other clients
      // in the same Yjs room converge on this value (debounced inside
      // the binding).
      collabBindingRef.current?.markLocalChange(value);
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
  const localUser = useMemo<CollabUser | null>(() => {
    const name = user?.name || user?.email;
    if (!name) return null;
    return {
      name,
      color: hashColor(user?.email || user?.name || ""),
    };
  }, [user?.email, user?.name]);

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
      localUser: localUser ?? undefined,
    });
    // localUser intentionally omitted from deps — re-creating the provider
    // on identity change would tear down/reconnect the WS. Identity updates
    // are pushed via collab.updateLocalUser below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collabMeta?.disable, collabMeta?.roomId, collabMeta?.token, collabMeta?.wsUrl]);

  useEffect(() => {
    collab.updateLocalUser?.(localUser);
  }, [collab, localUser]);

  useEffect(() => {
    const onFocusMark = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id?: string } | undefined;
      const id = detail?.id;
      const root = canvasRef.current;
      if (!id || !root) return;
      const node = root.querySelector(
        `[data-comment-id="${id}"], [data-redline-id="${id}"]`,
      ) as HTMLElement | null;
      if (!node) return;
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      node.classList.remove("ct-mark-flash");
      // Force reflow so the animation can restart on repeat clicks.
      void node.offsetWidth;
      node.classList.add("ct-mark-flash");
    };
    window.addEventListener("ct-focus-mark", onFocusMark);
    return () => window.removeEventListener("ct-focus-mark", onFocusMark);
  }, []);

  // ── Presence + save-status wiring ─────────────────────────────────
  const [presenceUsers, setPresenceUsers] = useState<AwarenessEntry[]>([]);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [syncState, setSyncState] = useState<CollabSyncState>({
    status: "connecting",
    synced: false,
  });
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const dirtyClearTimerRef = useRef<number | null>(null);

  useEffect(() => collab.subscribeAwareness?.(setPresenceUsers), [collab]);
  useEffect(() => collab.subscribeDeviceCount?.(setDeviceCount), [collab]);
  useEffect(
    () =>
      collab.subscribeSyncState?.((next) => {
        setSyncState(next);
        if (next.synced && next.status === "connected") {
          setDirty(false);
          setLastSavedAt(Date.now());
        }
      }),
    [collab],
  );

  useEffect(() => {
    // Mark dirty on any local Yjs transaction (origin !== provider).
    const onUpdate = (_update: Uint8Array, origin: unknown) => {
      if (origin === collab.provider) return;
      setDirty(true);
      if (dirtyClearTimerRef.current !== null) {
        window.clearTimeout(dirtyClearTimerRef.current);
      }
      // Fallback in case provider.sync doesn't flip back to true reliably:
      // 1.5s of editor idle while connected → treat as saved.
      dirtyClearTimerRef.current = window.setTimeout(() => {
        setDirty(false);
        setLastSavedAt(Date.now());
      }, 1500);
    };
    collab.doc.on("update", onUpdate);
    return () => {
      collab.doc.off("update", onUpdate);
      if (dirtyClearTimerRef.current !== null) {
        window.clearTimeout(dirtyClearTimerRef.current);
        dirtyClearTimerRef.current = null;
      }
    };
  }, [collab]);

  // Snapshot-based collab binding. See useYooptaYjs.ts for rationale —
  // we don't wrap per-block fragments anymore; instead the whole editor
  // value is mirrored into a single Y.Map entry.
  const collabBinding = useMemo(() => collab.createSnapshotBinding(), [collab]);

  useEffect(() => {
    collabBindingRef.current = collabBinding;
    const detach = collabBinding.attach(editor);
    return () => {
      detach();
      collabBindingRef.current = null;
    };
  }, [collabBinding, editor]);

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
          <div
            className="ct-dismiss-pill cursor-pointer"
            onClick={handleNavigateBack}
          >
            <XIcon className="ct-editor-dismiss w-6 h-6" />
          </div>
        </div>
      </div>
      <PresenceBar
        users={presenceUsers}
        deviceCount={deviceCount}
        sync={syncState}
        dirty={dirty}
        lastSavedAt={lastSavedAt}
      />
      <div
        ref={canvasRef}
        className="ct-editor-canvas pl-[4.5rem] mt-5"
        style={{ position: "relative", overflowX: "clip" }}
      >
        <YooptaEditor
          editor={editor}
          plugins={PLUGINS as never}
          marks={MARKS}
          tools={tools}
          onChange={(value) => handleEditorChange(value)}
          placeholder="Type text.."
          className="yoopta-editor w-full"
          style={{ width: "100%", paddingBottom: "120px" }}
        />
      </div>
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
  prev.collabMeta?.presenceActive === next.collabMeta?.presenceActive &&
  prev.onEditorReady === next.onEditorReady;

export default React.memo(EditorPanel, arePropsEqual);
