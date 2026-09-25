# SwiftPro Contract Test Document — feedback triage (extracted 2026-09-25)

Source: `Swiftpro_Contract_Test_Document.docx` (uploaded 2026-09-25). Same running
document as `FEEDBACK-260921-itemized.md`, now extended to **#93**. Items 1–61 are
unchanged from that triage (status refreshed below); this file focuses on the new
**#62–#93** batch.

Legend: **✅ shipped this session** · **🟢 FE-actionable (new)** · **🟡 FE, needs
repro / BE field** · **🔵 BE-owned** · **🤖 AI-assistant / AI-analysis owned**

---

## Status of earlier items (1–61) — shipped this session

| Item | Status |
|------|--------|
| #48 role distribution ≠ 100% | ✅ `85048d9` (largest-remainder apportionment) |
| #46 "Missed Approvals" static | ✅ `85048d9` (row removed) |
| #59 "Top 10" change-order-impact badge | ✅ `85048d9` (removed) |
| #37 LEM resubmit retains attachments | ✅ `7e6d4b6` |
| #50 System Log search box | ✅ PR #576 |
| #51 admin "Remove" 404 (`/delete/` → `/admins/`) | ✅ PR #577 |
| #52 super-admin data export fails | ✅ PR #578 (handles sync file + async job) |
| #54 solicitation Q/response time (UTC→local) | ✅ PR #579 |
| #60 action-log time zone | ✅ PR #579 |
| #57 CM-created CO → Vendor PM first-approve | ✅ PR #581 (BE `pm-approve` wired) |
| "no alert that submission is pending approval" (+#10) | ✅ PR #583 (pending approvals now surface at 0 days, with approver name) |
| RFI delete-button placement / retain-on-edit (#12/#13), Company-caused Delay, "Enter no. of days" | ✅ already on branch (earlier rounds) — re-reported against a pre-deploy build |
| #41/#42 Projects & Linked-Contracts filters, #44 MSA clickable, #43 "Published" badge | ✅ shipped earlier (`2caf497`/`ec8b4bb`/`fec5e72`/`b15eb32`) |

Still-open from 1–61 that remain **BE / AI / needs-repro** (unchanged verdicts):
email content (intro), KPI all-time avg, #162 KPI page, capitalize names in alerts,
RFI issued/received counts (#34), Current Balance vs Remaining (#/56), vendor-report
visibility, committed-vs-actual AI, #22 events, #24 declined count, #25/#26 RFP-doc
removal/draft persistence, portfolio math (#27–#29), #30/#39 day-count, #31 stale CO
alert, #33 combination sub-types (needs BE field), #35 draft general update, #36 My
Contracts filter, #38/#61 bond general updates, #40/#45 evaluator reminder (client
partly retracted), #47 redline order (superdoc engine), #49 system-log dedup, #53
completed action items, #55 question-reply visibility, #58 CO numbering.

---

## New batch (62–93)

### 🟢 FE-actionable (new work in this repo)

| # | Item | Notes / likely location |
|---|------|-------------------------|
| **62** | MSAs not clickable | #44 made the main MSA list clickable (`fec5e72`); this is a *different* MSA surface (portfolio / business-division / linked list). Find the non-linked MSA name cell and route to the MSA detail page. Needs a quick locate. |
| **63** | Add search + filter bar to contracts under a Business Division | Add a `SearchInput` (+ status/name filter) to the Business-Division contracts list, same pattern as Admin Management / the System Log search just shipped. |
| **64** | Grayed placeholder "Search contract" → "Search Business Division" | Surgical copy change on that search input's `placeholder`. |
| **65** | Evaluation-criteria description wraps instead of horizontal scroll | CSS: drop `whitespace-nowrap`/overflow-x on that cell, allow `break-words`/wrap. Evaluation criteria table/list. |
| **72** | Rename a value label to "Current Contract Value" (align with financials) | Copy change; confirm which card/label from context (screenshot referenced). |
| **83** | Add "Awarded" to status filter — All / My Solicitation | Add the option to the solicitation status-filter list. |
| **84** | Add "All" to status filter — All / My / Assigned Evaluation (all profiles) | Add an "All" (clear) option to the evaluation status filter. |
| **82** | Remove modules from **MSA** across all profiles: Deliverables (incl. create-MSA + analytics), LEM, Claims, RFI, NCR Log, Vendors Report, Invoice; Payment Summary → remove Payment Structure, Holdback, Holdback Amount, Holdback Released | **Large FE task** (gate/hide MSA tabs + create-MSA steps + analytics + payment-summary rows). Client flagged it as tentative — "if this will be a problem, hold on and discuss Sunday." **Recommend confirming scope before building.** |
| **93** | Consensus indicator: a 3-point differential is 20% of the scale, not an absolute 3 | If the consensus threshold is computed FE-side, change it to a % of the scoring scale. Verify whether the threshold is FE or BE first. |

### 🟡 FE-actionable but needs a repro / BE confirmation

| # | Item | Why |
|---|------|-----|
| **66** | "Amend" pricing keeps *adding* to previous pricing; Unit of Measurement not retained | Likely an FE form-accumulation bug (previous items not replaced on amend) + a dropped UoM field. Needs the shared video / a repro to pin the exact dialog. |
| **67** | Amended doc shows "NA" — should show "Pricing" | FE label mapping for amended-doc type, or BE not tagging the amendment. Verify where "NA" is rendered. |
| **89** | New View-Only user can't complete registration | Onboarding flow — could be FE stage-gating or BE. Needs repro (mirrors the earlier #284 vendor-registration class). |
| **90** | Evaluation start/end **time** not saved on edit | Edit form may omit the time portion, or BE ignores it. Check the evaluation edit payload. |
| **91** | PM "request to take over a contract" returns a red flag | `vendorApi.requestContractTakeOver` posts to `/contract/vendor/contracts/{id}/project-managers/{pmId}/assign`. Verify the endpoint/params vs BE (could be a wrong-URL bug like #51). |
| **92** | Eval/scoring reminder link (My Action) → error page | Bad route/id in the my-action deep link. Check the reminder link builder (mirrors #85's `PJTMC…` id-vs-_id class). |

### 🔵 BE-owned (data / logic / lifecycle / email)

| # | Item |
|---|------|
| **68** | Submission deadline in 2 days but vendor action item says 3 — day-count off (BE action-item generation). |
| **69** | Super-Admin company-activity axis (Mon–Sun) static across 12m/6m/3m/30d/7d filters — BE not honoring the range. |
| **70 / 73** | One Addendum but Alerts show two — BE alert count/dedup. |
| **71** | Add PM action item for due deliverables (+ disappear on submit, re-add on reject) and **email** reminders — BE action-items + email. |
| **74** | PM closed an RFI but the action log recorded "PM reply to RFI" — BE action labeling. |
| **75** | LEM was rejected but alert says "pending his approval" (the PM must resubmit) — BE alert logic. |
| **81** | Remove "savings" general updates from Vendor / Vendor-PM accounts only — BE general-update visibility by role. |
| **86** | Upcoming-contract-expiry alert missing — payload ships `expiryAlert: null`; BE not emitting it. |

### 🤖 AI-assistant / AI-analysis owned

| # | Item |
|---|------|
| **76** | AI found only 1 of 2 portfolio NCRs (should fetch all regardless of status). |
| **78** | AI can't surface change orders in the portfolio. |
| **79** | AI can't total contracts by Project / Business Division. |
| **80** | Optimize AI to provide MSAs/contracts/projects by business division (values, summary, analytics). |
| **85** | AI "Spent vs Commitment" doesn't match the portfolio's committed-vs-actual. |
| **87** | AI wrong combined-contract-value-by-vendor. |
| **88** | AI can't count contracts by CM / identify the top CM. |

(These are the AI-assistant retrieval/analysis backend — not FE.)

---

## Recommended FE order (quick wins first)

1. **Copy/one-liners:** #64, #72, #83, #84 — trivial, high-confidence.
2. **Small UI:** #65 (text wrap), #63 (search bar), #62 (make the remaining MSA list clickable).
3. **Needs-repro FE bugs:** #91, #92 (likely wrong-URL/bad-link, same class as #51/#85), then #90, #66/#67, #89.
4. **#82 (MSA module removal)** — confirm scope with the client first (they offered to discuss); it touches many MSA surfaces.
5. **#93** — confirm whether the consensus threshold is FE or BE before changing.

Everything under 🔵/🤖 goes to the BE/AI worklist.
