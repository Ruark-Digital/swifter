# Dashboard + Contract Management Tabbed Integration

**Date:** 2026-05-13
**Status:** Design — pending user review

## Problem

Four roles have access to Contract Management but their landing dashboards do not surface contract data:

- `procurement` ("Procurement Lead") — solicitations dashboard only
- `vendor` — invitations dashboard only
- `project_manager` — already wired to `contractManagerConfig` but Dashboard nav is hidden (`src/lib/navigation.ts:32`)
- `company_admin` — solicitations + evaluations + users; no contracts

The Contract Management module is **off by default** and toggled per-company by super admin via `user.module.contractManagement`. The dashboard must react to this flag without code redeploys.

The `contract_manager` role is out of scope — its dashboard already is the contract dashboard.

## Solution: Tabbed Dashboards with Dynamic Contracts Tab

Extend `DashboardConfig` to support an optional `tabs` array. Build the Contracts tab at render time based on `user.module.contractManagement`. Reuse existing stat/row/chart primitives — no new config DSL.

### Architecture

1. **Type extension** (`src/config/dashboardConfig.ts`)
   - Add `DashboardTab { id: string; label: string; stats?; rows?; charts?; }`
   - Add optional `tabs?: DashboardTab[]` to `DashboardConfig`. When present, takes precedence over flat `stats`/`rows`/`charts`.

2. **Render layer** (`src/components/layouts/RoleBasedDashboard/index.tsx`)
   - If `config.tabs` is present and length > 1, render a tab strip; otherwise render flat as today.
   - Active tab persisted in URL: `?tab=<id>`. Default = first tab.
   - Single-tab configs render flat (no strip) so vendor/procurement with flag off look identical to today.

3. **Dynamic Contracts tab** (`src/pages/DashboardPage.tsx` or new `useDashboardConfig(role)` hook)
   - Compose final config at render: start from static role config, push `contractsTab` when `user.module.contractManagement === true`.
   - Static configs in `dashboardConfig.ts` stay free of feature-flag logic.

4. **Project manager nav fix** (`src/lib/navigation.ts`)
   - Remove the unconditional Dashboard exclusion at line 32 for `project_manager`.
   - Replace with: show Dashboard link for PM **only when** `modules?.contractManagement === true`. Flag off → link hidden (no regression vs today).

### Per-Role Tab Specification

#### `procurement` (Procurement Lead)

| Tab | When | Content |
|---|---|---|
| Solicitations | always | Current `procurementConfig` unchanged: 4 stats (All/Active Solicitations, Pending Evaluations, Awarded), My Actions + General Updates rows, 6 charts (Solicitation Status, Solicitation vs Evaluations, Proposal Submission, Vendors Bid Intent, Vendors Distribution, Total Evaluation) |
| Contracts | `contractManagement === true` | Manager-side reuse from `contractManagerConfig`: 12 stats (All/Active/Draft/Suspended/Expired/Terminated, Total Value, Committed vs Actual, Savings, Renewals, High Risk, Holdbacks) + analytics cards (Cycle Time, Spend, Vendor Value, Contract Status, Renewals Timeline, AI Insights). No My Actions/General Updates here — they stay on Solicitations tab. |

#### `vendor`

| Tab | When | Content |
|---|---|---|
| Invitations | always | Current `vendorConfig` unchanged: 4 stats (All/Confirmed/Declined/Pending Invitations) + My Actions + General Updates |
| Contracts | `contractManagement === true` | Vendor-side stats only (no table preview): 6 stats (All/Active/Completed/Suspended/Expired/Cancelled) from `/contract/vendor/contracts/*`. No manager analytics. |

#### `project_manager`

| Tab | When | Content |
|---|---|---|
| Contracts | `contractManagement === true` | Vendor-side stats (same set as vendor role: 6 stats from vendor endpoints — PM is `isContractVendorLike`). |
| Analytics | `contractManagement === true` | Vendor-scoped analytics subset from `contractManagerConfig` analytics cards, filtered to vendor-accessible data. |

- When `contractManagement === false`: Dashboard route remains hidden via navigation (no change from today).
- When `contractManagement === true`: Dashboard nav link appears.

#### `company_admin`

| Tab | When | Content |
|---|---|---|
| Overview | always | Solicitations + Evaluations stats (8 cards) + charts: Solicitation Status, Proposal Submission, Vendors Bid Intent, Vendors Distribution |
| Users | always | User stats (All Users, Admins, Procurement Leads, Evaluators) + Role Distribution chart + General Updates |
| Contracts | `contractManagement === true` | Full manager-side view: 12 stats + analytics (same as procurement's Contracts tab — company admin has org-wide visibility) |

### Cross-Cutting Rules

- **URL persistence:** active tab in query string (`?tab=contracts`); deep-linking and refresh preserve tab.
- **Default tab:** always the first declared tab; never Contracts.
- **Flag-off behavior:** Contracts tab is not built; if remaining config has a single tab, render flat (no tab strip) so visual matches today.
- **Empty states:** Contracts tab on a fresh company uses the existing empty-state cards from `contractManagerConfig`.
- **Endpoint selection:** vendor/PM Contracts tabs MUST hit `/contract/vendor/contracts/*` (vendor-like); procurement/company_admin MUST hit `/contract/contracts/*` (manager). Reuses existing `isContractVendorLike` logic.

## Out of Scope

- Visual redesign of stat cards or charts.
- New API endpoints — uses existing manager and vendor contract endpoints.
- Changes to `contract_manager` or `approver` dashboards.
- Changes to `ContractManagementPage` (the contracts list page itself).
- Refactoring `dashboardConfig.ts` beyond adding the `tabs` field.
- Per-tab permission gating beyond the module flag.

## Affected Files

- `src/types.ts` — no changes (Modules already exists)
- `src/config/dashboardConfig.ts` — add `DashboardTab` type + optional `tabs` field on `DashboardConfig`; add Contracts tab definitions (manager and vendor variants); update `procurementConfig`, `vendorConfig`, `companyAdminConfig`, `contractManagerConfig` (PM uses this) to declare `tabs`.
- `src/components/layouts/RoleBasedDashboard/index.tsx` — tab strip render + URL sync.
- `src/pages/DashboardPage.tsx` (or new `src/hooks/useDashboardConfig.ts`) — compose final config with conditional Contracts tab from `user.module.contractManagement`.
- `src/lib/navigation.ts` — replace PM Dashboard exclusion with conditional render based on `modules.contractManagement`.

## Success Criteria

1. Procurement Lead with `contractManagement = true` sees Solicitations + Contracts tabs; with flag off, sees flat Solicitations view identical to today.
2. Vendor with flag on sees Invitations + Contracts (6 stats only) tabs; flag off → identical to today.
3. Project Manager with flag on has Dashboard link visible and sees Contracts + Analytics tabs scoped to vendor endpoints; flag off → no Dashboard link (today's behavior).
4. Company Admin sees Overview + Users tabs always; Contracts tab appears when flag on.
5. Tab selection survives page refresh via URL query.
6. Toggling the module flag in super admin reflects on next dashboard load with no code change.

## Open Questions

None — confirmed in brainstorming:
- Vendor Contracts tab: stats only, no table preview.
- Company admin: 3-tab split (Overview / Users / Contracts).
- Project manager: Dashboard remains hidden when flag is off.
