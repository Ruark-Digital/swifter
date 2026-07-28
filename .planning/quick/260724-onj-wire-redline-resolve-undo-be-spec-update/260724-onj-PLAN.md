---
phase: 260724-onj-wire-redline-resolve-undo-be-spec-update
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/CollaborationToolPage/collab/useRedlineTurn.ts
  - src/pages/CollaborationToolPage/collab/useRedlineTurn.test.ts
  - src/pages/CollaborationToolPage/index.tsx
  - src/pages/CollaborationToolPage/components/SidebarPanel.tsx
  - src/pages/CollaborationToolPage/components/AiSuggestionsPanel.tsx
autonomous: true
requirements: [redline-resolve-sends-docname-baseversionid, redline-resolve-409-handling, redline-undo-endpoint-added, redline-undo-ui-trigger]

must_haves:
  truths:
    - "Resolving a redline (accept/modify/reject) sends docName and baseVersionId in the POST body, in addition to the existing action/tier fields"
    - "A 409 response from resolve or undo does not silently fail — the user sees a toast explaining the document changed and to retry, and stale turn/version-history query caches are invalidated so the next fetch picks up fresh state"
    - "A user can undo a previously resolved (approved or dismissed) redline suggestion from the AI Polish panel, gated by the same isMyTurn turn-lock as Apply/Dismiss"
    - "documentState is included in the resolve payload only when a caller explicitly supplies it; no call site in this repo populates it today because the default shipped editor (SuperDoc iframe) has no host-side Y.Doc — this is a documented scoping limitation, not a silent omission"
  artifacts:
    - path: "src/pages/CollaborationToolPage/collab/useRedlineTurn.ts"
      provides: "buildResolvePayload/buildUndoPayload/isVersionConflict pure helpers, extended RedlineResolveInput + new UndoRedlineInput types, resolve payload now includes docName/baseVersionId/documentState, new undo mutation, 409 handling on both"
    - path: "src/pages/CollaborationToolPage/collab/useRedlineTurn.test.ts"
      provides: "Unit tests for the three new pure helpers"
    - path: "src/pages/CollaborationToolPage/index.tsx"
      provides: "resolve/undo call sites pass docName + fileVersionsQuery.data?.activeVersionId; 409 toasts; handleUndoAi wired to SidebarPanel"
    - path: "src/pages/CollaborationToolPage/components/SidebarPanel.tsx"
      provides: "onAiUndo prop threaded through to AiSuggestionsPanel"
    - path: "src/pages/CollaborationToolPage/components/AiSuggestionsPanel.tsx"
      provides: "Undo button on already-resolved suggestion cards, disabled+tooltipped when !isMyTurn"
  key_links:
    - from: "index.tsx handleApproveAi / handleDismissAi"
      to: "redlineTurn.resolve.mutate"
      via: "payload object includes docName and baseVersionId fields"
      pattern: "baseVersionId"
    - from: "AiSuggestionsPanel SuggestionCard Undo button"
      to: "redlineTurn.undo.mutate via index.tsx handleUndoAi"
      via: "onUndo prop chain: SuggestionCard -> AiSuggestionsPanel -> SidebarPanel -> index.tsx"
      pattern: "onUndo"
---

<objective>
Wire the two newly-published BE spec endpoints for redline negotiation into the existing (already-shipped) turn-negotiation hook and its UI:

1. **Resolve** (`POST .../ai/redline-suggestions/{redlineId}/resolve`) currently sends only `{action, tier?}` and swallows all errors as a fire-and-forget "audit-only" call. Per the BE spec it must also send `docName` and `baseVersionId` (and `documentState` when available), and a `409` response (version/turn drift) must be surfaced to the user instead of silently discarded.
2. **Undo** (`POST .../ai/redline-suggestions/{redlineId}/undo`) does not exist anywhere in this repo. It needs a new mutation plus a UI trigger point on already-resolved suggestion cards.

Purpose: Close the FE gap identified against `redline-collaboration-frontend-guide.md` §7-8 so resolve/undo carry the version metadata the BE now requires, without inventing new Yjs wiring beyond what already exists in this repo.

