# SuperDoc Collab Editor — Production-Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the swifter host and the superdoc-swiftpro AGPL editor app production-ready so that, on deploy, the cross-origin iframe handshake and SuperDoc real-time collaboration connect first-try — without merging to `main` or pressing deploy.

**Architecture:** Two Vite apps on separate Amplify apps/origins, bridged by an origin-checked `postMessage` contract. The editor app owns the Yjs `WebsocketProvider` inside the iframe; it must replicate the host's WS URL-rewrite + subprotocol auth, and use a *connect-or-fallback* (sync the provider first, then hand it to SuperDoc; on timeout, render document-only) so an unreachable server never hangs the editor blank.

**Tech Stack:** Vite, TypeScript, React (host), vanilla TS (editor), `@harbour-enterprises/superdoc@1.38.0`, `yjs`, `y-websocket`, AWS Amplify Hosting, vitest.

**Repos (two working dirs):**
- **HOST** = `swifter` (`c:\Users\HomePC\Documents\GitHub\swifter`), branch `feat-collab-superdoc-editor`.
- **APP** = `superdoc-swiftpro` (`c:\Users\HomePC\Documents\GitHub\superdoc-swiftpro`), branch `feat/superdoc-iframe-app`.

**Commands per repo:**
- HOST: typecheck `pnpm exec tsc -b --noEmit`; build `pnpm build`; unit test a file `pnpm exec vitest run <path>`.
- APP: typecheck `pnpm typecheck`; build `pnpm build`; test `pnpm test` (or `pnpm exec vitest run <path>`).

**Prod origin placeholders** (substitute real values at deploy; the plan uses these literals): host = `https://app.swiftpro.tech`, editor = `https://editor.swiftpro.tech`, API/WS = `https://api.swiftpro.tech` / `wss://api.swiftpro.tech`.

---

## File Structure

**APP (superdoc-swiftpro) — new files**
- `src/env.ts` — resolve `VITE_HOST_ORIGIN` with prod fail-loud.
- `src/collabSocket.ts` — port of the host's WS URL-rewrite + subprotocol auth.
- `src/collabProvider.ts` — connect-or-fallback: sync a provider within a timeout or return null.
- `amplify.yml` — Amplify build spec.
- `customHttp.yml` — response headers (CSP `frame-ancestors`).
- `src/env.test.ts`, `src/collabSocket.test.ts`, `src/collabProvider.test.ts` — unit tests.

**APP — modified**
- `src/main.ts` — use `env.ts`; make `handleInit` async; build provider; pass collab to options.
- `src/superdocOptions.ts` — accept an optional collab handle; add `modules.collaboration` when present.
- `src/bridge.ts` — add `token` to the init payload + validation; fix the roomId comment.
- `src/superdocOptions.test.ts`, `src/bridge.test.ts` — extend.
- `index.html` — AGPL source link.
- `.env.example`, `README.md` — env docs.

**HOST (swifter) — new files**
- `customHttp.yml` — CSP (`frame-src` editor, `connect-src` API/WS).
- `.env.example` — document `VITE_SUPERDOC_APP_URL`, `VITE_WS_URL`.
- `src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.tsx` — production loader.
- `src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.test.tsx`.

**HOST — modified**
- `src/pages/CollaborationToolPage/collab/superdocBridge.ts` — fail-loud app URL; add `token`; colon-free room.
- `src/pages/CollaborationToolPage/components/IframeEditorPane.tsx` — pass `token`; use the skeleton.
- `src/pages/CollaborationToolPage/collab/superdocBridge.test.ts` — extend.
- `.gitignore` — un-ignore `.env.example`.

---

## Phase 1 — Cross-origin env fail-loud (both repos)

### Task 1: APP — fail-loud `VITE_HOST_ORIGIN`

**Files:**
- Create: `superdoc-swiftpro/src/env.ts`
- Create: `superdoc-swiftpro/src/env.test.ts`
- Modify: `superdoc-swiftpro/src/main.ts:20`

- [ ] **Step 1: Write the failing test**

`superdoc-swiftpro/src/env.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { resolveHostOrigin } from "./env";

describe("resolveHostOrigin", () => {
  it("returns the configured origin when set", () => {
    expect(resolveHostOrigin({ VITE_HOST_ORIGIN: "https://app.swiftpro.tech", PROD: true }))
      .toBe("https://app.swiftpro.tech");
  });

  it("falls back to localhost in dev when unset", () => {
    expect(resolveHostOrigin({ VITE_HOST_ORIGIN: undefined, PROD: false }))
      .toBe("http://localhost:5173");
  });

  it("throws in a production build when unset", () => {
    expect(() => resolveHostOrigin({ VITE_HOST_ORIGIN: undefined, PROD: true }))
      .toThrow(/VITE_HOST_ORIGIN/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/env.test.ts`
Expected: FAIL — `resolveHostOrigin` is not exported / module not found.

- [ ] **Step 3: Write the implementation**

