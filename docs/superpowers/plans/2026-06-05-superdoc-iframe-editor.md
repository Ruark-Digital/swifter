# SuperDoc Iframe Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a SuperDoc editor option to the CollaborationToolPage that runs in an isolated cross-origin iframe and talks to SwiftPro only via `postMessage`, keeping the AGPL-3.0 SuperDoc library out of SwiftPro's proprietary bundle.

**Architecture:** SwiftPro renders an `<iframe>` pointing at a separate AGPL app (built in another repo — out of scope here). A pure protocol module validates/origin-checks every message; a thin React pane wires the iframe to the page. The host fetches the `.docx` bytes (it has the network context) and ships them to the iframe; SuperDoc collaborates in a namespaced `${roomId}:superdoc` Yjs room. SuperDoc is gated behind `?editor=superdoc` — TipTap stays the default until the separate app is deployed.

**Tech Stack:** React + TypeScript, Vite, Vitest + jsdom + @testing-library/react, `postMessage`. No new runtime dependency in this repo.

**Spec:** `docs/superpowers/specs/2026-06-05-superdoc-iframe-editor-design.md`

---

## File Structure

- `src/pages/CollaborationToolPage/collab/superdocBridge.ts` — NEW. Pure protocol module: message types, origin helper, `parseSuperdocMessage` (origin-check + shape validation), `buildInitPayload`. The only logic-heavy unit; fully unit-tested.
- `src/pages/CollaborationToolPage/collab/superdocBridge.test.ts` — NEW. Unit tests for the protocol module.
- `src/pages/CollaborationToolPage/components/IframeEditorPane.tsx` — NEW. React pane: renders the iframe, runs the host bridge (fetch bytes on `ready`, post `init`, surface `editor-ready`/`error`/`doc-edit`), calls `onEditorReady(null)`.
- `src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx` — NEW. Integration test for the `ready → fetch → init` handshake.
- `src/pages/CollaborationToolPage/index.tsx` — MODIFY. Add a third `?editor=superdoc` branch + lazy import.
- `.env.example` (if present) — MODIFY. Document `VITE_SUPERDOC_APP_URL`.

---

## Task 1: Protocol module (`superdocBridge.ts`)

**Files:**
- Create: `src/pages/CollaborationToolPage/collab/superdocBridge.ts`
- Test: `src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  superdocOrigin,
  parseSuperdocMessage,
  buildInitPayload,
} from "./superdocBridge";

const ORIGIN = "https://superdoc.example.com";

const evt = (data: unknown, origin = ORIGIN) =>
  ({ data, origin } as MessageEvent);

describe("superdocOrigin", () => {
  it("extracts the origin from an app url with a path", () => {
    expect(superdocOrigin("https://superdoc.example.com/app/")).toBe(ORIGIN);
  });
});

describe("parseSuperdocMessage", () => {
  it("rejects messages from a different origin", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:ready" }, "https://evil.com"), ORIGIN),
    ).toBeNull();
  });

  it("rejects non-object data", () => {
    expect(parseSuperdocMessage(evt("superdoc:ready"), ORIGIN)).toBeNull();
  });

  it("rejects unknown message types", () => {
    expect(parseSuperdocMessage(evt({ type: "other" }), ORIGIN)).toBeNull();
  });

  it("accepts superdoc:ready", () => {
    expect(parseSuperdocMessage(evt({ type: "superdoc:ready" }), ORIGIN)).toEqual({
      type: "superdoc:ready",
    });
  });

  it("accepts superdoc:doc-edit", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:doc-edit" }), ORIGIN),
    ).toEqual({ type: "superdoc:doc-edit" });
  });

  it("accepts superdoc:editor-ready with pageCount", () => {
    expect(
      parseSuperdocMessage(
        evt({ type: "superdoc:editor-ready", payload: { pageCount: 12 } }),
        ORIGIN,
      ),
    ).toEqual({ type: "superdoc:editor-ready", payload: { pageCount: 12 } });
  });

  it("coerces a missing error message to a default string", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:error" }), ORIGIN),
    ).toEqual({ type: "superdoc:error", payload: { message: "Unknown error" } });
  });
});

describe("buildInitPayload", () => {
  it("namespaces the room id with :superdoc", () => {
    const bytes = new ArrayBuffer(8);
    const msg = buildInitPayload({
      docBytes: bytes,
      fileName: "deal.docx",
      fileType: "DOCX",
      documentMode: "editing",
      user: { name: "Ada", email: "ada@x.com" },
      roomId: "room-1",
      wsUrl: "ws://localhost:1234",
    });
    expect(msg.type).toBe("superdoc:init");
    expect(msg.payload.roomId).toBe("room-1:superdoc");
    expect(msg.payload.docBytes).toBe(bytes);
    expect(msg.payload.documentMode).toBe("editing");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`
