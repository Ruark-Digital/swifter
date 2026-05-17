# Coding Conventions

**Analysis Date:** 2026-05-17

## Naming Patterns

**Files:**
- Pages: PascalCase folder + `*.tsx` (e.g. `src/pages/ContractManagementPage/`, entry file `ContractManagementPage.tsx` or `MsaDetailPage.tsx`).
- Reusable components: PascalCase, one component per file (`src/components/layouts/DataTable/index.tsx`, `src/components/layouts/FormInputs/TextInput.tsx`).
- Hooks: camelCase starting with `use`, either as `useFoo.ts` or `useFoo/index.tsx` when bundled with helpers (`src/hooks/useUserQueryKey.ts`, `src/hooks/useToaster/index.tsx`, `src/hooks/useUserRole.ts`).
- Layouts / tab content live under `<Page>/layouts/<Thing>.tsx`; reusable in-page components under `<Page>/components/<Thing>.tsx`.
- API service modules under `src/api/...` or page-local `<Page>/api/*.ts`.
- Library helpers under `src/lib/<area>/<file>.ts` (e.g. `src/lib/forge/...`).

**Functions / variables:** camelCase. **Types / components:** PascalCase. **Constants:** SCREAMING_SNAKE only for true module-level constants; otherwise camelCase.

## Forms — `useForge` + `<Forger />`

Forms always go through the in-house `react-hook-form` wrapper at `src/lib/forge` (re-exported from its `index.ts:1`).

Standard pattern:

```tsx
import { useForge, Forge, Forger } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { TextInput, TextArea, TextDatePicker, TextSelect } from "@/components/layouts/FormInputs";

const schema = yup.object({
  name: yup.string().required("Name is required"),
  amount: yup.number().typeError("Must be a number").required(),
  dueDate: yup.date().required(),
});

type FormValues = yup.InferType<typeof schema>;

export function CreateThingForm() {
  const { control, handleSubmit } = useForge<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { name: "", amount: 0, dueDate: new Date() },
  });

  return (
    <Forge control={control} onSubmit={handleSubmit(onSubmit)}>
      <Forger name="name" component={TextInput} label="Name" />
      <Forger name="amount" component={TextCurrencyInput} label="Amount" currency="CAD" />
      <Forger name="dueDate" component={TextDatePicker} label="Due Date" />
    </Forge>
  );
}
```

**Input slot components** all live in `src/components/layouts/FormInputs/`:

| Component | File | Notes |
|-----------|------|-------|
| `TextInput` | `src/components/layouts/FormInputs/TextInput.tsx:98` | Generic text input. |
| `TextArea` | `src/components/layouts/FormInputs/TextInput.tsx:155` | Co-located with TextInput. |
| `TextDatePicker` | `src/components/layouts/FormInputs/TextInput.tsx:563` | Wraps shadcn Calendar + Popover; `showTime` adds `TextTimeInput`. |
| `TextTimeInput` | `src/components/layouts/FormInputs/TextInput.tsx:692` | HTML time input. |
| `TextCurrencyInput` | `src/components/layouts/FormInputs/TextInput.tsx:755` | Wraps `react-currency-input-field`; `currency` prop resolves Intl narrowSymbol. **Needs explicit `dark:` classes** because the underlying widget bypasses Tailwind variants. |
| `TextTagInput` | `src/components/layouts/FormInputs/TextInput.tsx:209` | `emblor` TagInput with optional `enableDetailsPopover` (key-personnel UX). |
| `TextSelect` | `src/components/layouts/FormInputs/TextSelect.tsx` | shadcn Select. |
| `TextSelectWithSearch` | `src/components/layouts/FormInputs/TextSelectWithSearch.tsx` | Combobox-style. |
| `TextMultiSelect` | (use `TextSelectWithSearch` or `TextTagInput`) | Multi-pick via tag list. |
| `TextFileInput` (uploader) | `src/components/layouts/FormInputs/TextFileInput.tsx` | Dropzone wrapper. |
| `TextCombo` | `src/components/layouts/FormInputs/TextCombo.tsx` | Combo input. |
| `ModuleToggle` | `src/components/layouts/FormInputs/ModuleToggle.tsx` | Switch wrapper. |
| `RichTextEditor` | `src/components/layouts/FormInputs/RichTextEditor.tsx` | Quill-based. |

All slot components accept `Partial<ForgerSlotProps>` (`src/lib/forge/types.ts`) so `<Forger />` can inject `value/onChange/onBlur/error`.

