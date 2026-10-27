<!-- refreshed: 2026-07-22 -->
# Architecture

**Analysis Date:** 2026-07-22

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         Routing / Shell Layer                        │
│  `src/routes/index.tsx` (route table)                                │
│  `src/routes/PrivateRoute.tsx` / `PublicRoute.tsx` (guards)          │
│  `src/layouts/AuthLayout.tsx` / `Dashboard.tsx` / `Header.tsx` /     │
│  `Sidebar.tsx` (chrome for public vs authenticated shells)           │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Page Feature Modules                        │
│  `src/pages/<Feature>ManagementPage/`                                 │
│  Each page owns: index.tsx (list), *DetailPage.tsx (detail),          │
│  `components/`, `api/`, `lib/`, `utils/`, `__tests__/`                │
│  Examples: ContractManagementPage, MsaPage, SolicitationManagementPage,│
│  VendorManagementPage, EvaluationManagementPage, ProjectManagementPage│
└───────────────────────────────┬───────────────────────────────────────┘
                                 │
                 ┌───────────────┼───────────────────┐
                 ▼               ▼                   ▼
┌───────────────────────┐ ┌───────────────────┐ ┌────────────────────────┐
│  Shared UI Components │ │  Shared Hooks      │ │  Role-Based Dashboard  │
│ `src/components/ui`   │ │ `src/hooks/*`      │ │ `src/components/layouts│
│ `src/components/      │ │ (useUserRole,      │ │ /RoleBasedDashboard`   │
│  layouts/*` (DataTable│ │  useAuthentication,│ │ (analytics cards,      │
│  ConfirmAlert, Forms) │ │  useDashboardData) │ │  tab views per role)   │
└───────────┬────────────┘ └─────────┬──────────┘ └───────────┬────────────┘
            │                        │                        │
            └────────────┬───────────┴────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Access Layer (per-feature `api/`)             │
│  `src/pages/<Feature>/api/*Api.ts` — role-scoped API modules          │
│  (e.g. `contractManagerApi.ts`, `vendorApi.ts`, `approverApi.ts`,     │
│  `companyAdminApi.ts`, `viewOnlyApi.ts`) — one module per role branch  │
│  Wired to React Query for caching/invalidation                        │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    HTTP Client / Auth / Global State                  │
│  `src/lib/axiosInstance.ts` (singleton axios + interceptors)          │
│  `src/store/authSlice.ts` (zustand: user, token, authorities)         │
│  `src/store/solicitationFileSlice.ts` (shared Zustand slice for       │
│   in-progress solicitation file state)                                │
│  `src/config/index.ts` (base URL / env config)                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   Backend REST API    │
                     │ (SwiftPro API service, │
                     │  base path /api/v1/dev)│
                     └───────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Router table | Maps URL paths to page components, wraps them in guards | `src/routes/index.tsx` |
| `ProtectedRoute` | Wraps authenticated routes in `AuthorityGuard` | `src/routes/PrivateRoute.tsx` |
| `AuthorityGuard` | Central place role/authentication access checks happen before rendering a route | `src/components/layouts/AuthorityGuard/index.tsx` |
| `AuthLayout` | Chrome for public/unauthenticated pages (login, reset password, onboarding) | `src/layouts/AuthLayout.tsx` |
| `Dashboard` (layout) | Chrome for authenticated app shell (sidebar + header + outlet) | `src/layouts/Dashboard.tsx` |
| Feature page (e.g. `ContractManagementPage`) | Owns list view, detail view, feature-scoped API calls, and feature-local components | `src/pages/ContractManagementPage/index.tsx`, `ContractDetailPage.tsx` |
| Feature API modules | Role-branched HTTP calls for one feature domain | `src/pages/ContractManagementPage/api/*.ts` |
| `axiosInstance` | Single HTTP client instance with auth header injection and 401 handling | `src/lib/axiosInstance.ts` |
| `authSlice` (zustand) | Global auth/user/token state, persisted to localStorage | `src/store/authSlice.ts` |
| `useUserRole` | Derives current role and role-based dashboard config; provides `hasRole`/`hasAnyRole` | `src/hooks/useUserRole.ts` |
| `RoleBasedDashboard` | Renders different analytics/tab layouts depending on user role | `src/components/layouts/RoleBasedDashboard/index.tsx` |
| `useDashboardData` | Aggregates and transforms dashboard analytics data for cards | `src/hooks/useDashboardData.ts` |
| DataTable | Shared table primitive used across feature list pages | `src/components/layouts/DataTable` |
| shadcn/radix UI primitives | Low-level styled components (button, dialog, sheet, etc.) | `src/components/ui/*` |

