---
phase: 260723-att-add-vitest-coverage-for-rfi-close-edit-a
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/ContractManagementPage/__tests__/rfi-close-edit.test.tsx
  - src/pages/MsaPage/__tests__/rfi.test.tsx
  - src/pages/ContractManagementPage/__tests__/vendor-personnel-tab.test.tsx
autonomous: true
requirements: [test-coverage-rfi-close-singular-url, test-coverage-rfi-edit-parity, test-coverage-vendor-personnel-status-gate]

must_haves:
  truths:
    - "RFI close request goes to singular /rfi/{id}/close for both Contract Manager and MSA roles (never /rfis/{id}/close)"
    - "RFI close button is hidden for non-issuers, and hidden once the RFI's status is closed, even for the issuer"
    - "RFI edit dialog is wired to the manager-only plural /rfis/{id} path for Contract, and to the singular /rfi/{id} path for MSA (all roles) and for non-manager Contract roles"
    - "Vendor Personnel add/edit/remove actions are hidden when status is draft, even for the owning manager/company-admin"
    - "Vendor Personnel add/edit/remove actions are shown only when status is active or publish AND the caller is the owner"
    - "Vendor Personnel save PUTs to /contract/manager/{contracts|msa-contracts}/{id}/vendor-personnel with a personnel array payload"
  artifacts:
    - path: "src/pages/ContractManagementPage/__tests__/rfi-close-edit.test.tsx"
      provides: "Close/issuer-gate/status-gate/edit-URL tests for the Contract RfiTable.tsx RfiDetailsSheet"
    - path: "src/pages/MsaPage/__tests__/rfi.test.tsx"
      provides: "Existing pagination test plus new close/issuer-gate/status-gate/edit-URL tests for MSA Rfi.tsx RfiDetailsSheet"
    - path: "src/pages/ContractManagementPage/__tests__/vendor-personnel-tab.test.tsx"
      provides: "Status/owner-gated action visibility tests and PUT url/payload tests for VendorPersonnelTabContent.tsx (both contractType values)"
  key_links:
    - from: "rfi-close-edit.test.tsx and rfi.test.tsx close-button click"
      to: "mocked postRequest"
      via: "closeRfiMutation.mutationFn posting to `${rfiRoleBase|basePath}/${rfiId}/close`"
      pattern: "rfi/[^/]+/close"
    - from: "vendor-personnel-tab.test.tsx Save click"
      to: "mocked putRequest"
      via: "saveMutation.mutationFn putting to basePath with {personnel:[...]}"
      pattern: "vendor-personnel"
---

<objective>
Add Vitest regression coverage for three lifecycle flows shipped this session, so the just-fixed RFI-close URL bug (and its siblings) can never silently regress again:

1. RFI close (Contract `RfiTable.tsx` + MSA `Rfi.tsx`) — must POST to the singular `/rfi/{id}/close` for ALL roles including manager; must be issuer-gated and closed-status-gated.
2. RFI edit — Contract Manager uses plural `/rfis/{id}`, everyone else (MSA all roles, Contract non-manager) uses singular `/rfi/{id}`.
3. Vendor Personnel tab (`VendorPersonnelTabContent.tsx`) — actions are gated on `owner && (status==='active'||'publish')`, and the save PUT targets `/contract/manager/{contracts|msa-contracts}/{id}/vendor-personnel` with a `{personnel:[...]}` body.

Purpose: These three flows were hand-fixed today from real regressions (RFI close hitting the wrong plural URL). Nothing currently exercises them in the test suite — a future edit to any of these files can silently reintroduce the bug with no red test to catch it.
Output: Two new Vitest files and one extended existing Vitest file, all passing under `npx vitest run` scoped to the changed files.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@.planning/codebase/TESTING.md

