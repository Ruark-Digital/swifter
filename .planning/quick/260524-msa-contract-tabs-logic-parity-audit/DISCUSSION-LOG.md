# Phase 260524: MSA vs Contract Detail-Tabs Logic Parity Audit — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 260524-msa-contract-tabs-logic-parity-audit
**Areas discussed:** Deliverable shape, Audit dimensions, User-role coverage, Tab-scope strategy, Group order, Report packaging, Severity rubric

---

## Deliverable

| Option | Description | Selected |
|--------|-------------|----------|
| Audit report only | Read-only diff per tab × role; severity-classified; separate fix phase afterward. | ✓ |
| Audit + same-phase fixes | Produce audit, then apply fixes in same phase. Larger blast radius, no separate planning. | |
| Audit + per-tab fix tickets | Produce audit, then write small per-tab plans you can execute one at a time. | |

**User's choice:** Audit report only.
**Notes:** Keeps blast radius small. Fix work decoupled — can be re-prioritized once the full divergence list is visible.

---

## Audit Dimensions

| Option | Description | Selected |
|--------|-------------|----------|
| Role gates & action visibility | Submit/Approve/Reject/Close/Edit/Assign-Approval button visibility per role + ROLE_TAB_WHITELIST + actionsDisabled + status-based edit gates. | ✓ |
| API endpoint shape parity | /contracts/ vs /msa-contract/ path drift, plural/singular routes, payload shape, _id vs id, query-cache key + invalidation correctness. | ✓ |
| Status semantics & tone | Status enum values, tone palette, closed=grey rule, approved/pending/rejected mapping. | ✓ |
| Component reuse + dialog parity | Where MSA reimplements a table inline instead of reusing Contract's *Tab/*Table component; DetailsSheet / Approve-Reject / Submit dialog behavior parity. | |

**User's choice:** Three of four — the three behavioral dimensions; explicitly **not** Component reuse + dialog parity.
**Notes:** Architecture drift (inline reimplementations) is noted incidentally only when it manifests as a behavioral/API/status drift. Dialog parity also folded into the three behavioral dimensions rather than being its own axis.

---

## User-Role Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Manager | Contract manager + admin (admin reuses manager paths). | ✓ |
| Vendor | Vendor — and PM, paired via isContractVendorLike. | ✓ |
| Approver | Approver role — approvers do not see Compliance tab. | ✓ |
| View-only / read-only user | isViewOnly + admin read paths; catches /user/ endpoint drift. | ✓ |

**User's choice:** All four.
**Notes:** Vendor and PM are evaluated as one column per the existing `isContractVendorLike` convention (memory: `feedback_role_guards`). Raw `isVendor` without PM is itself a finding.

---

## Tab Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 12 in one pass | Single phase covering all 12 tabs. | |
| Top divergers first | Prioritize 4 biggest line-count gaps + memory-flagged known-broken items. | |
| Group by shared root cause | Group tabs by whether they share Contract's role-aware Table component vs pure shells. Audit one group at a time. | ✓ |

**User's choice:** Group by shared root cause.
**Notes:** Will let us name patterns once and apply them across each group.

---

## Group Order

| Option | Description | Selected |
|--------|-------------|----------|
| Role-aware Tables group first | Amendments, Change Mgmt, Claims, Deliverables, NCR Log, RFI — heaviest role/action gates. | ✓ |
| Shell + special-cases first | Compliance, Documents, Payment Summary, LEM, Invoice, Vendor Reports — biggest line-count gaps. | |
| Both groups in this audit, role-aware first | Single audit report covers all 12 tabs; role-aware group written up first. | |

**User's choice:** Role-aware Tables group first.
**Notes:** Implied "both groups, role-aware first" — D-08 captures this. Group A and Group B both ship in one REPORT.md; group only controls write order.

---

## Report Packaging

| Option | Description | Selected |
|--------|-------------|----------|
| Per-tab section in single REPORT.md | One REPORT.md with 12 tab sections; each section has a role×dimension matrix + findings list. | ✓ |
| Master matrix + per-tab appendix | Front page is a single big matrix; each cell links to a per-tab appendix. | |
| Per-tab REPORT files under group folders | role-aware/{...}.md and shell/{...}.md. Tab-by-tab actionable, harder to skim. | |

**User's choice:** Per-tab section in single REPORT.md.
**Notes:** Single file means one place to grep / link / archive. Master TOC at the top lists tabs in the user's 1–12 order; body sections use audit (group) order.

---

## Severity Rubric

| Option | Description | Selected |
|--------|-------------|----------|
| Broken / Drifted / Cosmetic / Missing | Broken=fails/403. Drifted=visibly differs but works. Cosmetic=pure style. Missing=feature absent on MSA. | ✓ |
| Broken / Drifted / Missing (drop cosmetic) | Cosmetic excluded entirely. | |
| Behavior-only with severity 1/2/3 | S1=user-blocking, S2=visible drift, S3=nit. | |

**User's choice:** Broken / Drifted / Cosmetic / Missing.
**Notes:** Cosmetic kept so it's captured in one place — caller can filter later. Every finding row includes severity, role(s) affected, dimension, both behaviors, and a `file:line` evidence pointer.

---

## Claude's Discretion

- **Per-tab investigation order within each group** — Claude orders by likely impact (memory-flagged tabs first, then by line-count gap).
- **Dimension assignment for ambiguous findings** — Claude picks the most actionable dimension for the future fixer.
- **Cell depth** — Claude decides how deep to inspect each role × dimension cell, with a minimum bar that no cell is empty (every cell ✅ with justification OR ≥1 finding).
- **Endpoint comparison method** — code-read only (path strings + payload shapes). No HTTP calls, no backend verification.

## Deferred Ideas

- Rewriting MSA tabs to reuse Contract's `*Tab` / `*Table` components — deferred to fix phase(s) after this audit.
- Closing the MSA `useUserQueryKey` invalidation no-op trap wherever this audit flags it.
- Adding the NCR-CAPA-close checklist flow to MSA if found missing.
- Aligning MSA approver stats field aliases (`completed`/`cancelled` vs `approved`/`rejected`) wherever the alias trap recurs.
- Dark-mode parity between Contract and MSA (already tracked in `project_msa_pages_dark_mode`).
- Component-reuse refactor as an architectural cleanup (user explicitly excluded as an audit dimension).
