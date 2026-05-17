# Codebase Structure

**Analysis Date:** 2026-05-17

## Directory Layout

```
swifter/
├── .planning/                 # GSD planning artifacts (this folder)
│   ├── codebase/              # Codebase maps (ARCHITECTURE.md, STRUCTURE.md, …)
│   └── quick/                 # Ad-hoc / one-off planning notes
├── .claude/                   # Claude Code settings + skills
├── .qa/                       # QA scripts and bug captures
├── .vscode/                   # Editor settings
├── docs/                      # Product + API docs
│   ├── API_DOCUMENTATION_PHASE_2.md  # Phase-2 route map (4 role prefixes)
│   ├── AI_CHAT_INTEGRATION.md
│   ├── DARK_MODE_GUIDE.md
│   ├── DATATABLE_SUBROWS_EXAMPLE.md
│   ├── DEVELOPER_ONBOARDING.md
│   ├── PROJECT_HANDOVER.md
│   ├── SEO_IMPLEMENTATION.md
│   ├── plans/                 # Multi-phase implementation plans
│   ├── bug report/
│   └── superpowers/
├── public/                    # Vite static assets
├── src/                       # Application source (see below)
├── reports/                   # Playwright / vitest report dumps
├── playwright-report/         # Latest e2e report
├── test-results/              # Playwright artifacts
├── dist/                      # Vite build output (gitignored conceptually)
├── node_modules/
├── AGENTS.md                  # Agent behavior notes (mirrors CLAUDE.md)
├── CLAUDE.md                  # Project-wide LLM rules
├── CODE_WIKI.md
├── README.md
├── amplify.yml                # AWS Amplify build config
├── components.json            # shadcn/ui config
├── index.html                 # Vite entry
├── package.json
├── playwright.config.ts
├── pnpm-lock.yaml
├── pnpm-workspace.yaml        # Carries `onlyBuiltDependencies` for pnpm 10
├── postcss.config.js
├── swagger.json               # Phase-2 OpenAPI snapshot
├── tailwind.config.js
├── tsconfig*.json
├── vite.config.ts
├── vitest.config.ts
└── vitest.setup.ts
```

**Note:** There is no top-level `mcp-server/` package in this repo. The MCP chat backend is a separate deployment at `https://dev.swiftpro.tech` (see `docs/AI_CHAT_INTEGRATION.md` and `src/App.tsx`).

## `src/` Layout