Expected: FAIL — `Failed to resolve import "./superdocBridge"` / functions not defined.

- [ ] **Step 3: Write the module**

Create `src/pages/CollaborationToolPage/collab/superdocBridge.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`
Expected: PASS — 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CollaborationToolPage/collab/superdocBridge.ts src/pages/CollaborationToolPage/collab/superdocBridge.test.ts
git commit -m "feat(superdoc): postMessage protocol module for isolated iframe editor"
```

---

## Task 2: Iframe pane (`IframeEditorPane.tsx`)

**Files:**
- Create: `src/pages/CollaborationToolPage/components/IframeEditorPane.tsx`
- Test: `src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import IframeEditorPane from "./IframeEditorPane";
import { superdocOrigin } from "../collab/superdocBridge";

vi.mock("@/store/authSlice", () => ({
  useUser: () => ({ name: "Ada", email: "ada@x.com" }),
}));
vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ error: vi.fn(), success: vi.fn() }),
}));

const importMeta = { sourceUrl: "https://files.x.com/a.docx", fileName: "a.docx", fileType: "DOCX" };
const collabMeta = { wsUrl: "ws://localhost:1234", roomId: "room-1", token: "", disable: false, presenceActive: false };

describe("IframeEditorPane", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }) as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("on superdoc:ready, fetches the doc and posts an init message into the iframe", async () => {
    const onEditorReady = vi.fn();
    render(
      <IframeEditorPane importMeta={importMeta} collabMeta={collabMeta} onEditorReady={onEditorReady} />,
    );

    const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      value: { postMessage },
    });

    // iframe announces it is ready
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "superdoc:ready" },
          origin: superdocOrigin(),
        }),
      );
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(importMeta.sourceUrl);
      expect(postMessage).toHaveBeenCalledTimes(1);
    });
    const [msg, targetOrigin] = postMessage.mock.calls[0];
    expect(msg.type).toBe("superdoc:init");
    expect(msg.payload.roomId).toBe("room-1:superdoc");
    expect(targetOrigin).toBe(superdocOrigin());

    // iframe reports the editor is ready
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "superdoc:editor-ready", payload: { pageCount: 3 } },
          origin: superdocOrigin(),
        }),
      );
    });
    await waitFor(() => expect(onEditorReady).toHaveBeenCalledWith(null));
  });

  it("ignores messages from an untrusted origin", async () => {
    render(
      <IframeEditorPane importMeta={importMeta} collabMeta={collabMeta} onEditorReady={vi.fn()} />,
    );
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "superdoc:ready" },
          origin: "https://evil.com",
        }),
      );
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx`
Expected: FAIL — `Failed to resolve import "./IframeEditorPane"`.

- [ ] **Step 3: Write the component**

Create `src/pages/CollaborationToolPage/components/IframeEditorPane.tsx`:

```tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/store/authSlice";
import { useToastHandler } from "@/hooks/useToaster";
import type { EditorAdapter } from "../collab/editorAdapter";
import {
  SUPERDOC_APP_URL,
  superdocOrigin,
  parseSuperdocMessage,
  buildInitPayload,
} from "../collab/superdocBridge";

type EditorImportMeta = { sourceUrl: string; fileName: string; fileType: string };
type EditorCollabMeta = {
  wsUrl: string;
  roomId: string;
  token: string;
  disable: boolean;
  presenceActive: boolean;
};

