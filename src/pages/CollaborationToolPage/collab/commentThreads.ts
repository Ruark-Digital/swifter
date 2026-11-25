import type { FileCommentRich } from "./useFileComments";

/**
 * Comment threads over an append-only store.
 *
 * The backend `/contract/file-comment/{fileId}` offers only GET and POST (no
 * PATCH / DELETE, no parent or resolved fields; the body is strict). So threading
 * is a convention carried inside the encoded `text` field:
 *   - a reply is an ordinary comment with `replyTo` = the root comment id;
 *   - resolve / reopen / delete are marker comments (`action` + `target`) that
 *     are never shown, only folded into the thread state below.
 * A delete marker is honoured only when its author wrote the target comment.
 * This is a display-level rule: the data stays on the server until the backend
 * grows real endpoints.
 */

export type CommentThread = {
  root: FileCommentRich;
  replies: FileCommentRich[];
  resolved: boolean;
};

const byTime = (a: FileCommentRich, b: FileCommentRich) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

export const buildCommentThreads = (all: FileCommentRich[]): CommentThread[] => {
  const sorted = [...all].sort(byTime);
  // A reply / marker may reference the id the client generated before the server
  // assigned its own, so index both.
  const byId = new Map<string, FileCommentRich>();
  for (const c of sorted) {
    byId.set(c.id, c);
    if (c.clientId) byId.set(c.clientId, c);
  }
  const canon = (id: string) => byId.get(id)?.id ?? id;

  const deleted = new Set<string>();
  const resolvedAt = new Map<string, "resolve" | "reopen">();
  for (const m of sorted) {
    if (!m.action || !m.target) continue;
    const target = byId.get(m.target);
    if (!target) continue;
    if (m.action === "delete") {
      if (m.author === target.author) deleted.add(target.id);
    } else {
      // Later markers win: sorted oldest-first, so the last write sticks.
      resolvedAt.set(target.id, m.action);
    }
  }

  const visible = sorted.filter((c) => !c.action && !deleted.has(c.id));
  const roots = visible.filter((c) => !c.replyTo || !byId.has(c.replyTo));
  return roots
    .map((root) => ({
      root,
      replies: visible.filter((c) => c.replyTo && canon(c.replyTo) === root.id),
      resolved: resolvedAt.get(root.id) === "resolve",
    }))
    .sort((a, b) => byTime(b.root, a.root)); // newest thread first, like the old flat feed
};
