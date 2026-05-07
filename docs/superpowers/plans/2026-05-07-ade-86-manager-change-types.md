# ADE-86 Manager Change Types Implementation Plan
 
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
 
**Goal:** Align manager contract-change creation to Phase 2 by allowing only `directive | proposal` types (remove `order`) across UI defaults/options and payload typing.
 
**Architecture:** Keep a single source of truth for change types in `contractChanges.ts` and ensure manager create UI + API DTO unions match that source. No API shape changes beyond the `type` union.
 
**Tech Stack:** React + TypeScript, TanStack Query, Forge forms, yup validation (API layer)
 
---
 
### Task 1: Update manager change-type options + default selection
 
**Files:**
- Modify: [contractChanges.ts](file:///c:/Users/HomePC/Documents/GitHub/swifter/src/pages/ContractManagementPage/lib/contractChanges.ts)
- Modify: [CreateChangeDialog.tsx](file:///c:/Users/HomePC/Documents/GitHub/swifter/src/pages/ContractManagementPage/components/CreateChangeDialog.tsx)
 
- [ ] Step 1: Replace manager options from `order` to `proposal` in `getCreateChangeTypeOptionsForRole`
- [ ] Step 2: Update manager default `changeType` from `order` to `proposal`
 
### Task 2: Align manager payload typing/mapping
 
**Files:**
- Modify: [contractChanges.ts](file:///c:/Users/HomePC/Documents/GitHub/swifter/src/pages/ContractManagementPage/lib/contractChanges.ts)
- Modify: [contractManagerApi.ts](file:///c:/Users/HomePC/Documents/GitHub/swifter/src/pages/ContractManagementPage/api/contractManagerApi.ts)
 
- [ ] Step 1: Update `ContractChangeManagerDTO["type"]` union to `directive | proposal`
- [ ] Step 2: Update `toManagerCreateChangePayload` to only accept/map `directive | proposal`
 
### Task 3: Verification
 
**Files:**
- Modify (if present): existing unit tests covering manager create payload/type
 
- [ ] Step 1: Run typecheck/build (or test suite) to ensure no TypeScript breakages
- [ ] Step 2: Verify manager Create Change dialog shows only Directive/Proposal and submits selected type
