# Dashboard + Contract Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dynamic "Contracts" tab to the landing dashboards of `procurement`, `vendor`, `project_manager`, and `company_admin` roles, gated by `user.module.contractManagement`.

**Architecture:** Introduce a top-level tab strip in `RoleBasedDashboard` controlled by URL query (`?tab=`). The Contracts tab reuses the existing `contract_manager`/`approver` render path (manager-side stats + analytics) for `procurement`/`company_admin`, and a new vendor-stats-only block for `vendor`/`project_manager`. Navigation for `project_manager` switches from `reportsAnalytics` to `contractManagement` gating.

**Tech Stack:** React 18 + TypeScript, shadcn `Tabs`, `react-router-dom` `useSearchParams`, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-13-dashboard-contract-tabs-design.md`

**Conventions:**
- Branch already exists (working in worktree `blissful-booth-52374e`).
- Commit after each task. Conventional commits (`feat:`, `fix:`, `test:`, `refactor:`).
- Run `pnpm tsc --noEmit` and `pnpm vitest run <touched-files>` before committing.
- Manual browser verification at `http://localhost:5174/dashboard` after UI tasks.

---

## File Map

- `src/components/layouts/RoleBasedDashboard/index.tsx` — **modify**: add landing-tab state, outer tab strip, extracted Contracts render. Largest change.
- `src/components/layouts/RoleBasedDashboard/ContractsTabView.tsx` — **create**: extracted manager-side Contracts view (the existing contract_manager render block, moved here).
- `src/components/layouts/RoleBasedDashboard/VendorContractsView.tsx` — **create**: vendor-stats-only Contracts view for `vendor` and `project_manager`.
- `src/components/layouts/RoleBasedDashboard/useLandingTabs.ts` — **create**: hook computing which top tabs to show based on role + modules.
- `src/lib/navigation.ts:32` — **modify**: replace `role !== "project_manager"` exclusion with `modules?.contractManagement` gate for PM.
- `src/lib/__tests__/navigation.test.ts` — **modify**: add tests for PM Dashboard visibility.
- `src/components/layouts/RoleBasedDashboard/__tests__/useLandingTabs.test.ts` — **create**: tab list per role.
- `src/config/dashboardConfig.ts` — **no change** (configs stay flat; tabs computed at render time).

---

## Task 1: `useLandingTabs` hook with role × module matrix

**Files:**
- Create: `src/components/layouts/RoleBasedDashboard/useLandingTabs.ts`
- Create: `src/components/layouts/RoleBasedDashboard/__tests__/useLandingTabs.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/components/layouts/RoleBasedDashboard/__tests__/useLandingTabs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeLandingTabs } from "../useLandingTabs";
import type { Modules } from "@/types";

const modulesOn: Modules = {
  _id: "m1", companyId: "c1",
  contractManagement: true, solicitationManagement: true, evaluationsManagement: true,
  vendorManagement: true, reportsAnalytics: true, vendorsQA: true,
  generalUpdatesNotifications: true, addendumManagement: true, myActions: true,
  createdAt: "", updatedAt: "", __v: 0,
};
const modulesOff: Modules = { ...modulesOn, contractManagement: false };

describe("computeLandingTabs", () => {
  it("procurement with flag on returns [solicitations, contracts]", () => {
    const tabs = computeLandingTabs("procurement", modulesOn);
    expect(tabs.map((t) => t.id)).toEqual(["solicitations", "contracts"]);
  });

  it("procurement with flag off returns [solicitations] only", () => {
    const tabs = computeLandingTabs("procurement", modulesOff);
    expect(tabs.map((t) => t.id)).toEqual(["solicitations"]);
  });

  it("vendor with flag on returns [invitations, contracts]", () => {
    const tabs = computeLandingTabs("vendor", modulesOn);
    expect(tabs.map((t) => t.id)).toEqual(["invitations", "contracts"]);
  });

  it("vendor with flag off returns [invitations] only", () => {
    expect(computeLandingTabs("vendor", modulesOff).map((t) => t.id)).toEqual([
      "invitations",
    ]);
  });

  it("company_admin with flag on returns [overview, users, contracts]", () => {
    expect(
      computeLandingTabs("company_admin", modulesOn).map((t) => t.id),
    ).toEqual(["overview", "users", "contracts"]);
  });

  it("company_admin with flag off returns [overview, users]", () => {
    expect(
      computeLandingTabs("company_admin", modulesOff).map((t) => t.id),
    ).toEqual(["overview", "users"]);
  });

  it("project_manager with flag on returns [contracts]", () => {
    expect(
      computeLandingTabs("project_manager", modulesOn).map((t) => t.id),
    ).toEqual(["contracts"]);
  });

  it("project_manager with flag off returns []", () => {
    expect(computeLandingTabs("project_manager", modulesOff)).toEqual([]);
  });

  it("contract_manager is unaffected (returns [])", () => {
    expect(computeLandingTabs("contract_manager", modulesOn)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm vitest run src/components/layouts/RoleBasedDashboard/__tests__/useLandingTabs.test.ts`
