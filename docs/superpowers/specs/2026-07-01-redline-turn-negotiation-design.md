# Redline Turn-Based Negotiation — Design

**Date:** 2026-07-01
**Status:** Approved for planning
**Supersedes:** the 2026-06-14 design session's CM+PM synchronized "both must approve" gate for AI Polish redlines. That session never produced a written spec file (design/spec-only work, deferred pending a backend API that never arrived) — its intent is fully replaced by this document.

## Background

The client's 2026-06-21 QA review recording (`C:\Users\HomePC\Downloads\Swiftpro review - 20260621 2058 WAT - Recording.mp4`, transcript `[01:01:42]-[01:06:04]`) describes how contract redline negotiation should actually work in the collaboration tool:

> "...not necessarily that any AI suggestion there needs to be an approval on the two party. So on my side I'll use the AI ... I can accept or accept with additional modifications. Then I'll push it send it back to the vendor ... until someone makes a final acceptance."

The client's "vendor" in this context is the **PM (`project_manager`) role** — PM acts on the vendor's behalf in-app (confirmed directly by the user during design). Combined with the fact that the Contract Manager and Procurement Lead are "always on the same team, representative of the company," this collapses to a single negotiating pair: **company side (CM/Procurement) ↔ vendor side (PM/Vendor)**, turn by turn, not a synchronized two-person sign-off per suggestion.

## Goals

- Replace the ad-hoc single-actor "apply immediately" AI-suggestion flow with an explicit **turn-based negotiation**: one side acts, then explicitly hands the document to the other side.
- Each side unilaterally accepts, modifies, or rejects AI suggestions (and can make ordinary tracked-change edits) only during its own turn.
- Negotiation ends via an explicit **finalize** action, only available once no redlines remain open.
- Applies uniformly to both **Contract** and **MSA Contract** documents.

## Non-goals

- No new "counter-proposal" API — countering an AI suggestion is just making a new tracked-change edit during your turn (already supported natively by the SuperDoc/Yjs editor).
- No coupling of negotiation finalization to the broader contract lifecycle status (Published/Executed/etc.) — that's a separate, already-gated flow ([project_contract_publish_requires_full_approval_chain]). Left as an open question for the backend team.
- No changes to the comment system — comments remain available regardless of whose turn it is.

## Data model

New `redlineTurn` state on the contract / MSA-contract document:

```ts
type RedlineTurn = {
  holder: "manager" | "vendor";       // "manager" = CM/Procurement, "vendor" = PM/Vendor
  status: "in_progress" | "finalized";
  updatedAt: string;                  // ISO timestamp
  updatedBy: { id: string; name: string; role: string };
};
```

- `holder` starts at `"manager"`; the company side does the initial contract setup and first AI pass, then the first explicit handoff goes to the vendor/PM side.
- `status: "finalized"` is terminal — no further turns once set.

Per-suggestion resolution gains an audit field (existing `pending|approved|dismissed` state is unchanged):

```ts
type SuggestionResolution = {
  action: "accepted" | "modified" | "rejected";
  tier?: "low" | "medium" | "high";   // when action === "modified"
  resolvedBy: { holder: "manager" | "vendor"; userId: string; at: string };
};
```

**Turn-gating rule:** any redline mutation (accept / modify / reject an AI suggestion, or a new tracked-change edit) is permitted only when `redlineTurn.holder` matches the acting user's side. Comments are exempt — always allowed.

**Side mapping** (`useUserRole`):
- Company side (`"manager"`): `isManager` (`contract_manager` or `procurement`)
- Vendor side (`"vendor"`): `isVendor || isProjectManager`
- Everyone else (`approver`, `view_only`, `company_admin`, `super_admin`, `evaluator`): never holds a turn; always read-only with respect to redline actions.

## Backend API contract

New endpoints, following the existing role-prefixed convention used by `ai/redline-suggestions` (`/contract/{role}/{contracts|msa-contracts}/{id}/...`, `role` = `manager|approver|vendor|user`):

| Method | Path suffix | Purpose |
|---|---|---|
| `GET` | `.../redline-turn` | Fetch current `{ holder, status, updatedAt, updatedBy }` |
| `POST` | `.../redline-turn/send` | Hand off turn to the other side. Flips `holder`; triggers email + "My Action" item for the receiving side. `403` if caller's side ≠ current `holder`. |
| `POST` | `.../redline-turn/finalize` | Sets `status: "finalized"`. `400` if any suggestion is still open/unresolved. `403` if caller's side ≠ current `holder`. |
| `POST` | `.../ai/redline-suggestions/{redlineId}/resolve` | Audit-only: `{ action, tier? }`. Records who resolved what. Does **not** mutate the document. |

