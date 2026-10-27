---
name: msa-claims-flow-review
description: Per-role user-flow comparison of Claims tab — MSA vs Contract Management (Contract = expected behavior)
date: 2026-05-25
status: complete
---

# Claims — MSA vs Contract User-Flow Review

**Audit type:** Read-only static-code comparison. No HTTP calls, no UAT.
**Reference (source of truth):** Contract Management.
**Candidate:** MSA.
**Scope:** Manager, Approver, Vendor/PM (+ View-only).
**Dimensions:** Tab visibility · Endpoint shape · Role gates · Details-sheet feature surface · Submitted data shape.

> Endpoint paths verified against `docs/swagger-phase-2.json` (260525). Memory pointers: `project_msa_url_routing_bug_classes`, `project_claim_approver_identity_gate`, `project_contract_claims_plural`.

---

## Files

| Role of file | Contract (expected) | MSA (actual) |
|---|---|---|
| Tab whitelist | `ContractDetailPage.tsx:124-172` | `MsaDetailPage.tsx:95-158` |
| Tab shell | [ClaimsTabContent.tsx](src/pages/ContractManagementPage/layouts/ClaimsTabContent.tsx) (132 lines — **thin delegate** to shared) | [Claims.tsx](src/pages/MsaPage/layouts/Claims.tsx) (349 lines — **inline reimplementation**) |
| Shared table | [ClaimsTable.tsx](src/pages/ContractManagementPage/components/ClaimsTable.tsx) — Contract uses | **not imported** — MSA inlines its own DataTable |
| Details sheet | [ChangeDetailsSheet.tsx](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx) **dual-purpose mode** — Contract uses via `isClaim = roleBasePath.includes("/claim")` | [MSAClaimDetailsSheet.tsx](src/pages/MsaPage/components/MSAClaimDetailsSheet.tsx) (357 lines) — **MSA-only, from-scratch, feature-poor fork** |
| Stats cards | `ClaimsStatsCards` (shared, MSA uses) | same |
| Create dialog | `RequestClaimDialog` (already parameterized via `createPath` + `invalidateQueryKey` props) | same |
| Unused | `ClaimDetailsSheet.tsx` (390 lines, **NOT imported anywhere** — dead code) | — |

**Architectural posture:** Profile B+ — MSA inlines the table AND maintains an entirely separate `MSAClaimDetailsSheet.tsx` (357 lines) that's a feature-poor fork of Contract's `ChangeDetailsSheet` claims branch. This is the worst architectural divergence in Group A. Contract gets the full sophisticated claim-approval workflow inside `ChangeDetailsSheet`; MSA gets a read-only-ish stub.

---

## Per-Role Tab Visibility

| Role | Contract | MSA | Result |
|------|---|---|---|
| Manager | ALL tabs | includes `claims` | ✅ Both see it |
| Vendor / PM | includes `claims` | includes `claims` | ✅ Both see it |
| Approver | includes `claims` | includes `claims` | ✅ Both see it |
| View-only | includes `claims` | includes `claims` | ✅ Both see it |

Parity.

---

## 🚨 BUG #1 — URL plurality bug: three of four MSA roles hit non-existent endpoints

### What the BE expects (per `docs/swagger-phase-2.json` 260525)

| Role | MSA Claims path |
|------|---|
| Manager | `/manager/msa-contracts/{id}/claims/...` (**plural** `claims`) |
| Approver | `/approver/msa-contracts/{id}/claim/...` (**singular** `claim`) |
| Vendor / PM | `/vendor/msa-contracts/{id}/claim/...` (**singular** `claim`) |
| View-only | `/user/msa-contracts/{id}/claim/...` (**singular** `claim`) |

Note `msa-contracts` (plural) is used for all roles — that's the documented quirk family. But `claim(s)` itself is plural for manager only, singular for everyone else. Same role-asymmetric pattern Contract RFI has on manager-plural `rfis`.