Expected: FAIL — module `../useLandingTabs` not found.

- [ ] **Step 3: Implement `useLandingTabs.ts`**

Create `src/components/layouts/RoleBasedDashboard/useLandingTabs.ts`:

```ts
import { useMemo } from "react";
import type { Modules, UserRole } from "@/types";

export type LandingTabId =
  | "solicitations"
  | "invitations"
  | "overview"
  | "users"
  | "contracts";

export interface LandingTab {
  id: LandingTabId;
  label: string;
}

const CONTRACTS_TAB: LandingTab = { id: "contracts", label: "Contracts" };

export function computeLandingTabs(
  role: UserRole,
  modules: Modules | undefined,
): LandingTab[] {
  const contractsOn = modules?.contractManagement === true;

  switch (role) {
    case "procurement":
      return contractsOn
        ? [{ id: "solicitations", label: "Solicitations" }, CONTRACTS_TAB]
        : [{ id: "solicitations", label: "Solicitations" }];

    case "vendor":
      return contractsOn
        ? [{ id: "invitations", label: "Invitations" }, CONTRACTS_TAB]
        : [{ id: "invitations", label: "Invitations" }];

    case "company_admin": {
      const base: LandingTab[] = [
        { id: "overview", label: "Overview" },
        { id: "users", label: "Users" },
      ];
      return contractsOn ? [...base, CONTRACTS_TAB] : base;
    }

    case "project_manager":
      return contractsOn ? [CONTRACTS_TAB] : [];

    default:
      return [];
  }
}

export function useLandingTabs(role: UserRole, modules: Modules | undefined) {
  return useMemo(() => computeLandingTabs(role, modules), [role, modules]);
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm vitest run src/components/layouts/RoleBasedDashboard/__tests__/useLandingTabs.test.ts`
Expected: 9 tests pass.

- [ ] **Step 5: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no new errors related to these files.

- [ ] **Step 6: Commit**

```bash
git add src/components/layouts/RoleBasedDashboard/useLandingTabs.ts \
        src/components/layouts/RoleBasedDashboard/__tests__/useLandingTabs.test.ts
git commit -m "feat(dashboard): add useLandingTabs hook for role-based tab list"
```

---

## Task 2: Fix Project Manager Dashboard navigation gating

**Files:**
- Modify: `src/lib/navigation.ts:31-40`
- Modify: `src/lib/__tests__/navigation.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/lib/__tests__/navigation.test.ts` inside the `describe("navigation role access", ...)` block:

```ts
  it("shows Dashboard for project_manager when contractManagement is on", () => {
    const items = getNavigationForRole(
      "project_manager",
      "/dashboard",
      allModules,
    );
    expect(items.some((i) => i.title === "Dashboard")).toBe(true);
  });

  it("hides Dashboard for project_manager when contractManagement is off", () => {
    const items = getNavigationForRole(
      "project_manager",
      "/dashboard",
      { ...allModules, contractManagement: false },
    );
    expect(items.some((i) => i.title === "Dashboard")).toBe(false);
  });

  it("hides Dashboard for view_only regardless of flag", () => {
    const items = getNavigationForRole(
      "view_only",
      "/dashboard",
      allModules,
    );
    expect(items.some((i) => i.title === "Dashboard")).toBe(false);
  });
```

