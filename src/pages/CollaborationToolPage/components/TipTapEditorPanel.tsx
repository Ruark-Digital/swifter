// Tracer-bullet TipTap editor panel for sub-phase 1 of the Yoopta →
// TipTap migration. Mounted only when the URL carries `?editor=tiptap`;
// the default Yoopta panel keeps working for every other request.
//
// Scope: plain text editing + presence cursors + presence bar (avatars
// + Saving/Saved/Offline label). Redline marks, comment marks, AI
// suggestions, version history, DOCX import — all out of scope until
// SP2/3/4. The point of this panel is to prove character-level CRDT
// sync against the existing BE before any feature port begins.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  XIcon,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  AlignLeft as AlignLeftIcon,
  AlignCenter as AlignCenterIcon,
  AlignRight as AlignRightIcon,
  AlignJustify as AlignJustifyIcon,
  Plus,
  Minus,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "@/pages/CollaborationToolPage/collaboration.css";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/store/authSlice";
import {
  createCollabProvider,
  type AwarenessEntry,
  type CollabSyncState,
  type CollabUser,
} from "../collab/useCollabProvider";
import { useTipTapEditor } from "../collab/useTipTapEditor";
import PresenceBar from "./PresenceBar";
import { useToastHandler } from "@/hooks/useToaster";
import {
  extractRedlinesFromEditor,
  replaceRedlineInEditor,
} from "../collab/redlineScanTipTap";
import type { EditorAdapter } from "../collab/editorAdapter";

const USER_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#0ea5e9",
  "#8b5cf6",
];
const hashColor = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

interface TipTapEditorPanelProps {
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
  /** Publish an EditorAdapter up to the page so AI / redline / version
   *  flows can run against this editor. */
  onEditorReady?: (adapter: EditorAdapter | null) => void;
}

