# AI Redline suggestion shape — spec gap (extended fields)

**Date:** 2026-07-28
**Owner:** Backend
**Severity:** UX regression (user-visible, but no data loss)
**Related:** QA report 260728 (screenshot), PRs implementing #232 / #235 / #237, `docs/superpowers/specs/2026-07-01-redline-turn-negotiation-design.md`

## TL;DR

The AI Redline panel used to render four pieces of information per suggestion that are **not in the swagger** and, as of the persistence work shipped this week, are no longer being returned. The FE was built against un-specced BE output; this is a spec gap, not a BE bug. We'd like these fields formally added to the schema and returned from both the POST and the persisted GET.

## What the user reports

Verbatim (QA screenshot, 260728 12:49 AM):

> "AI Redline - The 'Show Legal/ Commercial /Technical?' is gone 😩😩😩 Please bring it back 😩😩. The comments are also gone, please bring it back 😩😩."

Terminology clarification the same message gave us (worth landing in the schema too):

> "Addressed is for the redlines that the CM accepted or dismissed - Resolved are the ones the Vendor PM accepted after after CM send the redline to them"

## Missing fields

The FE renders these off each suggestion; all four are currently `undefined` in the responses we see:

| Field | Type | UI use |
|---|---|---|
| `considerations` | `{ legal?: string; commercial?: string; technical?: string }` | The "Show legal / commercial / technical" toggle and the three sections behind it. **This is the "comments" the user is asking about.** |
| `solution` | `string` | "Next step" section under the same toggle. |
| `alternativeLanguage` | `{ low?: string; medium?: string; high?: string }` | Risk-tiered replacement picker (Conservative / Balanced / Minimal) + the text that gets written into the document on Apply. |
| `acceptability` | `"acceptable" \| "conditionally-acceptable" \| "not-acceptable"` | Verdict pill on each card. |

Also worth revisiting: `suggestion` is currently typed in swagger as `enum: [accept, reject, negotiate]`, but the FE and the previous responses treated it as **free-text prose** ("Recommendation" block, e.g., *"This change should not be accepted as-is due to the risk of…"*). We render whatever comes back. Please confirm whether the enum or the prose is authoritative.

## Where the gap comes from

- `grep 'considerations|alternativeLanguage|acceptability' docs/superpowers/specs/ .planning/ .qa/` → **zero hits.** We never named these fields in any handoff.
- `git log -S 'considerations' -- swagger.json` → **no history.** The fields have never been in swagger.
- The 2026-07-01 turn-negotiation spec designed the `.../resolve` endpoint body (`{ action, tier? }`) but did not touch the suggestion response shape.
- BE-worklist 260719 #232 / #235 / #237 asked for persistence and progress counts without specifying which fields to persist.

So both sides quietly relied on an informal shape. When persistence landed, BE persisted the swagger-documented shape only — which is defensible, but drops the UX the user built expectations around.

## Ask

1. **Add the four fields above to `RedlineAnalysisResultItem` in swagger** (all optional, so back-compat holds).
2. **Return them from both endpoints:**
   - `POST /{manager|vendor}/{contracts|msa-contracts}/{id}/ai/redline-suggestions` (fresh analysis)
   - `GET /{manager|vendor}/{contracts|msa-contracts}/{id}/ai/redline-suggestions` (persisted; not currently in swagger — please add)
3. **Persist them alongside the resolution audit** so a returning user sees the same content they saw when they generated the suggestions.
4. **Clarify the `suggestion` field:** enum verdict, or free-text recommendation? If both are needed, split into two fields (`verdict: enum` + `recommendation: string`).
5. **Add `addressedCount` / `resolvedCount` to the swagger** for the persisted GET response — the FE already reads them (used for the header progress line) but they're not documented.

## FE state

No FE changes needed. The types (`AiRedlineSuggestion` in `src/pages/CollaborationToolPage/collab/useAiRedlineSuggestions.ts`) and the rendering (`AiSuggestionsPanel.tsx`) already handle these fields as optional — the moment BE returns them, the toggle, the tier picker, and the verdict pill re-appear.

## How to verify the fix

1. Load a contract with existing redlines as a Contract Manager.
2. Generate AI suggestions (or reopen a doc where they were previously generated).
3. Expect on each card: a verdict pill (Acceptable / Conditionally / Not), an "Alternative language" tier picker with at least one of Conservative / Balanced / Minimal, and a "Show legal / commercial / technical" toggle that expands to three labelled sections plus a "Next step" line.
4. Refresh the page → the same content should still be present (persistence).
