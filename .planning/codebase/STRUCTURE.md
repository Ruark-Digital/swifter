# Codebase Structure

**Analysis Date:** 2026-07-22

## Directory Layout

```
swifter/
├── src/
│   ├── main.tsx              # React root bootstrap
│   ├── App.tsx                # App shell: Sentry init, QueryClient, router, providers
│   ├── App.test.tsx
│   ├── types.ts               # Shared app-wide TypeScript types (User, etc.)
│   ├── routes/                # Route table + guards
│   │   ├── index.tsx
│   │   ├── PrivateRoute.tsx
│   │   └── PublicRoute.tsx
│   ├── layouts/                # Top-level page chrome (not feature-specific)
│   │   ├── AuthLayout.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── NotFound.tsx
│   ├── pages/                  # Feature-folder modules, one per business domain
│   │   ├── <Feature>Page/
│   │   │   ├── index.tsx              # List/landing view
│   │   │   ├── <Feature>DetailPage.tsx
│   │   │   ├── api/                   # Feature-scoped HTTP calls (often role-branched)
│   │   │   ├── components/            # Feature-local UI (dialogs, sheets, tables, cards)
│   │   │   ├── lib/                   # Feature-local helpers/transformers
│   │   │   ├── utils/                 # Feature-local pure utils
│   │   │   └── __tests__/             # Playwright e2e specs + vitest unit specs
│   │   ├── ContractManagementPage/
│   │   ├── MsaPage/
│   │   ├── SolicitationManagementPage/
│   │   ├── VendorManagementPage/
│   │   ├── EvaluationManagementPage/
│   │   ├── ProjectManagementPage/
│   │   ├── CompaniesPage/
│   │   ├── AdminManagementPage/
│   │   ├── UserManagementPage/
│   │   ├── SubscriptionsPage/
│   │   ├── SystemLogPage/
│   │   ├── PortalSettingsPage/
│   │   ├── CommunicationManagementPage/
│   │   ├── CollaborationToolPage/     # TipTap/Yjs/Yoopta document editor
│   │   ├── OnboardingPage/
│   │   ├── InvitationsPage/
│   │   ├── BusinessDivisionsPage/
│   │   ├── ProfilePage/
│   │   ├── SettingsPage/
│   │   ├── Login.tsx / ForgotPasswordPage / ResetPasswordPage
│   │   ├── DashboardPage.tsx          # Role-based landing dashboard
│   │   ├── PrivacyPolicyPage / TermsConditionsPage / DisclaimerPage / ContactUsPage
│   │   └── __tests__/                 # Cross-page/dashboard-level specs
│   ├── components/
│   │   ├── ui/                        # Radix/shadcn-style primitives (button, dialog, sheet, table...)
│   │   ├── layouts/                    # Composite shared widgets
│   │   │   ├── DataTable/
│   │   │   ├── ConfirmAlert/
│   │   │   ├── ExportReportSheet/
│   │   │   ├── FormInputs/
│   │   │   ├── AuthorityGuard/         # Route access-control wrapper
│   │   │   ├── AIChatWidget/
│   │   │   ├── RoleSwitcher/
│   │   │   ├── Error/
│   │   │   ├── Container/
│   │   │   ├── Footer.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   ├── SolicitationFilters.tsx
│   │   │   └── RoleBasedDashboard/     # Role-conditional dashboard shell + analytics cards
│   │   └── SEO/
│   ├── hooks/                          # Shared cross-feature hooks
│   │   ├── useAuthentication          (dir)
│   │   ├── useUserRole.ts
│   │   ├── useDashboardData.ts
│   │   ├── useVendorContractStats.ts
│   │   ├── useAIChat.ts
│   │   ├── useGoBack.ts
│   │   ├── useInactivityLogout.ts
│   │   ├── useLazyQuery            (dir)
│   │   ├── useProviders            (dir)
│   │   ├── useToaster              (dir)
│   │   ├── use-file-upload.ts
│   │   ├── use-mobile.tsx
│   │   ├── useUserQueryKey.ts
│   │   └── __tests__/
│   ├── lib/                            # Shared framework-agnostic utilities
│   │   ├── axiosInstance.ts            # Singleton axios client + interceptors
│   │   ├── utils.ts                    # cn() / generic helpers
│   │   ├── currencyUtils.ts
│   │   ├── chartColorUtils.ts
│   │   ├── dashboardDataTransformer.ts
│   │   ├── contractFormValues.ts
│   │   ├── evaluationStatusUtils.ts
│   │   ├── solicitationStatusUtils.ts
│   │   ├── fileToMarkdown.ts / markdownToYoopta.ts / fileToYoopta.ts / fileUtils.tsx
│   │   ├── moduleFlags.ts
│   │   ├── navigation.ts
│   │   ├── pruneEmptyValuesDeep.ts
│   │   ├── lazyWithRetry.ts
│   │   └── __tests__/
│   ├── store/                          # Global Zustand slices (session + one shared form slice)
│   │   ├── authSlice.ts
│   │   └── solicitationFileSlice.ts
│   ├── config/
│   │   ├── index.ts                    # Base URL / env config
│   │   └── dashboardConfig.ts          # Role-keyed dashboard module config
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── demo/                           # Demo/sample data for Create Contract flow, etc.
│   └── assets/
├── public/                             # Static assets served as-is
├── docs/                               # Product docs, bug reports, plans
├── .planning/                          # GSD planning artifacts (codebase maps, phase plans)
├── .qa/                                 # QA harness: driver.mjs (Playwright), worklists, reports
├── memory/                              # Auto-memory notes (persisted context)
├── swagger.json                        # Backend API spec (source of truth for endpoints)
├── vite.config.ts                       # Vite build config (`@` alias → `src/`)
├── vitest.config.ts / vitest.setup.ts   # Unit test runner config
├── playwright.config.ts                 # E2E test runner config
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── tailwind.config.js / postcss.config.js
├── components.json                      # shadcn/ui component generator config
└── amplify.yml                          # AWS Amplify build/deploy config
```