Relevant source (already read during planning):
- src/pages/ContractManagementPage/components/RfiTable.tsx — `RfiDetailsSheet` (not exported; only reachable by mounting the exported default `RfiTable` and rendering a row through the "actions" column). Key lines: `rfiRoleBase` (lines ~262-269) is ALWAYS singular `/contract/{approver|vendor|manager}/contracts/{contractId}/rfi` regardless of role — used only by `closeRfiMutation` (posts `${rfiRoleBase}/${rfiId}/close`, line ~274). The inline `editBase` computed separately inside the header IIFE (lines ~378-384) is plural `/contract/manager/contracts/{contractId}/rfis` for the manager branch only, singular `/rfi` for approver/vendor — passed as `basePath` + `editPath` into `IssueRfiDialog` (imported from `../layouts/RfiTabContent`, NOT exported from this file, so it must be mocked to observe its received props). Close button (`data-testid="close-rfi-trigger"`) renders only when `isRfiIssuer && rfiStatus?.toLowerCase() !== "closed"` (line ~426). Edit trigger (`data-testid="edit-rfi-trigger"`) renders only when `isIssuer` is true inside the IIFE (no separate closed-check duplicated there — re-verify against source at implementation time; if edit is NOT closed-gated in the actual code, do not assert a closed-gate for edit, only for close). `rfiTitle`/`rfiStatus`/`submittedByRaw` all read from the `rfi` prop directly when the detail query hasn't resolved (`rfi?.status`, etc.) — so tests can drive all gating purely off the `rfi` prop passed into `RfiDetailsSheet` via a row, with no need to make the detail query resolve.
- src/pages/MsaPage/__tests__/rfi.test.tsx — existing file. Mocks `@/hooks/useUserRole`, `@/hooks/useUserQueryKey`, `@/hooks/useToaster`, `@/lib/axiosInstance` (`getRequest`, `postRequest` only — no `patchRequest`), `@/components/ui/tabs`, `@/components/ui/dialog` (currently only `Dialog`, `DialogClose`, `DialogContent`, `DialogTitle`, `DialogTrigger` — missing `DialogHeader`/`DialogDescription`), `@/components/ui/sheet` (full set, pass-through), `@/components/layouts/DataTable` (shallow stub that shows only a row count + "Next RFI page" button — does NOT invoke `columns`/`cell` renderers, so RFI row actions never mount with the current mock), `@/pages/ContractManagementPage/components/RfiStatsCards`, `@/components/layouts/FormInputs`, `@adexdsamson/forge`, `react-hook-form`, `@/components/ui/file-upload`, `@/pages/ContractManagementPage/components/DocumentItem`, `@/pages/SolicitationManagementPage/components/MessageComposer`. Does NOT mock `@/store/authSlice` — `Rfi.tsx`'s issuer/responder identity checks use real (unmocked) `useUser()`, which will return no user by default, so `isIssuer`/`isAssignedResponder` are always false under the current file as-is.
- src/pages/MsaPage/layouts/Rfi.tsx — `RfiDetailsSheet` (not exported, reached only via the exported default `Rfi` component + a rendered row). `basePath` (lines ~1311-1317) is singular `/contract/{manager|approver|vendor|user}/msa-contracts/{contractId}/rfi` for ALL roles including manager — used for BOTH the close mutation (`${basePath}/${rfiId}/close`, line ~629) AND the edit dialog's `createPath`/`editPath` (`${basePath}/${rfiId}`, line ~761) — i.e. MSA has no plural/singular split at all; edit and close share the exact same base. `isIssuer` (lines ~619-622) and `isClosed` (line 623) gate both the close button (`data-testid="close-rfi-trigger"`, line ~786) and the edit trigger (`data-testid="edit-rfi-trigger"`, line ~755) identically: `isIssuer && !isClosed`. `detail` falls back to the `fallback` prop (`(data?.data)?.contractRfi ?? data?.data ?? fallback`, line 611) when the query hasn't resolved, and `fallback` is populated from the row's `raw` field (`fallback={row.original.raw}`, line 1495) — so, same as Contract, gating can be driven purely from the row data passed in, no query resolution required.
- src/pages/ContractManagementPage/layouts/VendorPersonnelTabContent.tsx — exported default. `canManage = (isManager || isCompanyAdmin) && Boolean(owner) && (status === "active" || status === "publish")` (lines ~52-54). `basePath` = `/contract/manager/${segment}/${contractId}/vendor-personnel` where `segment` is `"msa-contracts"` when `contractType==="MsaContract"`, else `"contracts"` (lines 58-59). `saveMutation.mutationFn` (lines 87-105) PUTs `{ personnel: next.map(p => ({name, email, phone: phone||undefined, role: role||undefined})) }` to `basePath` via `putRequest`. Query for the list is `enabled: Boolean(contractId) && !!isActive` (line 75) via `getRequest` — must resolve (or resolve to `{data:{data:[]}}`) or the component stays in a loading/empty state; this does not block the visibility assertions but the query mock must still be provided so React Query doesn't throw on an unhandled rejection. "Add Personnel" button only renders when `canManage` (line 236); per-row "Edit"/"Remove" (`data-testid="edit-personnel"`/`"remove-personnel"`) only render when `canManage` is true, appended as an extra `actions` column (lines 185-210) — this column IS invoked by the real `DataTable` if unmocked, or must be invoked by a custom mock if `DataTable` is mocked.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Contract RfiTable — close singular-URL, issuer/status gating, edit-URL wiring</name>
  <files>src/pages/ContractManagementPage/__tests__/rfi-close-edit.test.tsx</files>
  <behavior>
    - Render the default-exported `RfiTable` with one row whose `rfi` carries `_id`, `status`, `submittedBy: {_id, name}`, `title`, `rfiId`, `type`, `contractRef`. Mock `@/components/layouts/DataTable` with a version that iterates `data` and, for each row, invokes every column's `cell({ row: { original: row, index }, getValue: () => row[col.accessorKey] })` when `cell` is a function (falling back to `row[col.accessorKey]` otherwise) — this is required so the "actions" column's `RfiRowActions`/`RfiDetailsSheet` actually mounts; the MSA file's existing row-count-only DataTable stub is NOT sufficient here and must not be copied as-is.
    - Mock `@/hooks/useUserRole` with a mutable object (same hoisted-object-plus-`Object.assign`-in-`beforeEach` pattern as `src/pages/MsaPage/__tests__/rfi.test.tsx`) exposing `isApprover`/`isVendor`/`isProjectManager` (default all false = contract-manager branch).
    - Mock `@/store/authSlice`'s `useUser` with a mutable current-user object so `currentUser?._id` can be set to match or mismatch `submittedBy._id` per test.
    - Mock `@/lib/axiosInstance` with `getRequest` and `postRequest` as `vi.fn()` (resolve `getRequest` to an empty/benign envelope for the detail+comments queries; they are not required to resolve for gating assertions since `rfi`-prop fallbacks drive the gated UI).
    - Mock `@/components/ui/dialog` including `Dialog`, `DialogClose`, `DialogContent`, `DialogHeader`, `DialogDescription`, `DialogTitle`, `DialogTrigger` as pass-through wrappers — `DialogHeader`/`DialogDescription` are required because `ConfirmAlert` (real, unmocked) uses them and will throw "element type is invalid" if left undefined. Mock `@/components/ui/sheet` and `@/components/ui/tabs` as pass-through per the MSA file's existing pattern. Mock `@/pages/ContractManagementPage/layouts/RfiTabContent` so `IssueRfiDialog` becomes a stub that renders its `trigger` plus a `data-testid="issue-rfi-dialog-props"` element serializing its `basePath`/`mode`/`editPath` props as text — this captures the exact URL string RfiTable.tsx wires into it without needing to drive a real form submission.
    - Test 1 (issuer, status "open"): `close-rfi-trigger` is present; clicking it, then clicking the ConfirmAlert's primary "Close RFI" button (disambiguate from the trigger via `getAllByRole("button", {name:"Close RFI"})` and click the entry that is not the `data-testid="close-rfi-trigger"` element) calls `postRequest` with `url` matching `/contract/manager/contracts/{contractId}/rfi/{rfiId}/close` — singular `/rfi/`, not `/rfis/`.
    - Test 2 (non-issuer, status "open"): `close-rfi-trigger` is absent.
    - Test 3 (issuer, status "closed"): `close-rfi-trigger` is absent even though issuer.
    - Test 4 (issuer, contract-manager role): the `issue-rfi-dialog-props` element's serialized `basePath`/`editPath` contains `/contract/manager/contracts/{contractId}/rfis` — plural.
    - Test 5 (issuer, `isApprover: true`): the `issue-rfi-dialog-props` element's serialized `basePath`/`editPath` contains `/contract/approver/contracts/{contractId}/rfi` — singular, no trailing `s`.
  </behavior>
  <action>
  Implement the five test cases described in `<behavior>`, following the mocking conventions already established in `src/pages/MsaPage/__tests__/rfi.test.tsx` (hoisted mutable mock objects reset in `beforeEach`, `QueryClientProvider` with `retry:false`) and `src/pages/ContractManagementPage/__tests__/compliance-security.test.tsx` (asserting gated button presence/absence via `screen.queryByRole`/`getByTestId`). Do not attempt to exercise `IssueRfiDialog`'s actual submit/PATCH behavior in this file — that component lives in `RfiTabContent.tsx`, is out of scope for this quick task, and is fully mocked here specifically to make the URL-wiring assertion tractable without a real form submission.
  </action>
  <verify>
    <automated>npx vitest run src/pages/ContractManagementPage/__tests__/rfi-close-edit.test.tsx</automated>
  </verify>
  <done>All 5 test cases pass; `postRequest` assertion in Test 1 matches the singular `/rfi/{id}/close` pattern (a test asserting the plural `/rfis/.../close` would fail); Tests 4 and 5 assert the literal plural-vs-singular `editBase` strings, not just that IssueRfiDialog rendered.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: MSA Rfi — close singular-URL, issuer/status gating, edit-URL parity with Contract</name>
  <files>src/pages/MsaPage/__tests__/rfi.test.tsx</files>
  <behavior>
    - Add `vi.mock("@/store/authSlice", ...)` exporting a mutable `useUser` (hoisted object, reset in `beforeEach` to a default that does not break the existing pagination test — e.g. default `_id: undefined` so existing behavior is unaffected unless a new test explicitly sets an id).
    - Extend the existing `@/components/ui/dialog` mock to add `DialogHeader` and `DialogDescription` pass-throughs (required by the real, unmocked `ConfirmAlert`).
    - Replace the existing `@/components/layouts/DataTable` stub with one that both (a) preserves the current pagination-test behavior (row count via `data-testid="rfi-row-count"`, a "Next RFI page" button wired to `options.setPagination`) and (b) invokes each column's `cell({ row: { original: row, index }, getValue: () => row[col.accessorKey] })` per row so the "actions" column (and thus `RfiDetailsSheet`) mounts — same technique as Task 1's mock, adapted to also keep the pagination attributes (`data-manual-pagination`, `data-disable-pagination`, `data-total-counts`) the existing test reads.
    - Add `postRequest` to the existing `@/lib/axiosInstance` mock's mocked functions if not already present as a `vi.fn()` (it is; ensure it is reset per test) — no `patchRequest` mock is needed since these tests do not exercise the edit dialog's submit, only its wiring (same rationale as Task 1).
    - Test 1 (issuer via `fallback.submittedBy._id` matching mocked current user, status "open"): `close-rfi-trigger` present; click it then click ConfirmAlert's primary "Close RFI" button (same disambiguation technique as Task 1); assert `postRequest` called with `url` matching `/contract/manager/msa-contracts/{contractId}/rfi/{rfiId}/close`.
    - Test 2 (non-issuer): `close-rfi-trigger` absent.
    - Test 3 (issuer, status "closed"): both `close-rfi-trigger` and `edit-rfi-trigger` absent (MSA gates both identically on `isIssuer && !isClosed`, unlike Contract where only close is closed-gated).
    - Test 4 (issuer, status "open", any role incl. manager): `edit-rfi-trigger` present; clicking it renders the real (unmocked, in-file) `IssueRfiDialog` in edit mode — assert the dialog's title text is "Edit RFI" and that no separate plural `/rfis` base is used anywhere (MSA has no plural variant at all — this is the parity difference from Contract). Do this by asserting on the rendered `DialogTitle` text only; do not attempt to submit the form.
  </behavior>
  <action>
  Add the four new tests described in `<behavior>` inside the existing `describe("MSA RFI", ...)` block (or a new adjacent `describe` in the same file), reusing the file's existing `renderRfi()` helper and `mockedGetRequest` implementation, extending the `getRequest` mock's URL-based branching to also resolve the RFI list with a row carrying the fields needed for gating (`_id`/`rfiId`/`title`/`type`/`status`/`submittedBy`). Do not change the existing pagination test's assertions or remove any of its mocks — only add to them.
  </action>
  <verify>
    <automated>npx vitest run src/pages/MsaPage/__tests__/rfi.test.tsx</automated>
  </verify>
  <done>All 5 tests in the file pass (1 existing pagination test + 4 new); Test 1's `postRequest` assertion matches the singular `/rfi/{id}/close` MSA path; Test 3 confirms MSA's edit gate is closed-status-gated identically to its close gate (unlike Contract).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Vendor Personnel tab — status/owner gating + PUT url/payload for both contract types</name>
  <files>src/pages/ContractManagementPage/__tests__/vendor-personnel-tab.test.tsx</files>
  <behavior>
    - Mock `@/hooks/useUserRole` (mutable, controls `isManager`/`isCompanyAdmin`), `@/hooks/useUserQueryKey`, `@/hooks/useToaster`, `@/lib/axiosInstance` (`getRequest`, `putRequest` as `vi.fn()`; `getRequest` resolves `{data:{data:[]}}` by default so the initial personnel list query settles cleanly), `@/store/authSlice` (`useSetReset` as `vi.fn()`, needed transitively by the real, unmocked `ConfirmAlert`).
    - Render the default-exported `VendorPersonnelTabContent` with `contractId`, `isActive`, `owner`, `status`, and `contractType` props varied per test; `DataTable` and `Dialog` do not need custom cell-invoking mocks here because the component's own "actions" column only exists conditionally in its `columns` memo (built in JS, not via a table library callback boundary) — confirm this against the source before deciding whether `@/components/layouts/DataTable` needs a cell-invoking mock (same technique as Tasks 1/2) or can use a simpler stub; if the real `DataTable`'s cell-rendering behavior is unclear at implementation time, default to the cell-invoking mock pattern from Task 1 to avoid a false negative.
    - Test 1 (status "draft", owner true, isManager true): "Add Personnel" button absent; with at least one personnel row present, `edit-personnel`/`remove-personnel` are absent for that row.
    - Test 2 (status "active", owner true, isManager true): "Add Personnel" button present; `edit-personnel`/`remove-personnel` present for an existing row.
    - Test 3 (status "publish", owner true, isCompanyAdmin true, isManager false): same as Test 2 — confirms company-admin is an equally valid manage-capable role, not just contract manager.
    - Test 4 (status "active", owner false, isManager true): "Add Personnel" absent — active status alone is not sufficient without ownership.
    - Test 5 (contractType "Contract", status "active", owner true): click "Add Personnel", fill name+email inputs, click "Save"; assert `putRequest` called with `url` `/contract/manager/contracts/{contractId}/vendor-personnel` and `payload.personnel` containing the entered `{name, email}` (phone/role `undefined` when left blank).
    - Test 6 (contractType "MsaContract", same flow): assert `putRequest` `url` is `/contract/manager/msa-contracts/{contractId}/vendor-personnel`.
  </behavior>
  <action>
  Implement the six test cases in `<behavior>`. Follow the same hoisted-mutable-mock-object + `beforeEach` reset pattern used in `src/pages/MsaPage/__tests__/rfi.test.tsx`. For Tests 5/6, drive the add-personnel dialog via real `Input` components (unmocked `@/components/ui/input`) using `fireEvent.change` on the Name and Email fields (matched via their visible label text or placeholder, e.g. "Full name" / "name@example.com"), then click the "Save" button; do not mock `@/components/ui/dialog`'s `DialogContent` in a way that hides the form fields.
  </action>
  <verify>
    <automated>npx vitest run src/pages/ContractManagementPage/__tests__/vendor-personnel-tab.test.tsx</automated>
  </verify>
  <done>All 6 tests pass; Tests 5/6 assert the literal `contracts` vs `msa-contracts` URL segment difference and a `personnel` array payload, not just that `putRequest` was called.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| N/A | This plan adds test files only; it does not modify any production code path, route handler, or trust boundary. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|------------------|