- [ ] **Step 2: Run tests, confirm the project_manager-on test fails**

Run: `pnpm vitest run src/lib/__tests__/navigation.test.ts`
Expected: the new "shows Dashboard for project_manager when contractManagement is on" test FAILS (Dashboard currently hidden for PM). The other two new tests should pass.

- [ ] **Step 3: Update `getNavigationForRole`**

In `src/lib/navigation.ts`, replace lines 31-40:

```ts
  const showDashboard =
    role === "project_manager"
      ? modules?.contractManagement === true
      : modules?.reportsAnalytics === true && role !== "view_only";

  const baseNavigation: (NavigationItem | undefined)[] = [
    showDashboard
      ? {
          icon: MdDashboard,
          title: "Dashboard",
          to: "/dashboard",
          active: currentPath === "/dashboard",
        }
      : undefined,
  ];
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/lib/__tests__/navigation.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/navigation.ts src/lib/__tests__/navigation.test.ts
git commit -m "fix(navigation): gate project_manager Dashboard on contractManagement flag"
```

---

## Task 3: Extract manager-side Contracts view into a subcomponent

**Goal:** Move the existing render block currently used by `contract_manager`/`approver` (the Overview/Analytics sub-tabs with 12 contract stats and analytics cards) into a reusable component, so it can be invoked from the Contracts tab of `procurement` and `company_admin`.

**Files:**
- Create: `src/components/layouts/RoleBasedDashboard/ContractsTabView.tsx`
- Modify: `src/components/layouts/RoleBasedDashboard/index.tsx`

- [ ] **Step 1: Identify the existing render block**

Read `src/components/layouts/RoleBasedDashboard/index.tsx` lines 811-1100 to locate the JSX gated by `isContractAnalyticsRole`/`showCmOverviewTotalContracts`/`showCmAnalytics`. This is the block to extract.

- [ ] **Step 2: Create `ContractsTabView.tsx` accepting props for all required data**

Create `src/components/layouts/RoleBasedDashboard/ContractsTabView.tsx` with a `ContractsTabView` component that takes the following props (extracted from the variables currently in scope in `RoleBasedDashboard`):

```ts
export interface ContractsTabViewProps {
  topTab: "overview" | "analytics";
  setTopTab: (v: "overview" | "analytics") => void;
  subTab: "total-contracts" | "ytd-contracts";
  setSubTab: (v: "total-contracts" | "ytd-contracts") => void;
  transformedStats: DashboardConfig["stats"];
  rows: DashboardConfig["rows"];
  // analytics card data — pass through verbatim:
  contractManagerTotalCards: any;
  contractManagerYtdCards: any;
  contractManagerCycleTime: any;
  contractManagerInvoiceStatus: any;
  contractManagerCommittedVsActualSpend: any;
  contractManagerVendorContractValue: any;
  contractManagerProjectContractValue: any;
  contractManagerRiskDistribution: any;
  contractManagerChangeOrderImpact: any;
  // ...add every contractManager* variable referenced by the extracted JSX
  canShowMyActions: boolean;
  canShowGeneralUpdates: boolean;
  onChartFilterChange: (id: string, value: string) => void;
}
```

Cut the JSX block from `index.tsx` (the entire `{isContractAnalyticsRole && (<div>...</div>)}` region and the related Overview/Analytics subtree) and paste into the new component, replacing in-scope variable refs with `props.<name>`.

- [ ] **Step 3: Wire it in `RoleBasedDashboard`**

In `index.tsx`, replace the extracted block with:

```tsx
{isContractAnalyticsRole && (
  <ContractsTabView
    topTab={cmTopTab}
    setTopTab={setCmTopTab}
    subTab={cmSubTab}
    setSubTab={setCmSubTab}
    transformedStats={transformedConfig.stats}
    rows={transformedConfig.rows}
    contractManagerTotalCards={contractManagerTotalCards}
    contractManagerYtdCards={contractManagerYtdCards}
    contractManagerCycleTime={contractManagerCycleTime}
    /* ...etc, mirror all props */
    canShowMyActions={canShowMyActions}
    canShowGeneralUpdates={canShowGeneralUpdates}
    onChartFilterChange={handleChartFilterChange}
  />
)}
```

