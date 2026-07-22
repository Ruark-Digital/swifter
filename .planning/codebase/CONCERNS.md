# Codebase Concerns

**Analysis Date:** 2026-07-22

## Tech Debt

**Auth token/user stored in localStorage (XSS-exposed):**
- Issue: Zustand `authSlice` persists to `localStorage` under the `"auth"` key (see `persist(reducer, persistConfig)` in `src/store/authSlice.ts`). `src/hooks/useAuthentication/index.tsx` reads and JSON-parses this raw value directly as a fallback auth check.
- Files: `src/store/authSlice.ts`, `src/hooks/useAuthentication/index.tsx`, `src/lib/axiosInstance.ts` (Bearer token pulled from the same store)
- Impact: Any XSS in the app (or a compromised third-party script) can read the auth token straight out of `localStorage`. There is no httpOnly-cookie or short-lived-token strategy.
- Fix approach: Move to httpOnly session cookies or at minimum add token expiry/rotation and CSP hardening; treat `localStorage` auth as a known, accepted risk until then.

**Backend/frontend field-name drift is pervasive and undocumented in-repo:**
- Issue: Numerous features work around backend response shapes that differ from what the FE types imply (e.g., `changeOrderImpact` spelling drift, Financial Statement fields, Approver stats aliases, MSA approvers flat shape, claims `changes` key, contract-manager list envelope keys non-uniform). These workarounds live scattered across hooks/components with no central adapter layer.
- Files: `src/hooks/useDashboardData.ts`, `src/components/layouts/RoleBasedDashboard/analytics/ChangeOrdersImpactCard.tsx`, `src/lib/dashboardDataTransformer.ts`, various `api/*.ts` files per page (e.g. `src/pages/ContractManagementPage/api/contractManagerApi.ts`)
- Impact: Every new integration risks re-discovering the same shape mismatches; there's no single normalization boundary, so bugs recur per-consumer (documented repeatedly in `.claude` session memory as recurring "BE drift" fixes).
- Fix approach: Introduce a thin normalization/adapter layer per domain (contracts, MSA, approvers, claims) that maps raw API responses to stable FE types once, rather than patching each consumer site.

**Widespread use of `any` and unchecked casts:**
- Issue: 520 occurrences of explicit `: any` typing and 478 occurrences of `as any` casts across `src/`.
- Files: Spread throughout `src/pages/**`, especially large page/detail files (see Fragile Areas below).
- Impact: Type safety is frequently bypassed at exactly the boundaries (API responses, form payloads) where backend drift causes the most bugs — undermining TypeScript's ability to catch the shape mismatches described above.
- Fix approach: Prioritize typing the API layer (`src/pages/*/api/*.ts`) with real response interfaces; treat `any` in API/data-transform code as higher priority than `any` in purely presentational code.

**Debug `console.log` left behind:**
- Issue: `src/hooks/useProviders/index.ts:75` has `console.log(entryPoint); //TODO: remove this line in production` — a self-flagged debug statement never removed.
- Files: `src/hooks/useProviders/index.ts`
- Impact: Minor — noisy console output in production, but flagged as intentional debt by the original author.
- Fix approach: Delete the log line (single-line fix, zero behavior change).

**167 `console.log/error/warn` calls across `src/` with no structured logging:**
- Issue: There's no logging abstraction — errors are handled via ad hoc `console.error`/`console.warn` calls in components and hooks rather than a shared logger or error-reporting integration.
- Files: Scattered across `src/pages/**`, `src/hooks/**`, `src/components/**`
- Impact: No centralized place to filter/ship logs to monitoring; console noise in production builds; inconsistent whether errors are surfaced to users vs. silently swallowed.
- Fix approach: Not urgent for an internal tool, but if error monitoring (Sentry, etc.) is ever added, this is where the wiring needs to go.