## Directory Purposes

**`src/pages/<Feature>Page/`:**
- Purpose: Self-contained vertical slice for one business domain.
- Contains: List page (`index.tsx`), detail page(s), `api/`, `components/`, `lib/`, `utils/`, `__tests__/`.
- Key files: `api/*Api.ts` (role-branched HTTP), `<Feature>DetailPage.tsx` (tabbed detail view).

**`src/components/ui/`:**
- Purpose: Low-level, styling-only, feature-agnostic UI primitives (shadcn/Radix wrappers).
- Contains: `button.tsx`, `dialog.tsx`, `sheet.tsx`, `table.tsx`, `input.tsx`, etc. (43 files).
- Key files: none feature-specific — treat as a design-system layer.

**`src/components/layouts/`:**
- Purpose: Composite, reusable widgets that combine multiple `ui/` primitives with app logic.
- Contains: `DataTable/`, `ConfirmAlert/`, `ExportReportSheet/`, `FormInputs/`, `RoleBasedDashboard/`, `AuthorityGuard/`, `AIChatWidget/`, `RoleSwitcher/`, `Error/`.
- Key files: `AuthorityGuard/index.tsx` (route gating), `RoleBasedDashboard/index.tsx` (dashboard shell).

**`src/hooks/`:**
- Purpose: Cross-feature reusable React hooks.
- Contains: auth/role hooks, dashboard-data hooks, misc utility hooks (mobile detection, toaster, lazy query).
- Key files: `useUserRole.ts`, `useAuthentication/`, `useDashboardData.ts`.

**`src/lib/`:**
- Purpose: Framework-agnostic helper functions and the HTTP client singleton.
- Contains: axios wrapper, currency/date/chart utilities, file-format converters (docx/markdown/Yoopta), module-flag helpers.
- Key files: `axiosInstance.ts` (all HTTP traffic goes through this).

**`src/store/`:**
- Purpose: Global Zustand state — kept intentionally minimal.
- Contains: `authSlice.ts` (session/user/token/authorities, persisted), `solicitationFileSlice.ts` (shared multi-step form state for solicitation file uploads).

**`src/config/`:**
- Purpose: App-wide configuration values and role-based feature config.
- Contains: `index.ts` (base URL/env), `dashboardConfig.ts` (per-role dashboard module visibility).

**`src/routes/` and `src/layouts/`:**
- Purpose: URL-to-component mapping and top-level page chrome.
- Contains: route table, guard wrappers, auth/dashboard shell layouts (sidebar, header).

