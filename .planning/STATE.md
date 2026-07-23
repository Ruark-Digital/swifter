# Project State — SwiftPro FE

**Milestone:** v1.0 — Phase-2 QA + BE-Gap Remediation
**Current phase:** Phase 3 (FE Cleanup & Hardening) — Phases 1 & 2 largely shipped incrementally
Last activity: 2026-07-23 - Completed quick task 260723-9dx: make Step 2 personnel read-only on edit forms (point to Vendor Personnel tab)

## Status

Brownfield app under incremental remediation. Much of Phase 1 (BE-unblocked FE gaps) shipped in PR #267 on `fix/phase2-qa260719-fe-only` → `fix/phase2-bug-fixes`. Phase 2 QA batches are ongoing per the review docs. Phase 3 cleanup (dead-branch prune, test coverage, tab sole-owner) is next.

## Key Decisions

- GSD is the default workflow (CLAUDE.md §0). Quick-task mode is the common case.
- PRs target `fix/phase2-bug-fixes`; `main` is dead.
- FE absorbs BE field-name drift via dual-read where the spec is ambiguous.

## Blockers/Concerns

- QA78 "pick existing PM by id" is BE-blocked (endpoint not in docs.json v2.3.0).
- ~~Step 2 personnel chips editable-but-discarded on edit~~ RESOLVED 260723-9dx: Step 2 personnel is now read-only on edit forms (static list + pointer to the Vendor Personnel tab); create stays editable.

## Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260723-0y0 | Prune dead approver/user redline-suggestion branches | 2026-07-23 | 4129d0daf | [260723-0y0-prune-dead-approver-user-redline-suggest](./quick/260723-0y0-prune-dead-approver-user-redline-suggest/) |
| 260723-91v | Make Vendor Personnel tab sole owner (stop EditContract/CreateMSADialog edit-PUT sending personnel) | 2026-07-23 | e79037cfd, d23fcfcf9 | [260723-91v-make-vendor-personnel-tab-sole-owner-sto](./quick/260723-91v-make-vendor-personnel-tab-sole-owner-sto/) |
| 260723-9dx | Make Step 2 personnel read-only on edit forms (point to Vendor Personnel tab) | 2026-07-23 | 1b2b3ecc3 | [260723-9dx-make-step-2-personnel-read-only-on-edit-](./quick/260723-9dx-make-step-2-personnel-read-only-on-edit-/) |
