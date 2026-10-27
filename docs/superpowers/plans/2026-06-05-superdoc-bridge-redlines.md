# SuperDoc Bridge — Toolbar + Redlines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the SuperDoc app an editing toolbar, and wire SwiftPro's existing AI-Polish/Redline flow to the SuperDoc document — extract the doc's tracked changes ("redlines") into the sidebar and write the replacement back into SuperDoc when a suggestion is accepted, with click-to-highlight linking.

**Architecture:** SwiftPro's sidebar stays source of truth. `IframeEditorPane` publishes a bridge-backed `editorAdapter` (instead of `null`) so the page's existing `adapter.extractRedlines()` / `adapter.replaceRedline()` calls round-trip to SuperDoc over `postMessage`. The iframe pushes its tracked-changes list (host caches it so `extractRedlines()` stays sync); accept posts `apply-redline`; focus posts `focus-redline`.

**Tech Stack:** React + TS (swifter), vanilla TS + SuperDoc SDK (superdoc-swiftpro), Vitest, Playwright, postMessage.

**Spec:** `docs/superpowers/specs/2026-06-05-superdoc-bridge-redlines-comments-design.md` (slices 1 + 2; slice 3 = comments, deferred).

**Two repos:**
- `swifter` (host, branch `feat-collab-superdoc-editor`)
- `superdoc-swiftpro` (AGPL app) at `C:\Users\HomePC\Documents\GitHub\superdoc-swiftpro`

---

## File Structure

- `superdoc-swiftpro/index.html` — MODIFY: add a `#superdoc-toolbar` mount above `#editor`.
- `superdoc-swiftpro/src/superdocOptions.ts` — MODIFY: add `toolbar` + tracked-changes handler wiring to the options builder.
- `superdoc-swiftpro/src/style.css` — MODIFY: layout for toolbar + editor.
- `superdoc-swiftpro/src/bridge.ts` — MODIFY: add redline message types + parse/build helpers.
- `superdoc-swiftpro/src/bridge.test.ts` — MODIFY: tests for the new messages.
- `superdoc-swiftpro/src/redlines.ts` — CREATE: SuperDoc tracked-changes ↔ RedlineSpan mapping + apply/focus (the discovered-API layer).
- `superdoc-swiftpro/src/main.ts` — MODIFY: wire redline events/commands.
- `swifter/src/pages/CollaborationToolPage/collab/superdocBridge.ts` — MODIFY: mirror the redline message types + parse/build.
- `swifter/src/pages/CollaborationToolPage/collab/superdocBridge.test.ts` — MODIFY: tests.
- `swifter/src/pages/CollaborationToolPage/collab/editorAdapter.ts` — MODIFY: `doc?` optional, add `"superdoc"` kind.
- `swifter/src/pages/CollaborationToolPage/components/IframeEditorPane.tsx` — MODIFY: redline cache + bridge-backed adapter + redline-clicked re-emit.
- `swifter/src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx` — MODIFY: adapter/cache tests.

---

## Task 1: Editing toolbar (slice 1, app-only)

**Files:**
- Modify: `superdoc-swiftpro/index.html`
- Modify: `superdoc-swiftpro/src/superdocOptions.ts`
- Modify: `superdoc-swiftpro/src/style.css`

- [ ] **Step 1: Add the toolbar mount to the HTML**

In `superdoc-swiftpro/index.html`, replace the body's editor div with a toolbar + editor stack:

```html
  <body>
    <!-- SuperDoc renders its toolbar here and the document in #editor. The host
         (SwiftPro) embeds this page in an iframe. -->
    <div id="superdoc-toolbar"></div>
    <div id="editor"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
```

- [ ] **Step 2: Pass the toolbar mount in the options builder**

In `superdoc-swiftpro/src/superdocOptions.ts`, add `toolbar: "#superdoc-toolbar"` to the returned options object (right after `selector`):

```ts
  return {
    selector: "#editor",
    toolbar: "#superdoc-toolbar",
    document: new Blob([payload.docBytes], { type: DOCX_MIME }),
    documentMode: payload.documentMode,
    user: payload.user,
    ...handlers,
  };
```

- [ ] **Step 3: Lay out toolbar + editor in CSS**

In `superdoc-swiftpro/src/style.css`, add (after the existing `#editor` rule):