```
src/
├── main.tsx                   # Vite entry: renders <App/>
├── App.tsx                    # Provider stack + router + AI widget
├── providers.tsx              # (helper providers, if any)
├── index.css                  # Tailwind base
├── types.ts                   # Global types (UserRole union, User, etc.)
├── vite-env.d.ts
│
├── assets/                    # Static images / svgs imported by code
├── components/
│   ├── SEO/
│   │   ├── SEOWrapper.tsx     # <Helmet> wrapper
│   │   └── index.ts
│   ├── ui/                    # shadcn/Radix primitives (DO NOT modify)
│   │   ├── button.tsx  card.tsx  dialog.tsx  table.tsx  tabs.tsx
│   │   ├── sheet.tsx  popover.tsx  sidebar.tsx  toast.tsx  toaster.tsx
│   │   ├── theme-toggle.tsx  empty-state.tsx  file-upload.tsx  chart.tsx
│   │   ├── DocumentViewer.tsx  PageLoader.tsx  Spinner.tsx
│   │   └── … (one file per primitive)
│   └── layouts/               # Domain-aware reusable composites
│       ├── AIChatWidget/      # Floating chat button + panel
│       ├── AuthorityGuard/    # Conditional render by authorities[]
│       ├── ConfirmAlert/
│       ├── Container/
│       ├── DataTable/         # Generic table with pagination + sub-rows
│       ├── Error/             # ErrorFallback for Sentry boundary
│       ├── ExportReportSheet/
│       ├── FormInputs/        # TextInput, CurrencyInput, etc.
│       ├── RoleBasedDashboard/
│       │   ├── analytics/     # Per-card components (Spend, Cycle, …)
│       │   ├── components/    # ChartCard, etc.
│       │   └── index.tsx
│       ├── RoleSwitcher/
│       ├── Footer.tsx
│       ├── SearchInput.tsx
│       └── SolicitationFilters.tsx
│
├── config/
│   ├── dashboardConfig.ts     # Role → dashboard card list mapping
│   └── index.ts
├── contexts/
│   └── ThemeContext.tsx       # light/dark/system theme provider
├── demo/                      # Sandbox / scratch components
├── hooks/
│   ├── __tests__/
│   ├── use-file-upload.ts
│   ├── use-mobile.tsx
│   ├── useAIChat.ts
│   ├── useAuthentication/     # Auth boolean + login helpers
│   ├── useDashboardData.ts
│   ├── useInactivityLogout.ts
│   ├── useLazyQuery/          # react-query lazy wrapper
│   ├── useProviders/
│   ├── useSEO.ts
│   ├── useToaster/
│   ├── useUserQueryKey.ts
│   └── useUserRole.ts         # ★ Single source of truth for role
├── layouts/                   # App-shell layouts (not page tab layouts)
│   ├── AuthLayout.tsx         # Public-route shell
│   ├── Dashboard.tsx          # Protected-route shell (sidebar+header+outlet)
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── NotFound.tsx
├── lib/
│   ├── __tests__/
│   ├── axiosInstance.ts       # ★ The only axios instance
│   ├── chartColorUtils.ts
│   ├── chartTransformerUsage.md
│   ├── contractFormValues.ts
│   ├── currencyUtils.ts
│   ├── dashboardDataTransformer.ts
│   ├── evaluationStatusUtils.ts
│   ├── fileToMarkdown.ts
│   ├── fileToYoopta.ts
│   ├── markdownToYoopta.ts
│   ├── fileUtils.tsx
│   ├── forge/                 # Form schema helpers
│   ├── navigation.ts
│   ├── pruneEmptyValuesDeep.ts
│   ├── solicitationStatusUtils.ts
│   └── utils.ts               # cn() and misc helpers
├── routes/
│   ├── index.tsx              # createBrowserRouter route tree
│   ├── PrivateRoute.tsx       # Token gate
│   └── PublicRoute.tsx        # Inverse gate
├── store/
│   ├── authSlice.ts           # Zustand + persist; selector hooks
│   └── solicitationFileSlice.ts
├── utils/                     # Misc utilities not yet promoted to lib/
│
└── pages/                     # Feature folders (see below)
```

## `src/pages/` — Domain Folders

Every domain follows the same shape: `index.tsx` (list), one or more `*DetailPage.tsx`, `layouts/<TabName>.tsx` per detail-page tab, `components/` for dialogs/tables/stat cards, optional `api/`, optional `hooks/`, `__tests__/`.

