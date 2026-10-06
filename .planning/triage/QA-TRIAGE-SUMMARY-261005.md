# SwiftPro QA Triage — Catalog & Status

Source: `Swiftpro Contract Test Document.docx` (161 numbered items + ~20 unnumbered lead items).
Cataloged: 2026-10-05. Grouped by functional area.

**Status legend**
- ✅ **DONE (repo)** — matched to a shipped commit; *verify against the live build*.
- 🔶 **IN REVIEW** — on an open PR, not yet merged.
- 🟡 **IN PROGRESS / BE-unblocked** — BE deployed; FE wiring pending or partial.
- ❗ **OPEN (confirmed)** — doc explicitly says "not fixed yet".
- ⬜ **OPEN** — no repo evidence either way (treat as open).

> "DONE (repo)" is inferred from git history + `.planning/STATE.md`, not from live QA sign-off.

---

## ⭐ BE-unblocked this round (WhatsApp)

| # | Item | BE note → FE action | Status |
|---|------|---------------------|--------|
| **115** | Super-admin "Company activity" chart is empty (follow-on to #69) | "api is returning response" → chart-empty is an FE consume/transform bug | 🟡 BE-unblocked |
| **116** | Super-admin "Module usage" shows nothing for 30-day / 7-day filters | "not making daily request" → FE must send daily granularity for those ranges | 🟡 BE-unblocked |
| **135** | Action-log export only downloads the current page | "call the api with the total limit" → request all records. **Target: contract action log (ContractDetailPage Logs tab).** | 🟡 BE-unblocked |
| — | "user route api" deployed | Backs the View-Only (`/user/*`) items #102–108 | 🟡 BE-unblocked |

---

## Solicitation / RFP
| # | Item (gist) | Status |
|---|-------------|--------|
| (lead) | Upload/attach docs to a **draft** solicitation — upload page disappears on click | ⬜ |
| (lead) | Make Solicitation & Evaluation names clickable (like contracts) | ⬜ |
| 22 | Solicitation pre-bid Events not shown on overview (PL & vendor) | ⬜ |
| 23 | Solicitation "filter by dates" doesn't work | ⬜ |
| 54 | Time of response to solicitation question inaccurate | ⬜ |
| 55 | Vendor-specific question response should be visible only to that vendor | ⬜ |
| 83 | Add "Awarded" to status filter (All/My Solicitation) | ⬜ |
| 136 | Add received/acknowledged indicator (gray→green) for vendor solicitation receipt | ⬜ |

## Evaluation / KPI
| # | Item (gist) | Status |
|---|-------------|--------|
| (lead) | KPI all-time Avg Score not updating | ⬜ |
| (lead)/#147 | KPI update page disappearing (ref "#162 tab 3") | ❗ (147 says still open) |
| 40 | "Remind evaluators" function missing | ⬜ |
| 45 | "Remind" clarified — only visible when evaluator pending (likely NAB) | ⬜ |
| 65 | Evaluation criteria description wrap (no horizontal scroll) | ✅ dd4f3f9a7 |
| 84 | Add "All" to evaluation status filter | ⬜ |
| 90 | Evaluation start/end time not modified on edit | ❗ (doc: not fixed 09-27) |
| 92 | Scoring-reminder link under My Action → error page | ✅ 510c5bed7 |
| 93 | Consensus indicator should use 30% differential, not raw 3 points | ⬜ |

## Dashboard / Portfolio analytics
| # | Item (gist) | Status |
|---|-------------|--------|
| 24 | "Declined" count on proposal-submission chart inaccurate | ⬜ |
| 46 | "Missed approvals" compliance tile static — remove or make "Pending Approvals" | ⬜ |
| 137 | Activity chart stuck in September | ⬜ |
| 140 | YTD filter shows December — confirm it rolls over monthly | ⬜ |
| 144 | "90 days" activities stopped at Sept 28 | ⬜ |
| 146 | Last 7 / 60 days should be timezone-based | ⬜ |

## Super Admin / Company Admin
| # | Item (gist) | Status |
|---|-------------|--------|
| 48 | Role distribution (super admin) doesn't total 100% | ⬜ |
| 51 | Company Admin details: user ID, "Delete User" broken, company name blank | ⬜ |
| 52 / 138 | Super-admin data export fails | ❗ (138: still fails) |
| 69 | Company-activity axis static across filters | ⬜ (see #115) |
| 114 | Role distribution under company admin inaccurate | ⬜ |
| **115** | Company activity chart empty | 🟡 |
| **116** | Module usage empty for 30/7-day filters | 🟡 |
| 117 | Subscription distribution identical across all filters | ⬜ |

## System / Action Log
| # | Item (gist) | Status |
|---|-------------|--------|
| 49 | Action repeated in system log | ⬜ |
| 50 | Add filters to System Log (date / name / company) | ⬜ |
| 60 | Timing of recorded actions in action log incorrect | ⬜ |
| 74 | PM closed RFI but log recorded "PM reply" | ⬜ |
| **135** | Export downloads only current page — allow full export (contract log) | 🟡 |
| 154 | Remove a non-action entry from the action log | ⬜ |
| 155 | Action ID sequence broke (ACT-042) | ⬜ |
| 158 | Action-log timestamps incorrect | ⬜ |

## Contracts (general / status / documents / filters)
| # | Item (gist) | Status |
|---|-------------|--------|
| 25 / 26 / 110 | Can't remove migrated RFP docs; docs vanish on draft save; missing on awarded-solicitation contracts | ⬜ |
| 32 | "Export all contracts" button does nothing — need Excel export w/ filters (+ MSA) | ⬜ |
| 33 / 111 | Contract "Combination" type — allow any combination (per #287 tab2) | ❗ (111: not fixed) |
| 36 | Other CMs' contracts appear under "My Contracts" | ⬜ |
| 43 | Should flip to "Published" once fully approved | ⬜ |
| 63 / 64 | Business Division: add search/filter bar; relabel "Search Business Division" | ⬜ |
| 91 / 100 | PM take-over request (red flag) + CM approve/reject | 🔶 PR #643 |
| 112 | Published-contract PM action says "review update" instead of "approve" | ⬜ |
| 145 | Remove "Private" visibility option on contract create (redundant) | ⬜ |

## MSA
| # | Item (gist) | Status |
|---|-------------|--------|
| 44 / 62 | Make MSAs clickable | ⬜ |
| 82 | Remove modules from MSA (Deliverables, LEM, Claims, RFI, NCR, Vendor Reports, Invoice; trim Payment Summary) | ✅ 88bb6779e (+related) |
| 94 | Add "change Vendor PM of MSA" for CM | ❗ (doc: not fixed 09-27) |
| 95 | Error opening MSA Payment Summary tab | ✅ 9785d0826 |
| 96 / 97 | MSA-only: trim Analytics (holdback amount; claims/invoices/RFI/NCR/deliverables) | ✅ c76712576 |
| 98 / 99 | MSA linked contracts & CM name clickable | ✅ 7c28d5808 (99 partial) |
| 107 | MSA "Export report" doesn't work | ⬜ |
| 126 | MSA owner changed to Vendor PM | ⬜ |

## View-Only user (/user/* routes — BE deployed)
| # | Item (gist) | Status |
|---|-------------|--------|
| 89 | View-only user can't complete registration | ✅ bab1874d8 (doc said open 09-27) |
| 102 | View-only has no contracts/dashboard | 🟡 |
| 103 | Remove "My Contract"/"My MSA" for view-only | 🟡 |
| 104 | Add Projects & Business Division (view-only) | 🟡 |
| 105 | Linked contracts under MSA missing for view-only | 🟡 |
| 106 | Add missing MSA tabs for view-only | 🟡 |
| 108 | Red flag on view-only Approvers tab | 🟡 |

## Change Orders / Directives
| # | Item (gist) | Status |
|---|-------------|--------|
| 31 | Stale CO alert (approved during testing); alerts should expire ~1mo | ⬜ |
| 57 | CM-created Change Order not routed for approval correctly | ⬜ |
| 58 | Duplicate CO number assigned; numbering should be status-independent & sequential | ⬜ |
| 59 | Remove "Top 10" from change-order impact | ⬜ |
| 149 | Change directive can't be "pending CM approval" (awaiting vendor) | ⬜ |
| 150 | Overhaul change-directive email to PM (recipient, not issuer) | ⬜ |
| 152 | Drag-and-drop docs for change-directive response | ⬜ |
| 153 | Email to CM: "Requested By" → "Submitted By" (change proposal) | ⬜ |

## Claims
| # | Item (gist) | Status |
|---|-------------|--------|
| (lead) | Add "Company-caused Delay" to Claim type dropdown | ⬜ |
| (lead) | Create claim: "enter date" → "Enter no. of days" (time/cost impact) | ⬜ |
| (lead) | No alert that claim submission is pending approval | ⬜ |
| 148 | Claim approval alert should name who's yet to approve (not "manager's approval") | ⬜ |
| 151 | Claim: "updated" → "submitted" | ⬜ |

## RFI
| # | Item (gist) | Status |
|---|-------------|--------|
| (lead) | RFI delete button too close to doc description | ⬜ |
| (lead) | Previous attachments not retained on RFI edit | ⬜ |
| (lead)/#34 | RFI Issued vs Received inaccurate; cards both 0 (user-agnostic) | ⬜ |
| 157 | Add alert for RFIs pending response (+ responder name) | ⬜ |
| 159 | Open-RFI alert inconsistent across contracts | ⬜ |

## LEM / Rate Sheet / Pricing
| # | Item (gist) | Status |
|---|-------------|--------|
| (lead) | LEM resubmission doesn't retain prior rejected attachment | ⬜ |
| 37 | Previous attachment not retained on LEM edit | ⬜ |
| 66 | "Amend" pricing adds to previous; UoM not retained | ⬜ |
| 67 | Amended doc should show "Pricing" not "NA" | ⬜ |
| 75 | Misleading alert: rejected LEM shown as pending PM approval | ⬜ |
| 113 | My action for rate sheet: "Response" → "Approval" | ⬜ |
| 118 | Flag non-compliant items after LEM rate check; remove Total Variance/Rate Sheet Total | ⬜ |

## Deliverables
| # | Item (gist) | Status |
|---|-------------|--------|
| 71 / 123 | Action item + email alerts for PMs to submit deliverables within 3 days | ❗ (123: not fixed) |
| 121 | No reminder to PM for upcoming deliverable (ref #181 tab2) | ⬜ |
| 142 | Deliverable due date in email alert off by 1 day | ⬜ |
| 143 | Late-deliverable count differs PM (2d) vs CM/approver (3d) | ⬜ |

## Compliance / Security (bonds)
| # | Item (gist) | Status |
|---|-------------|--------|
| 38 | General update for Labour & Material Bond missing | ⬜ |
| 39 | Days-left incorrect; alert should move to approval stage, retrigger on reject | ⬜ |
| 61 | No general update for approved performance bond | ⬜ |

## Payment / Holdback / Financials
| # | Item (gist) | Status |
|---|-------------|--------|
| (lead) | Current Balance (payment summary) ≠ Remaining (invoice) | ⬜ |
| 28 / 29(a) | Contract value corruption (12.2M→214,750; 3088% budget); portfolio $108M→$100M | ⬜ (critical) |
| 29(b) | Addressed/Resolved should default to 0 | ⬜ |
| 56 | Released holdback wrongly subtracted from contract value | ⬜ (recent holdback work PR #608 — verify) |
| 72 | Relabel to "Current Contract Value" | ⬜ |

## AI Assistant
| # | Item (gist) | Status |
|---|-------------|--------|
| (lead) | Committed Spend vs Actual (AI) off | ⬜ |
| 76 | AI found only 1 of 2 NCRs | ⬜ |
| 78 | AI couldn't find change orders | ⬜ |
| 79 / 80 | AI can't pull totals / analytics by project & business division | ⬜ |
| 85 | AI Spent vs Commitment inaccurate | ⬜ |
| 87 | AI wrong combined contract value by vendor | ⬜ |
| 88 | AI couldn't pull contracts by CM | ⬜ |
| 134 | AI should handle follow-up questions (agentic) | ⬜ |

## Notifications / Email / Alerts (cross-cutting)
| # | Item (gist) | Status |
|---|-------------|--------|
| (lead) | Vendor deadline email content mixed up (PL reminder sent to vendor) | ⬜ |
| (lead) | Capitalize user first/last names in alerts | ⬜ |
| 30 / 120 / 122 / 125 | Days-left off by one across alerts | ❗ (122/125: not fixed) |
| 53 | Completed action items still showing | ⬜ |
| 68 | Deadline 2 days but action item says 3 | ⬜ |
| 70 / 73 | One addendum but alerts show two | ⬜ |
| 86 | Upcoming contract-expiry alert removed? | ⬜ |
| 124 | Report alert shouldn't fire for contract published after the 25th | ⬜ |
| 131 | Email time for new solicitation incorrect | ⬜ |
| 132 | "Proposal submitted" email sent when only saved as draft | ⬜ |
| 156 | No email to CM/approvers on monthly report submission | ⬜ |

## Vendor management
| # | Item (gist) | Status |
|---|-------------|--------|
| (lead) | Vendor report submission not visible on PM side | ⬜ |
| 81 | Remove savings general updates from Vendor/PM accounts | ⬜ |
| 101 | General update labels PM take-over as approvers (they're not) | ⬜ |
| 127 | Restore optional Vendor ID (auto-assign if blank) | ✅ ce8c8125f |
| 128 | Invite vendors already registered with other companies (SSO) | ⬜ |
| 129 | Filter vendor/PM accounts by company name | ⬜ |
| 130 | Two active vendors shown as 50% active | ⬜ |
| 139 | Filters broken on vendor/PM side | ⬜ |

## Bid comparison / Currency
| # | Item (gist) | Status |
|---|-------------|--------|
| 133 | Indicate proposal currency on bid comparison (ref #214 tab3) | ❗ (not done) |
| 141 | Bid rank wrong without conversion (euro not actually lowest) | ⬜ |

## General updates / Labels / Redline / Clause / UX
| # | Item (gist) | Status |
|---|-------------|--------|
| (lead) | Scroll through all documents instead of next-page clicking | ⬜ |
| (lead) | Preview/download of contract & solicitation docs failing | ⬜ |
| 35 | Draft contract shown as "published" in general update | ⬜ |
| 47 | Redline suggestions not in sequential order | ⬜ |
| 81 / 109 | Repeated draft-creation general update on each save | ⬜ |
| 119 | Clause library pick up amendment content on approval | ⬜ |
| 160 | General update: "Submitted" → "Issued" | ⬜ |

---

## Roll-up

- **Shipped (repo):** #65, #82, #89, #92, #95, #96, #97, #98/#99, #127 (~11 items).
- **In review (PR #643):** #91, #100.
- **BE-unblocked, FE pending:** #115, #116, #135, view-only #102–108.
- **Confirmed still open (doc):** #90, #94, #52/#138, #111, #122/#123/#125, #133, #147.
- **Everything else:** open / unverified.

## Suggested next batches
1. **Dashboard/export (BE-ready):** #115, #116, #135 — the WhatsApp batch.
2. **View-only completion:** #102–108 on the deployed `/user/*` routes.
3. **Critical data integrity:** #28/#29/#56 (contract value / holdback math) — highest risk.
4. **Alert day-count family:** #30/#39/#68/#120/#122/#125/#142/#143 — one shared fix.
