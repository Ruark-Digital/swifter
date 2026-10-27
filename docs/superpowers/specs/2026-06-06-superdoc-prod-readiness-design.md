# SuperDoc Collab Editor — Production-Readiness Design

**Date:** 2026-06-06
**Status:** Approved (design) — pending spec review → writing-plans
**Branches:** `feat-collab-superdoc-editor` (swifter / host) · `feat/superdoc-iframe-app` (superdoc-swiftpro / editor app)
**Author:** brainstorming session 2026-06-06

---

## 1. Overview

Two coupled Vite apps make up the SuperDoc collaboration editor:

- **swifter** (host) — the SwiftPro SPA. Deploys to an **existing AWS Amplify app**. Embeds the editor in a cross-origin `<iframe>` (`IframeEditorPane`) and brokers a `postMessage` contract via `collab/superdocBridge.ts`. SuperDoc is the **default** editor; TipTap/Yoopta remain reachable via `?editor=tiptap` / `?editor=yoopta`.
- **superdoc-swiftpro** (editor app) — an **AGPL-3.0** standalone Vite app wrapping `@harbour-enterprises/superdoc@1.38.0`. Will deploy to its **own, new Amplify app** on a subdomain (e.g. `editor.swiftpro.tech`). Isolated cross-origin so AGPL copyleft never reaches the host bundle.

This work makes both repos **production-ready so that, on deploy, the iframe handshake and real-time collaboration connect first-try** — without merging to `main`/`dev` and without pressing deploy. Work stays on the two feature branches above.

## 2. Goals

1. Both repos build cleanly and are deploy-configured for Amplify (the editor app currently has **no** deploy config).
2. The cross-origin handshake connects **first-try** in production — no silent localhost fallbacks, no CSP blocks, no service-worker poisoning.
3. **Real-time collaboration is enabled** for SuperDoc with a connect-or-fallback that never hangs the editor blank.
4. A **production-grade loading UX** replaces the current text overlays.
5. AGPL §13 network-use compliance for the editor app.
6. Verified: typecheck + build + unit tests green on **both** repos, plus a live WS handshake check.

## 3. Non-goals (explicit)

- Merging `feat-collab-superdoc-editor` → `main`/`dev`, or pressing Amplify deploy.
- **Any server-side change.** The Yjs WebSocket backend (`wss://api.swiftpro.tech/...`) is **healthy and owned elsewhere**; this work is **client-only**. The historical 502 was caused by a malformed SuperDoc room name (colon + `.docx` in the URL path), not a dead server.
- Removing the TipTap/docx-preview fallback editor (kept as a safety net behind `?editor=tiptap`).
- Comments slice 3 (anchored-to-highlight comments) — still deferred.

## 4. The cross-origin contract

Two build-time env values must be a matched pair, or the handshake silently fails:

| Host (swifter) — build env | Editor (superdoc-swiftpro) — build env |
|---|---|
| `VITE_SUPERDOC_APP_URL = https://editor.swiftpro.tech` → iframe `src` + postMessage target + inbound origin-check | `VITE_HOST_ORIGIN = https://app.swiftpro.tech` → inbound origin-gate + outbound postMessage target |

Runtime collaboration parameters (`wsUrl`, `roomId`, `token`) are **not** env — they arrive in the `superdoc:init` postMessage payload from the host. That contract is unchanged.

## 5. Workstreams & Requirements

Requirements are written to be **falsifiable** (a reviewer/executor can prove each pass/fail).

### Workstream A — Editor app (superdoc-swiftpro) config & compliance

