---
phase: 4
name: multi-role-access
wave: 1
depends_on: []
requirements: [ROLE-01, ROLE-02, ROLE-03]
files_modified:
  - src/hooks/useUserRole.ts
  - src/hooks/useActiveRole.ts
  - src/layouts/Header.tsx
  - src/components/layouts/RoleSwitcher/index.tsx
  - src/pages/UserManagementPage/components/CreateUserDialog.tsx
  - src/pages/UserManagementPage/components/EditUserDialog.tsx
  - src/pages/AdminManagementPage/components/EditUserDialog.tsx
  - src/types (User type: add roles)
autonomous: false
---

# Phase 4 — Multi-Role Access (QA #177)

**Source of truth:** `.qa/PROPOSAL-177-combined-access.md` (design) + memory `project_qa177_multirole_be_shipped_shape` (verified BE shape).

**Model chosen:** hold-many, act-as-one. The BE assigns a *set* of roles; the FE keeps operating as ONE **active role** (switchable from the header) so every downstream single-role guard, dashboard, and `/manager`-vs-`/approver`-vs-`/vendor` API dispatch works unchanged.

**BE shape (identity service, `docs (1).json` v2.3.0):** `User.roles: string[]` (min 1, **max 2**) alongside legacy `role`. Valid pairs fixed by BE: **approver/evaluator** OR **contract_manager/procurement**. `POST /onboarding/add-user` + `PUT /users/{id}` + `PUT /users/` accept `roles: string[]`; `GET /onboarding/roles` is the catalog; `GET /users/me` carries roles.

**Known ambiguity (Task 0 resolves):** current `useUserRole` reads `user.role.name` — `role` is a *populated object* at runtime despite the schema saying `string`. So `user.roles` may be `[{name}]` objects OR bare id/slug strings. The resolver MUST be built against the real payload, not the schema.

---

## Task 0 — Verify the real `/users/me` roles shape  [BLOCKING]
`autonomous: false`

<action>
Capture a real authenticated `/users/me` response and record the exact `roles` shape: array of objects (`{name}` / `{_id,name}`) vs array of bare strings, and whether string items are Mongo ObjectIds or name-slugs ("approver"). Also record what `GET /onboarding/roles` items contain (`{name}` only, or `{_id,name}`). Probe live via Chrome js_tool (see memory `reference_live_api_probe_via_chrome_js_tool`) or use a payload the user pastes. Write the finding as a comment block at the top of the resolver in Task 1 and pick the resolution strategy accordingly (no id→name lookup needed if items already carry `name`).
</action>

<read_first>
- src/hooks/useUserRole.ts
- .qa/PROPOSAL-177-combined-access.md
</read_first>

<acceptance_criteria>
- The actual `roles` item shape is documented (objects-with-name | id-strings | slug-strings)
- Decision recorded: resolver reads `.name` directly, OR resolves ids→names via `/onboarding/roles`
</acceptance_criteria>

---

## Task 1 — `useUserRole` active-role resolution + `useActiveRole`
Wave 1 · depends_on: [Task 0]

