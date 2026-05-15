import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { withYjs, YjsEditor } from "@slate-yjs/core";
import type { YooEditor, SlateEditor, SlateElement } from "@yoopta/editor";
import { YooptaPlugin } from "@yoopta/editor";

export type CollabConfig = {
  wsUrl: string;
  roomId: string;
  disable?: boolean;
  /** JWT injected as `?token=` query param when the WS handshake runs. */
  token?: string;
};

const THROTTLE_INTERVAL_MS = Math.floor(1000 / 30);
const MESSAGE_AWARENESS_TYPE = 1;

const toTypeCode = (data: unknown) => {
  if (data instanceof Uint8Array) return data[0];
  if (data instanceof ArrayBuffer) return new Uint8Array(data)[0];
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)[0];
  }
  return -1;
};

const installAwarenessThrottle = (provider?: WebsocketProvider) => {
  if (!provider) return () => undefined;

  const patchedSockets = new WeakSet<WebSocket>();
  let pendingAwarenessMessage: unknown = null;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const patchSocket = (socket: WebSocket | null | undefined) => {
    if (!socket || patchedSockets.has(socket)) return;
    patchedSockets.add(socket);

    const nativeSend = socket.send.bind(socket);
    socket.send = ((data: unknown) => {
      if (toTypeCode(data) !== MESSAGE_AWARENESS_TYPE) {
        nativeSend(data as never);
        return;
      }

      pendingAwarenessMessage = data;
      if (flushTimer) return;

      flushTimer = setTimeout(() => {
        flushTimer = null;
        if (pendingAwarenessMessage === null) return;
        nativeSend(pendingAwarenessMessage as never);
        pendingAwarenessMessage = null;
      }, THROTTLE_INTERVAL_MS);
    }) as typeof socket.send;
  };

  patchSocket(provider.ws);

  const handleStatusChange = () => {
    patchSocket(provider.ws);
  };

  provider.on("status", handleStatusChange);

  return () => {
    provider.off("status", handleStatusChange);
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    pendingAwarenessMessage = null;
  };
};

// y-websocket builds the handshake URL as `${wsUrl}/${roomId}?<params>` —
// but the collab server's canonical endpoint is `${wsUrl}/collab?doc=…`
// and the token must travel through the `Sec-WebSocket-Protocol` header
// (URL query strings leak to access logs / referers per COLLAB_WS.md).
//
// y-websocket invokes its `WebSocketPolyfill` with `new` — it must be a
// class, not a factory function. We build a per-room subclass of
// WebSocket that rewrites the URL into the canonical form and stamps
// the bearer as the second subprotocol value (`access_token`, `<jwt>`).
const makeAuthWebSocketClass = (
  token: string | undefined,
  docName: string,
): typeof WebSocket => {
  return class CollabAuthSocket extends WebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      const raw = typeof url === "string" ? url : url.toString();
      let finalUrl = raw;
      try {
        const u = new URL(raw);
        if (!u.pathname.startsWith("/collab")) {
          u.pathname = "/collab";
          u.searchParams.set("doc", docName);
          finalUrl = u.toString();
        }
      } catch {
        // Fall back to the unmodified URL if it's not parsable.
      }
      const finalProtocols = token ? ["access_token", token] : protocols;
      super(finalUrl, finalProtocols);
    }
  } as unknown as typeof WebSocket;
};

export function createCollab(config: CollabConfig) {
  const doc = new Y.Doc();
  const persistence = new IndexeddbPersistence(config.roomId, doc);
  const provider = config.disable
    ? undefined
    : new WebsocketProvider(config.wsUrl, config.roomId, doc, {
        WebSocketPolyfill: makeAuthWebSocketClass(
          config.token,
          config.roomId,
        ),
      });
  const cleanupAwarenessThrottle = installAwarenessThrottle(provider);
  let cachedLocalState = provider?.awareness.getLocalState() ?? null;

  const setPresenceActive = (active: boolean) => {
    if (!provider) return;
    if (active) {
      provider.awareness.setLocalState(cachedLocalState ?? {});
      return;
    }
    cachedLocalState = provider.awareness.getLocalState();
    provider.awareness.setLocalState(null);
  };

  function wrapPluginsWithCollab(
    plugins: YooptaPlugin<any, any>[]
  ) {
    function withCollabPlugin<
      TElementMap extends Record<string, SlateElement>,
      TOptions
    >(
      plugin: YooptaPlugin<TElementMap, TOptions>
    ): YooptaPlugin<TElementMap, TOptions> {
      const base = plugin.getPlugin;
      return new YooptaPlugin<TElementMap, TOptions>({
        ...base,
        extensions: (slate: SlateEditor, yoo: YooEditor, blockId: string) => {
          const fragment = doc.getXmlFragment(
            `yoopta:${yoo.id}:block:${blockId}`
          );

          const e = withYjs(slate, fragment as any);
          
          try {
            YjsEditor.connect(e);
          } catch {
            // ignore connection errors
          }
          return e;
        },

        events: {
          ...(base.events ?? {}),
          onDestroy: (yoo: YooEditor, blockId: string) => {
            const slate = yoo.blockEditorsMap[blockId] as unknown as YjsEditor;
            if (slate) {
              try {
                YjsEditor.disconnect(slate);
              } catch {
                // ignore disconnection errors
              }
            }
            base.events?.onDestroy?.(yoo, blockId);
          },
        },
      });
    }

    return plugins.map((p) => withCollabPlugin(p));
  }

  const destroy = () => {
    cleanupAwarenessThrottle();
    provider?.destroy();
    persistence.destroy();
    doc.destroy();
  };

  return { doc, provider, wrapPluginsWithCollab, destroy, setPresenceActive };
}
