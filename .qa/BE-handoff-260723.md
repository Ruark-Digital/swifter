# BE Handoff — SwiftPro (from FE QA, 2026-07-23, updated 2026-07-27)

Items the frontend traced to the backend during QA reviews. Each was reproduced in-app and verified against the FE code (the FE renders whatever the API returns — no client-side logic is producing these). Spec reference: `docs.json` v2.3.0.

**2026-07-27 update:** Client re-flagged items 230–238 (in doc tab 2) as still not fixed. Status per this handoff (verified against `docs (1).json`, 2026-07-27; re-verified against fresh `docs.json` drop later same day — v2.3.0, 661 paths, 130 schemas — no additional open items resolved beyond what's listed below):

| # | Status |
|---|--------|
| 230 | **Open** (§11) — comment click-to-location. `/file-comment/{fileId}` response still only carries `{author,text,date}`; no anchor persisted. FE+BE work needed. |
| 231 | **Client-struck** — Ctrl+F arrow navigation on redlined document. Closed. |
| 232 | ✅ **RESOLVED 2026-07-27** — `GET .../ai/redline-suggestions` now exists (BE). FE follow-up: load persisted before regenerating. |
| 233 | **Client-struck** — click redline in document to open side-tab. Closed. |
| 234 | **Open** (§12) — Apply Conservative/Balanced/Minimal. No batch-apply endpoint in spec. |
| 235 | ✅ **RESOLVED 2026-07-27** — `progress.addressedCount` / `progress.resolvedCount` returned by `GET .../ai/redline-suggestions`. FE follow-up: render from GET. |
| 236 | **Open** (§6) — Undo. `RedlineUndoRequest` schema still exists but no path references it. |
| 237 | ✅ **RESOLVED 2026-07-27** — per-suggestion `resolution.{status,action,tier,resolvedBy}` returned by `GET .../ai/redline-suggestions` enables resume. FE follow-up: rehydrate. |
| 238 | **Open** (§8) — version lifecycle still undefined; only `/file/versions/{docName}` exists. |

---

## 1. Deliverable flagged "late" when submitted ON the due date (QA #220) — ✅ RESOLVED 2026-07-27

- **Status:** Verified against latest API docs and reproduced clean in-app. BE now computes `kpiDays`/`kpiText`/`kpiStatus`/`submissionStatus` with `submittedAt > dueDate` at day granularity — on-time submissions no longer flag as "late". No FE change required (FE already renders the server-computed `KPIDetail` verbatim).

---

## 2. Approver "Assigned Approvals" count differs between list and detail (QA #229)

- **Where:** Contract → Approvers tab.
- **Observed:** In the **list**, an approver (e.g. "Lancaster Cole August Mcgowan") shows **Assigned Approvals = 0/0**. Opening **View** on the same approver shows **Assigned Approval = 0/1**.
- **Root cause:** two endpoints return different counts for the same approver:
  - **List** endpoint (contract approvers list) returns `assignedApprovals: "0/0"` (a pre-formatted string). FE renders it verbatim (`ApproversTabContent.tsx:72`, `ApproversTable.tsx:480`).
  - **Detail** endpoint (approver detail) returns `assignedApproval: { completed: 0, total: 1 }` → FE shows "0/1" (`ApproversTable.tsx:196-201`).
- **Expected:** the list's `assignedApprovals` string should match the detail's `completed/total`. The `0/1` (this approver is assigned to 1 pending approval) looks correct; the list's `0/0` denominator looks wrong.
- **FE evidence (not FE):** FE cannot reconcile — the list endpoint doesn't return the completed/total breakdown, only the string. Fix must make the list count consistent with the detail.
- **Ask:** Make the list endpoint compute `assignedApprovals` the same way as the detail (or return `{completed,total}` so both surfaces agree).

---

## 3. "Current Balance" value is incorrect on Payment Summary (QA #239, value half) — ✅ RESOLVED 2026-07-24 (per client)

- **Where:** Contract → Payment Summary → Current Balance (and Billed Till Date).
- **Context:** FE already fixed the *visibility* half of #239 — Billed Till Date + Current Balance now show for Vendor PM / other roles, not just CM/PL (they read `contract.billedAmount` / `contract.currentBalance` from the contract-detail response). The reviewer separately flagged the **value** as wrong.
- **Ask (two parts):**
  1. Confirm the **`currentBalance` calculation** is correct on the contract-detail payload (reviewer reports it's off).
  2. Confirm the **vendor / project-manager** contract-detail payload actually includes `billedAmount` and `currentBalance` — the FE now renders them for those roles, but we could not verify the fields are present in the PM/vendor response (API probe returned 401 for our token). If absent, they'll show `CA$0` for those roles until the BE includes them.
- **Note:** MSA Payment Summary has no billed/balance fields at all (contract-only feature). If parity is wanted on MSA, that needs BE support first.

---

## 4. `docs.json` typo — 3 manager MSA paths use singular `msa-contract` (spec fix — STILL WRONG in 2026-07-23 drop)

Three manager MSA endpoints use `/manager/msa-contract/...` (singular) but every other MSA path (**291** of them, incl. the vendor twin of the same security feature and the working bulk approve) uses `/manager/msa-contracts/...` (plural). The FE deliberately calls `/msa-contracts/`.

**Update (2026-07-23 spec drop):** the earlier `/manager/msa/...` form was corrected — but to the **wrong** spelling: it's now `/manager/msa-contract/` (singular, still no trailing `s`) rather than the canonical plural. Please correct again (and confirm the routes are mounted under `/msa-contracts/`):

| In docs.json (still-wrong, 07-23) | Should be |
|---|---|
| `PATCH /manager/msa-contract/{contractId}/compliance/security/{securityItemId}/approve` | `PATCH /manager/msa-contracts/{contractId}/compliance/security/{securityItemId}/approve` |
| `POST /manager/msa-contract/{contractId}/approvers/add` | `POST /manager/msa-contracts/{contractId}/approvers/add` |
| `PATCH /manager/msa-contract/{contractId}/approvers/{groupId}/manage` | `PATCH /manager/msa-contracts/{contractId}/approvers/{groupId}/manage` |

---

## 5. AI redline suggestions regenerate on every open (QA #232) — ✅ BE RESOLVED 2026-07-27

- **BE status:** `GET /{manager|vendor}/{contracts|msa-contracts}/{contractId}/ai/redline-suggestions` now exists and returns `{ data: { suggestions: RedlineSuggestion[], progress } }`. Each `RedlineSuggestion` carries `redlineId` and `resolution.{status,action,tier,resolvedBy}`.
- **FE follow-up (open):** on Redline tab open, GET persisted suggestions first; only call the POST generate endpoint when the array is empty OR on an explicit "Regenerate" action. Currently the FE auto-generates on open (`CollaborationToolPage/index.tsx:520`). This is the fix for QA #232, #237, and #235 in one round-trip — see §7 and §13.

---

## 6. Undo an applied/dismissed redline suggestion — schema exists, no endpoint (QA #236)

- **Where:** Collaboration editor → redline suggestions (after Apply/Dismiss).
- **Observed / asked:** no way to reverse a suggestion once applied or dismissed.
- **Root cause (BE gap):** docs.json v2.3.0 **defines a `RedlineUndoRequest` schema** (`{ docName, baseVersionId }`) — the intent is clearly a document-version restore — **but no endpoint references it.** There is no `/undo` (or equivalent) path, and the `resolve` endpoint's `RedlineResolutionRequest.action` enum is only `accepted|modified|rejected` (no reopen/undo).
- **Why FE can't do it alone:** the FE `resolve` call is **audit-only** (`useRedlineTurn.ts:115` — "records who resolved a suggestion and how. Does NOT mutate the document"); the actual apply/dismiss is a client-side Yjs edit. Undo via `baseVersionId` is a server-side version restore that must be authoritative for the manager↔vendor negotiation — client state can't own it.
- **Ask:** wire an endpoint (e.g. `POST .../redline-turn/undo` or `.../ai/redline-suggestions/{redlineId}/undo`) that consumes the already-defined `RedlineUndoRequest`. Then the FE can offer Undo.

---

## 7. Save redline progress / resume a session (QA #237) — ✅ BE RESOLVED 2026-07-27

- **BE status:** GET `.../ai/redline-suggestions` returns per-suggestion `resolution.{status,action,tier,resolvedBy}` — enough to rehydrate a partially-worked session.
- **FE follow-up (open):** rehydrate the redline panel from the GET response on tab open (part of the same §5 fix). No additional BE work.

## 8. Define how document "versions" work (QA #238)

- **Where:** Collaboration editor → Versions / Version History.
- **State:** `GET /file/versions/{docName}` is the **only** version endpoint. Versions are auto-created server-side (`source: upload|collab`, `snapshotKind: full|delta`); the FE lists them and has a Restore button. **But** restore is client-side `setSnapshot`, and the FE only has snapshots for in-memory (current-session) versions — **BE-fetched historical versions carry no applyable snapshot**, so their Restore can't actually apply (see `index.tsx` version-merge comment).
- **Open design questions (product + BE):**
  1. When is a version cut? (autosave cadence, on redline finalize, manual "save version"?)
  2. How does restoring a **server** version work — does the BE return the snapshot bytes, or is there a restore endpoint? (Currently only in-session snapshots restore.)
  3. How do versions relate to the redline `baseVersionId` (optimistic concurrency in `RedlineResolutionRequest`/`RedlineUndoRequest`)?
- **Ask:** define the version lifecycle, then expose whatever the FE needs (likely: version rows that carry/serve a restorable snapshot, and a documented create/restore contract). This is a design item, not a quick fix.

---

## 9. Company admin can't amend an EXPIRED contract — role gap (QA #112)

- **Where:** Contract detail → Amendments tab (expired contract), company-admin user.
- **FE state:** shipped (`10c8877eb`) — company admin now sees an enabled Create Amendment button on an expired contract/MSA (Amendments tab only; every other tab stays frozen).
- **BE gap (contract):** `POST /manager/contracts/{contractId}/amendments` allowed roles were `['contract_manager','procurement']` — **missing `company_admin`**, so company admin **403s** on contract amendments. **MSA already allows it** (`POST /manager/msa-contracts/{id}/amendments` includes `company_admin`), so MSA works end-to-end. (Spec doesn't expose role lists, so please confirm current state.)
- **Also confirm:** does an approved **time-impact** amendment flip the contract status back `expired` → `active`? (Unknown from spec; needed for the feature to actually "extend" the contract.) `super_admin` is intentionally excluded (not in the roles).
- **Ask:** add `company_admin` to the contract amendments POST roles; confirm the expired→active transition.

---

## 11. Comments — click a comment to jump to its document location (QA #230)

- **Where:** Collaboration editor → Comments tab / sidebar. Clicking a comment should scroll the document to the anchored text and highlight it.
- **FE state (partial):** [CommentsTab.tsx:76-90](src/pages/CollaborationToolPage/components/CommentsTab.tsx:76) already wires click-to-focus **when** the comment carries an `anchorCommentId` (SuperDoc entity) or `redlineId` (legacy mark). Un-anchored comments are non-interactive by design — there's nothing to scroll to.
- **BE gap:** comments authored from the sidebar without a text selection are stored without any anchor. Even comments authored with a selection can lose their anchor round-trip if the persisted payload doesn't carry the `commentId` back — the FE has no way to reconstruct a document range from message text alone.
- **Ask (both sides needed):**
  1. **BE:** persist and return an anchor for every comment (either the SuperDoc `commentId` covering the selection, or a text range `{from,to}` in the current base version). Without this the FE cannot scroll anywhere.
  2. **FE (once BE returns anchors):** treat every comment as clickable — if we have an anchor, scroll to it; if not, disable the click affordance rather than showing a dead pointer.
- **2026-07-27 note:** the fresh `docs.json` drop adds an **optional `location: string`** to `POST /file-comment/{fileId}` (example `"A101"`, description "Optional location of the comment"), but the GET response still returns only `{author,text,date}` — `location` is not read back, so it is still not usable as a document-range anchor. #230 remains open.
- **Related:** existing memory hubs [[project_collab_comments_polish]], [[project_file_comment_api_shape]].

---

## 12. "Apply Conservative / Balanced / Minimal" must write suggestions into the document (QA #234)

- **Where:** Collaboration editor → AI Polish → Apply Conservative / Balanced / Minimal buttons.
- **Observed:** Clicking Apply does not insert the suggested text into the document — the button appears to complete but no document edit happens.
- **Root cause (BE gap):** batch "apply" is not a persisted server action — the individual `resolve/{redlineId}` endpoint is audit-only (records who resolved what; does NOT mutate the Yjs document — see §5 and §6). The client-side Yjs edit that actually inserts text has to run per suggestion, and it can only run against suggestions the client can see. Once a resolve is persisted server-side, the document mutation needs to happen authoritatively so both parties see it.
- **Ask:** define a server-authoritative "apply batch" action that (a) marks each suggestion in the batch as resolved with its accept/modify decision, and (b) emits the document mutations (via Yjs update or version snapshot) so both parties converge on the same document state. Depends on the same persisted-suggestion endpoint requested in §5.

---

## 13. Redline turn — "XX Addressed" and "XX Resolved" counts (QA #235) — ✅ BE RESOLVED 2026-07-27

- **BE status:** GET `.../ai/redline-suggestions` returns `data.progress` with `addressedCount`, `resolvedCount` (plus `total`, `pending`, `resolvedByManager`, `resolvedByVendor`).
- **FE follow-up (open):** render the panel-header counts directly from `data.progress` after the same GET call in §5. No additional BE work.

---

### Summary for triage

| # | Area | Type | FE action | BE action |
|---|------|------|-----------|-----------|
| 220 | Deliverable late status | Bug | none (renders BE status) | ✅ resolved 2026-07-27 |
| 229 | Approver count list≠detail | Bug | none (renders each endpoint) | make list count match detail |
| 239 | Current Balance value | Bug | visibility fixed (`2168f2925`) | fix currentBalance calc; confirm PM/vendor payload carries billed/balance |
| 230 | Comment click-to-location | Missing anchor data | scroll wired for anchored comments; needs anchor from BE | persist + return per-comment anchor (SuperDoc `commentId` or `{from,to}`) |
| 232 | AI redline regenerates on open | Missing endpoint | **FE: load persisted from GET before generating** | ✅ resolved 2026-07-27 (`GET .../ai/redline-suggestions`) |
| 234 | Apply Conservative/Balanced/Minimal writes to doc | Missing server-authoritative apply | none possible yet | server-authoritative batch apply that persists + mutates doc for both parties |
| 235 | Addressed / Resolved counts | Missing read state | **FE: render from `data.progress`** | ✅ resolved 2026-07-27 (`progress.addressedCount`/`resolvedCount` in GET) |
| 236 | Undo applied/dismissed redline | Missing endpoint | none possible yet | wire an undo endpoint consuming `RedlineUndoRequest` (schema exists, unused); FE will add Undo |
| 237 | Save/resume redline progress | Missing read state | **FE: rehydrate from GET** | ✅ resolved 2026-07-27 (per-suggestion `resolution` in GET) |
| 238 | Define how versions work | Design + BE | UI exists; restore of BE versions can't apply | define version lifecycle; serve restorable snapshots for historical versions |
| — | `/manager/msa-contract/*` paths | Spec typo | uses `/msa-contracts/` | correct singular→plural + confirm mount |
| 231 | Ctrl+F arrow navigation on redlined document | **Client-struck** | — | — |
| 233 | Click redline in document to open side-tab | **Client-struck** | — | — |