type Props = {
  importMeta: EditorImportMeta;
  collabMeta: EditorCollabMeta;
  onEditorReady: (adapter: EditorAdapter | null) => void;
};

// Renders the AGPL SuperDoc app in an isolated iframe and bridges to it via
// postMessage only. The host fetches the .docx bytes (it has the network
// context the cross-origin iframe lacks) and ships them on `superdoc:ready`.
// MVP: the sidebar's AI / version features are inert (onEditorReady(null));
// backend comments still work because they don't use the adapter.
const IframeEditorPane: React.FC<Props> = ({
  importMeta,
  collabMeta,
  onEditorReady,
}) => {
  const user = useUser();
  const toastHandler = useToastHandler();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const origin = superdocOrigin();

  const sendInit = useCallback(async () => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    if (!importMeta.sourceUrl) return;
    try {
      const res = await fetch(importMeta.sourceUrl);
      const docBytes = await res.arrayBuffer();
      const msg = buildInitPayload({
        docBytes,
        fileName: importMeta.fileName,
        fileType: importMeta.fileType,
        documentMode: "editing",
        user: { name: user?.name || "Unknown User", email: user?.email || "" },
        roomId: collabMeta.roomId,
        wsUrl: collabMeta.wsUrl,
      });
      frame.postMessage(msg, origin, [docBytes]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus("error");
      toastHandler.error("Document failed to load", message);
    }
  }, [
    collabMeta.roomId,
    collabMeta.wsUrl,
    importMeta.fileName,
    importMeta.fileType,
    importMeta.sourceUrl,
    origin,
    toastHandler,
    user?.email,
    user?.name,
  ]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = parseSuperdocMessage(event, origin);
      if (!msg) return;
      switch (msg.type) {
        case "superdoc:ready":
          void sendInit();
          break;
        case "superdoc:editor-ready":
          setStatus("ready");
          // Adapter is null for the MVP — the sidebar's adapter-gated
          // handlers (AI redline, version snapshots) no-op safely.
          onEditorReady(null);
          break;
        case "superdoc:doc-edit":
          window.dispatchEvent(new CustomEvent("ct-doc-edit"));
          break;
        case "superdoc:error":
          setStatus("error");
          toastHandler.error("Editor error", msg.payload.message);
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      onEditorReady(null);
    };
  }, [onEditorReady, origin, sendInit, toastHandler]);

  return (
    <div className="ct-editor-panel relative h-full w-full">
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          {status === "error" ? "Could not load the editor." : "Loading editor…"}
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="SuperDoc editor"
        src={SUPERDOC_APP_URL}
        className="h-full w-full border-0"
      />
    </div>
  );
};

export default IframeEditorPane;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx`
Expected: PASS — both tests green.

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: no errors. (This project has no `pnpm typecheck` script; `tsc -b` is the gate.)

- [ ] **Step 6: Commit**

```bash
git add src/pages/CollaborationToolPage/components/IframeEditorPane.tsx src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx
git commit -m "feat(superdoc): IframeEditorPane host bridge for isolated editor"
```

---

## Task 3: Wire `?editor=superdoc` into `index.tsx`

**Files:**
- Modify: `src/pages/CollaborationToolPage/index.tsx:66-71` (lazy imports) and `:626-640` (editor branch)

- [ ] **Step 1: Add the lazy import**

In `src/pages/CollaborationToolPage/index.tsx`, immediately after the existing
`TipTapEditorPane` lazy import (around line 71), add:

```tsx
// SuperDoc runs as a separate AGPL app inside an iframe; this pane is the
// host-side postMessage bridge. Gated behind `?editor=superdoc` until the
// separate app is deployed (TipTap stays the default).
const IframeEditorPane = lazyWithRetry(() => import("./components/IframeEditorPane"));
```

- [ ] **Step 2: Replace the editor branch**

Replace the existing ternary inside `<Suspense>` (currently
`searchParams.get("editor") === "yoopta" ? <EditorPane .../> : <TipTapEditorPane .../>`)
with a three-way branch:

```tsx
{(() => {
  const editorParam = searchParams.get("editor");
  if (editorParam === "superdoc") {
    return (
      <IframeEditorPane
        importMeta={importMeta}
        collabMeta={collabMeta}
        onEditorReady={handleEditorReady}
      />
    );
  }
  if (editorParam === "yoopta") {
    return (
      <EditorPane
        importMeta={importMeta}
        collabMeta={collabMeta}
        onEditorReady={handleEditorReady}
      />
    );
  }
  return (
    <TipTapEditorPane
      importMeta={importMeta}
      collabMeta={collabMeta}
      onEditorReady={handleEditorReady}
    />
  );
})()}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 4: Run the collab test suite to confirm no regression**