### What MSA frontend sends ([Claims.tsx:93-96](src/pages/MsaPage/layouts/Claims.tsx#L93-L96))

```ts
const claimsPath = React.useMemo(
  () => `${basePath}/claims`,  // ← always plural for all roles
  [basePath],
);
```

Always uses **plural** `claims`. So:

| Role | Hits | BE expects | Outcome |
|---|---|---|---|
| Manager | `/manager/msa-contracts/{id}/claims` | same | ✅ works |
| Approver | `/approver/msa-contracts/{id}/claims` | `/approver/.../claim` | ❌ 404 (or wrong handler) |
| Vendor / PM | `/vendor/msa-contracts/{id}/claims` | `/vendor/.../claim` | ❌ 404 |
| View-only | `/user/msa-contracts/{id}/claims` | `/user/.../claim` | ❌ 404 |

**Three out of four roles cannot use Claims on MSA at all** — list query 404s, stats 404s, detail 404s, comment 404s, comment POST 404s. The only role for whom the tab actually works is the manager.

**Fix shape:** make `claimsPath` role-aware:
```ts
const claimsPath = React.useMemo(() => {
  if (isManager) return `${basePath}/claims`;
  return `${basePath}/claim`;
}, [basePath, isManager]);
```

And same shape for any sub-route construction. Memory `project_msa_url_routing_bug_classes` should be extended with this third role-asymmetric quirk (after RFI manager-plural-`rfis` and the new Claims plurality-flip).

---

## 🚨 BUG #2 — MSAClaimDetailsSheet is missing every claim-action affordance

### What Contract's claim flow does (via `ChangeDetailsSheet` in `isClaim` mode)