| T-260723att-01 | N/A | Test files only | accept | No production code is modified by this plan; existing server-side authorization (issuer/owner/status gates) is unchanged — these tests only assert the FE already reflects those gates correctly in its UI. |
</threat_model>

<verification>
- `npx vitest run src/pages/ContractManagementPage/__tests__/rfi-close-edit.test.tsx` passes.
- `npx vitest run src/pages/MsaPage/__tests__/rfi.test.tsx` passes (including the pre-existing pagination test, unmodified in assertions).
- `npx vitest run src/pages/ContractManagementPage/__tests__/vendor-personnel-tab.test.tsx` passes.
- Grep confirms at least one assertion per file matches a singular `/rfi/[^/]*/close` URL string (not `/rfis/`).
- Do NOT run a bare `npx vitest run` across the whole suite (memory: vitest scans stale `.claude/worktrees` and can produce unrelated failures) — scope every run to the specific new/modified file paths.
</verification>

<success_criteria>
- A future accidental reversion of the RFI close endpoint back to plural `/rfis/{id}/close` (for any role, either contract type) fails at least one of these new tests.
- A future accidental swap of the Contract-Manager-only plural edit path with the singular path (or vice versa) fails Task 1's Tests 4/5.
- A future accidental removal of the Vendor Personnel status/owner gate (e.g. showing Add/Edit/Remove on a draft contract) fails Task 3's Tests 1 or 4.
- A future accidental change to the Vendor Personnel PUT URL segment (`contracts` vs `msa-contracts`) or payload shape (`personnel` array) fails Task 3's Tests 5/6.
</success_criteria>

<output>
After completion, create `.planning/quick/260723-att-add-vitest-coverage-for-rfi-close-edit-a/260723-att-SUMMARY.md`
</output>