## Pattern Overview

**Overall:** Feature-folder (vertical slice) SPA built on React Router + React Query + Zustand, with role-branched API/data access baked into the presentation layer rather than a separate backend-for-frontend.

**Key Characteristics:**
- Each business domain (Contract, MSA, Vendor, Evaluation, Solicitation, Project, Company, Admin, Subscription, User, Communication) is a self-contained folder under `src/pages/` with its own `api/`, `components/`, `lib/`, `utils/`, and `__tests__/`.
- Role is a first-class architectural concern: many features branch on role at the API-module level (`contractManagerApi.ts` vs `vendorApi.ts` vs `approverApi.ts` vs `companyAdminApi.ts` vs `viewOnlyApi.ts`), not just at the UI level — see `src/pages/ContractManagementPage/api/`.
- Global state is intentionally minimal: `zustand` stores only auth/session (`authSlice.ts`) and one shared in-progress-form slice (`solicitationFileSlice.ts`). All server data is owned by React Query, not the global store.
- No Redux, no server-rendering framework — pure client-side SPA (Vite + React Router `createBrowserRouter`), single `QueryClient` created once in `App.tsx`.
- Heavy component-library reliance on Radix primitives wrapped in `src/components/ui/*` (shadcn-style), reused across all feature folders.
- Document/editor-heavy tooling (Yoopta, TipTap, Yjs, Slate) is isolated to `src/pages/CollaborationToolPage` and does not leak into other features.

## Layers

**Routing/Shell layer:**
- Purpose: Decide which page renders for a URL and whether the user is allowed to see it.
- Location: `src/routes/`, `src/layouts/`
- Contains: Route table, guard components, top-level layout chrome (sidebar, header).
- Depends on: `src/store/authSlice.ts` (auth state), `AuthorityGuard`.
- Used by: `src/App.tsx` (creates the router and renders `RouterProvider`).

**Page/Feature layer:**
- Purpose: Implements one business domain end-to-end (list, detail, dialogs, tabs).
- Location: `src/pages/<Feature>Page/`
- Contains: `index.tsx` (list page), `<Feature>DetailPage.tsx`, `components/*.tsx` (feature-local UI), `api/*.ts` (feature-local HTTP), `lib/`, `utils/`, `__tests__/`.
- Depends on: shared UI (`src/components/ui`, `src/components/layouts`), shared hooks (`src/hooks`), `src/lib/axiosInstance.ts`.
- Used by: `src/routes/index.tsx` (mounted at a URL).

**Shared UI layer:**
- Purpose: Reusable, feature-agnostic building blocks.
- Location: `src/components/ui/` (43 primitives: button, dialog, sheet, table, etc.), `src/components/layouts/` (composite widgets: `DataTable`, `ConfirmAlert`, `ExportReportSheet`, `FormInputs`, `RoleBasedDashboard`, `AIChatWidget`, `AuthorityGuard`).
- Depends on: Radix UI, `class-variance-authority`, `tailwind-merge`.
- Used by: every page feature folder.

**Data access layer:**
- Purpose: Talk to the backend REST API, one module per role/feature.
- Location: `src/pages/<Feature>Page/api/*.ts`
- Contains: Functions wrapping `getRequest`/`postRequest`/`patchRequest`/`putRequest`/`deleteRequest` from `src/lib/axiosInstance.ts`, typically consumed via React Query hooks defined alongside or inline in components.
- Depends on: `src/lib/axiosInstance.ts`, `src/config/index.ts`.
- Used by: page components and feature hooks.

**HTTP/Auth/Global-state layer:**
- Purpose: Single source of truth for the axios client, auth/session, and base config.
- Location: `src/lib/axiosInstance.ts`, `src/store/authSlice.ts`, `src/store/solicitationFileSlice.ts`, `src/config/index.ts`.
- Depends on: `axios`, `zustand`.
- Used by: every API module (axios instance), `AuthorityGuard`/`useUserRole` (auth state).

