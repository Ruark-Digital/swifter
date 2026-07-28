# Technology Stack

**Analysis Date:** 2026-07-22

## Languages

**Primary:**
- TypeScript 5.2.x - Entire `src/` application (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`)

**Secondary:**
- JavaScript (ESM, `type: "module"`) - config files (`vite.config.ts`, `tailwind.config.js`, `postcss.config.js`)

## Runtime

**Environment:**
- Node.js v22.23.0 (developer machine; no `.nvmrc` committed — Amplify build image controls CI Node version)
- Browser: SPA served as static bundle (Vite build output in `dist/`)

**Package Manager:**
- pnpm (locked to `pnpm@10.21.0` in `amplify.yml` preBuild step)
- Lockfile: `pnpm-lock.yaml` present (522KB)
- Note: `npm run <script>` commands work locally via `package.json` scripts, but CI/deploy uses pnpm exclusively

## Frameworks

**Core:**
- React 19.1.0 + React DOM 19.1.0 - UI rendering
- React Router DOM 6 - Client-side routing (`src/routes.tsx`, consumed via `createBrowserRouter` in `src/providers.tsx`)
- Vite 5.4.19 - Dev server & build tool (`vite.config.ts`), with `@vitejs/plugin-react` and `@tailwindcss/vite`
- Tailwind CSS 4.0 - Styling, configured via `tailwind.config.js` + PostCSS (`postcss.config.js`)
- Zustand 4.5.4 (+ `auto-zustand-selectors-hook`) - Global state (e.g. `src/store/authSlice.ts`, `src/store/solicitationFileSlice.ts`)
- TanStack React Query 5.66.11 - Server-state/data fetching, with `@tanstack/react-query-persist-client` + `@tanstack/query-sync-storage-persister` for cache persistence
- React Hook Form 7.56.4 + `@hookform/resolvers` + `yup` - Form state/validation
- `@adexdsamson/forge` + `@adexdsamson/forge-validation` - Internal form-wrapping abstraction over `react-hook-form` (see project convention notes: "Forge wraps FormProvider")

**Testing:**
- Playwright `@playwright/test` 1.53.0 - Primary E2E test runner (`playwright.config.ts`, tests co-located under `src/**/__tests__/*.spec.ts(x)`)
- Vitest 2.1.9 + `@testing-library/react` 16.3.2 + `@testing-library/jest-dom` 6.9.1 + `jsdom` 29 - Unit/component tests (`vitest.config.ts`)
- `npm run test` invokes Playwright by default; per-feature scripts exist (`test:companies`, `test:admin`, `test:evaluation`, `test:vendor`, `test:project`, `test:contract`, `test:reports`, `test:settings`, `test:all-features`)

**Build/Dev:**
- TypeScript project references build: `tsc -b && vite build` (`package.json` → `build` script)
- ESLint 8.57.0 with `@typescript-eslint` 7.13.1, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` (`lint` script: `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`)
- **Real build gate is `tsc -b`, not `tsc --noEmit`** — see project memory `reference_swifter_real_build_lint_gate`

## Key Dependencies

**Critical:**
- `axios` 1.7.2 - HTTP client; single instance in `src/lib/axiosInstance.ts` with request/response interceptors (Bearer token injection, 401 → logout)
- `@tanstack/react-table` 8.19.2 - Data tables across management pages
- `yjs` 13.6.28 + `y-websocket` 3.0.0 + `y-indexeddb` 9.0.12 + `y-protocols` - CRDT collaboration engine backing the redline/collab editor
- `@tiptap/*` 3.23.4 (`core`, `pm`, `react`, `starter-kit`, `extension-collaboration`) - Rich text editor used in the Collaboration Tool
- `@yoopta/*` 4.9.9 (many sub-packages) + `slate`/`slate-react`/`@slate-yjs/*` - Legacy/alternate rich-text editor stack, still present alongside TipTap (see `useYooptaYjs.ts`)
- `mammoth` 1.10.0 - `.docx` → HTML/markdown conversion (document viewers, `src/lib/fileToMarkdown.ts`)
- `xlsx` 0.18.5 - Client-side spreadsheet export/import (reports, summaries)
- `react-pdf` 10.1.0 - PDF rendering in-browser
- `crypto-js` 4.2.0 - Client-side decryption of onboarding invite tokens (`VITE_DECRYPTION_KEY`)
- `date-fns` 4.1.0 + `date-fns-tz` 3.2.0 - Date handling (project memory flags a truthiness-guard trap here)
- `recharts` 2.15.3 - Dashboard analytics charts
- `radix-ui` 1.4.2 (+ individual `@radix-ui/react-*` packages) - Unstyled UI primitives underlying the design system

**Infrastructure:**
- `@sentry/react` 8.15.0 - Error tracking + session replay + browser tracing (`src/App.tsx`)
- `zustand` + `persist` middleware - Auth/session persistence to browser storage
- `nanoid` 5.1.6 - ID generation

## Configuration

**Environment:**
- Vite env vars (`import.meta.env.VITE_*`), loaded from `.env.local` (gitignored) and `.env.example` (template, safe/no secrets)
- Known vars: `VITE_API_BASE_URL` (falls back to `https://dev.swiftpro.tech/api/v1/dev` in `src/config/index.ts`), `VITE_WS_URL` (Yjs collab websocket; falls back to `wss://api.swiftpro.tech/api/v1/dev/contract`), `VITE_YWS_URL` (deprecated fallback for `VITE_WS_URL`), `VITE_SUPERDOC_APP_URL` (origin of the embedded SuperDoc iframe editor; fatal if missing in production — see `src/pages/CollaborationToolPage/collab/superdocBridge.ts`), `VITE_SENTRY_DSN`, `VITE_DECRYPTION_KEY` (onboarding invite decryption)
- Playwright E2E loads env in layered order via `dotenv`: base `.env` → `.env.e2e` → `.env.local` (`playwright.config.ts`)
- `.env.local` exists locally (10 lines) but is gitignored — never read/quoted here per forbidden-files policy

**Build:**
- `vite.config.ts` - React + Tailwind plugins, `@` path alias → `./src`
- `tsconfig.app.json` - `strict: true`, `noUnusedLocals`/`noUnusedParameters`, target ES2020, path alias `@/*` → `./src/*`, excludes all test/spec files from the app build
- `tailwind.config.js`, `postcss.config.js` - Styling pipeline
- `amplify.yml` - AWS Amplify hosting build spec (see Platform Requirements)

## Platform Requirements

**Development:**
- Node.js (developer machine observed at v22.23.0; no engine constraint pinned in `package.json`)
- pnpm 10.21.0 (enforced by CI install step, not locally enforced)
- Local dev server: `npm run dev` (Vite, default port 5173, referenced as `E2E_BASE_URL` default in `playwright.config.ts`)
- A second local app (SuperDoc editor, separate repo) expected at `http://localhost:5174` for full collab-editor dev flow (`VITE_SUPERDOC_APP_URL` dev default)

**Production:**
- AWS Amplify hosting (`amplify.yml`): `pnpm install --frozen-lockfile` → `pnpm rebuild esbuild sharp core-js pdf2html` → `pnpm run build` → artifacts from `dist/`
- Amplify caches `node_modules/**/*` and `~/.pnpm-store/**/*`
- Deployed API origin: `https://dev.swiftpro.tech` (also `https://api.swiftpro.tech` referenced in Sentry trace targets and static asset URLs)
- Deployed collab WS origin: `wss://api.swiftpro.tech/api/v1/dev/contract`
- Deployed SuperDoc editor app origin: `https://editor.swiftpro.tech`

---

*Stack analysis: 2026-07-22*
