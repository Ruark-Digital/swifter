---
date: 2026-06-05
topic: superdoc-iframe-editor
status: approved-design
branch: feat-collab-superdoc-editor
supersedes: .planning/quick/260603-gdocs-editor/01-SPEC.md (TipTap direct-build, engine-locked)
---

# Design — SuperDoc editor via isolated iframe

## Goal

Replace the custom TipTap document editor in
`src/pages/CollaborationToolPage/index.tsx` with the SuperDoc editor, for
high-fidelity DOCX rendering/editing — **without** importing SuperDoc into the
proprietary SwiftPro bundle.

## Licensing constraint (the reason for the architecture)

`@harbour-enterprises/superdoc` is **AGPL-3.0** (verified v1.38.0 on
2026-06-05 via `npm view`). Importing it directly into SwiftPro would make the
entire app a derivative work under AGPL's network-use copyleft. The user holds
**no commercial license** and wants to keep SwiftPro proprietary.

**Resolution:** SuperDoc runs as a **separate AGPL program** in an `<iframe>`.
The only channel between SwiftPro and SuperDoc is `postMessage` (arms-length
IPC, no linking). AGPL obligations stay contained to the separate repo, which
is just SuperDoc + glue.

This reverses the engine-locked decision in
`.planning/quick/260603-gdocs-editor/01-SPEC.md` (which ruled SuperDoc out and
locked TipTap). That SPEC is superseded by this design for the editor engine;
the existing TipTap/Yoopta panels are retained only as escape hatches.

## Architecture

