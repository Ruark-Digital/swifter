// Protocol contract for the isolated SuperDoc iframe (AGPL app lives in a
// separate repo). SwiftPro talks to it ONLY through these postMessage shapes
// — no `import` of SuperDoc, so AGPL copyleft does not reach this bundle.

import type { RedlineSpan } from "./redlineScan";

export type DocumentMode = "editing" | "viewing" | "suggesting";

/** One peer in the collaboration room (from the iframe's Yjs awareness). The
 *  iframe relays these — excluding self — so the host can render the presence
 *  avatar stack for the SuperDoc editor (which owns the WS connection). */
export type PresenceUser = {
  clientId: number;
  name: string;
  avatarUrl?: string;
};

/** Messages the iframe sends to the host. */
export type SuperdocInbound =
  | { type: "superdoc:ready" }
  | { type: "superdoc:doc-edit" }
  | { type: "superdoc:editor-ready"; payload: { pageCount?: number } }
  | { type: "superdoc:error"; payload: { message: string } }
  | { type: "superdoc:redlines"; payload: { redlines: RedlineSpan[] } }
  | { type: "superdoc:redline-clicked"; payload: { redlineId: string } }
  | { type: "superdoc:presence"; payload: { users: PresenceUser[] } }
  | { type: "superdoc:selection"; payload: { hasSelection: boolean; excerpt: string } }
  | {
      type: "superdoc:comment-created";
      payload: { requestId: string; commentId: string | null };
    }
  | {
      type: "superdoc:document-state";
      payload: { requestId: string; state: string | null };
    };

/** The single message the host sends to the iframe. */
export type SuperdocInitMessage = {
  type: "superdoc:init";
  payload: {
    docBytes: ArrayBuffer;
    fileName: string;
    fileType: string;
    documentMode: DocumentMode;
    user: { name: string; email: string };
    roomId: string;
    wsUrl: string;
    /** JWT forwarded to the iframe so its Yjs provider can authenticate the WS
     *  via the `Sec-WebSocket-Protocol` subprotocol, exactly like the host's
     *  own collab client (see useCollabProvider.makeAuthWebSocketClass). */
    token: string;
  };
};

/** Resolve the editor app URL. In a production build a missing
 *  VITE_SUPERDOC_APP_URL is fatal — otherwise the iframe would point at
 *  localhost and never connect. Dev keeps the localhost default. */
export function resolveSuperdocAppUrl(
  env: { VITE_SUPERDOC_APP_URL?: string; PROD: boolean },
): string {
  const value = env.VITE_SUPERDOC_APP_URL?.trim();
  if (value) return value;
  if (env.PROD) {
    throw new Error(
      "VITE_SUPERDOC_APP_URL is not set. The collaboration editor iframe needs " +
        "the editor app origin (e.g. https://editor.swiftpro.tech). Set it as a " +
        "build-time env var in Amplify.",
    );
  }
  return "http://localhost:5174";
}

/** Where the AGPL SuperDoc app is served from. MUST be a full URL incl. scheme
 *  (e.g. https://editor.swiftpro.tech) — `superdocOrigin()` calls `new URL()`. */
export const SUPERDOC_APP_URL: string = resolveSuperdocAppUrl(import.meta.env);

/** The bare origin of the app url — used for postMessage targeting + checks. */
export function superdocOrigin(appUrl: string = SUPERDOC_APP_URL): string {
  return new URL(appUrl).origin;
}

/**
 * Validate an incoming `message` event: it must come from the expected
 * origin and be one of the known message shapes. Returns a typed message or
 * `null` (caller ignores nulls).
 */
export function parseSuperdocMessage(
  event: MessageEvent,
  expectedOrigin: string,
): SuperdocInbound | null {
  if (event.origin !== expectedOrigin) return null;
  const data = event.data as { type?: unknown; payload?: unknown } | null;
  if (!data || typeof data !== "object") return null;

  switch (data.type) {
    case "superdoc:ready":
      return { type: "superdoc:ready" };
    case "superdoc:doc-edit":
      return { type: "superdoc:doc-edit" };
    case "superdoc:editor-ready": {
      const raw = (data.payload ?? {}) as Record<string, unknown>;
      const pageCount =
        typeof raw.pageCount === "number" ? raw.pageCount : undefined;
      return { type: "superdoc:editor-ready", payload: { pageCount } };
    }
    case "superdoc:error": {
      const p = (data.payload ?? {}) as { message?: unknown };
      return {
        type: "superdoc:error",
        payload: { message: String(p.message ?? "Unknown error") },
      };
    }
    case "superdoc:redlines": {
      const p = (data.payload ?? {}) as { redlines?: unknown };
      const redlines = Array.isArray(p.redlines) ? (p.redlines as RedlineSpan[]) : [];
      return { type: "superdoc:redlines", payload: { redlines } };
    }
    case "superdoc:redline-clicked": {
      const p = (data.payload ?? {}) as { redlineId?: unknown };
      if (typeof p.redlineId !== "string" || !p.redlineId) return null;
      return { type: "superdoc:redline-clicked", payload: { redlineId: p.redlineId } };
    }
    case "superdoc:presence": {
      const p = (data.payload ?? {}) as { users?: unknown };
      const raw = Array.isArray(p.users) ? p.users : [];
      const users: PresenceUser[] = [];
      for (const u of raw) {
        const entry = u as { clientId?: unknown; name?: unknown; avatarUrl?: unknown };
        if (typeof entry?.clientId !== "number" || typeof entry?.name !== "string") {
          continue;
        }
        users.push({
          clientId: entry.clientId,
          name: entry.name,
          avatarUrl:
            typeof entry.avatarUrl === "string" ? entry.avatarUrl : undefined,
        });
      }
      return { type: "superdoc:presence", payload: { users } };
    }
    case "superdoc:selection": {
      const p = (data.payload ?? {}) as { hasSelection?: unknown; excerpt?: unknown };
      return {
        type: "superdoc:selection",
        payload: {
          hasSelection: p.hasSelection === true,
          excerpt: typeof p.excerpt === "string" ? p.excerpt : "",
        },
      };
    }
    case "superdoc:comment-created": {
      const p = (data.payload ?? {}) as { requestId?: unknown; commentId?: unknown };
      if (typeof p.requestId !== "string" || !p.requestId) return null;
      return {
        type: "superdoc:comment-created",
        payload: {
          requestId: p.requestId,
          commentId: typeof p.commentId === "string" && p.commentId ? p.commentId : null,
        },
      };
    }
    case "superdoc:document-state": {
      const p = (data.payload ?? {}) as { requestId?: unknown; state?: unknown };
      if (typeof p.requestId !== "string" || !p.requestId) return null;
      return {
        type: "superdoc:document-state",
        payload: {
          requestId: p.requestId,
          state: typeof p.state === "string" ? p.state : null,
        },
      };
    }
    default:
      return null;
  }
}

