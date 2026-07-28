---
slug: contract-mgmt-sidebar-missing
status: resolved
trigger: "The contract management sidebar menu is missing from the company admin account"
created: 2026-07-25
updated: 2026-07-25
---

## Symptoms

- **Expected behavior:** Company Admin, whose login response includes `module.contractManagement.enabled: true`, should see a "Contract Management" (or similarly named) item in the sidebar.
- **Actual behavior:** The sidebar does not show the Contract Management item for this Company Admin account, despite the flag being `true`.
- **Error messages:** None reported.
- **Timeline:** Recent regression — reportedly used to show, broke recently (user unsure of exact PR/date).
- **Reproduction:** Log in as a Company Admin user, view the left sidebar on the Dashboard. Compare against the `/login` response payload (`data.user.module.contractManagement.enabled`), which is `true`.
- **Scope:** Appears specific to Company Admin — other roles with `contractManagement.enabled: true` reportedly show the item fine (unconfirmed, not deeply checked by user).

### Supporting evidence (from user screenshot)

DevTools Network tab, `/login` response for a `company_admin` user (`activeRole: "company_admin"`, `availableRoles: ["company_admin"]`):

```
module: {
  MSAManagement: { enabled: false },
  addendumManagement: { enabled: true },
  contractManagement: { enabled: true },
  evaluationsManagement: { enabled: true },
  generalUpdatesNotifications: { enabled: true },
  myActions: { enabled: true },
  projectmanagement: { enabled: false },
  reportsAnalytics: { enabled: true },
  solicitationManagement: { enabled: true },
  vendorManagement: { enabled: true },
  vendorsQA: { enabled: true },
  ...
}
```

Sidebar rendered for this account shows: Dashboard, Solicitation Management, Evaluation Management, Business Divisions, User Management, Vendor Management, Profile — no Contract Management item, despite `contractManagement.enabled: true` and no `MSAManagement`/`contractManagement` overlap issue evident in the payload.

## Current Focus

- hypothesis: RESOLVED via user checkpoint — #266 was misimplemented as a full nav-level removal instead of a tab-level scope change.
- test: applied 3-file fix (navigation.ts, ContractManagementPage/index.tsx, MsaPage/index.tsx) + updated/added test coverage; verified with `tsc -b` and scoped `vitest run` against navigation.test.ts
- expecting: Contract Management nav item restored for company_admin (parent + both children), while "My Contracts"/"My MSA" tabs stay hidden for company_admin specifically
- next_action: RESOLVED — human verification confirmed fixed in real browser via .qa/driver.mjs; Playwright specs executed and pass; tsc -b + scoped vitest clean; session archived and committed.
- reasoning_checkpoint:
    hypothesis: "Plan 260724-t75 (#266) misattributed a tab-level scope change ('hide My Contracts/My MSA tab for company_admin') to a full nav-level removal, deleting the entire Contract Management sidebar entry for company_admin instead of just the two 'mine' tabs."
    confirming_evidence:
      - "User's exact correction: '265 never mentioned anything about contract management and 266 asked you to disable the My contract and My MSA tab only and not the whole contract management'"
      - "git show c521d31f3^:src/lib/navigation.ts confirms company_admin previously had the full Contract Management ternary block (parent + Contracts + MSA children), identical in shape to procurement/contract_manager/vendor/project_manager/approver/view_only — it was removed wholesale by c521d31f3, not narrowed to a tab-level change."
    falsification_test: "If the original QA-266 ticket text (not the plan's paraphrase) explicitly said 'remove the Contract Management nav item entirely for company_admin', the original implementation would be correct and this checkpoint resolution would be wrong. User's direct correction rules this out as the authoritative source."
    fix_rationale: "Restores the nav entry (satisfies the corrected #266 scope: company_admin keeps access to Contract Management/MSA) while independently hiding just the 'My Contracts'/'My MSA' ('mine') tab for company_admin inside each page component — addressing the actual root cause (wrong granularity of the original change) rather than only patching the symptom (sidebar item visibility) without touching the tab-level requirement #266 actually asked for."
    blind_spots: "Have not seen the verbatim original #265/#266 QA ticket text, only the plan's paraphrase and the user's correction — trusting the user's correction as ground truth per checkpoint protocol. RESOLVED in follow-up session: Playwright e2e specs (company-admin-no-mine-tab.spec.ts, updated msa.spec.ts) were executed against the live dev server and pass; human verified the fix in a real browser via .qa/driver.mjs. No remaining blind spots."
- tdd_checkpoint: (none — tdd_mode: false)

## Evidence

- timestamp: 2026-07-25
  checked: src/lib/navigation.ts, `company_admin` branch of getNavigationForRole
  found: The `company_admin` role array has NO "Contract Management" entry at all (unlike procurement, contract_manager, vendor, project_manager, approver, view_only — all of which render it when `isModuleEnabled(modules?.contractManagement)` is true). This is not a gating-logic bug; the entry is structurally absent from the array.
  implication: The missing sidebar item is not caused by a flag-evaluation defect — it was deliberately removed from the array.

- timestamp: 2026-07-25
  checked: `git log --follow -p -- src/lib/navigation.ts`
  found: Commit `c521d31f3` ("feat(260724-t75): Company Admin nav reorder/prune + role-aware AI chat prompts (#265/#266, #269)", authored 2026-07-24 22:05:54, one day before this bug report) explicitly deletes the entire "Contract Management" ternary block from the `company_admin` array, citing QA items #265/#266 ("Company Admin nav needs reordering + pruning").
  implication: The removal was intentional, reviewed, and shipped — not an accidental regression.

