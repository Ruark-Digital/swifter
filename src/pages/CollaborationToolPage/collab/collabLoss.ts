/**
 * What to tell the user when the editor reports its live collaboration
 * connection is gone for good (`superdoc:collab-lost`).
 *
 * The browser hides the HTTP status of a rejected WebSocket upgrade, so the
 * editor cannot say "401". The host asks an authenticated endpoint instead: a
 * 401 there means the session expired (and the axios interceptor has already
 * signed the user out, so the app redirects to login consistently).
 */
export type CollabLossKind = "session-expired" | "replaced" | "disconnected";

export const classifyCollabLoss = (
  reason: string,
  probeStatus?: number,
): CollabLossKind => {
  if (reason === "replaced") return "replaced";
  if (probeStatus === 401) return "session-expired";
  return "disconnected";
};

export const COLLAB_LOSS_MESSAGE: Record<CollabLossKind, string> = {
  "session-expired": "Your session expired, please sign in again.",
  replaced:
    "This document was opened in another tab or window, which took over the live connection. Reload to continue editing here.",
  disconnected:
    "Live collaboration is disconnected, so changes are not being saved. Reload the page to reconnect.",
};