```
pages/
├── __tests__/                          # Cross-page tests
├── DashboardPage.tsx                   # Top-level dashboard (uses RoleBasedDashboard)
├── Login.tsx
├── Example.tsx                         # Scratch (not routed)
│
├── ContractManagementPage/             # ★ Largest domain
│   ├── index.tsx                       # List + filters + tabs
│   ├── ContractDetailPage.tsx          # Tabbed detail shell
│   ├── api/
│   │   ├── contractManagerApi.ts       # /contract/manager/*
│   │   ├── vendorApi.ts                # /contract/vendor/*  (also PM)
│   │   ├── approverApi.ts              # /contract/approver/*
│   │   ├── viewOnlyApi.ts              # /contract/user/*
│   │   └── companyAdminApi.ts          # Admin overlays
│   ├── layouts/                        # One file per detail tab
│   │   ├── OverviewTab.tsx
│   │   ├── AmendmentsTabContent.tsx
│   │   ├── ChangeTabContent.tsx
│   │   ├── ClaimsTabContent.tsx
│   │   ├── ClauseLibraryTabContent.tsx
│   │   ├── ComplianceTabContent.tsx
│   │   ├── DeliverablesTabContent.tsx
│   │   ├── DocumentsTabContent.tsx
│   │   ├── InvoiceTabContent.tsx
│   │   ├── KpiTabContent.tsx
│   │   ├── LemTabContent.tsx
│   │   ├── NcrLogTabContent.tsx
│   │   ├── PaymentSummaryTabContent.tsx
│   │   ├── RateSheetsTabContent.tsx
│   │   ├── RfiTabContent.tsx
│   │   ├── ApproversTabContent.tsx
│   │   ├── ActionLogTabContent.tsx
│   │   ├── VendorReportsTabContent.tsx
│   │   └── AnalyticsTabContent.tsx
│   ├── components/                     # Dialogs, tables, stat cards, wizard steps
│   │   ├── CreateContractSheet.tsx
│   │   ├── EditContract.tsx
│   │   ├── ContractsTable.tsx
│   │   ├── ApproversTable.tsx
│   │   ├── Step1BasicInfo.tsx … Step4Timeline.tsx   # Create-contract wizard
│   │   ├── *StatsCards.tsx             # Per-tab stat row
│   │   ├── *Table.tsx                  # Per-tab DataTable wrappers
│   │   ├── *DetailsSheet.tsx           # Slide-over per row
│   │   ├── Create*Dialog.tsx           # Mutation dialogs
│   │   ├── LabelItem.tsx               # ★ Universal field-row primitive
│   │   ├── DocumentItem.tsx, DocumentsList.tsx
│   │   └── EmptyState.tsx, StatusBadge.tsx
│   ├── lib/                            # Domain-local helpers
│   └── __tests__/
│
├── MsaPage/                            # Reuses many ContractManagement components
│   ├── index.tsx
│   ├── MsaDetailPage.tsx
│   ├── layouts/
│   │   ├── Overview.tsx                # Renders every field via LabelItem
│   │   ├── Amendments.tsx, Approvers.tsx, ChangeManagement.tsx
│   │   ├── Claims.tsx, Compliance.tsx, Deliverables.tsx
│   │   ├── Documents.tsx, Invoice.tsx, Kpi.tsx, Lem.tsx
│   │   ├── LinkedContracts.tsx, NcrLog.tsx, PaymentSummary.tsx
│   │   ├── Reports.tsx, Rfi.tsx
│   │   └── CreateMSADialog.tsx         # 9-step wizard (also used for edit)
│   ├── components/
│   │   ├── Step1BasicInfo.tsx … Step9ReviewPublish.tsx
│   │   ├── MsaTable.tsx, StatsCards.tsx, StatusBadge.tsx
│   │   ├── MSAClaimDetailsSheet.tsx, MsaReleaseHoldbackDialog.tsx
│   │   ├── MsaUpdateSavingsDialog.tsx
│   │   ├── LabelItem.tsx               # ★ MSA-local copy (Overview leverage)
│   │   └── EmptyState.tsx
│   └── __tests__/
│
├── SolicitationManagementPage/
│   ├── index.tsx                       # List
│   ├── SolicitationDetailPage.tsx
│   ├── ProposalDetailsPage.tsx
│   ├── components/
│   │   ├── CreateSolicitationDialog.tsx, EditSolicitationDialog.tsx
│   │   ├── AddendumsTab.tsx, AddendumDetailsSheet.tsx, CreateAddendumDialog.tsx
│   │   ├── DocumentsTab.tsx, FileUploadDialog.tsx
│   │   ├── EvaluationScorecard.tsx, EvaluatorsGroupSubTable.tsx
│   │   ├── ExtendDeadlineDialog.tsx
│   │   ├── AmendProposalDialog.tsx, AmendSubmissionDialog.tsx
│   │   ├── CompleteProposalDialog.tsx, CreateCategoryDialog.tsx
│   │   ├── SubmitProposalPage.tsx, EditProposalPage.tsx
│   │   └── ProponentSubmission/
│   └── hooks/
│
├── CollaborationToolPage/              # Yoopta + y-websocket editor
│   ├── index.tsx
│   ├── collaboration.css
│   ├── collab/                         # Editor plumbing
│   │   ├── CommentMark.tsx
│   │   ├── RedlineMarks.tsx
│   │   ├── redlineScan.ts
│   │   ├── useAiRedlineSuggestions.ts
│   │   ├── useContractMentionables.ts
│   │   ├── useFileComments.ts          # /contract/file-comment/{fileId}
│   │   └── useYooptaYjs.ts             # y-websocket binding
│   ├── components/
│   │   ├── EditorPanel.tsx             # Publishes editor via onEditorReady
│   │   ├── SidebarPanel.tsx            # Comments / Redline / Versions tabs
│   │   ├── CommentsTab.tsx, FeedItem.tsx, VirtualizedFeedList.tsx, WriteComment.tsx
│   │   ├── AiSuggestionsPanel.tsx      # overlay/inline variants
│   │   ├── VersionsTab.tsx, VersionHistoryModal.tsx
│   │   └── DocumentViewer.tsx
│   ├── store/
│   └── __tests__/
│
├── AdminManagementPage/
├── BusinessDivisionsPage/
├── CompaniesPage/                  (+ CompanyDetailPage)
├── CommunicationManagementPage/
├── ContactUsPage/
├── DisclaimerPage/
├── EvaluationManagementPage/       (+ EvaluationDetailPage, AssignedEvaluationDetailPage, SubmittedDocumentPage)
├── ForgotPasswordPage/
├── InvitationsPage/
├── OnboardingPage/                 (+ VendorOnboardingPage, PmOnboardingPage)
├── PortalSettingsPage/
├── PrivacyPolicyPage/
├── ProfilePage/
├── ProjectManagementPage/
├── ReportsPage/
├── ResetPasswordPage/
├── SettingsPage/
├── SubscriptionsPage/              (+ SubscriptionDetailPage)
├── SystemLogPage/
├── TermsConditionsPage/
├── UserManagementPage/
└── VendorManagementPage/           (+ VendorDetailPage)
```

