## What I found
- There is currently **no Business Divisions page/route** in the app.
- Phase 2 API docs include Business Division endpoints:
  - `GET /manager/business-division/stats`
  - `GET /manager/business-division?page&limit&search`
  - `POST /manager/business-division` with payload `{ name, location }`
- The dashboard shell (sidebar/header/footer) already exists and is role-aware; however:
  - Sidebar’s `company_admin` navigation **does not include Business Divisions**.
  - Header title mapping **does not include** a Business Divisions route.
- Note: docs list `x-roles` for create division as `contract_manager` + `procurement` (not `company_admin`). We can still implement the calls; if backend enforces this, non-allowed roles will get 403.

## UI Implementation (Pixel-matched to the provided Empty State)
1. Create a new page at `src/pages/BusinessDivisionsPage/index.tsx` rendered inside the existing dashboard layout.
2. Implement the page content to match the screenshot:
   - Internal page heading “Business Divisions”.
   - Right-aligned actions: `Export` (outline) and `Create Division` (primary).
   - Stats card: “All Business Divisions” + count.
   - Empty state block centered: icon, “No Division Yet”, and a `Create Division` button.
3. Use the existing design system (shadcn components + Tailwind) and match spacing/typography/colors to the screenshot.
4. Add SEO metadata via `<SEOWrapper />` (private route: `noindex, nofollow`).

## Access Control (Company Admin only)
1. Gate the page by role:
   - If user role is not `company_admin`, redirect to `/dashboard`.
2. Keep the route inside the authenticated dashboard router, but hide nav entry from non-company-admin users.

## API Layer + React Query Wiring
1. Add a small API module (page-scoped) `src/pages/BusinessDivisionsPage/api/businessDivisionApi.ts` that uses:
   - `getRequest` / `postRequest` from `src/lib/axiosInstance.ts` (never call axios instance directly).
2. Implement:
   - `getDivisionStats()` -> `GET /manager/business-division/stats` returning `{ totalDivisions }`.
   - `listDivisions({ page, limit, search })` -> `GET /manager/business-division` returning `{ docs, totalDocs, page, limit, totalPages }`.
   - `createDivision({ name, location })` -> `POST /manager/business-division`.
3. In the page:
   - `useQuery` for stats.
   - `useQuery` for list (supports pagination/search).
   - `useMutation` for create; on success invalidate both queries and show a toast.

## Create Division Dialog
1. Add `CreateDivisionDialog` component under `src/pages/BusinessDivisionsPage/components/`.
2. Use the project’s form stack (Forge + yup) with exact payload schema:
   - Fields: `name` (required), `location` (required).
3. Submit via `POST /manager/business-division`; handle errors via `useToastHandler`.

## Export
- Implement the Export button behavior as **client-side CSV export** of the currently loaded divisions list (disabled when list is empty). This avoids inventing any backend endpoint.

## Routing + Navigation Updates
1. Add a new dashboard route:
   - `/dashboard/business-divisions` -> `<BusinessDivisionsPage />` wrapped by `<ProtectedRoute>`.
2. Update sidebar navigation for `company_admin` to include:
   - `Business Divisions` linking to `/dashboard/business-divisions` (and keep ordering aligned with screenshot as closely as possible).
3. Update header title mapping to return “Business Divisions” when path is `/dashboard/business-divisions`.

## Assets
- If exact SVGs are needed for pixel-match, copy the relevant Figma-exported icons into `/public/assets/` and reference them from the page (per project rules). Otherwise, use Lucide equivalents.

## Verification
- Ensure TypeScript + lint pass:
  - `pnpm -s build`
  - `pnpm -s lint`
- Smoke-check the route renders for `company_admin`, redirects for other roles, and create division triggers refetch.