**Yup schemas:** Co-located with the form file or in a sibling `schema.ts`. Make fields optional via `.optional()` rather than imperatively `setError`-ing inside step validators (see `~/.claude/.../project_create_contract_milestone_optional.md`).

**Validation extras:** see `src/lib/forge/validation/` (progressive, debounced, context-aware) and `src/lib/forge/hooks/useEnhancedValidation.ts`. Use these only when stock yup resolution is insufficient.

## Data Tables — `DataTable`

Use `DataTable` from `src/components/layouts/DataTable/index.tsx:95`. It wraps `@tanstack/react-table` and accepts a `classNames` block to theme container, header, body, rows, and cells (`src/components/layouts/DataTable/index.tsx:62`).

Canonical Contract-area styling (matches dark-mode palette below, copied verbatim from `src/pages/ContractManagementPage/components/InvoiceTable.tsx:583`):

```tsx
<DataTable
  data={rows}
  columns={columns}
  options={{
    isLoading,
    totalCounts: total,
    manualPagination: true,
    pagination,
    setPagination,
  }}
  classNames={{
    container: "border border-[#E5E7EB] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900",
    tHeader:   "bg-[#F9FAFB] dark:bg-slate-800",
    tHeadRow:  "border-b border-[#E5E7EB] dark:border-slate-800",
    tBody:     "bg-white dark:bg-slate-900",
    tRow:      "border-b border-[#E5E7EB] dark:border-slate-800",
    tHead:     "px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400",
    tCell:     "px-6 py-4 text-sm text-slate-700 dark:text-slate-200",
  }}
/>
```

Pagination is **manual** (server-driven) — always pass `manualPagination: true`, `pagination`, `setPagination`, and `totalCounts`.

For expandable rows, set `enableExpanding`, `getRowCanExpand`, and `renderSubComponent` (`src/components/layouts/DataTable/index.tsx:51-57`).

## Dark-Mode Palette

Canonical reference: `~/.claude/.../memory/project_contract_dark_mode_patterns.md`.

- **Card surfaces:** `bg-white dark:bg-slate-900`.
- **Card borders / dividers:** `border-[#E5E7EB] dark:border-slate-800` (or `dark:border-slate-700` for elevated popovers).
- **Tinted "wrap" backgrounds** (status/info chunks): `bg-<color>-50 dark:bg-<color>-900/30`.
- **Body text:** `text-slate-700 dark:text-slate-200`; muted: `text-slate-500 dark:text-slate-400`.
- **Inputs:** `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500`.
- **Third-party widgets that ignore Tailwind theme:** `react-currency-input-field` and `emblor` TagInput need explicit `dark:` classes inline (see `TextInput.tsx:392`, `TextInput.tsx:819`).
- **TabsTrigger inactive state**: shadcn does not apply dark variants by default — every inactive trigger needs `dark:text-slate-400` to be readable.
- **Filter-pill tabs**: tabs used as horizontal filter pills must include `!flex-none shrink-0` to override the default `flex-1` and prevent the strip from squishing. The strip itself uses `overflow-x-auto flex gap-2`.
- **Tier / status badges**: solid pastel `bg-[#HEX] text-[#HEX] hover:bg-[#HEX]` pairs; see Status Badge Tone Pairs below.

## Status Badge Tone Pairs

Defined inline (e.g. `src/pages/ContractManagementPage/lib/holdbacks.ts`, verified by `holdbacks-status-badge.unit.spec.ts:6-31`). Reuse these tone pairs for new statuses:

| Tone | Background | Foreground | Use for |
|------|------------|------------|---------|
| Yellow | `#FEF9C3` | `#CA8A04` | Pending / In Review |
| Green  | `#EAF7EE` | `#16A34A` | Approved / Active / Success |
| Red    | `#FEE2E2` | `#DC2626` | Rejected / Failed |
| Gray   | `#F3F4F6` | `#6B7280` | Unknown / Neutral fallback |
| Blue   | `#DBEAFE` | `#1D4ED8` | Informational |

`hover:bg-<same>` keeps badges visually static on hover. Always pair `bg-` with matching `hover:bg-` of the same hex.

## Toasts

Always go through `useToastHandler` at `src/hooks/useToaster/index.tsx:4`. It wraps shadcn's `useToast` and normalizes Axios/`ApiResponseError` shapes.

```tsx
const handler = useToastHandler();
mutation.mutate(payload, {
  onSuccess: (res) => handler.success("Saved", res?.data?.message ?? "Done"),
  onError:   (err) => handler.error("Save failed", err as ApiResponseError),
});
```

