# RFP Document Migration + Per-Document Clause Analysis — Design

Date: 2026-08-21
Source: BE shipped two new/extended endpoints (`docs.json`); stakeholder request forwarded via chat.

## Problem

Two independent, backend-ready capabilities need frontend wiring:

1. **RFP documents should migrate into a contract created from an awarded solicitation.**
   The stakeholder wants the RFP files attached to an awarded solicitation to auto-populate
   the new contract's Documents step, where the Contract Manager (CM) can remove any they
   don't want before saving.

2. **Clause Library should be able to (re)analyze a specific contract document.**
   BE added an endpoint to run clause extraction against one chosen file. The CM triggers it
   from a per-document action in the Documents tab; on success the app switches to the
   Clause Library tab showing the refreshed result.

## Backend contract (from `docs.json`)

- `GET /contract/manager/awarded-solicitation` → `AwardedVendorItem[]`. Each item now carries a
  `files` array (RFP documents). Live payload has historically used shorter keys than the spec
  (e.g. `name`/`_id` vs documented `solicitationName`/`solicitationId`), so file objects are read
  defensively.
- `POST /contract/manager/{contracts|msa-contracts}/{contractId}/clauses/file/{fileId}`
  — "Re-analyse clause library from a specific file." `fileId` accepts a Mongo ObjectId, file
  name, **or file URL**. `x-roles`: `contract_manager`, `company_admin`, `procurement`.

## Feature 1 — RFP docs → new contract Documents step

**Key insight:** the Documents step component `Step4Form`
(`src/pages/SolicitationManagementPage/components/Step4Form.tsx`) already:
- accepts a `documents: DocumentType[]` prop,
- hydrates each into its persisted store as an `"uploaded"` file with a remove (✕) control,
- and forwards uploaded files into the submit payload.

Today `CreateContractSheet.tsx` renders it with `documents={[]}` (step 7). The change is to feed
it the selected awarded solicitation's files.

### Changes

1. **`CreateContractSheet.tsx`**
   - Extend the local `AwardedVendorItem` type with `files?: unknown[]`.
   - In the `awardedOptions` memo, carry `files: a.files ?? []` on each option (alongside the
     existing `solicitationName`/`vendorId`/`categoryName`).
   - Watch the selected `awardedSolicitation` value; find its awarded item; map its `files` →
     `DocumentType` (`{ _id, name, url, size, type, originalName, fileName }`) defensively,
     keeping only entries that have a `url`. Memoize as `awardedDocuments`.
   - Pass `documents={awardedDocuments}` to `<Step4Form>` at step 7 (was `[]`).

2. **Mapping helper** (inline in `CreateContractSheet.tsx`): tolerant field reads
   (`f._id ?? f.id ?? f.url`, `f.name ?? f.originalName ?? f.fileName`, size coerced to string,
   `type ?? mimeType ?? "application/octet-stream"`).

### Behavior / interactions

- The sheet clears the shared file store on open (`handleOpenChange → clearSession()`), so the
  store is empty when the CM starts. Selecting a solicitation at step 1 populates
  `awardedDocuments`; when step 7 mounts, `Step4Form` hydrates those files once per session.
- On submit, hydrated RFP files (status `"uploaded"`, real `url`) flow through the existing
  `documents → toFileMetaOrUndefined → files` pipeline. No re-upload occurs.
- **Scope:** Create Contract only. Not wired into Edit Contract or MSA creation (the request is
  specifically contract-creation-from-awarded-solicitation).
- **Known limitation:** if the CM reaches step 7, then goes back and switches to a *different*
  solicitation, the first set's files are not auto-purged (store dedupe prevents duplicates; the
  CM can ✕ them). Documented rather than solved — reset plumbing isn't worth it for this edge.

## Feature 2 — "Analyze in Clause Library" per-document action

Add an action to each document row in the Documents tab that runs clause analysis on that file,
then switches to the Clause Library tab.

### Changes

