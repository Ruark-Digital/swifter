# Responsive Audit — Mobile / Tablet / iPad / Desktop

**Date:** 2026-05-29
**Type:** Quick task (audit-only — no app code changes)
**Owner:** ai@mainlandtech.com

## Goal

Produce a prioritized, evidence-backed list of responsive defects across the Swifter SPA at four viewport widths. Output is a single `RESPONSIVE-AUDIT.md` that future quick tasks can pick from, one surface family per follow-up PR.

**Out of scope:** any code fix. This task ends at the audit document. Fixes ship in follow-up tasks per surface family (auth, lists/dashboards, detail tabs, wizards/dialogs).

## Why audit-first

Full mobile-first redesign across auth + 13-tab Contract/MSA detail pages + multi-step wizards is multi-week, multi-PR work. Writing a single mega-plan without evidence enshrines guesses. The audit lets each follow-up plan reference concrete file:line + screenshot proof.

## Viewports

| Label  | Width × Height | Represents              |
| ------ | -------------- | ----------------------- |
| mobile | 375 × 812      | iPhone SE / 13 mini     |
| tablet | 768 × 1024     | iPad portrait           |
| ipad   | 1024 × 1366    | iPad Pro / landscape    |
| desktop| 1440 × 900     | baseline desktop        |

## Roles to exercise

Reuse `.qa/scripts/contract-roles-smoke.mjs` login flow for: Contract Manager, Vendor, Approver, Project Manager. Each role sees a different navigation set.

## Routes per role

Drive the runner through the route inventory it already walks (kebab → View Details → every tab) for the first available Contract and MSA. Add:

- `/` (login)
- Top-level lists: Projects, Contracts, MSAs, Vendors, Dashboard
- One Create wizard per role (Contract or MSA, whichever the role can open)
- One approval dialog screenshot (Approver only — open Approve Contract from `ContractDetailPage`)

## Deliverables

### 1. `.qa/scripts/responsive-audit.mjs`

New Playwright script. Forks `contract-roles-smoke.mjs`. For each `(role, route, viewport)`:

1. `page.setViewportSize({ width, height })`
2. Wait for network idle + 500ms settle
3. Screenshot → `.qa/reports/responsive/<role>/<viewport>/<route-slug>.png`
4. Capture overflow signals via injected JS:
   - `document.documentElement.scrollWidth > window.innerWidth` (horizontal scroll on `<html>`)
   - For every element with `offsetWidth > window.innerWidth`: log `tagName`, `id`, `className`, `data-testid`, bounding rect
   - Elements with `position: fixed` whose rect exceeds viewport
   - `<table>` ancestors lacking a scroll wrapper at widths < 1024
5. Console errors + uncaught exceptions per viewport
6. Append one row per finding to `.qa/reports/responsive/findings.jsonl`

### 2. `.planning/quick/260529-responsive-audit/RESPONSIVE-AUDIT.md`

Generated post-run. Sections:

- **Summary** — counts by severity × surface family × viewport
- **Findings table** — `id | route | viewport | role | severity | symptom | suspected file:line | screenshot path`
  - Severity: P0 (unusable — overflow blocks interaction, modal off-screen), P1 (degraded — table cut off, sidebar overlaps content), P2 (cosmetic — spacing off, truncation)
- **Surface-family breakdown** — one heading per family with top offenders, suggested follow-up PR title, and rough effort (S/M/L)
- **Known traps to verify during fixes** — links to relevant `MEMORY.md` entries (`fileinput-dropzone-dark-mode-pattern`, `button-inline-flex-whitespace-nowrap-overflow`, `radix-tabs-force-mount-trap`)

### 3. Findings JSONL (`.qa/reports/responsive/findings.jsonl`)

Machine-readable for re-aggregation as follow-ups land.

## Tasks

1. **Write the runner** — `.qa/scripts/responsive-audit.mjs`. Reuse the login + nav helpers from `contract-roles-smoke.mjs` verbatim; don't refactor them. Verify: script runs end-to-end against one role × one viewport without throwing.
2. **Run full matrix** — 4 roles × 4 viewports × ~12 routes = ~192 screenshots + JSONL. Verify: every cell has a PNG; JSONL has ≥1 row per route or an explicit "clean" row.
3. **Triage script** — small Node post-processor that reads `findings.jsonl`, clusters by `(surface_family, symptom_signature)`, attempts file:line attribution by grepping `className` / `data-testid` strings against `src/`, and emits the markdown table. Verify: every row in the markdown table is grep-traceable back to JSONL.
4. **Write RESPONSIVE-AUDIT.md** — finalize summary + surface-family sections by hand from the generated table; assign severity and effort. Verify: at least one suggested follow-up PR title per family that has any P0/P1.
5. **Sanity check the top 5 P0s** — manually open dev server at the offending viewport for the top 5 P0 findings to confirm they're real (not flaky screenshots). Verify: each one reproduces in a real browser, or gets demoted/removed.

## Verification (whole task)

- `RESPONSIVE-AUDIT.md` exists with non-empty Findings table.
- `findings.jsonl` exists with one line per finding; line count matches table row count.
- Screenshot directory has expected ~192 files (allow for routes that 404 per role).
- No app source file under `src/` was modified by this task. `git status src/` is clean. ← hard gate.

## Non-goals (explicit)

- No CSS edits. No Tailwind config changes. No component refactors.
- No fixing "while I'm in there" findings. They go in the audit, not the diff.
- No mobile-specific routing or feature gating decisions — defer to follow-up plans.

## Follow-up shape (anticipated, not committed)

Once the audit lands, expect roughly these follow-ups (sized by audit, not pre-committed):

- `260530-responsive-auth-and-shell` — login, app shell, top nav, sidebar drawer
- `260530-responsive-lists-and-dashboards` — DataTables, KPI cards, dashboard grids
- `260530-responsive-detail-tabs-contract` — ContractDetailPage tabs (the biggest surface)
- `260530-responsive-detail-tabs-msa` — MsaDetailPage tabs
- `260530-responsive-wizards-and-dialogs` — CreateContract/MSA/Project wizards, approval dialogs

Each gets its own `/gsd-quick` or quick-task PLAN.md citing audit rows.
