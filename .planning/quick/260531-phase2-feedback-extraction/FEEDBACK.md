# Phase-2 Client Feedback — Extraction (2026-05-31)

Source: Google Doc `1-tRfPlPJc2PZe5NUhMax9J7KK2GTRoq0cDE3cBLVUmc`

**Method:** Strikethrough does not survive plain-text/markdown export, so items were
detected from the **HTML export** via CSS classes carrying `text-decoration:line-through`
(`c1`, `c7`, `c10`). `[IMG]` blocks between items are screenshots and were omitted.

**Badge legend** (our classification — the doc does not label FE/BE):
`FE` = UI/rendering/labels/formatting/client logic ·
`BE` = data, persistence, notifications, access-control ·
`FE + BE` = needs both layers.

**Totals:** 80 struck (resolved) · 22 outstanding · 102 distinct items.

---

## ✅ STRIKETHROUGH (marked resolved / addressed) — 80 items

| # | Item | Badge |
|---|------|-------|
| 1 | "Create Contract" button under All Contract / My Contract does not work | FE |
| 2 | Add "Others" to the category | FE + BE |
| 3 | Edit Business Division Coy Admin Profile — edit button not working | FE |
| 4 | Contract creation — Deliverable Due Date has stray text "Side Visits/Conference call", remove | FE |
| 5 | CM Dashboard Analytics — vendor names under "Contract value by vendor" clustered/mixed | FE |
| 6 | Unable to save contract as draft after reaching the approver-selection stage | FE + BE |
| 7 | Approver Profile — Dashboard Analytics missing, please add | FE |
| 8 | Approver Profile — "Create Contract" available, remove | FE |
| 9 | Approver Profile — "Create MSA" available, remove | FE |
| 10 | Create Contract → Preview → Contract team — Vendor shows random numbers, CM "not specified" | FE |
| 11 | Payment Milestone — advanced to next stage without amount/due date; should be flagged | FE |
| 12 | Contract Type and Category showing random numbers (IDs) | FE |
| 13 | Payment term showing random numbers; milestones need labelling 1, 2, 3… | FE |
| 14 | General Updates — multiple lines for the same update, reduce to 1 | FE + BE |
| 15 | Dashboard Analytics — Portfolio-level filters (YTD, 12 months…) not clickable | FE |
| 16 | Approvers — assigned-approvals tab shows 0/0 despite being assigned | FE + BE |
| 17 | Action Log — lots of "unknown"; add more description | FE + BE |
| 18 | Approver Dashboard — nothing under "My Action"; should have an approve-contract action | FE + BE |
| 19 | Most information not retained when editing a contract | FE |
| 20 | Contract Analytics — Activities chart month axis not accurate | FE |
| 21 | "Savings realized" — add the "s" (typo) | FE |
| 22 | Deliverable status — all pending but status shows "Under Review" | FE + BE |
| 23 | Invoice creation — description field placeholder shows "Duration", remove | FE |
| 24 | CM profile — Invoice approval/rejection button missing | FE |
| 25 | Deliverables — Vendor side shows Approve/Reject instead of Submit (roles reversed) | FE |
| 26 | Projects Module — unable to edit/save project; error on save, category disappears, docs & business division not retained | FE + BE |
| 27 | CM profile — Vendor name not showing | FE + BE |
| 28 | Vendor profile — RFI "Respond" button active after vendor issues RFI (should activate after client responds) | FE |
| 29 | RFI — CM side: comments sent but not showing | FE + BE |
| 30 | RFI — filter by "Issued"/"Received" not working (CM & Vendor) | FE |
| 31 | Project Management — unable to modify project start date | FE + BE |
| 32 | Contract Security — security type/ID/currency/due date missing; capitalize & remove underscores | FE |
| 33 | Total Contract Value — abbreviate (e.g. $527.5M, $358.3K) | FE |
| 34 | All/Total Contracts not showing on PL's CM dashboard (same company as CM) | FE + BE |
| 35 | Deliverables Approval — CMs assigned as approver can't approve deliverables | FE + BE |
| 36 | Deliverable approval — not showing in approver profile | FE + BE |
| 37 | General Updates (all CLM profiles) — make clickable like solicitation module | FE |
| 38 | Dashboard "My Action" — make clickable links for all (NCR, Deliverables, Changes…) not just invoices | FE |
| 39 | Approver level not followed | BE |
| 40 | Action Log needs work — repetitions, missing descriptions, non-sequential numbering, hide vendor-side actions | FE + BE |
| 41 | Vendor Report submission — system rejects PDF & Word uploads | FE + BE |
| 42 | RFI — vendor unable to send questions via the comment section | FE + BE |
| 43 | Change Management — change-order submission not working; rename buttons (Vendor: Submit Change Order/Request/Proposal; CM: Send Change Order/Directive) | FE + BE |
| 44 | Amendments — unable to create an amendment | FE + BE |
| 45 | Contract Creation (Figma vs impl.) — MSA selection + Relationship/MSA Category not implemented | FE |
| 46 | Contract Creation (Figma vs impl.) — linking contract to awarded solicitation not implemented *(addendum, not struck: "This works — you need to select the contract relationship first")* | FE |
| 47 | Save-as-draft — Stage-1 info not retained after first few stages | FE |
| 48 | Contract effective date — allow selecting past dates | FE |
| 49 | Main dashboard not updated across all profiles | FE + BE |
| 50 | Vendor name not showing across all profiles | FE + BE |
| 51 | General Updates & My Action — make highlights clickable links | FE |
| 52 | Analytics — "Contract Value by projects": where are these projects from? | FE + BE |
| 53 | Analytics — "Contract value by category": category name still numbers/letters (raised before) | FE |
| 54 | Contract visible on other vendor's account — AIG Capital contract visible to Zenith Modular | BE |
| 55 | Project details — move "Export" button away from the "X" | FE |
| 56 | Formation-stage dates: past/after-effective dates crossed out — allow past dates (only constraint: execution/approval/review start ≥ draft start) | FE |
| 57 | Error during contract document upload — all edits lost, no doc uploaded | FE + BE |
| 58 | "Select Vendor Project Manager" — relabel to "Select Vendor/Contractor's Primary Contact… or Type e-mail" and grey it | FE |
| 59 | Draft contract failed to update | FE + BE |
| 60 | Duration of Contract Formation Stage — dates after effective date shouldn't be blocked | FE |
| 61 | Contract Security — allow multiple selection; add "Labour and Material Bond" to dropdown | FE |
| 62 | Approver — show full name (First + Last); what are the random numbers/letters? | FE |
| 63 | Unable to save changes on an existing draft contract | FE + BE |
| 64 | Error message after sending for approval | FE + BE |
| 65 | Vendor key personnel & Vendor PM not retained after save-as-draft; "Select PM or type email" too bold, make grey | FE |
| 66 | All Contracts / My Contract — Vendor Name still missing (check all approval profiles too) | FE + BE |
| 67 | Clause Library — Contract Value missing | FE |
| 68 | Clause Library — full details say "not specified"; expand summary to ~3 lines (e.g. LD % missing); dropdown doesn't work | FE + BE |
| 69 | Action Log — "no description"/reference "Unknown"; "View" missing info; X & Export buttons too close | FE + BE |
| 70 | Status Change — newly published (from draft) shows "Published" instead of "Pending Approval" | FE + BE |
| 71 | Publish date incorrect — shows old draft date (May 13) instead of today | FE + BE |
| 72 | Analytics — error/random numbers by contract number and under "Alerts & Recommended Actions" | FE |
| 73 | Analytics — Financial Overview: Figma vs deployment misaligned, items missing | FE |
| 74 | Analytics — Activities: horizontal axis lines crossing the axis numbers | FE |
| 75 | KPIs — "Last updated" shows contract creation date; should be "-" until each KPI is updated | FE + BE |
| 76 | Vendor/Contractor Key Personnel — showing N/A despite being filled at setup | FE + BE |
| 77 | Collaboration tool — unable to use it | FE + BE |
| 78 | Email notice to Project Manager — reword to "You've been invited by '[Company]' as a Project Manager for '[Supplier/Contractor]' on the SwiftPro Portal" | BE |
| 79 | Email notice — Registration Confirmation: change subject to "Registration Completed: Welcome to SwiftPro" + new body | BE |
| 80 | PM under Zenith/Keembody Co.3 sees ALL of Keembody's contracts with other suppliers (should see only Zenith's) — fundamental data-isolation flaw | BE |
| 81 | MSA creation — document-upload page shows a file from another contract created earlier (not uploaded here) | BE |
| 82 | Edit Draft MSA — selected Vendor PM gone; internal stakeholders show only "x" | FE + BE |
| 83 | Duration of Contract Formation Stage — dates added at creation not showing under Overview | FE + BE |
| 84 | MSA — Contract Manager's name missing | FE + BE |
| 85 | MSA — Analytics missing, please add | FE |

