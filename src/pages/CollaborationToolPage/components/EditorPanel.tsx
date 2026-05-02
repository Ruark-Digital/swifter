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
import { cn } from "@/lib/utils";
import "@/pages/CollaborationToolPage/collaboration.css";
import { createCollab } from "../collab/useYooptaYjs";
import Table from "@yoopta/table";
import { useNavigate } from "react-router-dom";
import { XIcon, History, Save, MessageSquarePlus } from "lucide-react";
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

const MARKS = [Bold, Italic, Underline, Strike, CodeMark, Highlight, CommentMark];

const TOOLS = {
  Toolbar: { tool: Toolbar, render: DefaultToolbarRender },
  ActionMenu: { tool: ActionMenu, render: DefaultActionMenuRender },
  LinkTool: { tool: LinkTool, render: DefaultLinkToolRender },
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
  const didImportRef = useRef(false);
  const draftKey = useMemo(
    () => `ct:draft:${collabMeta?.roomId ?? "collab:editor"}`,
    [collabMeta?.roomId]
  );
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveValueRef = useRef<unknown>(null);

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
    const wsUrl = collabMeta?.wsUrl || import.meta.env.VITE_YWS_URL || "ws://localhost:1234";
    let resolvedWsUrl = wsUrl;

    if (collabMeta?.token) {
      try {
        const url = new URL(wsUrl);
        if (!url.searchParams.get("token")) {
          url.searchParams.set("token", collabMeta.token);
        }
        resolvedWsUrl = url.toString();
      } catch {
        resolvedWsUrl = wsUrl;
      }
    }

    return createCollab({
      wsUrl: resolvedWsUrl,
      roomId: collabMeta?.roomId || "collab:editor",
      disable: collabMeta?.disable ?? false,
    });
  }, [collabMeta?.disable, collabMeta?.roomId, collabMeta?.token, collabMeta?.wsUrl]);

  const collabPlugins = useMemo(() => collab.wrapPluginsWithCollab(PLUGINS), [collab]);
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
            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
            onClick={handleSaveVersion}
            aria-label="Save Version"
          >
            <Save className="w-4 h-4" />
            <span className="sr-only">Save Version</span>
          </button>
          <button
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center gap-1"
            onClick={() => setIsVersionModalOpen(true)}
            aria-label="View Version History"
          >
            <History className="w-4 h-4" />
            <span className="sr-only">History</span>
          </button>
          <button
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
            onClick={() => {
              const commentId = crypto.randomUUID();
              editor.formats.comment.update({ commentId });
              window.dispatchEvent(
                new CustomEvent("ct-add-inline-comment", {
                  detail: { commentId },
                })
              );
            }}
            aria-label="Add Inline Comment"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span className="sr-only">Add Inline Comment</span>
          </button>
          <div
            className="ct-dismiss-pill cursor-pointer"
            onClick={handleNavigateBack}
          >
            <XIcon className="ct-editor-dismiss w-6 h-6" />
          </div>
        </div>
      </div>
      <div className="ct-editor-canvas pl-[4.5rem] mt-5">
        <YooptaEditor
          editor={editor}
          plugins={collabPlugins}
          marks={MARKS}
          tools={TOOLS}
          onChange={(value) => handleEditorChange(value)}
          placeholder="Type text.."
          className="yoopta-editor w-full"
          style={{ width: "100%", paddingBottom: "120px" }}
        />
      </div>
      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        versions={versions}
        onRestore={handleRestoreVersion}
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
