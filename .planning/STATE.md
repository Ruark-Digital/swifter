# Project State — SwiftPro FE

**Milestone:** v1.0 — Phase-2 QA + BE-Gap Remediation
**Current phase:** Phase 3 (FE Cleanup & Hardening) — Phases 1 & 2 largely shipped incrementally
Last activity: 2026-07-24 - Completed quick task 260724-onj: wired redline resolve/undo BE spec update (docName/baseVersionId/409 handling + new undo endpoint).

## Status

Brownfield app under incremental remediation. Much of Phase 1 (BE-unblocked FE gaps) shipped in PR #267 on `fix/phase2-qa260719-fe-only` → `fix/phase2-bug-fixes`. Phase 2 QA batches are ongoing per the review docs. Phase 3 cleanup (dead-branch prune, test coverage, tab sole-owner) is next.

## Key Decisions

- GSD is the default workflow (CLAUDE.md §0). Quick-task mode is the common case.
- PRs target `fix/phase2-bug-fixes`; `main` is dead.
- FE absorbs BE field-name drift via dual-read where the spec is ambiguous.

## Blockers/Concerns

- QA78 "pick existing PM by id" is BE-blocked (endpoint not in docs.json v2.3.0).
- Vendor-personnel redesign (tab + strip-from-edit + read-only) was REVERTED (ef058ecd3) — it was built on a triage assumption, not the BE spec. `PUT /manager/contracts/{id}` accepts personnel (CreateContractInput), so form-based edit is correct and restored. Any future vendor-personnel tab must be an ADDITIONAL, active-contract-only surface — never a replacement for form editing (drafts need the form). Verify docs.json before redesigning a flow.

## Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260723-0y0 | Prune dead approver/user redline-suggestion branches | 2026-07-23 | 4129d0daf | [260723-0y0-prune-dead-approver-user-redline-suggest](./quick/260723-0y0-prune-dead-approver-user-redline-suggest/) |
| 260723-91v | Make Vendor Personnel tab sole owner (stop EditContract/CreateMSADialog edit-PUT sending personnel) | 2026-07-23 | e79037cfd, d23fcfcf9 | [260723-91v-make-vendor-personnel-tab-sole-owner-sto](./quick/260723-91v-make-vendor-personnel-tab-sole-owner-sto/) |
| 260723-9dx | Make Step 2 personnel read-only on edit forms (REVERTED by ef058ecd3; superseded by status-gated tab fb389beaa) | 2026-07-23 | 1b2b3ecc3 | [260723-9dx-make-step-2-personnel-read-only-on-edit-](./quick/260723-9dx-make-step-2-personnel-read-only-on-edit-/) |
| 260723-att | Add Vitest coverage for RFI close/edit + Vendor Personnel gating (HARD-02) | 2026-07-23 | 06d5a0489 | [260723-att-add-vitest-coverage-for-rfi-close-edit-a](./quick/260723-att-add-vitest-coverage-for-rfi-close-edit-a/) |
| 260724-onj | Wire redline resolve/undo BE spec update: docName/baseVersionId + 409 handling on resolve, new undo endpoint + turn-gated UI | 2026-07-24 | a4c2c482b, e2f654272 | [260724-onj-wire-redline-resolve-undo-be-spec-update](./quick/260724-onj-wire-redline-resolve-undo-be-spec-update/) |
