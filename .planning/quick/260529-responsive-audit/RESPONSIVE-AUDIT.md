# Responsive Audit — Findings

_Generated: 2026-05-30T05:01:36.886Z from `.qa/reports/responsive/findings.jsonl` (288 captures, 66 unique findings)._

## Summary

| Severity | Count |
|---|---|
| P0 | 7 |
| P1 | 58 |
| P2 | 1 |

### By surface family

| Family | P0 | P1 | P2 |
|---|---|---|---|
| detail-tabs | 1 | 45 | 0 |
| lists-and-dashboards | 5 | 10 | 1 |
| shell-and-dashboards | 1 | 3 | 0 |

## Severity rubric

- **P0** — page unusable: body horizontal scroll, main content clipped off-viewport, fixed element off-screen.
- **P1** — degraded: element wider than viewport, table without horizontal-scroll wrapper at narrow widths.
- **P2** — cosmetic: minor overflow within 50px of viewport edge.

## Findings

| # | Sev | Family | Route / Tab | Viewport | Role | Symptom | Suspected file:line | Screenshot |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | detail-tabs | detail-compliance-security → Compliance & Security | mobile (375px) | vendor | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-compliance-security.png` |
| 2 | P0 | lists-and-dashboards | contracts | mobile (375px) | vendor | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/vendor/mobile/route-contracts.png` |
| 3 | P0 | lists-and-dashboards | msa | mobile (375px) | vendor | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/vendor/mobile/route-msa.png` |
| 4 | P0 | lists-and-dashboards | projects | mobile (375px) | approver | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/approver/mobile/route-projects.png` |
| 5 | P0 | lists-and-dashboards | solicitation | mobile (375px) | pm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/pm/mobile/route-solicitation.png` |
| 6 | P0 | lists-and-dashboards | vendor | mobile (375px) | pm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/pm/mobile/route-vendor.png` |
| 7 | P0 | shell-and-dashboards | dashboard | mobile (375px) | pm | main content clipped — desktop sidebar/layout at narrow viewport | — | `.qa/reports/responsive/pm/mobile/route-dashboard.png` |
| 8 | P1 | detail-tabs | detail-amendments → Amendments | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-amendments.png` |
| 9 | P1 | detail-tabs | detail-amendments → Amendments | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-amendments.png` |
| 10 | P1 | detail-tabs | detail-amendments → Amendments | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-amendments.png` |
| 11 | P1 | detail-tabs | detail-analytics → Analytics | mobile (375px) | approver | element wider than viewport | — | `.qa/reports/responsive/approver/mobile/tab-tab-analytics.png` |
| 12 | P1 | detail-tabs | detail-analytics → Analytics | tablet (768px) | approver | element wider than viewport | — | `.qa/reports/responsive/approver/tablet/tab-tab-analytics.png` |
| 13 | P1 | detail-tabs | detail-analytics → Analytics | ipad (1024px) | approver | element wider than viewport | — | `.qa/reports/responsive/approver/ipad/tab-tab-analytics.png` |
| 14 | P1 | detail-tabs | detail-change-management → Change Management | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-change-management.png` |
| 15 | P1 | detail-tabs | detail-change-management → Change Management | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-change-management.png` |
| 16 | P1 | detail-tabs | detail-change-management → Change Management | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-change-management.png` |
| 17 | P1 | detail-tabs | detail-claims → Claims | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-claims.png` |
| 18 | P1 | detail-tabs | detail-claims → Claims | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-claims.png` |
| 19 | P1 | detail-tabs | detail-claims → Claims | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-claims.png` |
| 20 | P1 | detail-tabs | detail-compliance-security → Compliance & Security | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-compliance-security.png` |
| 21 | P1 | detail-tabs | detail-compliance-security → Compliance & Security | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-compliance-security.png` |
| 22 | P1 | detail-tabs | detail-compliance-security → Compliance & Security | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-compliance-security.png` |
| 23 | P1 | detail-tabs | detail-deliverables → Deliverables | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-deliverables.png` |
| 24 | P1 | detail-tabs | detail-deliverables → Deliverables | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-deliverables.png` |
| 25 | P1 | detail-tabs | detail-deliverables → Deliverables | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-deliverables.png` |
| 26 | P1 | detail-tabs | detail-documents → Documents | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-documents.png` |
| 27 | P1 | detail-tabs | detail-documents → Documents | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-documents.png` |
| 28 | P1 | detail-tabs | detail-documents → Documents | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-documents.png` |
| 29 | P1 | detail-tabs | detail-invoice → Invoice | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-invoice.png` |
| 30 | P1 | detail-tabs | detail-invoice → Invoice | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-invoice.png` |
| 31 | P1 | detail-tabs | detail-invoice → Invoice | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-invoice.png` |
| 32 | P1 | detail-tabs | detail-lem → LEM | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-lem.png` |
| 33 | P1 | detail-tabs | detail-lem → LEM | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-lem.png` |
| 34 | P1 | detail-tabs | detail-lem → LEM | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-lem.png` |
| 35 | P1 | detail-tabs | detail-ncr-log → NCR Log | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-ncr-log.png` |
| 36 | P1 | detail-tabs | detail-ncr-log → NCR Log | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-ncr-log.png` |
| 37 | P1 | detail-tabs | detail-ncr-log → NCR Log | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-ncr-log.png` |
| 38 | P1 | detail-tabs | detail-overview → Overview | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-overview.png` |
| 39 | P1 | detail-tabs | detail-overview → Overview | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-overview.png` |
| 40 | P1 | detail-tabs | detail-overview → Overview | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-overview.png` |
| 41 | P1 | detail-tabs | detail-payment-summary → Payment Summary | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-payment-summary.png` |
| 42 | P1 | detail-tabs | detail-payment-summary → Payment Summary | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-payment-summary.png` |
| 43 | P1 | detail-tabs | detail-payment-summary → Payment Summary | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-payment-summary.png` |
| 44 | P1 | detail-tabs | detail-rate-sheets → Rate Sheets | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-rate-sheets.png` |
| 45 | P1 | detail-tabs | detail-rate-sheets → Rate Sheets | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-rate-sheets.png` |
| 46 | P1 | detail-tabs | detail-rate-sheets → Rate Sheets | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-rate-sheets.png` |
| 47 | P1 | detail-tabs | detail-rfi → RFI | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-rfi.png` |
| 48 | P1 | detail-tabs | detail-rfi → RFI | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-rfi.png` |
| 49 | P1 | detail-tabs | detail-rfi → RFI | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-rfi.png` |
| 50 | P1 | detail-tabs | detail-vendor-s-reports → Vendor’s Reports | mobile (375px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/mobile/tab-tab-vendor-s-reports.png` |
| 51 | P1 | detail-tabs | detail-vendor-s-reports → Vendor’s Reports | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/tab-tab-vendor-s-reports.png` |
| 52 | P1 | detail-tabs | detail-vendor-s-reports → Vendor’s Reports | ipad (1024px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/ipad/tab-tab-vendor-s-reports.png` |
| 53 | P1 | lists-and-dashboards | contracts | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/route-contracts.png` |
| 54 | P1 | lists-and-dashboards | contracts | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/route-contracts.png` |
| 55 | P1 | lists-and-dashboards | msa | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/route-msa.png` |
| 56 | P1 | lists-and-dashboards | msa | tablet (768px) | vendor | element wider than viewport | — | `.qa/reports/responsive/vendor/tablet/route-msa.png` |
| 57 | P1 | lists-and-dashboards | projects | mobile (375px) | approver | element wider than viewport | — | `.qa/reports/responsive/approver/mobile/route-projects.png` |
| 58 | P1 | lists-and-dashboards | projects | tablet (768px) | approver | element wider than viewport | — | `.qa/reports/responsive/approver/tablet/route-projects.png` |
| 59 | P1 | lists-and-dashboards | solicitation | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/route-solicitation.png` |
| 60 | P1 | lists-and-dashboards | solicitation | tablet (768px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/tablet/route-solicitation.png` |
| 61 | P1 | lists-and-dashboards | vendor | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/route-vendor.png` |
| 62 | P1 | lists-and-dashboards | vendor | tablet (768px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/tablet/route-vendor.png` |
| 63 | P1 | shell-and-dashboards | dashboard | mobile (375px) | pm | element wider than viewport | — | `.qa/reports/responsive/pm/mobile/route-dashboard.png` |
| 64 | P1 | shell-and-dashboards | dashboard | tablet (768px) | pm | element wider than viewport | — | `.qa/reports/responsive/pm/tablet/route-dashboard.png` |
| 65 | P1 | shell-and-dashboards | profile | mobile (375px) | cm | element wider than viewport | — | `.qa/reports/responsive/cm/mobile/route-profile.png` |
| 66 | P2 | lists-and-dashboards | projects | mobile (375px) | cm | minor overflow (within 50px of viewport) | — | `.qa/reports/responsive/cm/mobile/route-projects.png` |

## Surface-family breakdown

### detail-tabs

P0: **1**, P1: **45**, P2: **0**

Top offenders:

- **P0** `detail-compliance-security → Compliance & Security` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P1** `detail-amendments → Amendments` @ mobile: element wider than viewport
- **P1** `detail-amendments → Amendments` @ tablet: element wider than viewport
- **P1** `detail-amendments → Amendments` @ ipad: element wider than viewport
- **P1** `detail-analytics → Analytics` @ mobile: element wider than viewport
- **P1** `detail-analytics → Analytics` @ tablet: element wider than viewport
- **P1** `detail-analytics → Analytics` @ ipad: element wider than viewport
- **P1** `detail-change-management → Change Management` @ mobile: element wider than viewport
- **P1** `detail-change-management → Change Management` @ tablet: element wider than viewport
- **P1** `detail-change-management → Change Management` @ ipad: element wider than viewport

Suggested follow-up: `260530-responsive-detail-tabs` — sized from above, expect 46 P0/P1 fixes.

### lists-and-dashboards

P0: **5**, P1: **10**, P2: **1**

Top offenders:

- **P0** `contracts` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `msa` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `projects` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `solicitation` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P0** `vendor` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P1** `contracts` @ mobile: element wider than viewport
- **P1** `contracts` @ tablet: element wider than viewport
- **P1** `msa` @ mobile: element wider than viewport
- **P1** `msa` @ tablet: element wider than viewport
- **P1** `projects` @ mobile: element wider than viewport

Suggested follow-up: `260530-responsive-lists-and-dashboards` — sized from above, expect 15 P0/P1 fixes.

### shell-and-dashboards

P0: **1**, P1: **3**, P2: **0**

Top offenders:

- **P0** `dashboard` @ mobile: main content clipped — desktop sidebar/layout at narrow viewport
- **P1** `dashboard` @ mobile: element wider than viewport
- **P1** `dashboard` @ tablet: element wider than viewport
- **P1** `profile` @ mobile: element wider than viewport

Suggested follow-up: `260530-responsive-shell-and-dashboards` — sized from above, expect 4 P0/P1 fixes.

## Known traps to verify during fixes

- [[button-inline-flex-whitespace-nowrap-overflow]] — long content in shadcn Button trigger forces horizontal scroll on parent dialog.
- [[radix-tabs-force-mount-trap]] — `forceMount` keeps tab panels in DOM; can leak as stray empty section on narrow widths.
- [[fileinput-dropzone-dark-mode-pattern]] — FileInput overrides often regress; check at every viewport after dark-mode style edits.
- [[react-baseline-warnings-260528]] — console errors counted here include baseline noise (validation HOC prop spreading); not all are responsive issues.

## Non-fixes that look like fixes

- Adding `overflow-x: hidden` on `<body>` will silence P0 "body scroll" but **hide** clipped content. Fix the layout root instead.
- Wrapping every table in `overflow-x-auto` solves P1 but yields a terrible mobile UX; prefer card-view per [[plan: detail-tabs]] but only after P0s clear.