Never call `toast(...)` directly from components — the error-shape normalization is the whole point.

## React Query Keys

Use `useUserQueryKey` from `src/hooks/useUserQueryKey.ts:5` to scope every query by the active user. The hook reads `useUser()` from `@/store/authSlice` and appends the user `_id` to the key array — this keeps cached data from leaking between accounts (e.g. on role switch / re-login).

```tsx
const queryKey = useUserQueryKey(["contracts", "manager", filters]);
useQuery({ queryKey, queryFn: () => api.getContracts(filters) });
```

Pass a single string or an array — the hook normalizes it.

## Role-Prefix URL Pattern

Contract / MSA / RFI / NCR / Invoice endpoints branch by current user role. Selection lives in the API client modules under `src/pages/ContractManagementPage/api/` and `src/pages/MsaPage/...`.

| Role (from `useUserRole`) | URL prefix |
|---------------------------|------------|
| `contract_manager`, `procurement` (the `isManager` group, `useUserRole.ts:54`) | `/contract/manager/...` |
| `vendor`, `project_manager` (the **`isContractVendorLike`** group — never use bare `isVendor`) | `/contract/vendor/...` |
| `approver` | `/contract/approver/...` |
| `view_only`, `company_admin`, `super_admin`, generic `user` | `/contract/user/...` |

Always derive the role using `isContractVendorLike = isVendor || isProjectManager` and `isManager = isContractManager || isProcurement`. See `~/.claude/.../memory/project_contract_role_guards.md` and `feedback_role_guards.md` — shipping a bare `isVendor` check breaks PM users.

Full route map for all four prefixes is indexed at `docs/API_DOCUMENTATION_PHASE_2.md` (memory: `reference_api_doc_phase2.md`).

## File Uploads

When persisting an uploaded file, **always read `size` as a string from the upload response** (`res.data.data[0].size`), not `file.size`. The backend's `UploadURLs.size` is already a string and the contract DTO expects a string. See `~/.claude/.../memory/feedback_file_size_string.md`.

Wrong:
```tsx
documents: files.map(f => ({ url, size: f.size, name: f.name })) // ❌ number
```

Right:
```tsx
const uploaded = await uploadFiles(files);          // -> res.data.data[]
documents: uploaded.map(u => ({ url: u.url, size: u.size, name: u.name }));
```

`Step4Form` is the canonical MSA document-upload step (`src/pages/MsaPage/.../Step4Form.tsx`) — raw `File` objects without `url` get silently dropped by `toFileMetaOrUndefined`, so always upload before submitting.

## Tabs Strip Pattern

Two different shadcn-tabs idioms:

**Content tabs** (mutually exclusive panel switcher) — default shadcn usage with `TabsList` / `TabsTrigger` / `TabsContent`. Remember to add `dark:text-slate-400` to inactive triggers.

**Filter-pill tabs** (horizontal strip of status chips):

```tsx
<Tabs value={status} onValueChange={setStatus}>
  <TabsList className="flex gap-2 overflow-x-auto bg-transparent p-0">
    {options.map(opt => (
      <TabsTrigger
        key={opt.value}
        value={opt.value}
        className="!flex-none shrink-0 rounded-full px-4 py-2 text-sm
                   data-[state=active]:bg-slate-900 data-[state=active]:text-white
                   dark:text-slate-400 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900"
      >
        {opt.label}
      </TabsTrigger>
    ))}
  </TabsList>
</Tabs>
```

`!flex-none shrink-0` is required — shadcn's default `flex-1` will otherwise stretch each pill and break the scroll strip.

## Import Organization

Loosely ordered, separated by blank lines when long:

1. External packages (`react`, `@tanstack/react-query`, `axios`, …).
2. Internal aliases via `@/...` (the only alias, mapped in `vite.config.ts:9-11`).
3. Relative imports (`./components/...`, `../api/...`).

Avoid deep relative paths; prefer `@/` once you cross more than one directory.

## Error Handling

- API calls in components/hooks return Axios-shaped responses; surface failures with `useToastHandler().error(title, err)`.
- Components should narrow `unknown` errors to `ApiResponseError` (typed in `@/types`).
- Avoid `try/catch` inside React Query `queryFn` — let the query's `onError` handle it via the toast handler.

## Comments

- Add JSDoc on exported hooks (`useUserRole.ts:6-8`) and complex helpers.
- Keep inline `// ...` comments for non-obvious branches only — never restate code.

---

*Convention analysis: 2026-05-17*
