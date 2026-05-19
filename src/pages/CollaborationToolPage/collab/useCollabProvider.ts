// Editor-agnostic Yjs collab provider.
//
// Extracted from useYooptaYjs.ts as the foundation for the TipTap
// migration (phase quick/260518-collab-tiptap-migration, sub-phase 1).
// useYooptaYjs.ts intentionally retains a parallel copy of this logic
// until the Yoopta path is removed in sub-phase 4 — keep the two files
// in lockstep when fixing protocol bugs that affect both.
//
// What it does:
//   • Sets up a Y.Doc with WebsocketProvider + IndexedDB persistence.
//   • Speaks the BE collab protocol (`/collab?doc=…`, JWT via
//     Sec-WebSocket-Protocol subprotocol, custom binary msg type 2 for
//     connected-device count).
//   • Exposes presence + sync helpers so any editor binding can render
//     the avatar stack / save-status indicator without re-implementing
//     awareness plumbing.
// What it does NOT do:
//   • No editor-specific binding. Callers wire their editor (Yoopta,
//     TipTap, …) to `doc` directly using the editor's own collab API.

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

export type CollabConfig = {
  wsUrl: string;
  roomId: string;
  disable?: boolean;
  /** JWT injected via the `Sec-WebSocket-Protocol` subprotocol. */
  token?: string;
  /** Local user identity broadcast via Yjs awareness so other clients can
   *  render this client in the presence avatar stack. */
  localUser?: CollabUser;
};

export type CollabUser = {
  name: string;
  avatarUrl?: string;
  /** Hash-tone hex used for the presence chip background and cursor color. */
  color: string;
};

export type AwarenessEntry = {
  clientId: number;
  user: CollabUser;
};

export type CollabSyncState = {
  /** `connecting | connected | disconnected` from y-websocket.
   *  `kicked` is a frontend-only state set when the BE closes the WS
   *  with code 4000 ("Replaced by new connection") — another tab from
   *  the same browser profile has taken the room's single WS slot.
   *  In `kicked` state we stop auto-reconnecting to avoid a thrash
   *  loop with the winning tab. */
  status: "connecting" | "connected" | "disconnected" | "kicked";
  /** True once the provider has reconciled initial state with the server. */
  synced: boolean;
};

const WS_CLOSE_CODE_REPLACED = 4000;

const THROTTLE_INTERVAL_MS = Math.floor(1000 / 30);
const MESSAGE_AWARENESS_TYPE = 1;
const MSG_CONNECTED_CLIENTS = 2;
// Wire-format msg types per y-protocols/sync + y-protocols/awareness:
//   0 = sync (initial state + ongoing doc updates) — must be forwarded by BE
//   1 = awareness (presence)
//   2 = custom (BE device count in our deployment)
const MSG_TYPE_LABEL: Record<number, string> = {
  0: "sync",
  1: "awareness",
  2: "device-count",
};

const toTypeCode = (data: unknown) => {
  if (data instanceof Uint8Array) return data[0];
  if (data instanceof ArrayBuffer) return new Uint8Array(data)[0];
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)[0];
  }
  return -1;
};

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
      // y-websocket reconnects keep stale socket refs in our closures
      // (this `send` patch, the flushTimer). Sending on a CLOSING /
      // CLOSED socket throws "WebSocket is already in CLOSING or CLOSED
      // state". Drop the message instead — Yjs will re-sync via the new
      // socket.
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
  const handleStatusChange = () => patchSocket(provider.ws);
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

// See useYooptaYjs.ts for the URL-rewrite rationale. Keeping logic in
// lockstep with the Yoopta path; lift to a shared util when SP4 deletes
// useYooptaYjs.ts.
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
        const segments = u.pathname.split("/").filter(Boolean);
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

export type CollabProvider = {
  doc: Y.Doc;
  provider: WebsocketProvider | undefined;
  destroy: () => void;
  setPresenceActive: (active: boolean) => void;
  updateLocalUser: (user: CollabUser | null) => void;
  subscribeAwareness: (cb: (entries: AwarenessEntry[]) => void) => () => void;
  subscribeDeviceCount: (cb: (count: number) => void) => () => void;
  subscribeSyncState: (cb: (state: CollabSyncState) => void) => () => void;
};

// Module-level refcounted cache for live providers.
//
// Why: React StrictMode (dev) mounts → unmounts → remounts components
// synchronously, and Vite HMR re-runs modules. With a naive
// "create on mount, destroy on unmount" lifecycle the WS connection
// gets torn down and rebuilt every cycle, which the user perceives as
// the connection "going on and off". The cache keeps the same provider
// alive across rapid cycles: when refCount drops to 0 we defer the
// actual destroy by 1 second; if a new caller appears within that
// window we cancel the destroy.
type CacheEntry = {
  refCount: number;
  destroyTimer: ReturnType<typeof setTimeout> | null;
  /** Set once we've received a 4000 "Replaced by new connection" close
   *  from the BE. The sync-state subscribers report `kicked` to the UI;
   *  the provider is disconnected so y-websocket stops reconnecting. */
  kicked: boolean;
  /** Subscribers to the kicked flag — sync-state listeners use this so
   *  they can immediately re-emit when we flip it. */
  kickedListeners: Set<() => void>;
  shared: {
    doc: Y.Doc;
    provider: WebsocketProvider | undefined;
    persistence: IndexeddbPersistence;
    cleanupAwarenessThrottle: () => void;
  };
};
const providerCache = new Map<string, CacheEntry>();
const cacheKey = (config: CollabConfig) =>
  `${config.wsUrl}|${config.roomId}|${config.token ?? ""}|${config.disable ? "off" : "on"}`;

