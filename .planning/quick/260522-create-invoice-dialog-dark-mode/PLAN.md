---
status: in-progress
date: 2026-05-22
slug: create-invoice-dialog-dark-mode
---

# Quick task 260522 — Create Invoice dialog dark-mode pass

## Why
User reports the Create Invoice dialog (and its nested Complete Invoice
sub-dialog) renders light-mode panels and invisible labels when the app
runs in `dark` class. Same root cause as ReleaseHoldbackDialog (Follow-up
leak #2 in `~/.claude/projects/.../memory/project_contract_mgmt_dark_mode_260521.md`):
dialog inner sub-components use raw `bg-white` and `text-[#0F0F0F]`
without dark variants.

## File
`src/pages/ContractManagementPage/components/CreateInvoiceDialog.tsx`

## Sections to patch
1. **Footer** (line 141-163) — sticky bg-white, dark-divider, Back button
2. **InvoiceInputRow** (line 178-247) — grid borders, index/plus/total text
3. **CompleteInvoiceDialog** (line 332-410) — items wrapper bg-white, header/divider/footer borders, Add More / Total / Back button text
4. **Radio labels** (line 455, 459) — Manual / Upload File Labels need explicit dark text
5. **UploadElement** (line 465-479) — same pattern as ReleaseHoldback
6. **FilesListItem** (line 491-518) — same pattern as ReleaseHoldback
7. **InvoiceComponent inactive trigger** (line 549-557) — brand-blue plus icon + label
8. **Main DialogTitle** (line 1006) — Create/Edit Invoice header

## Token map (already established in prior dark-mode work)
- `bg-white` → + `dark:bg-slate-900` (containers) / `dark:bg-slate-800` (cards inside dialog)
- `border-[#E5E7EB]` → + `dark:border-slate-700`
- `divide-[#E5E7EB]` → + `dark:divide-slate-700`
- `text-[#0F0F0F|#111827]` → + `dark:text-slate-100`
- `text-[#6B7280|#9CA3AF]` → + `dark:text-slate-400`
- `text-[#2A4467]` (brand) → + `dark:text-blue-300`
- `bg-[#F3F4F6]` (button surface) → + `dark:bg-slate-800`
- `bg-[#EAF1FB]` (icon disc) → + `dark:bg-slate-700`

## Verification
- `npx tsc --noEmit` clean
- Manual: open Create Invoice with `dark` toggle, scroll the dialog, also open Complete Invoice sub-dialog
- No runtime changes — pure Tailwind class additions