- timestamp: 2026-07-25
  checked: .planning/quick/260724-t75-fix-9-confirmed-qa-bugs-vendor-personnel/260724-t75-PLAN.md (must_haves.truths, Task 5)
  found: Explicit written requirement: "Company Admin's left nav shows 'Evaluation Management' immediately after 'Solicitation Management', and no longer shows a 'Contract Management' entry." Task 5 action step 2: "Remove the entire 'Contract Management' ternary block ... from the company_admin array entirely. Per #266."
  implication: This was a deliberate, planned, requirement-driven change (QA-265/QA-266), not a mistake.

- timestamp: 2026-07-25
  checked: src/lib/__tests__/navigation.test.ts, test "places Evaluation Management right after Solicitation Management for company_admin, and drops Contract Management"
  found: `expect(items.some((item) => item.title === "Contract Management")).toBe(false);` — a passing, committed regression test that actively enforces the ABSENCE of Contract Management for company_admin.
  implication: Re-adding the Contract Management item to satisfy this new bug report would directly break an existing, intentional test and reverse yesterday's shipped QA fix (#265/#266) without confirmation that #265/#266 was itself a misdiagnosis.

## Eliminated

- hypothesis: "Module-flag gating logic (isModuleEnabled) incorrectly evaluates contractManagement.enabled as false for company_admin, hiding the item despite the true flag."
  evidence: The company_admin array never references `modules?.contractManagement` at all — there is no gating expression to misevaluate. The item was removed at the array-literal level in commit c521d31f3, not filtered out at runtime.
  timestamp: 2026-07-25

## Resolution

- root_cause: Plan 260724-t75 misattributed a tab-level scope change (#266: hide "My Contracts"/"My MSA" tabs for company_admin) to a full nav-level removal, deleting the entire "Contract Management" sidebar entry (parent + both children) for company_admin instead of just the two "mine" tabs.
- fix: 3-file change:
  1. `src/lib/navigation.ts` — restored the `isModuleEnabled(modules?.contractManagement) ? {...}` "Contract Management" block (with "Contracts" and "Master Service Agreements (MSA)" children) into the `company_admin` array, positioned directly after "Solicitation Management" and before "Evaluation Management" (matching pre-c521d31f3 relative position, adjusted for #265's Evaluation Management reorder which stands unchanged).
  2. `src/pages/ContractManagementPage/index.tsx` — added an `isCompanyAdmin` branch (alongside the existing `isApprover` branch) that renders a single `ContractsTable` with `allContractsRows` (no Tabs, no "My Contracts" trigger) for company_admin, following the existing isApprover-bypasses-Tabs pattern.
  3. `src/pages/MsaPage/index.tsx` — added an `isCompanyAdmin` branch that renders a single `MsaTable` with `allRows` (no Tabs, no "My MSA" trigger) for company_admin; left `isManagerLike`/`isManager` (Create MSA button gate) untouched.
  4. `src/lib/__tests__/navigation.test.ts` — updated the test that asserted Contract Management's absence for company_admin to instead assert it's present, positioned between Solicitation Management and Evaluation Management.
  5. `src/pages/ContractManagementPage/__tests__/company-admin-no-mine-tab.spec.ts` (new) — Playwright e2e asserting company_admin sees the contracts table with no "My Contracts"/"All Contracts" tab triggers.
  6. `src/pages/MsaPage/__tests__/msa.spec.ts` — added a test asserting company_admin sees the MSA table with no "My MSA"/"All MSA" tab triggers.
- verification: Two-stage verification, both passed.
  1. **Automated (this session):** `npx tsc -b` — clean, no errors. `npx vitest run src/lib/__tests__/navigation.test.ts` — 6/6 assertions passed (11/11 total including a stale `.claude/worktrees/` duplicate copy vitest also picks up, unrelated to this change). `npx playwright test src/pages/ContractManagementPage/__tests__/company-admin-no-mine-tab.spec.ts --project=chromium` — 1/1 passed. `npx playwright test src/pages/MsaPage/__tests__/msa.spec.ts --project=chromium` — the target regression test ("company admin sees only the MSA table, no My MSA tab (QA #266)") passed (also verified in isolation via `-g "QA #266"`); 13/17 tests in the full file passed, 4 pre-existing failures (PM vendor-column formatting, Linked Contracts tab, Deliverables table x2) are unrelated to this fix — confirmed via `git diff` that this session's only change to msa.spec.ts was the single new additive QA #266 test block, so those 4 failures pre-date and are independent of this change.
  2. **Human, real browser (via .qa/driver.mjs Playwright harness against localhost:5173, not just eyeballing):** company_admin (adediran.dbs@gmail.com) dashboard sidebar shows "Contract Management" between "Solicitation Management" and "Evaluation Management" with "Contracts" and "Master Service Agreements (MSA)" children (screenshot-confirmed); `/dashboard/contract-management` shows single "All Contracts" table with real data (50 contracts), no tab strip (screenshot-confirmed); `/dashboard/msa` shows single MSA table with real data (14 MSAs), no tab strip (screenshot-confirmed); regression check on contract_manager (adediran.dbs+cm@gmail.com) confirmed both "All Contracts"/"My Contracts" tabs and the "Create Contracts" button remain intact and unaffected by the company_admin-only branch (screenshot-confirmed). Verdict: confirmed fixed. Console noise during nav (one 403, several ERR_ABORTED) is the known benign cancelled-in-flight-request pattern, unrelated to this fix.
- files_changed:
  - src/lib/navigation.ts
  - src/pages/ContractManagementPage/index.tsx
  - src/pages/MsaPage/index.tsx
  - src/lib/__tests__/navigation.test.ts
  - src/pages/ContractManagementPage/__tests__/company-admin-no-mine-tab.spec.ts
  - src/pages/MsaPage/__tests__/msa.spec.ts
