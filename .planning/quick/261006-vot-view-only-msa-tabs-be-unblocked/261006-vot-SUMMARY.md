---
quick_id: 261006-vot
slug: view-only-msa-tabs-be-unblocked
date: 2026-10-06
status: complete
commit: 4f179af0e
---

# Summary — View-only MSA tabs now BE-unblocked (#106 rest)

Re-scoped the view-only batch against docs.json **v2.3.0**. The four MSA tabs
previously marked BE-blocked (261005-sig scope map) now have `/user/*` endpoints,
so they were wired and whitelisted. #102 (view-only Contracts list) was already
shipped on the base branch (commit ab8b4c67b), so no work was needed there.

## Shipped ✅ (commit 4f179af0e)

View-only MSA detail now exposes **Analytics, KPI, Compliance, Payment Summary**
(whitelist + `/user` base-path wiring, read-only — all write actions stay gated
behind manager/vendor roles):

- **KPI** — `GET /user/msa-contracts/{id}/kpis`; `canManageKpi` stays false so the
  Update/View row actions remain hidden.
- **Payment Summary** — Savings Realized from `/user/.../payment-savings`; the
  Update Saving dialog stays manager-only. Holdbacks remain off for all profiles
  (`SHOW_MSA_HOLDBACK`, #82).
- **Compliance** — already resolved the `/user` compliance path (from 261005-sig);
  only needed whitelisting. Read-only tables, all approve/submit buttons gated.
- **Analytics** — `/user` dashboard surface. `deliverable-status` and
  `deliverable-summary` have no `/user` endpoint, so those two queries are gated
  off for view-only (both sections are already hidden for MSA analytics). The only
  visible casualty is the **Vendor KPI** block — the BE sources it from
  deliverable-summary and does not expose it to view-only, so it degrades to "--".

Also flipped `view-only-msa-tabs.unit.spec.ts` to assert the four tabs are now
exposed.

## Verification
- `tsc -b` exit 0 (Vercel gate) ✓
- vitest unit suites (`view-only-msa-tabs.unit.spec.ts`, `payment-summary-labels.test.tsx`)
  pass — 6/6 (the Playwright `msa-payment-summary-vendor-savings-gating.spec.ts`
  is an e2e file vitest can't collect; not a unit failure) ✓
- eslint on changed files clean ✓
- Live view-only login walkthrough not run (no running dev server / view-only
  session in this environment) — wiring matches docs.json v2.3.0 and mirrors the
  existing per-role base-path patterns.

## Scope map (docs.json `/user/*` v2.3.0)

| Item | Status |
|------|--------|
| #106 MSA Analytics / KPI / Compliance / Payment Summary | ✅ shipped (this task) |
| #102 view-only Contracts list (`/user/contracts` + `/stats`) | ✅ already on base (ab8b4c67b) |
| #104 Projects + Business Division | ⛔ still BE-blocked — no `/user/projects`, `/user/business-division` |
| #107 MSA/Compliance Export report | ⏭ out of scope — shared `/contract/contract-export` endpoint, pre-existing |
| Analytics Vendor KPI for view-only | ⛔ BE gap — no `/user` deliverable-summary; degrades to "--" |

## Follow-ups (BE)
1. `/user/msa-contracts/{id}/dashboard/deliverable-summary` (+ `deliverable-status`)
   so view-only Analytics shows the Vendor KPI + Deliverable sections.
2. `/user/projects`, `/user/business-division` for #104.
