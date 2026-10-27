# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## contract-mgmt-sidebar-missing — Company Admin sidebar item removed instead of tab-level scoping
- **Date:** 2026-07-25
- **Error patterns:** contract management, sidebar, missing, company_admin, module.contractManagement.enabled, navigation.ts, tab-level scope change misattributed to nav-level removal
- **Root cause:** Plan 260724-t75 misattributed a tab-level scope change (#266: hide "My Contracts"/"My MSA" tabs for company_admin) to a full nav-level removal, deleting the entire "Contract Management" sidebar entry (parent + both children) for company_admin instead of just the two "mine" tabs.
- **Fix:** Restored the "Contract Management" nav block in `src/lib/navigation.ts` for the company_admin array (positioned after Solicitation Management, before Evaluation Management). Added `isCompanyAdmin` branches in `src/pages/ContractManagementPage/index.tsx` and `src/pages/MsaPage/index.tsx` that render a single table (no Tabs, no "My Contracts"/"My MSA" trigger) for company_admin, mirroring the existing isApprover single-table pattern. Updated `src/lib/__tests__/navigation.test.ts` regression test. Added Playwright e2e coverage.
- **Files changed:** src/lib/navigation.ts, src/pages/ContractManagementPage/index.tsx, src/pages/MsaPage/index.tsx, src/lib/__tests__/navigation.test.ts, src/pages/ContractManagementPage/__tests__/company-admin-no-mine-tab.spec.ts, src/pages/MsaPage/__tests__/msa.spec.ts
---