export function createCollabProvider(config: CollabConfig): CollabProvider {
  const key = cacheKey(config);
  let entry = providerCache.get(key);
  if (entry) {
    // Reusing an existing live provider — cancel any pending destroy
    // and bump the refcount.
    if (entry.destroyTimer) {
      clearTimeout(entry.destroyTimer);
      entry.destroyTimer = null;
    }
    entry.refCount += 1;
  } else {
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

    const entryRef: CacheEntry = {
      refCount: 1,
      destroyTimer: null,
      kicked: false,
      kickedListeners: new Set(),
      shared: { doc, provider, persistence, cleanupAwarenessThrottle },
    };

    if (provider) {
      // Detect the "another tab won this room's WS slot" close from the
      // BE and stop reconnecting. y-websocket auto-reconnects on close,
      // which against a 4000-enforcing server creates a thrash loop
      // between two tabs of the same user.
      provider.on("connection-close", (event: CloseEvent | null) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[collab] WS close", {
            code: event?.code,
            reason: event?.reason,
            room: config.roomId,
          });
        }
        if (event?.code === WS_CLOSE_CODE_REPLACED) {
          entryRef.kicked = true;
          provider.disconnect();
          entryRef.kickedListeners.forEach((fn) => fn());
        }
      });
      if (import.meta.env.DEV) {
        provider.on("connection-error", (event: Event | null) => {
          // eslint-disable-next-line no-console
          console.warn("[collab] WS error", { event, room: config.roomId });
        });
      }
    }

    entry = entryRef;
    providerCache.set(key, entry);
  }

  const { doc, provider, persistence, cleanupAwarenessThrottle } = entry.shared;
  const cacheEntry = entry;

  // Dev-only WS message-type histogram. Enables instant diagnosis when
  // the BE filters out doc-sync frames (msg type 0) but lets awareness
  // (type 1) through — see commit log for the 260519 cross-tab edit
  // propagation bug. Look at `window.__ctMsgHistogram` in DevTools.
  if (provider && typeof window !== "undefined" && import.meta.env.DEV) {
    const histogram: Record<string, { in: number; out: number }> = {};
    const win = window as unknown as { __ctMsgHistogram?: typeof histogram };
    win.__ctMsgHistogram = histogram;
    const bump = (label: string, dir: "in" | "out") => {
      histogram[label] = histogram[label] || { in: 0, out: 0 };
      histogram[label][dir] += 1;
    };
    const peekType = (data: unknown): string => {
      const code = toTypeCode(data);
      return MSG_TYPE_LABEL[code] ?? `unknown(${code})`;
    };
    let attached: WebSocket | null = null;
    const attach = (socket: WebSocket | null | undefined) => {
      if (!socket || socket === attached) return;
      if (attached) {
        attached.removeEventListener("message", onMsg);
      }
      attached = socket;
      socket.addEventListener("message", onMsg);
      const nativeSend = socket.send.bind(socket);
      socket.send = ((data: unknown) => {
        bump(peekType(data), "out");
        nativeSend(data as never);
      }) as typeof socket.send;
    };
    const onMsg = (event: MessageEvent) => {
      bump(peekType(event.data), "in");
    };
    attach(provider.ws);
    provider.on("status", () => attach(provider.ws));
  }

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
    const current = (provider.awareness.getLocalState() ?? {}) as Record<
      string,
      unknown
    >;
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
    let baseStatus: "connecting" | "connected" | "disconnected" =
      provider.wsconnected
        ? "connected"
        : provider.wsconnecting
          ? "connecting"
          : "disconnected";
    let synced = provider.synced;
    const emit = () =>
      cb({
        status: cacheEntry.kicked ? "kicked" : baseStatus,
        synced: cacheEntry.kicked ? false : synced,
      });
    const onStatus = (payload: {
      status: "connecting" | "connected" | "disconnected";
    }) => {
      baseStatus = payload.status;
      if (baseStatus !== "connected") synced = false;
      emit();
    };
    const onSync = (next: boolean) => {
      synced = next;
      emit();
    };
    const onKicked = () => emit();
    provider.on("status", onStatus);
    provider.on("sync", onSync);
    cacheEntry.kickedListeners.add(onKicked);
    emit();
    return () => {
      provider.off("status", onStatus);
      provider.off("sync", onSync);
      cacheEntry.kickedListeners.delete(onKicked);
    };
  };

  const destroy = () => {
    cacheEntry.refCount -= 1;
    if (cacheEntry.refCount > 0) return;
    if (cacheEntry.destroyTimer) clearTimeout(cacheEntry.destroyTimer);
    // Defer the actual teardown — React StrictMode and Vite HMR will
    // often re-mount within a few hundred ms, and we want the same
    // provider to be reused if that happens. After the window passes
    // with no new consumer, run the real cleanup.
    cacheEntry.destroyTimer = setTimeout(() => {
      if (cacheEntry.refCount > 0) return;
      providerCache.delete(key);
      cleanupAwarenessThrottle();
      provider?.destroy();
      persistence.destroy();
      doc.destroy();
    }, 1000);
  };

  return {
    doc,
    provider,
    destroy,
    setPresenceActive,
    updateLocalUser,
    subscribeAwareness,
    subscribeDeviceCount,
    subscribeSyncState,
  };
}