/** The collab room the SuperDoc iframe actually joins: the base room id with a
 *  `-superdoc` namespace suffix so SuperDoc never collides with the legacy
 *  y-prosemirror rooms (incompatible schema). The iframe sends this exact string
 *  as `?doc=<room>` on the WS, so the BE stores every collab artifact (version
 *  history, latest snapshot, redline turns) under the SUFFIXED key. Any HTTP call
 *  that references the collab document MUST use this name — not the bare room id —
 *  or it queries an empty doc and no versions come back (the versions endpoint
 *  returned nothing because the host was requesting the un-suffixed name). */
export function superdocDocName(roomId: string): string {
  return `${roomId}-superdoc`;
}

/** Build the init message; namespaces the collab room via `superdocDocName` so
 *  SuperDoc never collides with the legacy y-prosemirror rooms (incompatible
 *  schema). The suffix is colon-free and stays a single URL-path/query-safe
 *  token — the editor app sends it as `?doc=<room>` to the same `/collab`
 *  endpoint the host uses, so the healthy server routes it (a `:`-suffixed room
 *  previously 502'd). */
export function buildInitPayload(
  input: SuperdocInitMessage["payload"],
): SuperdocInitMessage {
  return {
    type: "superdoc:init",
    payload: { ...input, roomId: superdocDocName(input.roomId) },
  };
}

/** Commands the host sends to the iframe to act on the document. */
export type SuperdocCommand =
  | { type: "superdoc:apply-redline"; payload: { redlineId: string; replacement: string } }
  | { type: "superdoc:focus-redline"; payload: { redlineId: string } }
  | { type: "superdoc:add-comment"; payload: { requestId: string; text: string } }
  | { type: "superdoc:focus-comment"; payload: { commentId: string } }
  | { type: "superdoc:set-mode"; payload: { documentMode: DocumentMode } }
  | { type: "superdoc:get-document-state"; payload: { requestId: string } };

export function buildApplyRedline(redlineId: string, replacement: string): SuperdocCommand {
  return { type: "superdoc:apply-redline", payload: { redlineId, replacement } };
}

export function buildFocusRedline(redlineId: string): SuperdocCommand {
  return { type: "superdoc:focus-redline", payload: { redlineId } };
}

/** Ask the iframe to anchor a comment at its current selection. The iframe
 *  replies with `superdoc:comment-created` carrying the same requestId. */
export function buildAddComment(requestId: string, text: string): SuperdocCommand {
  return { type: "superdoc:add-comment", payload: { requestId, text } };
}

export function buildFocusComment(commentId: string): SuperdocCommand {
  return { type: "superdoc:focus-comment", payload: { commentId } };
}

/** Switch the editor's live edit permission after load (turn-based redline
 *  negotiation). `documentMode` is otherwise only set once, in the init
 *  payload. The SuperDoc app (separate repo) must handle this to toggle its
 *  own permissions without a reload — cross-repo dependency. */
export function buildSetMode(documentMode: DocumentMode): SuperdocCommand {
  return { type: "superdoc:set-mode", payload: { documentMode } };
}

/** Ask the iframe for the current Yjs document state, so the host can persist it
 *  to the BE on redline accept (the `documentState` field on resolve /
 *  batch-resolve). The iframe replies with `superdoc:document-state` carrying the
 *  same requestId and `base64(Y.encodeStateAsUpdate(ydoc))` (or `null` when there
 *  is no live Y.Doc). Cross-repo dependency — the SuperDoc app must handle it. */
export function buildGetDocumentState(requestId: string): SuperdocCommand {
  return { type: "superdoc:get-document-state", payload: { requestId } };
}
