# Responsive Audit — Findings

## Root cause (confirmed)

**Single one-line bug accounts for nearly every P0 in this report.**

`src/layouts/Sidebar.tsx:40` sets `collapsible="none"` on the shadcn `<Sidebar>`. Per `src/components/ui/sidebar.tsx:178-191`, that prop **short-circuits the `isMobile` branch entirely** — the component skips its responsive `<Sheet>` drawer rendering and unconditionally returns:

```tsx
<div className="flex h-full w-[--sidebar-width] flex-col ...">
```

`--sidebar-width` resolves to `16rem` (256px), so on a 375px viewport the sidebar consumes ~68% of the screen and main content is clipped off the right edge. Same story at 768/1024 (sidebar = 256px hard).

The mobile-drawer wiring in shadcn `Sidebar` is dead code as-shipped. The `useIsMobile` hook (`src/hooks/use-mobile.tsx:3`, threshold 768) is also irrelevant at the layout level for the same reason.

**Validated visually** for `cm × mobile × /dashboard/contract-management` (`.qa/reports/responsive/cm/mobile/route-contracts.png`): page title truncated to "Co... Ma...", stat cards clipped to "All 0 / Act 0 / Dra 0 / Sus 0", no horizontal body scroll (content unreachable, not just shifted).

### Anticipated single-PR fix

Switch `Sidebar.tsx:40` from `collapsible="none"` to `collapsible="offcanvas"`, then surface the `SidebarTrigger` in the existing `<Header>` so the drawer can open on mobile. May need:

- Confirm `Dashboard.tsx:44` `overflow-x-hidden` doesn't mask remaining table overflows after sidebar lands.
- Verify `super_admin` purple bg (`Sidebar.tsx:43`) still applies to the Sheet variant.
- Tablet/iPad decision: at 768/1024 should sidebar be inline (current) or drawer? Recommend keeping inline ≥ 1024 and drawer < 1024 (raise `useIsMobile` threshold or rely on shadcn's built-in breakpoint).

### Remaining work after the shell fix

P1 "element wider than viewport" rows pointing at `src/components/layouts/FormInputs/TextCombo.tsx:113` cluster on every list/dashboard route — likely a single component-level overflow (long placeholder/value in a Button trigger; see [[button-inline-flex-whitespace-nowrap-overflow]] in MEMORY).

Detail-tab P1s ("element wider than viewport" at all viewports including desktop 1440) imply intrinsic-min-content offenders inside tabs — most likely DataTable rows without min-w-0. Each tab gets its own audit pass once the shell fix lands and the screenshots re-baseline.

---

_Generated: 2026-05-30T03:08:25.436Z from `.qa/reports/responsive/findings.jsonl` (364 captures, 152 unique findings)._

## Summary

| Severity | Count |
|---|---|
| P0 | 64 |
| P1 | 88 |
| P2 | 0 |

### By surface family

| Family | P0 | P1 | P2 |
|---|---|---|---|
| detail-tabs | 52 | 76 | 0 |
| lists-and-dashboards | 9 | 9 | 0 |
| shell-and-dashboards | 3 | 3 | 0 |

## Severity rubric

- **P0** — page unusable: body horizontal scroll, main content clipped off-viewport, fixed element off-screen.
- **P1** — degraded: element wider than viewport, table without horizontal-scroll wrapper at narrow widths.
- **P2** — cosmetic: minor overflow within 50px of viewport edge.

## Findings

| # | Sev | Family | Route / Tab | Viewport | Role | Symptom | Suspected file:line | Screenshot |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | detail-tabs | detail-action-log → Action Log | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-action-log.png` |
| 2 | P0 | detail-tabs | detail-action-log → Action Log | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-action-log.png` |
| 3 | P0 | detail-tabs | detail-amendments → Amendments | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-amendments.png` |
| 4 | P0 | detail-tabs | detail-amendments → Amendments | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-amendments.png` |
| 5 | P0 | detail-tabs | detail-amendments → Amendments | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-amendments.png` |
| 6 | P0 | detail-tabs | detail-analytics → Analytics | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-analytics.png` |
| 7 | P0 | detail-tabs | detail-analytics → Analytics | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-analytics.png` |
| 8 | P0 | detail-tabs | detail-analytics → Analytics | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-analytics.png` |
| 9 | P0 | detail-tabs | detail-approvers → Approvers | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-approvers.png` |
| 10 | P0 | detail-tabs | detail-change-management → Change Management | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-change-management.png` |
| 11 | P0 | detail-tabs | detail-change-management → Change Management | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-change-management.png` |
| 12 | P0 | detail-tabs | detail-change-management → Change Management | ipad (1024px) | vendor | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-change-management.png` |
| 13 | P0 | detail-tabs | detail-claims → Claims | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-claims.png` |
| 14 | P0 | detail-tabs | detail-claims → Claims | tablet (768px) | approver | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/approver/tablet/tab-tab-claims.png` |
| 15 | P0 | detail-tabs | detail-claims → Claims | ipad (1024px) | approver | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/approver/ipad/tab-tab-claims.png` |
| 16 | P0 | detail-tabs | detail-clause-library → Clause Library | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-clause-library.png` |
| 17 | P0 | detail-tabs | detail-clause-library → Clause Library | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-clause-library.png` |
| 18 | P0 | detail-tabs | detail-clause-library → Clause Library | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-clause-library.png` |
| 19 | P0 | detail-tabs | detail-compliance-security → Compliance & Security | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-compliance-security.png` |
| 20 | P0 | detail-tabs | detail-compliance-security → Compliance & Security | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-compliance-security.png` |
| 21 | P0 | detail-tabs | detail-compliance-security → Compliance & Security | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-compliance-security.png` |
| 22 | P0 | detail-tabs | detail-deliverables → Deliverables | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-deliverables.png` |
| 23 | P0 | detail-tabs | detail-deliverables → Deliverables | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-deliverables.png` |
| 24 | P0 | detail-tabs | detail-deliverables → Deliverables | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-deliverables.png` |
| 25 | P0 | detail-tabs | detail-documents → Documents | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-documents.png` |
| 26 | P0 | detail-tabs | detail-documents → Documents | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-documents.png` |
| 27 | P0 | detail-tabs | detail-documents → Documents | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-documents.png` |
| 28 | P0 | detail-tabs | detail-invoice → Invoice | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-invoice.png` |
| 29 | P0 | detail-tabs | detail-invoice → Invoice | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-invoice.png` |
| 30 | P0 | detail-tabs | detail-invoice → Invoice | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-invoice.png` |
| 31 | P0 | detail-tabs | detail-kpi → KPI | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-kpi.png` |
| 32 | P0 | detail-tabs | detail-kpi → KPI | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-kpi.png` |
| 33 | P0 | detail-tabs | detail-kpi → KPI | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-kpi.png` |
| 34 | P0 | detail-tabs | detail-lem → LEM | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-lem.png` |
| 35 | P0 | detail-tabs | detail-lem → LEM | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-lem.png` |
| 36 | P0 | detail-tabs | detail-lem → LEM | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-lem.png` |
| 37 | P0 | detail-tabs | detail-ncr-log → NCR Log | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-ncr-log.png` |
| 38 | P0 | detail-tabs | detail-ncr-log → NCR Log | tablet (768px) | approver | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/approver/tablet/tab-tab-ncr-log.png` |
| 39 | P0 | detail-tabs | detail-ncr-log → NCR Log | ipad (1024px) | approver | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/approver/ipad/tab-tab-ncr-log.png` |
| 40 | P0 | detail-tabs | detail-overview → Overview | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-overview.png` |
| 41 | P0 | detail-tabs | detail-overview → Overview | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-overview.png` |
| 42 | P0 | detail-tabs | detail-overview → Overview | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-overview.png` |
| 43 | P0 | detail-tabs | detail-payment-summary → Payment Summary | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-payment-summary.png` |
| 44 | P0 | detail-tabs | detail-payment-summary → Payment Summary | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-payment-summary.png` |
| 45 | P0 | detail-tabs | detail-payment-summary → Payment Summary | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-payment-summary.png` |
| 46 | P0 | detail-tabs | detail-rate-sheets → Rate Sheets | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-rate-sheets.png` |
| 47 | P0 | detail-tabs | detail-rate-sheets → Rate Sheets | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-rate-sheets.png` |
| 48 | P0 | detail-tabs | detail-rate-sheets → Rate Sheets | ipad (1024px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-rate-sheets.png` |
| 49 | P0 | detail-tabs | detail-rfi → RFI | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-rfi.png` |
| 50 | P0 | detail-tabs | detail-rfi → RFI | tablet (768px) | approver | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/approver/tablet/tab-tab-rfi.png` |
| 51 | P0 | detail-tabs | detail-rfi → RFI | ipad (1024px) | approver | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/approver/ipad/tab-tab-rfi.png` |
| 52 | P0 | detail-tabs | detail-vendor-s-reports → Vendor’s Reports | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-vendor-s-reports.png` |
| 53 | P0 | lists-and-dashboards | contracts | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/route-contracts.png` |
| 54 | P0 | lists-and-dashboards | contracts | tablet (768px) | pm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/pm/tablet/route-contracts.png` |
| 55 | P0 | lists-and-dashboards | msa | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/route-msa.png` |
| 56 | P0 | lists-and-dashboards | projects | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/route-projects.png` |
| 57 | P0 | lists-and-dashboards | projects | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/route-projects.png` |
| 58 | P0 | lists-and-dashboards | solicitation | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/route-solicitation.png` |
| 59 | P0 | lists-and-dashboards | solicitation | tablet (768px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/tablet/route-solicitation.png` |
| 60 | P0 | lists-and-dashboards | vendor | mobile (375px) | vendor | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/vendor/mobile/route-vendor.png` |
| 61 | P0 | lists-and-dashboards | vendor | tablet (768px) | vendor | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/vendor/tablet/route-vendor.png` |
| 62 | P0 | shell-and-dashboards | dashboard | mobile (375px) | pm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/pm/mobile/route-dashboard.png` |
| 63 | P0 | shell-and-dashboards | dashboard | tablet (768px) | pm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/pm/tablet/route-dashboard.png` |
| 64 | P0 | shell-and-dashboards | profile | mobile (375px) | cm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/cm/mobile/route-profile.png` |
| 65 | P1 | detail-tabs | detail-action-log → Action Log | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/tab-tab-action-log.png` |
| 66 | P1 | detail-tabs | detail-action-log → Action Log | tablet (768px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/tablet/tab-tab-action-log.png` |
| 67 | P1 | detail-tabs | detail-action-log → Action Log | ipad (1024px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-action-log.png` |
| 68 | P1 | detail-tabs | detail-action-log → Action Log | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-action-log.png` |
| 69 | P1 | detail-tabs | detail-amendments → Amendments | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/tab-tab-amendments.png` |
| 70 | P1 | detail-tabs | detail-amendments → Amendments | tablet (768px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/tablet/tab-tab-amendments.png` |
| 71 | P1 | detail-tabs | detail-amendments → Amendments | ipad (1024px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/ipad/tab-tab-amendments.png` |
| 72 | P1 | detail-tabs | detail-amendments → Amendments | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-amendments.png` |
| 73 | P1 | detail-tabs | detail-analytics → Analytics | mobile (375px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/mobile/tab-tab-analytics.png` |
| 74 | P1 | detail-tabs | detail-analytics → Analytics | tablet (768px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/tablet/tab-tab-analytics.png` |
| 75 | P1 | detail-tabs | detail-analytics → Analytics | ipad (1024px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/ipad/tab-tab-analytics.png` |
| 76 | P1 | detail-tabs | detail-analytics → Analytics | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-analytics.png` |
| 77 | P1 | detail-tabs | detail-approvers → Approvers | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/tab-tab-approvers.png` |
| 78 | P1 | detail-tabs | detail-approvers → Approvers | tablet (768px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-approvers.png` |
| 79 | P1 | detail-tabs | detail-approvers → Approvers | ipad (1024px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-approvers.png` |
| 80 | P1 | detail-tabs | detail-approvers → Approvers | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-approvers.png` |
| 81 | P1 | detail-tabs | detail-change-management → Change Management | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/tab-tab-change-management.png` |
| 82 | P1 | detail-tabs | detail-change-management → Change Management | tablet (768px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-change-management.png` |
| 83 | P1 | detail-tabs | detail-change-management → Change Management | ipad (1024px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-change-management.png` |
| 84 | P1 | detail-tabs | detail-change-management → Change Management | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-change-management.png` |
| 85 | P1 | detail-tabs | detail-claims → Claims | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-claims.png` |
| 86 | P1 | detail-tabs | detail-claims → Claims | tablet (768px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-claims.png` |
| 87 | P1 | detail-tabs | detail-claims → Claims | ipad (1024px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-claims.png` |
| 88 | P1 | detail-tabs | detail-claims → Claims | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-claims.png` |
| 89 | P1 | detail-tabs | detail-clause-library → Clause Library | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/tab-tab-clause-library.png` |
| 90 | P1 | detail-tabs | detail-clause-library → Clause Library | tablet (768px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/tablet/tab-tab-clause-library.png` |
| 91 | P1 | detail-tabs | detail-clause-library → Clause Library | ipad (1024px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-clause-library.png` |
| 92 | P1 | detail-tabs | detail-clause-library → Clause Library | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-clause-library.png` |
| 93 | P1 | detail-tabs | detail-compliance-security → Compliance & Security | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/tab-tab-compliance-security.png` |
| 94 | P1 | detail-tabs | detail-compliance-security → Compliance & Security | tablet (768px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/tablet/tab-tab-compliance-security.png` |
| 95 | P1 | detail-tabs | detail-compliance-security → Compliance & Security | ipad (1024px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/ipad/tab-tab-compliance-security.png` |
| 96 | P1 | detail-tabs | detail-compliance-security → Compliance & Security | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-compliance-security.png` |
| 97 | P1 | detail-tabs | detail-deliverables → Deliverables | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/tab-tab-deliverables.png` |
| 98 | P1 | detail-tabs | detail-deliverables → Deliverables | tablet (768px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-deliverables.png` |
| 99 | P1 | detail-tabs | detail-deliverables → Deliverables | ipad (1024px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/ipad/tab-tab-deliverables.png` |
| 100 | P1 | detail-tabs | detail-deliverables → Deliverables | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-deliverables.png` |
| 101 | P1 | detail-tabs | detail-documents → Documents | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-documents.png` |
| 102 | P1 | detail-tabs | detail-documents → Documents | tablet (768px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/tablet/tab-tab-documents.png` |
| 103 | P1 | detail-tabs | detail-documents → Documents | ipad (1024px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/ipad/tab-tab-documents.png` |
| 104 | P1 | detail-tabs | detail-documents → Documents | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-documents.png` |
| 105 | P1 | detail-tabs | detail-invoice → Invoice | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/tab-tab-invoice.png` |
| 106 | P1 | detail-tabs | detail-invoice → Invoice | tablet (768px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/tablet/tab-tab-invoice.png` |
| 107 | P1 | detail-tabs | detail-invoice → Invoice | ipad (1024px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/ipad/tab-tab-invoice.png` |
| 108 | P1 | detail-tabs | detail-invoice → Invoice | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-invoice.png` |
| 109 | P1 | detail-tabs | detail-kpi → KPI | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/tab-tab-kpi.png` |
| 110 | P1 | detail-tabs | detail-kpi → KPI | tablet (768px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/tablet/tab-tab-kpi.png` |
| 111 | P1 | detail-tabs | detail-kpi → KPI | ipad (1024px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-kpi.png` |
| 112 | P1 | detail-tabs | detail-kpi → KPI | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-kpi.png` |
| 113 | P1 | detail-tabs | detail-lem → LEM | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-lem.png` |
| 114 | P1 | detail-tabs | detail-lem → LEM | tablet (768px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/tablet/tab-tab-lem.png` |
| 115 | P1 | detail-tabs | detail-lem → LEM | ipad (1024px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/ipad/tab-tab-lem.png` |
| 116 | P1 | detail-tabs | detail-lem → LEM | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-lem.png` |
| 117 | P1 | detail-tabs | detail-ncr-log → NCR Log | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-ncr-log.png` |
| 118 | P1 | detail-tabs | detail-ncr-log → NCR Log | tablet (768px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-ncr-log.png` |
| 119 | P1 | detail-tabs | detail-ncr-log → NCR Log | ipad (1024px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-ncr-log.png` |
| 120 | P1 | detail-tabs | detail-ncr-log → NCR Log | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-ncr-log.png` |
| 121 | P1 | detail-tabs | detail-overview → Overview | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-overview.png` |
| 122 | P1 | detail-tabs | detail-overview → Overview | tablet (768px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/tablet/tab-tab-overview.png` |
| 123 | P1 | detail-tabs | detail-overview → Overview | ipad (1024px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/ipad/tab-tab-overview.png` |
| 124 | P1 | detail-tabs | detail-overview → Overview | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-overview.png` |
| 125 | P1 | detail-tabs | detail-payment-summary → Payment Summary | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/tab-tab-payment-summary.png` |
| 126 | P1 | detail-tabs | detail-payment-summary → Payment Summary | tablet (768px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/tablet/tab-tab-payment-summary.png` |
| 127 | P1 | detail-tabs | detail-payment-summary → Payment Summary | ipad (1024px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/ipad/tab-tab-payment-summary.png` |
| 128 | P1 | detail-tabs | detail-payment-summary → Payment Summary | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-payment-summary.png` |
| 129 | P1 | detail-tabs | detail-rate-sheets → Rate Sheets | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-rate-sheets.png` |
| 130 | P1 | detail-tabs | detail-rate-sheets → Rate Sheets | tablet (768px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/tablet/tab-tab-rate-sheets.png` |
| 131 | P1 | detail-tabs | detail-rate-sheets → Rate Sheets | ipad (1024px) | cm | element wider than viewport | src/components/layouts/AIChatWidget/components/MessageContainer.tsx:168 | `.qa/reports/responsive/cm/ipad/tab-tab-rate-sheets.png` |
| 132 | P1 | detail-tabs | detail-rate-sheets → Rate Sheets | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-rate-sheets.png` |
| 133 | P1 | detail-tabs | detail-rfi → RFI | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-rfi.png` |
| 134 | P1 | detail-tabs | detail-rfi → RFI | tablet (768px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-rfi.png` |
| 135 | P1 | detail-tabs | detail-rfi → RFI | ipad (1024px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-rfi.png` |
| 136 | P1 | detail-tabs | detail-rfi → RFI | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-rfi.png` |
| 137 | P1 | detail-tabs | detail-vendor-s-reports → Vendor’s Reports | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/tab-tab-vendor-s-reports.png` |
| 138 | P1 | detail-tabs | detail-vendor-s-reports → Vendor’s Reports | tablet (768px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/tablet/tab-tab-vendor-s-reports.png` |
| 139 | P1 | detail-tabs | detail-vendor-s-reports → Vendor’s Reports | ipad (1024px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/ipad/tab-tab-vendor-s-reports.png` |
| 140 | P1 | detail-tabs | detail-vendor-s-reports → Vendor’s Reports | desktop (1440px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/desktop/tab-tab-vendor-s-reports.png` |
| 141 | P1 | lists-and-dashboards | contracts | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/route-contracts.png` |
| 142 | P1 | lists-and-dashboards | contracts | tablet (768px) | pm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/pm/tablet/route-contracts.png` |
| 143 | P1 | lists-and-dashboards | msa | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/route-msa.png` |
| 144 | P1 | lists-and-dashboards | projects | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/route-projects.png` |
| 145 | P1 | lists-and-dashboards | projects | tablet (768px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/tablet/route-projects.png` |
| 146 | P1 | lists-and-dashboards | solicitation | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/route-solicitation.png` |
| 147 | P1 | lists-and-dashboards | solicitation | tablet (768px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/tablet/route-solicitation.png` |
| 148 | P1 | lists-and-dashboards | vendor | mobile (375px) | vendor | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/vendor/mobile/route-vendor.png` |
| 149 | P1 | lists-and-dashboards | vendor | tablet (768px) | vendor | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/vendor/tablet/route-vendor.png` |
| 150 | P1 | shell-and-dashboards | dashboard | mobile (375px) | pm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/pm/mobile/route-dashboard.png` |
| 151 | P1 | shell-and-dashboards | dashboard | tablet (768px) | pm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/pm/tablet/route-dashboard.png` |
| 152 | P1 | shell-and-dashboards | profile | mobile (375px) | cm | element wider than viewport | src/components/layouts/FormInputs/TextCombo.tsx:113 | `.qa/reports/responsive/cm/mobile/route-profile.png` |

## Surface-family breakdown

### detail-tabs

P0: **52**, P1: **76**, P2: **0**

Top offenders:

- **P0** `detail-action-log → Action Log` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `detail-action-log → Action Log` @ tablet: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `detail-amendments → Amendments` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `detail-amendments → Amendments` @ tablet: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `detail-amendments → Amendments` @ ipad: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `detail-analytics → Analytics` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `detail-analytics → Analytics` @ tablet: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `detail-analytics → Analytics` @ ipad: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `detail-approvers → Approvers` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `detail-change-management → Change Management` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport

Suggested follow-up: `260530-responsive-detail-tabs` — sized from above, expect 128 P0/P1 fixes.

### lists-and-dashboards

P0: **9**, P1: **9**, P2: **0**

Top offenders:

- **P0** `contracts` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `contracts` @ tablet: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `msa` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `projects` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `projects` @ tablet: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `solicitation` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `solicitation` @ tablet: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `vendor` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `vendor` @ tablet: main content clipped — desktop sidebar/layout at narrow viewport
- **P1** `contracts` @ mobile: element wider than viewport (src/components/layouts/FormInputs/TextCombo.tsx:113)

Suggested follow-up: `260530-responsive-lists-and-dashboards` — sized from above, expect 18 P0/P1 fixes.

### shell-and-dashboards

P0: **3**, P1: **3**, P2: **0**

Top offenders:

- **P0** `dashboard` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `dashboard` @ tablet: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `profile` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P1** `dashboard` @ mobile: element wider than viewport (src/components/layouts/FormInputs/TextCombo.tsx:113)
- **P1** `dashboard` @ tablet: element wider than viewport (src/components/layouts/FormInputs/TextCombo.tsx:113)
- **P1** `profile` @ mobile: element wider than viewport (src/components/layouts/FormInputs/TextCombo.tsx:113)

Suggested follow-up: `260530-responsive-shell-and-dashboards` — sized from above, expect 6 P0/P1 fixes.

## Known traps to verify during fixes

- [[button-inline-flex-whitespace-nowrap-overflow]] — long content in shadcn Button trigger forces horizontal scroll on parent dialog.
- [[radix-tabs-force-mount-trap]] — `forceMount` keeps tab panels in DOM; can leak as stray empty section on narrow widths.
- [[fileinput-dropzone-dark-mode-pattern]] — FileInput overrides often regress; check at every viewport after dark-mode style edits.
- [[react-baseline-warnings-260528]] — console errors counted here include baseline noise (validation HOC prop spreading); not all are responsive issues.

## Non-fixes that look like fixes

- Adding `overflow-x: hidden` on `<body>` will silence P0 "body scroll" but **hide** clipped content. Fix the layout root instead.
- Wrapping every table in `overflow-x-auto` solves P1 but yields a terrible mobile UX; prefer card-view per [[plan: detail-tabs]] but only after P0s clear.