Per memory `project_claim_approver_identity_gate` and [ChangeDetailsSheet.tsx:645-720](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx#L645-L720):

1. **Approver path (identity-gated)** — Reject + Approve via single-dialog comment flow ([:646-664](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx#L646-L664)). Gate per `canApproverDecideOnClaim` — only the listed approver at the active level can decide.
2. **Manager path — cost / time_cost** — direct Reject + Approve via same comment-dialog flow ([:670-688](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx#L670-L688)).
3. **Manager path — time impact only** — right-aligned **Send for Approval** (no Reject) via [`SendApprovalDialog`](src/pages/ContractManagementPage/components/ChangeDetailsSheet.tsx#L692-L711). Routes to the approver group for time-impact claims.
4. **Comments tab** with full thread + composer + role-namespaced query.
5. **File preview / download** via shared `DocumentItem`.

### What MSA's `MSAClaimDetailsSheet` does

- Read-only render of claimId, title, description, type, impact, dates.
- "Supporting Documents" rendered from `detail.documents`.
- Comments — **vendor/PM only**, no manager or approver path.
- **No Approve / Reject buttons** for either approver or manager.
- **No Send for Approval** flow.
- **No identity-gated approver flow.**

### Observable consequences

- **MSA manager** opens a claim → sees fields, has no way to approve/reject/send-for-approval.
- **MSA approver** opens a claim → same, can only view (and the URL likely 404s anyway per BUG #1).
- **MSA vendor/PM** opens a claim → can comment but with WRONG payload (BUG #3).
- **No one on MSA can actually move a claim through its lifecycle.**

**Fix shape:** either
- (a) **Swap MSA Claims to use the shared `ClaimsTable`** which already wires `ChangeDetailsSheet` in `isClaim` mode. Same playbook as Change Mgmt §2 commit `5a8e6de61`. Requires fixing the inherited Contract-path hardcodes inside `ChangeDetailsSheet` first (BUG #4 below).
- (b) **Re-implement the entire claim-action workflow inline** in `MSAClaimDetailsSheet`. Larger code footprint, doesn't converge architecturally, and duplicates the identity-gate logic.

Option (a) is the right answer — but requires landing BUG #4 first.

---

## 🚨 BUG #3 — Comment POST submits wrong payload field

### What MSA sends ([MSAClaimDetailsSheet.tsx:110-114](src/pages/MsaPage/components/MSAClaimDetailsSheet.tsx#L110-L114))

```ts
mutationFn: async (commentText: string) => {
  const url = `${roleBasePath}/${claimId}/comment`;
  return await postRequest({ url, payload: { comment: commentText } });
},
```

Submits `{ comment: "..." }`.

### What BE expects

Per the swagger schemas `ContractChangeCommentDTO` used by `/manager/msa-contracts/{id}/claims/{claimId}/comments` POST (and the equivalent for other roles), the request body shape is:

```ts
{ content: string, files?: [...] }
```

MSA submits `comment`, BE expects `content`. **Comment POST is dropping the comment text on the floor.**

**Fix:** change `{ comment: commentText }` → `{ content: commentText }`. Same anti-pattern memory as RFI's responder-label bug — submitting from a different field name than the BE expects.

---

## 🚨 BUG #4 — Hardcoded Contract paths inside `ChangeDetailsSheet`'s claim flow

(Forward-looking — blocks the BUG #2 fix via swap.)

### `ChangeDetailsSheet.tsx:697` — Send-for-Approval `assignUrl`

```ts
<SendApprovalDialog
  contractId={contractId}
  entityLabel="claim"
  assignUrl={`/contract/manager/contracts/${contractId}/claims/${changeId}/approvers`}
  ...
/>
```

The `assignUrl` is hardcoded to `/contract/manager/contracts/...` — Contract path. If MSA Claims were swapped to use `ChangeDetailsSheet`, an MSA manager hitting Send-for-Approval would POST to the wrong URL. The BE has the parallel endpoint at `/contract/manager/msa-contracts/{id}/claims/{claimId}/approvers` (per swagger line 31006).

### `ChangeDetailsSheet.tsx:700` — claims wide-cast invalidation

```ts
qc.invalidateQueries({ queryKey: ["contractClaims"] });
```

Hardcoded to `["contractClaims"]`. MSA Claims uses `["msa-claims"]` as its parent prefix. Same trap class shipped four times already in this audit run.

**Fix shape:** parameterize both via props on `ChangeDetailsSheet`:
- `claimAssignUrl?: string` (defaults to current Contract path)
- `claimsListInvalidateQueryKey?: readonly unknown[]` (defaults to current `["contractClaims"]`)

OR fold the latter into the existing `listInvalidateQueryKey` prop (since when `isClaim`, the parent passes the claims list key as `listInvalidateQueryKey` and both line 298 and line 700 use it). The choice depends on whether you want claims and changes invalidations namespaced together; cleanest is **one prop, used in both branches** — `listInvalidateQueryKey` defaults to whichever key the parent uses for its list query.

---

## ⚠️ BUG #5 — Create Claim role gate drift

### Contract gate ([ClaimsTabContent.tsx:100](src/pages/ContractManagementPage/layouts/ClaimsTabContent.tsx#L100))

```ts
{(isContractVendorLike || isManager) && (
  <RequestClaimDialog ... />
)}
```

Both manager and vendor/PM see "Create Claim". Per the BE, manager has a `/manager/.../claims` POST endpoint.

### MSA gate ([Claims.tsx:99-102](src/pages/MsaPage/layouts/Claims.tsx#L99-L102))

```ts
const createPath = React.useMemo(() => {
  if (isVendor || isProjectManager) return `${basePath}/claims`;
  return undefined;
}, ...);
```

Only vendor/PM see Create Claim — manager doesn't. **MSA manager loses the ability to raise claims.**

**Fix:** extend gate to include manager: `if (isVendor || isProjectManager || isManager) return ...`.

---

## ⚠️ BUG #6 — Documents field name mismatch

### What MSA renders ([MSAClaimDetailsSheet.tsx:131-153](src/pages/MsaPage/components/MSAClaimDetailsSheet.tsx#L131-L153))

```ts
const source = Array.isArray(detail?.documents) ? detail.documents : [];
```

Reads `detail.documents`.

### What BE returns

Per the swagger schema for `ContractClaimDTO`, the field is `files: [...]` — not `documents`. So MSA's "Supporting Documents" section always renders empty even when files exist.

**Fix:** change `detail.documents` → `detail.files`. Trivial 1-line change.

---

## Non-issues

- **Tab visibility** — parity ✅
- **MSA outer URL prefix** — uses `msa-contracts/` (plural) for all roles, correct per swagger (same pattern as Changes). Memory `msa-contracts-plural-invoice-approve-quirk` already extended to cover this family.
- **Stats endpoint plurality** — `/manager/msa-contracts/{id}/claims/stats` (plural) per swagger line 30401; MSA's `${claimsPath}/stats` builds this correctly for manager. For approver/vendor/user the stats endpoint is `/{role}/msa-contracts/{id}/claim/stats` (singular) — same fix as BUG #1.

---

## Summary Matrix

| Role | Tab visibility | List/stats URL | Details sheet usefulness | Comment POST | Create button |
|------|---|---|---|---|---|
| **Manager** | ✅ | ✅ correct | ❌ no Approve / Reject / Send-for-Approval | ➖ (no vendor-only comment path) | ❌ Missing on MSA |
| **Approver** | ✅ | ❌ 404 (plural sent, singular expected) | ❌ no Approve / Reject (and no list anyway) | ➖ | ➖ N/A |
| **Vendor / PM** | ✅ | ❌ 404 | ⚠️ view only + comment with wrong field name | ❌ `{comment}` not `{content}` | ✅ |
| **View-only** | ✅ | ❌ 404 | ⚠️ view only | ➖ N/A | ➖ N/A |

---

## Fix recommendations (prioritized)

1. **🔥 BUG #1 — URL plurality.** Make `claimsPath` role-aware (manager: `claims`, others: `claim`). Highest priority — fixes the tab being broken for three of four roles on MSA. **One-line fix per construction site.**

2. **🔥 BUG #3 — Comment POST payload.** Change `{ comment }` → `{ content }`. One-line fix.

3. **🔥 BUG #6 — Documents → files.** Change `detail.documents` → `detail.files`. One-line fix.

4. **BUG #5 — Create Claim manager gate.** Extend `createPath` to include manager. One-line fix. Also requires the URL to be `claims` (plural) for manager via #1.

5. **BUG #2 + BUG #4 — Restore full claim workflow on MSA.** Largest piece. Two sub-options:
   - **(a)** Swap MSA Claims to use shared `ClaimsTable` (which uses `ChangeDetailsSheet` in claims mode) — closes BUG #2 by inheritance. First requires landing BUG #4: parameterize the `assignUrl` and the line 700 invalidation in `ChangeDetailsSheet`. Same playbook as Change Mgmt §2 commit `5a8e6de61`. **Recommended path.**
   - **(b)** Inline-mirror the claim workflow inside `MSAClaimDetailsSheet`. Much larger code footprint; duplicates the identity-gate logic; doesn't converge architecturally.

---

## Cross-cutting

This is the fifth Group A tab reviewed. Architecturally the worst-drift case:

| Tab | Profile | Trap? |
|---|---|---|
| Compliance | B | No (self-consistent keys) |
| Amendments / Deliverables / NCR | A | ✅ Shipped fixes |
| RFI | B (full inline) | No |
| Change Mgmt | Hybrid → A (via swap) | ✅ Shipped fix |
| **Claims** | **B+ (inline table + forked details sheet)** | **No invalidation trap on MSA itself, but BUG #4 inside `ChangeDetailsSheet` blocks the swap fix.** |

Predicted fifth instance of the invalidation-trap class confirmed at `ChangeDetailsSheet.tsx:700` — but only fires if MSA Claims ever uses that sheet. Currently MSA forks into `MSAClaimDetailsSheet` and avoids the trap (at the cost of losing every claim-action affordance).
