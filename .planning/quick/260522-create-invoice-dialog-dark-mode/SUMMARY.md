---
status: complete
date: 2026-05-22
slug: create-invoice-dialog-dark-mode
---

# Quick task 260522 — Create Invoice + Submit LEM dialogs dark-mode pass

## Scope
Apply the established Contract Management dark-mode palette (see
`~/.claude/projects/.../memory/project_contract_mgmt_dark_mode_260521.md`,
"Follow-up leak #2") to two dialogs reported as unreadable in dark mode:
- Create Invoice (+ nested Complete Invoice sub-dialog) — long form with
  items grid, file uploader, radio mode switch
- Submit LEM — shorter form with title, amount, description, file uploader

Both leaked the same way: dialog inner sub-components (`UploadElement`,
`FilesListItem`, sticky footers, dialog titles) used raw `bg-white` and
`text-[#0F0F0F]` without dark variants.

## Files touched
- `src/pages/ContractManagementPage/components/CreateInvoiceDialog.tsx` — 8 sections patched:
  1. `Footer` (Back / Create Invoice sticky bar)
  2. `InvoiceInputRow` items grid (index, all 6 input borders, plus/trash buttons)
  3. `CompleteInvoiceDialog` (title, items wrapper, header/footer dividers, Add More button, Total label/value, Back button)
  4. `RadioGroupDemo` — explicit `dark:text-slate-100` on Manual / Upload File `<Label>` so they inherit a visible color
  5. `UploadElement` (border, bg, icon, label, subtext)
  6. `FilesListItem` (border, bg, icon disc + icon, filename, meta, remove button)
  7. `InvoiceComponent` inactive trigger (border + brand-blue plus icon + "Create Invoice" label)
  8. Main `DialogTitle` ("Create Invoice" / "Edit Invoice")

- `src/pages/ContractManagementPage/components/SubmitLemDialog.tsx` — 4 sections patched:
  1. `UploadElement` (border, bg, icon, label, subtext)
  2. `FilesListItem` (border, bg, icon disc + icon, filename, meta, remove button)
  3. `<h2>` "Submit LEM" title
  4. `<label>` "Upload Files" + Back button (border, bg, text, hover bg)

## Token map applied (no new tokens introduced)
- `bg-white` → + `dark:bg-slate-900` (full-width sticky/container) / `dark:bg-slate-800` (cards inside dialog)
- `border-[#E5E7EB|#9CA3AF]` → + `dark:border-slate-700` (/600 for dashed upload zone)
- `divide-[#E5E7EB]` → + `dark:divide-slate-700`
- `text-[#0F0F0F|#111827]` → + `dark:text-slate-100`
- `text-[#6B7280|#9CA3AF]` → + `dark:text-slate-400`
- `text-[#2A4467]` (brand-blue) → + `dark:text-blue-300`
- `bg-[#F3F4F6]` (button surface) → + `dark:bg-slate-800` (+ `dark:hover:bg-slate-700`)
- `bg-[#EAF1FB]` (icon disc) → + `dark:bg-slate-700`

## Verification
- `npx tsc --noEmit -p tsconfig.app.json` clean (silent exit)
- No runtime changes — pure Tailwind class additions
- Manual: dialogs render with dark surfaces, visible labels, brand-blue swapped to slate-blue-300 in dark mode

## Follow-ups left for next dark-mode reports
Other dialogs likely needing the same treatment (grep `bg-white` inside any
file defining `UploadElement` / `FilesListItem`):
- `CreateChangeDialog`, `RequestClaimDialog`, RFI dialog, NCR dialog,
  savings dialog, MSA equivalents (e.g. `MsaReleaseHoldbackDialog`),
  `SubmitRateSheetDialog` already done previously in RateSheetsTabContent.
