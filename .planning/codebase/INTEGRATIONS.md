# External Integrations

**Analysis Date:** 2026-05-17

## APIs & External Services

**SwiftPro Backend REST API:**
- Default base URL: `https://dev.swiftpro.tech/api/v1/dev` (`src/config/index.ts:2`)
- Overridable via `VITE_API_BASE_URL`
- Transport: shared axios singleton in `src/lib/axiosInstance.ts`
  - JSON `Content-Type`/`Accept` headers (`src/lib/axiosInstance.ts:8-10`)
  - Request interceptor injects `Authorization: Bearer <token>` from zustand auth store (`src/lib/axiosInstance.ts:16-27`)
  - Response interceptor calls `setReset()` on HTTP 401 (`src/lib/axiosInstance.ts:30-42`)
  - Helpers: `getRequest`, `postRequest`, `patchRequest`, `putRequest`, `deleteRequest` (lines 48-99)
- API surface enumerated in `docs/API_DOCUMENTATION_PHASE_2.md` and `swagger.json`
- Roles map to API path prefixes: `manager`, `vendor`, `approver`, `user` (see memory `reference_api_doc_phase2.md`)

**MCP AI Integration Server (chat):**
- Hard-coded base URL: `https://dev.swiftpro.tech` (`src/App.tsx:14`)
- Role → endpoint map (`src/App.tsx:16-29`):
  | Role | Endpoint |
  |------|----------|
  | `vendor` | `/chat/vendor` |
  | `approver` | `/chat/approver` |
  | `contract_manager` / `project_manager` / `company_admin` / `super_admin` | `/chat/manager` |
  | `procurement` | `/chat/rfp` |
  | `evaluator` / `view_only` (default) | `/chat/user` |
- Streaming: `POST <chatUrl>` with `Accept: text/event-stream, application/json`, body `{ userToken, stream, messages:[{role,content}] }` (`src/App.tsx:78-101`)
- SSE parser handles named events `content`, `tool_start`, `tool_cached`, `tool_result`, `tool_error` (`src/App.tsx:104-154`)
- Reset endpoint: `POST /chat/reset` body `{ userToken }` (`src/App.tsx:181-187`)
- Consumed by `src/components/layouts/AIChatWidget/index.tsx`, mounted in `App.tsx:198-203` when `user.isAi && isAuthenticated`

**Sentry (Errors + Performance + Replay):**
- SDK: `@sentry/react` ^8.15.0
- Init: `src/App.tsx:35-52`
  - DSN from `VITE_SENTRY_DSN`
  - `sendDefaultPii: true`
  - Integrations: `browserTracingIntegration()`, `replayIntegration()`
  - `tracesSampleRate: 1.0`
  - `tracePropagationTargets: ["localhost", /^https:\/\/api\.swiftpro\.tech\/api/]`
  - `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`
- `Sentry.ErrorBoundary` wraps the app (`src/App.tsx:192`)

## Realtime / WebSockets

**Yjs Collaborative Editing (y-websocket):**
- Provider: `y-websocket` + `y-indexeddb` + `@slate-yjs/{core,react}` (`src/pages/CollaborationToolPage/collab/useYooptaYjs.ts:1-7`)
- WS URL resolution (`src/pages/CollaborationToolPage/index.tsx:234-251`):
  1. `?wsUrl=…` query param
  2. `VITE_WS_URL` (canonical, per `COLLAB_WS.md`)
  3. `VITE_YWS_URL` (deprecated fallback)
  4. `ws://localhost:1234` default
- Room ID derived from `collabDoc || contractId || fileName || "collab:editor"`
- Auth: JWT injected as `?token=` query param on the WS handshake (`useYooptaYjs.ts:8-14`)
- Awareness throttle: 30 fps cap (`THROTTLE_INTERVAL_MS = Math.floor(1000/30)`) for awareness messages (type code 1) (`useYooptaYjs.ts:16-56`)
- Offline persistence: `IndexeddbPersistence` per room

## Data Storage

**Databases:**
- None client-side — all persistence via the SwiftPro REST API

**Browser Storage:**
- `IndexedDB` — Yjs document offline cache (`y-indexeddb`)
- `localStorage` — zustand auth slice persistence, theme (`storageKey: "swiftpro-theme"` in `src/App.tsx:191`)
- React Query persistence — `@tanstack/query-sync-storage-persister`

