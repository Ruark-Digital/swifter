## Task

Run an actual browser-based QA pass against the CollaborationToolPage changes in this swifter repo at `C:\Users\HomePC\Documents\GitHub\swifter`. The previous agent stopped at a seeded-data block instead of driving the browser through to completion. You must complete the test: drive the browser, capture screenshots, verify the editor mounts, the comments API is hit, the AI Polish panel opens, and the WebSocket handshake includes the expected `doc` + `token` query params.

If the seeded test accounts have no contracts (the blocker that stopped the previous run), CREATE one through the UI first (Sidebar → Contract Management → New/Create Contract button → walk the wizard → upload a document on the documents step). Then navigate to that contract's Documents tab and click "Edit in Collaboration Tool". Treat seeding as part of the QA task — do not give up because data is missing.

## Context

The CollaborationToolPage at `src/pages/CollaborationToolPage/` was just modified to wire three new pieces of the v2.3.0 swagger API:

1. **Comments API** — new `collab/useFileComments.ts` (GET/POST `/file-comment/{fileId}` with rich-metadata JSON sentinel inside the `text` field).
2. **Redline-suggestion API** — `collab/useAiRedlineSuggestions.ts` rewritten to be role-aware (manager/approver/vendor/user) and support both contract + msa-contract, parsing the new swagger response shape `{ summary, riskLevel, overallSuggestion, redlineAnalysis: [{redlineId, assessment, suggestion, riskLevel}] }`.
3. **WebSocket handshake** — `collab/useYooptaYjs.ts` now forwards `token` + explicit `doc` query via y-websocket's `params` option (per swagger `/collab?doc=...&token=...` spec), avoiding the previous double-`?` URL mutation bug.

Also touched:
- `components/EditorPanel.tsx` (reads `msaContractId` query, approve handler only reverts on `reject` verdict)
- `components/AiSuggestionsPanel.tsx` (renders new `assessment` + colored `suggestion` enum pill + `riskLevel` badge)
- `index.tsx` (reads `?fileId=…` query; when present comments load + save via API, otherwise localStorage)

The dev server is already running on `http://localhost:5173` (vite). Do not start a second one.

## Relevant Files

- `src/pages/CollaborationToolPage/index.tsx` — entry component, reads query params (`contractId`, `fileId`, `doc`, `wsUrl`, `msaContractId`).
- `src/pages/CollaborationToolPage/collab/useFileComments.ts` — comments API hook (NEW).
- `src/pages/CollaborationToolPage/collab/useAiRedlineSuggestions.ts` — redline AI hook (rewritten, role-aware).
- `src/pages/CollaborationToolPage/collab/useYooptaYjs.ts` — Yjs/y-websocket setup, token via params.
- `src/pages/CollaborationToolPage/components/EditorPanel.tsx` — main editor + AI button.
- `src/pages/CollaborationToolPage/components/AiSuggestionsPanel.tsx` — AI suggestions UI.
- `src/pages/ContractManagementPage/components/DocumentItem.tsx` lines 53-63 — the ONLY UI entry point to `/collaboration-tool` is the "Edit in Collaboration Tool" button on a contract document row.
- `.qa/TESTING.md` — QA contract with login credentials and navigation rules. READ IT FIRST.
- `.qa/scripts/collab-tool-qa.mjs` — Playwright driver I authored. Reusable. Currently fails at the "no seeded contracts" step. Extend or rewrite as you see fit.
- `.qa/screenshots/` — drop new screenshots here as evidence.
- `.qa/reports/` — drop JSON reports here.

## Current State

- TypeScript compiles clean (`npx tsc --noEmit -p tsconfig.app.json` passes).
- Code changes are uncommitted edits on branch `phase2-bug-local-fixes`.
- Dev server is running and HMR has accepted all changes.
- Browser tests have NOT been completed — that's your job.

## What Was Tried

1. **Logged in as Contract Manager** (`adediran.dbs+cm@gmail.com / password`) → dashboard renders, sidebar OK, but `All Contracts: 0`. No contracts to open.
2. **Logged in as Company Admin** (`adediran.dbs@gmail.com / password`) → same. Contract list shows skeleton placeholders that never resolve to rows.
3. **Stopped and asked the user** which account had seeded data. The user pushed back: "You didn't actually use the browser to test it" — they want you to complete the test by creating the data if needed, not give up.

