---
name: msa-change-mgmt-flow-review
description: Per-role user-flow comparison of Change Management tab — MSA vs Contract Management (Contract = expected behavior)
date: 2026-05-25
status: complete
---

# Change Management — MSA vs Contract User-Flow Review

**Audit type:** Read-only static-code comparison. No HTTP calls, no UAT.
**Reference (source of truth):** Contract Management.
**Candidate:** MSA.
**Scope:** Manager, Approver, Vendor/PM (+ View-only).
**Dimensions:** Tab visibility · Role gates · Column shape · Details-sheet selection · **Mutation-side-effect invalidation**.

> Endpoint paths verified against `docs/swagger-phase-2.json` (260525). MSA Changes uses **plural `msa-contracts/`** path per the BE spec — different from most other MSA entities. See memory `msa-contracts-plural-invoice-approve-quirk` (extends to Changes too).

---

## Files

| Role of file | Contract (expected) | MSA (actual) |
|---|---|---|
| Tab whitelist | [ContractDetailPage.tsx:124-172](src/pages/ContractManagementPage/ContractDetailPage.tsx#L124-L172) | [MsaDetailPage.tsx:95-158](src/pages/MsaPage/MsaDetailPage.tsx#L95-L158) |
| Tab shell | [ChangeTabContent.tsx](src/pages/ContractManagementPage/layouts/ChangeTabContent.tsx) (311 lines) | [ChangeManagement.tsx](src/pages/MsaPage/layouts/ChangeManagement.tsx) (393 lines) |
| Shared stats cards | `ChangeStatsCards` (MSA uses) | same |
| Shared create dialog | `CreateChangeDialog` (already parameterized via `documentType` prop) | same |
| Shared details sheet — **manager flavor** | `ChangeDetailsSheet` (MSA uses for all roles) | same |
| Shared details sheet — **approver flavor** | `ApproverChangeDetailsSheet` (Contract uses for approver) | **not imported by MSA** |
| Shared table | `ChangeTable` with variant-switch (Contract uses) | **not imported by MSA — inline DataTable** |

**Architectural posture:** Profile B-ish hybrid. MSA reuses three of the four shared components (`ChangeStatsCards`, `CreateChangeDialog`, `ChangeDetailsSheet`) but **inlines the table** with its own column definitions instead of importing `ChangeTable`. This is a different inline-reimpl shape than RFI (which inlined everything) and different from Amendments/Deliverables/NCR (which delegated everything).

The hybrid is the source of two of the three findings below.

---

## Per-Role Tab Visibility

| Role | Contract whitelist | MSA whitelist | Result |
|------|---|---|---|
| Manager | ALL tabs | includes `change` | ✅ |
| Vendor / PM | includes `change` | includes `change` | ✅ |
| Approver | includes `change` | includes `change` | ✅ |
| View-only | includes `change` | includes `change` | ✅ |

Parity.

---

## 🚨 BUG #1 — Invalidation-key trap (same pattern as Amendments/Deliverables/NCR)

[`ChangeDetailsSheet.tsx:298-301`](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx#L298-L301) — manager approve/reject mutation `onSuccess`:

```ts
qc.invalidateQueries({
  queryKey: ["contractChanges", contractId],
});
qc.invalidateQueries({ queryKey: changeDetailQueryKey });
```

The first invalidation is hardcoded to `["contractChanges", contractId]`. The detail key uses `roleBasePath` in its construction, so the detail invalidation works on both pages — but the **list/stats invalidation** misses on MSA because MSA's parent uses `["msaChanges", ...]`.

**On Contract** the parent layout's query keys are `["contractChanges", contractId, activeTab, ...]` and `["contractChanges", "stats", contractId, basePath]` ([ChangeTabContent.tsx:101-106](src/pages/ContractManagementPage/layouts/ChangeTabContent.tsx#L101-L106) + [:128-135](src/pages/ContractManagementPage/layouts/ChangeTabContent.tsx#L128-L135)) — prefix match on `["contractChanges", contractId]` catches the list query but **not the stats query** (position-1 is `"stats"`, not `contractId`). So even on Contract, **stats stay stale after approve/reject** — a pre-existing latent bug.

**On MSA** the parent uses `["msaChanges", contractId, activeTab, ...]` and `["msaChanges", "stats", contractId, rolePrefix]` ([ChangeManagement.tsx:93-106](src/pages/MsaPage/layouts/ChangeManagement.tsx#L93-L106)) — position-0 differs (`"contractChanges"` vs `"msaChanges"`). Both list AND stats invalidations miss.

### Observable consequences

| Role × Mutation | Contract | MSA |
|---|---|---|
| Manager approves/rejects a change | List flips status; stats stay stale (latent Contract bug) | Both list AND stats stay stale |
| Approver approves/rejects (via `ApproverChangeDetailsSheet` on Contract) | Different sheet — see #2 | MSA uses wrong sheet — see #2 |

**Fix shape:** identical port of `b7e30180a` (Amendments), `3583a08d3` (Deliverables), `84cae6903` (NCR). Lift to optional `listInvalidateQueryKey` / `statsInvalidateQueryKey` props on `ChangeDetailsSheet`. Defaults preserve current Contract behavior. **Fourth known instance of the trap class.**

Also see the sidebar in `ChangeDetailsSheet.tsx:700`:
```ts
qc.invalidateQueries({ queryKey: ["contractClaims"] });
```
This fires in the dual-purpose claims mode (`isClaim` branch). MSA Claims uses a different prefix (`["msaClaims"]` or similar — to be confirmed when reviewing Claims §3). This is a **flag for the Claims §3 review** but the same lift will close it.

---

## 🚨 BUG #2 — MSA approver gets the wrong details sheet

### Contract's behavior

`ChangeTable` switches columns AND details sheet by variant prop ([ChangeTable.tsx:280](src/pages/ContractManagementPage/components/ChangeTable.tsx#L280)):

- **Manager variant** ([:138-226](src/pages/ContractManagementPage/components/ChangeTable.tsx#L138-L226)) → columns include urgency, proposalCategory, files; actions cell renders **`ChangeDetailsSheet`** (manager-flavored, has approve/reject mutation).
- **Approver variant** ([:45-136](src/pages/ContractManagementPage/components/ChangeTable.tsx#L45-L136)) → columns include value, submittedAt, status; actions cell renders **`ApproverChangeDetailsSheet`** (approver-flavored, different gates and affordances per the 412-line component).

Contract's parent dispatches: `variant={isApprover ? "approver" : "manager"}` ([ChangeTabContent.tsx:252,264,298](src/pages/ContractManagementPage/layouts/ChangeTabContent.tsx#L252)).

### MSA's behavior

MSA inlines its own column definitions ([ChangeManagement.tsx:181-261](src/pages/MsaPage/layouts/ChangeManagement.tsx#L181-L261)) — single column set used for all roles. The actions cell hardcodes `<ChangeDetailsSheet>` ([:244-257](src/pages/MsaPage/layouts/ChangeManagement.tsx#L244-L257)) — **always the manager-flavored sheet, never the approver-flavored sheet**.

### Observable consequences

- **MSA approver** opens a change's "View" and gets `ChangeDetailsSheet` instead of `ApproverChangeDetailsSheet`. Missing approver-specific affordances (whatever differs in the 412 lines of `ApproverChangeDetailsSheet`).
- **MSA manager** sees the same sheet they should see, so no functional regression on the manager flow — but #3 below means manager's *table* looks different from Contract manager's table.

**Fix shape:** either
- (a) Swap MSA's inline table for the shared `ChangeTable` (largest refactor; closes #2 and #3 by inheritance — same playbook as the Amendments/Deliverables/NCR shared-table swaps), OR
- (b) Inline an `isApprover` switch in MSA's actions cell to render `ApproverChangeDetailsSheet` for approver (smaller change but doesn't address #3).

---

## ⚠️ BUG #3 — MSA's inline columns match Contract's approver variant, not the role-aware variant

### What MSA shows ([ChangeManagement.tsx:181-261](src/pages/MsaPage/layouts/ChangeManagement.tsx#L181-L261))

Columns (single set, all roles): `changeId`, `title`, `type`, **`value`**, **`submittedAt`**, `status`, actions.

This matches Contract's **approver** columns ([ChangeTable.tsx:45-136](src/pages/ContractManagementPage/components/ChangeTable.tsx#L45-L136)).

### What Contract shows the manager ([ChangeTable.tsx:138-226](src/pages/ContractManagementPage/components/ChangeTable.tsx#L138-L226))

`changeId`, `title`, `type`, **`urgency`**, **`proposalCategory`**, **`files`**, actions (with DropdownMenu wrapper).

### Observable consequences

- **MSA manager** sees columns appropriate for the approver view (value, submittedAt) instead of the manager view (urgency, proposalCategory, files). The information they need to triage changes (urgency, file count, category) is missing.
- **MSA approver** sees the right columns by coincidence but, per #2, gets the wrong details sheet.

Coupled with #2: MSA's table is "approver columns + manager sheet" — neither role gets the intended pairing.

**Fix shape:** same options as #2. The (a) shared-table swap closes both; the (b) inline switch needs duplicating Contract's role-aware column logic in MSA.

---

## Non-issues

- **Endpoint shapes** — MSA uses `msa-contracts/` (plural) for Changes, verified correct against `docs/swagger-phase-2.json`. **Plural quirk wider than previously documented** — previously known on Invoice approve + Amendments stats, also applies to all Changes routes. Memory `msa-contracts-plural-invoice-approve-quirk` should be extended.
- **`CreateChangeDialog`** — already parameterized via `documentType?: "Contract" | "MsaContract"` prop with correct dispatch to `vendorApi.createMsaChange` and correct list-key invalidation (`msaChanges` vs `contractChanges`). MSA passes `documentType="MsaContract"` correctly. ✅
- **Create Change button gate** — Contract `(isManager || isContractVendorLike)`; MSA `isManager || isProjectManager || isVendor`. Same set, expressed differently. ✅
- **Tab visibility** — parity. ✅
- **Stats cards `variant` prop** — both pages pass `isApprover ? "approver" : "manager"` correctly. ✅

---

## Pre-existing Contract bug (out of scope but noting)

Contract's `ChangeTabContent.tsx` passes `variant` to `ChangeTable` for the `all`, `requests`, and `proposal` tabs ([:252,264,298](src/pages/ContractManagementPage/layouts/ChangeTabContent.tsx#L252)) but NOT for `orders` ([:276-281](src/pages/ContractManagementPage/layouts/ChangeTabContent.tsx#L276-L281)) and `directive` ([:286-291](src/pages/ContractManagementPage/layouts/ChangeTabContent.tsx#L286-L291)). So a Contract approver clicking the Orders or Directive tab gets the manager column set, not the approver column set. This is a latent Contract bug independent of MSA.

---

## Summary Matrix

| Role | Tab visibility | Column shape | Details sheet | List/stats refresh after mutation |
|------|---|---|---|---|
| **Manager** | ✅ | ❌ approver-shape on MSA (missing urgency/category/files) | ✅ correct (`ChangeDetailsSheet`) | ❌ MSA: both list AND stats stale; Contract: stats stale (latent) |
| **Approver** | ✅ | ✅ correct columns on MSA | ❌ wrong sheet on MSA (manager sheet instead of approver sheet) | ❌ same |
| **Vendor / PM** | ✅ | ⚠️ same columns as approver (no Contract-vendor-specific variant exists) | ✅ correct | ❌ same |
| **View-only** | ✅ | ⚠️ same | ✅ | ➖ |

---

## Fix recommendations (prioritized)

1. **Lift invalidation keys to props on `ChangeDetailsSheet`** — direct port of commits `b7e30180a` / `3583a08d3` / `84cae6903`. Closes BUG #1 on MSA AND fixes the latent stats-stale bug on Contract (by passing the stats key separately rather than relying on prefix match). Lowest blast radius. **Highest impact** — closes the data-staleness bug.

2. **Refactor MSA to use shared `ChangeTable`** — closes BUG #2 and BUG #3 by inheritance. Larger refactor (~150-200 lines of column code deleted from MSA, replaced with a `<ChangeTable variant=... />` call). Same playbook as the prior shared-table swaps. **Cleanest architectural path.**

3. **OR (alternative to #2): Inline mirror** — keep MSA's inline table but add an `isApprover` branch in the actions cell + duplicate Contract's role-aware column logic. Less code touched, but doesn't converge architecturally.

4. **(Sidebar)** Memory `msa-contracts-plural-invoice-approve-quirk` should be extended to note Changes also uses plural `msa-contracts/`. The "two known plural endpoints" claim in that memory is out of date.

5. **(Sidebar for Claims §3)** The `["contractClaims"]` invalidation in `ChangeDetailsSheet.tsx:700` is hardcoded — when Claims uses this dual-purpose sheet, MSA Claims will face the same trap. Will land in the same lift commit.

---

## Comparing bug profiles across the audit run

| Tab | Profile | Invalidation trap? | Other drift |
|---|---|---|---|
| Compliance | B (inline) | N/A (inline = self-consistent keys) | Multiple gates + data-shape |
| Amendments | A (delegate) | ✅ Profile A trap, shipped | — |
| Deliverables | A (delegate) | ✅ Profile A trap, shipped | personnel pool |
| NCR | A (delegate post-Wave 5) | ✅ Profile A trap, shipped | — |
| RFI | B (inline) | ❌ no trap | data shape, missing tabs, gate width |
| **Change Mgmt** | **Hybrid (inline table + shared sheet)** | ✅ trap via shared sheet | wrong sheet variant, wrong column shape |
| Claims | TBD | TBD | TBD |

The hybrid pattern is the most interesting — proves the trap can survive even when MSA inlines part of the table, as long as a shared component owns the mutations. Change Mgmt is the fourth instance.
