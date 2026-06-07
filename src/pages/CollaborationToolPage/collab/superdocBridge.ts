// Protocol contract for the isolated SuperDoc iframe (AGPL app lives in a
// separate repo). SwiftPro talks to it ONLY through these postMessage shapes
// — no `import` of SuperDoc, so AGPL copyleft does not reach this bundle.

import type { RedlineSpan } from "./redlineScan";

export type DocumentMode = "editing" | "viewing" | "suggesting";

/** Messages the iframe sends to the host. */
export type SuperdocInbound =
  | { type: "superdoc:ready" }
  | { type: "superdoc:doc-edit" }
  | { type: "superdoc:editor-ready"; payload: { pageCount?: number } }
  | { type: "superdoc:error"; payload: { message: string } }
  | { type: "superdoc:redlines"; payload: { redlines: RedlineSpan[] } }
  | { type: "superdoc:redline-clicked"; payload: { redlineId: string } };

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
    default:
      return null;
  }
}

/** Build the init message; namespaces the collab room so SuperDoc never
 *  collides with the legacy y-prosemirror rooms (incompatible schema). The
 *  suffix is colon-free and stays a single URL-path/query-safe token — the
 *  editor app sends it as `?doc=<room>` to the same `/collab` endpoint the host
 *  uses, so the healthy server routes it (a `:`-suffixed room previously 502'd). */
export function buildInitPayload(
  input: SuperdocInitMessage["payload"],
): SuperdocInitMessage {
  return {
    type: "superdoc:init",
    payload: { ...input, roomId: `${input.roomId}-superdoc` },
  };
}

/** Commands the host sends to the iframe to act on the document. */
export type SuperdocCommand =
  | { type: "superdoc:apply-redline"; payload: { redlineId: string; replacement: string } }
  | { type: "superdoc:focus-redline"; payload: { redlineId: string } };

export function buildApplyRedline(redlineId: string, replacement: string): SuperdocCommand {
  return { type: "superdoc:apply-redline", payload: { redlineId, replacement } };
}

export function buildFocusRedline(redlineId: string): SuperdocCommand {
  return { type: "superdoc:focus-redline", payload: { redlineId } };
}