## Decisions

- The browser-qa skill rule "never type a URL directly to reach a feature" still applies — navigate via the UI. The collaboration tool's only entry is the "Edit in Collaboration Tool" button on a contract document row, so you must first ensure a contract with a document exists in the UI.
- Use Playwright via `@playwright/test` (already in package.json devDependencies). Headless is fine.
- Evidence requirement: every claim ("editor mounts", "WS attempts include doc=", "comments tab renders") must have a screenshot path in the final report. No screenshot = no pass.
- Pre-existing console warnings (Forge library prop warnings about `enhancedValidationState`, `validationProgress`, SVG attribute case warnings, TableRow missing-key) are NOT regressions from these changes — filter them out of the failure list but include them in the report under "pre-existing noise".

## Acceptance Criteria

- [ ] Browser launched via Playwright; screenshots captured at each milestone (post-login, contract-list, contract-detail, documents-tab, collab-tool-loaded, ai-panel-open, comments-tab-active).
- [ ] At least one contract created + one document uploaded through the UI (if no seeded data exists).
- [ ] Reached `/collaboration-tool` via the "Edit in Collaboration Tool" button — not via direct URL.
- [ ] Verified the Yoopta editor mounts (selector `.yoopta-editor` or `.ct-editor-canvas` present).
- [ ] Captured the WebSocket connection URL — it MUST contain both `doc=` AND `token=` query params (this is the swagger compliance check for `useYooptaYjs.ts`).
- [ ] Clicked AI Polish button — panel opened (verify "AI Polish" header text or panel visible).
- [ ] Clicked Comments tab in sidebar — no crash, comments feed renders (empty is OK).
- [ ] Verified the network panel: `/file-comment/{fileId}` request fired when fileId is present in query.
- [ ] Verified the network panel: a POST to `…/ai/redline-suggestions` fires when AI panel runs (or document the absence if no redlines exist).
- [ ] Wrote a final JSON report at `.qa/reports/collaboration-tool-{timestamp}.json` and a markdown summary report to stdout.
- [ ] Final report includes status, screenshots, WS URLs captured, network calls of interest, console errors (filtered).

## Constraints

- DO NOT type `http://localhost:5173/collaboration-tool?…` directly into the address bar — navigate via the UI.
- DO NOT modify the source code under `src/pages/CollaborationToolPage/` to make tests pass — the code under test must stay as-is.
- DO NOT modify routes, auth guards, or nav config to shortcut access.
- DO NOT bypass auth by injecting tokens — use the login form with credentials from `.qa/TESTING.md` Section 2.
- DO NOT skip the screenshot evidence — every milestone needs a `.png` saved under `.qa/screenshots/`.
- DO NOT mark anything PASS without browser evidence. Code-only review does not count.
- If genuinely blocked (e.g. backend API down, login fails for all accounts), capture a screenshot of the blocker and report status `blocked` with a specific question. Don't silently give up.

## Environment Notes

- Working dir: `C:\Users\HomePC\Documents\GitHub\swifter`
- OS: Windows. Bash via Git Bash. Node.js available. pnpm in use (`pnpm dev` started the server).
- `.qa/TESTING.md` Section 2 lists 13 test accounts with role and accessible pages.
- The dev server is on port 5173 (vite default). Don't restart it.
- WebSocket env: `VITE_YWS_URL` may or may not be set. If unset, `useYooptaYjs.ts` falls back to `ws://localhost:1234`. Both are acceptable — you're verifying the query params (`doc`, `token`), not the host.
- For "fake fileId" tests, you can append `&fileId=507f1f77bcf86cd799439011` to the URL after the editor is open (this is OK because you're modifying the route AFTER reaching it via UI). The backend will 404 the comment GET — verify the UI doesn't crash on the 404.

## Final Output Format

Print a markdown report at the end with:
- ✅/❌ per acceptance criterion
- Paths to all screenshots
- Captured WS URLs
- Network calls of interest (file-comment, ai/redline-suggestions)
- Filtered console errors (excluding pre-existing Forge/SVG/TableRow noise)
- Any console errors that ARE attributable to the new changes (these are bugs)
- Overall status: PASS / FAIL / BLOCKED
