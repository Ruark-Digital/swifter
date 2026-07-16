import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/store/authSlice";
import { useToastHandler } from "@/hooks/useToaster";
import type { EditorAdapter } from "../collab/editorAdapter";
import type { RedlineSpan } from "../collab/redlineScan";
import EditorLoadingSkeleton from "./EditorLoadingSkeleton";
import type { EditorLoadPhase as Phase } from "./EditorLoadingSkeleton";
import IframePresenceBar from "./IframePresenceBar";
import {
  SUPERDOC_APP_URL,
  superdocOrigin,
  parseSuperdocMessage,
  buildInitPayload,
  buildApplyRedline,
  buildFocusRedline,
  buildAddComment,
  buildFocusComment,
  buildSetMode,
  type PresenceUser,
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
  // Bumped by `retry` to remount the iframe (force a fresh load) and re-run the
  // handshake effect. Stable between renders, so it never causes the spurious
  // effect re-runs the mount-once pattern below guards against.
  const [reloadKey, setReloadKey] = useState(0);
  // Whether the app has posted `superdoc:ready` (read by the connect watchdog).
  const readyRef = useRef(false);
  // Room presence (peers, self already excluded by the iframe). `presenceReady`
  // flips on the first `superdoc:presence` message so the bar only appears when
  // collaboration actually connected (document-only fallback → no bar).
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [presenceReady, setPresenceReady] = useState(false);

  // Re-attempt the editor handshake after a failure: reset to the connecting
  // state and remount the iframe so it reloads its src from scratch.
  const retry = useCallback(() => {
    readyRef.current = false;
    setErrorMsg("");
    setPhase("connecting");
    setReloadKey((k) => k + 1);
  }, []);

  const origin = superdocOrigin();

  const redlinesRef = useRef<RedlineSpan[]>([]);
  const postCommand = useCallback(
    (msg: { type: string; payload: unknown }) => {
      iframeRef.current?.contentWindow?.postMessage(msg, origin);
    },
    [origin],
  );

  // In-flight anchorComment requests, keyed by requestId. Resolved by the
  // iframe's `superdoc:comment-created` reply, or with null on timeout/unmount
  // so awaiting callers never hang (the comment then saves unanchored).
  const ANCHOR_TIMEOUT_MS = 5000;
  const pendingAnchorsRef = useRef(
    new Map<string, { resolve: (id: string | null) => void; timer: number }>(),
  );
  const settleAnchor = useCallback((requestId: string, commentId: string | null) => {
    const entry = pendingAnchorsRef.current.get(requestId);
    if (!entry) return;
    pendingAnchorsRef.current.delete(requestId);
    window.clearTimeout(entry.timer);
    entry.resolve(commentId);
  }, []);

  const buildAdapter = useCallback((): EditorAdapter => ({
    kind: "superdoc",
    doc: undefined,
    getSnapshot: () => null,
    setSnapshot: () => {},
    extractRedlines: () => redlinesRef.current,
    replaceRedline: (redlineId, replacement) =>
      postCommand(buildApplyRedline(redlineId, replacement)),
    setMode: (mode) => postCommand(buildSetMode(mode)),
    anchorComment: (text) =>
      new Promise<string | null>((resolve) => {
        const requestId = crypto.randomUUID();
        const timer = window.setTimeout(
          () => settleAnchor(requestId, null),
          ANCHOR_TIMEOUT_MS,
        );
        pendingAnchorsRef.current.set(requestId, { resolve, timer });
        postCommand(buildAddComment(requestId, text));
      }),
  }), [postCommand, settleAnchor]);
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
    // Stable Map identity for the cleanup below (react-hooks/exhaustive-deps).
    const pendingAnchors = pendingAnchorsRef.current;
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
        case "superdoc:presence":
          setPresenceUsers(msg.payload.users);
          setPresenceReady(true);
          break;
        case "superdoc:comment-created":
          settleAnchor(msg.payload.requestId, msg.payload.commentId);
          break;
        case "superdoc:selection":
          // Drives the comments tab's "anchored to selection" chip.
          window.dispatchEvent(
            new CustomEvent("ct-selection-change", { detail: msg.payload }),
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

    const onFocusComment = (e: Event) => {
      const id = (e as CustomEvent).detail?.commentId;
      if (typeof id === "string" && id) postCommand(buildFocusComment(id));
    };
    window.addEventListener("ct-focus-comment", onFocusComment);

    // CommentsTab's click affordance fires `ct-focus-mark { id }` (legacy mark
    // event the full-page editors handle). For the iframe path the id is a
    // tracked-change id — route it to the same focus-redline command so
    // redline-anchored comments scroll too.
    const onFocusMark = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (typeof id === "string" && id) postCommand(buildFocusRedline(id));
    };
    window.addEventListener("ct-focus-mark", onFocusMark);

    // Watchdog: if the app hasn't announced itself, the iframe didn't load.
    const connectTimer = window.setTimeout(() => {
      if (!readyRef.current) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn(`[superdoc] editor app at ${SUPERDOC_APP_URL} never posted superdoc:ready`);
        }
        failRef.current(
          "The editor didn't respond. This can happen on a slow connection or if a browser extension is blocking it.",
        );
      }
    }, CONNECT_TIMEOUT_MS);

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("ct-focus-redline", onFocusRedline);
      window.removeEventListener("ct-focus-comment", onFocusComment);
      window.removeEventListener("ct-focus-mark", onFocusMark);
      window.clearTimeout(connectTimer);
      controller.abort();
      // Settle any in-flight anchor requests so awaiting callers don't hang.
      for (const requestId of [...pendingAnchors.keys()]) {
        settleAnchor(requestId, null);
      }
      onEditorReadyRef.current(null);
    };
    // `reloadKey` re-runs this effect on an explicit retry (fresh controller +
    // watchdog for the remounted iframe). It only changes inside `retry`, never
    // on a normal re-render, so the mount-once guarantee still holds.
    // `settleAnchor` is a stable useCallback([]) — it never retriggers this.
  }, [origin, postCommand, reloadKey, settleAnchor]);

  // Not `.ct-editor-panel` — that class forces height:100vh (for the legacy
  // full-page editors), which overflows the header'd column and adds a second
  // scrollbar. We fill the column (h-full) and let the iframe scroll inside.
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-slate-950">
      {presenceReady && phase === "ready" && (
        <IframePresenceBar users={presenceUsers} />
      )}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {phase !== "ready" && (
          <div
            className="absolute inset-0 z-10 transition-opacity duration-300"
            aria-busy={phase !== "error"}
          >
            <EditorLoadingSkeleton phase={phase} errorMsg={errorMsg} onRetry={retry} />
          </div>
        )}
        <iframe
          key={reloadKey}
          ref={iframeRef}
          title="SuperDoc editor"
          src={SUPERDOC_APP_URL}
          className={
            "h-full w-full border-0 transition-opacity duration-300 " +
            (phase === "ready" ? "opacity-100" : "opacity-0")
          }
          // The framed app is untrusted AGPL code on another origin. Sandbox it,
          // but KEEP allow-same-origin: without it the frame gets an opaque
          // origin, which (a) makes its postMessages arrive as origin "null" so
          // our origin check rejects them, and (b) blocks SuperDoc's IndexedDB
          // persistence. Cross-origin SOP still prevents it reaching SwiftPro.
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
        />
      </div>
    </div>
  );
};

export default IframeEditorPane;
