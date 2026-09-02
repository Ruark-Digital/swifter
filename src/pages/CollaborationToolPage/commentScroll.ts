/**
 * Click-to-locate for comments: scroll the collaborative document to the place a
 * comment is anchored, and briefly flash it.
 *
 * A comment carries an optional `anchorId` (populated by the backend once
 * document anchoring lands — see `ContractCommentDTO.anchor`). Until that data
 * exists every `anchorId` is `undefined` and these helpers no-op, so wiring the
 * interaction now costs nothing and lights up automatically when anchors arrive.
 *
 * Two editor surfaces are supported, in priority order:
 *  1. The SuperDoc editor, which runs in a cross-origin `<iframe>`. We reach it
 *     only via `postMessage("superdoc:focus-comment")` — the contract the iframe
 *     already handles — targeting the frame's own origin, never `"*"`.
 *  2. The in-page editor, whose anchored node is tagged `data-comment-anchor`.
 *     We scroll it into view and flash a highlight.
 */

export const FOCUS_COMMENT_MESSAGE = "superdoc:focus-comment" as const;
/** Selector for editor iframes we may drive (kept in sync with the host embed). */
export const EDITOR_IFRAME_SELECTOR = "iframe[data-superdoc], iframe.ct-superdoc-frame";
/** Attribute the in-page editor stamps on the node a comment is anchored to. */
export const ANCHOR_ATTR = "data-comment-anchor";
const FLASH_CLASS = "ct-anchor-flash";
const FLASH_MS = 1600;

/** Derive an iframe's exact origin, or `null` when it can't be parsed. */
export function iframeOrigin(src: string | null | undefined): string | null {
  if (!src) return null;
  try {
    return new URL(src, window.location.href).origin;
  } catch {
    return null;
  }
}

/**
 * Post `superdoc:focus-comment` to every editor iframe on the page. Returns the
 * number of frames actually messaged (0 when there are none — e.g. the in-page
 * editor build). Frames whose origin can't be derived are skipped rather than
 * messaged with `"*"`.
 */
export function focusCommentInIframes(
  anchorId: string,
  doc: Document = document,
): number {
  const frames = doc.querySelectorAll<HTMLIFrameElement>(EDITOR_IFRAME_SELECTOR);
  let posted = 0;
  frames.forEach((frame) => {
    const origin = iframeOrigin(frame.getAttribute("src"));
    if (!origin || !frame.contentWindow) return;
    frame.contentWindow.postMessage(
      { type: FOCUS_COMMENT_MESSAGE, payload: { commentId: anchorId } },
      origin,
    );
    posted += 1;
  });
  return posted;
}

/** Scroll the in-page anchored node into view and flash it. Returns whether one was found. */
export function focusCommentInDom(anchorId: string, doc: Document = document): boolean {
  const el = doc.querySelector<HTMLElement>(`[${ANCHOR_ATTR}="${escapeAttr(anchorId)}"]`);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add(FLASH_CLASS);
  window.setTimeout(() => el.classList.remove(FLASH_CLASS), FLASH_MS);
  return true;
}

/**
 * Locate the document region a comment is anchored to. Prefers the iframe
 * (SuperDoc) surface, falling back to the in-page editor. No-ops when the
 * comment has no anchor yet.
 */
export function scrollToCommentAnchor(
  anchorId: string | undefined | null,
  doc: Document = document,
): void {
  if (!anchorId) return;
  if (focusCommentInIframes(anchorId, doc) > 0) return;
  focusCommentInDom(anchorId, doc);
}

/** Escape a value for safe use inside an attribute selector. */
function escapeAttr(value: string): string {
  const css = (globalThis as { CSS?: { escape?(v: string): string } }).CSS;
  return css?.escape ? css.escape(value) : value.replace(/["\\]/g, "\\$&");
}
