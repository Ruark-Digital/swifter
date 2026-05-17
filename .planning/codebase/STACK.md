# Technology Stack

**Analysis Date:** 2026-05-17

## Languages

**Primary:**
- TypeScript ^5.2.2 — all application code under `src/`
- TSX (React) — UI components, pages, layouts

**Secondary:**
- JavaScript (CJS) — config files (`tailwind.config.js`, `postcss.config.js`, `.eslintrc.cjs`)
- JSON — `swagger.json` (API contract reference), `components.json` (shadcn config)

## Runtime

**Environment:**
- Browser (Vite SPA, target ES2020 — `tsconfig.app.json:5`)
- Node `@types/node` ^20.14.10 used for tooling

**Package Manager:**
- pnpm 10.21.0 (pinned in `amplify.yml:6`)
- Lockfile: `pnpm-lock.yaml` (present, ~510KB)
- `pnpm-workspace.yaml` declares `onlyBuiltDependencies: [core-js, esbuild, pdf2html, sharp]` (pnpm 10 silently ignores this key when placed in `package.json` — see memory `fix_pnpm10_amplify_build.md`)

## Frameworks

**Core:**
- React ^19.1.0 + react-dom ^19.1.0 (note: `@types/react` still on ^18.3.3 — `package.json:122`)
- Vite ^5.3.1 — dev server + bundler (`vite.config.ts`)
- React Router DOM v6 — routing (`react-router-dom: "6"`, `package.json:90`)

**Styling:**
- Tailwind CSS 4.0 (via `@tailwindcss/vite` ^4.0.9 — `vite.config.ts:2,7`)
- `@tailwindcss/postcss` ^4.0.9
- `tailwindcss-animate` ^1.0.7
- `tailwind-merge` ^2.3.0, `clsx` ^2.1.1, `class-variance-authority` ^0.7.1
- shadcn/ui (config in `components.json`) built on Radix primitives
- Dark-mode strategy: `darkMode: ["selector"]` (`tailwind.config.js:3`) with `oklch(var(--…))` design tokens

**UI Primitives:**
- `radix-ui` ^1.4.2 + scoped `@radix-ui/react-{alert-dialog,dialog,radio-group,scroll-area,slot}`
- `cmdk` ^1.1.1 (command palette)
- `lucide-react` ^0.511.0, `react-icons` ^5.2.1, `@hugeicons/react` ^1.1.2

**Data / State:**
- `@tanstack/react-query` 5.66.11 (+ `query-sync-storage-persister`, `react-query-persist-client`) — global `QueryClient` configured in `src/App.tsx:64-70` with `staleTime: 30000`
- `zustand` ^4.5.4 (+ `auto-zustand-selectors-hook`) — auth store at `src/store/authSlice.ts`
- `axios` ^1.7.2 — HTTP client (`src/lib/axiosInstance.ts`)

**Forms / Validation:**
- `react-hook-form` ^7.56.4 (project wraps RHF in an internal "Forge" wrapper)
- `@hookform/resolvers` ^3.9.0, `@hookform/devtools` ^4.4.0
- `yup` ^1.4.0

**Tables:**
- `@tanstack/react-table` ^8.19.2

**Editors / Rich Content:**
- Yoopta editor `@yoopta/editor` ^4.9.9 plus plugins: `headings, paragraph, lists, table, code, blockquote, divider, link, link-tool, image, marks, exports, action-menu-list, toolbar` (all 4.9.9)
- `slate` ^0.120.0 + `slate-react` ^0.120.0 (Yoopta backend)
- `quill` ^2.0.3 + `react-quill` ^2.0.0
- `draft-js` ^0.11.7
- `react-markdown` ^10.1.0, `remark-{parse,gfm,stringify}`, `rehype-{parse,raw,highlight,remark}`, `unified` ^11.0.5
- `highlight.js` ^11.11.1

**Realtime / CRDT:**
- `yjs` ^13.6.28, `y-websocket` ^3.0.0, `y-indexeddb` ^9.0.12, `y-protocols` ^1.0.7
- `@slate-yjs/core` ^1.0.2, `@slate-yjs/react` ^1.1.0 — Yoopta/Slate ↔ Yjs bridge (`src/pages/CollaborationToolPage/collab/useYooptaYjs.ts:1-7`)

**Charts / Analytics:**
- `recharts` ^2.15.3

**File Handling:**
- `react-dropzone` ^14.3.8, `react-pdf` ^10.1.0, `react-file-viewer` ^1.2.1
- `mammoth` ^1.10.0 (docx → html), `pdf2html` ^4.4.0, `xlsx` ^0.18.5

