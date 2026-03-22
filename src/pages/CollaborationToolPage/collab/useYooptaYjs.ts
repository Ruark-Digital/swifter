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

export function createCollab(config: CollabConfig) {
  const doc = new Y.Doc();
  const persistence = new IndexeddbPersistence(config.roomId, doc);
  const provider = config.disable
    ? undefined
    : new WebsocketProvider(config.wsUrl, config.roomId, doc);
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