```css
/* Toolbar pinned on top; editor fills the rest and scrolls. */
body {
  display: flex;
  flex-direction: column;
}
#superdoc-toolbar {
  flex: 0 0 auto;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}
#editor {
  flex: 1 1 auto;
  min-height: 0;
}
```

Then update the existing `#editor` rule to remove the now-conflicting fixed height:

Change `#editor { height: 100%; overflow: hidden; }` to `#editor { overflow: hidden; }`
(the flex layout now sizes it).

- [ ] **Step 4: Verify the toolbar renders**

Run the app: `cd superdoc-swiftpro && pnpm exec vite --host` (or reuse the running one). Then in `swifter`, open the collaboration tool with `?editor=superdoc&...`. Confirm a formatting toolbar appears above the document and bold/italic affect the text. (Manual — SuperDoc renders the toolbar; no unit test.)

Run: `cd superdoc-swiftpro && pnpm typecheck`
Expected: clean.

- [ ] **Step 5: Commit (in superdoc-swiftpro)**

```bash
cd superdoc-swiftpro
git add index.html src/superdocOptions.ts src/style.css
git commit -m "feat: editing toolbar above the document"
```

---

## Task 2: Redline bridge protocol — host side (`swifter`)

**Files:**
- Modify: `swifter/src/pages/CollaborationToolPage/collab/superdocBridge.ts`
- Modify: `swifter/src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`

- [ ] **Step 1: Write failing tests for the new redline messages**

Append to `superdocBridge.test.ts` inside the existing `describe("parseSuperdocMessage", ...)` block:

```ts
  it("accepts superdoc:redlines and coerces the array", () => {
    const r = [{ redlineId: "r1", kind: "insertion", text: "hi" }];
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:redlines", payload: { redlines: r } }), ORIGIN),
    ).toEqual({ type: "superdoc:redlines", payload: { redlines: r } });
  });

  it("defaults superdoc:redlines to an empty array when missing", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:redlines" }), ORIGIN),
    ).toEqual({ type: "superdoc:redlines", payload: { redlines: [] } });
  });

  it("accepts superdoc:redline-clicked", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:redline-clicked", payload: { redlineId: "r1" } }), ORIGIN),
    ).toEqual({ type: "superdoc:redline-clicked", payload: { redlineId: "r1" } });
  });
```

Add a new describe block for the outbound builders:

```ts
describe("redline command builders", () => {
  it("buildApplyRedline", () => {
    expect(buildApplyRedline("r1", "new text")).toEqual({
      type: "superdoc:apply-redline",
      payload: { redlineId: "r1", replacement: "new text" },
    });
  });
  it("buildFocusRedline", () => {
    expect(buildFocusRedline("r1")).toEqual({
      type: "superdoc:focus-redline",
      payload: { redlineId: "r1" },
    });
  });
});
```

Update the import at the top of the test to include the new builders:

```ts
import {
  superdocOrigin,
  parseSuperdocMessage,
  buildInitPayload,
  buildApplyRedline,
  buildFocusRedline,
} from "./superdocBridge";
```

- [ ] **Step 2: Run tests — expect failure**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`
Expected: FAIL — `buildApplyRedline` not exported / new types unknown.

- [ ] **Step 3: Extend the protocol module**

In `superdocBridge.ts`:

(a) Add the `RedlineSpan` type import — reuse the existing one:
```ts
import type { RedlineSpan } from "./redlineScan";
```

(b) Extend `SuperdocInbound` with the two new inbound messages:
```ts
export type SuperdocInbound =
  | { type: "superdoc:ready" }
  | { type: "superdoc:doc-edit" }
  | { type: "superdoc:editor-ready"; payload: { pageCount?: number } }
  | { type: "superdoc:error"; payload: { message: string } }
  | { type: "superdoc:redlines"; payload: { redlines: RedlineSpan[] } }
  | { type: "superdoc:redline-clicked"; payload: { redlineId: string } };
```

(c) Add new outbound command types + builders (after `buildInitPayload`):
```ts
export type SuperdocCommand =
  | { type: "superdoc:apply-redline"; payload: { redlineId: string; replacement: string } }
  | { type: "superdoc:focus-redline"; payload: { redlineId: string } };

export function buildApplyRedline(redlineId: string, replacement: string): SuperdocCommand {
  return { type: "superdoc:apply-redline", payload: { redlineId, replacement } };
}

