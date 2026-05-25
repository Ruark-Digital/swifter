---
name: msa-rfi-flow-review
description: Per-role user-flow comparison of RFI tab — MSA vs Contract Management (Contract = expected behavior)
date: 2026-05-25
status: complete
---

# RFI — MSA vs Contract User-Flow Review

**Audit type:** Read-only static-code comparison. No HTTP calls, no UAT.
**Reference (source of truth):** Contract Management.
**Candidate:** MSA.
**Scope:** Manager, Approver, Vendor/PM (+ View-only).
**Dimensions:** Tab visibility · Role gates · Submitted data shape · Personnel pool · Detail-sheet feature surface.

> Endpoint paths verified against attached `docs.json` (260525). Memory pointers: `project_rfi_responder_singular`, `feedback_inline_reimpl_drops_gates`.

---

## Files

| Role of file | Contract (expected) | MSA (actual) |
|---|---|---|
| Tab whitelist | [ContractDetailPage.tsx:124-172](src/pages/ContractManagementPage/ContractDetailPage.tsx#L124-L172) | [MsaDetailPage.tsx:95-158](src/pages/MsaPage/MsaDetailPage.tsx#L95-L158) |
| Tab shell + IssueRfiDialog | [RfiTabContent.tsx](src/pages/ContractManagementPage/layouts/RfiTabContent.tsx) (580 lines — shell + inline Create dialog) | [Rfi.tsx](src/pages/MsaPage/layouts/Rfi.tsx) (1147 lines — **full inline reimplementation** of dialog, sheet, respond dialog, table) |
| Shared table + details sheet + respond dialog | [RfiTable.tsx](src/pages/ContractManagementPage/components/RfiTable.tsx) (1019 lines — Contract uses this) | **not imported** — MSA reimplements all of it inline |
| Stats cards | `RfiStatsCards` (shared, MSA uses it too) | same |

**Architectural posture:** Unlike Amendments / Deliverables / NCR, RFI is **NOT a shared-component delegate on MSA**. MSA reimplements `IssueRfiDialog`, `RfiDetailsSheet`, `RespondToRfiDialog`, and the table itself inline (1147 lines). Bug profile is closer to **Compliance** than to the prior three audits.

Because of inline reimplementation, MSA's invalidation keys are self-consistent (`msa-rfi-*` prefix throughout, no `["contractRfis"]` hardcoding). **The invalidation-key trap that hit Amendments / Deliverables / NCR is NOT present here.** Different drift surface entirely.

---

## Per-Role Tab Visibility

All four roles see the tab on both pages. Verified via the whitelists in the two `*DetailPage.tsx` files. ✅

---

## 🚨 BUG #1 — MSA submits `responder` as comma-joined display names instead of ObjectId

### What Contract does ([RfiTabContent.tsx:325-330](src/pages/ContractManagementPage/layouts/RfiTabContent.tsx#L325-L330) + [:176-184](src/pages/ContractManagementPage/layouts/RfiTabContent.tsx#L176-L184))

`IssueRfiDialog` uses a **single-select** `TextSelect` for "Select Responder". The submitted payload sends a single ObjectId:

```ts
const payload: ContractRfiDTO = {
  ...
  responder: data.responder || undefined,  // ObjectId string from p._id
};
```

This matches the BE shape (`responder?: string` in `ContractRfiDTO`, per the attached spec) and memory `project_rfi_responder_singular`.

### What MSA does ([Rfi.tsx:399-405](src/pages/MsaPage/layouts/Rfi.tsx#L399-L405) + [:264-273](src/pages/MsaPage/layouts/Rfi.tsx#L264-L273))

`IssueRfiDialog` uses a **multi-select** `TextMultiSelect` for "Select Responder". The submitted payload **joins display labels with commas**:

```ts
const responderLabels = (data.responders ?? [])
  .map((r) => r.label)         // ← display name, not p._id
  .join(", ");

const payload: ContractRfiDTO = {
  ...
  responder: responderLabels || undefined,
};
```

Two bugs in one:

1. **Multi-select for a singular BE field** — `ContractRfiDTO.responder` is `string` (a single id). MSA's multi-select implies you can pick multiple, but the BE only accepts one value.
2. **Labels instead of values** — even if multi-select were OK, the joined string is composed of `label` (display names) rather than `value` (`_id`). Memory `project_rfi_responder_singular` documents this exact anti-pattern: *"don't post `.label` (display name) — always `.value` (`_id`) from personnel options"*.

Net effect: MSA-created RFIs land in the BE with their `responder` field containing a comma-separated string of display names rather than a user ObjectId. Downstream BE logic that resolves the responder by id will find no match; downstream UI that wants to render the responder will get a string of names that can't be linked to a profile.

**Fix:** swap MSA's `TextMultiSelect` → `TextSelect` and submit `data.responder` (the `_id` from selected option's `value`), matching Contract.

