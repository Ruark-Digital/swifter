# Coding Conventions

**Analysis Date:** 2026-07-22

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` (e.g. `src/pages/ContractManagementPage/ContractDetailPage.tsx`, `src/components/layouts/RoleBasedDashboard/analytics/ChangeOrdersImpactCard.tsx`)
- Hooks: `useCamelCase.ts`/`.tsx` (e.g. `src/hooks/useDashboardData.ts`, `src/hooks/useUserRole.ts`). A few outliers use kebab-case (`src/hooks/use-file-upload.ts`, `src/hooks/use-mobile.tsx`) — these mirror shadcn/ui upstream naming, keep kebab-case for anything copied from shadcn.
- Lib/utils: `camelCase.ts` (e.g. `src/lib/dashboardDataTransformer.ts`, `src/lib/currencyUtils.ts`, `src/lib/moduleFlags.ts`)
- API modules per feature: `camelCase` + `Api` suffix, colocated under a page's `api/` folder (e.g. `src/pages/ContractManagementPage/api/approverApi.ts`, `contractManagerApi.ts`, `vendorApi.ts`, `viewOnlyApi.ts`, `companyAdminApi.ts`)
- Test files: `*.test.ts`/`*.test.tsx` (Vitest, component/hook unit tests) and `*.spec.ts`/`*.spec.tsx` (Playwright — both true browser e2e specs and DI-based "unit" specs). QA-ticket-referenced specs are prefixed with the ticket id, e.g. `ade-76-invoice-approve-status.e2e.spec.ts`, `ade85-manager-approve-change-url.unit.spec.ts`.

**Functions:**
- camelCase throughout (`handleSubmit`, `onSuccessHandler`, `createApproverApi`)
- Factory functions that build role-scoped API clients are named `create<Role>Api` and accept injected `get`/`post` functions for testability (see `src/pages/ContractManagementPage/api/approverApi.ts`)

**Variables:**
- camelCase for locals/state; `SCREAMING_SNAKE_CASE` not commonly used except for true constants
- Boolean flags read as predicates where possible (module flags checked for truthy, not `=== true` — see `src/lib/moduleFlags.ts`)

**Types:**
- PascalCase for types/interfaces (`ApiResponse`, `ApiResponseError`, `ContractDetail` in `src/types`)
- `type` used for unions/aliases, `interface` used for component props (`interface EditUserDialogProps`)
- Component prop types are usually named `<ComponentName>Props` and declared directly above the component in the same file

## Code Style

**Formatting:**
- No `.prettierrc` present — no repo-enforced Prettier config detected. Match surrounding file's existing indentation/quote style (mixed double/single quotes observed across files; prefer double quotes for JSX-adjacent TS files, matching the file being edited).

**Linting:**
- ESLint via `.eslintrc.cjs` (legacy config format, not flat config)
- Extends: `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:react-hooks/recommended`
- Notable rule overrides:
  - `@typescript-eslint/no-explicit-any`: **off** — `any` is permitted and used pervasively (e.g. `ApiResponse<any>`, spy fakes typed `as any`)
  - `react-hooks/rules-of-hooks`: **off** — the hooks-order rule is disabled project-wide; do not rely on lint to catch conditional-hook bugs, reason about it manually
  - `react-refresh/only-export-components`: warn only, `allowConstantExport: true`
- Run lint: `npm run lint` (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`)
- Real build/type gate is `tsc -b` (part of `npm run build`), not `tsc --noEmit` — see `tsconfig.app.json` (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`). Test files (`__tests__/**`, `*.test.ts(x)`, `*.spec.ts(x)`) are excluded from the app tsconfig's `include`/strict checking scope.

## Import Organization

**Order (observed, not enforced by tooling):**
1. External/framework imports (`react`, `react-router-dom`, `@tanstack/react-query`)
2. Internal absolute imports via `@/` alias (components, hooks, lib, store, types)
3. Relative imports for same-feature files (`./api/vendorApi`, `./layouts/AnalyticsTabContent`)

**Path Aliases:**
- `@/*` → `./src/*` (defined in both `tsconfig.app.json` and `vitest.config.ts` resolve alias). Always prefer `@/...` over deep relative paths (`../../..`) when crossing feature/page boundaries; use relative imports only within the same page/feature folder.

## Error Handling

**API layer:**
- All HTTP calls go through `src/lib/axiosInstance.ts` helpers (`getRequest`, `postRequest`, `patchRequest`, `putRequest`, `deleteRequest`) — do not call `axios` directly in components/hooks.
- A response interceptor auto-logs out on 401 (`src/lib/axiosInstance.ts:30-42`) via `storeFunctions.getState().setReset()`.

**Mutations (React Query):**
- Standard pattern: `useMutation` with `onSuccess` calling `toast.success(title, message)` and `onError` calling `toast.error(title, error)`, where `toast` comes from `useToastHandler()` (`src/hooks/useToaster/index.tsx`). See `src/pages/AdminManagementPage/components/EditUserDialog.tsx:114-149` as the canonical example.
- `useToastHandler().error(title, error)` accepts `ApiResponseError | string | undefined` and normalizes to a toast description — always route mutation errors through this handler rather than building ad-hoc error strings.
- Submit handlers additionally wrap `mutateAsync` in try/catch; the catch block is typically just a `console.log(error)` fallback since `onError` already handles the user-facing toast — do not duplicate toast calls in both places.

**Hooks with manual fetch logic (non-React-Query):**
- try/catch with `console.error('<Context> Error:', error)` plus a user-safe fallback value/message (see `src/hooks/useAIChat.ts:76-81`).

**General rule:** Never surface raw `error.message` or stack traces to the UI — always go through `useToastHandler` or an equivalent normalization step that falls back to a generic "Unknown error occurred" string (`src/hooks/useToaster/index.tsx:37-41`).

## Logging

**Framework:** `console.log`/`console.error` — no structured logging library in the frontend. Sentry (`@sentry/react`) is present as a dependency for error tracking (see STACK.md/INTEGRATIONS.md) but manual `console.*` calls remain common in hooks/handlers for debugging.

**Patterns:**
- Log the error object before/alongside showing a toast, e.g. `console.log({ error })` in `useToastHandler`, `console.error('AI Chat Error:', error)` in `useAIChat.ts`.

## Comments

**When to Comment:**
- Sparse; comments mostly explain *why* for non-obvious interceptor/config behavior (e.g. `// Redirect out to Login screen` in `axiosInstance.ts`) rather than restating code.
- Avoid adding comments to adjacent/untouched code when making surgical edits — match existing sparse-comment style.

**JSDoc/TSDoc:**
- Not systematically used. Occasional single-line `/** ... */` blocks appear in config files (e.g. `playwright.config.ts` links to docs) but are not a project-wide requirement.

## Function Design

**Size:** Feature components and page files can be large (multiple hundred lines is common for detail pages with many tabs, e.g. `ContractDetailPage.tsx`); tab content is split into separate `layouts/*TabContent.tsx` files to keep the top-level page manageable.

**Parameters:** API helper functions consistently take a single destructured options object (`{ url, payload, config }`) rather than positional args — follow this shape for any new axios helper or API-client method.

**Return Values:** Hooks that wrap React Query return the query/mutation object directly (or a thin object spreading it) rather than reshaping into a custom shape, so callers get `data`, `isLoading`, `mutateAsync`, etc. as-is.

## Module Design

**Exports:** Named exports are the default (`export const useDashboardData`, `export const getRequest`). Components are more often default-exported when they are the page/tab's primary export (`export default function ContractDetailPage`) but named when they are utilities or shared sub-components.

**Barrel Files:** Not widely used. Feature folders (e.g. `src/pages/ContractManagementPage/api/`) export directly from individual files (`vendorApi.ts`, `approverApi.ts`, etc.) and are imported by explicit path rather than through an `index.ts` re-export barrel — mirror this when adding a new API module (add a new file, do not add it to a barrel unless one already exists for that folder).

**Role-scoped API pattern:** Contract/MSA-style features frequently define one API module per role (vendor/approver/contractManager/companyAdmin/viewOnly) rather than a single API file with role branches inside. When adding a new endpoint for a role-gated feature, add it to the relevant role's existing API file instead of introducing conditional branching in a shared client.

---

*Convention analysis: 2026-07-22*