export function buildFocusRedline(redlineId: string): SuperdocCommand {
  return { type: "superdoc:focus-redline", payload: { redlineId } };
}
```

(d) Add the two inbound cases to `parseSuperdocMessage`'s switch (before `default`):
```ts
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
```

- [ ] **Step 4: Run tests — expect pass**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`
Expected: PASS (existing 11 + new ~5).

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm exec tsc -b --noEmit` → clean.
```bash
git add src/pages/CollaborationToolPage/collab/superdocBridge.ts src/pages/CollaborationToolPage/collab/superdocBridge.test.ts
git commit -m "feat(superdoc): redline bridge message types + command builders"
```

---

## Task 3: Bridge-backed editorAdapter + EditorAdapter type (`swifter`)

**Files:**
- Modify: `swifter/src/pages/CollaborationToolPage/collab/editorAdapter.ts`
- Modify: `swifter/src/pages/CollaborationToolPage/components/IframeEditorPane.tsx`
- Modify: `swifter/src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx`

- [ ] **Step 1: Relax the EditorAdapter type**

In `editorAdapter.ts`:
- Change `export type EditorKind = "yoopta" | "tiptap";` to `export type EditorKind = "yoopta" | "tiptap" | "superdoc";`
- Change `doc: Y.Doc;` to `doc?: Y.Doc;` (the iframe has no host-side Y.Doc). Update the JSDoc to note it's absent for the SuperDoc iframe.

- [ ] **Step 2: Write the failing test for the adapter**

Add to `IframeEditorPane.test.tsx` (it already imports render/act/etc.):

```tsx
  it("publishes a bridge-backed adapter: caches redlines, applies on replaceRedline", async () => {
    let adapter: any = null;
    render(
      <IframeEditorPane
        importMeta={importMeta}
        collabMeta={collabMeta}
        onEditorReady={(a) => { adapter = a; }}
      />,
    );
    const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", { configurable: true, value: { postMessage } });

    // editor-ready publishes the adapter
    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", {
        data: { type: "superdoc:editor-ready", payload: {} }, origin: superdocOrigin(),
      }));
    });
    await waitFor(() => expect(adapter).not.toBeNull());
    expect(adapter.kind).toBe("superdoc");

    // a redlines push updates the cache extractRedlines() returns
    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", {
        data: { type: "superdoc:redlines", payload: { redlines: [{ redlineId: "r1", kind: "insertion", text: "x" }] } },
        origin: superdocOrigin(),
      }));
    });
    expect(adapter.extractRedlines()).toEqual([{ redlineId: "r1", kind: "insertion", text: "x" }]);

    // replaceRedline posts apply-redline to the iframe
    adapter.replaceRedline("r1", "fixed");
    expect(postMessage).toHaveBeenCalledWith(
      { type: "superdoc:apply-redline", payload: { redlineId: "r1", replacement: "fixed" } },
      superdocOrigin(),
    );
  });
```

- [ ] **Step 3: Run — expect failure**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx`
Expected: FAIL — adapter is null (still `onEditorReady(null)`).

- [ ] **Step 4: Implement the bridge-backed adapter in IframeEditorPane**

In `IframeEditorPane.tsx`:

(a) Add imports:
```ts
import type { EditorAdapter } from "../collab/editorAdapter";
import type { RedlineSpan } from "../collab/redlineScan";
import {
  SUPERDOC_APP_URL,
  superdocOrigin,
  parseSuperdocMessage,
  buildInitPayload,
  buildApplyRedline,
  buildFocusRedline,
} from "../collab/superdocBridge";
```

(b) Add a ref holding the latest redlines cache + a helper to post commands:
```ts
  const redlinesRef = useRef<RedlineSpan[]>([]);
  const postCommand = useCallback(
    (msg: { type: string; payload: unknown }) => {
      iframeRef.current?.contentWindow?.postMessage(msg, origin);
    },
    [origin],
  );
```

(c) Build the adapter once (memoized) and publish it on `editor-ready`:
```ts
  const buildAdapter = useCallback((): EditorAdapter => ({
    kind: "superdoc",
    doc: undefined,
    getSnapshot: () => null,
    setSnapshot: () => {},
    extractRedlines: () => redlinesRef.current,
    replaceRedline: (redlineId, replacement) =>
      postCommand(buildApplyRedline(redlineId, replacement)),
  }), [postCommand]);
```