## Directory Purposes

**`src/components/ui/`:**
- Purpose: Unmodified shadcn/Radix primitives. Edit only via the shadcn CLI.
- Key files: `button.tsx`, `dialog.tsx`, `sheet.tsx`, `table.tsx`, `tabs.tsx`, `sidebar.tsx`, `toaster.tsx`, `theme-toggle.tsx`.

**`src/components/layouts/`:**
- Purpose: Domain-aware composites built on shadcn primitives.
- Key files: `DataTable/index.tsx`, `RoleBasedDashboard/index.tsx`, `AIChatWidget/index.tsx`, `AuthorityGuard/`, `FormInputs/`.

**`src/layouts/`:**
- Purpose: App-shell scaffolding (vs. tab layouts which live inside each page folder).
- Key files: `AuthLayout.tsx`, `Dashboard.tsx`, `Sidebar.tsx`, `Header.tsx`, `NotFound.tsx`.

**`src/pages/<Domain>Page/layouts/`:**
- Purpose: Per-tab body content for the domain's detail page.
- Note: distinct from `src/layouts/` (which is app-shell).

**`src/pages/<Domain>Page/components/`:**
- Purpose: Dialogs, tables, stat cards, wizard steps, slide-over sheets.

**`src/pages/<Domain>Page/api/`:**
- Purpose: One file per role-prefix (`contractManagerApi.ts`, `vendorApi.ts`, `approverApi.ts`, `viewOnlyApi.ts`, optional `companyAdminApi.ts`). Only `ContractManagementPage` currently has this; other domains keep API calls inline or in `hooks/`.

**`src/hooks/`:**
- Purpose: Cross-cutting hooks. Each non-trivial hook gets its own subfolder with index + tests.

**`src/lib/`:**
- Purpose: Pure utilities and the singleton axios instance. No JSX except in `fileUtils.tsx`.

**`src/store/`:**
- Purpose: Zustand stores. Only auth is currently persisted.

**`src/config/`:**
- Purpose: Static lookup tables (role → dashboard config).

**`src/types.ts`:**
- Purpose: Global `User`, `UserRole` union, and shared types.

## Key File Locations

**Entry Points:**
- `src/main.tsx`: ReactDOM root.
- `src/App.tsx`: Providers + router + AI widget.
- `index.html`: Vite HTML shell.

**Configuration:**
- `vite.config.ts`, `tsconfig*.json`, `tailwind.config.js`, `postcss.config.js`
- `components.json` (shadcn), `playwright.config.ts`, `vitest.config.ts`, `vitest.setup.ts`
- `amplify.yml`, `pnpm-workspace.yaml` (carries `onlyBuiltDependencies` for pnpm 10 — see memory `fix_pnpm10_amplify_build`).

