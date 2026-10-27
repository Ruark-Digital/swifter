# SwiftPro Contract Test Document — feedback triage (extracted 2026-09-21)

Source: `Swiftpro_Contract_Test_Document.docx` (uploaded 2026-09-21). Itemized by
the doc's own numbering (numbered items 22–61 plus an unnumbered intro cluster).
Struck-through paragraphs = client-closed and excluded from the work-list.

This round pairs with an updated Swagger export (`docs.json`, "SwiftPro REST API
Docs" v2.3.0) from the BE team — see **Swagger sync** at the bottom.

## Headline

Most of this document's FE-actionable items were **already shipped** on
`fix/phase2-bug-fixes` in earlier QA rounds; the client appears to have tested a
build that predates the deploy (every re-reported item below is present and
correct in the current branch). The genuinely-unaddressed FE work was three
dashboard items, now fixed. Everything else is backend / AI / data-owned.

- **Struck (client-closed):** draft-solicitation upload, "clicking contracts"
  acknowledgement, LEM-resubmission attachment, "Company-caused Delay" claim
  type, "Enter no. of days" label.
- **Fixed this round (FE):** #48, #46, #59, #37.
- **Already shipped on this branch (re-reported, needs deploy/re-test):** RFI
  delete-button placement, RFI edit attachment retention (contract + MSA),
  Company-caused Delay, Enter no. of days, contracts/MSA Export (#32), MSA
  clickable (#44), Projects & Linked-Contracts filters (#41/#42), Analytics
  "Published" badge (#43).
- **Backend / AI / data-owned:** the rest.

---

## Fixed this round — commit `85048d9`

| # | Item | Fix | Where |
|---|------|-----|-------|
| **48** | Super-admin role distribution doesn't add up to 100% | The donut legend renders `percentage ?? value`; the role-distribution transforms attached **no** percentage, so raw counts rendered as "%". Now apportioned with largest-remainder (same fix class as #260's subscription donut), so it always totals 100. Company-admin variant had the classic independent-`Math.round` 33+33+33=99 drift — also switched to apportionment. Unit tests added. | `src/lib/dashboardDataTransformer.ts` (`transformRoleDistribution`, `transformCompanyRoleDistribution`) |
| **46** | "Missed Approvals" static; remove or rename to "Pending Approvals" | The value is BE-supplied and never changes; there is no portfolio-wide pending-approvals figure in the FE to repurpose it into (that's a BE add). Per the client's explicit fallback ("just remove completely"), the row is dropped. | `src/components/layouts/RoleBasedDashboard/analytics/ComplianceStatusCard.tsx` |
| **59** | Remove the "Top 10" badge on Change Orders Impact — not required here | Removed the decorative `Top 10` badge from the card header. | `src/components/layouts/RoleBasedDashboard/analytics/ChangeOrdersImpactCard.tsx` |
| **37** | Previous attachment not retained when editing/resubmitting LEM | The deliverable `/submit` payload already ships `files: [{name,url,type,size}]` — the exact shape of `detail.files` — so the RFI #13 retain/remove pattern applies. `SubmitDeliverableDialog` now shows the rejected submission's files as "Previously attached" (keep/remove), and merges kept + newly-uploaded files (deduped) into the resubmission payload. | `src/pages/ContractManagementPage/components/DeliverablesTable.tsx` |

---

## Already shipped on this branch — re-reported, needs deploy + client re-test

These are present and correct in the current `fix/phase2-bug-fixes` HEAD; no new
work required. If the client still sees them, the deployed build is behind.

| Item | Evidence in branch |
|------|--------------------|
| RFI delete button crammed beside the description → move below | `RfiTabContent.tsx` `FileListItem` + edit list render the Remove control on its own line under a `border-t` divider (comment: QA #12). Same in `MsaPage/layouts/Rfi.tsx`. |
| Previously-attached document(s) not retained when editing RFI | `RfiTabContent.tsx` tracks `removedExistingKeys`, shows a "Previously attached" section, and merges kept + newly-uploaded files on PATCH (comment: QA #13). Same in MSA RFI. |
| "Company-caused Delay" claim type | `RequestClaimDialog.tsx` — option present. |
| Create claim "Enter date" → "Enter no. of days" | `RequestClaimDialog.tsx` / `AmendmentsTabContent.tsx` — placeholder already "Enter no. of days". |
| **#32** Export all contracts info (+ MSA) | `ExportContractsButton` wired to the BE's new `/contract/manager/contracts/export` and `/contract/manager/msa-contracts/export` (approver variants too), PDF/DOCX, full result set (not just current page). See Swagger sync. |
| **#44** Make MSAs clickable like contracts | Shipped `fec5e72`. |
| **#41** Projects filter disappears / can't reset | Shipped `2caf497` (keep filters usable when a filter returns zero rows). |
| **#42** Linked-Contracts filters not working | Shipped `ec8b4bb` (apply Date & Status filters on Linked Contracts tab). |
| **#43** Analytics badge "Publish" → "Published" | Shipped `b15eb32` (Analytics status badge). Note: #43's broader ask — every contract flips to "Published" the moment it's fully approved — is a status-lifecycle concern owned by BE. |

---

## Backend / AI / data-owned (not FE-actionable in this repo)

| # | Item | Why BE/AI |
|---|------|-----------|
| intro | Vendor deadline email content mixed up (PL-review text sent to vendor); reminder cadence | Email templates + recipient/trigger logic — BE. |
| intro | KPI all-time Avg Score not updating on 2nd update | Aggregation — BE. |
| intro | #162 KPI update page still disappearing | Needs repro; if a client crash, revisit — otherwise BE state. |
| intro | Capitalize users' first/last names in alerts & recommended actions | Names are embedded inside BE-constructed alert/recommended-action strings; FE regex title-casing would mangle other words. BE should format at source. |
| intro | No alert that "Claim submission is pending X's approval" | Alert generation — BE. |
| intro | Alert lifecycle: deliverable submitted/under review — when does the alert clear? | Alert lifecycle — BE. |
| intro | RFI Issued vs Received inaccurate on approver profile (shows 2 issued for 1) | Stat counting — BE (mirrors #34). |
| intro | "Current Balance" (payment summary) ≠ "Remaining" (invoice) | Financial calc — BE. |
| intro | Vendor report submission not visible on PM side | Visibility/data — BE. |
| intro | Scroll through all document pages instead of "next" | Document-viewer paging UX; large, needs product scoping + viewer capability — deferred (not a defect). |
| intro | CAPA submitted → NCR action item should disappear; same for holdback invoice | Action-item lifecycle — BE. |
| intro | Preview/download of contract & solicitation docs failing (red flag) | Needs repro; likely doc-service/BE. |
| intro | Time/date of submitted question incorrect (8:44 PM) | Timezone — BE. |
| intro | Committed Spend vs Actual (AI) totally off | AI/data — BE. |
| 22 | Solicitation pre-bid events don't show on the overview | Overview data surface — BE (no FE field). |
| 23 | Solicitation filter by dates doesn't work *(partial-struck)* | Partly closed by client; residual is BE date-filter support. |
| 24 | "Declined" count in proposal-submission chart shows 0 | Bid-intent counts — BE (see prior #24-class items). |
| 25 | Can't remove RFP-migrated documents when creating a contract from an awarded solicitation | Needs repro against current Create-Contract flow; migrated-doc removal + persistence is BE-backed. Candidate for a follow-up FE pass once repro'd. |
| 26 | RFP docs vanish after saving contract as draft | Draft persistence — BE. |
| 27/29 | Portfolio value dropped $108M→$100M | Portfolio calc — BE. |
| 28 | Contract value CA$12.2M → CA$214k, budget 3088% | Data integrity — BE. |
| 29 | "Resolved" should default to 0 (Addressed vs Resolved semantics) | Status semantics — BE. |
| 30 | "Due in 3 days" but alert says 4 | Date math — BE. |
| 31 | Stale change-order "approved" alert; alerts should expire (~1 month) | Alert lifecycle — BE. |
| 33 | "Combination" contract type — allow selecting any combination of other types | Needs a multi-select sub-field **and** a BE payload field to carry the chosen sub-types; can't be sent today. Needs BE coordination. |
| 34 | RFI type no longer shows Issued/Received; cards both 0 (user-agnostic) | Stats — BE. |
| 35 | Misleading general update on a draft contract | General-update generation — BE. |
| 36 | Other CMs' contracts appear under "My Contracts" (one account only) | Account-scoped data — BE. |
| 37 | Previous attachment not retained when editing **LEM** | **Fixed this round (FE)** — see the "Fixed this round" table. |
| 38 | No general update for submitted Labour & Material Bond | Update capture — BE. |
| 39 | Days-left still wrong; alert should flip submission→approval, retrigger on reject | Alert lifecycle + date math — BE. |
| 40 | "Remind evaluators" no longer available | See #45 — client clarified it still exists (visible only when the evaluator is pending/not-started). No FE change; confirm placement with client. |
| 45 | (clarifies #40) "Remind" exists, only shows for not-started/pending evaluators | Not-a-bug per client. |
| 47 | Redline suggestions not in sequential (top-to-bottom) order | Suggestion ordering lives in the redline/superdoc engine (`superdoc-swiftpro`), not this repo — BE/engine. |
| 49 | Action repeated in System Log | Dedup — BE. |
| 50 | Add System Log filters (date, performer name, company) | FE page sends a `search` param but has no filter UI; date/name/company filtering needs BE query params to exist first. Deferred pending BE contract. |
| 51 | Super-admin Admin Management: user ID, "Delete User" no-op, blank company name | Needs repro; delete + company hydration likely BE. |
| 52 | Super-admin data export failed | Needs repro; export endpoint — BE. |
| 53 | Completed action items still listed | Action-item lifecycle — BE. |
| 54 | Solicitation-question response time off (10:58 PM EST shows 2:58) | Timezone — BE. |
| 55 | Direct reply to asking vendor should be visible only to that vendor | Visibility rules — BE. |
| 56 | Released holdback subtracted from contract value / current balance wrong | Financial calc — BE. |
| 57 | CM-created Change Order not routed for approval (Vendor PM first) | Approval workflow — BE. |
| 58 | Duplicate Change Order numbers; numbering shouldn't depend on status | Numbering sequence — BE. |
| 60 | Action-log timestamps wrong (general updates are correct) | Timezone/log timing — BE. |
| 61 | No general update for approved Performance Bond | Update capture — BE. |

---

## Swagger sync (`docs.json` v2.3.0 — BE team's update)

Chosen scope: **sync the FE to the changes it consumes** (not replace the
checked-in `swagger.json`). Findings:

- **Contracts export (new BE feature)** — `/manager/contracts/export`,
  `/manager/msa-contracts/export` and the `approver/*` variants stream a full
  PDF (default) or DOCX of every matching Contract + MSA, with optional
  `exportType, status, category, date, search, name` filters and pagination
  intentionally ignored. **FE already consumes this** via `ExportContractsButton`
  (passes `exportType` + active `status`), wired on both the Contracts list and
  MSA list. This resolves **#32**. Not yet surfaced FE-side: the `category`,
  `date`, `search`, `name` filter params (the button only forwards `status`) —
  a future enhancement if the client wants filtered exports from the list UI.
- **RFI create/update DTO** — the spec adds a `responders` array alias
  (max 1 item) for `responder`; "when both are supplied `responders[0]` wins."
  The FE sends the singular `responder`, which the spec still accepts, so
  **no change required**. `ContractRfiDTO` remains compatible.
- **RFI stats** — `ContractRfiStats` exposes `all / issue / receive`; the FE
  reads `stats.total ?? totalCount`, `stats.issue`, `stats.receive`
  (`RfiTabContent.tsx`). Compatible. The client's #34 (cards showing 0) is the
  BE returning issuer/receiver-scoped zeros, not an FE shape mismatch.

Net: no FE code change was required for the Swagger update — the consumed
surfaces (export, RFI) were already synced in prior work.

---

## Verification

- `npx tsc -b` — clean.
- `npx vitest run` on the transformer + analytics empty-state suites — 34 passing
  (incl. 2 new #48 apportionment tests).
- `npx eslint` on all changed files — clean.