**Very large "kitchen sink" files:**
- Issue: Several files exceed 1,000–2,500 lines, mixing data transformation, UI, and business logic in one module.
- Files (by line count): `src/lib/dashboardDataTransformer.ts` (2,571), `src/pages/SolicitationManagementPage/index.tsx` (1,789), `src/pages/MsaPage/layouts/CreateMSADialog.tsx` (1,670), `src/pages/ContractManagementPage/components/EditContract.tsx` (1,656), `src/pages/SolicitationManagementPage/SolicitationDetailPage.tsx` (1,652), `src/hooks/useDashboardData.ts` (1,624), `src/pages/ContractManagementPage/api/contractManagerApi.ts` (1,503), `src/pages/EvaluationManagementPage/EvaluationDetailPage.tsx` (1,499), `src/pages/SolicitationManagementPage/ProposalDetailsPage.tsx` (1,491), `src/pages/MsaPage/layouts/Rfi.tsx` (1,484), `src/pages/ContractManagementPage/components/AmendmentsTable.tsx` (1,467), `src/pages/ContractManagementPage/components/CreateContractSheet.tsx` (1,337), `src/pages/ContractManagementPage/layouts/RateSheetsTabContent.tsx` (1,332), `src/components/layouts/RoleBasedDashboard/index.tsx` (1,308), `src/pages/ContractManagementPage/components/DeliverablesTable.tsx` (1,224)
- Impact: High cognitive load for any change; higher risk of unrelated regressions when editing (these files repeatedly show up in the project's documented trap/feedback history — e.g., `EditContract.tsx` has a known payload-omission bug, `dashboardDataTransformer.ts`/`useDashboardData.ts` have multiple documented endpoint-mismatch traps).
- Fix approach: When touching these files, prefer surgical edits per CLAUDE.md guidance rather than opportunistic refactors; consider splitting data-transform logic (`dashboardDataTransformer.ts`) from presentation on any future substantial dashboard work.

## Known Bugs

**EditContract payload omits vendor/personnel fields on save:**
- Symptoms: Editing a contract can silently drop vendor or key-personnel fields because the edit payload doesn't include them.
- Files: `src/pages/ContractManagementPage/components/EditContract.tsx`
- Trigger: Submit the Edit Contract form without re-selecting vendor/personnel fields.
- Workaround: Documented in project memory; requires explicit BE field `FIELD` fix (QA #48) plus FE payload construction fix to include the omitted fields.

**MSA Edit unhydrated-field / hydration race traps:**
- Symptoms: Edit dialogs for MSA can show stale/empty fields depending on data-load timing (race between dialog mount and async hydration).
- Files: `src/pages/MsaPage/layouts/CreateMSADialog.tsx` (shared for create/edit)
- Trigger: Opening Edit before the underlying MSA detail query resolves.
- Workaround: None automated; documented as a known trap in project memory (`project_msa_edit_unhydrated_field_trap`, `project_msa_edit_hydration_race_trap`).

**Project Edit unhydrated-files trap:**
- Symptoms: Similar hydration-race issue on Project edit forms — previously uploaded files may not populate before the form is considered "ready."
- Files: Project edit flow (see `project_project_edit_unhydrated_files_trap` in memory for exact call sites)
- Trigger: Opening edit immediately after navigation, before file metadata loads.
- Workaround: None automated.

**Super-admin "remove company admin" endpoint wired but not working:**
- Symptoms: `DELETE /delete/{adminId}` exists on the backend but the action fails in the UI (QA #213).
- Files: Company/admin management page (super-admin service — separate API, see `reference_swiftpro_solicitation_admin_service_api`)
- Trigger: Attempt to remove a company admin as super-admin.
- Workaround: None; classified `BUG/WIRING`, needs BE+FE cross-check of the exact call.

**LEM submits despite showing an error message:**
- Symptoms: The UI displays a submission error toast, but the LEM entry is submitted anyway (idempotency/ordering bug), per QA #200/#220.
- Files: LEM submission flow under `src/pages/ContractManagementPage/**` (RateSheets/LEM tab)
- Trigger: Submitting a LEM under conditions that trigger a validation/error response.
- Workaround: None; requires BE-side idempotency fix plus FE re-check of success/error handling order.

**Change-Order Impact card / analytics count mismatches:**
- Symptoms: Change-Order Impact chart shows wrong counts, percent-only values, and dollar figures that don't update; a related crash occurs if `vendorKpi` isn't an array.
- Files: `src/components/layouts/RoleBasedDashboard/analytics/ChangeOrdersImpactCard.tsx`, `AnalyticsTab` component (vendorKpi non-array crash — see `feedback_analytics_tab_vendorkpi_nonarray_crash` in memory)
- Trigger: Certain contract/vendor combinations where BE aggregation returns non-array or stale data.
- Workaround: FE now reads both known field-name variants and removed fake default values (QA #178); underlying aggregation bug remains BE-side (QA #211/#212).

## Security Considerations

**Client-stored auth token (see Tech Debt above):**
- Risk: Token theft via XSS since the JWT lives in `localStorage` and is attached via a plain Bearer header (`src/lib/axiosInstance.ts`).
- Files: `src/store/authSlice.ts`, `src/lib/axiosInstance.ts`
- Current mitigation: 401 responses trigger a store reset that force-logs-out (`axiosInstance.ts` response interceptor), limiting the blast radius of an expired/invalid token but not of live token theft.
- Recommendations: Consider httpOnly cookie-based auth if backend can support it; otherwise add token expiry checks and rotate more aggressively.

**Role-based access control implemented ad hoc, per-component:**
- Risk: Role/permission gating (vendor vs. PM vs. manager vs. approver) is implemented as scattered conditionals in individual components rather than a single guard/permissions module, and project memory documents multiple instances where this pattern led to leaked actions or hidden UI: `feedback_role_branched_api_dispatch` (binary dispatch hides vendor/PM), `feedback_procurement_contracts_tab_action_data_leak` (Procurement Contracts tab leaked solicitation actions to unauthorized roles), `feedback_role_guards` (must always pair PM+vendor checks).
- Files: `src/components/layouts/AuthorityGuard/**`, individual page/tab components across `src/pages/ContractManagementPage/**` and `src/pages/MsaPage/**`
- Current mitigation: An `AuthorityGuard` component exists, but many pages still hand-roll role checks (`user.role === "..."`) instead of using it consistently.
- Recommendations: When adding new role-gated UI, always check both vendor and PM cases (`vendor` mentions in transcripts often mean PM role per `feedback_vendor_role_means_pm_in_transcripts`), and prefer routing through `AuthorityGuard` over ad hoc conditionals.

**No secrets found in tracked source, but `.env`/credential files should stay excluded:**
- Risk: Standard SPA risk of accidentally committing API keys.
- Files: None found containing secrets during this scan; verify `.gitignore` continues to exclude `.env*` before any future refactor of the config/env loading in `src/config`.
- Current mitigation: `.env` handling appears standard (Vite env vars); no plaintext secrets observed in `src/`.
- Recommendations: Keep excluding `.env*`, `credentials*`, and any `*-credentials.json` from commits (already the project convention).

## Performance Bottlenecks

**Dashboard data transformer is a 2,571-line monolith run on every dashboard load:**
- Problem: `src/lib/dashboardDataTransformer.ts` combines multiple role-specific transforms, Pareto/Top-N filtering, and currency handling in one large module, all invoked from `src/hooks/useDashboardData.ts` (1,624 lines).
- Files: `src/lib/dashboardDataTransformer.ts`, `src/hooks/useDashboardData.ts`
- Cause: No memoization boundary per sub-transform; role-specific branches are computed even when only one role's dashboard is rendered, based on prior documented load-optimization work (`project_dashboard_load_optimization`).
- Improvement path: Split per-role transform functions so only the active role's path executes; memoize expensive aggregations (Top10/20 Pareto filtering) with `useMemo` keyed on the raw API payload rather than recomputing on every render.

**Large table components render full datasets client-side:**
- Problem: Components like `AmendmentsTable.tsx` (1,467 lines), `DeliverablesTable.tsx` (1,224 lines), `RfiTable.tsx` (1,129 lines) combine filtering, table rendering, and dialog state in single components without evident virtualization.
- Files: `src/pages/ContractManagementPage/components/AmendmentsTable.tsx`, `DeliverablesTable.tsx`, `RfiTable.tsx`, `NcrTable.tsx`
- Cause: `DataTable` (`src/components/layouts/DataTable`) is the shared table primitive but individual feature tables layer significant extra logic on top rather than delegating.
- Improvement path: For contracts with very large deliverable/amendment counts, verify pagination is server-side rather than client-side; audit `DataTable` usage for `min-w-max` overflow pattern already flagged in memory (`feedback_datatable_minwmax_overflow_truncate`).

## Fragile Areas

**Dashboard hook/transformer pair (`useDashboardData.ts` + `dashboardDataTransformer.ts`):**
- Files: `src/hooks/useDashboardData.ts`, `src/lib/dashboardDataTransformer.ts`, `src/components/layouts/RoleBasedDashboard/**`
- Why fragile: Currently mid-change (see git status: both files modified alongside `ChangeOrdersImpactCard.tsx` and a dashboard-manager contract test) — this is the most actively-touched, bug-prone area per project memory (module-flag truthy gating, config-keyed-by-role, empty-state unwired props, CM Total vs YTD endpoint confusion, money-card currency prefix, activity-link pattern, module gating for solicitation/eval #187 all documented here).
- Safe modification: Gate new module flags on truthy checks, not `=== true` (documented past bug); confirm config lookups are keyed by role, not tab; re-verify empty states have the required prop actually wired before shipping.
- Test coverage: `src/pages/__tests__/dashboard-contract-manager.spec.ts` exists and is currently modified in the working tree — run it after any dashboard change.

**EditContract.tsx (1,656 lines):**
- Files: `src/pages/ContractManagementPage/components/EditContract.tsx`
- Why fragile: Known payload-omission bug (vendor/personnel fields silently dropped) plus general size/complexity; also implicated in QA #112 (editing live/expired contracts, still BE-blocked).
- Safe modification: Any change to the submit payload construction should explicitly diff against the full contract shape to confirm no fields are dropped; do not assume the existing payload builder is complete.
- Test coverage: Contract-management spec suite (`src/pages/ContractManagementPage/__tests__/contract-management.spec.ts`, 1,992 lines) covers a broad surface but payload-completeness for edit is not guaranteed to be asserted — verify before relying on it.

**MSA/Contract shared components (CreateMSADialog, CreateContractSheet):**
- Files: `src/pages/MsaPage/layouts/CreateMSADialog.tsx` (1,670 lines, shared for create AND edit), `src/pages/ContractManagementPage/components/CreateContractSheet.tsx` (1,337 lines)
- Why fragile: Single component serves multiple modes (create vs. edit) via prop switches (documented pattern: `project_msa_edit_dialog`, `project_shared_component_contracttype_switch`), which means a fix for one mode can regress the other.
- Safe modification: When touching either dialog, manually verify both create and edit modes still work — automated coverage may not exercise every mode/role combination.
- Test coverage: `src/pages/MsaPage/__tests__/msa.spec.ts` (1,189 lines) exists but is broad; mode-specific regressions have recurred historically per memory.

**SuperDoc/collaboration editor integration:**
- Files: `src/pages/CollaborationToolPage/**` (see `EditorPanel.tsx`, `index.tsx`)
- Why fragile: Multiple documented architecture pivots (Yoopta+Yjs sync broken → TipTap migration) and ongoing redline/turn-negotiation design work still in progress per project memory (`project_redline_turn_negotiation_design_260701`, `project_collab_yoopta_yjs_sync_broken`, `project_collab_tiptap_migration`). This is the least-stable subsystem in the codebase by historical bug count.
- Safe modification: Treat this area as actively evolving; confirm current architecture decisions in memory before making changes (Yjs WS protocol, single-WS-per-(user,room) constraint, room keyed by fileName is a known leak — `feedback_collab_room_keyed_by_filename_leaks`).
- Test coverage: `src/pages/CollaborationToolPage/__tests__/collaboration.spec.ts`, `documentViewer.spec.ts`, `EditorPanelImport.test.tsx` exist but the subsystem has changed architecture multiple times, so coverage currency should be verified before trusting it.

## Scaling Limits

**Client-side XLSX/PDF export:**
- Current capacity: Reports (Vendor Report, Company data export, etc.) are exported client-side (`project_client_side_pdf_export_pattern`, `reference_client_side_xlsx_export_pattern`).
- Limit: Large datasets (e.g., full company export with many contracts/files) risk browser memory/time limits since generation happens in the browser rather than server-streamed.
- Scaling path: For company-wide exports (`project_company_data_export_endpoint`, QA #190 file-inclusive export), prefer server-generated bundles over client-side assembly as data volume grows.

## Dependencies at Risk

Not assessed in this pass — no direct evidence of deprecated/abandoned packages was found during exploration. A dedicated `npm outdated` / `npm audit` pass (tech-focus mapping) is recommended to populate this section with concrete package/version findings.

## Missing Critical Features

**No multi-role user model (super-admin/admin service):**
- Problem: Users are strictly single-role in both the bug and production admin-service environments; combined access (e.g., Evaluator+Approver, PL+CM) is not supported (QA #177).
- Blocks: Any workflow requiring one person to hold two roles simultaneously must be worked around via separate accounts or is simply unavailable.

**No approver add/remove/adjust on Approvers tab:**
- Problem: Contract Approvers tab has no BUILD-level endpoint for modifying the assigned approver set post-creation (QA #1).
- Blocks: Correcting an approver roster after contract creation requires a workaround or is not possible via the UI.

**Redline persistence gaps in the collaboration/redline flow:**
- Problem: AI-generated redline suggestions regenerate on reopen rather than persisting (QA #232); resolved/dismissed suggestions can't be undone (QA #236); progress isn't saved for resuming later (QA #237).
- Blocks: Users cannot reliably pause and resume a redline review session without losing state.

## Test Coverage Gaps

**Dashboard analytics/module-gating logic:**
- What's not tested: Truthy-vs-strict-equality module flag gating, role-keyed config lookups, and the specific empty-state wiring bugs documented in memory appear to have been caught by manual QA rather than automated tests, based on the volume of repeat dashboard-related feedback items.
- Files: `src/hooks/useDashboardData.ts`, `src/lib/dashboardDataTransformer.ts`, `src/components/layouts/RoleBasedDashboard/**`
- Risk: Regressions in module visibility/gating logic can ship silently since these are config-driven branches easy to miss in code review.
- Priority: High — this is the most frequently-recurring bug category per project history.

**Role/permission boundary tests (vendor vs. PM vs. manager vs. approver):**
- What's not tested: Cross-role UI leakage (e.g., `feedback_procurement_contracts_tab_action_data_leak`) suggests there is no systematic test asserting that role A never sees role B's actions/data across all tabs.
- Files: Role-gated components across `src/pages/ContractManagementPage/**`, `src/pages/MsaPage/**`, `src/components/layouts/AuthorityGuard/**`
- Risk: New features that add role-gated UI can reintroduce leakage without an automated boundary test catching it.
- Priority: High — security/data-exposure adjacent.

**Collaboration/SuperDoc editor test currency:**
- What's not tested: Given multiple architecture rewrites (Yoopta→TipTap, Yjs sync issues), it's unclear whether `src/pages/CollaborationToolPage/__tests__/*` fully covers the current TipTap-based implementation vs. legacy behavior.
- Files: `src/pages/CollaborationToolPage/__tests__/collaboration.spec.ts`, `documentViewer.spec.ts`, `EditorPanelImport.test.tsx`
- Risk: Tests may assert on since-replaced architecture, giving false confidence.
- Priority: Medium — verify test relevance before trusting green results in this area.

---

*Concerns audit: 2026-07-22*
