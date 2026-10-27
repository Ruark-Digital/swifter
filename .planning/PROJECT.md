# SwiftPro — Contract Lifecycle Management (Frontend)

## What This Is

SwiftPro is a role-based contract lifecycle management web app. This repo is the **frontend**: a React 19 + Vite 5 + TypeScript SPA (pnpm, deployed via AWS Amplify) that talks to a single backend REST API (`dev.swiftpro.tech` / `api.swiftpro.tech`) through one axios instance with JWT bearer auth. It renders role-scoped experiences (contract manager, approver, vendor/project-manager, view-only, company/super admin) across the full contract and MSA lifecycle.

## Core Value

The one thing that must work: **each role can drive its part of the contract/MSA lifecycle end-to-end** — create/edit, review/approve, respond, and manage the sub-entities (RFI, NCR, deliverables, claims, change orders, compliance/security, invoices, rate sheets, LEM, approvers, personnel) — with the UI faithfully reflecting backend state and role permissions.

## Context

- **Stage:** brownfield, mid-Phase-2 QA remediation. Active branch `fix/phase2-qa260719-fe-only`; PRs target `fix/phase2-bug-fixes` (the `main` branch is dead).
- **Stack:** React 19, Vite 5, TypeScript, pnpm, React Query, Zustand, Forge (`@adexdsamson/forge`) forms, Tailwind, Radix UI, Recharts. Sentry, Yjs/y-websocket collab, embedded SuperDoc iframe editor, MCP chat.
- **Backend:** separate REST service (contract) + a separate solicitation/admin service; spec delivered as `docs.json` (OpenAPI, currently v2.3.0). FE frequently absorbs BE field drift.
- **Codebase intel:** see `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS).

## Requirements

### Validated (existing, shipped)

- ✓ Role-based auth + routing (JWT via Zustand + axios interceptors, AuthorityGuard) — existing
- ✓ Contract & MSA create/edit wizards, detail pages with role-scoped tabs — existing
- ✓ Lifecycle sub-entities: RFI, NCR/CAPA, deliverables, claims, change orders/amendments, compliance & security, invoices, rate sheets, LEM — existing
- ✓ Role-based dashboards + analytics (Recharts) — existing
- ✓ Approver assignment & approval flows — existing
- ✓ Collaboration editor (SuperDoc iframe + Yjs) and AI chat — existing

### Active (this milestone: Phase-2 QA + BE-gap remediation)

- [ ] Close QA bug batches from the SwiftPro review docs (per-item, screenshot-authoritative)
- [ ] Wire BE-unblocked FE gaps as the backend spec ships endpoints (RFI close/edit, per-item security approve, vendor personnel, dashboard field alignment, etc.)
- [ ] Maintain contract↔MSA parity for shared flows
- [ ] Keep the FE resilient to BE field drift (dual-read where the spec is ambiguous)

### Out of Scope

- Backend implementation — separate service/repo
- Greenfield rewrites / re-architecture — this is incremental remediation
- The solicitation/admin service FE — tracked separately

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GSD as default workflow | Structure QA/gap work with atomic commits + tracking | — Adopted (CLAUDE.md §0) |
| PRs target `fix/phase2-bug-fixes`, not `main` | `main` is dead in this repo's topology | — Standing rule |
| Absorb BE field-name drift in FE (dual-read) | BE ships variant field names; FE must render whichever arrives | — Standing pattern |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-23 after initialization*