```
┌──────────────────── swifter (proprietary, this repo) ───────────────────────┐
│  CollaborationToolPage/index.tsx                                            │
│    └─ <IframeEditorPane>   ← NEW, default editor                            │
│         • renders <iframe src={VITE_SUPERDOC_APP_URL}>                       │
│         • postMessage host bridge (origin-checked)                          │
│         • host fetches the .docx (axios auth) → sends bytes to iframe        │
│         • onEditorReady(null) → sidebar degrades gracefully                 │
└──────────────────────────────│ postMessage (no import) │────────────────────┘
                                ▼
┌──────────── swifter-superdoc-app (SEPARATE REPO, AGPL-3.0 — spec only) ─────┐
│  Vite + SuperDoc SDK                                                        │
│    • on `superdoc:init` → new SuperDoc({ document: Blob, documentMode,user})│
│    • y-websocket WebsocketProvider → VITE_WS_URL, room `${roomId}:superdoc` │
│    • posts back ready / editor-ready / doc-edit / error                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Scope

### In scope (this repo, this MVP)
- `src/pages/CollaborationToolPage/components/IframeEditorPane.tsx` — NEW.
  Owns the iframe element and the postMessage host bridge.
- `src/pages/CollaborationToolPage/index.tsx` — make SuperDoc the **default**
  editor; keep `?editor=tiptap` and `?editor=yoopta` as fallbacks.
- Host-side `.docx` fetch → `ArrayBuffer`, sent to the iframe (transferable).
- New env var `VITE_SUPERDOC_APP_URL` (iframe origin) — added to `.env`
  example / config the same way `VITE_WS_URL` is.
- Graceful sidebar degradation: `onEditorReady(null)` so AI-redline and
  version handlers no-op (they already guard `if (!adapter) return`); backend
  comments keep working (they don't use the adapter).

### Out of scope (this MVP)
- Creating / deploying the separate AGPL repo (spec documents its contract).
- AI-redline suggestions, version snapshot/restore, anchored comments **across
  the bridge** — sidebar degrades, does not break. Ported in a later phase.
- DOCX export from SuperDoc back to the BE.
- Sharing collaboration state with the legacy custom-editor Yjs rooms (schema
  incompatible — SuperDoc uses its own namespaced room).
- The custom TipTap editor itself — left intact behind `?editor=tiptap`.

## Key decisions

### D1 — Host fetches the .docx, sends bytes (APPROVED)
The host already has the axios auth context to GET `sourceUrl` from
`api.swiftpro.tech`. The iframe is a different origin and would hit CORS + 401
fetching it itself (documented `net::ERR_FAILED` in prior QA). So the host
fetches the `.docx`, gets an `ArrayBuffer`, and `postMessage`s it (transferable)
to the iframe, which builds a `Blob` and feeds `new SuperDoc({ document: blob })`.
No auth/CORS logic inside the AGPL app.

### D2 — Namespaced `:superdoc` collaboration room (APPROVED)
SuperDoc's OOXML-faithful document model is incompatible with the existing
y-prosemirror schema in current Yjs rooms. SuperDoc clients therefore
collaborate in a fresh room `${roomId}:superdoc` on the **same** `VITE_WS_URL`
y-websocket server (a `y-websocket` `WebsocketProvider` passed into SuperDoc's
provider-agnostic `modules.collaboration: { ydoc, provider }`). No shared
history with the editor being replaced — expected.

## postMessage protocol (shared contract — both repos implement)

All messages are objects `{ type, payload }`. The host validates
`event.origin === new URL(VITE_SUPERDOC_APP_URL).origin` on every inbound
message; the iframe validates the host origin symmetrically.

| Direction | `type` | `payload` |
|---|---|---|
| iframe → host | `superdoc:ready` | — (iframe booted; ready for init) |
| host → iframe | `superdoc:init` | `{ docBytes: ArrayBuffer, fileName, fileType, documentMode: 'editing'\|'viewing'\|'suggesting', user: { name, email }, roomId, wsUrl }` |
| iframe → host | `superdoc:editor-ready` | `{ pageCount?: number }` |
| iframe → host | `superdoc:doc-edit` | — (host MAY re-emit `ct-doc-edit`) |
| iframe → host | `superdoc:error` | `{ message: string }` |

Handshake: iframe loads → posts `superdoc:ready` → host responds with
`superdoc:init` (including the fetched bytes) → iframe inits SuperDoc → posts
`superdoc:editor-ready`. The host shows a lightweight loading state until
`editor-ready` (or surfaces a toast on `superdoc:error`).

## Document mode

Derived from existing app logic where available (e.g. draft vs finalized →
`'editing'` vs `'viewing'`). MVP default: `'editing'`. Wiring the precise
mode rules is a thin follow-up; not gating.

## Verification

- **Build/typecheck:** `pnpm exec tsc -b --noEmit` passes (no `pnpm typecheck`
  script in this project).
- **Manual smoke (host side):** With `VITE_SUPERDOC_APP_URL` pointed at a local
  SuperDoc app stub, opening the CollaborationToolPage renders the iframe; the
  host posts `superdoc:init` with the fetched bytes; a stub that echoes
  `superdoc:editor-ready` clears the loading state. `?editor=tiptap` still loads
  the old panel.
- **Origin safety:** messages from any origin other than
  `VITE_SUPERDOC_APP_URL` are ignored.
- Full end-to-end fidelity verification requires the separate repo (out of
  scope here) — noted, not silently skipped.

## Separate repo contract (spec only — not built this session)

`swifter-superdoc-app`: Vite + React (or vanilla) app that
1. on load posts `superdoc:ready`;
2. on `superdoc:init`, builds a `Blob` from `docBytes` and calls
   `new SuperDoc({ selector, document: blob, documentMode, user, modules: { collaboration: { ydoc, provider } } })`
   with a `y-websocket` provider to `wsUrl` room `${roomId}:superdoc`;
3. posts `superdoc:editor-ready` on SuperDoc's ready event, `superdoc:error` on
   failure, `superdoc:doc-edit` on document change;
4. imports `superdoc` + `superdoc/style.css`; is licensed AGPL-3.0 with its
   source published.

## Risks

- **SuperDoc package name:** docs show `import { SuperDoc } from 'superdoc'`;
  npm registry name is `@harbour-enterprises/superdoc`. The separate repo
  resolves the exact specifier — does not affect the host side.
- **y-websocket vs Hocuspocus:** SuperDoc docs list Hocuspocus/YHub/Liveblocks
  examples but the API is provider-agnostic (`{ ydoc, provider }`). The
  separate repo must confirm a plain `y-websocket` `WebsocketProvider` drives
  SuperDoc correctly; if not, the existing server may need a Hocuspocus shim.
  Host side is unaffected (it only passes `wsUrl` + `roomId`).