---

## 🚨 BUG #2 — MSA personnel fetch uses Contract path under outdated assumption

### Context ([Rfi.tsx:150-176](src/pages/MsaPage/layouts/Rfi.tsx#L150-L176))

MSA `IssueRfiDialog` builds a personnel URL with a role-aware switch, **always using `/contracts/` (the Contract prefix) regardless of contract type**. There's an explicit comment:

```ts
// Hitting the wrong prefix returns 403; the contract personnel paths
// serve MSA dialogs too, so we re-use them rather than the msa-contract
// variants which do not exist for personnel listings.
```

### What the comment got wrong

Per the full swagger attached 260525, **MSA personnel endpoints exist for all four roles**:

- `/approver/msa-contract/{contractId}/personnel`
- `/manager/msa-contract/{contractId}/personnel`
- `/user/msa-contract/{contractId}/personnel`
- `/vendor/msa-contract/{contractId}/personnel`

See memory `project_be_msa_parallel_endpoints_default_assumption`. The comment is out of date.

Probable runtime behavior: the Contract personnel endpoints likely return the company's user pool regardless of which contractId is in the path (personnel are user-level config, not contract-scoped), so MSA is currently getting the correct list of users by accident. Same situation as the Deliverables personnel-pool finding (closed in `6b5b76174`).

**Fix:** route MSA personnel requests to `/{role}/msa-contract/{id}/personnel`. Update or delete the misleading comment.

Lower urgency than #1 — current behavior likely renders correctly, but it's a hidden assumption that breaks if the BE ever scopes personnel by contract type.

---

## 🚨 BUG #3 — Respond action gate is wider on MSA than on Contract

### Contract's gate

Two layers:

