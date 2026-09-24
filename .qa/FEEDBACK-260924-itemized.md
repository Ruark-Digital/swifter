# SwiftPro Contract Test Document — feedback triage (extracted 2026-09-24)

Source: `~/Downloads/Swiftpro Contract Test Document.docx` (re-uploaded 2026-09-24).
Supersedes `FEEDBACK-260921-itemized.md`. Numbering is stable, so the unnumbered
intro cluster and items 22–61 carry over with their 09-21 verdicts. This file
updates them with what the client has since struck through and what shipped on
`fix/phase2-bug-fixes` after 09-21. Items **62–90** are new. (#77 is skipped in the
doc's numbering, and #91 is an empty stub.)

Struck-through paragraphs mean the client closed the item. They drop out of the work-list.

## Headline

- **Newly struck by client since 09-21:** 23, 37, 40, 41, 42, 43, 44, 46, 47, 48,
  50, 51, 52, 54, 59, 60 (plus new items 62, 63, 65, 66, 67, which were struck on arrival).
- **Shipped after 09-21 but not yet struck (needs deploy + re-test):** #57 (`95a00e4`),
  #64 (`8f3e131`), and alerts naming the approver (`f03736486`, intro "pending approval" item).
- **Fixed this round (FE, branch `fix/qa-72-83-84-69`):** #69, #72, #83, #84.
- **New FE-actionable items still open:** #82. #81 and #90 may also be FE.
- **Everything else** belongs to the backend, the AI, or the data.

---

## Carried over — status update on 09-21 items

| # | Item | 09-21 verdict | Now |
|---|------|---------------|-----|
| intro | Draft-solicitation upload, "clicking contracts", LEM-resubmission attachment, Company-caused Delay, "Enter no. of days" | Struck | Still struck |
| intro | RFI delete-button placement; RFI edit attachment retention | Already shipped, re-reported | **Still open in doc**. Already shipped, so this needs a deploy and client re-test |
| intro | No alert "Claim submission pending X's approval" | BE | `f03736486` surfaces pending approvals in alerts right away, with the approver's name. **Re-test** |
| intro | Other intro items (vendor email content, KPI avg, #162 KPI page, name capitalisation, alert lifecycle, RFI issued/received on approver, current balance ≠ remaining, vendor report on PM side, page scrolling, CAPA/holdback action items, preview/download red flag, question time 8:44 PM, AI committed-vs-actual) | BE / needs repro | Unchanged, still open |
| 22 | Solicitation events not shown on overview | BE | Open |
| 23 | Solicitation date filter | Partly struck | **Fully struck, closed** |
| 24 | "Declined" count shows 0 | BE | Open |
| 25 | Can't remove RFP-migrated docs on contract-from-award | Needs repro | Open |
| 26 | RFP docs vanish after saving draft | BE | Open |
| 27/29 | Portfolio $108M → $100M | BE | Open |
| 28 | Contract value CA$12.2M → CA$214k, 3088% budget | BE | Open |
| 29 | "Resolved" should default to 0 | BE | Open |
| 30 | Due in 3 days, alert says 4 | BE | Open |
| 31 | Stale CO alert; alerts should expire | BE | Open |
| 32 | Export all contracts (+ MSA) | Already shipped | Still open in doc. Needs deploy + re-test. Filtered export (dates/status/owner/vendor) is still a follow-up |
| 33 | "Combination" type: allow selecting any mix of sub-types | Needs BE field | Open |
| 34 | RFI Issued/Received cards both 0 | BE | Open |
| 35 | Misleading general update on draft contract | BE | Open |
| 36 | Other CMs' contracts under "My Contracts" | BE | Open |
| 37 | LEM edit keeps previous attachment | Fixed `7e6d4b6` | **Struck, closed** |
| 38 | No general update for Labour & Material Bond | BE | Open |
| 39 | Days-left wrong; alert submission→approval lifecycle | BE | Open |
| 40 | Remind evaluators missing | Not-a-bug | **Struck, closed** |
| 41 | Projects filter disappears | Shipped `2caf497` | **Struck, closed** |
| 42 | Linked-Contracts filters | Shipped `ec8b4bb` | **Struck, closed** (also `2d7b434` server-side filters) |
| 43 | "Published" status | Shipped `b15eb32` | **Struck, closed** |
| 44 | MSAs clickable | Shipped `fec5e72` | **Struck, closed** |
| 45 | Clarifies #40 | Not-a-bug | Not struck, but it is only a clarification. No work |
| 46 | Missed Approvals static | Fixed `85048d9` | **Struck, closed** |
| 47 | Redline suggestions out of order | Engine | **Struck, closed** |
| 48 | Role distribution ≠ 100% | Fixed `85048d9` | **Struck, closed** |
| 49 | Action repeated in System Log | BE | Open |
| 50 | System Log filters | Deferred | **Struck, closed** (`9c72905` wired the search box) |
| 51 | Admin Management user ID / delete / company | Needs repro | **Struck, closed** (`e04e270`, `cf01d2d`) |
| 52 | Super-admin data export failed | Needs repro | **Struck, closed** (`95fffa9`) |
| 53 | Completed action items still listed | BE | Open |
| 54 | Question response time wrong | BE | **Struck, closed** (`3b9af7d`) |
| 55 | Direct reply visible only to the asking vendor | BE | Open |
| 56 | Released holdback subtracted / current balance wrong | BE | Open |
| 57 | CM-created CO → Vendor PM first | BE | **Shipped `95a00e4`**. Not struck yet, needs re-test |
| 58 | Duplicate CO numbers | BE | Open |
| 59 | Remove "Top 10" badge | Fixed `85048d9` | **Struck, closed** |
| 60 | Action-log timestamps | BE | **Struck, closed** (`5757d40`) |
| 61 | No general update for approved Performance Bond | BE | Open (same class as #38) |

---

## New items 62–90

### Closed on arrival (struck)

| # | Item | Shipped in |
|---|------|-----------|
| 62 | MSAs clickable | `fec5e72` (dup of #44) |
| 63 | Search/filter bar on Business Division contracts | `9d424fc` |
| 65 | Wrap evaluation-criteria description | `8f3e131` |
| 66 | Amend pricing accumulates + loses Unit of Measurement | `c49d62e` |
| 67 | Amended doc shows "Pricing" not "NA" | `8f3e131` |

### FE-actionable (open)

| # | Item | Finding | Where |
|---|------|---------|-------|
| **64** | "Search contract" → "Search Business Division" | **Already shipped** in `8f3e131` (placeholder is now "Search Business Division"). Not struck, needs deploy + re-test. | `src/pages/BusinessDivisionsPage/index.tsx:304` |
| **69** | Super Admin Company Activity: x-axis Mon–Sun is static for every range filter | **Fixed.** Items are now bucketed by `createdAt` (then `updatedAt`, then `date`) over the selected range. Unit-tested. Still to check: that the live payload carries one of those date fields. Original finding: **confirmed FE defect.** The `range` param does go to `/companies/dashboard/weekly-activities`, but `transformWeeklyActivities` throws away the item dates. It sums `solicitations.length + evaluations.length` and spreads the total evenly over a hard-coded Mon–Sun axis, so the chart is synthetic. Fix: bucket the items by their date, with the bucket size set by the range (days for 7/30 d, months for 3/6/12 mo). First check that the BE items carry a `createdAt`. | `src/lib/dashboardDataTransformer.ts:1076` |
| **72** | Contract overview header "Contract Value" → "Current Contract Value" | **Fixed.** Label renamed. | `src/pages/ContractManagementPage/components/AnalyticsTab.tsx:625` |
| **83** | Add "Awarded" to status filter (All + My Solicitations) | **Fixed.** "Awarded" option added. Original finding: `statusOptions` has All/Published/Under Evaluation/Draft/Closed but no Awarded. The "Awarded Solicitations" stat card already sets `status: "awarded"`, so the BE supports the value. | `src/pages/SolicitationManagementPage/index.tsx:490` |
| **84** | Add "All" to status filter (All / My / Assigned Evaluations, every role incl. Company Admin) | **Fixed.** "All" option added; it clears the status filter. Original finding: the Status options are Active/Completed/Pending(/Draft), with no "All" to clear the filter. | `src/pages/EvaluationManagementPage/index.tsx:1250` |
| **82** | Remove from MSA across all profiles: Deliverables (also from MSA create + analytics), LEM, Claims, RFI, NCR Log, Vendors Report, Invoice. In Payment Summary, remove Payment Structure, Holdback, Holdback Amount and Holdback Released | FE-owned (MSA tab set + create wizard + analytics + `MsaPage/layouts/PaymentSummary.tsx`). Large surface. **The client asked to hold and discuss on Sunday if this risks disruption.** Scope it before starting. | `src/pages/MsaPage/**` |
| **81** | Hide "recorded savings" general updates from Vendor and Vendor PM accounts only | FE can filter `ContractSaving` entries out for vendor roles as a stopgap. The right fix is BE-side audience scoping (same class as #55). | General Updates feed |
| **90** | Evaluation start/end *time* not saved when the evaluation is edited (date saves, time reverts) | **Needs repro.** Could be the FE edit dialog dropping the time portion or tz conversion, or the BE ignoring it. Check the PATCH payload first. | Edit Evaluation dialog |

### Backend / AI / data-owned

| # | Item | Why |
|---|------|-----|
| 68 | Deadline in 2 days, vendor action item says 3 | Date math. Same class as #30/#39 |
| 70 / 73 | One Addendum, alerts show two (reported twice) | Alert generation / dedup |
| 71 | Action item for PMs 3 days before deliverable due; resubmit item on reject; email reminders | Action-item + email scheduling |
| 74 | PM closed RFI, log says "PM replied" | Action-log event type |
| 75 | Rejected LEM alert says "pending Vendor PM's approval" (should say resubmit) | Alert text/lifecycle |
| 76 | AI assistant finds 1 of 2 NCRs | AI retrieval |
| 78 | AI can't find change orders | AI retrieval |
| 79 | AI can't total contracts by Project / Business Division | AI retrieval |
| 80 | AI should report MSAs/contracts/projects by business division with values/analytics | AI capability |
| 85 | AI Spent vs Commitment wrong, disagrees with portfolio analytics | AI/data (same as intro committed-vs-actual) |
| 86 | Upcoming contract-expiry alert disappeared | Alert generation, possibly a regression |
| 87 | AI wrong combined contract value by vendor | AI/data |
| 88 | AI can't count contracts per CM / top CM | AI retrieval |
| 89 | New View-Only user can't complete registration ("Request failed with status code 400") | Probably BE validation rejecting the View-Only role payload. Needs the 400 response body to confirm the FE isn't sending a bad field |

---

## Suggested next FE batch

#72, #83, #84 and #69 are done. Next: repro **#90**. **#82** waits for the Sunday scoping call. **#64** and
**#57** need a deploy + client re-test, not new code.
