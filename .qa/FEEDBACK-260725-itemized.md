# SwiftPro Contract Test Document — updated feedback (extracted 2026-07-25)

Source: `~/Downloads/Swiftpro Contract Test Document.docx` — itemized by the doc's own numbering.

- **286** numbered items (was 244 on 260719; numbering is stable, so 1–244 carry over unchanged and 245–286 are appended)
- **243** struck through = client-closed
- **43** open
- **→ 12 are FE-actionable in this repo.** The rest are backend-owned (see `.qa/BE-worklist-260719.md` / `.qa/BE-handoff-260723.md`) and are excluded here.

---

## FE work-list (12 items)

| # | Item | Status | Where |
|---|------|--------|-------|
| **260** | Super Admin dashboard — Subscription distribution percentages don't total 100% | **Confirmed** — each slice is `Math.round()`ed independently, so three equal thirds render 33+33+33=99. Needs largest-remainder apportionment. | `src/lib/dashboardDataTransformer.ts:998` |
| **276** | User Management — show full names, not just first or last | **Confirmed** — cell renders `row.original.firstName` only; `CreateUserDialog` already submits first/middle/last so BE has them. | `src/pages/UserManagementPage/UserManagementPage.tsx:394` |
| **277** | User details — Role shows "User" instead of the specific role | **Confirmed** — `getRoleDisplayName` switch falls to `default: return "User"` when the role value isn't a bare slug (known `_id`-vs-name quirk). | `src/pages/UserManagementPage/components/UserDetailsSheet.tsx:231` |
| **268** | Vendor Management — allow editing vendor email; new address used for later comms + solicitation invites | **Confirmed FE gap** — dialog exposes `secondaryEmails` but no primary `email` field. Confirm the vendor PUT accepts `email` before wiring. | `src/pages/VendorManagementPage/components/EditVendorDialog.tsx:119` |
| **282** | User Management — Admins/Procurement Leads/Evaluators cards redundant for CLM companies; hide for solicitation-only | Module-flag gating (use truthy check, not `=== true`). | `src/pages/UserManagementPage/components/UserStats.tsx` |
| **265** | Company Admin dashboard — move Evaluation directly under Solicitation Management, rename to "Evaluation Management" | Nav order + label only. Keep it scoped — do not remove entries. | nav config |
| **257** | Redline collaboration — side scrollbar reaches bottom while more redlines remain | Scroll containment on the sidebar. | Collaboration sidebar |
| **284** | Vendor registration — stage 3 completes without waiting for document upload | Await the upload promise before advancing/submitting. | `src/pages/OnboardingPage` |
| **280** | CM profile — all default profile-edit fields missing | Likely a role gate on the profile form. | `src/pages/ProfilePage` |
| **273** | Company Admin → My Profile → Company Profile — saved info not retained | Probable hydration/unhydrated-field trap; needs repro. | `src/pages/ProfilePage` |
| **281** | Multiple vendor invite via Excel upload not working | **Needs repro** — could be FE parse/submit or BE. Classify after reproducing. | `CreateVendorDialog` / bulk tab |
| **283** | Combined profiles (PL+CM, Evaluator+Approver) — role switching not working | **Likely already fixed** — multi-role shipped in PR #269; `ac6dbb9de` "share active-role state across all useUserRole call sites" targets exactly this. Re-test before doing new work. | `useUserRole` / `RoleSwitcher` |

## Closed / no work needed

- **#286** — RFP/Solicitation MS Word on-screen review. Client struck it and wrote their own note: *"This is not a bug, its working based on the implementation, the Ms word engine is loading that's why."*
- **#177** — Combined-access users (Evaluator+Approver, PL+CM). Client wrote *"I haven't seen this implemented"*, but BE shipped `roles[]` on 2026-07-24 and the FE shipped in PR #269. Needs client re-test, not new work. Note the restrictive pair-filtering in the Role(s) dropdown is intentional (BE allows only those two pairs) — confirmed not-a-bug on 2026-07-25.

## Excluded as backend-owned (29 items)

Already carried on the BE work-list with verdicts:

- **Email templates/recipients:** 18, 209, 279
- **General-update / my-action / action-log events:** 7, 34, 197, 204, 206, 241, 243, 244
- **Timestamp & timezone:** 75, 105
- **Data/logic:** 90 (filename encoding), 212 (AI-insight counts), 229 (approver counts), 39 (RFI routes to company not Vendor PM)
- **Missing fields/capability (BE blocks FE):** 48, 102, 112, 190, 205, 239
- **Redline persistence — the whole cluster is BE:** 232, 234, 235, 237, 238
- **Reported resolved by BE 2026-07-24 but still unstruck by client (needs re-test):** 200, 239

## Extraction notes