**`.qa/`:**
- Purpose: Manual/automated QA tooling used during bug-fix cycles.
- Contains: `driver.mjs` (Playwright-based browser driver for live probing since the in-app browser can't screenshot SwiftPro), worklists (`BE-worklist-*.md`), `probe-run.mjs`, `reports/`, `screenshots/`, `snapshots/`.
- Not part of the shipped app; do not import from `src/`.

**`.planning/`:**
- Purpose: GSD command artifacts — codebase maps (this directory), phase plans, quick-task notes.

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React DOM root render.
- `src/App.tsx`: App shell — Sentry init, QueryClient, router creation, global providers/widgets.
- `src/routes/index.tsx`: Full route table.

**Configuration:**
- `vite.config.ts`: Build config, defines `@` → `src/` path alias.
- `src/config/index.ts`: Runtime config (API base URL from env).
- `src/config/dashboardConfig.ts`: Role-keyed dashboard module/tab config.
- `.env.local` / `.env.example`: Environment variables (never read contents — see forbidden files policy).
- `components.json`: shadcn/ui generator config (defines where new `ui/` components get scaffolded).
- `tailwind.config.js`, `postcss.config.js`: Styling pipeline config.

**Core Logic:**
- `src/lib/axiosInstance.ts`: Singleton HTTP client, auth header injection, 401 → logout.
- `src/store/authSlice.ts`: Session state (zustand, persisted).
- `src/hooks/useUserRole.ts`: Role derivation + role-check helpers.
- `src/components/layouts/AuthorityGuard/index.tsx`: Route-level authorization gate.
- `src/pages/<Feature>Page/api/*.ts`: Per-feature, per-role HTTP call modules.

**Testing:**
- `src/pages/<Feature>Page/__tests__/`: Feature-scoped Playwright e2e specs (`*.spec.ts`) and vitest unit specs (`*.test.ts(x)`, `*.unit.spec.ts`).
- `src/pages/__tests__/`: Cross-page/dashboard-level specs (e.g. `dashboard-contract-manager.spec.ts`).
- `src/hooks/__tests__/`, `src/lib/__tests__/`: Unit tests for shared hooks/utilities.
- `playwright.config.ts`: E2E runner config; `vitest.config.ts` + `vitest.setup.ts`: unit runner config.

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g. `ContractDetailPage.tsx`, `AmendmentsTable.tsx`).
- Hooks: `camelCase.ts` prefixed with `use` (e.g. `useUserRole.ts`, `useDashboardData.ts`).
- API modules: `camelCase` + `Api.ts` suffix, prefixed by role/scope (e.g. `contractManagerApi.ts`, `vendorApi.ts`, `viewOnlyApi.ts`).
- Utility/lib files: `camelCase.ts` (e.g. `currencyUtils.ts`, `dashboardDataTransformer.ts`).
- Tests: `<subject>.spec.ts` for Playwright e2e, `<subject>.test.ts(x)` or `<subject>.unit.spec.ts` for vitest unit tests. QA-ticket-tagged tests use a `qaNN-` or `adeNN-` prefix tied to a tracked issue number (e.g. `ade85-manager-approve-change-url.unit.spec.ts`, `qa78-item2-assign-pm.spec.ts`).

**Directories:**
- Feature pages: `<Feature>ManagementPage` or `<Feature>Page` (PascalCase), always under `src/pages/`.
- Shared UI: `ui/` (primitives, lowercase files) vs `layouts/` (composite widgets, PascalCase dirs) under `src/components/`.
- Test directories: always `__tests__/` co-located inside the feature/module they test, never a separate top-level test tree.

## Where to Add New Code

**New Feature/Business Domain:**
- Create `src/pages/<Feature>Page/` with `index.tsx`, `<Feature>DetailPage.tsx` (if needed), `api/`, `components/`, `__tests__/`.
- Register routes in `src/routes/index.tsx` under the `/dashboard` branch, wrapped in `ProtectedRoute`.
- If the feature needs role-branched access, follow the pattern in `src/pages/ContractManagementPage/api/` (separate module per role) rather than branching inside a single API function.

**New Shared UI Component:**
- Pure styling primitive with no app logic → `src/components/ui/` (use `components.json`/shadcn generator conventions).
- Composite widget combining logic + primitives, reused across ≥2 features → `src/components/layouts/`.
- Component used by only one feature → keep it in that feature's `components/` folder, not in shared layers.

**New Shared Hook:**
- `src/hooks/` if reused across ≥2 features; otherwise keep it feature-local (e.g. `src/pages/<Feature>Page/hooks/` if such a folder exists, or inline in the feature's components).

**New Utility Function:**
- Framework-agnostic, reusable helper → `src/lib/`.
- Feature-specific transform/helper → `src/pages/<Feature>Page/lib/` or `utils/`.

**New Global State:**
- Avoid adding to `zustand` unless the state is truly cross-cutting (session-like or spans multiple wizard steps/pages) — the codebase deliberately keeps only two global slices (`authSlice`, `solicitationFileSlice`). Prefer React Query for server state and local `useState`/React Hook Form for form state.

**New Test:**
- Co-locate in the nearest `__tests__/` directory to the code under test.
- Tag QA-ticket-driven tests with the issue number prefix (`qaNN-` / `adeNN-`) to keep traceability to the QA worklist.

## Special Directories

**`.qa/`:**
- Purpose: Manual QA tooling (Playwright driver script, worklists, screenshots/snapshots from live probing sessions).
- Generated: Partially (screenshots/reports are generated; worklists/driver are authored).
- Committed: Yes (tracked in git per current `git status`).

**`dist/`, `playwright-report/`, `test-results/`:**
- Purpose: Build output and test-run artifacts.
- Generated: Yes.
- Committed: No (build/test output, should be gitignored).

**`.planning/`:**
- Purpose: GSD orchestration artifacts (codebase maps, phase plans).
- Generated: Yes (by GSD commands), but committed to track planning history.
- Committed: Yes.

**`memory/`:**
- Purpose: Claude auto-memory notes capturing prior QA findings, architectural decisions, and traps discovered during past sessions.
- Generated: Yes (by Claude memory system).
- Committed: Yes.

**`docs/`:**
- Purpose: Product documentation, bug reports, and plan documents (including `.docx` transcripts).
- Generated: No (authored/uploaded).
- Committed: Yes.

---

*Structure analysis: 2026-07-22*