Output: Extended `useRedlineTurn.ts` (new types/helpers/mutation), wired call sites in `index.tsx`, and an Undo control in `AiSuggestionsPanel.tsx`.

**Scoping note (documentState):** The BE spec's `documentState` field requires a live Y.Doc (`Buffer.from(Y.encodeStateAsUpdate(ydoc)).toString("base64")`). `EditorAdapter.doc` is explicitly `Y.Doc | undefined` and is documented in `editorAdapter.ts` as "Absent for the SuperDoc iframe adapter (no host-side Y.Doc)" — and the SuperDoc iframe (`IframeEditorPane`) is the DEFAULT shipped editor in `index.tsx` (TipTap/Yoopta are `?editor=` escape hatches only). So at the actual resolve/undo call sites (`handleApproveAi`/`handleDismissAn`/new `handleUndoAi` in `index.tsx`), no live Y.Doc is reachable in the default path today. Per the task constraints, this plan makes `documentState` an optional field on the resolve payload (per the BE's own `?` marking it optional) that is simply never populated by any call site in this plan — it is NOT wired from `collabYDoc`/`editorAdapterRef` to avoid inventing new Yjs plumbing for the escape-hatch editors, which is out of scope here. A future phase can supply it once a real need for the TipTap/Yoopta path arises.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

Relevant source (already read during planning):

- `src/pages/CollaborationToolPage/collab/useRedlineTurn.ts` — current `resolve` mutation (lines ~117-135) sends `{action, tier?}` only, has an `if (!base) return null` short-circuit (fire-and-forget), and swallows errors in `onError` (DEV-only `console.warn`, no propagation). `RedlineResolveInput` (lines ~32-37) currently has `redlineId`, `action`, `tier?`. The hook already has `qc` (queryClient), `invalidate()` (invalidates the `["redline-turn", ...]` query), and `base` (role-prefixed endpoint root, e.g. `/contract/manager/contracts/{id}`).
- `src/pages/CollaborationToolPage/collab/useFileVersionsApi.ts` — `useFileVersions(docName)` returns `{ versions, activeVersionId }` under React Query key `["collab-file-versions", docName]`. `activeVersionId` is the BE's authoritative current version id for a `docName` — this is the value to send as `baseVersionId`.
- `src/pages/CollaborationToolPage/index.tsx` — `docName` (line ~310-313, derived from `collabMeta.roomId`, excluding the `"collab:editor"` placeholder) and `fileVersionsQuery = useFileVersions(docName)` (line ~314) are already computed, well before `handleApproveAi`/`handleDismissAi` (lines ~539-609) are declared — both closures can reference `docName` and `fileVersionsQuery.data?.activeVersionId` directly with no reordering of hooks needed. `redlineTurn = useRedlineTurn(...)` is declared earlier (line ~177) but is not affected by this — its mutations (`resolve`, new `undo`) take `docName`/`baseVersionId` as per-call `.mutate()` variables, not hook-scope config, specifically so no hook-declaration reordering is required.
- `src/pages/CollaborationToolPage/collab/editorAdapter.ts` — `EditorAdapter.doc?: Y.Doc` documented as "Absent for the SuperDoc iframe adapter (no host-side Y.Doc)".
- `src/pages/CollaborationToolPage/components/AiSuggestionsPanel.tsx` — `SuggestionCard` renders a "Replaced"/"Dismissed" label (lines ~174-185) when `!isPending`, and renders Dismiss/Apply buttons when `isPending` (lines ~316-359) using the established `disabled={!isMyTurn}` + `title={isMyTurn ? undefined : "Waiting for your turn"}` convention — the new Undo button must follow this exact convention, placed in the `!isPending` branch.
- `src/pages/CollaborationToolPage/components/SidebarPanel.tsx` — forwards `onAiApprove`/`onAiDismiss` (etc.) straight through to `<AiSuggestionsPanel onApprove={onAiApprove} onDismiss={onAiDismiss} .../>` (lines ~196-207). The new `onAiUndo` prop follows the identical pass-through pattern.
- `src/pages/CollaborationToolPage/collab/useRedlineTurn.test.ts` — existing tests only cover the pure function `redlineSideFromRole`, no React Query/hook harness. The new pure helpers in this plan follow that same lightweight, harness-free testing convention.