Add `import { ContractsTabView } from "./ContractsTabView";` at the top.

- [ ] **Step 4: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: zero errors. Fix any prop type mismatches inline by widening prop types from the original variable types.

- [ ] **Step 5: Manual verification — contract_manager view unchanged**

Log in as a `contract_manager` user. Visit `/dashboard`. Confirm: Overview tab shows 12 stat cards + sub-tabs Total Contracts / YTD Contracts; Analytics tab shows all analytics cards. Visually identical to before.

- [ ] **Step 6: Commit**

```bash
git add src/components/layouts/RoleBasedDashboard/ContractsTabView.tsx \
        src/components/layouts/RoleBasedDashboard/index.tsx
git commit -m "refactor(dashboard): extract ContractsTabView from RoleBasedDashboard"
```

---

## Task 4: Create `VendorContractsView` (stats-only)

**Files:**
- Create: `src/components/layouts/RoleBasedDashboard/VendorContractsView.tsx`

- [ ] **Step 1: Identify vendor contract data source**

Search the existing codebase for how vendor contract stats are fetched. Likely in `useDashboardData` or a hook like `useVendorContractStats`. If no hook exists yet, locate the `/contract/vendor/contracts/*` endpoints in `src/api` and create a thin hook:

```ts
// src/hooks/useVendorContractStats.ts
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/utils/apiHandler"; // match the project's util

export interface VendorContractStats {
  all: number;
  active: number;
  completed: number;
  suspended: number;
  expired: number;
  cancelled: number;
}

export function useVendorContractStats(enabled: boolean) {
  return useQuery<VendorContractStats>({
    queryKey: ["vendor-contract-stats"],
    queryFn: async () => {
      const res = await getRequest("/contract/vendor/contracts/stats");
      return res.data?.data ?? {
        all: 0, active: 0, completed: 0, suspended: 0, expired: 0, cancelled: 0,
      };
    },
    enabled,
  });
}
```

Verify the endpoint path in `src/api/contracts/vendor*` or via `ContractManagementPage` (line 253, 272 mentioned in research). Adjust if different.

- [ ] **Step 2: Implement `VendorContractsView.tsx`**

```tsx
import React from "react";
import { StatCard } from "@/components/ui/stat-card"; // match the project's stat card import path
import { useVendorContractStats } from "@/hooks/useVendorContractStats";

interface Props {
  enabled: boolean;
}

const CARDS: { key: keyof import("@/hooks/useVendorContractStats").VendorContractStats; title: string; color: string; bgColor: string; }[] = [
  { key: "all", title: "All Contracts", color: "text-gray-500", bgColor: "bg-gray-500/20" },
  { key: "active", title: "Active", color: "text-green-600", bgColor: "bg-green-500/20" },
  { key: "completed", title: "Completed", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { key: "suspended", title: "Suspended", color: "text-yellow-500", bgColor: "bg-yellow-500/20" },
  { key: "expired", title: "Expired", color: "text-orange-500", bgColor: "bg-orange-500/20" },
  { key: "cancelled", title: "Cancelled", color: "text-red-500", bgColor: "bg-red-500/20" },
];

export const VendorContractsView: React.FC<Props> = ({ enabled }) => {
  const { data, isLoading } = useVendorContractStats(enabled);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CARDS.map((c) => (
        <StatCard
          key={c.key}
          title={c.title}
          value={isLoading ? 0 : (data?.[c.key] ?? 0)}
          icon="folder-open"
          color={c.color}
          bgColor={c.bgColor}
        />
      ))}
    </div>
  );
};
```

**Important:** Match `StatCard` import path used elsewhere in the project (search `import.*StatCard` in `src/`). If the project renders stat cards via a generic loop over `dashboardConfig.stats`, mimic that pattern instead of importing `StatCard` directly.

- [ ] **Step 3: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layouts/RoleBasedDashboard/VendorContractsView.tsx \
        src/hooks/useVendorContractStats.ts