## Data Flow

### Primary Request Path

1. User navigates to a `/dashboard/*` route → `src/routes/index.tsx` matches the route and renders the target page wrapped in `ProtectedRoute` (`src/routes/PrivateRoute.tsx:8`).
2. `AuthorityGuard` checks auth/role state pulled from `authSlice` before rendering children (`src/components/layouts/AuthorityGuard/index.tsx`).
3. Page component mounts, calls a React Query hook that invokes a feature API function (e.g. `src/pages/ContractManagementPage/api/contractManagerApi.ts`).
4. API function calls `getRequest`/`postRequest`/etc. from `src/lib/axiosInstance.ts:48-99`, which injects the `Authorization` header from `authSlice` state via an axios request interceptor (`src/lib/axiosInstance.ts:16-27`).
5. On `401` response, the response interceptor calls `setReset()` on `authSlice`, effectively logging the user out (`src/lib/axiosInstance.ts:30-42`).
6. Data returned is cached by React Query (`QueryClient` created once in `src/App.tsx`) and rendered via feature components / shared `DataTable`.

### Role-Based Dashboard Flow

1. `useUserRole` (`src/hooks/useUserRole.ts`) derives the current role from `authSlice`'s user object, falling back to a persisted `localStorage["auth"]` value if the store hasn't hydrated yet.
2. `getDashboardConfig(userRole)` (`src/config/dashboardConfig.ts`) returns a role-keyed config describing which dashboard modules/tabs/cards are visible.
3. `RoleBasedDashboard` (`src/components/layouts/RoleBasedDashboard/index.tsx`) reads this config and conditionally renders tab views (`ContractsTabView.tsx`, `VendorContractsView.tsx`) and analytics cards (`src/components/layouts/RoleBasedDashboard/analytics/*.tsx`).
4. `useDashboardData` (`src/hooks/useDashboardData.ts`) fetches and transforms analytics data (via `src/lib/dashboardDataTransformer.ts`) feeding the cards.

**State Management:**
- Server/remote data: owned by React Query per-hook, not centralized.
- Auth/session: `zustand` store (`authSlice.ts`), persisted via `zustand/middleware persist` to localStorage, read directly in non-React code (axios interceptors) via `storeFunctions.getState()`.
- One cross-page ephemeral form slice: `solicitationFileSlice.ts` (shared Zustand store for in-progress solicitation file uploads across multi-step flows).
- Everything else: local component state (`useState`) or React Hook Form (`react-hook-form` + `yup`/`@adexdsamson/forge-validation`).

## Key Abstractions

**Forge form wrapper:**
- Purpose: Wraps `react-hook-form`'s `FormProvider` to standardize form field registration/validation across the app.
- Examples: used throughout `src/pages/*/components/*Dialog.tsx` and multi-step wizards (Create Contract, Create MSA).
- Pattern: `@adexdsamson/forge` + `@adexdsamson/forge-validation`; see memory notes on Forge traps (formContext vs control, leaf-inject, memo-frozen closures).

**Role-scoped API module:**
- Purpose: Encodes "what can this role do against this resource" directly in the data-access layer instead of a generic client.
- Examples: `src/pages/ContractManagementPage/api/{approverApi,companyAdminApi,contractManagerApi,vendorApi,viewOnlyApi}.ts`
- Pattern: Same resource (contracts), 5 different API modules selected by the caller based on `useUserRole()`.

**AuthorityGuard:**
- Purpose: Single choke point enforcing "is this user allowed to see this route" before any page-level code runs.
- Examples: `src/components/layouts/AuthorityGuard/index.tsx`, used by every route via `ProtectedRoute`.
- Pattern: HOC/wrapper component, not middleware — runs client-side only.

**DataTable:**
- Purpose: Shared tabular list rendering (sorting, pagination) built on `@tanstack/react-table`.
- Examples: `src/components/layouts/DataTable`, consumed by nearly every `*ManagementPage/index.tsx`.

## Entry Points

**Application bootstrap:**
- Location: `src/main.tsx`
- Triggers: Vite's `index.html` root script tag.
- Responsibilities: Mounts `<App />` into `#root` inside `React.StrictMode`.