`superdoc-swiftpro/src/env.ts`:
```ts
// Resolves the trusted host origin for the postMessage bridge.
//
// In a production build a missing VITE_HOST_ORIGIN is fatal: without it the app
// would either silently target the wrong origin (handshake dies) or post to
// "undefined". We fail loud at startup instead of shipping a dead editor.
const DEV_HOST_ORIGIN = "http://localhost:5173";

export function resolveHostOrigin(
  env: { VITE_HOST_ORIGIN?: string; PROD: boolean },
): string {
  const value = env.VITE_HOST_ORIGIN?.trim();
  if (value) return value;
  if (env.PROD) {
    throw new Error(
      "VITE_HOST_ORIGIN is not set. The SuperDoc editor app needs the host " +
        "origin (e.g. https://app.swiftpro.tech) to validate and target " +
        "postMessage traffic. Set it as a build-time env var in Amplify.",
    );
  }
  return DEV_HOST_ORIGIN;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/env.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire it into main.ts**

In `superdoc-swiftpro/src/main.ts`, replace line 20:
```ts
const HOST_ORIGIN = import.meta.env.VITE_HOST_ORIGIN;
```
with:
```ts
import { resolveHostOrigin } from "./env";
// ...existing imports above this line...
const HOST_ORIGIN = resolveHostOrigin(import.meta.env);
```
(Place the `import` with the other imports at the top; keep the `const HOST_ORIGIN` where it was.)

- [ ] **Step 6: Verify typecheck + build**

Run: `cd superdoc-swiftpro && pnpm typecheck && pnpm build`
Expected: typecheck clean; build exits 0; `dist/index.html` exists.

- [ ] **Step 7: Commit**

```bash
cd superdoc-swiftpro
git add src/env.ts src/env.test.ts src/main.ts
git commit -m "feat: fail-loud VITE_HOST_ORIGIN in production builds"
```

---

### Task 2: HOST — fail-loud `VITE_SUPERDOC_APP_URL`

**Files:**
- Modify: `swifter/src/pages/CollaborationToolPage/collab/superdocBridge.ts:34-35`
- Modify: `swifter/src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `swifter/src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`:
```ts
import { resolveSuperdocAppUrl } from "./superdocBridge";

describe("resolveSuperdocAppUrl", () => {
  it("returns the configured url when set", () => {
    expect(resolveSuperdocAppUrl({ VITE_SUPERDOC_APP_URL: "https://editor.swiftpro.tech", PROD: true }))
      .toBe("https://editor.swiftpro.tech");
  });
  it("falls back to localhost in dev when unset", () => {
    expect(resolveSuperdocAppUrl({ VITE_SUPERDOC_APP_URL: undefined, PROD: false }))
      .toBe("http://localhost:5174");
  });
  it("throws in production when unset", () => {
    expect(() => resolveSuperdocAppUrl({ VITE_SUPERDOC_APP_URL: undefined, PROD: true }))
      .toThrow(/VITE_SUPERDOC_APP_URL/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd swifter && pnpm exec vitest run src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`
Expected: FAIL — `resolveSuperdocAppUrl` not exported.

- [ ] **Step 3: Write the implementation**

In `swifter/src/pages/CollaborationToolPage/collab/superdocBridge.ts`, replace lines 32-35:
```ts
/** Where the AGPL SuperDoc app is served from. MUST be a full URL incl. scheme
 *  (e.g. https://superdoc.example.com) — `superdocOrigin()` calls `new URL()`. */
export const SUPERDOC_APP_URL: string =
  import.meta.env.VITE_SUPERDOC_APP_URL || "http://localhost:5174";
```
with:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd swifter && pnpm exec vitest run src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`
Expected: PASS (existing tests + 3 new).

- [ ] **Step 5: Commit**

```bash
cd swifter
git add src/pages/CollaborationToolPage/collab/superdocBridge.ts src/pages/CollaborationToolPage/collab/superdocBridge.test.ts
git commit -m "feat: fail-loud VITE_SUPERDOC_APP_URL in production builds"
```

---

## Phase 2 — Bridge contract: add `token`, colon-free room (both repos)

### Task 3: HOST — add `token` to the init contract and colon-free room name

**Files:**
- Modify: `swifter/src/pages/CollaborationToolPage/collab/superdocBridge.ts` (`SuperdocInitMessage`, `buildInitPayload`)
- Modify: `swifter/src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`
- Modify: `swifter/src/pages/CollaborationToolPage/components/IframeEditorPane.tsx:114-122`

- [ ] **Step 1: Write the failing test**

Append to `superdocBridge.test.ts`:
```ts
import { buildInitPayload } from "./superdocBridge";