1. **Visibility** ([RfiTable.tsx:902](src/pages/ContractManagementPage/components/RfiTable.tsx#L902)) — `type === "received" && status !== "closed"`. Any role sees the Respond button.
2. **Submit guard** ([RfiTable.tsx:681-686](src/pages/ContractManagementPage/components/RfiTable.tsx#L681-L686)) — inside `RespondToRfiDialog.handleSubmit`: `if (!isApprover) { toast.error("Only approvers can respond to RFIs.") }`. **Approver-only at the submit step**, all other roles get a toast and the request never fires.

### MSA's gate

Visibility ([Rfi.tsx:987-988](src/pages/MsaPage/layouts/Rfi.tsx#L987-L988)) — `isReceived && !isViewOnly`. Manager, vendor/PM, and approver all see the button **and can submit** — no isApprover guard in the dialog ([:644-664](src/pages/MsaPage/layouts/Rfi.tsx#L644-L664)).

### What BE allows

Per the attached spec, POST `/{role}/{contracts|msa-contract}/{id}/rfi/{rfiId}/response` exists for **manager, vendor, approver** (not view-only). MSA's gate is actually closer to BE truth than Contract's.

### So what's the drift

The user's stated principle (memory `feedback_parity_direction_trim_msa_dont_expand_contract`): *"Contract management is the actual user flow that is expected"* — even when BE supports more, MSA should trim to match Contract's exposure.

Applied here: MSA should restrict Respond to **approver-only** at the submit step, matching Contract's behavior. This *narrows* MSA's capability but aligns it with the spec's intentional restriction.

**However**, this is an **action gate**, not a display drift. Restricting an action that legitimate users (per BE) currently can perform is higher-stakes than removing a display element. Could be a product mistake on Contract, not MSA. **Decision warrants product input before shipping.**

---

## ⚠️ MISSING FEATURES on MSA detail sheet

Contract's `RfiDetailsSheet` ([RfiTable.tsx:108-509](src/pages/ContractManagementPage/components/RfiTable.tsx#L108-L509)) renders three tabs:

1. **Overview** — RFI fields, description, attached documents.
2. **Response** — full `RfiResponseContent` rendering the response description + files; shown when `isResponse` is true.
3. **Comments** — full comment thread with `MessageComposer`, add-comment mutation, role-aware namespace.

MSA's `RfiDetailsSheet` ([Rfi.tsx:478-604](src/pages/MsaPage/layouts/Rfi.tsx#L478-L604)) renders **only the Overview equivalent** — RFI fields, description, attachments. **No Response tab. No Comments tab.**

### Observable consequences

- **Vendor / PM / Manager / Approver on MSA can never see the response to an RFI from inside the detail sheet.** The data exists at the BE (response endpoints exist for MSA per swagger) but MSA doesn't render it.
- **None of the four roles can leave or read comments on an MSA RFI.** Comments endpoints exist on BE (`/{role}/msa-contract/{id}/rfi/{rfiId}/comment` for all four roles per spec) but MSA doesn't surface them.

This is the inverse of the trim-MSA pattern: MSA is **feature-poor** here, not feature-rich. Contract's Comments + Response are the spec; MSA is missing them.

**Fix:** add Response tab + Comments tab to MSA's `RfiDetailsSheet`, mirroring Contract's implementation. Substantial scope — likely 200+ lines including the `MessageComposer` integration and the comments add-mutation. Could also be addressed architecturally by swapping MSA's inline `RfiDetailsSheet` for the shared `RfiTable`'s `RfiDetailsSheet`, parameterized on basePath like Amendments / Deliverables / NCR were.

---

## Endpoint shapes (verified against attached spec)

| Role | Contract | MSA |
|------|---|---|
| Manager | `/manager/contracts/{id}/rfis` (plural — quirk) | `/manager/msa-contract/{id}/rfi` (singular — different from Contract manager) |
| Vendor / PM | `/vendor/contracts/{id}/rfi` | `/vendor/msa-contract/{id}/rfi` |
| Approver | `/approver/contracts/{id}/rfi` | `/approver/msa-contract/{id}/rfi` |
| View-only | `/user/contracts/{id}/rfi` | `/user/msa-contract/{id}/rfi` |

All endpoints correct per the attached swagger. The Contract-manager-plural / MSA-manager-singular asymmetry is documented BE behavior — the original audit's "MSA manager should use plural" finding was retracted as a false positive.

---

## Summary Matrix

| Role | Tab visibility | Action gates | Submitted shape | Detail-sheet features | Invalidation refresh |
|------|---|---|---|---|---|
| **Manager** | ✅ | ❌ MSA Respond gate too wide (but actually matches BE — see #3) | ❌ MSA submits responder labels not IDs | ❌ No Response / Comments tabs | ✅ (no trap on MSA RFI) |
| **Vendor / PM** | ✅ | ❌ Same | ❌ Same | ❌ Same | ✅ |
| **Approver** | ✅ | ✅ (Respond is the approver's primary action on Contract) | ❌ Same | ❌ Same | ✅ |
| **View-only** | ✅ | ✅ (no Issue / Respond buttons) | ➖ N/A | ❌ Cannot view Comments / Response | ✅ |

---

## Fix recommendations (prioritized)

1. **MSA `IssueRfiDialog`: fix responder field shape.** Swap `TextMultiSelect` → `TextSelect`, submit `_id` instead of joined labels. Closes BUG #1. ~5-10 line change. **Highest impact** — currently every MSA-created RFI has a malformed `responder` field at the BE.

2. **MSA `RfiDetailsSheet`: add Response + Comments tabs.** Mirror Contract's implementation. Closes the missing-features gap. Substantial scope (~200 lines for Comments alone) but maps directly onto the shared `RfiTable` implementation. **Cleanest path: refactor MSA Rfi.tsx to swap its inline table body for the shared `RfiTable`** (parameterized on basePath / role like Amendments/Deliverables/NCR were). Larger refactor but converges architecturally with the rest of Group A. Memory `project_shared_table_contract_msa_swap_pattern` documents the precedent.

3. **(Decision needed) MSA Respond action gate** — trim to approver-only to match Contract, OR loosen Contract to match MSA + BE. Asking product clarifying their intent on RFI response permissions before changing either.

4. **MSA personnel fetch: route to `/msa-contract/` paths.** Update the role-aware switch + remove the outdated comment. Lower urgency because likely benign at runtime, but it's a hidden assumption worth correcting. Memory `project_be_msa_parallel_endpoints_default_assumption` confirms the paths exist.

---

## Out of scope / non-issues

- **Invalidation-key trap** — MSA RFI uses `msa-rfi-*` keys consistently throughout its inline implementation; no `["contractRfis"]` hardcoding. The trap that bit Amendments / Deliverables / NCR is genuinely absent here. ✅
- **Endpoint shapes** — verified, all correct including the Contract-manager-plural-`rfis` BE quirk.
- **Inline reimplementation** itself is the architectural drift, intentionally out of scope per `feedback_audit_scope_behavior_not_architecture`. But fix #2 above effectively closes it.
- **`useUserQueryKey` wrapping** — applied correctly on both pages.
