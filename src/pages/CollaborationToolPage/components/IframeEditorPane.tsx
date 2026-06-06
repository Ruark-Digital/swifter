import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/store/authSlice";
import { useToastHandler } from "@/hooks/useToaster";
import type { EditorAdapter } from "../collab/editorAdapter";
import type { RedlineSpan } from "../collab/redlineScan";
import {
  SUPERDOC_APP_URL,
  superdocOrigin,
  parseSuperdocMessage,
  buildInitPayload,
  buildApplyRedline,
  buildFocusRedline,
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

// Handshake phases, surfaced in the overlay so a stuck load is self-diagnosing:
//  connecting → waiting for the iframe app to post `superdoc:ready`
//  fetching   → downloading the .docx from sourceUrl
//  rendering  → bytes sent; waiting for SuperDoc to report `editor-ready`
//  ready      → editor visible (overlay hidden)
//  error      → errorMsg shown
type Phase = "connecting" | "fetching" | "rendering" | "ready" | "error";

// If the app never announces itself, the iframe almost certainly failed to load
// (app not running, blocked by an extension, or an origin mismatch).
const CONNECT_TIMEOUT_MS = 12000;
// Budget for downloading the .docx before we call it a stalled fetch.
const FETCH_TIMEOUT_MS = 30000;

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
  const [phase, setPhase] = useState<Phase>("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  // Whether the app has posted `superdoc:ready` (read by the connect watchdog).
  const readyRef = useRef(false);

  const origin = superdocOrigin();

  const redlinesRef = useRef<RedlineSpan[]>([]);
  const postCommand = useCallback(
    (msg: { type: string; payload: unknown }) => {
      iframeRef.current?.contentWindow?.postMessage(msg, origin);
    },
    [origin],
  );

  const buildAdapter = useCallback((): EditorAdapter => ({
    kind: "superdoc",
    doc: undefined,
    getSnapshot: () => null,
    setSnapshot: () => {},
    extractRedlines: () => redlinesRef.current,
    replaceRedline: (redlineId, replacement) =>
      postCommand(buildApplyRedline(redlineId, replacement)),
  }), [postCommand]);
  const buildAdapterRef = useRef(buildAdapter);

  const fail = useCallback((message: string) => {
    setErrorMsg(message);
    setPhase("error");
  }, []);

  const sendInit = useCallback(
    async (unmountSignal: AbortSignal) => {
      const frame = iframeRef.current?.contentWindow;
      if (!frame) return;
      if (!importMeta.sourceUrl) {
        fail("No document URL was provided (missing sourceUrl).");
        return;
      }
      setPhase("fetching");

      // Combine unmount-abort with a fetch timeout so a hanging download can't
      // leave the overlay spinning forever.
      const ac = new AbortController();
      const onUnmount = () => ac.abort();
      unmountSignal.addEventListener("abort", onUnmount);
      let timedOut = false;
      const timer = window.setTimeout(() => {
        timedOut = true;
        ac.abort();
      }, FETCH_TIMEOUT_MS);

      try {
        const res = await fetch(importMeta.sourceUrl, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const docBytes = await res.arrayBuffer();
        setPhase("rendering");
        const msg = buildInitPayload({
          docBytes,
          fileName: importMeta.fileName,
          fileType: importMeta.fileType,
          documentMode: "editing",
          user: { name: user?.name || "Unknown User", email: user?.email || "" },
          roomId: collabMeta.roomId,
          wsUrl: collabMeta.wsUrl,
          token: collabMeta.token,
        });
        frame.postMessage(msg, origin, [docBytes]);
      } catch (error) {
        if (unmountSignal.aborted) return; // component gone — stay silent
        const detail = timedOut
          ? "the source server didn't respond in time"
          : error instanceof Error
            ? error.message
            : String(error);
        fail(`Couldn't download the document (${detail}).`);
        toastHandler.error("Document failed to load", detail);
      } finally {
        window.clearTimeout(timer);
        unmountSignal.removeEventListener("abort", onUnmount);
      }
    },
    [
      collabMeta.roomId,
      collabMeta.token,
      collabMeta.wsUrl,
      fail,
      importMeta.fileName,
      importMeta.fileType,
      importMeta.sourceUrl,
      origin,
      toastHandler,
      user?.email,
      user?.name,
    ],
  );

  // Hold the latest callbacks in refs so the message-listener effect can mount
  // exactly ONCE. If the effect depended on `sendInit`/`onEditorReady` directly,
  // an unstable dep (e.g. `useToastHandler()` returns a fresh object each render)
  // would re-run the effect on the `setPhase("fetching")` re-render — and its
  // cleanup would `controller.abort()` the in-flight document fetch, stalling the
  // load forever. Refs keep the effect stable while still calling current logic.
  const sendInitRef = useRef(sendInit);
  const onEditorReadyRef = useRef(onEditorReady);
  const failRef = useRef(fail);
  useEffect(() => {
    sendInitRef.current = sendInit;
    onEditorReadyRef.current = onEditorReady;
    failRef.current = fail;
    buildAdapterRef.current = buildAdapter;
  });

  useEffect(() => {
    // One controller for the component's lifetime — aborted only on real unmount
    // (or by the per-fetch timeout inside sendInit), never on a re-render.
    const controller = new AbortController();
    const onMessage = (event: MessageEvent) => {
      const msg = parseSuperdocMessage(event, origin);
      if (!msg) return;
      switch (msg.type) {
        case "superdoc:ready":
          readyRef.current = true;
          void sendInitRef.current(controller.signal);
          break;
        case "superdoc:editor-ready":
          setPhase("ready");
          onEditorReadyRef.current(buildAdapterRef.current());
          break;
        case "superdoc:redlines":
          redlinesRef.current = msg.payload.redlines;
          break;
        case "superdoc:redline-clicked":
          window.dispatchEvent(
            new CustomEvent("ct-add-redline", {
              detail: { redlineId: msg.payload.redlineId, kind: "insertion" },
            }),
          );
          break;
        case "superdoc:doc-edit":
          window.dispatchEvent(new CustomEvent("ct-doc-edit"));
          break;
        case "superdoc:error":
          failRef.current(msg.payload.message);
          break;
      }
    };
    window.addEventListener("message", onMessage);

    const onFocusRedline = (e: Event) => {
      const id = (e as CustomEvent).detail?.redlineId;
      if (typeof id === "string") postCommand(buildFocusRedline(id));
    };
    window.addEventListener("ct-focus-redline", onFocusRedline);

    // Watchdog: if the app hasn't announced itself, the iframe didn't load.
    const connectTimer = window.setTimeout(() => {
      if (!readyRef.current) {
        failRef.current(
          `The editor app didn't respond. Check it's running at ${SUPERDOC_APP_URL} and isn't blocked by a browser extension.`,
        );
      }
    }, CONNECT_TIMEOUT_MS);

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("ct-focus-redline", onFocusRedline);
      window.clearTimeout(connectTimer);
      controller.abort();
      onEditorReadyRef.current(null);
    };
  }, [origin, postCommand]);

  const overlayText =
    phase === "error"
      ? errorMsg || "Could not load the editor."
      : phase === "fetching"
        ? "Loading editor… (downloading document)"
        : phase === "rendering"
          ? "Loading editor… (rendering document)"
          : "Loading editor… (connecting to editor app)";

  // Not `.ct-editor-panel` — that class forces height:100vh (for the legacy
  // full-page editors), which overflows the header'd column and adds a second
  // scrollbar. We fill the column (h-full) and let the iframe scroll inside.
  return (
    <div className="relative h-full w-full overflow-hidden bg-white dark:bg-slate-950">
      {phase !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {overlayText}
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
