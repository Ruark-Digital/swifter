# External Integrations

**Analysis Date:** 2026-07-22

## APIs & External Services

**SwiftPro Backend API (primary):**
- Base URL: `VITE_API_BASE_URL`, default `https://dev.swiftpro.tech/api/v1/dev` (`src/config/index.ts`)
- Client: single `axios` instance (`src/lib/axiosInstance.ts`), consumed via `getRequest`/`postRequest`/`patchRequest`/`putRequest`/`deleteRequest` helpers
- Auth: `Authorization: Bearer <token>` injected per-request from Zustand auth store (`src/store/authSlice.ts`)
- All feature domains (contracts, MSAs, invoices, RFIs, NCRs, deliverables, personnel, compliance, approvers, evaluation, solicitation/admin) are namespaced REST endpoints under this base URL — see project memory hub for per-domain endpoint shape notes (e.g. `reference_api_doc_phase2.md`, `reference_swiftpro_solicitation_admin_service_api.md`)
- Production static asset origin also referenced directly: `https://api.swiftpro.tech/api/v1/dev/...` (e.g. `src/hooks/useSEO.ts`, `src/utils/sitemapGenerator.ts`, `src/components/SEO/SEOWrapper.tsx` for OG image URLs)

**MCP Chat backend:**
- Base URL: hardcoded `MCP_BASE_URL = "https://dev.swiftpro.tech"` in `src/App.tsx`
- Endpoint: `${MCP_BASE_URL}/chat/` (single shared endpoint across all users/roles)
- Client widget: `src/components/layouts/AIChatWidget/index.tsx`
- Note: a separate, unrelated legacy hook `src/hooks/useAIChat.ts` posts to a local `/api/chat` placeholder endpoint with a hardcoded `conversation_id: 'default'` — this appears to be scaffolding, not the wired production chat path (production chat uses the MCP `/chat/` endpoint per `App.tsx`/project memory `project_mcp_chat_integration.md`)

**SuperDoc editor (separate AGPL app, embedded via iframe):**
- Origin: `VITE_SUPERDOC_APP_URL`, dev default `http://localhost:5174`, production `https://editor.swiftpro.tech`
- Integration is strictly `postMessage` (no direct import, to avoid AGPL copyleft contamination) — protocol defined in `src/pages/CollaborationToolPage/collab/superdocBridge.ts`
- Missing `VITE_SUPERDOC_APP_URL` is a fatal error in production builds (`resolveSuperdocAppUrl`)
- Host sends `superdoc:init` (doc bytes, room id, ws url, JWT token); iframe sends back `superdoc:ready`, `superdoc:doc-edit`, `superdoc:redlines`, `superdoc:presence`, `superdoc:comment-created`, etc.

## Data Storage

**Databases:**
- None directly — this is a frontend-only SPA; all persistence is via the backend REST API described above

**File Storage:**
- Backend-hosted file uploads (two-step upload → metadata pattern per project memory `reference_contract_file_upload_two_step_pattern.md`), served from `https://api.swiftpro.tech/api/v1/dev/upload/...`
- Local: browser `IndexedDB` via `y-indexeddb` for offline Yjs document persistence in the collaboration editor (`src/pages/CollaborationToolPage/collab/useCollabProvider.ts`)

**Caching:**
- TanStack React Query in-memory cache, persisted to browser storage via `@tanstack/react-query-persist-client` + `@tanstack/query-sync-storage-persister`
- No server-side cache (Redis, etc.) — none present in this frontend repo

## Authentication & Identity

**Auth Provider:**
- Custom (backend-issued JWT bearer tokens, no third-party IdP/OAuth SDK detected)
- Implementation: token stored in Zustand `authSlice` (`persist` middleware to browser storage), injected into axios requests via interceptor; 401 responses trigger `setReset()` (forced logout) in the response interceptor
- Onboarding invite links use client-side decryption (`crypto-js`, `VITE_DECRYPTION_KEY`) to unwrap invite payloads — see `src/pages/OnboardingPage/index.tsx`, `PmOnboardingPage.tsx`, `VendorOnboardingPage.tsx`
- Inactivity auto-logout: `src/hooks/useInactivityLogout.ts`

## Monitoring & Observability

**Error Tracking:**
- Sentry (`@sentry/react` 8.15.0), initialized in `src/App.tsx`
  - DSN: `VITE_SENTRY_DSN`
  - Integrations: `browserTracingIntegration`, `replayIntegration`
  - `tracesSampleRate: 1.0` (100% transaction capture)
  - `tracePropagationTargets`: `localhost`, `https://api.swiftpro.tech/api/*`
  - Session Replay: 10% of normal sessions, 100% of error sessions
  - `SentryErrorBoundary` wraps the app tree (`src/providers.tsx`) with a custom `ErrorFallback` component

**Logs:**
- No structured logging service integrated; relies on Sentry breadcrumbs/events plus ad-hoc `console.log` (e.g. `src/providers.tsx` logs `routes`/`RouterProviderObject` on load — appears to be leftover debug output)

## CI/CD & Deployment

**Hosting:**
- AWS Amplify (static frontend hosting), build spec in `amplify.yml`

**CI Pipeline:**
- Amplify's built-in build pipeline only (`preBuild`: pnpm install/rebuild native deps; `build`: `pnpm run build`; artifacts from `dist/`, caching `node_modules` and pnpm store)
- No separate GitHub Actions / other CI workflow files detected in this repo for test/lint gating (Playwright/Vitest/ESLint are run manually or via local scripts, not enforced in the Amplify build)

## Environment Configuration

**Required env vars:**
- `VITE_API_BASE_URL` - backend API origin (optional, has a working default)
- `VITE_WS_URL` (canonical) / `VITE_YWS_URL` (deprecated fallback) - Yjs collaboration websocket URL
- `VITE_SUPERDOC_APP_URL` - SuperDoc iframe editor origin (**required in production**, fatal if unset)
- `VITE_SENTRY_DSN` - Sentry project DSN
- `VITE_DECRYPTION_KEY` - symmetric key for decrypting onboarding invite tokens

**Secrets location:**
- `.env.local` (gitignored, present locally, contents not read per forbidden-files policy)
- `.env.example` documents the collab-related vars (`VITE_WS_URL`, `VITE_SUPERDOC_APP_URL`) with placeholder/non-secret values and inline comments explaining production fallback behavior
- No secrets committed to the repo; Amplify environment variables presumably supply production values (not verifiable from this repo)

## Webhooks & Callbacks

**Incoming:**
- None — this is a frontend SPA with no server component to receive webhooks

**Outgoing:**
- None detected as traditional webhooks; the closest analog is the Yjs WebSocket connection (`WebsocketProvider` from `y-websocket`, connecting to `VITE_WS_URL`/room id, JWT passed via `Sec-WebSocket-Protocol` — `src/pages/CollaborationToolPage/collab/useCollabProvider.ts`) and the SuperDoc iframe `postMessage` bridge described above

---

*Integration audit: 2026-07-22*