**File Storage:**
- Files served from backend at `https://api.swiftpro.tech/api/v1/dev/upload/<key>` (e.g. logo references in `src/utils/sitemapGenerator.ts:160`, `src/hooks/useSEO.ts:29`, `src/pages/Login.tsx:93`)
- Upload endpoint returns size as a string — store `res.data.data[0].size`, not `file.size` (memory `feedback_file_size_string.md`)

## Authentication & Identity

**Auth Provider:** Custom (backend-issued JWT)
- Token stored in zustand slice `src/store/authSlice.ts` (exposed via `storeFunctions.getState().token`)
- Attached to REST via axios request interceptor (`src/lib/axiosInstance.ts:16-27`)
- Attached to MCP chat via `userToken` body field (`src/App.tsx:86`)
- Attached to WS via `?token=` query param (`useYooptaYjs.ts`)
- 401 → `setReset()` clears state and bounces to login (`src/lib/axiosInstance.ts:33-37`)

**Onboarding decryption:**
- `VITE_DECRYPTION_KEY` used with `crypto-js` to decrypt onboarding tokens in:
  - `src/pages/OnboardingPage/index.tsx:83`
  - `src/pages/OnboardingPage/VendorOnboardingPage.tsx:70`
  - `src/pages/OnboardingPage/PmOnboardingPage.tsx:48`

## Monitoring & Observability

**Error Tracking + Session Replay:**
- Sentry (see above)
- `ErrorFallback` UI: `src/components/layouts/Error`

**Logs:**
- `console.error` in chat error paths (`src/App.tsx:162,176`); otherwise relies on Sentry capture

## CI/CD & Deployment

**Hosting:**
- AWS Amplify (`amplify.yml`) — production
- Vercel directory `.vercel/` exists (legacy/secondary)

**CI Pipeline:**
- Amplify build runs `pnpm install --frozen-lockfile` → `pnpm rebuild esbuild sharp core-js pdf2html` → `pnpm run build`
- Playwright `CI` env enables `forbidOnly`, `retries: 2`, `workers: 1` (`playwright.config.ts:20-24`)

## Environment Configuration

**Required env vars (Vite, `VITE_*` prefix is required for client exposure):**
- `VITE_API_BASE_URL` — REST base (default `https://dev.swiftpro.tech/api/v1/dev`)
- `VITE_SENTRY_DSN` — Sentry DSN
- `VITE_WS_URL` — Yjs websocket URL (canonical)
- `VITE_YWS_URL` — deprecated alias for `VITE_WS_URL`
- `VITE_DECRYPTION_KEY` — onboarding payload decryption key

**Playwright-only:**
- `E2E_BASE_URL` — defaults to `http://localhost:5173` (`playwright.config.ts:9`)
- `CI` — toggles retries/workers
- Loaded from `.env`, `.env.e2e`, `.env.local` via `dotenv` (`playwright.config.ts:2-7`)

**Secrets location:**
- Local `.env*` files (git-ignored; existence not verified in repo)
- Production: Amplify environment variables

## Webhooks & Callbacks

**Incoming:**
- None — SPA only

**Outgoing:**
- REST calls to `https://*.swiftpro.tech/api/v1/dev/*`
- WS handshake to configured Yjs server
- POST to MCP `/chat/{role}` and `/chat/reset` endpoints

## Third-Party SDKs Summary

| SDK / Package | Purpose | Entry point |
|---------------|---------|-------------|
| `@sentry/react` | Error + replay + tracing | `src/App.tsx:35-52` |
| `axios` | REST client | `src/lib/axiosInstance.ts` |
| `@tanstack/react-query` | Server-state cache | `src/App.tsx:64-70` |
| `zustand` | Auth + UI state | `src/store/authSlice.ts` |
| `react-hook-form` + `yup` | Forms (Forge wrapper) | feature pages |
| `@yoopta/editor` (+ plugins) | Collaboration doc editor | `src/pages/CollaborationToolPage/components/EditorPanel.tsx` |
| `yjs` + `y-websocket` + `y-indexeddb` | CRDT presence/persistence | `src/pages/CollaborationToolPage/collab/useYooptaYjs.ts` |
| `recharts` | Dashboards/analytics | `src/components/layouts/RoleBasedDashboard/analytics/*` |
| `mammoth`, `pdf2html`, `xlsx`, `react-pdf` | Document parsing/preview | contract & MSA pages |
| `crypto-js` | Onboarding token decryption | `src/pages/OnboardingPage/*` |
| `react-helmet-async` | SEO meta tags | `src/components/SEO/SEOWrapper.tsx`, `src/hooks/useSEO.ts` |
| `sonner` | Toast notifications | `src/components/ui/toaster` |

---

*Integration audit: 2026-05-17*
