---
name: msa-compliance-security-flow-review
description: Per-role user-flow review of MSA Compliance & Security vs Contract Management; four behavioral gaps shipped in commit 654c72364
date: 2026-05-25
status: complete
---

# Summary

Reviewed Compliance & Security user-flow across manager, approver, vendor/PM, and view-only on MSA vs Contract Management (Contract = source of truth). Wrote `REPORT.md` documenting the per-role comparison, then shipped all four prioritized fixes to [src/pages/MsaPage/layouts/Compliance.tsx](src/pages/MsaPage/layouts/Compliance.tsx).

## Findings

| # | Finding | Roles affected | Shipped? |
|---|---|---|---|
| 1 | Manager Approve/Reject buttons not gated on `hasFiles` + status set | Manager | ✅ |
| 2 | Vendor/PM Submit missing "first-submission" fallback (`!status && !hasFiles`) | Vendor / PM | ✅ |
| 3 | Security table missing Date column (Due Date / Due In) | All who can see the tab | ✅ |
| 4 | Security row `id` priority inverted (`_id` first instead of `securityTypeId`) | All who can see the tab | ✅ |

Approver and view-only flows confirmed at parity — both pages hide the tab via whitelist.

## Audit corrections

Two §7 findings from the 260524 parity audit were false positives, retracted in `REPORT.md`:

- "MSA uses raw `userRole === "contract_manager"` string compare" — Contract does the same.
- "MSA bulk-approve hardcodes comment with no dialog" — Contract does the same.

## Commit

- `654c72364` — `fix(compliance): port Contract manager gate + Date column + id priority to MSA Compliance`

Verified with `pnpm exec tsc -b` (exit 0). UI not exercised in dev server.

## Memory updates

- `project_msa_compliance_manager_gate_drift` — specific findings.
- `feedback_inline_reimpl_drops_gates` — generalized heuristic: action gates are higher-yield than endpoint shape when auditing MSA inline reimplementations.