Run: `pnpm exec vitest run src/pages/CollaborationToolPage`
Expected: PASS — existing `classifyTransaction` / schema tests plus the two new files all green.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CollaborationToolPage/index.tsx
git commit -m "feat(superdoc): mount IframeEditorPane behind ?editor=superdoc"
```

---

## Task 4: Env documentation + build gate

**Files:**
- Modify: `.env.example` (only if it exists)

- [ ] **Step 1: Document the env var**

Check for an example env file:

Run: `ls .env.example .env.sample 2>&1`

If one exists, append:

```
# Origin of the standalone AGPL SuperDoc app (used by ?editor=superdoc).
# Defaults to http://localhost:5174 when unset.
VITE_SUPERDOC_APP_URL=http://localhost:5174
```

If no example env file exists, skip the file edit — the default in
`superdocBridge.ts` (`http://localhost:5174`) covers local dev; note the var in
the commit message instead.

- [ ] **Step 2: Full production build**

Run: `pnpm build`
Expected: `tsc -b && vite build` completes with no errors. The new pane is a
lazy chunk; SuperDoc is NOT in the dependency graph (verify no
`superdoc`/`@harbour-enterprises` string appears in the build output).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs(superdoc): document VITE_SUPERDOC_APP_URL env var"
```

---

## Manual smoke (after Task 4 — requires a stub iframe target)

A real end-to-end check needs the separate AGPL app (out of scope). To smoke the
host side alone, point `VITE_SUPERDOC_APP_URL` at a tiny stub page that posts
`{ type: "superdoc:ready" }` on load and echoes `{ type: "superdoc:editor-ready" }`
back. Then:

1. `pnpm dev`, open the CollaborationTool with `?editor=superdoc&sourceUrl=...&fileName=...&fileType=docx`.
2. Confirm the iframe mounts and the "Loading editor…" overlay clears after the stub echoes `editor-ready`.
3. Confirm a message posted from a different origin is ignored (no init sent).
4. Confirm `?editor=tiptap` (and the default, no param) still loads the existing TipTap editor unchanged.

---

## Self-Review

**Spec coverage:**
- Iframe isolation + postMessage-only → Tasks 1-2 (no SuperDoc import anywhere). ✓
- Host fetches bytes, sends transferable → Task 2 `sendInit`. ✓
- Namespaced `:superdoc` room → Task 1 `buildInitPayload`. ✓
- `?editor=superdoc` flag, TipTap default → Task 3. ✓
- Sidebar inert via `onEditorReady(null)` → Task 2. ✓
- `VITE_SUPERDOC_APP_URL` env → Tasks 1 + 4. ✓
- Origin checks both inbound + outbound → Task 1 `parseSuperdocMessage` (inbound) + Task 2 `postMessage(msg, origin)` (outbound). ✓
- Separate-repo contract is spec-only (not built here). ✓ (documented, not a task)

**Placeholder scan:** No TBD/TODO; every code step has full code. ✓

**Type consistency:** `buildInitPayload`/`parseSuperdocMessage`/`superdocOrigin`/`SUPERDOC_APP_URL` names match between `superdocBridge.ts` (Task 1), its test, and `IframeEditorPane.tsx` (Task 2). `onEditorReady(null)` matches `index.tsx`'s `handleEditorReady: (adapter: EditorAdapter | null) => void`. Pane prop shape matches the props passed to `EditorPane`/`TipTapEditorPane` in Task 3. ✓