- **REQ-A1 — Amplify build spec.** Add `amplify.yml` mirroring swifter's pipeline (pnpm install + `pnpm build` (`tsc && vite build`), artifacts `dist`, cache `node_modules` + pnpm store). *Pass:* file exists, `pnpm build` produces `dist/index.html`.
- **REQ-A2 — Fail-loud host origin.** In a **production** build (`import.meta.env.PROD`), the app throws a clear, actionable error at startup if `VITE_HOST_ORIGIN` is unset, instead of silently defaulting to `http://localhost:5173`. Dev behavior (localhost default) unchanged. *Pass:* prod build with no `VITE_HOST_ORIGIN` surfaces a visible error; dev still boots.
- **REQ-A3 — Response headers.** Add `customHttp.yml` with `Content-Security-Policy: frame-ancestors https://app.swiftpro.tech` (only the host may frame the AGPL app) plus `X-Content-Type-Options: nosniff` and a sane `Referrer-Policy`. *Pass:* file present, frame-ancestors names the host origin.
- **REQ-A4 — AGPL §13 source offer.** A visible, unobtrusive "Source" link to the public repo (the app serves AGPL code over a network). *Pass:* a source link is reachable from the editor UI.
- **REQ-A5 — Env docs.** `.env.example` documents `VITE_HOST_ORIGIN` and notes that `wsUrl`/`roomId`/`token` arrive via postMessage; README gets a one-paragraph deploy note. *Pass:* `.env.example` lists the var with the prod-pairing comment.

### Workstream B — Host app (swifter) config & cruft

