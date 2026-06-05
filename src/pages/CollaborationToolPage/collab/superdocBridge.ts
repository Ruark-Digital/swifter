// Protocol contract for the isolated SuperDoc iframe (AGPL app lives in a
// separate repo). SwiftPro talks to it ONLY through these postMessage shapes
// — no `import` of SuperDoc, so AGPL copyleft does not reach this bundle.

export type DocumentMode = "editing" | "viewing" | "suggesting";

/** Messages the iframe sends to the host. */
export type SuperdocInbound =
  | { type: "superdoc:ready" }
  | { type: "superdoc:doc-edit" }
  | { type: "superdoc:editor-ready"; payload: { pageCount?: number } }
  | { type: "superdoc:error"; payload: { message: string } };

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
  };
};

/** Where the AGPL SuperDoc app is served from. Override per-env. */
export const SUPERDOC_APP_URL: string =
  import.meta.env.VITE_SUPERDOC_APP_URL || "http://localhost:5174";

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
      const p = (data.payload ?? {}) as { pageCount?: number };
      return { type: "superdoc:editor-ready", payload: { pageCount: p.pageCount } };
    }
    case "superdoc:error": {
      const p = (data.payload ?? {}) as { message?: unknown };
      return {
        type: "superdoc:error",
        payload: { message: String(p.message ?? "Unknown error") },
      };
    }
    default:
      return null;
  }
}

/** Build the init message; namespaces the collab room so SuperDoc never
 *  collides with the legacy y-prosemirror rooms (incompatible schema). */
export function buildInitPayload(input: {
  docBytes: ArrayBuffer;
  fileName: string;
  fileType: string;
  documentMode: DocumentMode;
  user: { name: string; email: string };
  roomId: string;
  wsUrl: string;
}): SuperdocInitMessage {
  return {
    type: "superdoc:init",
    payload: { ...input, roomId: `${input.roomId}:superdoc` },
  };
}
