# SwiftPro

SwiftPro is a procurement and contract lifecycle platform: solicitations, master service agreements (MSAs), contracts, vendors, projects, deliverables, evaluations, approvals, and real-time collaborative redlining of contract documents.

## Features

- **Solicitations** — multi-step create/edit wizards (basic info, scope, evaluation criteria, documents, approvals), publish/draft states, vendor invitations, addendums, Q&A.
- **Master Service Agreements (MSA)** — 9-step create/edit wizard (basic info, contract team, timeline, deliverables, value & payments, compliance & security, documents, approval levels, review & publish), linked contracts view, KPI/analytics/invoices/claims/RFIs/NCRs/change management.
- **Contracts** — full lifecycle from creation through approval, execution, amendments, deliverables submission/approval, insurance, holdbacks, invoices, payment summaries, and LEM tracking. Vendor-side submission flows mirror manager-side approval flows.
- **Real-time collaborative document editor** — cross-origin iframe-embedded [SuperDoc](https://github.com/Harbour-Enterprises/SuperDoc) editor (AGPL) bridged via `postMessage`, backed by Yjs for OT/CRDT sync over WebSocket. Selection-anchored comments, presence/cursors, AI Polish redlines, version history.
- **AI features** — `useAIChat` chat assistant, AI-powered redline suggestions on contracts (batched per request), clause library extraction.
- **Role-based dashboards** — per-role landing pages (Contract Manager, Procurement, Vendor, Project Manager, Approver, Evaluator, View Only, Company Admin, Super Admin) with stats, action queues, general updates, and tab-aware contract vs. solicitation views.
- **Evaluations** — committee-based scoring, criteria-weighted scoring panels, evaluator assignments, submitted-document review.
- **Vendor management** — onboarding, vendor catalog, vendor contract stats.
- **Reports & analytics** — exportable reports, dashboard KPIs, system logs.
- **Admin** — user, company, business division, subscription, and portal settings management.

## Roles

The app supports nine roles, each with a tailored dashboard and feature gating (see [`src/hooks/useUserRole.ts`](src/hooks/useUserRole.ts) and [`src/config/dashboardConfig.ts`](src/config/dashboardConfig.ts)):

`contract_manager`, `procurement`, `vendor`, `project_manager`, `approver`, `evaluator`, `company_admin`, `super_admin`, `view_only`.

## Stack

- **Framework**: React 19, TypeScript, Vite 5
- **Routing**: React Router 6
- **State**: Zustand (auth, file upload session), React Query 5 (server state, with persisted cache via `@tanstack/query-sync-storage-persister`)
- **Forms**: React Hook Form 7 + Yup, plus an in-house Forge layer (`src/lib/forge`) wrapping RHF with declarative `<Forger>` field components and dynamic field arrays
- **HTTP**: Axios with auth interceptors that redirect to login on 401
- **UI**: Tailwind CSS 4, Radix UI primitives, shadcn-style components, `lucide-react` and `@hugeicons/react`, dark mode
- **Charts/data**: TanStack Table, Recharts
- **Rich text & docs**: SuperDoc iframe (AGPL, host bridges via `postMessage`), TipTap (fallback path), Yoopta editor (legacy), Quill, Draft.js, Slate, `mammoth` (docx parsing), `react-pdf`, `pdf2html`, `xlsx`
- **Realtime**: Yjs 13, `y-websocket`, `y-indexeddb` (offline), `y-protocols` awareness
- **Error tracking**: Sentry
- **Testing**: Playwright (E2E, `.spec.ts`), Vitest (unit, `.test.ts`)
- **Package manager**: pnpm

## Getting Started

```bash
pnpm install
cp .env.example .env   # fill in values
pnpm dev               # http://localhost:5173
```

### Environment variables

- `VITE_WS_URL` — Yjs collaboration WebSocket server (e.g. `wss://api.swiftpro.tech/api/v1/dev/contract`). The room id is passed as a query parameter (`?doc=<roomId>`), and the JWT is sent via the `Sec-WebSocket-Protocol` subprotocol.
- `VITE_SUPERDOC_APP_URL` — origin of the SuperDoc editor app embedded as an iframe. Dev: `http://localhost:5174`. Prod: `https://editor.swiftpro.tech`. **A missing/invalid value in production builds is fatal** (see `collab/superdocBridge.ts`).

The collab editor is a separate AGPL repo: [`Ruark-Digital/superdoc-swiftpro`](https://github.com/Ruark-Digital/superdoc-swiftpro). Per AGPL §13, the in-app footer links to its source.

## Scripts

- `pnpm dev` — Vite dev server on port 5173
- `pnpm build` — `tsc -b && vite build` (full project-references typecheck then bundle)
- `pnpm lint` — ESLint with zero-warning policy
- `pnpm test` — Playwright end-to-end tests
- `pnpm exec vitest run` — Vitest unit tests
- Per-feature test runners: `pnpm test:admin`, `test:contract`, `test:evaluation`, `test:project`, `test:reports`, `test:settings`, `test:vendor`, `test:companies`
- `pnpm test:headed` / `test:ui` / `test:debug` / `test:report` — Playwright modes

Convention: `*.spec.ts` = Playwright e2e, `*.test.ts` = Vitest unit (see [`docs/TESTING.md`](docs/TESTING.md) if present).

## Project Structure

```
src/
├── pages/                    # Feature pages, each with components/, layouts/, __tests__/
│   ├── SolicitationManagementPage/
│   ├── ContractManagementPage/
│   ├── MsaPage/
│   ├── EvaluationManagementPage/
│   ├── VendorManagementPage/
│   ├── ProjectManagementPage/
│   ├── CollaborationToolPage/        # SuperDoc iframe host, presence, comments, AI Polish
│   ├── DashboardPage.tsx              # role-routed entrypoint
│   ├── AdminManagementPage/
│   ├── CompaniesPage/
│   ├── BusinessDivisionsPage/
│   ├── UserManagementPage/
│   ├── ReportsPage/
│   ├── SettingsPage/
│   ├── SubscriptionsPage/
│   ├── PortalSettingsPage/
│   ├── InvitationsPage/
│   ├── OnboardingPage/
│   ├── ProfilePage/
│   ├── CommunicationManagementPage/
│   ├── SystemLogPage/
│   └── … (legal, login, password reset)
├── components/               # Shared UI (Radix-based, layouts, FormInputs)
├── lib/
│   ├── forge/                # Forge form library wrapper around RHF
│   ├── axiosInstance.ts      # Axios setup + auth interceptors
│   ├── currencyUtils.ts
│   └── …
├── hooks/                    # useUserRole, useDashboardData, useAIChat, …
├── store/                    # Zustand slices (auth, solicitationFile)
├── config/                   # dashboardConfig, role mapping
├── collab/                   # Cross-origin SuperDoc bridge, Yjs provider, presence
└── types/
```

See [`docs/DEVELOPER_ONBOARDING.md`](docs/DEVELOPER_ONBOARDING.md) for module-level architecture and workflows, and [`docs/PROJECT_HANDOVER.md`](docs/PROJECT_HANDOVER.md) for the current handover state.

## Related Documentation

- [`docs/DEVELOPER_ONBOARDING.md`](docs/DEVELOPER_ONBOARDING.md) — architecture, modules, workflows
- [`docs/API_DOCUMENTATION_PHASE_2.md`](docs/API_DOCUMENTATION_PHASE_2.md) — Phase 2 backend API reference
- [`docs/swagger-phase-2.json`](docs/swagger-phase-2.json) — OpenAPI spec
- [`docs/AI_CHAT_INTEGRATION.md`](docs/AI_CHAT_INTEGRATION.md) — AI chat assistant integration
- [`docs/DARK_MODE_GUIDE.md`](docs/DARK_MODE_GUIDE.md) — theming conventions
- [`docs/SEO_IMPLEMENTATION.md`](docs/SEO_IMPLEMENTATION.md) — SEO setup
- [`docs/PROJECT_HANDOVER.md`](docs/PROJECT_HANDOVER.md) — handover notes