**App shell:**
- Location: `src/App.tsx`
- Triggers: Rendered by `main.tsx`.
- Responsibilities: Initializes Sentry, creates the single `QueryClient` and `createBrowserRouter(routes)`, wraps the tree in `HelmetProvider`/`ThemeProvider`/`QueryClientProvider`, mounts the global `AIChatWidget` and `Toaster`.

**Route table:**
- Location: `src/routes/index.tsx`
- Triggers: Consumed by `createBrowserRouter` in `App.tsx`.
- Responsibilities: Declarative map of every URL to its page component and guard (`PublicRoute` vs `ProtectedRoute`).

## Architectural Constraints

- **Threading:** Single-threaded browser SPA; no web workers observed except the Yjs/collaboration stack (`y-websocket`, `y-indexeddb`) inside `CollaborationToolPage`.
- **Global state:** Two zustand stores are true global singletons: `src/store/authSlice.ts` (session) and `src/store/solicitationFileSlice.ts` (in-progress solicitation file data, described in memory as a shared store consumed across multiple wizard steps). The axios interceptor layer reads `authSlice` outside React via `storeFunctions.getState()` — be careful mutating this shape since it's a non-React consumer.
- **Circular imports:** None flagged during exploration; feature folders are largely self-contained and import from `src/lib`, `src/components`, `src/hooks` (one direction), not from each other.
- **Role-branch duplication:** Because API access is role-branched at the module level (see Key Abstractions), features that need "always check both PM and vendor" logic must explicitly pair role checks — the memory log documents this as a recurring bug source (binary dispatch hiding a role, e.g. `feedback_role_branched_api_dispatch.md`).

## Anti-Patterns

### Role logic re-derived per-component instead of centralized

**What happens:** Several page components independently branch on `user.role.name` inline rather than consistently calling `useUserRole()`/`hasRole()`.
**Why it's wrong:** Leads to drift where PM-equivalent-to-vendor semantics get missed in one component but not another (documented repeatedly in project memory, e.g. `feedback_vendor_role_means_pm_in_transcripts.md`, `project_contract_role_guards.md`).
**Do this instead:** Always resolve role via `src/hooks/useUserRole.ts` and prefer `hasAnyRole([...])` over manual string comparisons; when adding a vendor-only check, pair it with the equivalent PM check (per `feedback_role_guards.md`).

### Truthiness checks on module/feature flags

**What happens:** Some code gates dashboard modules with `flag === true` instead of a general truthy check.
**Why it's wrong:** Backend sometimes returns non-boolean truthy values for flags; strict equality silently disables a module (`feedback_module_flags_truthy_not_strict_equality.md`).
**Do this instead:** Gate on truthiness (`if (flag)`), not strict equality, when consuming BE-provided module/feature flags — see `src/config/dashboardConfig.ts` consumers.

## Error Handling

**Strategy:** Combination of route-level error boundaries (`errorElement` on router branches), a global Sentry integration, and per-request axios interceptor handling for auth failures.

**Patterns:**
- Route-level: `errorElement: <NotFound />` (public branch) and `errorElement: <RouteErrorFallback />` (dashboard branch) in `src/routes/index.tsx`.
- Component-level: `ErrorFallback` from `src/components/layouts/Error` wraps the whole app tree conceptually (imported in `App.tsx`).
- HTTP-level: 401 responses trigger `setReset()` (logout) via the axios response interceptor (`src/lib/axiosInstance.ts:30-42`); other errors are generally surfaced via `sonner` toasts at the call site (React Query `onError` callbacks in individual hooks/components).
- Observability: Sentry initialized in `App.tsx` with browser tracing + session replay integrations.

## Cross-Cutting Concerns

**Logging:** Sentry (`@sentry/react`) for error/performance/session-replay telemetry; ad hoc `console.log` in zustand `logger` middleware only in dev mode (`src/store/authSlice.ts`).

**Validation:** `yup` schemas combined with `@hookform/resolvers` and `@adexdsamson/forge-validation`, wired through Forge-wrapped `react-hook-form` forms.

**Authentication:** Token/user/authorities held in `authSlice` (zustand, persisted to localStorage), injected into every request by the axios interceptor, and checked per-route by `AuthorityGuard`.

---

*Architecture analysis: 2026-07-22*