- **REQ-B1 — Fail-loud app URL.** In a **production** build, `superdocBridge.ts` throws if `VITE_SUPERDOC_APP_URL` is unset (today it silently uses `http://localhost:5174`, which would point the prod iframe at localhost and never connect). Dev default unchanged. *Pass:* prod build with no var surfaces an error; dev still boots.
- **REQ-B2 — Response headers / CSP.** Add `customHttp.yml` with a CSP that includes `frame-src https://editor.swiftpro.tech` (allow embedding the editor) and `connect-src` including `https://api.swiftpro.tech` and `wss://api.swiftpro.tech` (host's existing collab/versions WS). CSP is derived from what the app actually calls so nothing existing breaks. *Pass:* file present; manual load of the app shows no new CSP violations in console; iframe embeds.
- **REQ-B3 — Env docs.** Add a tracked `.env.example` (un-ignore via `!.env.example`) documenting `VITE_SUPERDOC_APP_URL` and `VITE_WS_URL`. *Pass:* file tracked by git, lists both vars.
- **REQ-B4 — Conservative cruft sweep.** Confirm `console.*` are `import.meta.env.DEV`-guarded (already true); remove any dead/debug-only UI found on this branch. **No editor removal** — TipTap path stays intact. *Pass:* no ungated `console.*` introduced; TipTap still reachable via `?editor=tiptap`.

### Workstream C — Real-time collaboration (connect-or-fallback)

The Yjs provider runs **inside the iframe** (the editor app owns the SuperDoc instance, `Y.Doc`, and `WebsocketProvider`). SuperDoc gates `onReady` on provider sync, so the provider must be **synced before** it is handed to SuperDoc.

- **REQ-C1 — Connect-or-fallback.** The editor app:
  1. Creates `Y.Doc` + `WebsocketProvider(wsUrl, roomName, ydoc)` standalone.
  2. Awaits sync (`provider` `sync`/connected) within a timeout (target ~8–10s).
  3. **Synced in time** → constructs SuperDoc with `modules.collaboration: { ydoc, provider }` and `document: <bytes>` → `onReady` fires (provider already synced); SuperDoc seeds an empty room from the bytes or loads existing room content.
  4. **Timeout/error** → tears down the provider and falls back to the current document-only render from the transferred bytes.
  *Pass:* with a reachable WS, the editor renders live-collab and `onReady` fires; with an unreachable WS, the editor still renders document-only within the timeout (never hangs blank).
- **REQ-C2 — Room-name fix.** Derive the SuperDoc room from the **same base the working TipTap client uses**, with a **colon-free, single URL-path-segment** suffix (e.g. `<baseRoom>-superdoc`) — schema-isolated from the OOXML-incompatible TipTap room, yet routable by the healthy server. The host's `buildInitPayload` namespacing is updated to match. *Pass:* a live WS probe to the chosen room name **upgrades** (no 502); the room differs from the TipTap room for the same document.
- **REQ-C3 — Auth parity.** The iframe provider authenticates **identically** to the working TipTap client. The mechanism (token query-param / subprotocol / cookie) is **read from `useCollabProvider` in the host**, not guessed, and mirrored in the editor app. *Pass:* the iframe provider reaches `synced` against the live server using the same auth path as TipTap.
- **REQ-C4 — Bridge intact.** The existing redline/tracked-changes bridge and host sidebar continue to operate on the SuperDoc instance with collab on. *Pass:* host AI-Polish extract/apply flow still round-trips (existing tests stay green).

### Workstream D — Production loading UX

- **REQ-D1 — Document-skeleton loader.** Replace the text overlays in `IframeEditorPane` with a centered white page-sheet skeleton (matching the editor's always-white-sheet aesthetic) with shimmering placeholder lines that *preview* the final layout. *Pass:* loading state shows a page-shaped skeleton, not raw text.
- **REQ-D2 — Phase + collab awareness.** A slim, quiet status line/stepper communicates the real phases — including a **"connecting to collaboration…"** step — without a wall of text. *Pass:* the collab-sync phase is represented in the loader.
- **REQ-D3 — Smooth transition & graceful error.** Crossfade skeleton → live editor on `ready` (no hard pop); the existing connect/fetch watchdog timeouts drive a friendly error state (not a stack trace). *Pass:* visual check shows crossfade; a forced timeout shows the friendly error.
- **REQ-D4 — Accessibility.** Respects dark mode and `prefers-reduced-motion` (shimmer → static). *Pass:* reduced-motion disables the shimmer animation.

The phase/timeout **logic** underneath (CONNECT/FETCH watchdogs, `res.ok` guard, mount-once ref pattern) is reused; only the presentation changes.

## 6. Verification (the "done" gate)

- **Editor app:** `pnpm typecheck` clean → `pnpm build` exit 0 (`dist/index.html` present) → `pnpm test` (vitest) green.
- **Host app:** `pnpm exec tsc -b --noEmit` clean → `pnpm build` exit 0 → SuperDoc-related vitest files green. (Pre-existing `.claude/worktrees` vitest-exclude typo and unrelated Yoopta test failures are documented and must not mask real regressions.)
- **Live collab check:** a small WS handshake probe confirms the chosen room name **upgrades (no 502)** against `wss://api.swiftpro.tech/...`, and that a synced provider yields a non-hanging `onReady`. Add/extend a vitest for the connect-or-fallback timeout branch (sync-in-time → collab; timeout → document-only).
- **Loading UX:** `/browser-qa` screenshot of the skeleton + crossfade.
- **Claim discipline:** the deliverable is **"build + config + tests + live-WS handshake verified production-ready."** No "deploys successfully" claim — deploy is not pressed in this work.

## 7. Risks & mitigations

- **CSP too strict breaks an existing host call** → derive `connect-src` from observed network calls before tightening; verify zero new CSP violations after.
- **Fail-loud trips dev** → guard strictly on `import.meta.env.PROD`.
- **Room name still 502s** → REQ-C2 verifies against the live server *during execution* (probe before wiring); if a clean suffix still 502s, escalate to the user (backend owner) rather than guess at server routing.
- **Collab seeding double-imports** (bytes + non-empty room) → rely on SuperDoc's `isNewFile`/collaboration machinery to seed only an empty room; verify a second client joins to existing content, not a re-seed.

## 8. Items discovered from code, not assumed

1. Exact **room-name derivation** of the working TipTap collab (so the SuperDoc room routes identically).
2. Exact **WS auth mechanism** of the working client (so the iframe provider authenticates the same way).

Both are read from `collab/useCollabProvider.ts` (and callers) during planning/execution.

## 9. Affected files (anticipated, non-binding)

**Editor app (superdoc-swiftpro):** `amplify.yml` (new), `customHttp.yml` (new), `src/superdocOptions.ts`, `src/main.ts`, `index.html` (source link), `.env.example`, `README.md`, `src/*.test.ts`.

**Host app (swifter):** `customHttp.yml` (new), `.env.example` (new), `.gitignore` (un-ignore `.env.example`), `src/pages/CollaborationToolPage/collab/superdocBridge.ts`, `src/pages/CollaborationToolPage/components/IframeEditorPane.tsx` (+ loader component), related `*.test.ts(x)`.