describe("buildInitPayload token + room", () => {
  const base = {
    docBytes: new ArrayBuffer(8),
    fileName: "a.docx",
    fileType: "docx",
    documentMode: "editing" as const,
    user: { name: "A", email: "a@b.c" },
    roomId: "room123",
    wsUrl: "wss://api.swiftpro.tech/api/v1/dev/contract",
    token: "jwt-abc",
  };

  it("forwards the token verbatim", () => {
    expect(buildInitPayload(base).payload.token).toBe("jwt-abc");
  });

  it("namespaces the room with a colon-free, single-segment suffix", () => {
    const room = buildInitPayload(base).payload.roomId;
    expect(room).toBe("room123-superdoc");
    expect(room).not.toContain(":");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd swifter && pnpm exec vitest run src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`
Expected: FAIL — `token` missing on the payload type / `roomId` still uses `:superdoc`.

- [ ] **Step 3: Implement — add `token` to the type**

In `superdocBridge.ts`, in `SuperdocInitMessage.payload` (currently lines 20-30), add a `token` field after `wsUrl`:
```ts
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
```

- [ ] **Step 4: Implement — colon-free room in `buildInitPayload`**

Replace `buildInitPayload` (lines 88-97):
```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd swifter && pnpm exec vitest run src/pages/CollaborationToolPage/collab/superdocBridge.test.ts`
Expected: PASS.

- [ ] **Step 6: Pass the token from IframeEditorPane**

In `IframeEditorPane.tsx`, in the `buildInitPayload({...})` call (lines 114-122), add `token: collabMeta.token,` after `wsUrl: collabMeta.wsUrl,`:
```ts
        const msg = buildInitPayload({
          docBytes,
          fileName: importMeta.fileName,
          fileType: importMeta.fileType,
          documentMode: "editing",
          user: { name: user?.name || "Unknown User", email: user?.email || "" },
          roomId: collabMeta.roomId,
          wsUrl: collabMeta.wsUrl,
          token: collabMeta.token,
        });
```
Then add `collabMeta.token` to the `sendInit` `useCallback` dependency array (currently lines 138-149) — insert `collabMeta.token,` next to `collabMeta.roomId,`.

- [ ] **Step 7: Verify typecheck**

Run: `cd swifter && pnpm exec tsc -b --noEmit`
Expected: clean (no missing-property error on `buildInitPayload`).

- [ ] **Step 8: Commit**

```bash
cd swifter
git add src/pages/CollaborationToolPage/collab/superdocBridge.ts src/pages/CollaborationToolPage/collab/superdocBridge.test.ts src/pages/CollaborationToolPage/components/IframeEditorPane.tsx
git commit -m "feat: forward auth token + colon-free collab room to superdoc iframe"
```

---

### Task 4: APP — accept `token` in the init payload

**Files:**
- Modify: `superdoc-swiftpro/src/bridge.ts` (`SuperdocInitPayload`, `parseHostMessage`)
- Modify: `superdoc-swiftpro/src/bridge.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `superdoc-swiftpro/src/bridge.test.ts`:
```ts
import { parseHostMessage } from "./bridge";

describe("parseHostMessage token", () => {
  const hostOrigin = "https://app.swiftpro.tech";
  const validData = {
    type: "superdoc:init",
    payload: {
      docBytes: new ArrayBuffer(8),
      fileName: "a.docx",
      fileType: "docx",
      documentMode: "editing",
      user: { name: "A", email: "a@b.c" },
      roomId: "room123-superdoc",
      wsUrl: "wss://api.swiftpro.tech/api/v1/dev/contract",
      token: "jwt-abc",
    },
  };

  it("returns the token when present", () => {
    const ev = { origin: hostOrigin, data: validData } as MessageEvent;
    expect(parseHostMessage(ev, hostOrigin)?.payload.token).toBe("jwt-abc");
  });

  it("rejects when token is missing", () => {
    const { token: _omit, ...noToken } = validData.payload;
    const ev = { origin: hostOrigin, data: { type: "superdoc:init", payload: noToken } } as MessageEvent;
    expect(parseHostMessage(ev, hostOrigin)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/bridge.test.ts`
Expected: FAIL — token not on the returned payload / not validated.

- [ ] **Step 3: Implement — add `token` to `SuperdocInitPayload`**

In `superdoc-swiftpro/src/bridge.ts`, update `SuperdocInitPayload` (lines 28-42): fix the roomId comment and add `token`:
```ts
export interface SuperdocInitPayload {
  /** The .docx bytes, fetched by the host and transferred to us (no auth/CORS needed here). */
  docBytes: ArrayBuffer;
  fileName: string;
  fileType: string;
  documentMode: DocumentMode;
  user: { name: string; email: string };
  /**
   * y-websocket room. ⚠️ ALREADY namespaced by the host as `<baseRoom>-superdoc`
   * — use verbatim. Do NOT append or strip the suffix.
   */
  roomId: string;
  /** WebSocket URL of the shared Yjs collab server (e.g. wss://api.swiftpro.tech/api/v1/dev/contract). */
  wsUrl: string;
  /** JWT for the WS handshake — sent via the `Sec-WebSocket-Protocol` subprotocol. */
  token: string;
}
```

- [ ] **Step 4: Implement — validate + return `token` in `parseHostMessage`**

In `parseHostMessage`, after the `wsUrl` check (line 92) add:
```ts
  if (typeof payload.token !== "string" || payload.token.length === 0) return null;
```
and in the returned object (lines 100-111) add `token: payload.token,` after `wsUrl: payload.wsUrl,`.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/bridge.test.ts`
Expected: PASS (existing + 2 new). Note: if any existing test builds a payload without `token`, add `token: "t"` to those fixtures.

- [ ] **Step 6: Commit**

```bash
cd superdoc-swiftpro
git add src/bridge.ts src/bridge.test.ts
git commit -m "feat: accept auth token in the init payload"
```

---

## Phase 3 — Real-time collaboration in the editor app (APP)

### Task 5: APP — WS URL-rewrite + subprotocol auth (port of host polyfill)

**Files:**
- Create: `superdoc-swiftpro/src/collabSocket.ts`
- Create: `superdoc-swiftpro/src/collabSocket.test.ts`

Background: y-websocket builds the URL as `${wsUrl}/${room}`. The healthy backend serves `${base}/collab?doc=<room>` instead, with the JWT in the `Sec-WebSocket-Protocol` subprotocol. We port the host's logic (`useCollabProvider.makeAuthWebSocketClass`) so the iframe connects identically.

- [ ] **Step 1: Write the failing test**

`superdoc-swiftpro/src/collabSocket.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { collabSubprotocols, rewriteCollabUrl } from "./collabSocket";

describe("rewriteCollabUrl", () => {
  it("moves the room into ?doc= and points at the /collab endpoint", () => {
    const out = rewriteCollabUrl(
      "wss://api.swiftpro.tech/api/v1/dev/contract/room123-superdoc",
      "room123-superdoc",
    );
    const u = new URL(out);
    expect(u.pathname).toBe("/api/v1/dev/contract/collab");
    expect(u.searchParams.get("doc")).toBe("room123-superdoc");
  });

  it("does not duplicate the collab segment if already present", () => {
    const out = rewriteCollabUrl(
      "wss://api.swiftpro.tech/api/v1/dev/contract/collab/room123-superdoc",
      "room123-superdoc",
    );
    expect(new URL(out).pathname).toBe("/api/v1/dev/contract/collab");
  });

  it("returns the input unchanged when it is not parseable", () => {
    expect(rewriteCollabUrl("not a url", "room")).toBe("not a url");
  });
});

describe("collabSubprotocols", () => {
  it("uses the access_token subprotocol when a token is present", () => {
    expect(collabSubprotocols("jwt-abc", undefined)).toEqual(["access_token", "jwt-abc"]);
  });
  it("falls back to the given protocols when no token", () => {
    expect(collabSubprotocols(undefined, "x")).toBe("x");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/collabSocket.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`superdoc-swiftpro/src/collabSocket.ts`:
```ts
// Mirrors swifter's useCollabProvider.makeAuthWebSocketClass so this iframe's
// Yjs provider speaks the exact same protocol as the host's collab client:
//   • URL: y-websocket builds `${wsUrl}/${room}`; the backend instead serves
//     `${base}/collab?doc=<room>`. We rewrite to that shape.
//   • Auth: JWT via the `Sec-WebSocket-Protocol` subprotocol ["access_token", token].
// If you change this, change it there too.

/** Rewrite a y-websocket-built URL to the backend's `/collab?doc=<room>` shape. */
export function rewriteCollabUrl(raw: string, docName: string): string {
  try {
    const u = new URL(raw);
    const segments = u.pathname.split("/").filter(Boolean);
    const decodeSafe = (s: string) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    };
    if (segments.length > 0 && decodeSafe(segments[segments.length - 1]) === docName) {
      segments.pop();
    }
    if (segments.length === 0 || segments[segments.length - 1] !== "collab") {
      segments.push("collab");
    }
    u.pathname = "/" + segments.join("/");
    u.searchParams.set("doc", docName);
    return u.toString();
  } catch {
    return raw;
  }
}

/** The WS subprotocols: JWT smuggled as the access_token subprotocol. */
export function collabSubprotocols(
  token: string | undefined,
  fallback: string | string[] | undefined,
): string | string[] | undefined {
  return token ? ["access_token", token] : fallback;
}

/** A WebSocket subclass that applies the URL rewrite + auth subprotocol. Pass it
 *  to y-websocket as `WebSocketPolyfill`. */
export function makeAuthWebSocketClass(
  token: string | undefined,
  docName: string,
): typeof WebSocket {
  return class CollabAuthSocket extends WebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      const raw = typeof url === "string" ? url : url.toString();
      super(rewriteCollabUrl(raw, docName), collabSubprotocols(token, protocols));
    }
  } as unknown as typeof WebSocket;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/collabSocket.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd superdoc-swiftpro
git add src/collabSocket.ts src/collabSocket.test.ts
git commit -m "feat: port host WS url-rewrite + subprotocol auth"
```

---

### Task 6: APP — connect-or-fallback provider

**Files:**
- Create: `superdoc-swiftpro/src/collabProvider.ts`
- Create: `superdoc-swiftpro/src/collabProvider.test.ts`

Design: create `Y.Doc` + a provider; resolve `{ doc, provider }` once it syncs within `timeoutMs`; on timeout/error, destroy and resolve `null`. The provider factory is injected so the timeout/fallback logic is unit-testable without a server.

- [ ] **Step 1: Write the failing test**

`superdoc-swiftpro/src/collabProvider.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { connectWithTimeout } from "./collabProvider";

type Handler = (arg: boolean) => void;

function fakeProvider(opts: { syncAfterMs: number | null }) {
  const handlers: Record<string, Handler[]> = {};
  const provider = {
    on: (ev: string, cb: Handler) => {
      (handlers[ev] ??= []).push(cb);
    },
    destroy: vi.fn(),
    _emit: (ev: string, arg: boolean) => (handlers[ev] ?? []).forEach((h) => h(arg)),
  };
  if (opts.syncAfterMs !== null) {
    setTimeout(() => provider._emit("sync", true), opts.syncAfterMs);
  }
  return provider;
}

afterEach(() => vi.useRealTimers());

describe("connectWithTimeout", () => {
  it("resolves the handle when the provider syncs in time", async () => {
    vi.useFakeTimers();
    const provider = fakeProvider({ syncAfterMs: 100 });
    const promise = connectWithTimeout(
      { wsUrl: "wss://x/y", roomId: "r-superdoc", token: "t", timeoutMs: 1000 },
      { createProvider: () => provider as never },
    );
    await vi.advanceTimersByTimeAsync(150);
    const handle = await promise;
    expect(handle).not.toBeNull();
    expect(provider.destroy).not.toHaveBeenCalled();
  });

  it("resolves null and destroys the provider on timeout", async () => {
    vi.useFakeTimers();
    const provider = fakeProvider({ syncAfterMs: null });
    const promise = connectWithTimeout(
      { wsUrl: "wss://x/y", roomId: "r-superdoc", token: "t", timeoutMs: 1000 },
      { createProvider: () => provider as never },
    );
    await vi.advanceTimersByTimeAsync(1001);
    const handle = await promise;
    expect(handle).toBeNull();
    expect(provider.destroy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/collabProvider.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`superdoc-swiftpro/src/collabProvider.ts`:
```ts
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { makeAuthWebSocketClass } from "./collabSocket";

export interface CollabConnectConfig {
  wsUrl: string;
  roomId: string;
  token: string;
  /** Max time to wait for the first server sync before falling back. */
  timeoutMs: number;
}

/** A synced collaboration handle, ready to hand to SuperDoc's collaboration module. */
export interface CollabHandle {
  doc: Y.Doc;
  provider: WebsocketProvider;
}

/** Minimal provider shape we depend on (lets tests inject a fake). */
interface ProviderLike {
  on(event: "sync", cb: (isSynced: boolean) => void): void;
  on(event: "connection-error" | "connection-close", cb: (e: unknown) => void): void;
  destroy(): void;
}

interface Deps {
  createProvider: (wsUrl: string, room: string, doc: Y.Doc, token: string) => ProviderLike;
}

const defaultDeps: Deps = {
  createProvider: (wsUrl, room, doc, token) =>
    new WebsocketProvider(wsUrl, room, doc, {
      WebSocketPolyfill: makeAuthWebSocketClass(token, room),
    }) as unknown as ProviderLike,
};

/**
 * Connect a Yjs provider and resolve only once it has synced with the server,
 * within `timeoutMs`. On timeout or connection error, tears the provider down
 * and resolves `null` so the caller can render document-only. This is the
 * connect-or-fallback that keeps SuperDoc from hanging on an unreachable server.
 */
export function connectWithTimeout(
  config: CollabConnectConfig,
  deps: Deps = defaultDeps,
): Promise<CollabHandle | null> {
  return new Promise((resolve) => {
    const doc = new Y.Doc();
    const provider = deps.createProvider(config.wsUrl, config.roomId, doc, config.token);
    let settled = false;

    const timer = setTimeout(() => finish(false), config.timeoutMs);

    function finish(synced: boolean): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (synced) {
        resolve({ doc, provider: provider as unknown as WebsocketProvider });
      } else {
        provider.destroy();
        doc.destroy();
        resolve(null);
      }
    }

    provider.on("sync", (isSynced: boolean) => {
      if (isSynced) finish(true);
    });
    provider.on("connection-error", () => finish(false));
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/collabProvider.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd superdoc-swiftpro
git add src/collabProvider.ts src/collabProvider.test.ts
git commit -m "feat: connect-or-fallback collab provider with sync timeout"
```

---

### Task 7: APP — attach collaboration to SuperDoc when synced

**Files:**
- Modify: `superdoc-swiftpro/src/superdocOptions.ts`
- Modify: `superdoc-swiftpro/src/superdocOptions.test.ts`
- Modify: `superdoc-swiftpro/src/main.ts` (`handleInit`, message listener)

- [ ] **Step 1: Write the failing test**

Append to `superdoc-swiftpro/src/superdocOptions.test.ts`:
```ts
import * as Y from "yjs";
import { buildSuperdocOptions } from "./superdocOptions";

const payload = {
  docBytes: new ArrayBuffer(8),
  fileName: "a.docx",
  fileType: "docx",
  documentMode: "editing" as const,
  user: { name: "A", email: "a@b.c" },
  roomId: "r-superdoc",
  wsUrl: "wss://x/y",
  token: "t",
};
const handlers = {
  onReady: () => {},
  onPaginationUpdate: () => {},
  onEditorUpdate: () => {},
  onException: () => {},
  onContentError: () => {},
};

describe("buildSuperdocOptions collaboration", () => {
  it("omits modules.collaboration when no collab handle is given", () => {
    const opts = buildSuperdocOptions(payload, handlers) as Record<string, unknown>;
    expect(opts.modules).toBeUndefined();
  });

  it("adds modules.collaboration when a synced handle is given", () => {
    const doc = new Y.Doc();
    const provider = {} as never;
    const opts = buildSuperdocOptions(payload, handlers, { doc, provider }) as {
      modules?: { collaboration?: { ydoc: unknown; provider: unknown } };
    };
    expect(opts.modules?.collaboration?.ydoc).toBe(doc);
    expect(opts.modules?.collaboration?.provider).toBe(provider);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/superdocOptions.test.ts`
Expected: FAIL — `buildSuperdocOptions` takes only 2 args / no `modules`.

- [ ] **Step 3: Implement the collab arg**

Replace `superdoc-swiftpro/src/superdocOptions.ts` `buildSuperdocOptions` (lines 38-50) with:
```ts
import type { CollabHandle } from "./collabProvider";

// ...keep the existing imports, DOCX_MIME, and SuperdocHandlers interface above...

/**
 * Build the SuperDoc constructor options for an init payload.
 *
 * When `collab` is provided it is an **already-synced** Yjs handle (see
 * connectWithTimeout) — only then do we attach `modules.collaboration`, so
 * SuperDoc's `onReady` (which gates on collab sync) fires immediately. When
 * `collab` is `null` we render **document-only** from the transferred bytes
 * (graceful fallback for an unreachable server).
 */
export function buildSuperdocOptions(
  payload: SuperdocInit["payload"],
  handlers: SuperdocHandlers,
  collab?: CollabHandle | null,
) {
  return {
    selector: "#editor",
    toolbar: "#superdoc-toolbar",
    document: new Blob([payload.docBytes], { type: DOCX_MIME }),
    documentMode: payload.documentMode,
    user: payload.user,
    ...(collab ? { modules: { collaboration: { ydoc: collab.doc, provider: collab.provider } } } : {}),
    ...handlers,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd superdoc-swiftpro && pnpm exec vitest run src/superdocOptions.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire main.ts to connect-then-build**

In `superdoc-swiftpro/src/main.ts`:

(a) Add imports near the top (with the others):
```ts
import { connectWithTimeout } from "./collabProvider";
```

(b) Add a constant near `DOC_EDIT_DEBOUNCE_MS` (line 21):
```ts
/** Max wait for the collab server to sync before falling back to document-only. */
const COLLAB_SYNC_TIMEOUT_MS = 9000;
```

(c) Make `handleInit` async and connect first. Replace the function signature line `function handleInit(init: SuperdocInit): void {` with `async function handleInit(init: SuperdocInit): Promise<void> {`, and inside the `try` block replace the `new SuperDoc(buildSuperdocOptions(init.payload, {` line so the options call passes the collab handle. Concretely, insert before the `new SuperDoc(` call:
```ts
    // Connect-or-fallback: try to sync a provider first; only attach
    // collaboration to SuperDoc once synced, else render document-only.
    const collab = await connectWithTimeout({
      wsUrl: init.payload.wsUrl,
      roomId: init.payload.roomId,
      token: init.payload.token,
      timeoutMs: COLLAB_SYNC_TIMEOUT_MS,
    });
```
and change the options call from:
```ts
    new SuperDoc(
      buildSuperdocOptions(init.payload, {
        // ...handlers...
      }),
    );
```
to pass `collab` as the third argument:
```ts
    new SuperDoc(
      buildSuperdocOptions(
        init.payload,
        {
          // ...handlers unchanged...
        },
        collab,
      ),
    );
```

(d) Update the inbound listener (lines 139-142) to not drop the promise:
```ts
window.addEventListener("message", (event) => {
  const init = parseHostMessage(event, HOST_ORIGIN);
  if (init) void handleInit(init);
});
```

- [ ] **Step 6: Verify typecheck + build + full test suite**

Run: `cd superdoc-swiftpro && pnpm typecheck && pnpm build && pnpm test`
Expected: typecheck clean; build exits 0; all vitest files pass.

- [ ] **Step 7: Commit**

```bash
cd superdoc-swiftpro
git add src/superdocOptions.ts src/superdocOptions.test.ts src/main.ts
git commit -m "feat: attach SuperDoc collaboration once provider has synced"
```

---

## Phase 4 — Deploy config, headers, AGPL, env docs

### Task 8: APP — Amplify build spec + response headers

**Files:**
- Create: `superdoc-swiftpro/amplify.yml`
- Create: `superdoc-swiftpro/customHttp.yml`

- [ ] **Step 1: Write `amplify.yml`**

`superdoc-swiftpro/amplify.yml`:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm@10.21.0
        - pnpm install --frozen-lockfile
    build:
      commands:
        - pnpm build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - ~/.pnpm-store/**/*
```

- [ ] **Step 2: Write `customHttp.yml`**

`superdoc-swiftpro/customHttp.yml`:
```yaml
# AWS Amplify custom response headers.
# The editor is AGPL code served in a cross-origin iframe. Only the SwiftPro
# host may frame it. `frame-ancestors` can ONLY be set via HTTP header (not a
# <meta> tag), which is why this file exists.
customHeaders:
  - pattern: '**'
    headers:
      - key: 'Content-Security-Policy'
        value: "frame-ancestors https://app.swiftpro.tech;"
      - key: 'X-Content-Type-Options'
        value: 'nosniff'
      - key: 'Referrer-Policy'
        value: 'strict-origin-when-cross-origin'
```

- [ ] **Step 3: Verify the build still produces dist**

Run: `cd superdoc-swiftpro && pnpm build`
Expected: exits 0; `dist/index.html` present. (Header behavior is verified at deploy; the file is declarative.)

- [ ] **Step 4: Commit**

```bash
cd superdoc-swiftpro
git add amplify.yml customHttp.yml
git commit -m "build: add Amplify build spec + frame-ancestors response headers"
```

---

### Task 9: APP — AGPL §13 source link + env docs

**Files:**
- Modify: `superdoc-swiftpro/index.html`
- Modify: `superdoc-swiftpro/src/style.css`
- Modify: `superdoc-swiftpro/.env.example`
- Modify: `superdoc-swiftpro/README.md`

- [ ] **Step 1: Add the source link to `index.html`**

In `superdoc-swiftpro/index.html`, inside `<body>` after the `<div id="editor"></div>` line, add:
```html
    <!-- AGPL §13: this app serves AGPL-licensed SuperDoc over a network, so it
         must offer its Corresponding Source to users who interact with it. -->
    <a
      class="agpl-source-link"
      href="https://github.com/<org>/superdoc-swiftpro"
      target="_blank"
      rel="noopener noreferrer"
      >Source (AGPL-3.0)</a
    >
```
(Replace `<org>` with the real GitHub org/owner at deploy time.)

- [ ] **Step 2: Style it unobtrusively in `src/style.css`**

Append to `superdoc-swiftpro/src/style.css`:
```css
/* AGPL §13 source-offer link — present but out of the way. */
.agpl-source-link {
  position: fixed;
  right: 8px;
  bottom: 6px;
  z-index: 2147483000;
  font: 11px/1 system-ui, sans-serif;
  color: #94a3b8;
  text-decoration: none;
  opacity: 0.7;
}
.agpl-source-link:hover {
  opacity: 1;
  text-decoration: underline;
}
```

- [ ] **Step 3: Document env vars**

Replace `superdoc-swiftpro/.env.example` with:
```bash
# Origin of the SwiftPro host app that embeds this editor in an <iframe>.
# This app rejects any inbound postMessage whose event.origin != this value,
# and targets every outbound message at exactly this origin (never "*").
#
# MUST be the mirror of the host's VITE_SUPERDOC_APP_URL: the host points there
# at THIS app's origin, and this app points back at the host's origin.
#   dev:  http://localhost:5173
#   prod: https://app.swiftpro.tech   (set in Amplify; a missing value in a prod
#                                       build is fatal — see src/env.ts)
VITE_HOST_ORIGIN=http://localhost:5173

# NOTE: wsUrl, roomId, and the auth token are NOT env — they arrive at runtime
# in the host's `superdoc:init` postMessage payload.
```

- [ ] **Step 4: Add a deploy note to `README.md`**

Append a short section to `superdoc-swiftpro/README.md`:
```markdown
## Production deploy (AWS Amplify)

1. Create a new Amplify app pointed at this repo/branch; build spec is `amplify.yml`.
2. Set the env var `VITE_HOST_ORIGIN` to the host origin (e.g. `https://app.swiftpro.tech`).
   A missing value in a production build fails the app loudly at startup.
3. Response headers (incl. `Content-Security-Policy: frame-ancestors <host>`) come
   from `customHttp.yml` — update the host origin there to match.
4. On the host (swifter), set `VITE_SUPERDOC_APP_URL` to this app's origin
   (e.g. `https://editor.swiftpro.tech`). The two values are a matched pair.
```

- [ ] **Step 5: Verify build**

Run: `cd superdoc-swiftpro && pnpm build`
Expected: exits 0; `dist/index.html` contains the `agpl-source-link` markup.

- [ ] **Step 6: Commit**

```bash
cd superdoc-swiftpro
git add index.html src/style.css .env.example README.md
git commit -m "docs: AGPL source link + production env documentation"
```

---

### Task 10: HOST — CSP headers + env docs

**Files:**
- Create: `swifter/customHttp.yml`
- Create: `swifter/.env.example`
- Modify: `swifter/.gitignore`

- [ ] **Step 1: Write `customHttp.yml`**

`swifter/customHttp.yml`:
```yaml
# AWS Amplify custom response headers for the SwiftPro host.
# Allows embedding the SuperDoc editor iframe and connecting to the API/WS.
# connect-src includes the API origin (REST + the Yjs collab WebSocket) so the
# host's existing collab/versions traffic is not blocked; frame-src whitelists
# the editor app so the collaboration editor renders.
customHeaders:
  - pattern: '**'
    headers:
      - key: 'Content-Security-Policy'
        value: >-
          frame-src https://editor.swiftpro.tech;
          connect-src 'self' https://api.swiftpro.tech wss://api.swiftpro.tech;
      - key: 'X-Content-Type-Options'
        value: 'nosniff'
      - key: 'Referrer-Policy'
        value: 'strict-origin-when-cross-origin'
```

> NOTE for the executor: this CSP is intentionally minimal (only the two directives the iframe + collab need). Before finalizing, load the deployed/preview host with DevTools open and confirm **no new CSP violations** in the console; if an existing call is blocked (e.g. a CDN/font/image host), widen the relevant directive (`img-src`, `font-src`, `script-src`, …) to match what the app already loads. Do not add a directive that isn't needed.

- [ ] **Step 2: Write `.env.example`**

`swifter/.env.example`:
```bash
# Yjs collaboration WebSocket server (used by the collab editor + versions).
VITE_WS_URL=wss://api.swiftpro.tech/api/v1/dev/contract

# Origin of the AGPL SuperDoc editor app embedded in the collaboration tool.
# Matched pair with the editor app's VITE_HOST_ORIGIN. A missing value in a
# production build is fatal (see collab/superdocBridge.ts resolveSuperdocAppUrl).
#   dev:  http://localhost:5174
#   prod: https://editor.swiftpro.tech
VITE_SUPERDOC_APP_URL=http://localhost:5174
```

- [ ] **Step 3: Un-ignore `.env.example`**

In `swifter/.gitignore`, find the line that ignores env files (e.g. `.env*` or `.env.local`) and add immediately below it:
```gitignore
!.env.example
```

- [ ] **Step 4: Verify the file is now trackable**

Run: `cd swifter && git add .env.example customHttp.yml .gitignore && git status --short`
Expected: `.env.example`, `customHttp.yml`, `.gitignore` all staged (not ignored).

- [ ] **Step 5: Commit**

```bash
cd swifter
git commit -m "build: add host CSP headers + tracked .env.example"
```

---

## Phase 5 — Production loading UX (HOST)

### Task 11: HOST — document-skeleton loader

**Files:**
- Create: `swifter/src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.tsx`
- Create: `swifter/src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.test.tsx`
- Modify: `swifter/src/pages/CollaborationToolPage/components/IframeEditorPane.tsx`

Design: a centered white page-sheet with shimmering placeholder lines (previews the rendered doc), a quiet three-step status line (Connecting → Preparing document & live collaboration → Ready), a crossfade out on ready, and a friendly error card. The collab-sync happens inside the iframe during the host's `rendering` phase, so the `rendering` label names it ("Preparing the document and live collaboration…"). Respects dark mode + `prefers-reduced-motion`.

- [ ] **Step 1: Write the failing test**

`swifter/src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EditorLoadingSkeleton from "./EditorLoadingSkeleton";

describe("EditorLoadingSkeleton", () => {
  it("shows the connecting status while connecting", () => {
    render(<EditorLoadingSkeleton phase="connecting" errorMsg="" />);
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    expect(screen.getByTestId("editor-skeleton-page")).toBeInTheDocument();
  });

  it("names live collaboration during the rendering phase", () => {
    render(<EditorLoadingSkeleton phase="rendering" errorMsg="" />);
    expect(screen.getByText(/live collaboration/i)).toBeInTheDocument();
  });

  it("renders a friendly error card on error", () => {
    render(<EditorLoadingSkeleton phase="error" errorMsg="Couldn't download the document (HTTP 403)." />);
    expect(screen.getByRole("alert")).toHaveTextContent("HTTP 403");
    expect(screen.queryByTestId("editor-skeleton-page")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd swifter && pnpm exec vitest run src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

`swifter/src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.tsx`:
```tsx
import React from "react";

// Loading phases shared with IframeEditorPane. `ready` never renders this
// component (the pane hides it), but it's accepted for prop-type symmetry.
export type EditorLoadPhase = "connecting" | "fetching" | "rendering" | "ready" | "error";

type Props = { phase: EditorLoadPhase; errorMsg: string };

const STEPS: { key: EditorLoadPhase; label: string }[] = [
  { key: "connecting", label: "Connecting to the editor" },
  { key: "fetching", label: "Downloading the document" },
  { key: "rendering", label: "Preparing the document and live collaboration" },
];

const ORDER: Record<EditorLoadPhase, number> = {
  connecting: 0,
  fetching: 1,
  rendering: 2,
  ready: 3,
  error: -1,
};

const SkeletonLine: React.FC<{ w: string }> = ({ w }) => (
  <div
    className="h-3 rounded bg-slate-200 animate-pulse motion-reduce:animate-none dark:bg-slate-700"
    style={{ width: w }}
  />
);

const EditorLoadingSkeleton: React.FC<Props> = ({ phase, errorMsg }) => {
  if (phase === "error") {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div
          role="alert"
          className="max-w-md rounded-lg border border-rose-200 bg-rose-50 p-5 text-center text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <p className="font-medium">We couldn’t open the document</p>
          <p className="mt-1 opacity-90">{errorMsg || "Could not load the editor."}</p>
        </div>
      </div>
    );
  }

  const active = ORDER[phase];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start overflow-hidden bg-slate-100 px-4 pt-10 dark:bg-slate-900">
      {/* Page-sheet skeleton — previews the real white document surface. */}
      <div
        data-testid="editor-skeleton-page"
        className="w-full max-w-[816px] rounded-sm bg-white p-[72px] shadow-lg dark:bg-slate-800"
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <SkeletonLine w="55%" />
          <SkeletonLine w="35%" />
        </div>
        <div className="flex flex-col gap-3">
          {["100%", "96%", "98%", "60%", "100%", "92%", "100%", "48%"].map((w, i) => (
            <SkeletonLine key={i} w={w} />
          ))}
        </div>
      </div>

      {/* Quiet status line. */}
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500 motion-reduce:animate-none dark:border-slate-600 dark:border-t-slate-300" />
        <span>
          {(STEPS.find((s) => s.key === phase) ?? STEPS[0]).label}…
        </span>
      </div>

      {/* Step dots. */}
      <div className="mt-3 flex gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={
              "h-1.5 w-6 rounded-full transition-colors " +
              (i <= active
                ? "bg-slate-400 dark:bg-slate-400"
                : "bg-slate-200 dark:bg-slate-700")
            }
          />
        ))}
      </div>
    </div>
  );
};

export default EditorLoadingSkeleton;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd swifter && pnpm exec vitest run src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Use the skeleton in IframeEditorPane (crossfade)**

In `IframeEditorPane.tsx`:

(a) Add the import near the top:
```ts
import EditorLoadingSkeleton from "./EditorLoadingSkeleton";
```

(b) Delete the `overlayText` block (lines 228-235).

(c) Replace the `return (...)` body (lines 240-260) with a crossfaded overlay:
```tsx
  return (
    <div className="relative h-full w-full overflow-hidden bg-white dark:bg-slate-950">
      {phase !== "ready" && (
        <div
          className="absolute inset-0 z-10 transition-opacity duration-300"
          aria-busy={phase !== "error"}
        >
          <EditorLoadingSkeleton phase={phase} errorMsg={errorMsg} />
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="SuperDoc editor"
        src={SUPERDOC_APP_URL}
        className={
          "h-full w-full border-0 transition-opacity duration-300 " +
          (phase === "ready" ? "opacity-100" : "opacity-0")
        }
        // The framed app is untrusted AGPL code on another origin. Sandbox it,
        // but KEEP allow-same-origin: without it the frame gets an opaque
        // origin, which (a) makes its postMessages arrive as origin "null" so
        // our origin check rejects them, and (b) blocks SuperDoc's IndexedDB
        // persistence. Cross-origin SOP still prevents it reaching SwiftPro.
        sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
      />
    </div>
  );
```

- [ ] **Step 6: Run the existing pane test to check for regressions**

Run: `cd swifter && pnpm exec vitest run src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx`
Expected: PASS. If a test asserted the old literal "Loading editor…" text, update that assertion to query `getByTestId("editor-skeleton-page")` (connecting/fetching/rendering) or the `role="alert"` card (error) instead.

- [ ] **Step 7: Typecheck**

Run: `cd swifter && pnpm exec tsc -b --noEmit`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
cd swifter
git add src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.tsx src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.test.tsx src/pages/CollaborationToolPage/components/IframeEditorPane.tsx
git commit -m "feat: document-skeleton loading UX for the collab editor"
```

---

## Phase 6 — Verification

### Task 12: Live WS handshake probe + full gates

**Files:**
- Create: `superdoc-swiftpro/scripts/ws-probe.mjs`

- [ ] **Step 1: Write the probe script**

`superdoc-swiftpro/scripts/ws-probe.mjs`:
```js
// Manual prod-readiness probe: confirms the chosen room name + URL shape
// upgrade against the live collab server (no 502), using the same /collab?doc=
// + access_token subprotocol the host client uses.
//
// Usage:
//   node scripts/ws-probe.mjs "wss://api.swiftpro.tech/api/v1/dev/contract" "<baseRoom>-superdoc" "<jwt>"
import WebSocket from "ws";

const [, , base, room, token] = process.argv;
if (!base || !room) {
  console.error('Usage: node scripts/ws-probe.mjs "<wsBase>" "<room>" "<jwt?>"');
  process.exit(2);
}
const url = new URL(base.replace(/\/+$/, "") + "/collab");
url.searchParams.set("doc", room);
const protocols = token ? ["access_token", token] : [];
console.log("Connecting:", url.toString());

const ws = new WebSocket(url.toString(), protocols);
const timer = setTimeout(() => {
  console.error("TIMEOUT — no open within 10s");
  process.exit(1);
}, 10000);
ws.on("open", () => {
  clearTimeout(timer);
  console.log("OK — socket upgraded (no 502). Room routes correctly.");
  ws.close();
  process.exit(0);
});
ws.on("unexpected-response", (_req, res) => {
  clearTimeout(timer);
  console.error(`HTTP ${res.statusCode} — server rejected the upgrade (e.g. 502).`);
  process.exit(1);
});
ws.on("error", (err) => {
  clearTimeout(timer);
  console.error("ERROR:", err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run the probe (manual, needs network + a real JWT)**

Run (substitute a valid JWT and a real base room id):
```bash
cd superdoc-swiftpro
node scripts/ws-probe.mjs "wss://api.swiftpro.tech/api/v1/dev/contract" "demo-room-superdoc" "<paste-jwt>"
```
Expected: `OK — socket upgraded (no 502). Room routes correctly.`
If it prints `HTTP 502`, **stop and escalate to the user** (backend owner) — do not guess at server routing. (`ws` is already an indirect dep via y-websocket; if `node` can't resolve it, run `pnpm add -D ws` first.)

- [ ] **Step 3: Commit the probe**

```bash
cd superdoc-swiftpro
git add scripts/ws-probe.mjs
git commit -m "chore: live WS handshake probe for collab room routing"
```

- [ ] **Step 4: Full gate — APP**

Run: `cd superdoc-swiftpro && pnpm typecheck && pnpm build && pnpm test`
Expected: typecheck clean; build exits 0 (`dist/index.html` present); all vitest files green.

- [ ] **Step 5: Full gate — HOST**

Run: `cd swifter && pnpm exec tsc -b --noEmit && pnpm build`
Expected: typecheck clean; build exits 0.
Then run the SuperDoc-touching unit tests:
```bash
cd swifter
pnpm exec vitest run src/pages/CollaborationToolPage/collab/superdocBridge.test.ts src/pages/CollaborationToolPage/components/IframeEditorPane.test.tsx src/pages/CollaborationToolPage/components/EditorLoadingSkeleton.test.tsx
```
Expected: green. (The documented `.claude/worktrees` vitest-exclude typo and unrelated Yoopta `EditorPanelImport.test.tsx` failures are pre-existing and out of scope — do not let them mask a real regression in the files above.)

- [ ] **Step 6: Browser QA — loading UX + live render**

Use `/browser-qa` (per the project's confirmed approach) with both dev servers running (`pnpm exec vite --host` in each; host `:5173`, app `:5174` — keep `localhost`, not `127.0.0.1`, to match `VITE_HOST_ORIGIN`):
1. Open the collaboration tool on a docx; confirm the **skeleton page** shows (not raw text), then **crossfades** to the rendered document.
2. Confirm a second browser context joining the same room sees live edits (real-time collab), and that with the WS blocked the editor still renders document-only within ~9s (fallback).
Capture screenshots to `.qa/`.

---

## Self-Review

**Spec coverage:**
- REQ-A1 Amplify spec → Task 8. REQ-A2 fail-loud host origin → Task 1. REQ-A3 headers → Task 8. REQ-A4 AGPL link → Task 9. REQ-A5 env docs → Task 9.
- REQ-B1 fail-loud app url → Task 2. REQ-B2 CSP/headers → Task 10. REQ-B3 tracked `.env.example` → Task 10. REQ-B4 cruft sweep → console.* already DEV-guarded (verified during planning); no editor removal — covered by leaving TipTap path untouched. *(No code change needed beyond confirmation; noted here so it isn't mistaken for a gap.)*
- REQ-C1 connect-or-fallback → Tasks 6 + 7. REQ-C2 room-name fix → Task 3 (+ verified live in Task 12). REQ-C3 auth parity → Tasks 4 + 5. REQ-C4 bridge intact → existing tests re-run in Task 12 (contract unchanged except additive `token`).
- REQ-D1 skeleton → Task 11. REQ-D2 phase + collab awareness → Task 11 (rendering label names live collaboration). REQ-D3 crossfade + error → Task 11. REQ-D4 a11y (dark mode + reduced-motion) → Task 11 (`dark:` + `motion-reduce:animate-none`).
- Verification gate → Task 12.

**Placeholder scan:** prod origins (`app.swiftpro.tech`/`editor.swiftpro.tech`) and `<org>` are deploy-time substitutions, called out explicitly — not plan placeholders. No TBD/TODO/"add error handling" left.

**Type consistency:** `buildInitPayload` payload now has `token` (Task 3) ↔ consumed by `parseHostMessage` (Task 4). `CollabHandle { doc, provider }` (Task 6) ↔ used by `buildSuperdocOptions(payload, handlers, collab)` (Task 7) ↔ produced by `connectWithTimeout` (Task 6) ↔ called in `main.ts` (Task 7). `EditorLoadPhase` (Task 11) is a superset matching `Phase` in IframeEditorPane. `makeAuthWebSocketClass(token, room)` (Task 5) ↔ used by `connectWithTimeout` default deps (Task 6).

**Note on REQ-B4:** the only action is verification (console.* already guarded; TipTap fallback intentionally retained) — if the executor finds a debug-only UI element on the branch, remove it in a small dedicated commit; otherwise no change.