1. **`DocumentItem.tsx`**
   - New optional props: `contractType?: "Contract" | "MsaContract"` (default `"Contract"`),
     `fileId?: string` (real `_id`, may be absent), and `onAnalyzed?: () => void`.
   - Add an icon button ("Analyze in Clause Library", e.g. `ScanText`), rendered only when
     `onAnalyzed` is provided **and** the user is `isManager || isCompanyAdmin`. (The parent only
     supplies `onAnalyzed` when a Clause Library tab exists — see note below — so the button never
     appears where the auto-switch target is hidden.)
   - Runs a `useMutation` posting to
     `/contract/manager/${contractType === "MsaContract" ? "msa-contracts" : "contracts"}/${contractId}/clauses/file/${encodeURIComponent(analyzeId)}`
     where `analyzeId = fileId || d.url`. Button shows a spinner while pending; disabled when no
     `analyzeId`/`contractId`.
   - On success: success toast, invalidate `["contract-clause-library", contractType, contractId]`,
     then call `onAnalyzed?.()`. On error: error toast.

2. **`DocumentsList.tsx`**
   - Extend `Doc` mapping to keep the real `fileId` (`file._id`) separately from the synthetic
     row `id` (so the synthetic `name-index` fallback is never sent to the endpoint).
   - Accept and forward `contractType` and `onAnalyzeNavigate` to each `DocumentItem`.

3. **`DocumentsTabContent.tsx`** (Contract) and **`MsaPage/layouts/Documents.tsx`** (MSA)
   - Accept `contractType` (Contract defaults `"Contract"`; MSA passes `"MsaContract"`) and an
     `onNavigateToClauseLibrary?: () => void` prop; pass both through to `DocumentsList`.

4. **`ContractDetailPage.tsx`** and **`MsaDetailPage.tsx`**
   - Pass `contractType` and `onNavigateToClauseLibrary={() => setActiveTab("clause-library")}` to
     the Documents tab — **only when the `clause-library` tab is in `visibleTabs`** (it is filtered
     out for draft records). This is what gates the action's visibility on draft records.

### Role / availability

- Action visible to `isManager` (contract_manager or procurement) or `isCompanyAdmin` — matches
  the endpoint `x-roles`.
- Not shown on draft contracts/MSAs (clause-library tab hidden there ⇒ `onNavigate` not passed).

## Files touched

- `src/pages/ContractManagementPage/components/CreateContractSheet.tsx` (Feature 1)
- `src/pages/ContractManagementPage/components/DocumentItem.tsx` (Feature 2)
- `src/pages/ContractManagementPage/components/DocumentsList.tsx` (Feature 2)
- `src/pages/ContractManagementPage/layouts/DocumentsTabContent.tsx` (Feature 2 — already has
  unrelated uncommitted edits on this branch; additive only)
- `src/pages/ContractManagementPage/ContractDetailPage.tsx` (Feature 2)
- `src/pages/MsaPage/layouts/Documents.tsx` (Feature 2)
- `src/pages/MsaPage/MsaDetailPage.tsx` (Feature 2 — already has unrelated uncommitted edits)

## Verification

- Build gate: `tsc -b` (project's real gate) + lint.
- Feature 1 (manual/preview): open Create Contract, pick an awarded solicitation with RFP files,
  advance to step 7 → RFP docs pre-listed as uploaded, ✕ removes one; submit sends the kept files.
- Feature 2 (manual/preview): on a non-draft contract Documents tab, an analyze action appears per
  row for managers/admins; clicking POSTs, toasts, and switches to Clause Library showing the
  refreshed analysis. Repeat on an MSA detail page (hits `/msa-contracts/`).
- Two commits (one per feature) on the current branch `fix/phase2-lem-summary-tab`, targeting the
  phase2 flow per repo convention.

## Out of scope

- Edit Contract / MSA creation RFP migration.
- Any change to the clause analysis rendering itself (existing `ClauseLibraryTabContent` refetch
  covers the refreshed result).
- Modifying BE-owned `docs.json` / `swagger.json`.