(d) In the message switch (inside the mount-once effect), handle the new messages and publish the adapter on editor-ready:
```ts
        case "superdoc:editor-ready":
          setPhase("ready");
          onEditorReadyRef.current(buildAdapterRef.current());
          break;
        case "superdoc:redlines":
          redlinesRef.current = msg.payload.redlines;
          break;
        case "superdoc:redline-clicked":
          window.dispatchEvent(
            new CustomEvent("ct-add-redline", {
              detail: { redlineId: msg.payload.redlineId, kind: "insertion" },
            }),
          );
          break;
```
Add `buildAdapterRef` alongside the other refs (mount-once pattern):
```ts
  const buildAdapterRef = useRef(buildAdapter);
  useEffect(() => { buildAdapterRef.current = buildAdapter; });
```
(Keep the existing `sendInitRef`/`onEditorReadyRef`/`failRef` updates in the same effect.)

(e) Expose `focusRedline` for the sidebar link: add a window listener that lets the page request focus. In the mount-once effect add:
```ts
    const onFocusRedline = (e: Event) => {
      const id = (e as CustomEvent).detail?.redlineId;
      if (typeof id === "string") postCommand(buildFocusRedline(id));
    };
    window.addEventListener("ct-focus-redline", onFocusRedline);
```
and in the cleanup add `window.removeEventListener("ct-focus-redline", onFocusRedline);`. Add `postCommand` is stable (deps `[origin]`) — keep effect deps `[origin]`.

(f) Remove the now-unused direct `onEditorReady` import usage note: the cleanup still calls `onEditorReadyRef.current(null)` on unmount (resets adapter) — keep it.

- [ ] **Step 5: Run — expect pass**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx`
Expected: PASS (the 4 existing — note the editor-ready test asserted `onEditorReady` called with `null`; update that assertion to `expect(onEditorReady).toHaveBeenCalled()` and check the arg is an object with `kind: "superdoc"`, OR keep a separate assertion — fix that existing test to match the new non-null adapter).

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm exec tsc -b --noEmit` → clean.
```bash
git add src/pages/CollaborationToolPage/collab/editorAdapter.ts src/pages/CollaborationToolPage/components/IframeEditorPane.tsx src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx
git commit -m "feat(superdoc): bridge-backed editorAdapter (redline extract/apply/focus)"
```

---

## Task 4: Redline bridge protocol — app side (`superdoc-swiftpro`)

**Files:**
- Modify: `superdoc-swiftpro/src/bridge.ts`
- Modify: `superdoc-swiftpro/src/bridge.test.ts`

Mirror Task 2 in the app's bridge module so producer/consumer stay in lockstep.

- [ ] **Step 1: Write failing tests** (append to `bridge.test.ts`):

```ts
describe("redline messages", () => {
  it("parseHostMessage accepts apply-redline", () => {
    const r = parseHostCommand(msg(HOST, { type: "superdoc:apply-redline", payload: { redlineId: "r1", replacement: "x" } }), HOST);
    expect(r).toEqual({ type: "superdoc:apply-redline", payload: { redlineId: "r1", replacement: "x" } });
  });
  it("parseHostCommand rejects foreign origin", () => {
    expect(parseHostCommand(msg(EVIL, { type: "superdoc:focus-redline", payload: { redlineId: "r1" } }), HOST)).toBeNull();
  });
  it("buildRedlines posts the array", () => {
    expect(buildRedlines([{ redlineId: "r1", kind: "insertion", text: "x" }])).toEqual({
      type: "superdoc:redlines", payload: { redlines: [{ redlineId: "r1", kind: "insertion", text: "x" }] },
    });
  });
});
```
Add to the import: `parseHostCommand, buildRedlines, buildRedlineClicked`.

- [ ] **Step 2: Run — expect failure**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/bridge.test.ts`
Expected: FAIL — new exports missing.

- [ ] **Step 3: Implement** in `bridge.ts`:

```ts
export type RedlineKind = "insertion" | "deletion";
export interface RedlineSpan {
  redlineId: string;
  kind: RedlineKind;
  text: string;
  author?: string;
  createdAt?: string;
}

// host → app commands
export type HostCommand =
  | { type: "superdoc:apply-redline"; payload: { redlineId: string; replacement: string } }
  | { type: "superdoc:focus-redline"; payload: { redlineId: string } };

