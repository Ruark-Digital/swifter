# QA #78 — Item 2: CM/PL/Admin Assign a Vendor PM to an Existing Contract

**Date:** 2026-07-09
**Status:** Design approved, pending spec review
**Scope (this spec):** Regular (non-MSA) contracts. MSA is an identical follow-up pass.
**Related:** [`2026-07-07-qa78-pm-contract-management-design.md`](2026-07-07-qa78-pm-contract-management-design.md) (Item 1, merged PR #210).

## Background

Client (Osofowora Oladipupo) forwarded two requirements on 2026-07-09:

1. *"where there are more than one vendor PMs, another PM can take over a contract (But requires
   CM/PLs approval) just like PLs taking over a Solicitation/Evaluation"*
2. *"Where a new Vendor PM needs to be assigned to an existing contract."*

**Item 1 is already shipped** — it is QA #78 Increment 2 (PM self-request take-over + CM/PL
approve/reject), merged in PR #210. This spec covers **Item 2 only**.

Item 2 was requirement #4 in the 2026-07-05 QA #78 design and was deferred out-of-scope at the
time because *"a manager-initiated assign (choose any PM, no PM request first) has no dedicated
endpoint."* The `docs.json` provided on 2026-07-09 now backs the onboard-by-email half, so the
feature is unblocked.

Product decision (this session): the manager flow must support **both** onboarding a brand-new PM
by email **and** picking an already-registered PM for the vendor.

## Backend (docs.json 2026-07-09; API base `dev.swiftpro.tech/api/v1/dev`)

| Step | Endpoint | Notes |
|------|----------|-------|
| Onboard + assign NEW PM | `POST /manager/contracts/{contractId}/project-manager` | Body `{ email }`. Creates a brand-new vendor PM, sends onboarding invite, assigns to the contract. **409 if the email already belongs to a PM for that vendor.** New assignment defaults to **approved**; when replacing an existing PM the previous status is preserved. `201/401/403/404/409/422`. |
| List vendor's existing PMs | `GET /manager/contracts/vendor/{vendorId}/project-managers` | Items `{ id, name }`. Accepts vendor id/code/email/name. |
| Assign EXISTING PM by id | **DOES NOT EXIST — see "Backend dependency" below** | |

**Backend dependency (blocks the "pick existing" half / Increment 2).** Every assign-by-id
endpoint in the spec is under `/vendor/...` and tagged `Vendor - Contract` (vendor-role-scoped —
a CM/PL/Admin would get `403`, and it creates a *pending* request needing approval, which is
nonsensical for a manager who already has authority). We therefore request a new endpoint:

```
POST /manager/contracts/{contractId}/project-manager/{projectManagerId}/assign
  Roles: contract_manager, procurement_lead, company_admin
  Assigns an existing vendor PM (id from GET .../vendor/{vendorId}/project-managers) to the
  contract, AUTO-APPROVED (no pending state). Replaces the current PM if one is assigned.
  200 OK · 401 · 403 · 404.   (+ MSA twin: /manager/msa-contracts/... later)
```

## Design

### A. Entry point & gating — `src/pages/ContractManagementPage/ContractDetailPage.tsx`

- Add an **"Assign PM"** button (label **"Change PM"** when `contractData.projectManager` already
  exists), placed near the existing take-over banner / PM section.
- **Role gate:** `(isManager && isContractOwner) || isCompanyAdmin`. `isManager` covers Contract
  Manager + Procurement Lead; the `/manager/...` endpoints already permit `company_admin` (per the
  `getContractForEdit` x-roles note in `contractManagerApi.ts`).
- **Contract-state gate:** Active/Published only (mirrors the take-over gating from commit
  `e329445d3`). Hidden on frozen statuses (terminated/suspended) and on `pending_approval`.
- **Hidden while a take-over request is pending** (`takeOverPending`) so the two flows never
  collide on the same contract.

### B. API layer — `src/pages/ContractManagementPage/api/contractManagerApi.ts`

Add methods using the existing `MANAGER_CONTRACTS_PREFIX` + `client.post/get` pattern (alongside
`approveProjectManagerAssignment`):

- **Inc 1:** `onboardProjectManager(contractId, { email })` → `POST ${PREFIX}/${contractId}/project-manager`.
- **Inc 2:** `listVendorProjectManagers(vendorId)` → `GET ${PREFIX}/vendor/${vendorId}/project-managers`.
- **Inc 2:** `assignExistingProjectManager(contractId, projectManagerId)` →
  `POST ${PREFIX}/${contractId}/project-manager/${projectManagerId}/assign` (the new BE endpoint).

### C. Dialog — `src/pages/ContractManagementPage/components/AssignProjectManagerDialog.tsx` (new)

A focused component that owns its own form/mutation state.

- **Increment 1:** a single email input.
  - Validate email format client-side.
  - Submit → `onboardProjectManager`. On `201`: success toast + invalidate the contract-detail
    query, close dialog. On `409`: toast *"This person is already a project manager for this
    vendor — select them from the list instead."* (wording is forward-compatible with Inc 2).
  - Button shows pending state; reuses the `ConfirmAlert` / dialog conventions already on the page.
- **Increment 2:** add a segmented toggle at the top of the dialog:
  - **"Existing PM"** — a dropdown fed by `listVendorProjectManagers(vendorId)` (`{id,name}`);
    submit → `assignExistingProjectManager`.
  - **"Invite by email"** — the Increment 1 field, unchanged.
  - `vendorId` is read from the contract detail data already loaded on the page.

### Data flow

```
CM/PL/Admin on contract detail --Assign/Change PM-->
  ├─ Invite by email  --> POST .../project-manager {email}      --> PM onboarded + assigned (approved)
  └─ Existing PM (Inc2)--> POST .../project-manager/{pmId}/assign --> PM assigned (auto-approved)
Both invalidate the contract-detail query; PM shows immediately. No pending step
(distinct from the PM self-request take-over flow, which stays pending → CM/PL approval).
```

## Increments

1. **Increment 1 — onboard by email (backable today):** API method, `AssignProjectManagerDialog`
   (email-only), the Assign/Change PM button + gating, Playwright tests. Ships independently.
2. **Increment 2 — pick existing PM (after the §Backend-dependency endpoint lands):** list +
   assign-existing API methods, the dialog mode toggle, tests.

## Out of scope

- **MSA contracts** — identical follow-up pass; the `/manager/msa-contracts/...` twin endpoints
  already exist (plus the requested MSA twin of the new assign-by-id endpoint).
- **All Contracts row-menu entry point** — v1 is the contract detail page only.
- **Per-row "assigned PM" badge** on the tab list — needs list-DTO support, tracked in the Item 1 spec.

## Testing

Playwright, following the existing `src/pages/ContractManagementPage/__tests__/qa78-*` patterns:

- Assign/Change PM button visible only to CM/PL-owner and Company Admin, only on Active/Published,
  hidden while a take-over is pending.
- Invite-by-email fires `POST .../project-manager` with `{email}`; success toast + refetch; `409`
  surfaces the "already a PM" message.
- (Inc 2) Existing-PM dropdown lists the vendor's PMs; selecting + assigning fires
  `POST .../project-manager/{pmId}/assign`; PM appears assigned without a pending step.

## Verification gate

`npx tsc -b` + `npm run lint` must pass (per `reference_swifter_real_build_lint_gate`). Live
browser verification as CM/PL and Company Admin on `localhost:5173` before hand-off.