git commit -m "feat(dashboard): add VendorContractsView with 6 vendor-side stats"
```

---

## Task 5: Outer landing-tab strip + URL persistence in `RoleBasedDashboard`

**Files:**
- Modify: `src/components/layouts/RoleBasedDashboard/index.tsx`

- [ ] **Step 1: Add imports + URL-synced state**

At top of `index.tsx`, add:

```ts
import { useSearchParams } from "react-router-dom";
import { useLandingTabs, type LandingTabId } from "./useLandingTabs";
import { VendorContractsView } from "./VendorContractsView";
```

Inside the component (near the existing `cmTopTab`/`cmSubTab` state):

```ts
const landingTabs = useLandingTabs(userRole, modules);
const [searchParams, setSearchParams] = useSearchParams();
const tabFromUrl = searchParams.get("tab") as LandingTabId | null;
const defaultLandingTab = landingTabs[0]?.id;
const activeLandingTab: LandingTabId | undefined =
  tabFromUrl && landingTabs.some((t) => t.id === tabFromUrl)
    ? tabFromUrl
    : defaultLandingTab;

const setActiveLandingTab = (id: LandingTabId) => {
  const next = new URLSearchParams(searchParams);
  next.set("tab", id);
  setSearchParams(next, { replace: true });
};
```

- [ ] **Step 2: Render outer tab strip when `landingTabs.length > 1`**

In the JSX, right after the `<div className="flex justify-between items-center">...</div>` header (around line 821), insert:

```tsx
{landingTabs.length > 1 && activeLandingTab && (
  <Tabs
    value={activeLandingTab}
    onValueChange={(v) => setActiveLandingTab(v as LandingTabId)}
    className="w-full"
  >
    <TabsList className="bg-slate-100 rounded-full p-1.5 gap-3 mb-3 h-12">
      {landingTabs.map((t) => (
        <TabsTrigger
          key={t.id}
          value={t.id}
          className={cn(
            "rounded-full px-4 py-2 text-sm",
            "data-[state=active]:bg-[#2A4467] data-[state=active]:text-white",
            "text-gray-600",
          )}
        >
          {t.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
)}
```

- [ ] **Step 3: Gate the existing role render blocks on `activeLandingTab`**

Wrap each role's current render output in a check. For example, around the `procurement` render branch, gate the existing JSX with `activeLandingTab !== "contracts"`. Add a new branch for `activeLandingTab === "contracts"`:

```tsx
{userRole === "procurement" && activeLandingTab === "solicitations" && (
  /* existing procurement JSX */
)}
{userRole === "procurement" && activeLandingTab === "contracts" && (
  <ContractsTabView
    {/* same props as in Task 3, using same data sources */}
  />
)}
```

Repeat similar gates for `vendor` (invitations vs contracts → `<VendorContractsView enabled />`), and for `project_manager` (only contracts tab visible).

- [ ] **Step 4: For project_manager, replace manager `ContractsTabView` with `VendorContractsView`**

PM is `isContractVendorLike`. The PM Contracts tab should use `VendorContractsView`, NOT `ContractsTabView`. Update the existing PM render path so:

```tsx
{userRole === "project_manager" && activeLandingTab === "contracts" && (
  <VendorContractsView enabled />
)}
```

Also: PM was previously hitting `contract_manager` render via shared config; since PM now has its own branch, remove PM from the `isContractAnalyticsRole` calculation:

```ts
const isContractAnalyticsRole =
  userRole === "contract_manager" || userRole === "approver";
// project_manager handled separately above
```

- [ ] **Step 5: Manual verification**

Start dev server (`pnpm dev`), log in as each test user with `contractManagement = true`:

1. **Procurement**: see `Solicitations | Contracts` pill tabs. Click Contracts — see 12 stat cards + Overview/Analytics inner tabs.
2. **Vendor**: see `Invitations | Contracts`. Contracts shows 6 stat cards only.
3. **Project Manager**: Dashboard nav link visible. Only one outer tab (Contracts, no strip rendered since length=1). 6 stat cards.
4. **Company Admin**: see `Overview | Users | Contracts` (Users tab still empty content at this point — handled in Task 6).
5. Toggle `contractManagement` off in super admin for the test company. Re-login: Contracts tab disappears for all roles; PM Dashboard link disappears.
6. Refresh `/dashboard?tab=contracts` — Contracts tab stays selected.

- [ ] **Step 6: Typecheck + lint**

Run: `pnpm tsc --noEmit` and `pnpm lint` (if defined in `package.json`).
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/layouts/RoleBasedDashboard/index.tsx
git commit -m "feat(dashboard): add outer landing-tab strip with Contracts tab"
```

---

## Task 6: Split `company_admin` into Overview / Users / Contracts tabs

**Files:**
- Modify: `src/components/layouts/RoleBasedDashboard/index.tsx` (company_admin render branch around lines 346-428 + 1000s render section)

- [ ] **Step 1: Inventory current company_admin content**

Read the company_admin render path. Identify which stats and charts belong to Overview vs Users:

- **Overview**: stats `All Solicitations`, `Published Solicitations`, `Under Evaluation`, `Closed Solicitations`, `All Evaluations`, `Active Evaluations`, `Pending Evaluations`, `Completed Evaluations`; charts `solicitation-status`, `proposal-submission`, `bid-intent`, `vendors-distribution`.
- **Users**: stats `All Users`, `Admins`, `Procurement Leads`, `Evaluators`; chart `company-role-distribution`; `General Updates` row.

If `dashboardConfig.stats` mixes both groups in one array, partition them at render time (do not modify the static config).

- [ ] **Step 2: Gate Overview render on `activeLandingTab === "overview"`**

Wrap the existing company_admin render in `activeLandingTab === "overview"`. Within that block, filter `transformedConfig.stats` to the Overview titles list and `transformedConfig.rows[i].properties` to Overview chart ids.

- [ ] **Step 3: Add Users render branch**

```tsx
{userRole === "company_admin" && activeLandingTab === "users" && (
  <>
    {/* stat grid filtered to user-related cards */}
    {/* role distribution chart */}
    {/* general updates panel */}
  </>
)}
```

Reuse the same stat-card and chart components the existing company_admin branch uses — partition data, not components.

- [ ] **Step 4: Add Contracts render branch**

```tsx
{userRole === "company_admin" && activeLandingTab === "contracts" && (
  <ContractsTabView /* same props as procurement Contracts tab */ />
)}
```

Reuse `ContractsTabView` (manager-side view) since company_admin has org-wide visibility.

- [ ] **Step 5: Manual verification**

Log in as company_admin with `contractManagement = true`:
- Overview shows 8 solicitation/evaluation stats + 4 charts.
- Users shows 4 user stats + role distribution + general updates.
- Contracts shows 12 manager-side stats + analytics.
- With flag off: only Overview + Users tabs.

- [ ] **Step 6: Typecheck + commit**

```bash
pnpm tsc --noEmit
git add src/components/layouts/RoleBasedDashboard/index.tsx
git commit -m "feat(dashboard): split company_admin into Overview/Users/Contracts tabs"
```

---

## Task 7: Smoke test for `RoleBasedDashboard` tab rendering

**Files:**
- Create: `src/components/layouts/RoleBasedDashboard/__tests__/RoleBasedDashboard.tabs.test.tsx`

- [ ] **Step 1: Write a render smoke test per role**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RoleBasedDashboard } from "../index";
import type { Modules } from "@/types";

// Mock useUserRole and useUser to return controlled fixtures
vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({
    userRole: (globalThis as any).__testRole ?? "procurement",
    dashboardConfig: { stats: [], rows: [] },
  }),
}));