export function parseHostCommand(event: MessageEvent, hostOrigin: string): HostCommand | null {
  if (event.origin !== hostOrigin) return null;
  const data = event.data;
  if (!isObject(data)) return null;
  if (data.type === "superdoc:apply-redline") {
    const p = data.payload;
    if (!isObject(p) || typeof p.redlineId !== "string" || typeof p.replacement !== "string") return null;
    return { type: "superdoc:apply-redline", payload: { redlineId: p.redlineId, replacement: p.replacement } };
  }
  if (data.type === "superdoc:focus-redline") {
    const p = data.payload;
    if (!isObject(p) || typeof p.redlineId !== "string") return null;
    return { type: "superdoc:focus-redline", payload: { redlineId: p.redlineId } };
  }
  return null;
}

// app → host
export function buildRedlines(redlines: RedlineSpan[]): SuperdocOutbound {
  return { type: "superdoc:redlines", payload: { redlines } };
}
export function buildRedlineClicked(redlineId: string): SuperdocOutbound {
  return { type: "superdoc:redline-clicked", payload: { redlineId } };
}
```
Extend `SuperdocOutbound` with the two new variants:
```ts
  | { type: "superdoc:redlines"; payload: { redlines: RedlineSpan[] } }
  | { type: "superdoc:redline-clicked"; payload: { redlineId: string } };
```

- [ ] **Step 4: Run — expect pass** → `pnpm exec vitest run src/bridge.test.ts`.

- [ ] **Step 5: Commit (in superdoc-swiftpro)**
```bash
git add src/bridge.ts src/bridge.test.ts
git commit -m "feat: redline bridge messages (apply/focus/redlines/clicked)"
```

---

## Task 5: SuperDoc tracked-changes ↔ redlines (`superdoc-swiftpro`)

**Files:**
- Create: `superdoc-swiftpro/src/redlines.ts`
- Modify: `superdoc-swiftpro/src/main.ts`

> **Discovery first — the SuperDoc track-changes instance API is not fully
> documented.** The candidate commands exist in the bundle:
> `acceptTrackedChangeById`, `rejectTrackedChangeById`, `acceptAllTrackedChanges`.
> They are editor commands (SuperDoc's editor is ProseMirror/TipTap-based).

- [ ] **Step 1: Discover the API**

Run these and record what's available:
```bash
cd superdoc-swiftpro
grep -oE "(getTrackedChanges|trackedChanges|activeEditor|\.editor\b|commands\.[a-zA-Z]+)" node_modules/@harbour-enterprises/superdoc/dist/superdoc.es.js | sort -u | head -40
```
Determine: (i) how to reach the editor instance from the `SuperDoc` object returned by `new SuperDoc(...)` (e.g. `superdoc.activeEditor`, `superdoc.editors[0]`, or a value passed to an `onEditorCreate`/`onReady` callback); (ii) how to enumerate tracked changes with their **text + id + kind** (a getter, a plugin state, or walking the doc for tracked-change marks); (iii) the command to replace a change's text (likely: position to the change, replace its text run, keep/accept it). If enumeration-with-text isn't directly exposed, walk the ProseMirror doc for nodes/marks carrying tracked-change attributes (ids) and collect their text — mirror the approach in `swifter/.../redlineScan.ts` (which walks leaves for `insertion`/`deletion` marks).

If after ~20 min the replace-text-of-a-change path isn't clear, STOP and report BLOCKED with what you found, so we can choose between (a) accept-with-edit, (b) reject-then-insert-replacement, or (c) a different command.

- [ ] **Step 2: Implement `redlines.ts`**

Create `superdoc-swiftpro/src/redlines.ts` exposing three functions against the discovered API. Skeleton (fill the `// DISCOVERED:` lines with the real calls from Step 1):

```ts
import type { RedlineSpan } from "./bridge";

// `editor` is the SuperDoc editor instance discovered in Step 1.
export function extractRedlines(editor: any): RedlineSpan[] {
  const out: RedlineSpan[] = [];
  // DISCOVERED: enumerate tracked changes (id, kind, text, author, date) and push RedlineSpan.
  // Fallback: walk editor.state.doc descendants for marks with a trackedChange attr.
  return out;
}

export function applyRedline(editor: any, redlineId: string, replacement: string): void {
  // DISCOVERED: select the change's range by id, replace its text with `replacement`,
  // and accept it (so it's no longer a pending redline). e.g. editor.commands.* .
}

export function focusRedline(editor: any, redlineId: string): void {
  // DISCOVERED: scroll to + select the change's range by id.
}
```

- [ ] **Step 3: Wire into `main.ts`**

