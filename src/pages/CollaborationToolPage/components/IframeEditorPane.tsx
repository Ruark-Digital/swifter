import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/store/authSlice";
import { useToastHandler } from "@/hooks/useToaster";
import type { EditorAdapter } from "../collab/editorAdapter";
import {
  SUPERDOC_APP_URL,
  superdocOrigin,
  parseSuperdocMessage,
  buildInitPayload,
} from "../collab/superdocBridge";

type EditorImportMeta = { sourceUrl: string; fileName: string; fileType: string };
type EditorCollabMeta = {
  wsUrl: string;
  roomId: string;
  token: string;
  disable: boolean;
  presenceActive: boolean;
};

type Props = {
  importMeta: EditorImportMeta;
  collabMeta: EditorCollabMeta;
  onEditorReady: (adapter: EditorAdapter | null) => void;
};

// Renders the AGPL SuperDoc app in an isolated iframe and bridges to it via
// postMessage only. The host fetches the .docx bytes (it has the network
// context the cross-origin iframe lacks) and ships them on `superdoc:ready`.
// MVP: the sidebar's AI / version features are inert (onEditorReady(null));
// backend comments still work because they don't use the adapter.
const IframeEditorPane: React.FC<Props> = ({
  importMeta,
  collabMeta,
  onEditorReady,
}) => {
  const user = useUser();
  const toastHandler = useToastHandler();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const origin = superdocOrigin();

  const sendInit = useCallback(
    async (signal: AbortSignal) => {
      const frame = iframeRef.current?.contentWindow;
      if (!frame) return;
      if (!importMeta.sourceUrl) return;
      try {
        const res = await fetch(importMeta.sourceUrl, { signal });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const docBytes = await res.arrayBuffer();
        if (signal.aborted) return;
        const msg = buildInitPayload({
          docBytes,
          fileName: importMeta.fileName,
          fileType: importMeta.fileType,
          documentMode: "editing",
          user: { name: user?.name || "Unknown User", email: user?.email || "" },
          roomId: collabMeta.roomId,
          wsUrl: collabMeta.wsUrl,
        });
        frame.postMessage(msg, origin, [docBytes]);
      } catch (error) {
        // A fetch aborted by unmount is expected — don't surface it.
        if (signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        setStatus("error");
        toastHandler.error("Document failed to load", message);
      }
    },
    [
      collabMeta.roomId,
      collabMeta.wsUrl,
      importMeta.fileName,
      importMeta.fileType,
      importMeta.sourceUrl,
      origin,
      toastHandler,
      user?.email,
      user?.name,
    ],
  );

  useEffect(() => {
    const abortController = new AbortController();
    const onMessage = (event: MessageEvent) => {
      const msg = parseSuperdocMessage(event, origin);
      if (!msg) return;
      switch (msg.type) {
        case "superdoc:ready":
          void sendInit(abortController.signal);
          break;
        case "superdoc:editor-ready":
          setStatus("ready");
          // Adapter is null for the MVP — the sidebar's adapter-gated
          // handlers (AI redline, version snapshots) no-op safely.
          onEditorReady(null);
          break;
        case "superdoc:doc-edit":
          window.dispatchEvent(new CustomEvent("ct-doc-edit"));
          break;
        case "superdoc:error":
          setStatus("error");
          toastHandler.error("Editor error", msg.payload.message);
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      abortController.abort();
      window.removeEventListener("message", onMessage);
      onEditorReady(null);
    };
  }, [onEditorReady, origin, sendInit, toastHandler]);

  return (
    <div className="ct-editor-panel relative h-full w-full">
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          {status === "error" ? "Could not load the editor." : "Loading editor…"}
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="SuperDoc editor"
        src={SUPERDOC_APP_URL}
        className="h-full w-full border-0"
        // The framed app is untrusted AGPL code on another origin. Sandbox it,
        // but KEEP allow-same-origin: without it the frame gets an opaque
        // origin, which (a) makes its postMessages arrive as origin "null" so
        // our origin check rejects them, and (b) blocks SuperDoc's IndexedDB
        // persistence. Cross-origin SOP still prevents it reaching SwiftPro.
        sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
      />
    </div>
  );
};

export default IframeEditorPane;
