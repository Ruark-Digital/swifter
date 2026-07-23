# Roadmap — Phase-2 QA + BE-Gap Remediation

**Milestone:** v1.0 · **Mode:** standard · **Granularity:** coarse

3 phases covering all v1 requirements. This is incremental remediation on a live brownfield app; phases group ongoing workstreams rather than a build-from-scratch sequence.

## Phases

### Phase 1: BE-Unblocked FE Gap Wiring
**Goal:** Wire the frontend to the endpoints the backend spec (docs.json v2.3.0) unblocked, with contract↔MSA parity, so each gap is usable end-to-end.
**Requirements:** GAP-01, GAP-02, GAP-03, GAP-04, GAP-05, PAR-01
**Success Criteria:**
1. RFI respond/close/edit work for the assigned parties on contract and MSA
2. Per-item security approve is available to the owning manager on contract and MSA
3. Vendor personnel is managed from a dedicated tab on contract and MSA
4. Change Orders Impact (and peers) render real BE values with no fabricated defaults
5. Manager can onboard-and-assign a PM by email

### Phase 2: QA Bug-Batch Remediation
**Goal:** Close prioritized QA items from the SwiftPro review docs, screenshot-authoritative and role-safe.
**Requirements:** QA-01, QA-02, PAR-01
**Success Criteria:**
1. Prioritized review-doc items are fixed and verified per-item
2. No fix leaks actions or data across roles
3. Shared contract/MSA flows stay in parity after fixes

### Phase 3: FE Cleanup & Hardening
**Goal:** Remove dead paths left by BE endpoint relocation/removal and add coverage for the new lifecycle flows.
**Requirements:** HARD-01, HARD-02, HARD-03
**Success Criteria:**
1. No role calls a removed/relocated BE endpoint (dead branches pruned)
2. RFI close/edit and vendor-personnel flows have automated tests
3. FE dual-read guards remain where the BE spec is ambiguous

## Traceability
- Phase 1 → GAP-01..05, PAR-01
- Phase 2 → QA-01, QA-02, PAR-01
- Phase 3 → HARD-01..03
