# Requirements — Phase-2 QA + BE-Gap Remediation

Milestone scope: incremental remediation of the SwiftPro frontend — closing QA bug batches and wiring BE-unblocked FE gaps as the backend spec ships endpoints. Not a rewrite.

## v1 Requirements

### BE-Unblocked FE Gaps (GAP)
- [ ] **GAP-01**: RFI lifecycle is complete for the assigned parties — respond, issuer-close, and issuer-edit — on both contract and MSA surfaces
- [ ] **GAP-02**: Owning manager can approve/reject each compliance **security item** individually on both contract and MSA
- [ ] **GAP-03**: Owning manager can manage **vendor personnel** (list/add/edit/remove) from a dedicated detail-page tab on contract and MSA
- [ ] **GAP-04**: Manager can assign a project manager (onboard-by-email today; pick-existing-by-id when the BE endpoint ships)
- [ ] **GAP-05**: Dashboard analytics render real backend values with no fabricated defaults (e.g. Change Orders Impact)

### QA Bug Remediation (QA)
- [ ] **QA-01**: Prioritized items from the SwiftPro review docs are fixed, screenshot-authoritative, verified per-item
- [ ] **QA-02**: Fixes preserve role scoping and never leak actions across roles

### Contract↔MSA Parity (PAR)
- [ ] **PAR-01**: Shared flows behave identically on contract and MSA detail surfaces (tabs, gating, endpoints)

### FE Hardening (HARD)
- [ ] **HARD-01**: Dead code from removed/relocated BE endpoints is pruned (roles no longer call 404 paths)
- [ ] **HARD-02**: New lifecycle flows (RFI close/edit, vendor personnel) have automated test coverage
- [ ] **HARD-03**: FE tolerates BE field-name drift via dual-read where the spec is ambiguous

### Multi-Role Access (ROLE)
- [ ] **ROLE-01**: A user can hold up to two roles; `useUserRole` resolves a single *active* role from the set so every existing single-role guard/dashboard/API-dispatch keeps working unchanged
- [ ] **ROLE-02**: Users with more than one role can switch their active role from the header; switching re-scopes role-keyed data (dashboard + role-scoped queries)
- [ ] **ROLE-03**: Create/Edit user dialogs (User + Admin management) assign 1–2 roles enforcing the BE-fixed allowed pairs (approver/evaluator, contract_manager/procurement) and submit `roles: string[]`

## v2 Requirements (deferred)
- [ ] Vendor Personnel tab becomes sole owner of personnel (strip from EditContract edit payload)
- [ ] Pick-existing-PM-by-id UI once the BE endpoint exists

## Out of Scope
- Backend implementation — separate service
- Re-architecture / greenfield rewrite — incremental only
- Solicitation/admin service frontend — tracked separately

## Traceability
Filled by ROADMAP.md.

| REQ | Phase |
|-----|-------|
| GAP-01..05 | Phase 1 |
| QA-01, QA-02 | Phase 2 |
| PAR-01 | Phase 1, Phase 2 |
| HARD-01..03 | Phase 3 |
| ROLE-01..03 | Phase 4 |
