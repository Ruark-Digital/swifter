import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import type { YooEditor } from "@yoopta/editor";

export type CollabConfig = {
  wsUrl: string;
  roomId: string;
  disable?: boolean;
  /** JWT injected as `?token=` query param when the WS handshake runs. */
  token?: string;
  /** Local user identity broadcast via Yjs awareness so other clients can
   *  render this client in the presence avatar stack. */
  localUser?: CollabUser;
};

export type CollabUser = {
  name: string;
  avatarUrl?: string;
  /** Hash-tone hex used for the initials chip background. */
  color: string;
};

export type AwarenessEntry = {
  clientId: number;
  user: CollabUser;
};

export type CollabSyncState = {
  /** `connecting | connected | disconnected` from y-websocket. */
  status: "connecting" | "connected" | "disconnected";
  /** True once the provider has reconciled initial state with the server. */
  synced: boolean;
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
    const safeSend = (data: unknown) => {
      // y-websocket reconnects on disconnect — the old socket lingers in
      // closures (this `send` patch, the flushTimer) but is in CLOSING /
      // CLOSED state. Sending on it throws "WebSocket is already in
      // CLOSING or CLOSED state". Drop the message instead — Yjs will
      // re-sync via the new socket.
      if (socket.readyState !== WebSocket.OPEN) return;
      try {
        nativeSend(data as never);
      } catch {
        // ignore — socket raced to CLOSED between the check and send
      }
    };
    socket.send = ((data: unknown) => {
      if (toTypeCode(data) !== MESSAGE_AWARENESS_TYPE) {
        safeSend(data);
        return;
      }

      pendingAwarenessMessage = data;
      if (flushTimer) return;

      flushTimer = setTimeout(() => {
        flushTimer = null;
        if (pendingAwarenessMessage === null) return;
        safeSend(pendingAwarenessMessage);
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
        // y-websocket appends `/${roomId}` to the configured wsUrl, so the
        // incoming pathname is typically:
        //   • localhost:    `/<docName>`                 → rewrite to `/collab`
        //   • prod gateway: `/api/v1/dev/contract/<docName>` → rewrite the
        //                   trailing segment to `collab`
        // We keep everything before the trailing segment (the API prefix)
        // and ensure the path ends in `/collab` with `?doc=<docName>`.
        const segments = u.pathname.split("/").filter(Boolean);
        // y-websocket URL-encodes the roomId when it appends it to the
        // path, so the segment is e.g. `Sample%20Contract.docx` while
        // `docName` is the raw `Sample Contract.docx`. Decode before
        // comparing, otherwise the segment isn't stripped and the
        // filename ends up duplicated in both path and `?doc=` query.
        const decodeSafe = (s: string) => {
          try {
            return decodeURIComponent(s);
          } catch {
            return s;
          }
        };
        if (
          segments.length > 0 &&
          decodeSafe(segments[segments.length - 1]) === docName
        ) {
          segments.pop();
        }
        if (
          segments.length === 0 ||
          segments[segments.length - 1] !== "collab"
        ) {
          segments.push("collab");
        }
        u.pathname = "/" + segments.join("/");
        u.searchParams.set("doc", docName);
        finalUrl = u.toString();
      } catch {
        // Fall back to the unmodified URL if it's not parsable.
      }
      const finalProtocols = token ? ["access_token", token] : protocols;
      super(finalUrl, finalProtocols);
    }
  } as unknown as typeof WebSocket;
};

const MSG_CONNECTED_CLIENTS = 2;

const readVarUint = (buf: Uint8Array, start: number) => {
  let result = 0;
  let shift = 0;
  let pos = start;
  while (pos < buf.length) {
    const byte = buf[pos++];
    result |= (byte & 0x7f) << shift;
    shift += 7;
    if (!(byte & 0x80)) break;
  }
  return { value: result, pos };
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
  const initialUserState = config.localUser ? { user: config.localUser } : {};
  let cachedLocalState: Record<string, unknown> | null =
    provider?.awareness.getLocalState() ?? initialUserState;
  if (provider && config.localUser) {
    provider.awareness.setLocalState({ user: config.localUser });
  }

  const setPresenceActive = (active: boolean) => {
    if (!provider) return;
    if (active) {
      provider.awareness.setLocalState(cachedLocalState ?? initialUserState);
      return;
    }
    cachedLocalState = provider.awareness.getLocalState();
    provider.awareness.setLocalState(null);
  };

  const updateLocalUser = (user: CollabUser | null) => {
    if (!provider) return;
    const current = (provider.awareness.getLocalState() ?? {}) as Record<string, unknown>;
    const next = user ? { ...current, user } : { ...current, user: null };
    cachedLocalState = next;
    if (provider.awareness.getLocalState() !== null) {
      provider.awareness.setLocalState(next);
    }
  };

  const subscribeAwareness = (
    cb: (entries: AwarenessEntry[]) => void,
  ): (() => void) => {
    if (!provider) {
      cb([]);
      return () => undefined;
    }
    const localId = provider.awareness.clientID;
    const emit = () => {
      const states = provider.awareness.getStates();
      const entries: AwarenessEntry[] = [];
      const seen = new Set<string>();
      states.forEach((state, clientId) => {
        if (clientId === localId) return;
        const user = (state as { user?: CollabUser } | null)?.user;
        if (!user || !user.name) return;
        const key = `${user.name}|${user.avatarUrl ?? ""}`;
        if (seen.has(key)) return;
        seen.add(key);
        entries.push({ clientId, user });
      });
      cb(entries);
    };
    provider.awareness.on("change", emit);
    emit();
    return () => {
      provider.awareness.off("change", emit);
    };
  };

  const subscribeDeviceCount = (
    cb: (count: number) => void,
  ): (() => void) => {
    if (!provider) {
      cb(0);
      return () => undefined;
    }
    let currentSocket: WebSocket | null = null;
    const onMessage = (event: MessageEvent) => {
      if (!(event.data instanceof ArrayBuffer)) return;
      const buf = new Uint8Array(event.data);
      if (buf.length < 2) return;
      const { value: msgType, pos } = readVarUint(buf, 0);
      if (msgType !== MSG_CONNECTED_CLIENTS) return;
      const { value: count } = readVarUint(buf, pos);
      cb(count);
    };
    const attach = (socket: WebSocket | null | undefined) => {
      if (!socket || socket === currentSocket) return;
      if (currentSocket) {
        currentSocket.removeEventListener("message", onMessage);
      }
      currentSocket = socket;
      socket.addEventListener("message", onMessage);
    };
    attach(provider.ws);
    const onStatus = () => attach(provider.ws);
    provider.on("status", onStatus);
    return () => {
      provider.off("status", onStatus);
      if (currentSocket) {
        currentSocket.removeEventListener("message", onMessage);
        currentSocket = null;
      }
    };
  };

  const subscribeSyncState = (
    cb: (state: CollabSyncState) => void,
  ): (() => void) => {
    if (!provider) {
      cb({ status: "disconnected", synced: false });
      return () => undefined;
    }
    // Read the provider's current state on subscribe — y-websocket emits
    // the 'status' event once during construction, often BEFORE our
    // listener attaches. Without this seed the UI would stay stuck at
    // "connecting/Offline" even after the WS handshake completed.
    let status: CollabSyncState["status"] = provider.wsconnected
      ? "connected"
      : provider.wsconnecting
        ? "connecting"
        : "disconnected";
    let synced = provider.synced;
    const emit = () => cb({ status, synced });
    const onStatus = (payload: { status: CollabSyncState["status"] }) => {
      status = payload.status;
      if (status !== "connected") synced = false;
      emit();
    };
    const onSync = (next: boolean) => {
      synced = next;
      emit();
    };
    provider.on("status", onStatus);
    provider.on("sync", onSync);
    emit();
    return () => {
      provider.off("status", onStatus);
      provider.off("sync", onSync);
    };
  };

  // ── Snapshot-based document sync ───────────────────────────────────
  // We chose snapshot sync (whole serialized editor value written into a
  // single Y.Map entry) over per-block Y.XmlFragment + slate-yjs because
  // Yoopta assigns random per-instance `yoo.id` and per-instance block
  // IDs, so the fragment-key approach `yoopta:${yoo.id}:block:${blockId}`
  // never converged across clients.
  //
  // Trade-off: last-write-wins on concurrent edits, no character-level
  // CRDT. Acceptable for contract review where two reviewers rarely edit
  // the same line simultaneously. While the local user is actively
  // typing, we defer applying remote snapshots so their cursor doesn't
  // jump mid-keystroke.
  const SNAPSHOT_KEY = "value";
  const LOCAL_WRITE_ORIGIN = Symbol("ct-local-write");
  const yMap = doc.getMap<unknown>("ct:doc");

  type Binding = {
    /** Attach to a Yoopta editor. Returns an unsubscribe. */
    attach: (editor: YooEditor) => () => void;
    /** Schedule a debounced write of the current editor value to Yjs. */
    markLocalChange: (value: unknown) => void;
  };

  const createSnapshotBinding = (): Binding => {
    let editorRef: YooEditor | null = null;
    let applyingRemote = false;
    let writeTimer: number | null = null;
    let pendingValue: unknown = null;
    let lastLocalEditAt = 0;
    let providerSyncHandler: ((synced: boolean) => void) | null = null;

    const flushWrite = () => {
      writeTimer = null;
      if (!editorRef || pendingValue == null) return;
      const value = pendingValue;
      pendingValue = null;
      doc.transact(() => {
        yMap.set(SNAPSHOT_KEY, value);
      }, LOCAL_WRITE_ORIGIN);
    };

    const markLocalChange = (value: unknown) => {
      if (applyingRemote) return;
      lastLocalEditAt = Date.now();
      pendingValue = value;
      if (writeTimer !== null) window.clearTimeout(writeTimer);
      writeTimer = window.setTimeout(flushWrite, 250);
    };

    const applyRemote = () => {
      const editor = editorRef;
      if (!editor) return;
      const remote = yMap.get(SNAPSHOT_KEY);
      if (!remote || typeof remote !== "object") return;
      // If the local user typed within the last 600ms, defer — don't
      // yank their cursor mid-keystroke. We'll re-apply on the next
      // remote update or on the debounce flush.
      if (Date.now() - lastLocalEditAt < 600) {
        window.setTimeout(applyRemote, 600);
        return;
      }
      const current = editor.getEditorValue();
      if (JSON.stringify(current) === JSON.stringify(remote)) return;
      applyingRemote = true;
      try {
        editor.setEditorValue(remote as Parameters<typeof editor.setEditorValue>[0]);
      } finally {
        // Clear on the next tick so any onChange triggered by
        // setEditorValue is correctly attributed to the remote apply.
        window.setTimeout(() => {
          applyingRemote = false;
        }, 0);
      }
    };

    const onMapChange = (
      _event: Y.YMapEvent<unknown>,
      transaction: Y.Transaction,
    ) => {
      if (transaction.origin === LOCAL_WRITE_ORIGIN) return;
      applyRemote();
    };

    const seedOrHydrate = () => {
      const editor = editorRef;
      if (!editor) return;
      const remote = yMap.get(SNAPSHOT_KEY);
      if (remote && typeof remote === "object") {
        // Remote already has content — hydrate from it.
        applyRemote();
        return;
      }
      // Y.Map is empty. If our editor has been seeded locally (e.g. via
      // the file-import flow), write that snapshot out so the next
      // client to join can hydrate.
      const local = editor.getEditorValue();
      if (local && Object.keys(local).length > 0) {
        doc.transact(() => {
          yMap.set(SNAPSHOT_KEY, local);
        }, LOCAL_WRITE_ORIGIN);
      }
    };

    const attach = (editor: YooEditor) => {
      editorRef = editor;
      yMap.observe(onMapChange);
      if (provider) {
        if (provider.synced) {
          seedOrHydrate();
        } else {
          providerSyncHandler = (synced: boolean) => {
            if (synced) seedOrHydrate();
          };
          provider.on("sync", providerSyncHandler);
        }
      } else {
        // No provider (collab disabled) — nothing to sync. IDB
        // persistence rehydrates asynchronously; the yMap observer
        // will pick it up. Seed on next tick in case IDB is empty.
        window.setTimeout(seedOrHydrate, 0);
      }
      return () => {
        yMap.unobserve(onMapChange);
        if (provider && providerSyncHandler) {
          provider.off("sync", providerSyncHandler);
          providerSyncHandler = null;
        }
        if (writeTimer !== null) {
          window.clearTimeout(writeTimer);
          writeTimer = null;
        }
        editorRef = null;
      };
    };

    return { attach, markLocalChange };
  };

  const destroy = () => {
    cleanupAwarenessThrottle();
    provider?.destroy();
    persistence.destroy();
    doc.destroy();
  };

  return {
    doc,
    provider,
    createSnapshotBinding,
    destroy,
    setPresenceActive,
    updateLocalUser,
    subscribeAwareness,
    subscribeDeviceCount,
    subscribeSyncState,
  };
}