<interfaces>
Current `useRedlineTurn.ts` types the new code extends:

```typescript
export type RedlineResolutionAction = "accepted" | "modified" | "rejected";

export type RedlineResolveInput = {
  redlineId: string;
  action: RedlineResolutionAction;
  tier?: "low" | "medium" | "high";
};
```

BE spec shapes being wired (verbatim from `redline-collaboration-frontend-guide.md` §7-8):

```typescript
type ResolveRedlineRequest = {
  action: "accepted" | "modified" | "rejected";
  tier?: "low" | "medium" | "high";
  docName?: string;
  baseVersionId?: string | null;
  documentState?: string; // base64 Yjs state — omitted by this plan's call sites, see Scoping note
};

type UndoRedlineRequest = {
  docName?: string;
  baseVersionId?: string | null;
};
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extend useRedlineTurn.ts with docName/baseVersionId/documentState on resolve, 409 handling, and a new undo mutation</name>
  <files>src/pages/CollaborationToolPage/collab/useRedlineTurn.ts, src/pages/CollaborationToolPage/collab/useRedlineTurn.test.ts</files>
  <behavior>
    - `buildResolvePayload({ action: "accepted" }, {})` returns `{ action: "accepted" }` — no `docName`/`baseVersionId`/`documentState` keys when the caller omits them.
    - `buildResolvePayload({ action: "modified", tier: "low" }, { docName: "room-1", baseVersionId: "v1" })` returns `{ action: "modified", tier: "low", docName: "room-1", baseVersionId: "v1" }`.
    - `buildResolvePayload({ action: "rejected" }, { docName: "room-1", baseVersionId: null })` includes `baseVersionId: null` explicitly (not omitted) — the BE type allows `null` and it is semantically distinct from "no version known yet" being absent.
    - `buildUndoPayload({})` returns `{}`.
    - `buildUndoPayload({ docName: "room-1", baseVersionId: null })` returns `{ docName: "room-1", baseVersionId: null }`.
    - `isVersionConflict({ response: { status: 409 } })` is `true`.
    - `isVersionConflict({ response: { status: 400 } })` is `false`.
    - `isVersionConflict(new Error("network"))` is `false` (no `.response` shape).
  </behavior>
  <action>
    In `useRedlineTurn.ts`:
    1. Extend `RedlineResolveInput` with optional `docName?: string`, `baseVersionId?: string | null`, and `documentState?: string` — add a doc comment on `documentState` noting it is only populated when a live Y.Doc is available (never true for the default SuperDoc iframe editor per this plan's scoping note; see objective).
    2. Add a new exported type `UndoRedlineInput = { redlineId: string; docName?: string; baseVersionId?: string | null }`.
    3. Add three exported pure helper functions above the hook: `buildResolvePayload(input: { action: RedlineResolutionAction; tier?: "low"|"medium"|"high" }, scope: { docName?: string; baseVersionId?: string | null; documentState?: string })`, `buildUndoPayload(scope: { docName?: string; baseVersionId?: string | null })`, and `isVersionConflict(error: unknown): boolean` (checks `(error as { response?: { status?: number } })?.response?.status === 409`). Both payload builders include a key only when the corresponding scope value is not `undefined` (so `baseVersionId: null` is included, but a fully-omitted `baseVersionId` is not).
    4. Update the `resolve` mutation's `mutationFn` to destructure `{ redlineId, action, tier, docName, baseVersionId, documentState }` and build the payload via `buildResolvePayload({ action, tier }, { docName, baseVersionId, documentState })`. Replace the existing swallow-only `onError` with `onError: (error, variables) => { if (isVersionConflict(error) && variables?.docName) { invalidate(); qc.invalidateQueries({ queryKey: ["collab-file-versions", variables.docName] }); } if (import.meta.env.DEV) console.warn(...) }` — keep the DEV warn, but now the error also propagates to any per-call `onError` the caller supplies via `.mutate(vars, { onError })` (TanStack Query calls both).
    5. Add a new `undo` mutation (`useMutation<unknown, unknown, UndoRedlineInput>`, `mutationKey: ["redline-undo", resource, documentId]`) whose `mutationFn` throws `new Error("Redline turn is not available for this role.")` when `!base` (matching `sendTurn`/`finalize`'s pattern — NOT `resolve`'s silent `return null`, since undo is a deliberate user action needing feedback), otherwise POSTs to `` `${base}/ai/redline-suggestions/${redlineId}/undo` `` with `buildUndoPayload({ docName, baseVersionId })`. Give it the same 409 `onError` handling as `resolve`.
    6. Return `undo` alongside `resolve` in the hook's return object.
    7. Update the file's top-of-file doc comment (the endpoint list) to add the new `.../ai/redline-suggestions/{redlineId}/undo` endpoint.

    In `useRedlineTurn.test.ts`, add the test cases from `<behavior>` as new `describe` blocks importing `buildResolvePayload`, `buildUndoPayload`, `isVersionConflict` from `./useRedlineTurn` — no hook rendering/React Query harness needed, matching the file's existing style.
  </action>
  <verify>
    <automated>npx vitest run src/pages/CollaborationToolPage/collab/useRedlineTurn.test.ts</automated>
  </verify>
  <done>All existing tests plus the 8 new cases in `<behavior>` pass; `useRedlineTurn.ts` exports `buildResolvePayload`, `buildUndoPayload`, `isVersionConflict`, `UndoRedlineInput`; the hook's return value includes both `resolve` and `undo`.</done>
</task>

<task type="auto">
  <name>Task 2: Wire resolve/undo call sites and add the Undo UI trigger</name>
  <files>src/pages/CollaborationToolPage/index.tsx, src/pages/CollaborationToolPage/components/SidebarPanel.tsx, src/pages/CollaborationToolPage/components/AiSuggestionsPanel.tsx</files>
  <action>
    In `index.tsx`:
    1. Import `isVersionConflict` alongside the existing `useRedlineTurn` import from `./collab/useRedlineTurn`.
    2. In `handleApproveAi`, change the existing `redlineTurn.resolve.mutate({ redlineId: item.redline.redlineId, action: "modified", tier })` call to also pass `docName` and `baseVersionId: fileVersionsQuery.data?.activeVersionId ?? null` in the payload, plus a second `.mutate(vars, { onError })` argument: `onError: (error) => { if (isVersionConflict(error)) toastHandler.error("Redline", "This document changed since you loaded it. Reload the latest version, then try again."); }`. Add `docName` and `fileVersionsQuery.data?.activeVersionId` to the `useCallback` dependency array.
    3. Apply the identical treatment to `handleDismissAi`'s `redlineTurn.resolve.mutate({ redlineId, action: "rejected" })` call (same payload additions, same `onError`, same dependency array additions).
    4. Add a new `handleUndoAi` `useCallback((item: AiItem) => { ... }, [docName, fileVersionsQuery.data?.activeVersionId, redlineTurn, toastHandler])`: return early if `redlineTurn.isLocked`; otherwise call `redlineTurn.undo.mutate({ redlineId: item.redline.redlineId, docName, baseVersionId: fileVersionsQuery.data?.activeVersionId ?? null }, { onSuccess: () => { flip the matching `aiItems` entry's `state` back to `"pending"` via the same `setAiItems((prev) => prev.map(...))` pattern used elsewhere; toastHandler.success("Redline", "Resolution undone."); }, onError: (error) => toastHandler.error("Undo redline", isVersionConflict(error) ? "This document changed since the resolution. Reload the latest version and try again." : (error as ApiResponseError)) })`.
    5. Pass `onAiUndo={handleUndoAi}` to the existing `<SidebarPanel .../>` element (alongside the existing `onAiApprove`/`onAiDismiss` props).

    In `SidebarPanel.tsx`:
    6. Add `onAiUndo?: (item: AiItem) => void;` to `SidebarPanelProps` next to `onAiDismiss`, destructure it in the component, and forward it as `onUndo={onAiUndo}` to `<AiSuggestionsPanel .../>`.

    In `AiSuggestionsPanel.tsx`:
    7. Add `onUndo?: (item: Item) => void;` to both `AiSuggestionsPanelProps` and `SuggestionCardProps`. Thread it from the panel component down into `<SuggestionCard onUndo={onUndo} .../>`.
    8. Inside `SuggestionCard`'s `!isPending` branch (the block currently rendering only the "Replaced"/"Dismissed" label), add an Undo button next to that label — rendered only when `onUndo` is provided, `disabled={!isMyTurn}`, `title={isMyTurn ? undefined : "Waiting for your turn"}`, `onClick={(e) => { e.stopPropagation(); onUndo(item); }}` (stopPropagation matches the card's existing focus-on-click behavior), styled consistently with the existing Dismiss button's disabled/enabled Tailwind classes.
  </action>
  <verify>
    <automated>npx vitest run src/pages/CollaborationToolPage && npx tsc -b</automated>
  </verify>
  <done>`handleApproveAi`/`handleDismissAi` payloads include `docName` and `baseVersionId`; a 409 from either surfaces a toast instead of failing silently; the AI Polish panel shows an "Undo" control on already-resolved (approved/dismissed) cards that is disabled+tooltipped when `!isMyTurn` and, on success, flips the card back to `pending`; `npx tsc -b` reports no new type errors; existing CollaborationToolPage vitest files (CommentMark/DocumentViewer/EditorPanelImport/VersionHistoryModal) still pass unmodified.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser (client) -> BE resolve/undo endpoints | Client supplies `docName`/`baseVersionId` (and, when available, `documentState`) as advisory version hints; BE is authoritative and independently verifies them server-side per the spec ("The backend verifies baseVersionId... returns 409" / undo's turn-ownership + version-match checks). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|------------------|
| T-260724onj-01 | Tampering | resolve/undo request body (`docName`, `baseVersionId`) | accept | Client-supplied version hints are advisory only — the BE independently verifies the active version and negotiation-turn ownership server-side and returns 409 on any mismatch; the FE cannot bypass server-side enforcement by sending a fabricated value. |
| T-260724onj-02 | Information Disclosure | `documentState` field (base64 Yjs state, when populated) | accept | Not populated by any call site in this plan (see Scoping note) — no new data leaves the client. If a future phase wires it from a live Y.Doc, it travels over the existing authenticated HTTPS channel already used for all other collab traffic, no new exposure surface. |
</threat_model>

<verification>
- `npx vitest run src/pages/CollaborationToolPage/collab/useRedlineTurn.test.ts` passes (existing `redlineSideFromRole` tests + new payload-builder/conflict-detection tests).
- `npx vitest run src/pages/CollaborationToolPage` passes (no regressions in CommentMark/DocumentViewer/EditorPanelImport/VersionHistoryModal tests).
- `npx tsc -b` reports no new type errors.
- Grep confirms `docName` and `baseVersionId` both appear in the resolve mutation's payload construction in `useRedlineTurn.ts` (not just the type definition).
- Do NOT run a bare `npx vitest run` across the whole suite (memory: vitest scans stale `.claude/worktrees` and can produce unrelated failures) — scope every run to the paths above.
</verification>

<success_criteria>
- Every resolve/undo POST body sent from `index.tsx` includes `docName` and `baseVersionId` alongside the existing `action`/`tier` fields.
- A 409 from either endpoint triggers a user-visible toast and invalidates the stale turn + file-versions query caches — it no longer disappears into a DEV-only console warning.
- A previously-approved or previously-dismissed suggestion card in the AI Polish panel exposes a working, turn-gated Undo control wired to the new BE endpoint.
- No new Yjs wiring was introduced for the TipTap/Yoopta escape-hatch editors or `useCollabProvider.ts` — `documentState` remains an optional, currently-unpopulated field per the documented scoping note.
</success_criteria>

<output>
After completion, create `.planning/quick/260724-onj-wire-redline-resolve-undo-be-spec-update/260724-onj-SUMMARY.md`
</output>