- Capture the editor instance (from the discovered access path) once SuperDoc is ready.
- Add `onTrackedChangesUpdate` to the handlers passed via `superdocOptions` (extend `SuperdocHandlers` in `superdocOptions.ts` with `onTrackedChangesUpdate?: () => void`) → on fire, `postToHost(buildRedlines(extractRedlines(editor)), HOST_ORIGIN)`. Also push once on `onReady`.
- Add an inbound command listener (separate from the init listener, or extend it) using `parseHostCommand`:
```ts
window.addEventListener("message", (event) => {
  const cmd = parseHostCommand(event, HOST_ORIGIN);
  if (!cmd) return;
  if (cmd.type === "superdoc:apply-redline") applyRedline(editor, cmd.payload.redlineId, cmd.payload.replacement);
  else if (cmd.type === "superdoc:focus-redline") focusRedline(editor, cmd.payload.redlineId);
});
```
- On `onHighlightClick`/tracked-change click (discovered), `postToHost(buildRedlineClicked(id), HOST_ORIGIN)`.

- [ ] **Step 4: Verify (manual + typecheck)**

Run: `pnpm typecheck` → clean.
Manual: open the Powell-Comments `.docx` (it has tracked changes) via `?editor=superdoc` → Redline tab → confirm the list populates → "Generate suggestions" → accept one → the text changes in the SuperDoc document.

- [ ] **Step 5: Commit (in superdoc-swiftpro)**
```bash
git add src/redlines.ts src/main.ts src/superdocOptions.ts
git commit -m "feat: map SuperDoc tracked-changes to redline bridge (extract/apply/focus)"
```

---

## Task 6: End-to-end verification (`swifter`)

- [ ] **Step 1: Temp Playwright spec** at `swifter/src/__verify__/redline-e2e.spec.ts` (reuse the established harness: `seedAuth`, intercept the docx fetch, `waitUntil:"commit"`, wait for the iframe + `superdoc:editor-ready`). Use a docx with tracked changes (or assert the `superdoc:redlines` message arrives). Capture: that the host received `superdoc:redlines`, that opening the Redline tab calls `extractRedlines` (non-empty), and that accepting posts `apply-redline` (spy via the `__msgs` capture + asserting the iframe received it — or assert the sidebar reflects the change).

- [ ] **Step 2: Run** `pnpm exec playwright test src/__verify__/redline-e2e.spec.ts --project=chromium --reporter=line`. Confirm the redlines round-trip.

- [ ] **Step 3: Remove the temp spec** (`rm -rf src/__verify__`), then final `pnpm exec tsc -b --noEmit` + `pnpm exec vitest run src/pages/CollaborationToolPage/collab src/pages/CollaborationToolPage/components`.

- [ ] **Step 4: Commit any remaining host changes** (sidebar focus wiring if added).

---

## Self-Review

**Spec coverage:** Toolbar → Task 1 ✓. Redline extract→sidebar → Tasks 2,3,4,5 ✓. Apply-on-accept → Task 3 (`replaceRedline`→`apply-redline`) + Task 5 (`applyRedline`) ✓. Focus/highlight link → Task 3 (`ct-focus-redline`→`focus-redline`) + Task 5 (`focusRedline`) ✓. Redline-clicked → Task 3 re-emit + Task 5 ✓. Bridge protocol mirrored both repos → Tasks 2,4 ✓. EditorAdapter `doc?`/`superdoc` kind → Task 3 ✓. Comments (slice 3) intentionally deferred — not in this plan. ✓

**Placeholder scan:** The only deliberately non-prewritten code is Task 5's `redlines.ts` bodies, gated behind an explicit discovery step with a BLOCKED escape — because SuperDoc's tracked-change instance API isn't documented and must be read from the installed package. Everything else (bridge protocol, host adapter, toolbar) is concrete.

**Type consistency:** `RedlineSpan` shape identical in both repos and matches `redlineScan.ts`. `buildApplyRedline`/`buildFocusRedline` (host) ↔ `parseHostCommand` (app) message types match exactly (`superdoc:apply-redline {redlineId,replacement}`, `superdoc:focus-redline {redlineId}`). `buildRedlines`/`buildRedlineClicked` (app) ↔ `parseSuperdocMessage` inbound cases (host) match. `editorAdapter` methods match what `index.tsx` calls (`extractRedlines`, `replaceRedline`).
