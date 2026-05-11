# Contract Manager + MSA Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 9 requested Contract Manager and MSA create-flow fixes with schema-correct payloads, accurate UI mapping, and validated browser behavior.

**Architecture:** Keep changes localized to existing pages/components/navigation config. Use TDD for each behavior change, then minimal implementation, then verification. Reuse existing API/query patterns and avoid backend/route permission redesign.

**Tech Stack:** React 19, TypeScript, TanStack Query, Forge form wrappers, Vitest + Testing Library, Playwright/browser QA.

---

### Task 1: Lock MSA Payload Schema and Currency Mapping

**Files:**
- Modify: `src/pages/MsaPage/layouts/CreateMSADialog.tsx`
- Test: `src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx` (create if missing)

- [ ] **Step 1: Write the failing test**
Add a test that submits with a non-CAD selected currency and asserts mutation payload contains:
- `msaType` (not `contractType`)
- selected `currency` value

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx`
Expected: FAIL due to mismatched payload key/value.

- [ ] **Step 3: Write minimal implementation**
Update payload construction in `CreateMSADialog.tsx` to map form values directly:
- `msaType: data.type`
- `currency: data.currency`
No extra payload reshaping.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm exec vitest run src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx`
Expected: PASS.

- [ ] **Step 5: Definition of done verification**
Run: `pnpm exec vitest run src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx`
Expected: payload assertions pass for key and currency.

### Task 2: Increase Create MSA Dialog Width by 5%

**Files:**
- Modify: `src/pages/MsaPage/layouts/CreateMSADialog.tsx`
- Test: `src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx`

- [ ] **Step 1: Write the failing test**
Add assertion for dialog width class/token reflecting ~5% wider default create dialog.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx`
Expected: FAIL on class/token mismatch.

- [ ] **Step 3: Write minimal implementation**
Adjust default dialog max-width class in `CreateMSADialog.tsx` by ~5% while preserving step-specific large width behavior.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm exec vitest run src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx`
Expected: PASS.

- [ ] **Step 5: Definition of done verification**
Manual check in browser QA confirms visual width increase and no layout break.

### Task 3: Reset Upload UI State After Successful MSA Submit

**Files:**
- Modify: `src/pages/MsaPage/layouts/CreateMSADialog.tsx`
- Modify: `src/pages/MsaPage/components/Step7Documents.tsx` (or active upload child)
- Test: `src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx`

- [ ] **Step 1: Write the failing test**
Add test that simulates successful submit and asserts upload list/chips are empty after success handler.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx`
Expected: FAIL because stale upload item remains visible.

- [ ] **Step 3: Write minimal implementation**
Introduce explicit upload reset signal/state reset on successful mutation and consume it in upload step component to clear rendered file state.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm exec vitest run src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx`
Expected: PASS.

- [ ] **Step 5: Definition of done verification**
Browser QA: after successful submit, upload area shows no leftover file item.

### Task 4: Vendor/Project Manager Behaviors in Contract and Vendor Management

**Files:**
- Modify: `src/pages/ContractManagementPage/index.tsx`
- Modify (if needed): `src/pages/VendorManagementPage/VendorDetailPage.tsx`
- Test: `src/pages/ContractManagementPage/__tests__/contract-table-mapping.test.ts` (create if missing)
- Test: `src/pages/VendorManagementPage/__tests__/vendor-detail-project-managers.test.tsx`

- [ ] **Step 1: Write failing tests**
1) Contract table mapping test expects vendor column to use `projectManager.name`.
2) Ensure resend invite remains disabled for `active` project manager status.

- [ ] **Step 2: Run tests to verify failures**
Run:
`pnpm exec vitest run src/pages/ContractManagementPage/__tests__/contract-table-mapping.test.ts src/pages/VendorManagementPage/__tests__/vendor-detail-project-managers.test.tsx`
Expected: contract mapping test fails initially (if not yet implemented).

- [ ] **Step 3: Write minimal implementation**
Update mapping in `ContractManagementPage/index.tsx` to prioritize `projectManager.name` for vendor display and keep safe fallback.
Keep existing disabled resend behavior intact for active status.

- [ ] **Step 4: Run tests to verify pass**
Run the same command as Step 2.
Expected: PASS.

- [ ] **Step 5: Definition of done verification**
Browser QA confirms vendor column shows PM name where present and active PM resend is non-clickable.

### Task 5: Compliance & Security ID and Detail Sheet Accuracy

**Files:**
- Modify (if needed): `src/pages/ContractManagementPage/components/ComplianceSecurityTab.tsx`
- Modify (if needed): `src/pages/ContractManagementPage/components/ComplianceDetailsSheet.tsx`
- Test: `src/pages/ContractManagementPage/__tests__/compliance-security.test.tsx`

- [ ] **Step 1: Write failing tests**
Add/adjust tests asserting:
- security table shows `securityTypeId` as Security ID
- detail sheet renders correct `securityTypeId`, `amount`, and `dueDate` from selected record

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/pages/ContractManagementPage/__tests__/compliance-security.test.tsx`
Expected: FAIL before mapping/render fixes.

- [ ] **Step 3: Write minimal implementation**
Align security row mapping and details sheet field references to exact API shape, with safe fallbacks only.

- [ ] **Step 4: Run test to verify it passes**
Run same command as Step 2.
Expected: PASS.

- [ ] **Step 5: Definition of done verification**
Browser QA confirms Security ID and details sheet values match API data on the compliance tab.

### Task 6: Remove Vendor Management from Contract Manager Dashboard Navigation

**Files:**
- Modify: `src/lib/navigation.ts`
- Test: `src/lib/__tests__/navigation.contract-manager.test.ts` (create if missing)

- [ ] **Step 1: Write the failing test**
Add test asserting `contract_manager` navigation items do not include Vendor Management even if module flag exists.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/lib/__tests__/navigation.contract-manager.test.ts`
Expected: FAIL because item currently exists.

- [ ] **Step 3: Write minimal implementation**
Remove Vendor Management entry from `contract_manager` navigation array only.

- [ ] **Step 4: Run test to verify it passes**
Run same command as Step 2.
Expected: PASS.

- [ ] **Step 5: Definition of done verification**
Browser QA confirms contract manager dashboard menu excludes Vendor Management.

### Task 7: Regression, Lint Diagnostics, and Browser QA Validation

**Files:**
- Modify: none expected (fix only if diagnostics fail)

- [ ] **Step 1: Run focused regression tests**
Run:
`pnpm exec vitest run src/pages/MsaPage/__tests__/create-msa-dialog.test.tsx src/pages/ContractManagementPage/__tests__/compliance-security.test.tsx src/pages/VendorManagementPage/__tests__/vendor-detail-project-managers.test.tsx src/lib/__tests__/navigation.contract-manager.test.ts src/pages/ContractManagementPage/__tests__/contract-table-mapping.test.ts`
Expected: PASS for all targeted tests.

- [ ] **Step 2: Check diagnostics**
Use IDE diagnostics for recently edited files and fix any introduced errors.

- [ ] **Step 3: Execute browser QA flow**
Validate visually/functionally/network/console:
- Create MSA submit (`msaType`, selected currency, upload clear, width)
- Contract vendor column (PM name)
- Active PM resend disabled
- Compliance security ID/details mapping
- Contract manager menu excludes Vendor Management

- [ ] **Step 4: Definition of done verification**
Document browser QA results with pass/fail evidence and any residual risk.
