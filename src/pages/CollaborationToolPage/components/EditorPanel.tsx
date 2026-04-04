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
import { cn } from "@/lib/utils";
import "@/pages/CollaborationToolPage/collaboration.css";
import { createCollab } from "../collab/useYooptaYjs";
import Table from "@yoopta/table";
import { useNavigate } from "react-router-dom";
import { convertFileUrlToYoopta } from "@/lib/fileToYoopta";
import { XIcon } from "lucide-react";

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

const MARKS = [Bold, Italic, Underline, Strike, CodeMark, Highlight];

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

    let active = true;

    convertFileUrlToYoopta(
      editor,
      importMeta.sourceUrl,
      importMeta.fileName,
      importMeta.fileType
    ).then((content) => {
      if (!active) return;
      editor.setEditorValue(content);
    });

    return () => {
      active = false;
    };
  }, [editor, importMeta]);

  return (
    <div className={cn("ct-editor-panel", className)}>
      <div className="ct-editor-header">
        <span className="ct-editor-title">Document Editor</span>
        <div
          className="ct-dismiss-pill cursor-pointer"
          onClick={handleNavigateBack}
        >
          <XIcon className="ct-editor-dismiss w-6 h-6" />
        </div>
      </div>
      <div className="ct-editor-canvas pl-[4.5rem] mt-5">
        <YooptaEditor
          editor={editor}
          plugins={collabPlugins}
          marks={MARKS}
          tools={TOOLS}
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
  prev.collabMeta?.presenceActive === next.collabMeta?.presenceActive;

export default React.memo(EditorPanel, arePropsEqual);
