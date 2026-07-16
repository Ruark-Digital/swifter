# Redline collaboration — BE/FE model mismatch (needs alignment)

**Date:** 2026-07-16
**From:** Frontend
**Re:** The shipped redline endpoints implement a different negotiation model than the approved FE design.

> **RESOLVED 2026-07-16** — the BE team subsequently shipped the turn-negotiation endpoints (option 1 below): `redline-turn` GET/send/finalize + `ai/redline-suggestions/{redlineId}/resolve`, for both `contracts` and `msa-contracts`, `manager` and `vendor`. The FE has been implemented against them. This note is retained as the record of the interim divergence.

## TL;DR

The approved FE design is **turn-based negotiation** (`docs/superpowers/specs/2026-07-01-redline-turn-negotiation-design.md`, status: *Approved for planning*). The backend shipped a **dual-acceptance** model instead — which is the *older* design that the approved one explicitly supersedes. None of the endpoints the FE design specified exist. We need to agree on one model before FE work proceeds.

## What the FE design expects (not present in the spec)

Role-prefixed under `/contract/{manager|approver|vendor|user}/{contracts|msa-contracts}/{id}/...`:

| Method | Path suffix | Purpose |
|---|---|---|
| `GET` | `.../redline-turn` | Current `{ holder, status, updatedAt, updatedBy }` |
| `POST` | `.../redline-turn/send` | Hand off turn; flips `holder`; triggers email + "My Action" item; `403` if caller ≠ holder |
| `POST` | `.../redline-turn/finalize` | Sets `status:"finalized"`; `400` if any suggestion still open; `403` if caller ≠ holder |
| `POST` | `.../ai/redline-suggestions/{redlineId}/resolve` | Audit-only `{ action:"accepted"\|"modified"\|"rejected", tier? }`; does **not** mutate the doc |

Model: one side holds the turn and acts unilaterally (accept / modify / reject / new tracked edits), then explicitly hands the document to the other side; negotiation ends via an explicit finalize once no redlines remain open.

## What was actually shipped (in `docs.json`)

| Method | Path | Response |
|---|---|---|
| `POST` | `/{manager\|vendor}/contracts/{contractId}/redlines/{redlineId}/accept` | `{ redlineId, cmAccepted, vendorAccepted, status: "both_accepted"\|"cm_accepted"\|"vendor_accepted"\|"pending", shouldRemove }` |

`shouldRemove` is documented as *"True when both parties have accepted — client should remove the redline from the document."*

Model: both parties **independently** accept the same redline; it leaves the document only when both have. This is the **dual-approval** model (`project_redline_dual_approval_260614`) that the 2026-07-01 design supersedes (see that spec, line 5).

## Decision needed

Pick one, so both sides converge:

1. **Build the turn-negotiation endpoints** (the four above) and retire/replace the `redlines/{id}/accept` endpoint — matches the approved FE design.
2. **Confirm the pivot to dual-acceptance** — if the backend intentionally chose this model, we'll formally revise the FE design doc to match and build against `redlines/{id}/accept`. (The client's 2026-06-21 transcript arguably supports either reading, so this is a legitimate product call — but it needs to be an explicit decision, not an implicit one.)

## Gaps to resolve regardless of which model wins

- **No MSA endpoint.** `redlines/{id}/accept` exists only for `contracts`, not `msa-contracts`. The collab tool (redline scan, AI suggestions, comments) supports both; MSA redline acceptance can't be wired until an MSA endpoint ships.
- **`accept` has no request body.** It can't record *which* AI alternative-language tier / replacement text was accepted, so there's no way to lock the first accepter's chosen text for the second accepter to confirm (a subtlety the dual-approval design called out), and no audit of accepted-vs-modified-vs-rejected. If dual-acceptance is the chosen model, consider a body `{ action, tier?, replacementText? }`.
- **Asymmetric error contract.** The manager `accept` documents `403`; the vendor `accept` does not. Both should document `403` (turn/authorization) consistently.
- **Doc-mutation ownership.** The backend cannot mutate the client-side Yjs document, so on `shouldRemove:true` the *submitting client* performs the removal and other clients converge via Yjs. Please confirm `shouldRemove` is returned only to the caller whose acceptance completed the pair (or that it's idempotent/safe if both clients act on it).