**Core Logic:**
- `src/routes/index.tsx`: Route tree.
- `src/hooks/useUserRole.ts`: Role + dashboard config.
- `src/store/authSlice.ts`: Auth state.
- `src/lib/axiosInstance.ts`: HTTP client.

**Testing:**
- Unit/component tests: `src/**/__tests__/*.{test,spec}.ts(x)` (vitest).
- E2E: `playwright.config.ts` + tests under `tests/` (see playwright config).

## Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g. `ContractsTable.tsx`, `CreateContractSheet.tsx`).
- Hooks: `useXxx.ts` (or `useXxx/` folder with `index.ts` for non-trivial).
- Utilities: `camelCase.ts` (e.g. `axiosInstance.ts`, `currencyUtils.ts`).
- Tests: `*.test.ts(x)` or `*.spec.ts(x)` inside a `__tests__/` folder.

**Directories:**
- Domain pages: `<Domain>Page/` (singular feature noun + `Page`).
- Tab content: `<TabName>TabContent.tsx` for ContractManagement; bare `<TabName>.tsx` for MSA.
- Wizard steps: `Step<N><Name>.tsx`.

## Where to Add New Code

**New page tab (existing domain):**
- Body: `src/pages/<Domain>Page/layouts/<NewTab>TabContent.tsx` (or `<NewTab>.tsx` for MSA).
- Supporting table/dialog/stat cards: `src/pages/<Domain>Page/components/`.
- Wire the tab into the detail page's `<Tabs>` in `<Domain>DetailPage.tsx`.

**New domain page:**
- Create `src/pages/<NewDomain>Page/` with `index.tsx`, optional `<Name>DetailPage.tsx`, `layouts/`, `components/`, `api/`, `__tests__/`.
- Register the route in `src/routes/index.tsx` under the protected branch.
- Add sidebar entry in `src/layouts/Sidebar.tsx`.
- If role-gated, add an `AuthorityGuard` or branch on `useUserRole()` flags.

**New API client:**
- If the endpoint follows the four-prefix convention, add one file per role under `src/pages/<Domain>Page/api/<role>Api.ts` and pick via `useUserRole()`.
- Always import the shared axios from `src/lib/axiosInstance.ts`.

**New reusable component:**
- Pure shadcn primitive → `src/components/ui/` (only if generated via shadcn CLI).
- Domain-aware composite (uses role, query, etc.) → `src/components/layouts/<Name>/index.tsx`.

**New hook:**
- Trivial single-file → `src/hooks/useX.ts`.
- Non-trivial (multiple files, tests) → `src/hooks/useX/index.ts` + `__tests__/`.

**New pure utility:**
- `src/lib/<name>.ts`. No JSX (use `.tsx` only when JSX is unavoidable, like `fileUtils.tsx`).

**New global type:**
- Append to `src/types.ts` if it's truly shared; otherwise colocate next to the consumer.

**New zustand store:**
- `src/store/<name>Slice.ts`. Use `persist` only if state must survive reload (currently only auth).

## Special Directories

**`.planning/`:**
- Purpose: GSD planning artifacts; codebase maps live in `.planning/codebase/`.
- Generated: Partially (this file is one).
- Committed: Yes.

**`docs/`:**
- Purpose: Long-form product, API, and onboarding docs. `docs/API_DOCUMENTATION_PHASE_2.md` is the authoritative route map for the four role prefixes.
- Committed: Yes.

**`dist/`, `node_modules/`, `playwright-report/`, `test-results/`, `reports/`:**
- Purpose: Build / test outputs.
- Generated: Yes.
- Committed: No.

**`public/`:**
- Purpose: Vite static assets served at site root.
- Committed: Yes.

**`mcp-server/`:**
- Not present in this repo. The MCP chat backend is deployed separately at `https://dev.swiftpro.tech`; only the client glue lives here (`src/App.tsx` and `src/components/layouts/AIChatWidget/`).

---

*Structure analysis: 2026-05-17*