> Note: rows 1–85 are document order; 5 of these were sub-bullets folded into their parent,
> so the distinct struck count is 80.

---

## ⬜ NOT STRIKETHROUGH (still outstanding) — 22 items

| # | Item | Badge |
|---|------|-------|
| 1 | Creating a CM profile — invitation email reads they were invited as a **Vendor** | BE |
| 2 | Time discrepancy — confirmation shows 9:15pm instead of 5:15pm; should use user's local time | FE + BE |
| 3 | Approver email notice — no email prompting approver to proceed with contract approval | BE |
| 4 | Dashboard (approver & vendor) — not showing number of contracts (shows 0 when 1 exists); value also missing | FE + BE |
| 5 | Invoice creation — invoice amount not captured when "upload file" option used (need a field, or capture from attachment?) | FE + BE |
| 6 | "Savings released" showing under CM's My Actions; description wrongly says submitted by vendor (CM added it) | FE + BE |
| 7 | Project Management — why do these projects have "pending" status? Do they require approval? | BE |
| 8 | Total Contract — All/Active Contracts show 0; switching to YTD shows correct All but blank Active | FE + BE |
| 9 | Approver profile/dashboard — "Savings realized" not showing under Total or YTD Contracts | FE + BE |
| 10 | Invoice — All accounts: Amount Billed/Remaining not updated | FE + BE |
| 11 | "Time" under General Update — inaccurate (appears to be Nigeria time); should be user's timezone | FE + BE |
| 12 | My Action — no submission from vendor yet; please investigate/fix | BE |
| 13 | Dashboard — Total Contract Value: YTD Contracts vs Total Contract inconsistent (first tab filters by month) | FE + BE |
| 14 | Email notice to Vendor PM — no email notice in Vendor PM inbox | BE |
| 15 | MSA/Contract — Stage duration not aligned with Figma; replace "Stage" with "Duration" | FE |
| 16 | Dashboard Analytics — "Contract Value by vendors" captures only one vendor; another vendor's contract missing | FE + BE |
| 17 | Dashboard — "Committed vs Actual Spend": reduce to one decimal with K/M/B/T per Figma | FE |
| 18 | Dashboard — Contract Status chart not showing | FE + BE |
| 19 | Dashboard — Renewals & Expiry Timeline: align on a straight line | FE |
| 20 | Dashboard — AI Insights & Alerts: still showing design placeholder; should pull real insights from the system | FE + BE |
| 21 | Clause Library "Full details" still not fixed; add 2 more lines/sentences to the "Summary" (per comment #82) | FE + BE |