vi.mock("@/store/authSlice", () => ({
  useUser: () => ({
    module: (globalThis as any).__testModules,
  }),
}));

vi.mock("@/hooks/useDashboardData", () => ({
  useDashboardData: () => ({}),
}));

const modulesOn: Modules = {
  _id: "m", companyId: "c",
  contractManagement: true, solicitationManagement: true, evaluationsManagement: true,
  vendorManagement: true, reportsAnalytics: true, vendorsQA: true,
  generalUpdatesNotifications: true, addendumManagement: true, myActions: true,
  createdAt: "", updatedAt: "", __v: 0,
};

const renderAt = (role: string, modules: Modules | undefined, url = "/dashboard") => {
  (globalThis as any).__testRole = role;
  (globalThis as any).__testModules = modules;
  return render(
    <MemoryRouter initialEntries={[url]}>
      <RoleBasedDashboard />
    </MemoryRouter>,
  );
};

describe("RoleBasedDashboard tabs", () => {
  it("procurement shows Solicitations + Contracts when flag on", () => {
    renderAt("procurement", modulesOn);
    expect(screen.getByRole("tab", { name: "Solicitations" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Contracts" })).toBeInTheDocument();
  });

  it("procurement hides Contracts tab when flag off", () => {
    renderAt("procurement", { ...modulesOn, contractManagement: false });
    expect(screen.queryByRole("tab", { name: "Contracts" })).toBeNull();
  });

  it("company_admin shows Overview + Users + Contracts when flag on", () => {
    renderAt("company_admin", modulesOn);
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Contracts" })).toBeInTheDocument();
  });

  it("vendor with flag off renders no outer tab strip (single tab)", () => {
    renderAt("vendor", { ...modulesOn, contractManagement: false });
    expect(screen.queryByRole("tab", { name: "Contracts" })).toBeNull();
  });
});
```

Adjust mock paths to match actual project hook locations (search `useUser`, `useDashboardData` imports in `RoleBasedDashboard/index.tsx` for the exact module specifiers).

- [ ] **Step 2: Run tests**

Run: `pnpm vitest run src/components/layouts/RoleBasedDashboard/__tests__/RoleBasedDashboard.tabs.test.tsx`
Expected: all tests pass. If mocks miss a hook, the error message will name it — add a mock for it.

- [ ] **Step 3: Commit**

```bash
git add src/components/layouts/RoleBasedDashboard/__tests__/RoleBasedDashboard.tabs.test.tsx
git commit -m "test(dashboard): smoke tests for landing-tab visibility per role"
```

---

## Task 8: Full regression sweep

- [ ] **Step 1: Run full test suite**

Run: `pnpm vitest run`
Expected: all tests pass. Investigate any new failures.

- [ ] **Step 2: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Manual browser sweep**

With `contractManagement = true`:
1. `contract_manager` — `/dashboard` renders unchanged (Overview / Analytics inner tabs work).
2. `approver` — `/dashboard` renders unchanged.
3. `procurement` — outer Solicitations / Contracts tabs; both render correct content; `?tab=contracts` deep link works.
4. `vendor` — outer Invitations / Contracts tabs.
5. `project_manager` — Dashboard nav link visible; Contracts content only.
6. `company_admin` — three outer tabs.
7. `evaluator`, `super_admin`, `view_only` — dashboards render unchanged (no outer strip).

With `contractManagement = false` (toggle via super admin → CompanyDetailPage → save):
1. All four target roles see no Contracts tab.
2. PM has no Dashboard nav link.
3. Other roles unaffected.

- [ ] **Step 4: Final commit if any cleanup**

If everything passes, no commit needed. Otherwise fix and commit.

---

## Self-Review Notes

- **Spec coverage:** Tasks 1, 5, 6 cover the 4 roles' tab structures. Task 2 covers the navigation fix. Task 3 covers the manager-side reuse. Task 4 covers the vendor-stats-only variant. Task 7 covers smoke tests. URL persistence is in Task 5. Module-flag dynamism is in Task 1 (`computeLandingTabs`) + Task 5 (consumed at render).
- **Out-of-scope items honored:** No changes to `dashboardConfig.ts` (configs stay flat); no changes to `ContractManagementPage`; `contract_manager`/`approver` rendering identical post-extraction (Task 3 step 5 manual verification).
- **Risk:** Task 3's extraction touches a 1000+ line file; props list must mirror every variable referenced by the extracted JSX. If a variable is missed, TypeScript will fail at Task 3 step 4 — fix by adding the prop.
- **Risk:** Task 4 assumes a vendor-stats endpoint exists. If not, the hook query will need a backend-side counterpart; that's a separate change to flag, not in this plan.