<action>
Add a `roles` field to the User type (array; shape per Task 0). In `useUserRole`, derive `roleSet: UserRole[]` from `user.roles` (map to names per Task 0's finding; fall back to `[user.role.name]`, else `["view_only"]`). Introduce `useActiveRole(roleSet)` in `src/hooks/useActiveRole.ts`: returns the persisted active role (localStorage keyed by user id, e.g. `activeRole:{userId}`) if still in the set, else a precedence default `company_admin > contract_manager > procurement > approver > evaluator > project_manager > vendor > view_only`; resets when the persisted value is no longer in the set. Set `userRole = activeRole` so every existing `isX`/guard/`dashboardConfig` line is UNCHANGED. Additionally expose `roles: roleSet`, `activeRole`, `setActiveRole`, and `hasMultipleRoles = roleSet.length > 1`. Preserve the existing localStorage `auth` fallback path.
</action>

<read_first>
- src/hooks/useUserRole.ts
- src/hooks/__tests__/useUserRole.test.tsx
- src/store/authSlice.ts
- src/config/dashboardConfig.ts
</read_first>

<acceptance_criteria>
- Single-role user: `userRole` === the one role; all `isX` flags identical to today (existing useUserRole.test still green)
- Multi-role user with no persisted choice: `userRole` === precedence winner of the set
- Persisted active role honored across reload; reset to precedence default when not in the set
- `hasMultipleRoles` true only when roleSet length > 1
- `npx tsc -b` exits 0
</acceptance_criteria>

---

## Task 2 — Header role switcher
Wave 2 · depends_on: [Task 1]

<action>
Create `src/components/layouts/RoleSwitcher/index.tsx`: a dropdown listing `roles` (label = human role name), current = `activeRole`; selecting one calls `setActiveRole(role)` then invalidates role-keyed React Query keys so role-scoped data refetches (use the existing `useUserQueryKey`/query-key convention — see memory `feedback_user_query_key_invalidation`). Render it in `src/layouts/Header.tsx` ONLY when `hasMultipleRoles`; single-role users see nothing (no layout shift). Match existing Header control styling (dark-mode aware).
</action>

<read_first>
- src/layouts/Header.tsx
- src/hooks/useUserRole.ts
- src/hooks/useActiveRole.ts
</read_first>

<acceptance_criteria>
- Switcher renders only when `hasMultipleRoles` (single-role: nothing added to Header)
- Selecting a role updates `activeRole` and triggers a role-scoped data refetch (query invalidation fires)
- Dark mode + existing Header spacing unaffected
- `npx tsc -b` exits 0
</acceptance_criteria>

---

## Task 3 — Multi-select role in Create/Edit user dialogs
Wave 2 · depends_on: [Task 1]

<action>
In `UserManagementPage/components/CreateUserDialog.tsx`, `UserManagementPage/components/EditUserDialog.tsx`, and `AdminManagementPage/components/EditUserDialog.tsx`: change the role field from single-select to multi-select (max 2), options from `GET /onboarding/roles`, submit `roles: string[]` (send role ids/values per Task 0). Enforce the allowed pairs in the UI — permit a second selection only if it forms `approver+evaluator` or `contract_manager+procurement`; otherwise disable/hint. Preserve EditUserDialog's existing `_id`-vs-`name` prefill mapping (memory `feedback_edituser_role_prefill_id_vs_name`) for the multi-select values. Keep accepting/ coercing a single role during the BE transition window.
</action>

<read_first>
- src/pages/UserManagementPage/components/CreateUserDialog.tsx
- src/pages/UserManagementPage/components/EditUserDialog.tsx
- src/pages/AdminManagementPage/components/EditUserDialog.tsx
- src/pages/UserManagementPage/__tests__/edit-user-dialog.test.tsx
</read_first>

<acceptance_criteria>
- Create/Edit submit `roles: string[]` with 1–2 entries
- UI blocks disallowed pairs (only approver+evaluator or contract_manager+procurement combinable); org-level (super_admin/company_admin) and vendor stay single
- Editing a user round-trips existing roles into the multi-select (prefill correct)
- `npx tsc -b` exits 0
</acceptance_criteria>

---

## Verification
- `npx tsc -b` clean after each task.
- `src/hooks/__tests__/useUserRole.test.tsx` and `edit-user-dialog.test.tsx` pass; add cases: multi-role precedence default, persisted active-role honored/reset, disallowed-combo blocked.
- Manual: a {evaluator, approver} user sees the switcher, can reach both the evaluator and approver dashboards by switching; a single-role user sees no switcher and behaves identically to today.

## must_haves
1. Single-role behavior is byte-for-byte unchanged (no regression to the single-role FE).
2. `userRole` remains one active role — no downstream guard/dispatch is rearchitected.
3. Allowed-pair rule enforced on both dialogs AND respected by the switcher's role set.
4. Resolver built against the verified `/users/me` shape (Task 0), not the schema.

## Deferred
- Server-side `X-Active-Role` header (open question #1 in the proposal) — FE authorizes on presentation only; BE authorizes on union. Revisit if BE wants active-role context.
- Removing legacy singular `role` once the BE back-compat window closes.
