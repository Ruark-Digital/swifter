# QA Feedback Triage — Batch 261004 (items #89–#160)

Source: *Swiftpro Contract Test Document.docx* (this doc's own numbering, "tab 4").
Swagger reference: user-supplied `docs.json` v2.3.0 (**563 paths**, 219 path+method combos newer than the repo's committed `swagger.json`).
Cross-referenced against `origin/fix/phase2-bug-fixes` commit history (this Sept–Oct batch window: `024cc6a82..HEAD`).

Legend:
- **DONE** — already shipped this batch (commit cited).
- **FE** — frontend-only fix, actionable now (no BE dependency).
- **BE-FIXED→FE** — BE endpoint now exists in `docs.json`; needs FE wiring.
- **BE** — depends on backend logic/text we don't control (BE-generated general-updates, alerts, emails, aggregations). Out of scope for "already-fixed" FE work.
- **VERIFY** — believed already handled by a recent commit; needs a before/after e2e check to confirm the reported symptom is gone.
- **INFO** — product question or needs a screenshot/repro before it's actionable.

---

## A. Already DONE this batch (cite commit — confirm with after-only e2e)

| # | Item | Commit |
|---|------|--------|
| 89 | View-only user can't complete registration | `bab1874d8` fix(onboarding): send decrypted invite token (QA #89) |
| 92 | Eval/scoring reminder link → error page | `510c5bed7` (QA #92) deep-link to assigned route |
| 96 | MSA-only: remove holdback amount from Analytics financial overview | `c76712576` (QA #96/#97) |
| 97 | MSA-only: remove Claims/Invoices/RFI/NCR/Deliverables from Analytics Activities | `c76712576` (QA #96/#97) |
| 98 | MSA linked contracts clickable | `7c28d5808` |
| 99 | MSA CM name clickable/contact | `7c28d5808` |
| 118 | LEM rate-sheet compliance indicator | `661c80015` (QA #118) |
| 126 | MSA owner shown as Vendor PM | `92e250e13` show creator as Owner |
| 127 | Vendor ID should be optional | `ce8c8125f` |
| 129 | Filter contracts by company (vendor/PM) | `dee9246a7` + `72e514f60` test |
| 131 | Solicitation time display in declared timezone | `cecdfba18` (UI display only — see #131 note below for the *email* half) |
| 133 | Bid comparison shows proposal/company currency + rate | `d47b29fe6`, `63f5dc6a8` revert exch-col |
| 137 | Activity chart stuck in September | `af5759cee` + `83270c97b` |
| 139 | Vendor-side date/status filters | `89189a70d` |
| 145 | Remove Visibility field from contract | `b976430e7` |

## B. VERIFY — likely fixed by a recent commit; needs before/after e2e to close

| # | Item | Likely covered by | What to check |
|---|------|-------------------|---------------|
| 91 | PM take-over request returns red flag | `AssignProjectManagerDialog` + qa78-takeover tests; BE `POST /…/project-manager` now in docs.json | Request succeeds, no 500 |
| 95 | Error on opening MSA Payment Summary / MSA | `9785d0826` stop calling removed payment-holdbacks endpoint | No error toast on MSA + Payment Summary open |
| 100 | CM approve/reject of PM take-over | BE `POST /…/project-manager/approval`; qa78-takeover FE | Approve→PM swaps; reject→no change |
| 135 | Action-log export downloads only current page | `action-log-export.test.tsx` present | Export yields all rows, not just page 1 |
| 140 | YTD / range filter stuck, shows December | `40fedf289` range filters | YTD rolls with month; no stray Dec |
| 141 | Bid ranking must use converted (reporting) currency | `6a0d09932` total price in company currency | Lowest rank = lowest converted value |
| 144 | "90 days" activities stopped at Sep 28 | activities chart fixes | Range extends to today |
| 149 | Change directive wrongly "pending CM approval" | `pm-approve` / `convert-directive` wired in `ChangeDetailsSheet` | Directive awaits Vendor PM, clears on action |
| 152 | Drag-and-drop docs for directive conversion | `convert-directive` wired; dropzone may be missing | Drag-drop actually accepts files |

## C. FE — actionable now, no BE dependency

| # | Item | Area / file (starting point) |
|---|------|------------------------------|
| 90 | Eval start/end time not updated when evaluation edited | EvaluationManagementPage edit form — date/time field not re-submitting |
| 93 | Consensus indicator: 3-point rule should be 30% of scale, not 3 raw points | `EvaluationDetailPage.tsx` consensus calc |
| 103 | Remove "My Contract"/"My MSA" for view-only | `src/lib/navigation.ts` / `dashboardConfig.ts` gating |
| 104 | Add Projects + Business Division (read-only) for view-only | navigation + route gating |
| 105 | Linked contracts under MSA missing for view-only | MSA linked-contracts query for view-only role |
| 106 | Add missing MSA tabs for view-only (Analytics, KPI, Compliance, Payment Summary, Rate Sheets, Key Personnel, Clause Library, Action Log) | MsaPage tab gating by role |
| 108 | Red flag opening Approvers tab as view-only | Approvers tab query/endpoint for view-only role |
| 107 | "Export report" for MSA doesn't work | wire `GET /manager/msa-contracts/export` (BE-FIXED→FE) |
| 110 | Awarded-solicitation docs no longer migrate to contract (with include/remove option) | contract-from-awarded-solicitation doc list |
| 111 | Allow any combination of contract types under "Combination" (except Combination itself) — (=#33) | contract-type dropdown |
| 113 | "Response" → "Approval" on My Action for rate-sheet submission | My Action label (confirm FE-owned string) |
| 120 | Day-count off by one (2 days shows 1) | shared days-remaining calc |
| 122 | (=#30) day-count still wrong | same calc as #120 |
| 125 | (=#30/#39) day-count | same calc |
| 143 | Late-days differs by profile (2 vs 3 on Vendor PM) | days-late calc; Vendor PM vs CM/approver parity |
| 146 | Last-7-days / 60-days range crosses into Saturday — honor user timezone | range boundary calc |
| 147 | KPI update page disappears (=#162 tab 3) — recurring | KPI update page/modal crash — **high priority** |
| 151 | Claim general update "updated" → "submitted" (confirm FE-owned) | claim submission update string |

**Day-count family (#120/#122/#125/#143/#146):** one shared root cause (days-remaining / days-late rounding + timezone). Fix once, closes five items.

**View-only family (#103/#104/#105/#106/#108):** all role-gating in navigation/dashboardConfig/tab config + a couple of endpoint-routing bugs. One coherent sub-batch.

## D. BE — backend-owned (general-updates, alerts, emails, aggregations); NOT "already fixed"

| # | Item | Why BE |
|---|------|--------|
| 101 | General update calls Vendor PM an "approver" | update text generated BE |
| 109 | Repeated "draft created" general update on every save | update emission BE |
| 112 | PM/approver action says "review update" not "approve" | action text BE |
| 114 | Role-distribution numbers wrong (company admin) | aggregation BE |
| 116 | Module usage empty for 30/7 days | aggregation BE |
| 117 | Subscription distribution identical across filters | aggregation BE |
| 124 | Report alert shouldn't fire for contract published after the 25th | alert logic BE |
| 130 | Vendor distribution shows 50% active for 2 active | aggregation BE |
| 131 | *Email* notification time wrong (UI half shipped — see A) | email template BE |
| 132 | Email "proposal submitted" sent on draft-save | email trigger BE |
| 134 | AI assistant must handle follow-ups / be agentic | AI/BE |
| 142 | Deliverable due date in email off by one | email template BE |
| 148 | Claim approval alert should name the approver | alert text BE |
| 150 | Change-directive email overhaul (wording) | email template BE |
| 153 | Email "Requested By" → "Submitted By" | email template BE |
| 154 | Remove non-action entry from action log | action-log emission BE |
| 155 | Action ID sequence broke | action numbering BE |
| 156 | Email alert to CM/approvers on report submission | email trigger BE |
| 158 | Action-log timestamps wrong | timestamps BE |
| 160 | General update "Submitted" → "Issued" | update text BE |

## E. INFO — needs repro/screenshot or is a product question

| # | Item | Needed |
|---|------|--------|
| 102 | View-only has no contracts/dashboard | partly `19706d72a`; confirm whether remaining symptom is data or gating |
| 115 | Super-admin company-activity chart empty (#69 not fully fixed) | repro which filter/range |
| 119 | Clause library picking up amendment content — status question | product status, not a bug report |
| 121 | (=#181 tab2) no reminder to vendor PM | reminder is BE; confirm trigger exists |
| 123 | (=#71) PM deliverable action item + email reminders | action-item (FE) vs email (BE) split |
| 128 | How to invite an already-registered vendor | product question |
| 136 | Vendor acknowledgement/receipt indicator | new feature; needs BE ack state |
| 138 | (=#52) Super-admin data export fails | capture failure (FE call vs BE 500) |
| 157 | RFI pending-response alerts missing | alert source (BE-generated vs FE-derived) |
| 159 | Open-RFI alert inconsistent across contracts | same alert source question |

---

## Recommended execution order (FE + BE-FIXED→FE only)

1. **Day-count family** #120/#122/#125/#143/#146 — one root fix, five items.
2. **View-only family** #103/#104/#105/#106/#108 — coherent role-gating sub-batch.
3. **#147 KPI update page crash** — recurring, high user frustration.
4. **#107 MSA export** — wire new `/manager/msa-contracts/export`.
5. **Verify-bucket (B)** — before/after e2e on #91/#95/#100/#135/#140/#141/#144/#149/#152.
6. Remaining singletons: #90, #93, #110, #111, #113, #151.

Each ships as its own `claude/<slug>-b79014` branch → PR to `fix/phase2-bug-fixes`, with Playwright before/after evidence under `.qa/`.
