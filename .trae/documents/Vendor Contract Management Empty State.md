## Goal
- Update Contract Management list page to render a vendor-specific UI (per provided Figma screenshot) while keeping the current procurement + contract manager experience unchanged.

## Current State (What I Found)
- User role is derived from `useUserRole()` (source: `authSlice.user.role.name`), with helpers like `isVendor`. [useUserRole.ts](file:///c:/Users/USER/Documents/GitHub/swifter/src/hooks/useUserRole.ts)
- The current page always mounts manager/procurement contract queries (`/contract/manager/...`) and falls back to hard-coded `demoContracts`, which prevents a true empty state. [index.tsx](file:///c:/Users/USER/Documents/GitHub/swifter/src/pages/ContractManagementPage/index.tsx)
- The table already supports an empty placeholder via a page-level `EmptyState` component, but that empty state includes a “Create Contract” CTA which is not appropriate for vendors. [ContractsTable.tsx](file:///c:/Users/USER/Documents/GitHub/swifter/src/pages/ContractManagementPage/components/ContractsTable.tsx), [EmptyState.tsx](file:///c:/Users/USER/Documents/GitHub/swifter/src/pages/ContractManagementPage/components/EmptyState.tsx)

## Implementation Plan
### 1) Add role-based branching in the page
- In [index.tsx](file:///c:/Users/USER/Documents/GitHub/swifter/src/pages/ContractManagementPage/index.tsx), call `useUserRole()` and split rendering into:
  - `VendorContractsView` (new)
  - `ManagerProcurementContractsView` (existing UI)

### 2) Vendor UI (matches screenshot)
- Render the vendor layout:
  - Page header: “Contracts” only (no Export button, no Create Contract sheet trigger).
  - Stats cards: 5 cards (All Contracts, Active Contracts, Suspended, Closed, Terminated) in the same card style.
  - A single contracts table section (no “All Contracts / My Contracts” tabs).

### 3) Vendor-specific components
Create new page-scoped components under `src/pages/ContractManagementPage/components/`:
- `VendorStatsCards.tsx`
  - Reuse the same Card styling pattern as `StatsCards.tsx` but with the 5 vendor labels.
- `VendorContractsTable.tsx`
  - Reuse `DataTable`, the same header UI (search + Date/Status/Category dropdowns), but with column headers matching the screenshot:
    - Contracts, Company, Contract Relationship, Value, Date, Status, Actions
- `VendorEmptyState.tsx`
  - Vendor-appropriate empty messaging and no “Create Contract” CTA.

### 4) Prevent incorrect API calls for vendors
- Update the three React Query hooks inside the page (`useContractsStats`, `useAllContracts`, `useMyContracts`) to accept an `enabled` flag.
- Set `enabled: !isVendor` so vendors don’t call `/contract/manager/...` endpoints.

### 5) Remove demo data fallback
- Remove `demoContracts` usage entirely (or at minimum ensure it’s not used for vendor).
- This allows empty state rendering when the API returns no contracts.

## Verification
- Add/adjust a frontend test (Playwright spec already exists for this feature) to validate vendor UI:
  - When role is `vendor`, the page shows vendor stats cards, hides “Export” and “Create Contracts”, and shows the vendor empty state in the table.
  - When role is `procurement` or `contract_manager`, existing UI still renders (tabs + create flow present).

## Files to Change / Add
- Update: [index.tsx](file:///c:/Users/USER/Documents/GitHub/swifter/src/pages/ContractManagementPage/index.tsx)
- Add: `components/VendorStatsCards.tsx`
- Add: `components/VendorContractsTable.tsx`
- Add: `components/VendorEmptyState.tsx`
- Update tests (if present/appropriate): `src/pages/ContractManagementPage/__tests__/...`