const TipTapEditorPanel: React.FC<TipTapEditorPanelProps> = ({
  className,
  importMeta,
  collabMeta,
  onEditorReady,
}) => {
  const navigate = useNavigate();
  const user = useUser();
  const toast = useToastHandler();
  const didImportRef = useRef(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Mirrors EditorPanel's ct-focus-mark handler — clicking a sidebar
  // feed item that's anchored to an editor mark dispatches this event;
  // we find the matching DOM node and scroll/flash it.
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
      void node.offsetWidth;
      node.classList.add("ct-mark-flash");
    };
    window.addEventListener("ct-focus-mark", onFocusMark);
    return () => window.removeEventListener("ct-focus-mark", onFocusMark);
  }, []);

  const localUser = useMemo<CollabUser | null>(() => {
    const name = user?.name || user?.email;
    if (!name) return null;
    return {
      name,
      color: hashColor(user?.email || user?.name || ""),
    };
  }, [user?.email, user?.name]);

  // localUser deliberately omitted from deps so identity changes don't
  // tear down the WS. Identity updates flow through updateLocalUser
  // in the effect below.
  const collab = useMemo(() => {
    const wsUrl =
      collabMeta?.wsUrl ||
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_YWS_URL ||
      "ws://localhost:1234";
    return createCollabProvider({
      wsUrl,
      roomId: collabMeta?.roomId || "collab:editor",
      disable: collabMeta?.disable ?? false,
      token: collabMeta?.token || undefined,
      localUser: localUser ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collabMeta?.disable, collabMeta?.roomId, collabMeta?.token, collabMeta?.wsUrl]);

  useEffect(() => {
    collab.updateLocalUser(localUser);
  }, [collab, localUser]);

  useEffect(
    () => () => {
      collab.destroy();
    },
    [collab],
  );

  // Dev-only diagnostics: expose provider + doc on window so we can
  // poke at them from DevTools. Removed before SP1 ships.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __ct: unknown }).__ct = {
      provider: collab.provider,
      doc: collab.doc,
      awareness: collab.provider?.awareness,
    };
  }, [collab]);

  useEffect(() => {
    collab.setPresenceActive(collabMeta?.presenceActive ?? true);
  }, [collab, collabMeta?.presenceActive]);

  const editor = useTipTapEditor({
    doc: collab.doc,
    provider: collab.provider,
    localUser,
  });

  // Publish an EditorAdapter so index.tsx can drive AI / redline /
  // version-history flows. Republish whenever the editor instance
  // changes; clear on unmount.
  useEffect(() => {
    if (!editor) {
      onEditorReady?.(null);
      return;
    }
    const adapter: EditorAdapter = {
      kind: "tiptap",
      doc: collab.doc,
      getSnapshot: () => editor.getJSON(),
      setSnapshot: (snapshot) => {
        if (snapshot && typeof snapshot === "object") {
          editor.commands.setContent(snapshot as Parameters<typeof editor.commands.setContent>[0]);
        }
      },
      extractRedlines: () => extractRedlinesFromEditor(editor),
      replaceRedline: (redlineId, replacement) => {
        replaceRedlineInEditor(editor, redlineId, replacement);
      },
    };
    onEditorReady?.(adapter);
    return () => onEditorReady?.(null);
  }, [collab, editor, onEditorReady]);

  // ── File import (mammoth → HTML → setContent) ─────────────────────
  // Strategy: give Yjs up to SYNC_WAIT_MS to deliver remote content,
  // then import locally if the editor is still empty. This is robust
  // against three failure modes we've hit on this BE:
  //   • single-WS-slot kick (code 4000) → provider disconnects, sync
  //     never fires → we still want the user to see the document.
  //   • dropped sync frames → presence works but doc updates don't →
  //     ditto.
  //   • cold-start with no peers → no remote state to inherit → must
  //     run mammoth ourselves.
  // The pre-setContent emptiness check prevents clobbering remote
  // content if sync arrives during the mammoth fetch.
  const isEditorEmpty = useCallback(() => {
    if (!editor) return true;
    const json = editor.getJSON();
    if (!json?.content || json.content.length === 0) return true;
    if (json.content.length !== 1) return false;
    const first = json.content[0];
    return !first.content || first.content.length === 0;
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    if (didImportRef.current) return;
    if (!importMeta?.sourceUrl) return;

    const SYNC_WAIT_MS = 1500;
    let cancelled = false;

    const runImport = async () => {
      if (cancelled) return;
      // Re-check emptiness — sync may have hydrated the editor while
      // we were waiting.
      if (!isEditorEmpty()) {
        didImportRef.current = true;
        return;
      }

      try {
        const { convertDocxToHtml, convertPdfToHtml, getFileExtension } =
          await import("@/lib/fileUtils");
        const res = await fetch(importMeta.sourceUrl);
        const ab = await res.arrayBuffer();
        const ext = getFileExtension(importMeta.fileName, importMeta.fileType);
        let html = "";
        if (ext === "DOCX") html = await convertDocxToHtml(ab);
        else if (ext === "PDF") html = await convertPdfToHtml(ab);

        if (cancelled) return;
        // Double-check: a peer may have streamed content in during the
        // fetch. If so, abandon our import — their state wins.
        if (!html || !isEditorEmpty()) {
          didImportRef.current = true;
          return;
        }
        editor.commands.setContent(html);
        didImportRef.current = true;
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        toast.error("Import failed", message);
      }
    };

    // If the provider is already synced (or absent), import now.
    if (!collab.provider || collab.provider.synced) {
      void runImport();
      return () => {
        cancelled = true;
      };
    }

    // Otherwise wait for sync up to SYNC_WAIT_MS, then import anyway.
    let timeoutId: number | null = null;
    const onSync = (synced: boolean) => {
      if (!synced || cancelled) return;
      collab.provider?.off("sync", onSync);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      void runImport();
    };
    collab.provider.on("sync", onSync);
    timeoutId = window.setTimeout(() => {
      collab.provider?.off("sync", onSync);
      void runImport();
    }, SYNC_WAIT_MS);

    return () => {
      cancelled = true;
      collab.provider?.off("sync", onSync);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [collab, editor, importMeta?.fileName, importMeta?.fileType, importMeta?.sourceUrl, isEditorEmpty, toast]);

  // ── Presence + save-status wiring (mirrors EditorPanel.tsx) ──────
  const [presenceUsers, setPresenceUsers] = useState<AwarenessEntry[]>([]);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [syncState, setSyncState] = useState<CollabSyncState>({
    status: "connecting",
    synced: false,
  });
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const dirtyClearTimerRef = useRef<number | null>(null);

  useEffect(() => collab.subscribeAwareness(setPresenceUsers), [collab]);
  useEffect(() => collab.subscribeDeviceCount(setDeviceCount), [collab]);
  useEffect(
    () =>
      collab.subscribeSyncState((next) => {
        setSyncState(next);
        if (next.synced && next.status === "connected") {
          setDirty(false);
          setLastSavedAt(Date.now());
        }
      }),
    [collab],
  );

  useEffect(() => {
    const onUpdate = (_update: Uint8Array, origin: unknown) => {
      if (origin === collab.provider) return;
      setDirty(true);
      if (dirtyClearTimerRef.current !== null) {
        window.clearTimeout(dirtyClearTimerRef.current);
      }
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

  // ── Auto-snapshot for plain text edits ────────────────────────────
  // Listens to local Y.Doc updates and emits a `ct-doc-edit` event after
  // the user idles for `EDIT_DEBOUNCE_MS`. index.tsx turns that into a
  // version snapshot with kind="edit" so typing creates timeline entries
  // even without redlines/comments/AI.
  //
  // Gating:
  //   • origin === provider → remote update, skip.
  //   • didImportRef.current === false → still seeding from mammoth,
  //     don't snapshot the import itself.
  // Successive keystrokes within the debounce window coalesce into one
  // snapshot. Long writing sessions still produce multiple entries as
  // the user pauses; the 50-entry cap in `useCollabVersions` keeps the
  // list bounded.
  useEffect(() => {
    const EDIT_DEBOUNCE_MS = 5000;
    let timer: number | null = null;
    const onUpdate = (_update: Uint8Array, origin: unknown) => {
      if (origin === collab.provider) return;
      if (!didImportRef.current) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        window.dispatchEvent(new CustomEvent("ct-doc-edit"));
      }, EDIT_DEBOUNCE_MS);
    };
    collab.doc.on("update", onUpdate);
    return () => {
      collab.doc.off("update", onUpdate);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [collab]);

  return (
    <div className={cn("ct-editor-panel", className)}>
      <div className="ct-editor-header">
        <span className="ct-editor-title">Document Editor (TipTap preview)</span>
        <div className="flex items-center gap-4">
          <div
            className="ct-dismiss-pill cursor-pointer"
            onClick={() => navigate(-1)}
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
        className="ct-editor-canvas mt-5"
        style={{ position: "relative" }}
        onClick={() => editor?.commands.focus()}
      >
        <div className="ct-tiptap-page">
        {editor && (
          <BubbleMenu
            editor={editor}
            className="ct-bubble-menu inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white shadow-md px-1 py-1 dark:bg-slate-900 dark:border-slate-700"
          >
            <button
              type="button"
              title="Bold (Mod+B)"
              aria-label="Bold"
              className={`ct-bm-btn ${editor.isActive("bold") ? "ct-bm-btn--active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleBold().run();
              }}
            >
              <BoldIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Italic (Mod+I)"
              aria-label="Italic"
              className={`ct-bm-btn ${editor.isActive("italic") ? "ct-bm-btn--active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleItalic().run();
              }}
            >
              <ItalicIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Underline (Mod+U)"
              aria-label="Underline"
              className={`ct-bm-btn ${editor.isActive("underline") ? "ct-bm-btn--active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleUnderline().run();
              }}
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <div className="ct-bm-sep" aria-hidden="true" />
            <button
              type="button"
              title="Align left"
              aria-label="Align left"
              className={`ct-bm-btn ${editor.isActive({ textAlign: "left" }) ? "ct-bm-btn--active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().setTextAlign("left").run();
              }}
            >
              <AlignLeftIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Align center"
              aria-label="Align center"
              className={`ct-bm-btn ${editor.isActive({ textAlign: "center" }) ? "ct-bm-btn--active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().setTextAlign("center").run();
              }}
            >
              <AlignCenterIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Align right"
              aria-label="Align right"
              className={`ct-bm-btn ${editor.isActive({ textAlign: "right" }) ? "ct-bm-btn--active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().setTextAlign("right").run();
              }}
            >
              <AlignRightIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Justify"
              aria-label="Justify"
              className={`ct-bm-btn ${editor.isActive({ textAlign: "justify" }) ? "ct-bm-btn--active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().setTextAlign("justify").run();
              }}
            >
              <AlignJustifyIcon className="w-4 h-4" />
            </button>
            <div className="ct-bm-sep" aria-hidden="true" />
            <button
              type="button"
              title="Mark as insertion (redline)"
              aria-label="Mark as insertion"
              className="ct-bm-btn"
              onMouseDown={(e) => {
                e.preventDefault();
                const redlineId = crypto.randomUUID();
                editor
                  .chain()
                  .focus()
                  .setInsertionMark({
                    redlineId,
                    author: localUser?.name ?? "Unknown User",
                    authorId: (user?._id ?? user?.email ?? "") as string,
                    createdAt: new Date().toISOString(),
                  })
                  .run();
                window.dispatchEvent(
                  new CustomEvent("ct-add-redline", {
                    detail: { redlineId, kind: "insertion" },
                  }),
                );
              }}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Mark as deletion (redline)"
              aria-label="Mark as deletion"
              className="ct-bm-btn"
              onMouseDown={(e) => {
                e.preventDefault();
                const redlineId = crypto.randomUUID();
                editor
                  .chain()
                  .focus()
                  .setDeletionMark({
                    redlineId,
                    author: localUser?.name ?? "Unknown User",
                    authorId: (user?._id ?? user?.email ?? "") as string,
                    createdAt: new Date().toISOString(),
                  })
                  .run();
                window.dispatchEvent(
                  new CustomEvent("ct-add-redline", {
                    detail: { redlineId, kind: "deletion" },
                  }),
                );
              }}
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="ct-bm-sep" aria-hidden="true" />
            <button
              type="button"
              title="Comment on selection"
              aria-label="Comment on selection"
              className="ct-bm-btn"
              onMouseDown={(e) => {
                e.preventDefault();
                const commentId = crypto.randomUUID();
                editor
                  .chain()
                  .focus()
                  .setCommentMark({ commentId })
                  .run();
                window.dispatchEvent(
                  new CustomEvent("ct-add-inline-comment", {
                    detail: { commentId },
                  }),
                );
              }}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </BubbleMenu>
        )}
        <EditorContent
          editor={editor}
          className="ct-tiptap w-full"
        />
        </div>
      </div>
    </div>
  );
};

export default React.memo(TipTapEditorPanel);
