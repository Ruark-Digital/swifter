<!-- refreshed: 2026-05-17 -->
# Architecture

**Analysis Date:** 2026-05-17

## System Overview

Swifter is a React 18 + TypeScript + Vite single-page app for procurement, contract, and MSA management. It is multi-tenant and heavily role-aware: every domain page renders different controls and consumes different API modules depending on the authenticated user's role (vendor, approver, contract_manager, procurement, project_manager, company_admin, super_admin, evaluator, view_only).

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  App Shell  `src/App.tsx`                                                │
│  HelmetProvider → ThemeProvider → Sentry.ErrorBoundary →                 │
│  QueryClientProvider → Suspense → RouterProvider → Toaster               │
│  (conditional) AIChatWidget when user.isAi && isAuthenticated            │
└────────────────────────┬─────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Router  `src/routes/index.tsx` (createBrowserRouter)                    │
│  ┌──────────────────────────┐   ┌──────────────────────────────────┐    │
│  │ PublicRoute              │   │ ProtectedRoute (PrivateRoute)    │    │
│  │ `src/routes/PublicRoute` │   │ `src/routes/PrivateRoute.tsx`    │    │
│  │   → AuthLayout           │   │   → Dashboard layout              │    │
│  │   `src/layouts/AuthLayout│   │   `src/layouts/Dashboard.tsx`    │    │
│  └──────────────────────────┘   └────────────────┬─────────────────┘    │
│                                                  │                       │
│                                                  ▼                       │
│                              Domain pages under `src/pages/*`            │
└─────────────────────────┬───────────────────────┬────────────────────────┘
                          │                       │
                          ▼                       ▼
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│  Server state                    │   │  Client state                    │
│  @tanstack/react-query           │   │  Zustand (persisted)             │
│  - axios via `src/lib/axios`     │   │  - `src/store/authSlice.ts`      │
│  - role-prefix endpoints         │   │  - `src/store/solicitationFile…` │
│    (manager/vendor/approver/user)│   │                                  │
└──────────────────┬───────────────┘   └──────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Backend API (dev.swiftpro.tech / api.swiftpro.tech)                     │
│  Phase-2 route map: `docs/API_DOCUMENTATION_PHASE_2.md`                  │
│  Same domain entity ⇒ four parallel prefixes:                            │
│    /contract/manager/*   (contract_manager, procurement)                 │
│    /contract/vendor/*    (vendor, project_manager)                       │
│    /contract/approver/*  (approver)                                      │
│    /contract/user/*      (evaluator, view_only)                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App shell | Wires providers, router, Sentry, AI widget, toast | `src/App.tsx` |
| Router config | Declarative route tree (currently eager imports, no `React.lazy`) | `src/routes/index.tsx` |
| Auth gate | Redirects unauthenticated users; reads token from Zustand | `src/routes/PrivateRoute.tsx` |
| Public gate | Inverse of PrivateRoute — redirects authed users away from login | `src/routes/PublicRoute.tsx` |
| Auth state | Zustand store persisted under `localStorage["auth"]` | `src/store/authSlice.ts` |
| Role hook | Derives `userRole` + boolean flags + dashboard config | `src/hooks/useUserRole.ts` |
| Theme | Light/dark/system theme via context + tailwind classes | `src/contexts/ThemeContext.tsx` |
| Dashboard shell | Header + Sidebar + `<Outlet/>` for authenticated routes | `src/layouts/Dashboard.tsx`, `src/layouts/Sidebar.tsx`, `src/layouts/Header.tsx` |
| SEO wrapper | Per-page title/meta via react-helmet-async | `src/components/SEO/SEOWrapper.tsx`, `src/hooks/useSEO.ts` |
| Axios instance | Base URL, auth header injection, 401 handling | `src/lib/axiosInstance.ts` |
| AI chat | Floating widget streaming via MCP server SSE | `src/components/layouts/AIChatWidget/index.tsx`, integration in `src/App.tsx` |

## Pattern Overview

**Overall:** Feature-folder SPA. Each domain (Contract, MSA, Solicitation, Collaboration, …) is a self-contained subtree under `src/pages/<Domain>Page/` with `index.tsx` (list view), `*DetailPage.tsx`, `layouts/<TabName>.tsx` for tabs, and `components/` for dialogs/tables/stat cards. Cross-cutting primitives live under `src/components/`.

**Key Characteristics:**
- Server state via react-query; mutations colocated with their consuming page or under `src/pages/<Domain>/api/`.
- Client state minimal — only auth + an occasional file slice; everything else is server-derived.
- Role determines both UI and the API module called; the role hook is the single source of truth (`src/hooks/useUserRole.ts`).
- shadcn/ui primitives under `src/components/ui/` are unmodified Radix wrappers; domain composition lives in `src/components/layouts/`.
- Tailwind for styling, with explicit dark-mode variants. Theme respected via `dark:` class variants.

## Layers

**Routing / Shell layer:**
- Location: `src/App.tsx`, `src/routes/`, `src/layouts/`
- Owns global providers, route guards, and authenticated chrome (sidebar, header).

**Page layer:**
- Location: `src/pages/<Domain>Page/`
- Each domain owns: `index.tsx` (list + filters), one or more `*DetailPage.tsx`, `layouts/<TabName>.tsx` per detail tab, `components/` (dialogs, tables, stat cards), optional `api/` (role-prefixed clients), optional `hooks/`, `__tests__/`.

**Cross-cutting components:**
- `src/components/ui/`: shadcn/Radix primitives (Button, Dialog, Table, Tabs, Sheet, Popover, …).
- `src/components/layouts/`: domain-aware reusable layouts — `DataTable`, `FormInputs`, `RoleBasedDashboard`, `AuthorityGuard`, `ConfirmAlert`, `Container`, `ExportReportSheet`, `RoleSwitcher`, `AIChatWidget`, `SolicitationFilters`, `SearchInput`, `Footer`, `Error`.

**State / data layer:**
- `src/store/authSlice.ts` — Zustand + persist middleware; selector hooks via `auto-zustand-selectors-hook`.
- `src/store/solicitationFileSlice.ts` — transient solicitation upload state.
- react-query `QueryClient` configured in `App.tsx` with `staleTime: 30000`.

**Lib / utilities:**
- `src/lib/axiosInstance.ts` — single configured axios; all API modules import from here.
- `src/lib/dashboardDataTransformer.ts`, `src/lib/chartColorUtils.ts`, `src/lib/solicitationStatusUtils.ts`, `src/lib/currencyUtils.ts` — pure transforms for chart/dashboard adapters.
- `src/lib/fileToMarkdown.ts`, `src/lib/fileToYoopta.ts`, `src/lib/markdownToYoopta.ts` — collaboration tool conversions.

## Data Flow

### Primary request path (any domain list)

1. User navigates → `RouterProvider` resolves a route in `src/routes/index.tsx`.
2. `ProtectedRoute` reads token from `useToken()` (`src/store/authSlice.ts`) and gates render.
3. `Dashboard` layout renders sidebar/header + `<Outlet/>`.
4. Page mounts (e.g. `src/pages/ContractManagementPage/index.tsx`) and calls `useUserRole()` to pick the correct API module from `src/pages/ContractManagementPage/api/`.
5. react-query `useQuery` issues the call through `src/lib/axiosInstance.ts`; axios adds the bearer token from the auth store.
6. Server returns role-shaped payload; page renders shadcn tables/cards via `src/components/layouts/DataTable`.

### Role-prefixed API convention

Same logical endpoint, four prefixes (see `docs/API_DOCUMENTATION_PHASE_2.md`):

```
/contract/manager/<resource>     ← contract_manager, procurement, company_admin, super_admin
/contract/vendor/<resource>      ← vendor, project_manager
/contract/approver/<resource>    ← approver
/contract/user/<resource>        ← evaluator, view_only
```

Page-level API modules (e.g. `src/pages/ContractManagementPage/api/{contractManagerApi,vendorApi,approverApi,viewOnlyApi,companyAdminApi}.ts`) each implement one prefix; the page picks the right module based on `useUserRole()` flags. Note: `project_manager` is treated as a vendor-like role — see memory `project_contract_role_guards`.

### Auth flow

1. `Login` (`src/pages/Login.tsx`) posts credentials; on success calls `useSetUser`, `useSetToken`, `useSetRefreshToken`, `useSetAuthorities`.
2. Zustand persists `{ user, token, refresh, authorities }` to `localStorage["auth"]`.
3. `useAuthentication` (`src/hooks/useAuthentication/`) derives boolean auth state from token presence.
4. `useInactivityLogout` (`src/hooks/useInactivityLogout.ts`) calls `useSetReset()` after idle timeout.
5. Axios interceptors in `src/lib/axiosInstance.ts` attach the bearer header and clear state on 401.

### Collaboration (Yoopta + y-websocket)

`src/pages/CollaborationToolPage/` runs a Yoopta editor backed by `y-websocket` for real-time presence. The editor instance is published upward via `onEditorReady` from `EditorPanel.tsx`; the sidebar (`SidebarPanel.tsx`) renders Comments / Redline / Versions tabs. Comment persistence uses `/contract/file-comment/{fileId}` (see `useFileComments.ts`).

### AI chat (MCP integration)

`src/App.tsx` injects `AIChatWidget` for users with `user.isAi`. It POSTs to `https://dev.swiftpro.tech/chat/<role>` (role-mapped) with SSE streaming. The stream uses named events `content`, `tool_start`, `tool_cached`, `tool_result`, `tool_error`. Reset hits `/chat/reset` with `{ userToken }`. See memory `project_mcp_chat_integration`.

## Key Abstractions

**`useUserRole()` (`src/hooks/useUserRole.ts`):**
- Returns `{ userRole, dashboardConfig, hasRole, hasAnyRole, hasAllRoles, isEvaluator, isVendor, isProjectManager, isApprover, isViewOnly, isCompanyAdmin, isSuperAdmin, isProcurement, isManager, isAdmin, canManageUsers, canManageCompanies, canEvaluate, canSubmitProposals, canManageSolicitations }`.
- `isManager` is `contract_manager OR procurement`. There is no `isContractManager` boolean; combine with `isProcurement` if needed.
- Falls back to `localStorage["auth"]` on cold render so role is stable before user is rehydrated.

**`DataTable` (`src/components/layouts/DataTable/index.tsx`):**
- Generic table with pagination, sub-rows, classNames slot for dark-mode tuning (see memory `project_contract_dark_mode_patterns`).

**`RoleBasedDashboard` (`src/components/layouts/RoleBasedDashboard/`):**
- Composes analytics cards by role; cards under `analytics/` consume `useDashboardData()` transformed via `src/lib/dashboardDataTransformer.ts`.

**`AuthorityGuard` (`src/components/layouts/AuthorityGuard/`):**
- Conditional render based on `authorities` array from auth slice.

**`SEOWrapper` (`src/components/SEO/SEOWrapper.tsx`):**
- Wraps a page with `<Helmet>` title/description; pages call it directly or via `useSEO`.

## Entry Points

**`src/main.tsx`:**
- Renders `<App/>` into `#root`.

**`src/App.tsx`:**
- Initializes Sentry, builds the QueryClient (staleTime 30s), constructs `createBrowserRouter(routes)`, mounts AI widget conditionally.

**`src/routes/index.tsx`:**
- Declarative route tree. Two top-level branches: public (`AuthLayout` + login/forgot/reset/onboarding/legal) and protected (`Dashboard` + every domain page).

## Architectural Constraints

- **No code-splitting yet:** Routes import pages eagerly. Adding `React.lazy` + `Suspense` boundaries is a known future optimization (the App shell already has a `Suspense` wrapping `RouterProvider`).
- **Single axios instance:** All HTTP must go through `src/lib/axiosInstance.ts` so auth header + base URL stay consistent.
- **Auth persisted under `localStorage["auth"]`:** Reading or mutating this key outside `authSlice.ts` is forbidden — `useUserRole` is the only sanctioned reader.
- **Role prefix discipline:** Never call a role's endpoint from another role's UI branch. Always pick the API module via `useUserRole()` flags.
- **PM ≡ Vendor in contract domain:** Any contract-side guard that checks `isVendor` must also include `isProjectManager` (helper `isContractVendorLike`). See memory `project_contract_role_guards`.
- **MSA list keys on `id`, not `_id`:** `/contract/msa-contract` returns `id`; row mapping must `id ?? _id ?? ""`. Memory `project_msa_list_id_shape`.
- **File size from upload must be the server-returned string:** Use `res.data.data[0].size`, not `file.size`. Memory `feedback_file_size_string`.

## Anti-Patterns

### Standalone `isVendor` check on contract pages

**What happens:** Code branches on `isVendor` only, hiding the feature from project managers.
**Why it's wrong:** PMs share the vendor API surface and UI affordances in the contract domain.
**Do this instead:** Use `isContractVendorLike = isVendor || isProjectManager` (see the helper used across `src/pages/ContractManagementPage/`).

### Reading the auth store outside `authSlice` selectors

**What happens:** Components call `JSON.parse(localStorage.getItem("auth"))` ad hoc.
**Why it's wrong:** Bypasses Zustand reactivity and breaks role refresh.
**Do this instead:** Use the exported hooks `useUser`, `useToken`, `useAuthorities` from `src/store/authSlice.ts`. The single exception is `useUserRole`, which does a guarded fallback read for cold-render stability.

### Calling endpoints without the correct role prefix

**What happens:** Hardcoding `/contract/manager/...` from a vendor-side page.
**Why it's wrong:** Server rejects with 403 in production but may pass locally with elevated tokens, masking the bug.
**Do this instead:** Pick the right API module under `src/pages/<Domain>/api/` via `useUserRole()`.

## Error Handling

**Strategy:** Top-level Sentry `ErrorBoundary` (`src/App.tsx`) renders `ErrorFallback` (`src/components/layouts/Error`). Route-level errors fall through to `NotFound` (`src/layouts/NotFound.tsx`) via `errorElement` on the root route. Mutations surface failures via the toast system (`src/components/ui/toaster.tsx`, hook in `src/hooks/useToaster/`).

**Patterns:**
- Try/catch around fetch in `App.tsx` for AI chat streaming.
- react-query `onError` callbacks push to toaster.
- 401 responses clear auth via `useSetReset` and redirect through `ProtectedRoute`.

## Cross-Cutting Concerns

**Logging:** Dev-only `console.log` inside the Zustand logger middleware (`src/store/authSlice.ts`). Production uses Sentry breadcrumbs/replay.
**Validation:** Yup schemas colocated with each step component (e.g. `Step1BasicInfo.tsx`, `Step3ValuePayments.tsx`); react-hook-form with `@hookform/resolvers/yup`.
**Authentication:** Bearer token in axios; persisted via Zustand `persist`; inactivity timeout via `useInactivityLogout`.
**Theming:** `ThemeProvider` (`src/contexts/ThemeContext.tsx`) with `defaultTheme="system"` and `storageKey="swiftpro-theme"`. Dark-mode classes follow the slate-900/800 palette documented in memory `project_contract_dark_mode_patterns`.
**SEO:** `react-helmet-async` via `HelmetProvider` in `App.tsx`; pages wrap with `SEOWrapper` or call `useSEO`.
**Telemetry:** Sentry browser tracing + session replay (10% session, 100% on error); DSN via `VITE_SENTRY_DSN`.

---

*Architecture analysis: 2026-05-17*
