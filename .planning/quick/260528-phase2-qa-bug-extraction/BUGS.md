# SwiftPro Phase-2 QA Bug Extraction — 2026-05-28

**Source:** https://docs.google.com/document/d/1-tRfPlPJc2PZe5NUhMax9J7KK2GTRoq0cDE3cBLVUmc/edit
**Scope:** This repo is frontend-only. BE items are escalations.
**Method:** mobilebasic text extraction + `grep` on HTML-export `c5`/`c11` strikethrough classes to identify excluded items.

## Excluded (strikethrough in source — 33 items + 1 image-only)

Items: 1, 2, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 19, 20, 22, 23, 25, 26, 27, 30, 33, 35 (image-only), 36, 37, 41, 42, 53, 55, 58, 59, 61, 80, 84, 86

---

## FRONTEND bugs (actionable here)

| # | Area | Bug |
|---|------|-----|
| 28 | Invoice | Upload-based invoice creation doesn't capture amount — need manual amount field |
| 29 | Invoice | CM profile Invoice approve/reject buttons missing |
| 31 | Projects | Edit project: save errors; category disappears; uploaded docs + business division not retained |
| 34 | RFI | Vendor "Respond" button active before CM responds — should activate after client provides response |
| 39 | Projects | Cannot modify project start date in edit |
| 40 | Contract Security | Missing fields (Security type, ID, currency, due date); dropdown labels lowercase/underscored |
| 43 | Dashboard | Total/Active Contracts show 0; YTD shows total but not Active |
| 44 | Approver Dashboard | Savings realized not showing under Total or YTD |
| 47 | CLM | "General Updates" not clickable across CLM profiles |
| 48 | Dashboard | "My Action" deep-link to approval items (apply to NCR, Deliverables, Changes — not just Invoice) |
| 49 | Invoice | "Amount Billed / Remaining" not updated on All Accounts |
| 52 | Vendor Reports | File upload rejects PDF + Word documents |
| 54 | Change Mgmt | Button labels per type (Vendor: Submit Change Order/Request/Proposal; CM: Send Change Order/Directive) |
| 56 | Contract Creation | MSA selection + Relationship/MSA Category not implemented (Figma gap) |
| 57 | Contract Creation | Linking contract to awarded solicitation not surfaced (Figma gap) |
| 60 | Dashboard | Main dashboard not refreshed/synced across profiles |
| 62 | Dashboard | General Updates + My Action — clickable (dup of 47/48) |
| 65 | Analytics | "Contract Value by Projects" — origin unclear |
| 66 | Analytics | "Contract Value by Category" — category rendering still shows IDs |
| 68 | Projects | Move "Export" button away from close "X" |
| 69 | Contract Formation | Date picker greys dates after effective date — should allow; only Draft Start ≤ Execution/Approval/Review |
| 70 | Contract Upload | Upload error wipes all in-progress edits |
| 71 | Contract Creation | Vendor PM picker label → "Select Vendor/Contractor's Primary Contact for Contract Management or Type e-mail" + grey |
| 73 | Contract Formation | Dates after effective date should not be blocked |
| 74 | Contract Security | Allow multi-select; add "Labour and Material Bond" |
| 75 | Approver | Show First + Last name; remove raw IDs |
| 78 | Contract Creation | Vendor key personnel + Vendor PM not retained on draft save; "Select project manager" placeholder too bold |
| 79 | Dashboard | Total Contract Value differs between YTD and Total tiles |
| 81 | Clause Library | Contract Value column missing |
| 82 | Clause Library | "Not specified" everywhere; summary too short; dropdown action broken |
| 83 | Action Log | "View" modal missing fields; close X + Export too close |
| 87 | Analytics | Financial Overview deployment missing items vs Figma |
| 88 | Analytics | "Activities" chart — horizontal axis lines overlap numbers |
| 89 | KPIs | "Last updated" defaults to creation date — should be "—" until updated |
| 92 | Collaboration | Collaboration tool not usable |
| 97 | MSA | Edit Draft MSA — Vendor PM gone; stakeholders render as "x" only |
| 98 | MSA | Contract Formation stage dates not surfaced on Overview |
| 99 | MSA | Contract Manager name missing on MSA detail |
| 100 | MSA | Analytics tab missing |

## BACKEND bugs (escalate)

| # | Area | Bug |
|---|------|-----|
| 3 | Email | CM invitation email says they were invited as a Vendor |
| 11 | Email/TZ | Email confirmation shows 9:15pm instead of 5:15pm |
| 13 | Validation | Payment Milestone — proceeded without amount + due date (verify against BE spec) |
| 21 | Email | No approver email notice prompting contract approval |
| 32 | Action Log | "Savings released" log says submitted by vendor (was added by CM) |
| 38 | Workflow | Project pending status — approval workflow unclear |
| 45 | Permissions | CMs assigned as approvers cannot approve Deliverables |
| 46 | Queue | Deliverable not appearing in approver's profile (follows from #45) |
| 50 | Workflow | Approver level sequence not followed |
| 51 | Action Log | Repetition, missing descriptions, non-sequential numbering; vendor actions leaking into internal log |
| 63 | Timezone | "General Updates" timestamps appear to be Nigeria time |
| 64 | Queue | "My Action" not surfacing vendor submission |
| 67 | **Data leak (CRITICAL)** | AIG Capital contract visible to Zenith Modular — tenant isolation failure |
| 72 | Persistence | Draft contract update fails |
| 76 | Persistence | Cannot save changes on existing draft (likely overlaps 72) |
| 77 | Server | Error when "Send for Approval" |
| 85 | Server | Publish date incorrect — shows draft date |
| 90 | API shape | Vendor Key Personnel returns N/A despite filled data (verify shape first — may be FE) |
| 91 | Email | Vendor PM never receives invitation email |
| 93 | Email copy | Project Manager invite email — body wording |
| 94 | Email copy | Registration Confirmation — subject + body |
| 95 | **Data leak (CRITICAL)** | PM under Zenith sees Keembody's contracts with other suppliers |
| 96 | **Data leak** | MSA upload step shows a doc from an unrelated earlier contract |