**Misc Utilities:**
- `date-fns` ^4.1.0, `date-fns-tz` ^3.2.0, `@internationalized/date` ^3.8.2
- `react-day-picker` ^9.7.0
- `react-currency-input-field` ^3.10.0
- `lodash` ^4.17.21, `nanoid` ^5.1.6, `crypto-js` ^4.2.0, `usehooks-ts` ^3.1.0
- `emblor` ^1.4.8 (tag input), `sonner` ^2.0.7 (toasts)
- `react-helmet-async` ^2.0.5 (SEO)

**Observability:**
- `@sentry/react` ^8.15.0 — `browserTracingIntegration` + `replayIntegration` (`src/App.tsx:35-52`)

**Testing:**
- `@playwright/test` ^1.53.0 — E2E (`playwright.config.ts`)
- `vitest` ^2.1.9 + `jsdom` ^29.0.2 — unit (`vitest.config.ts`, `vitest.setup.ts`)
- `@testing-library/react` ^16.3.2, `@testing-library/jest-dom` ^6.9.1
- `puppeteer-core` ^24.42.0 (some custom runners)
- `@faker-js/faker` ^8.4.1 (fixtures)

**Build / Dev:**
- Vite ^5.3.1 + `@vitejs/plugin-react` ^4.3.1 (`vite.config.ts:3,7`)
- TypeScript build: `tsc -b` against project references (`tsconfig.json` → `tsconfig.app.json`, `tsconfig.node.json`)
- PostCSS ^8.4.39 + `autoprefixer` ^10.4.19 (`postcss.config.js`)
- `dotenv` ^17.2.1 (Playwright env loading — `playwright.config.ts:2-7`)

## Key Dependencies

**Critical:**
- `react` ^19.1.0 — UI runtime
- `vite` ^5.3.1 — bundler + dev server
- `@tanstack/react-query` 5.66.11 — server-state cache (pinned exact)
- `react-router-dom` 6 — routing
- `axios` ^1.7.2 — REST transport
- `@yoopta/editor` ^4.9.9 — collaboration tool editor
- `yjs` + `y-websocket` — realtime presence/CRDT for collab
- `@sentry/react` ^8.15.0 — error + replay telemetry

**Infrastructure:**
- AWS Amplify hosting (`amplify.yml`) — build artifacts at `dist/`
- `.vercel/` directory present (legacy/secondary)

## Configuration

**Path Alias:**
- `@/* → ./src/*` (`tsconfig.app.json:11-15`, `vite.config.ts:8-11`)

**TS Compiler:**
- `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` (`tsconfig.app.json:28-31`)
- `jsx: "react-jsx"`, `moduleResolution: "bundler"`
- `types: ["vite/client", "node"]`
- Excludes all `__tests__/**`, `*.test.*`, `*.spec.*` from app build

**Environment:**
- `.env` files exist locally but are git-ignored — loaded by Vite via `import.meta.env.VITE_*` and by Playwright via `dotenv.config()` for `.env`, `.env.e2e`, `.env.local` (`playwright.config.ts:2-7`)
- Required vars: `VITE_API_BASE_URL`, `VITE_SENTRY_DSN`, `VITE_WS_URL` (canonical) / `VITE_YWS_URL` (deprecated fallback), `VITE_DECRYPTION_KEY`, `E2E_BASE_URL`

**ESLint:**
- `.eslintrc.cjs` with `@typescript-eslint/{parser,eslint-plugin}` ^7.13.1, `eslint-plugin-react-hooks` ^4.6.2, `eslint-plugin-react-refresh` ^0.4.7
- `--max-warnings 0` enforced in `package.json:9`

## Scripts

```text
dev                 vite
build               tsc -b && vite build
lint                eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
test                playwright test
test:headed         playwright test --headed
test:ui             playwright test --ui
test:debug          playwright test --debug
test:report         playwright show-report
test:<feature>      playwright test src/pages/<Page>/__tests__/
test:all-features   chains test:companies → test:settings
test:companies      node src/pages/CompaniesPage/__tests__/run-tests.cjs
```

## Platform Requirements

**Development:**
- Node 20.x (matching `@types/node` ^20.14.10)
- pnpm 10.21.0 (per `amplify.yml`)
- Dev server: `http://localhost:5173`
- Collab WS dev fallback: `ws://localhost:1234`

**Production / Deployment:**
- AWS Amplify (`amplify.yml`)
  - `preBuild`: install pnpm@10.21.0 globally → `pnpm install --frozen-lockfile` → `pnpm rebuild esbuild sharp core-js pdf2html`
  - `build`: `pnpm run build`
  - Artifact: `dist/**/*`
  - Cache: `node_modules/**/*`, `~/.pnpm-store/**/*`

---

*Stack analysis: 2026-05-17*
