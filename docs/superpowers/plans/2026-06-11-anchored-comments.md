# Anchored Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attach panel comments to highlighted document ranges in the SuperDoc iframe; clicking the comment scrolls to the highlight.

**Architecture:** SuperDoc native comments are the anchor (visible highlight, Yjs-synced). Host stays the only comment UI. Four new postMessage shapes cross the iframe bridge; the host's `EditorAdapter` gains `anchorComment(text)` with requestId/timeout correlation; `anchorCommentId` rides the existing rich-comment metadata sentinel.

**Tech Stack:** React + TypeScript (swifter host), vanilla TS + SuperDoc v1.38 (superdoc-swiftpro iframe app), vitest both sides.

**Spec:** `docs/superpowers/specs/2026-06-11-anchored-comments-design.md`

**Repos:**
- HOST = `c:\Users\HomePC\Documents\GitHub\swifter` (branch as-is; stage ONLY the files listed per task — the working tree has unrelated modified files)
- APP = `c:\Users\HomePC\Documents\GitHub\superdoc-swiftpro` (branch `feat/superdoc-iframe-app`)

**Test runners:** both repos: `pnpm exec vitest run <file>` (HOST's `pnpm test` is Playwright — do NOT use it for unit tests).

**Verified SuperDoc v1.38 API facts (from installed `.d.ts`):**
- `editor.doc.selection.current({ includeText: true })` → `{ empty: boolean; target: TextTarget | null; text?: string }`. Pass `target` straight to comments.create.
- `editor.doc.comments.create({ text, target })` → receipt; success carries `id: string`.
- `superdoc.navigateTo({ kind: "entity", entityType: "comment", entityId })` scrolls/activates (same call family as existing `focusRedline`).
- `modules.comments` enables comment marks/highlights; the built-in comments list UI only mounts if `addCommentsList()` is called (we don't).

---

## Task 1 (APP): bridge message shapes

**Files:**
- Modify: `src/bridge.ts`
- Test: `src/bridge.test.ts`

- [ ] **Step 1: Write failing tests** — append to `src/bridge.test.ts` (match existing test style in that file; it defines a `const HOST = "https://host.example"` style origin helper — reuse whatever the file already uses for `parseHostCommand` tests):

```ts
describe("anchored-comment bridge messages", () => {
  it("parses superdoc:add-comment", () => {
    const evt = new MessageEvent("message", {
      data: { type: "superdoc:add-comment", payload: { requestId: "q1", text: "hello" } },
      origin: HOST,
    });
    expect(parseHostCommand(evt, HOST)).toEqual({
      type: "superdoc:add-comment",
      payload: { requestId: "q1", text: "hello" },
    });
  });

  it("rejects superdoc:add-comment without requestId or text", () => {
    const bad = (payload: unknown) =>
      parseHostCommand(
        new MessageEvent("message", { data: { type: "superdoc:add-comment", payload }, origin: HOST }),
        HOST,
      );
    expect(bad({ text: "hi" })).toBeNull();
    expect(bad({ requestId: "q1" })).toBeNull();
  });

  it("parses superdoc:focus-comment", () => {
    const evt = new MessageEvent("message", {
      data: { type: "superdoc:focus-comment", payload: { commentId: "c1" } },
      origin: HOST,
    });
    expect(parseHostCommand(evt, HOST)).toEqual({
      type: "superdoc:focus-comment",
      payload: { commentId: "c1" },
    });
  });

  it("builds selection and comment-created messages", () => {
    expect(buildSelectionState(true, "quoted text")).toEqual({
      type: "superdoc:selection",
      payload: { hasSelection: true, excerpt: "quoted text" },
    });
    expect(buildCommentCreated("q1", null)).toEqual({
      type: "superdoc:comment-created",
      payload: { requestId: "q1", commentId: null },
    });
  });
});
```

Add `buildSelectionState, buildCommentCreated` to the existing import from `./bridge`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run src/bridge.test.ts`
Expected: FAIL — `buildSelectionState` not exported.

- [ ] **Step 3: Implement** in `src/bridge.ts`:

Extend `SuperdocOutbound` (add to the union):

```ts
  | { type: "superdoc:selection"; payload: { hasSelection: boolean; excerpt: string } }
  | { type: "superdoc:comment-created"; payload: { requestId: string; commentId: string | null } };
```

Extend `HostCommand`:

```ts
export type HostCommand =
  | { type: "superdoc:apply-redline"; payload: { redlineId: string; replacement: string } }
  | { type: "superdoc:focus-redline"; payload: { redlineId: string } }
  | { type: "superdoc:add-comment"; payload: { requestId: string; text: string } }
  | { type: "superdoc:focus-comment"; payload: { commentId: string } };
```

In `parseHostCommand`, before the final `return null`:

```ts
  if (data.type === "superdoc:add-comment") {
    const p = data.payload;
    if (!isObject(p) || typeof p.requestId !== "string" || p.requestId.length === 0) return null;
    if (typeof p.text !== "string" || p.text.length === 0) return null;
    return { type: "superdoc:add-comment", payload: { requestId: p.requestId, text: p.text } };
  }
  if (data.type === "superdoc:focus-comment") {
    const p = data.payload;
    if (!isObject(p) || typeof p.commentId !== "string" || p.commentId.length === 0) return null;
    return { type: "superdoc:focus-comment", payload: { commentId: p.commentId } };
  }
```

New builders next to `buildPresence`:

```ts
export function buildSelectionState(hasSelection: boolean, excerpt: string): SuperdocOutbound {
  return { type: "superdoc:selection", payload: { hasSelection, excerpt } };
}

export function buildCommentCreated(requestId: string, commentId: string | null): SuperdocOutbound {
  return { type: "superdoc:comment-created", payload: { requestId, commentId } };
}
```

- [ ] **Step 4: Run to verify pass** — `pnpm exec vitest run src/bridge.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/bridge.ts src/bridge.test.ts
git commit -m "feat(bridge): add-comment/focus-comment commands + selection/comment-created outbound"
```

---

## Task 2 (APP): comments helper module

**Files:**
- Create: `src/comments.ts`
- Test: `src/comments.test.ts`

Mirrors the defensive style of `src/redlines.ts` (never throw on a SuperDoc API failure).

- [ ] **Step 1: Write failing tests** — create `src/comments.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import type { Editor, SuperDoc } from "@harbour-enterprises/superdoc";
import { captureSelection, createAnchoredComment, focusComment } from "./comments";

const editorWithDoc = (doc: unknown): Editor => ({ doc } as unknown as Editor);

describe("captureSelection", () => {
  it("returns target + trimmed excerpt for a non-empty selection", () => {
    const editor = editorWithDoc({
      selection: {
        current: () => ({ empty: false, target: { segments: [1] }, text: "  quoted  " }),
      },
    });
    expect(captureSelection(editor)).toEqual({ target: { segments: [1] }, excerpt: "quoted" });
  });

  it("returns null for an empty selection, a null target, or a throwing API", () => {
    expect(
      captureSelection(editorWithDoc({ selection: { current: () => ({ empty: true, target: null }) } })),
    ).toBeNull();
    expect(
      captureSelection(editorWithDoc({ selection: { current: () => ({ empty: false, target: null }) } })),
    ).toBeNull();
    expect(
      captureSelection(editorWithDoc({ selection: { current: () => { throw new Error("boom"); } } })),
    ).toBeNull();
    expect(captureSelection(null)).toBeNull();
  });

  it("caps the excerpt at 80 chars", () => {
    const long = "x".repeat(200);
    const editor = editorWithDoc({
      selection: { current: () => ({ empty: false, target: {}, text: long }) },
    });
    expect(captureSelection(editor)?.excerpt).toHaveLength(80);
  });
});

describe("createAnchoredComment", () => {
  it("creates a comment at the target and returns the receipt id", () => {
    const create = vi.fn().mockReturnValue({ id: "c1" });
    const editor = editorWithDoc({ comments: { create } });
    expect(createAnchoredComment(editor, "note", { t: 1 })).toBe("c1");
    expect(create).toHaveBeenCalledWith({ text: "note", target: { t: 1 } });
  });

  it("returns null on failure receipt, missing target, empty text, or API throw", () => {
    const editor = editorWithDoc({ comments: { create: () => ({ ok: false }) } });
    expect(createAnchoredComment(editor, "note", { t: 1 })).toBeNull();
    expect(createAnchoredComment(editor, "note", null)).toBeNull();
    expect(createAnchoredComment(editor, "", { t: 1 })).toBeNull();
    const throwing = editorWithDoc({ comments: { create: () => { throw new Error("boom"); } } });
    expect(createAnchoredComment(throwing, "note", { t: 1 })).toBeNull();
    expect(createAnchoredComment(null, "note", { t: 1 })).toBeNull();
  });
});

describe("focusComment", () => {
  it("navigates to the comment entity", () => {
    const navigateTo = vi.fn().mockResolvedValue(undefined);
    focusComment({ navigateTo } as unknown as SuperDoc, "c1");
    expect(navigateTo).toHaveBeenCalledWith({ kind: "entity", entityType: "comment", entityId: "c1" });
  });

  it("no-ops on missing instance, empty id, or navigateTo throw", () => {
    expect(() => focusComment(null, "c1")).not.toThrow();
    expect(() => focusComment({} as unknown as SuperDoc, "c1")).not.toThrow();
    const navigateTo = vi.fn(() => { throw new Error("boom"); });
    expect(() => focusComment({ navigateTo } as unknown as SuperDoc, "")).not.toThrow();
    expect(() => focusComment({ navigateTo } as unknown as SuperDoc, "c1")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm exec vitest run src/comments.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** — create `src/comments.ts`:

```ts
/**
 * Selection-anchored comments bridge.
 *
 * The host panel is the only comment UI; SuperDoc comments are used purely as
 * document anchors (visible highlight + navigateTo target). Same defensive
 * contract as redlines.ts: a missing editor/instance or a SuperDoc API throw
 * is a no-op/null, never a crash.
 *
 * SuperDoc API used (from the installed v1.38 type declarations):
 *   - `editor.doc.selection.current({includeText})` → { empty, target, text }
 *   - `editor.doc.comments.create({ text, target })` → receipt with `id`
 *   - `superdoc.navigateTo({kind:'entity',entityType:'comment',entityId})`
 */

import type { Editor, SuperDoc } from "@harbour-enterprises/superdoc";

const EXCERPT_MAX = 80;

/** The slice of `editor.doc` this module reads. Kept structural (like
 *  redlines.ts's DocApiLike) so SuperDoc minor bumps don't break typecheck. */
interface CommentsDocApi {
  selection?: {
    current: (input?: { includeText?: boolean }) => {
      empty: boolean;
      target: unknown;
      text?: string;
    };
  };
  comments?: {
    create: (input: { text: string; target?: unknown }) => unknown;
  };
}

function getDoc(editor: Editor | null): CommentsDocApi | null {
  if (!editor) return null;
  try {
    // `editor.doc` is a lazily-created getter; reading it can throw if the
    // editor session is torn down.
    const doc = (editor as unknown as { doc?: unknown }).doc;
    return (doc as CommentsDocApi) ?? null;
  } catch {
    return null;
  }
}

export interface CapturedSelection {
  /** Opaque TextTarget passed straight back into `comments.create`. */
  target: unknown;
  /** Quoted selection text, trimmed and capped, for the host's chip UI. */
  excerpt: string;
}

/** Read the current selection; null when empty/non-text/unavailable. */
export function captureSelection(editor: Editor | null): CapturedSelection | null {
  const doc = getDoc(editor);
  if (!doc?.selection) return null;
  try {
    const sel = doc.selection.current({ includeText: true });
    if (!sel || sel.empty || sel.target == null) return null;
    const excerpt =
      typeof sel.text === "string" ? sel.text.trim().slice(0, EXCERPT_MAX) : "";
    return { target: sel.target, excerpt };
  } catch {
    return null;
  }
}

/** Create a SuperDoc comment anchored at `target`. Returns the new comment id
 *  or null on any failure (caller reports null to the host — comment saves
 *  unanchored there). */
export function createAnchoredComment(
  editor: Editor | null,
  text: string,
  target: unknown,
): string | null {
  const doc = getDoc(editor);
  if (!doc?.comments || typeof text !== "string" || text.length === 0 || target == null) {
    return null;
  }
  try {
    const receipt = doc.comments.create({ text, target });
    const id =
      receipt && typeof receipt === "object"
        ? (receipt as { id?: unknown }).id
        : null;
    return typeof id === "string" && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

/** Scroll to / activate a comment anchor. Non-critical: no-op on failure. */
export function focusComment(superdoc: SuperDoc | null, commentId: string): void {
  if (!superdoc || typeof superdoc.navigateTo !== "function") return;
  if (typeof commentId !== "string" || commentId.length === 0) return;
  try {
    void superdoc.navigateTo({
      kind: "entity",
      entityType: "comment",
      entityId: commentId,
    });
  } catch {
    // Navigation is non-critical; swallow.
  }
}
```

- [ ] **Step 4: Run to verify pass** — `pnpm exec vitest run src/comments.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/comments.ts src/comments.test.ts
git commit -m "feat: selection capture + anchored-comment create/focus helpers"
```

---

## Task 3 (APP): enable the comments module

**Files:**
- Modify: `src/superdocOptions.ts`
- Test: `src/superdocOptions.test.ts`

- [ ] **Step 1: Write failing test** — append to the existing describe in `src/superdocOptions.test.ts` (match the file's existing fixture helpers for `payload`/`handlers`):

```ts
  it("enables the comments module (anchors for host-panel comments)", () => {
    const options = buildSuperdocOptions(payload, handlers);
    expect(options.modules.comments).toEqual({});
  });
```

- [ ] **Step 2: Run to verify failure** — `pnpm exec vitest run src/superdocOptions.test.ts` → FAIL.

- [ ] **Step 3: Implement** — in `buildSuperdocOptions`'s `modules` object, after the `toolbar` entry:

```ts
      // Comment marks/highlights for host-anchored comments. The built-in
      // comments list UI stays unmounted (we never call addCommentsList) —
      // the host panel is the only comment UI.
      comments: {},
```

- [ ] **Step 4: Run to verify pass** — `pnpm exec vitest run src/superdocOptions.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/superdocOptions.ts src/superdocOptions.test.ts
git commit -m "feat: enable SuperDoc comments module for anchor highlights"
```

---

## Task 4 (APP): main.ts wiring

**Files:**
- Modify: `src/main.ts`

No unit test (main.ts is integration glue, consistent with the file's existing untested status); behavior is covered by Tasks 1–2 units + manual UAT.

- [ ] **Step 1: Imports + state.** Add to the import from `"./comments"` (new line after the `./redlines` import):

```ts
import {
  captureSelection,
  createAnchoredComment,
  focusComment,
  type CapturedSelection,
} from "./comments";
```

Add `buildSelectionState, buildCommentCreated` to the existing `./bridge` import list.

Add module state next to `lastClickedRedlineId`:

```ts
/** Last non-empty text selection — the anchor target for `add-comment`. */
let lastSelection: CapturedSelection | null = null;
/** Debounce handle + last posted signal for the selection relay. */
let selectionTimer: ReturnType<typeof setTimeout> | undefined;
let lastSelectionSignal = "";
const SELECTION_DEBOUNCE_MS = 250;
```

- [ ] **Step 2: Selection relay.** Add below `pushRedlines()`:

```ts
/**
 * Debounced relay of selection state to the host (drives the "anchored to"
 * chip). Captures at post time so a burst of selectionUpdate events costs one
 * read; dedupes so collapsed-caret churn doesn't spam the bridge.
 */
function scheduleSelectionPost(): void {
  if (selectionTimer !== undefined) clearTimeout(selectionTimer);
  selectionTimer = setTimeout(() => {
    const captured = captureSelection(editorInstance);
    lastSelection = captured;
    const signal = captured ? `1:${captured.excerpt}` : "0";
    if (signal === lastSelectionSignal) return;
    lastSelectionSignal = signal;
    postToHost(
      buildSelectionState(Boolean(captured), captured?.excerpt ?? ""),
      hostTarget(),
    );
  }, SELECTION_DEBOUNCE_MS);
}
```

In `wireEditorEvents`, append inside the existing `selectionUpdate` handler (after the redline-clicked logic):

```ts
    scheduleSelectionPost();
```

- [ ] **Step 3: Command handlers.** The second `window.addEventListener("message", …)` block currently does `if (cmd.type === "superdoc:apply-redline") { … } else { focusRedline… }`. Replace its body with an explicit switch:

```ts
window.addEventListener("message", (event) => {
  const cmd = parseHostCommand(event, HOST_ORIGINS);
  if (!cmd) return;
  switch (cmd.type) {
    case "superdoc:apply-redline":
      applyRedline(editorInstance, cmd.payload.redlineId, cmd.payload.replacement);
      break;
    case "superdoc:focus-redline":
      focusRedline(superdocInstance, cmd.payload.redlineId);
      break;
    case "superdoc:add-comment": {
      // Anchor at the last captured selection; null commentId tells the host
      // to save the comment unanchored (graceful degradation).
      const commentId = lastSelection
        ? createAnchoredComment(editorInstance, cmd.payload.text, lastSelection.target)
        : null;
      postToHost(buildCommentCreated(cmd.payload.requestId, commentId), hostTarget());
      break;
    }
    case "superdoc:focus-comment":
      focusComment(superdocInstance, cmd.payload.commentId);
      break;
  }
});
```

- [ ] **Step 4: Verify** — `pnpm exec vitest run` (all app tests) and `pnpm exec tsc --noEmit` (or the repo's `pnpm typecheck` script if defined — check `package.json`). Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire selection relay + add/focus-comment host commands"
```

---

## Task 5 (HOST): superdocBridge message shapes

**Files:**
- Modify: `src/pages/CollaborationToolPage/collab/superdocBridge.ts`
- Test: `src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`

- [ ] **Step 1: Write failing tests** — append to `superdocBridge.test.ts` (uses the file's existing `evt` helper and `ORIGIN` const; add `buildAddComment, buildFocusComment` to the import):

```ts
describe("anchored-comment messages", () => {
  it("accepts superdoc:selection", () => {
    expect(
      parseSuperdocMessage(
        evt({ type: "superdoc:selection", payload: { hasSelection: true, excerpt: "quoted" } }),
        ORIGIN,
      ),
    ).toEqual({ type: "superdoc:selection", payload: { hasSelection: true, excerpt: "quoted" } });
  });

  it("coerces a malformed superdoc:selection payload", () => {
    expect(parseSuperdocMessage(evt({ type: "superdoc:selection" }), ORIGIN)).toEqual({
      type: "superdoc:selection",
      payload: { hasSelection: false, excerpt: "" },
    });
  });

  it("accepts superdoc:comment-created with a string or null commentId", () => {
    expect(
      parseSuperdocMessage(
        evt({ type: "superdoc:comment-created", payload: { requestId: "q1", commentId: "c1" } }),
        ORIGIN,
      ),
    ).toEqual({ type: "superdoc:comment-created", payload: { requestId: "q1", commentId: "c1" } });
    expect(
      parseSuperdocMessage(
        evt({ type: "superdoc:comment-created", payload: { requestId: "q1", commentId: null } }),
        ORIGIN,
      ),
    ).toEqual({ type: "superdoc:comment-created", payload: { requestId: "q1", commentId: null } });
  });

  it("rejects superdoc:comment-created without a requestId", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:comment-created", payload: { commentId: "c1" } }), ORIGIN),
    ).toBeNull();
  });

  it("builds add-comment and focus-comment commands", () => {
    expect(buildAddComment("q1", "hello")).toEqual({
      type: "superdoc:add-comment",
      payload: { requestId: "q1", text: "hello" },
    });
    expect(buildFocusComment("c1")).toEqual({
      type: "superdoc:focus-comment",
      payload: { commentId: "c1" },
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`
Expected: FAIL — `buildAddComment` not exported.

- [ ] **Step 3: Implement** in `superdocBridge.ts`:

Extend `SuperdocInbound` union:

```ts
  | { type: "superdoc:selection"; payload: { hasSelection: boolean; excerpt: string } }
  | {
      type: "superdoc:comment-created";
      payload: { requestId: string; commentId: string | null };
    };
```

In `parseSuperdocMessage`'s switch, before `default`:

```ts
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
```

Extend `SuperdocCommand` union and add builders next to `buildFocusRedline`:

```ts
  | { type: "superdoc:add-comment"; payload: { requestId: string; text: string } }
  | { type: "superdoc:focus-comment"; payload: { commentId: string } };
```

```ts
export function buildAddComment(requestId: string, text: string): SuperdocCommand {
  return { type: "superdoc:add-comment", payload: { requestId, text } };
}

export function buildFocusComment(commentId: string): SuperdocCommand {
  return { type: "superdoc:focus-comment", payload: { commentId } };
}
```

- [ ] **Step 4: Run to verify pass** — same vitest command → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CollaborationToolPage/collab/superdocBridge.ts src/pages/CollaborationToolPage/collab/superdocBridge.test.ts
git commit -m "feat(collab): bridge shapes for selection-anchored comments"
```

---

## Task 6 (HOST): EditorAdapter + IframeEditorPane

**Files:**
- Modify: `src/pages/CollaborationToolPage/collab/editorAdapter.ts`
- Modify: `src/pages/CollaborationToolPage/components/IframeEditorPane.tsx`
- Test: `src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx`

- [ ] **Step 1: Adapter type.** In `editorAdapter.ts`, append to the `EditorAdapter` type after `replaceRedline`:

```ts
  /** Anchor a comment at the editor's current selection. Resolves the new
   *  document-comment id, or null when anchoring fails/times out (caller
   *  saves the comment unanchored). Only the SuperDoc iframe adapter
   *  implements this. */
  anchorComment?: (text: string) => Promise<string | null>;
```

- [ ] **Step 2: Write failing tests** — append to `IframeEditorPane.test.tsx`. The existing tests show the harness: render, grab iframe, stub `contentWindow.postMessage`, dispatch `MessageEvent`s from `superdocOrigin()`.

```ts
  it("anchorComment posts add-comment and resolves with the created id", async () => {
    let adapter: any = null;
    render(
      <IframeEditorPane
        importMeta={importMeta}
        collabMeta={collabMeta}
        onEditorReady={(a) => { if (a) adapter = a; }}
      />,
    );
    const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", { configurable: true, value: { postMessage } });

    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", {
        data: { type: "superdoc:editor-ready", payload: {} }, origin: superdocOrigin(),
      }));
    });
    await waitFor(() => expect(adapter).not.toBeNull());

    const pending: Promise<string | null> = adapter.anchorComment("a note");
    const sent = postMessage.mock.calls.find((c) => c[0]?.type === "superdoc:add-comment");
    expect(sent).toBeTruthy();
    const requestId = sent![0].payload.requestId;
    expect(sent![0].payload.text).toBe("a note");

    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", {
        data: { type: "superdoc:comment-created", payload: { requestId, commentId: "c9" } },
        origin: superdocOrigin(),
      }));
    });
    await expect(pending).resolves.toBe("c9");
  });

  it("anchorComment resolves null when the iframe never answers (timeout)", async () => {
    vi.useFakeTimers();
    try {
      let adapter: any = null;
      render(
        <IframeEditorPane
          importMeta={importMeta}
          collabMeta={collabMeta}
          onEditorReady={(a) => { if (a) adapter = a; }}
        />,
      );
      const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
      Object.defineProperty(iframe, "contentWindow", {
        configurable: true, value: { postMessage: vi.fn() },
      });
      await act(async () => {
        window.dispatchEvent(new MessageEvent("message", {
          data: { type: "superdoc:editor-ready", payload: {} }, origin: superdocOrigin(),
        }));
      });
      await vi.waitFor(() => expect(adapter).not.toBeNull());

      const pending: Promise<string | null> = adapter.anchorComment("a note");
      await act(async () => {
        vi.advanceTimersByTime(6000);
      });
      await expect(pending).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("relays superdoc:selection as a ct-selection-change window event", async () => {
    render(
      <IframeEditorPane importMeta={importMeta} collabMeta={collabMeta} onEditorReady={vi.fn()} />,
    );
    const seen: any[] = [];
    const onSelection = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener("ct-selection-change", onSelection);
    try {
      await act(async () => {
        window.dispatchEvent(new MessageEvent("message", {
          data: { type: "superdoc:selection", payload: { hasSelection: true, excerpt: "quoted" } },
          origin: superdocOrigin(),
        }));
      });
      expect(seen).toEqual([{ hasSelection: true, excerpt: "quoted" }]);
    } finally {
      window.removeEventListener("ct-selection-change", onSelection);
    }
  });

  it("forwards ct-focus-comment and ct-focus-mark to the iframe", async () => {
    render(
      <IframeEditorPane importMeta={importMeta} collabMeta={collabMeta} onEditorReady={vi.fn()} />,
    );
    const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", { configurable: true, value: { postMessage } });

    await act(async () => {
      window.dispatchEvent(new CustomEvent("ct-focus-comment", { detail: { commentId: "c1" } }));
      window.dispatchEvent(new CustomEvent("ct-focus-mark", { detail: { id: "r1" } }));
    });
    expect(postMessage).toHaveBeenCalledWith(
      { type: "superdoc:focus-comment", payload: { commentId: "c1" } },
      superdocOrigin(),
    );
    expect(postMessage).toHaveBeenCalledWith(
      { type: "superdoc:focus-redline", payload: { redlineId: "r1" } },
      superdocOrigin(),
    );
  });
```

- [ ] **Step 3: Run to verify failure**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx`
Expected: new tests FAIL (`anchorComment` undefined, no relay/forwarding); the 5 existing tests still PASS.

- [ ] **Step 4: Implement** in `IframeEditorPane.tsx`:

Add imports: `buildAddComment, buildFocusComment` to the `../collab/superdocBridge` import list.

Add near `redlinesRef`:

```ts
  const ANCHOR_TIMEOUT_MS = 5000;
  // In-flight anchorComment requests, keyed by requestId. Resolved by the
  // iframe's `superdoc:comment-created` reply, or with null on timeout/unmount.
  const pendingAnchorsRef = useRef(
    new Map<string, { resolve: (id: string | null) => void; timer: number }>(),
  );

  const settleAnchor = useCallback((requestId: string, commentId: string | null) => {
    const entry = pendingAnchorsRef.current.get(requestId);
    if (!entry) return;
    pendingAnchorsRef.current.delete(requestId);
    window.clearTimeout(entry.timer);
    entry.resolve(commentId);
  }, []);
```

Extend `buildAdapter` (inside the returned object, after `replaceRedline`):

```ts
    anchorComment: (text) =>
      new Promise<string | null>((resolve) => {
        const requestId = crypto.randomUUID();
        const timer = window.setTimeout(
          () => settleAnchor(requestId, null),
          ANCHOR_TIMEOUT_MS,
        );
        pendingAnchorsRef.current.set(requestId, { resolve, timer });
        postCommand(buildAddComment(requestId, text));
      }),
```

…and add `settleAnchor` to `buildAdapter`'s dependency array: `[postCommand, settleAnchor]`.

In the `onMessage` switch, add cases:

```ts
        case "superdoc:comment-created":
          settleAnchor(msg.payload.requestId, msg.payload.commentId);
          break;
        case "superdoc:selection":
          window.dispatchEvent(
            new CustomEvent("ct-selection-change", { detail: msg.payload }),
          );
          break;
```

After the `onFocusRedline` listener registration, add:

```ts
    const onFocusComment = (e: Event) => {
      const id = (e as CustomEvent).detail?.commentId;
      if (typeof id === "string" && id) postCommand(buildFocusComment(id));
    };
    window.addEventListener("ct-focus-comment", onFocusComment);

    // CommentsTab's click affordance fires `ct-focus-mark { id }` (legacy mark
    // event). For the iframe path the id is a tracked-change id — route it to
    // the same focus-redline command so redline-anchored comments scroll too.
    const onFocusMark = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (typeof id === "string" && id) postCommand(buildFocusRedline(id));
    };
    window.addEventListener("ct-focus-mark", onFocusMark);
```

In the effect's cleanup (alongside the existing removals):

```ts
      window.removeEventListener("ct-focus-comment", onFocusComment);
      window.removeEventListener("ct-focus-mark", onFocusMark);
      // Settle any in-flight anchor requests so awaiting callers don't hang.
      for (const [requestId] of pendingAnchorsRef.current) {
        settleAnchor(requestId, null);
      }
```

(`settleAnchor` is stable (`useCallback` with `[]`), add it to the effect dep array — it won't retrigger the mount-once effect.)

- [ ] **Step 5: Run to verify pass** — same vitest command → all PASS (existing 5 + new 4).

- [ ] **Step 6: Commit**

```bash
git add src/pages/CollaborationToolPage/collab/editorAdapter.ts src/pages/CollaborationToolPage/components/IframeEditorPane.tsx src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx
git commit -m "feat(collab): anchorComment adapter + selection relay + focus forwarding in iframe pane"
```

---

## Task 7 (HOST): metadata round-trip + UI

**Files:**
- Modify: `src/pages/CollaborationToolPage/collab/useFileComments.ts`
- Modify: `src/pages/CollaborationToolPage/index.tsx`
- Modify: `src/pages/CollaborationToolPage/components/SidebarPanel.tsx`
- Modify: `src/pages/CollaborationToolPage/components/CommentsTab.tsx`

No new unit test (private encode/decode helpers + prop threading; covered by typecheck and UAT — consistent with existing coverage of this metadata path).

- [ ] **Step 1: `useFileComments.ts`** — add `anchorCommentId` to the rich shape and the sentinel round-trip.

In `FileCommentRich` after `redlineKind`:

```ts
  /** SuperDoc document-comment id this comment is anchored to (click-to-scroll). */
  anchorCommentId?: string | null;
```

In `encodeRichToWire`, after the `redlineKind` line:

```ts
  if (rich.anchorCommentId) meta.anchorCommentId = rich.anchorCommentId;
```

In `decodeWireToRich`'s rich return, after `redlineKind`:

```ts
      anchorCommentId:
        typeof parsed.anchorCommentId === "string" ? parsed.anchorCommentId : null,
```

- [ ] **Step 2: `index.tsx`** — thread the field + pending-anchor state + submit flow.

Add `anchorCommentId?: string | null;` to BOTH the `SidebarFeed` type (after `redlineId`) and the `LocalComment` type (after `redlineKind`).

In `mapLocalCommentsToFeed`, after `redlineId`:

```ts
    anchorCommentId: comment.anchorCommentId ?? null,
```

In `combinedComments`' fileId mapping, after `redlineKind`:

```ts
        anchorCommentId: c.anchorCommentId ?? null,
```

Add pending-anchor state next to `pendingRedlineRef` (state, not ref — it drives the chip render):

```ts
  // Selection-anchor chip state, fed by `ct-selection-change` from the
  // SuperDoc iframe. While set, the next submitted comment anchors to the
  // document selection. Dismissible (the X on the chip).
  const [pendingAnchor, setPendingAnchor] = useState<{ excerpt: string } | null>(null);
```

Add a listener effect (after the existing `ct-add-redline` effect):

```ts
  useEffect(() => {
    const onSelectionChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { hasSelection?: boolean; excerpt?: string }
        | undefined;
      setPendingAnchor(
        detail?.hasSelection ? { excerpt: detail.excerpt ?? "" } : null,
      );
    };
    window.addEventListener("ct-selection-change", onSelectionChange);
    return () =>
      window.removeEventListener("ct-selection-change", onSelectionChange);
  }, []);
```

Rework `handleSubmitComment` to anchor first (async — the `onCommentSubmit?: () => void` prop accepts it):

```ts
  const handleSubmitComment = useCallback(async () => {
    if (!canWriteComment) return;

    const trimmed = commentInput.trim();
    if (!trimmed) return;

    // Anchor to the live document selection when the chip is active. A
    // null result (timeout/failed create) degrades to a plain comment —
    // saving never blocks on the iframe.
    let anchorCommentId: string | null = null;
    const adapter = editorAdapterRef.current;
    if (pendingAnchor && adapter?.anchorComment) {
      anchorCommentId = await adapter.anchorComment(trimmed);
      if (!anchorCommentId && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("[anchored-comment] anchor failed; saving unanchored");
      }
    }

    const redline = pendingRedlineRef.current;
    const next: LocalComment = {
      id: crypto.randomUUID(),
      author: user?.name || "Unknown User",
      createdAt: new Date().toISOString(),
      content: trimmed,
      redlineId: redline?.redlineId ?? null,
      redlineKind: redline?.kind ?? null,
      anchorCommentId,
      mentions: pendingMentionsRef.current,
    };
```

…the `addFileComment.mutate` payload gains `anchorCommentId: next.anchorCommentId,` (after `redlineKind`); the localStorage branch is unchanged (it stores `next` whole). After `pendingRedlineRef.current = null;` add:

```ts
    setPendingAnchor(null);
```

…and the snapshot label line becomes:

```ts
    saveVersionSnapshot(
      redline?.redlineId || anchorCommentId ? "Added anchored comment" : "Added comment",
      "comment",
    );
```

Add `pendingAnchor` to the `useCallback` dependency array.

In the JSX, pass the chip props to `SidebarPanel` (after `isSubmittingComment`):

```tsx
          anchorExcerpt={pendingAnchor?.excerpt ?? null}
          onDismissAnchor={() => setPendingAnchor(null)}
```

- [ ] **Step 3: `SidebarPanel.tsx`** — thread the new props.

`Feed` type: add `redlineId?: string | null;` is NOT present today (it's in CommentsTab's own type) — add both fields so the panel type matches what it forwards:

```ts
  redlineId?: string | null;
  anchorCommentId?: string | null;
```

`SidebarPanelProps`: after `isSubmittingComment`:

```ts
  anchorExcerpt?: string | null;
  onDismissAnchor?: () => void;
```

Destructure both (defaults: `anchorExcerpt = null`), and forward to `<CommentsTab …>`:

```tsx
              anchorExcerpt={anchorExcerpt}
              onDismissAnchor={onDismissAnchor}
```

- [ ] **Step 4: `CommentsTab.tsx`** — chip + click routing.

Imports: `import { X } from "lucide-react";`

`CommentsFeedItem`: add after `redlineId`:

```ts
  anchorCommentId?: string | null;
```

`CommentsTabProps`: after `mentionables`:

```ts
  /** Excerpt of the document selection the next comment will anchor to. */
  anchorExcerpt?: string | null;
  onDismissAnchor?: () => void;
```

Destructure (`anchorExcerpt = null, onDismissAnchor`).

Update `renderCommentItem`'s focus handler and clickability so document-anchored comments route to the iframe:

```ts
      const isAnchored = Boolean(comment.anchorCommentId || comment.redlineId);
      const focusMark = () => {
        if (comment.anchorCommentId) {
          window.dispatchEvent(
            new CustomEvent("ct-focus-comment", {
              detail: { commentId: comment.anchorCommentId },
            }),
          );
          return;
        }
        if (!comment.redlineId) return;
        window.dispatchEvent(
          new CustomEvent("ct-focus-mark", {
            detail: { id: comment.redlineId },
          }),
        );
      };
```

…and replace every `comment.redlineId ?` conditional in that JSX block (className, onClick, role, tabIndex, onKeyDown, and the "anchored to document" footer) with `isAnchored ?` / `{isAnchored && (`.

Render the chip between the section header and `<WriteComment …>`:

```tsx
      {anchorExcerpt !== null && (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300">
          <span className="min-w-0 truncate">
            anchored to: “{anchorExcerpt || "selection"}”
          </span>
          <button
            type="button"
            aria-label="Remove anchor"
            onClick={onDismissAnchor}
            className="ml-auto shrink-0 rounded p-0.5 transition-colors hover:bg-amber-100 dark:hover:bg-amber-800/40"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
```

- [ ] **Step 5: Verify** — `pnpm exec tsc --noEmit` (or the repo's typecheck script per `package.json`), then `pnpm exec vitest run src/pages/CollaborationToolPage` → all unit tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/CollaborationToolPage/collab/useFileComments.ts src/pages/CollaborationToolPage/index.tsx src/pages/CollaborationToolPage/components/SidebarPanel.tsx src/pages/CollaborationToolPage/components/CommentsTab.tsx
git commit -m "feat(collab): selection-anchor chip, anchored submit flow, click-to-scroll routing"
```

---

## Task 8: full verification + manual UAT

- [ ] **Step 1: Full unit runs.** HOST: `pnpm exec vitest run src/pages/CollaborationToolPage` → PASS. APP: `pnpm exec vitest run` → PASS. Both: typecheck + `pnpm lint` (if script exists) clean for the touched files.

- [ ] **Step 2: Manual UAT** (HOST dev server on :5173, APP dev server on :5174, open a collaboration-tool URL with `sourceUrl` + `fileId`):
  1. Select text in the document → amber chip appears above the comment box with the excerpt.
  2. Type a comment, submit → highlight appears on the selected range; comment shows "anchored to document".
  3. Click the comment → document scrolls to / activates the highlight.
  4. Click the X on the chip, submit another comment → no highlight, plain comment.
  5. Click inside a tracked change, add a comment, click that comment → scrolls to the redline (previously broken in the iframe path).
  6. Reload the page → highlight persists (Yjs room), clicking the comment still scrolls.
  7. Check no SuperDoc-native comment UI (floating cards/sidebar) appeared. If a floating comment layer DOES appear: inspect its DOM class in devtools and hide it in APP `src/style.css` with a comment explaining the host owns comment UI; re-verify.

- [ ] **Step 3: Update memory + report.** Note any UAT deviations; mark plan checkboxes done.

---

## Self-review notes

- Spec coverage: bridge messages (T1/T5), iframe anchor+focus (T2/T4), comments module (T3), adapter+relay+`ct-focus-mark` fix (T6), metadata+chip+routing (T7), UAT incl. reload + redline regression (T8). Out-of-scope items from the spec stay out.
- Type consistency: `anchorComment(text) => Promise<string | null>` used identically in T6 adapter and T7 submit; `anchorCommentId` field name identical across `FileCommentRich`/`LocalComment`/`SidebarFeed`/`CommentsFeedItem`; event names `ct-selection-change`/`ct-focus-comment` identical in T6 listeners and T7 dispatchers; bridge type strings identical on both sides (T1 ↔ T5).