**Two-layer enforcement (important):** the actual document mutation (`replaceRedline`) happens client-side against the Yjs doc — the backend cannot intercept or block that write (this is a pre-existing architectural constraint, not new to this design). Enforcement is therefore:

1. **FE hard gate:** when it's not the caller's turn, every redline-action control is disabled AND the editor is switched to read-only (`documentMode: "viewing"`) — no client-side path exists to mutate the doc.
2. **BE workflow gate:** `send`, `finalize`, and `resolve` all validate that the caller's side matches the current `holder`, rejecting otherwise — keeping the system-of-record (turn state, audit trail, notifications) authoritative even if the FE gate were bypassed.

## Frontend implementation

### Bridge protocol change (cross-repo)

`superdocBridge.ts`'s `documentMode` (`"editing" | "viewing" | "suggesting"`) is currently sent only once, in the `superdoc:init` payload — there is no existing way to change it after the document loads. This design adds a new host→iframe command:

```ts
{ type: "superdoc:set-mode"; payload: { documentMode: DocumentMode } }
```

The separate SuperDoc editor app (its own repo) must handle this new command by toggling its own edit permissions live, without a reload. This is a cross-repo dependency and must be coordinated with whoever owns that app.

### New hook — `useRedlineTurn({ documentId, isMsa })`

Sibling to `useAiRedlineSuggestions.ts`. Responsibilities:
- `useQuery` wrapping `GET .../redline-turn`
- `sendTurn()` / `finalize()` mutations wrapping the corresponding `POST`s, invalidating the turn query on success
- `mySide: "manager" | "vendor" | null` derived from `useUserRole` per the side mapping above
- `isMyTurn: boolean` = `redlineTurn.holder === mySide`

### `index.tsx` wiring

- On every `isMyTurn` change, send `superdoc:set-mode` (`"editing"`/`"suggesting"` if true, `"viewing"` if false)
- `handleApproveAi` and the reject/dismiss handler gain an `isMyTurn` guard before calling `replaceRedline` (defense-in-depth; buttons are already disabled)
- On successful apply/reject, fire the new `resolve` audit call (fire-and-forget is acceptable; failure shouldn't block the UI since the doc mutation already succeeded)

### `AiSuggestionsPanel.tsx`

New `isMyTurn` prop. Apply/Accept/Reject/Dismiss controls are **disabled** (not hidden) with a tooltip ("Waiting for your turn") when `false`.

### New `TurnBanner` component

Shows "Your turn to review" / "Waiting on {PM/CM}". Contains:
- **"Send to PM/CM"** button — enabled only when `isMyTurn`
- **"Accept & Finalize"** button — enabled only when `isMyTurn` **and** zero pending suggestions remain (reuses the suggestions-list state already tracked for the panel)

### Comments

No changes. `useFileComments.ts` and the comment UI remain turn-independent per the client's implied need for ongoing dialogue regardless of whose turn it is.

## Edge cases

- **Pending suggestions across turn flips:** remain `pending` until that side's turn returns — no special handling needed since only the turn-holder can resolve them.
- **Non-participant roles** (`approver`, `view_only`, `company_admin`, `super_admin`, `evaluator`): `mySide` is `null`, so `isMyTurn` is always `false` — same read-only treatment as a waiting participant.
- **Cross-tab/staleness:** the turn-state query is invalidated on `send`/`finalize` so open tabs converge quickly; no new real-time mechanism beyond existing query-invalidation and Yjs sync patterns.
- **Contract lifecycle coupling:** deliberately **not** addressed here — `redlineTurn.status: "finalized"` does not automatically change the contract's Published/Executed status. Flagged as an open question for the backend team.

## Testing

- Unit: `useRedlineTurn` — correct `mySide`/`isMyTurn` for each role combination
- Unit: `AiSuggestionsPanel` — controls disabled + tooltip shown when `isMyTurn=false`
- Bridge test (extends `superdocBridge.test.ts` pattern): `superdoc:set-mode` command shape
- Manual QA checklist: full CM → PM → CM cycle — send, apply/reject on each turn, commenting while waiting, finalize only enabled at zero pending suggestions

## Related memory

- [[project_redline_turn_negotiation_design_260701]] — session notes and decision log
- [[project_redline_dual_approval_260614]] — superseded prior design
- [[feedback_vendor_role_means_pm_in_transcripts]] — role-mapping clarification that unlocked this design
- [[project_swiftpro_qa_review_recording_260621]] — source transcript