Word auto-numbered list — real numbers come from counting `numId=1`/`ilvl=0` paragraphs only. Struck = all non-empty runs have `w:strike`. Three items are *partially* struck, meaning the client closed part and left a live remainder: **#112** (expanded ask: also allow modifying a *live* contract, logged), **#200** ("Review lem"), **#286** (their not-a-bug note).

---

# Re-export 2026-07-25 19:25 — 291 items

Client re-exported the same doc. **291** numbered items (was 286), **258** struck, **30** open, **3** partial. Open count dropped 43 → 33.

## Client closed since the 286-item export (12)

`34` `39` `102` `209` `239` `260` `265` `268` `273` `276` `277` `279` — this includes every item shipped in this branch (#260, #268, #273, #276, #277) plus #287, so the client has accepted those fixes.

## New items 287–291

| # | Item | Verdict |
|---|------|---------|
| 287 | Super admin → Companies → Subscription Plan — user counts not working | **Closed** — shipped `61238019e`, client struck it |
| 288 | Super Admin → Companies → Admin Management — last names repeating | **Closed** by client |
| 289 | Company Admin — Projects missing from the sidebar | ✅ **SHIPPED** `c4f8ea338` — `company_admin` was the only contract-management role without a Projects entry (`src/lib/navigation.ts`). Added after Evaluation Management, before Contract Management, on the same `contractManagement` flag as `procurement`. |
| 290 | Vendor → General update — RFP question attributed to the wrong vendor | **Closed** by client |
| 291 | Solicitation → Questions — counts inconsistent across PL / asking vendor / other vendors | **Dropped** on the client's instruction — see below |

## FE work — closed 2026-07-26

All on PR **#278** (`fix/phase2-qa260719-fe-only` → `fix/phase2-bug-fixes`).

| # | Item | Outcome |
|---|------|---------|
| **289** | Company Admin — Projects missing from the sidebar | ✅ `c4f8ea338` — `company_admin` was the only contract-management role without a Projects entry. **Browser-verified.** |
| **282** | User Management — Admins/PL/Evaluator cards redundant for CLM companies | ✅ `02e629fbb` — shown only for solicitation-only companies, per the client's second option. |
| **280** | CM profile — all default profile-edit fields missing | ✅ `eb003541a` + `2385331b6` + `55069aba4`. Three causes: `contract_manager` was in no visibility list; so were `project_manager` / `approver` / `view_only`; and `/users/me` returns `role` as a bare slug string, which blanked the Role field. Personal fields now default to every role. **Browser-verified (View Only).** |
| **257** | Redline — scrollbar reaches the bottom with redlines still unread | ✅ `a50f04643` — the AI Polish panel claimed `h-full` while sharing its flex column with the turn banner, overflowing the column by the banner's height into an `overflow-hidden` parent. |
| **284** | Vendor registration — stage 3 completes without waiting for the document upload | ✅ `9da6e39cb` — the upload was always awaited; a *failed* upload was swallowed and registration completed without the documents. Now aborts so the vendor can retry. |
| **286** | Solicitation document on-screen review never opens | ✅ Root cause was in **`superdoc-swiftpro`**, not this repo — `parseHostMessage` dropped any init with an empty `wsUrl`/`token`, which the read-only `DocumentViewer` always sends, so SuperDoc was never constructed and the host waited forever. Fixed there (PRs **#6/#7/#8** → master/dev/staging). Host-side `49c758286` adds a 45s render watchdog as a backstop and stops promising "live collaboration" on a read-only view. **Browser-verified.** |
| **291** | Solicitation Questions — counts inconsistent across profiles | **Dropped** on the client's instruction. Diagnosis retained: the two stat cards use different denominators (`QuestionsTab.tsx:286` counts *unanswered questions*, `:309` counts *reply messages*), and the cross-profile differences are BE-owned. |
| **283** | Combined profiles — role switching | **Closed** — `ac6dbb9de` was the fix; confirmed by the client. |

Also shipped this round, outside the numbered list: **`1d07386db`** removed demo/fallback data from the Dashboard Analytics tab. Eight cards invented figures and vendor names when the API returned nothing (142/145 insurance, `98/34/12` invoice split, "AWS Cloud Services", "BuildCorp Ltd", …); they now render empty states. Maps to already-struck item **#263**.

## Still open, FE-relevant (1)

| # | Item | Status |
|---|------|--------|
| 281 | Multiple vendor invite via Excel upload not working | **Needs a repro** before it can be classified FE or BE. |

## Still open, backend-owned (roll-up, 23)

`7` `18` `48` `75` `90` `105` `112` `177` `190` `197` `200` `204` `205` `206` `212` `229` `232` `234` `235` `237` `238` `241` `243` `244` — all carry verdicts on `.qa/BE-worklist-260719.md` / `.qa/BE-handoff-260723.md`.
