import React, { useCallback, useEffect, useMemo } from "react";
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
import { XIcon, HistoryIcon } from "lucide-react";
import DocumentViewer from "./DocumentViewer";
import VersionHistoryModal, { Version } from "./VersionHistoryModal";

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
  initialValue?: string;
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
  const [isVersionModalOpen, setIsVersionModalOpen] = React.useState(false);
  const [versions, setVersions] = React.useState<Version[]>([]);

  const handleSaveVersion = useCallback(() => {
    const editorState = editor.getEditorValue();
    const newVersion: Version = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      author: "Current User", // Mock user, ideally from auth context
    };
    
    // In a real app, this would be an API call to save the editorState JSON
    // We store it locally in an array for demonstration
    localStorage.setItem(`doc-version-${newVersion.id}`, JSON.stringify(editorState));
    setVersions(prev => [newVersion, ...prev]);
    alert("Version saved successfully!");
  }, [editor]);

  const handleRestoreVersion = useCallback((versionId: string) => {
    const savedState = localStorage.getItem(`doc-version-${versionId}`);
    if (savedState) {
      editor.setEditorValue(JSON.parse(savedState));
      setIsVersionModalOpen(false);
      alert("Version restored successfully!");
    }
  }, [editor]);
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

    // We no longer convert PDF, Excel, and Docx files to Yoopta blocks for optimization.
    // They are handled by DocumentViewer natively.
    // We only load empty state into YooptaEditor if we're dealing with native viewers.
  }, [editor, importMeta]);

  return (
    <div className={cn("ct-editor-panel flex flex-col h-full", className)}>
      <div className="ct-editor-header flex-shrink-0">
        <span className="ct-editor-title">Document Editor</span>
        <div className="flex items-center gap-4">
          <button
            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
            onClick={handleSaveVersion}
            aria-label="Save Version"
          >
            Save Version
          </button>
          <button
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center gap-1"
            onClick={() => setIsVersionModalOpen(true)}
            aria-label="View Version History"
          >
            <HistoryIcon className="w-4 h-4" />
            History
          </button>
          <button
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
            onClick={() => {
              const commentId = crypto.randomUUID();
              editor.formats.comment.update({ commentId });
              // Trigger a custom event so SidebarPanel knows to open a new comment input for this ID
              window.dispatchEvent(new CustomEvent('ct-add-inline-comment', { detail: { commentId } }));
            }}
            aria-label="Add Inline Comment"
          >
            Add Comment
          </button>
          <div
            className="ct-dismiss-pill cursor-pointer"
            onClick={handleNavigateBack}
          >
            <XIcon className="ct-editor-dismiss w-6 h-6" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {importMeta?.sourceUrl && (
          <div className="w-1/2 border-r border-gray-200 overflow-auto h-full">
            <DocumentViewer
              sourceUrl={importMeta.sourceUrl}
              fileName={importMeta.fileName}
              fileType={importMeta.fileType}
            />
          </div>
        )}
        <div className={`ct-editor-canvas mt-5 overflow-auto h-full ${importMeta?.sourceUrl ? "w-1/2 pl-4" : "w-full pl-[4.5rem]"}`}>
          <YooptaEditor
            editor={editor}
            plugins={collabPlugins}
            marks={MARKS}
            tools={TOOLS}
            placeholder="Type text.."
            className="yoopta-editor w-full h-full"
            style={{ width: "100%", paddingBottom: "120px" }}
          />
        </div>
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
