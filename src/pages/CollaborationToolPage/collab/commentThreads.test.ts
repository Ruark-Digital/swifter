import { describe, expect, it } from "vitest";
import { buildCommentThreads } from "./commentThreads";
import type { FileCommentRich } from "./useFileComments";

let n = 0;
const c = (over: Partial<FileCommentRich>): FileCommentRich => ({
  id: `c${++n}`,
  author: "Ann",
  createdAt: new Date(2026, 10, 25, 10, n).toISOString(),
  content: "hi",
  ...over,
});

describe("buildCommentThreads", () => {
  it("groups replies under their root, oldest reply first", () => {
    const root = c({ id: "r" });
    const r1 = c({ id: "r1", replyTo: "r", author: "Bob" });
    const r2 = c({ id: "r2", replyTo: "r" });
    const [t] = buildCommentThreads([r2, root, r1]);
    expect(t.root.id).toBe("r");
    expect(t.replies.map((x) => x.id)).toEqual(["r1", "r2"]);
  });

  it("resolve then reopen: the latest marker wins and markers are never listed", () => {
    const root = c({ id: "r" });
    const resolve = c({ action: "resolve", target: "r" });
    const [resolved] = buildCommentThreads([root, resolve]);
    expect(resolved.resolved).toBe(true);
    const reopen = c({ action: "reopen", target: "r" });
    const [reopened] = buildCommentThreads([root, resolve, reopen]);
    expect(reopened.resolved).toBe(false);
    expect(reopened.replies).toHaveLength(0);
  });

  it("honours a delete only from the comment's own author", () => {
    const root = c({ id: "r", author: "Ann" });
    const byOther = c({ action: "delete", target: "r", author: "Bob" });
    expect(buildCommentThreads([root, byOther])).toHaveLength(1);
    const byOwner = c({ action: "delete", target: "r", author: "Ann" });
    expect(buildCommentThreads([root, byOwner])).toHaveLength(0);
  });

  it("a deleted reply disappears but its thread stays", () => {
    const root = c({ id: "r" });
    const reply = c({ id: "x", replyTo: "r", author: "Bob" });
    const del = c({ action: "delete", target: "x", author: "Bob" });
    const [t] = buildCommentThreads([root, reply, del]);
    expect(t.replies).toHaveLength(0);
  });

  it("a reply whose root is missing is shown as its own thread", () => {
    expect(buildCommentThreads([c({ id: "o", replyTo: "gone" })])).toHaveLength(1);
  });

  it("lists the newest thread first", () => {
    const a = c({ id: "a" });
    const b = c({ id: "b" });
    expect(buildCommentThreads([a, b]).map((t) => t.root.id)).toEqual(["b", "a"]);
  });
});
