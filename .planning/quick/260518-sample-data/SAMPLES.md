# Sample Data — Contracts, MSAs, and Contract Detail User Flows

10 paired samples. Each sample has:
- **A. Contract** — full 9-step CreateContract payload
- **B. MSA** — full 9-step CreateMSADialog payload (tied to the same vendor/industry)
- **C. Contract Detail flow** — one representative user-flow payload (rotates across the 11 flows so all are covered)

Field names match yup schemas in `src/pages/ContractManagementPage/components/Step*.tsx` and `src/pages/MsaPage/components/Step*.tsx`. Dates are ISO. IDs are placeholders — swap for real ObjectIds when seeding.

---

## Sample 1 — Aurora HQ Fit-Out (flow: RFI)

### A. Contract
```json
{
  "name": "Aurora HQ Interior Fit-Out",
  "relationship": "msa_project",
  "project": "PRJ-AURORA-HQ",
  "awardedSolicitation": "SOL-2026-014",
  "type": "Construction",
  "category": "Capital Projects",
  "currency": "USD",
  "manager": "manager.kara@swifter.io",
  "projectManager": "pm.devon@swifter.io",
  "jobTitle": "Interior Build-out",
  "contractId": "CON-AUR-001",
  "msaContractId": "MSA-NORDIC-001",
  "rating": 8,
  "description": "Full interior fit-out for the 14th-floor HQ — partitions, finishes, MEP coordination.",
  "businessDivision": "Real Estate",
  "vendor": "ops@nordicbuild.co",
  "visibility": "internal",
  "personnel": [
    {"name": "Sven Lund", "email": "sven@nordicbuild.co", "role": "Site Supervisor", "phone": "+1-415-555-0142"},
    {"name": "Mia Okafor", "email": "mia@nordicbuild.co", "role": "Project Engineer", "phone": "+1-415-555-0177"}
  ],
  "internalTeam": ["pm.devon@swifter.io", "qs.hadid@swifter.io"],
  "effectiveDate": "2026-06-01",
  "endDate": "2026-12-15",
  "duration": "6 months",
  "termType": "fixed",
  "draftStartDate": "2026-05-10", "draftEndDate": "2026-05-20",
  "reviewStartDate": "2026-05-21", "reviewEndDate": "2026-05-25",
  "approvalStartDate": "2026-05-26", "approvalEndDate": "2026-05-30",
  "executionStartDate": "2026-06-01", "executionEndDate": "2026-06-05",
  "deliverables": [
    {"name": "Demolition complete", "dueDate": "2026-06-20"},
    {"name": "MEP rough-in", "dueDate": "2026-08-15"},
    {"name": "Finishes & handover", "dueDate": "2026-12-10"}
  ],
  "contractValue": 1250000,
  "contingency": "8",
  "holdback": "10",
  "paymentStructure": "milestone",
  "milestones": [
    {"name": "Mobilization", "amount": 125000, "dueDate": "2026-06-05", "deliverable": "Demolition complete"},
    {"name": "MEP complete", "amount": 500000, "dueDate": "2026-08-20", "deliverable": "MEP rough-in"},
    {"name": "Substantial completion", "amount": 500000, "dueDate": "2026-12-10", "deliverable": "Finishes & handover"},
    {"name": "Holdback release", "amount": 125000, "dueDate": "2027-01-10"}
  ],
  "paymentTerm": "Net 30",
  "insuranceExpiryDate": "2027-06-01",
  "insurancePolicies": [
    {"name": "General Liability", "limit": "5000000"},
    {"name": "Workers Compensation", "limit": "2000000"}
  ],
  "contractSecurity": "yes",
  "securities": [
    {"type": "Performance Bond", "amount": "125000", "dueDate": "2026-05-30"}
  ],
  "documents": [
    {"name": "Statement of Work.pdf", "url": "https://files/sow-aurora.pdf", "type": "application/pdf", "size": "184320"}
  ],
  "approvalGroups": [
    {"name": "Director Approval", "approvers": ["dir.singh@swifter.io"], "approvalLevel": 1, "amount": 500000},
    {"name": "VP Approval", "approvers": ["vp.romero@swifter.io"], "approvalLevel": 2, "amount": 2000000}
  ]
}
```

### B. MSA — Nordic Build Master
```json
{
  "name": "Nordic Build Master Services Agreement",
  "type": "Construction Services",
  "currency": "USD",
  "rating": 9,
  "businessDivision": "Real Estate",
  "jobTitle": "Tier-1 General Contractor",
  "msaId": "MSA-NORDIC-001",
  "description": "Master agreement governing all fit-out and construction calls for Nordic Build Co.",
  "manager": "manager.kara@swifter.io",
  "projectManager": "pm.devon@swifter.io",
  "vendor": "ops@nordicbuild.co",
  "personnel": [{"name": "Sven Lund", "email": "sven@nordicbuild.co", "role": "Account Lead", "phone": "+1-415-555-0142"}],
  "effectiveDate": "2026-05-01", "endDate": "2029-04-30", "duration": "36 months", "termType": "fixed",
  "deliverables": [{"name": "Annual safety audit", "dueDate": "2026-12-31"}],
  "contractValue": 10000000, "paymentStructure": "milestone", "paymentTerm": "Net 30",
  "insurancePolicies": [{"name": "General Liability", "limit": "5000000"}],
  "contractSecurity": "no",
  "documents": [{"name": "MSA-Nordic.pdf", "url": "https://files/msa-nordic.pdf", "type": "application/pdf", "size": "256000"}],
  "approvalGroups": [{"name": "Legal+VP", "approvers": ["legal@swifter.io","vp.romero@swifter.io"], "approvalLevel": 1, "amount": 10000000}]
}
```

### C. Flow — Raise RFI (role: vendor)
```json
{
  "endpoint": "POST /contract/vendor/contracts/CON-AUR-001/rfi",
  "rfiTitle": "Clarification on ceiling height for executive zone",
  "responseDeadline": "2026-06-12",
  "question": "Drawing A-204 shows 2.7m but spec sheet 3.1.b states 3.0m. Which controls?",
  "responders": ["manager.kara@swifter.io", "pm.devon@swifter.io"],
  "files": [{"name": "A-204-markup.pdf", "url": "https://files/a204.pdf", "type": "application/pdf", "size": "92160"}]
}
```

---

## Sample 2 — SaaS Telemetry Platform (flow: Deliverable submission)

### A. Contract
```json
{
  "name": "Telemetry Platform Build", "relationship": "msa_project", "project": "PRJ-TLM-22",
  "type": "Software Development", "category": "Engineering", "currency": "USD",
  "manager": "manager.priya@swifter.io", "projectManager": "pm.julian@swifter.io",
  "rating": 7, "businessDivision": "Engineering", "vendor": "delivery@beaconlabs.io",
  "description": "Build a multi-tenant telemetry ingestion + dashboards platform on AWS.",
  "personnel": [{"name": "Iris Tan", "email": "iris@beaconlabs.io", "role": "Tech Lead", "phone": "+44-20-555-0188"}],
  "effectiveDate": "2026-06-15", "endDate": "2027-02-28", "duration": "8.5 months", "termType": "fixed",
  "deliverables": [
    {"name": "Architecture sign-off", "dueDate": "2026-07-15"},
    {"name": "MVP ingest pipeline", "dueDate": "2026-09-30"},
    {"name": "GA release", "dueDate": "2027-02-15"}
  ],
  "contractValue": 680000, "paymentStructure": "milestone", "paymentTerm": "Net 15",
  "milestones": [
    {"name": "Design phase", "amount": 120000, "dueDate": "2026-07-20", "deliverable": "Architecture sign-off"},
    {"name": "MVP", "amount": 260000, "dueDate": "2026-10-05", "deliverable": "MVP ingest pipeline"},
    {"name": "GA", "amount": 300000, "dueDate": "2027-02-20", "deliverable": "GA release"}
  ],
  "insurancePolicies": [{"name": "Cyber Liability", "limit": "3000000"}],
  "contractSecurity": "no",
  "documents": [{"name": "SOW-Telemetry.pdf", "url": "https://files/sow-telemetry.pdf", "type": "application/pdf", "size": "210000"}],
  "approvalGroups": [{"name": "Eng VP", "approvers": ["vp.eng@swifter.io"], "approvalLevel": 1, "amount": 1000000}]
}
```

### B. MSA — Beacon Labs Master
```json
{
  "name": "Beacon Labs MSA", "type": "Professional Services", "currency": "USD", "rating": 8,
  "businessDivision": "Engineering", "msaId": "MSA-BEACON-002",
  "description": "Master services agreement for Beacon Labs engineering engagements.",
  "manager": "manager.priya@swifter.io", "vendor": "delivery@beaconlabs.io",
  "effectiveDate": "2026-04-01", "endDate": "2028-03-31", "duration": "24 months", "termType": "fixed",
  "contractValue": 4000000, "paymentStructure": "milestone", "paymentTerm": "Net 15",
  "insurancePolicies": [{"name": "Cyber Liability", "limit": "3000000"}],
  "contractSecurity": "no",
  "documents": [{"name": "MSA-Beacon.pdf", "url": "https://files/msa-beacon.pdf", "type": "application/pdf", "size": "198000"}],
  "approvalGroups": [{"name": "Procurement", "approvers": ["proc@swifter.io"], "approvalLevel": 1, "amount": 4000000}]
}
```

### C. Flow — Submit Deliverable (role: vendor)
```json
{
  "endpoint": "POST /contract/vendor/contracts/CON-TLM-22/deliverables/DEL-002/submit",
  "deliverableId": "DEL-002",
  "submissionDate": "2026-10-02",
  "kpiStatus": "on_track",
  "notes": "Ingest pipeline live in staging; 99.95% uptime over 14-day soak.",
  "files": [{"name": "MVP-Acceptance.pdf", "url": "https://files/mvp-accept.pdf", "type": "application/pdf", "size": "145000"}]
}
```

---

## Sample 3 — Fleet Maintenance Services (flow: Change Order)

### A. Contract
```json
{
  "name": "Regional Fleet Preventive Maintenance", "relationship": "msa_project",
  "type": "Services", "category": "Facilities", "currency": "USD",
  "manager": "manager.alex@swifter.io", "rating": 6, "businessDivision": "Operations",
  "vendor": "service@meridianfleet.com",
  "description": "Quarterly PM and on-call repair for 220-vehicle regional fleet.",
  "effectiveDate": "2026-07-01", "endDate": "2027-06-30", "duration": "12 months", "termType": "renewable",
  "deliverables": [{"name": "Q1 PM cycle", "dueDate": "2026-09-30"},{"name": "Q4 PM cycle", "dueDate": "2027-06-30"}],
  "contractValue": 420000, "paymentStructure": "monthly", "paymentTerm": "Net 30",
  "contractSecurity": "no",
  "approvalGroups": [{"name": "Ops Director", "approvers": ["ops.dir@swifter.io"], "approvalLevel": 1, "amount": 500000}]
}
```

### B. MSA — Meridian Fleet
```json
{
  "name": "Meridian Fleet MSA", "type": "Maintenance Services", "currency": "USD", "rating": 7,
  "msaId": "MSA-MERIDIAN-003", "vendor": "service@meridianfleet.com",
  "effectiveDate": "2026-06-01", "endDate": "2029-05-31", "duration": "36 months",
  "contractValue": 1500000, "paymentStructure": "monthly", "paymentTerm": "Net 30",
  "contractSecurity": "no"
}
```

### C. Flow — Change Order (role: vendor → Proposal)
```json
{
  "endpoint": "POST /contract/vendor/contracts/CON-FLEET-03/changes",
  "type": "Proposal",
  "name": "Add EV charger inspection to PM scope",
  "amount": 32000,
  "urgency": "medium",
  "description": "Fleet now includes 18 EVs; adding charger + battery health to quarterly PM cycle.",
  "files": [{"name": "EV-PM-Quote.pdf", "url": "https://files/ev-pm.pdf", "type": "application/pdf", "size": "88000"}]
}
```

---

## Sample 4 — Cloud Security Audit (flow: Amendment)

### A. Contract
```json
{
  "name": "Annual Cloud Security Audit & Pentest", "relationship": "standalone",
  "type": "Consulting", "category": "Security", "currency": "USD",
  "manager": "ciso@swifter.io", "rating": 9, "businessDivision": "Security",
  "vendor": "engagements@ironwallsec.com",
  "description": "SOC2 readiness audit + external pentest of AWS + GCP estate.",
  "effectiveDate": "2026-06-01", "endDate": "2026-10-31", "duration": "5 months", "termType": "fixed",
  "deliverables": [{"name": "Audit report", "dueDate": "2026-09-30"},{"name": "Pentest report", "dueDate": "2026-10-25"}],
  "contractValue": 145000, "paymentStructure": "milestone", "paymentTerm": "Net 30",
  "milestones": [{"name": "Kickoff", "amount": 50000, "dueDate": "2026-06-10"},{"name": "Final reports", "amount": 95000, "dueDate": "2026-10-30"}],
  "contractSecurity": "no",
  "approvalGroups": [{"name": "CISO", "approvers": ["ciso@swifter.io"], "approvalLevel": 1, "amount": 200000}]
}
```

### B. MSA — Ironwall Security
```json
{
  "name": "Ironwall Security MSA", "type": "Security Services", "currency": "USD", "rating": 9,
  "msaId": "MSA-IRONWALL-004", "vendor": "engagements@ironwallsec.com",
  "effectiveDate": "2026-05-15", "endDate": "2028-05-14", "duration": "24 months",
  "contractValue": 600000, "paymentStructure": "milestone", "paymentTerm": "Net 30",
  "contractSecurity": "no"
}
```

### C. Flow — Create Amendment (role: manager)
```json
{
  "endpoint": "POST /contract/manager/contracts/CON-SEC-04/amendments",
  "amendmentTitle": "Extend scope to include Kubernetes hardening review",
  "impactType": "time_cost",
  "timeImpactDays": 21,
  "costImpactAmount": 28000,
  "scope": "Add CIS-benchmarked review of 3 production EKS clusters.",
  "newExpiryDate": "2026-11-21",
  "clause": "Section 4.2 — Scope of Work",
  "description": "Audit committee requested K8s coverage after recent CVE disclosures.",
  "files": [{"name": "Amendment-Scope.pdf", "url": "https://files/amend-04.pdf", "type": "application/pdf", "size": "72000"}]
}
```

---

## Sample 5 — Marketing Campaign Production (flow: Invoice)

### A. Contract
```json
{
  "name": "Q3 Brand Campaign Production", "relationship": "msa_project",
  "type": "Marketing Services", "category": "Marketing", "currency": "GBP",
  "manager": "cmo@swifter.io", "rating": 7, "businessDivision": "Marketing",
  "vendor": "studio@halcyoncreative.co.uk",
  "description": "Concept, shoot, edit and deliver 3 hero films + 12 social cuts.",
  "effectiveDate": "2026-06-10", "endDate": "2026-09-15", "duration": "3 months",
  "deliverables": [{"name": "Hero films delivered", "dueDate": "2026-08-20"},{"name": "Social cuts delivered", "dueDate": "2026-09-10"}],
  "contractValue": 215000, "paymentStructure": "milestone", "paymentTerm": "Net 14",
  "contractSecurity": "no",
  "approvalGroups": [{"name": "CMO", "approvers": ["cmo@swifter.io"], "approvalLevel": 1, "amount": 250000}]
}
```

### B. MSA — Halcyon Creative
```json
{
  "name": "Halcyon Creative MSA", "type": "Creative Services", "currency": "GBP", "rating": 8,
  "msaId": "MSA-HALCYON-005", "vendor": "studio@halcyoncreative.co.uk",
  "effectiveDate": "2026-05-01", "endDate": "2027-04-30", "duration": "12 months",
  "contractValue": 750000, "paymentStructure": "milestone", "paymentTerm": "Net 14",
  "contractSecurity": "no"
}
```

### C. Flow — Create Invoice (role: vendor)
```json
{
  "endpoint": "POST /contract/vendor/contracts/CON-MKT-05/invoices",
  "invoiceNumber": "HAL-2026-0142",
  "invoiceDate": "2026-08-22",
  "amount": 110000,
  "description": "Hero films milestone — 3 films delivered and accepted.",
  "files": [{"name": "HAL-2026-0142.pdf", "url": "https://files/inv-hal-0142.pdf", "type": "application/pdf", "size": "64000"}]
}
```

---

## Sample 6 — Solar Rooftop Install (flow: Claim)

### A. Contract
```json
{
  "name": "Distribution Center Solar Rooftop", "relationship": "msa_project",
  "type": "Construction", "category": "Capital Projects", "currency": "USD",
  "manager": "facilities.lead@swifter.io", "rating": 8, "businessDivision": "Facilities",
  "vendor": "projects@sunridgepower.com",
  "description": "1.8 MW rooftop PV install + grid interconnection at DC-7.",
  "effectiveDate": "2026-07-15", "endDate": "2027-04-30", "duration": "9.5 months",
  "deliverables": [{"name": "Permitting complete", "dueDate": "2026-09-30"},{"name": "Commissioning", "dueDate": "2027-04-15"}],
  "contractValue": 3200000, "paymentStructure": "milestone", "paymentTerm": "Net 45",
  "contractSecurity": "yes",
  "securities": [{"type": "Performance Bond", "amount": "320000", "dueDate": "2026-07-10"}],
  "approvalGroups": [{"name": "CFO+VP Ops", "approvers": ["cfo@swifter.io","vp.ops@swifter.io"], "approvalLevel": 2, "amount": 5000000}]
}
```

### B. MSA — Sunridge Power
```json
{
  "name": "Sunridge Power MSA", "type": "Renewable Energy", "currency": "USD", "rating": 8,
  "msaId": "MSA-SUNRIDGE-006", "vendor": "projects@sunridgepower.com",
  "effectiveDate": "2026-06-01", "endDate": "2031-05-31", "duration": "60 months",
  "contractValue": 25000000, "paymentStructure": "milestone", "paymentTerm": "Net 45",
  "contractSecurity": "yes"
}
```

### C. Flow — Request Claim (role: vendor)
```json
{
  "endpoint": "POST /contract/vendor/contracts/CON-SOL-06/claims",
  "claimTitle": "Weather delay — 11 days standdown",
  "claimType": "delay",
  "impactType": "time",
  "timeImpact": 11,
  "costImpact": 0,
  "description": "Severe storms 2026-08-12 → 2026-08-22 prevented roof work per safety policy.",
  "files": [{"name": "Weather-Logs.pdf", "url": "https://files/weather-06.pdf", "type": "application/pdf", "size": "118000"}]
}
```

---

## Sample 7 — Legal Counsel Retainer (flow: Approval action)

### A. Contract
```json
{
  "name": "Outside Counsel — M&A Workstream", "relationship": "msa",
  "type": "Legal Services", "category": "Professional Services", "currency": "USD",
  "manager": "gc@swifter.io", "rating": 9, "businessDivision": "Legal",
  "vendor": "partner@ashfield-legal.com",
  "description": "Dedicated M&A counsel through year-end strategic transactions.",
  "effectiveDate": "2026-06-01", "endDate": "2026-12-31", "duration": "7 months",
  "contractValue": 480000, "paymentStructure": "monthly", "paymentTerm": "Net 30",
  "contractSecurity": "no",
  "approvalGroups": [
    {"name": "GC", "approvers": ["gc@swifter.io"], "approvalLevel": 1, "amount": 250000},
    {"name": "CFO", "approvers": ["cfo@swifter.io"], "approvalLevel": 2, "amount": 1000000}
  ]
}
```

### B. MSA — Ashfield Legal
```json
{
  "name": "Ashfield Legal Master Engagement", "type": "Legal Services", "currency": "USD", "rating": 9,
  "msaId": "MSA-ASHFIELD-007", "vendor": "partner@ashfield-legal.com",
  "effectiveDate": "2026-05-01", "endDate": "2028-04-30", "duration": "24 months",
  "contractValue": 2000000, "paymentStructure": "monthly", "paymentTerm": "Net 30",
  "contractSecurity": "no"
}
```

### C. Flow — Approval action (role: approver)
```json
{
  "endpoint": "POST /contract/approver/contracts/CON-LEG-07/approve",
  "action": "approved",
  "comment": "Reviewed; rate card and scope align with prior engagements. Approved at level 2."
}
```

---

## Sample 8 — Data Center Cabling (flow: NCR)

### A. Contract
```json
{
  "name": "DC-9 Structured Cabling Upgrade", "relationship": "msa_project",
  "type": "Infrastructure", "category": "IT Infrastructure", "currency": "USD",
  "manager": "infra.lead@swifter.io", "rating": 7, "businessDivision": "IT",
  "vendor": "ops@trellisnetworks.com",
  "description": "Cat6A + OM4 fiber refresh across 14 rows in DC-9.",
  "effectiveDate": "2026-07-01", "endDate": "2026-11-30", "duration": "5 months",
  "deliverables": [{"name": "Row 1-7 complete", "dueDate": "2026-09-15"},{"name": "Row 8-14 complete", "dueDate": "2026-11-20"}],
  "contractValue": 540000, "paymentStructure": "milestone", "paymentTerm": "Net 30",
  "contractSecurity": "no",
  "approvalGroups": [{"name": "Infra Director", "approvers": ["infra.dir@swifter.io"], "approvalLevel": 1, "amount": 750000}]
}
```

### B. MSA — Trellis Networks
```json
{
  "name": "Trellis Networks MSA", "type": "Network Services", "currency": "USD", "rating": 7,
  "msaId": "MSA-TRELLIS-008", "vendor": "ops@trellisnetworks.com",
  "effectiveDate": "2026-06-01", "endDate": "2028-05-31", "duration": "24 months",
  "contractValue": 2200000, "paymentStructure": "milestone", "paymentTerm": "Net 30",
  "contractSecurity": "no"
}
```

### C. Flow — Raise NCR (role: approver)
```json
{
  "endpoint": "POST /contract/approver/contracts/CON-DC-08/ncr",
  "ncrTitle": "Row 4 patch panel labeling does not match as-built drawings",
  "severity": "minor",
  "description": "44 ports mis-labeled vs drawing DC9-AB-R4-r3; rework needed before sign-off.",
  "files": [{"name": "Row4-Photos.zip", "url": "https://files/row4.zip", "type": "application/zip", "size": "1840000"}]
}
```

---

## Sample 9 — HR SaaS Subscription (flow: Document upload)

### A. Contract
```json
{
  "name": "HR Information System Subscription", "relationship": "standalone",
  "type": "Software Subscription", "category": "SaaS", "currency": "USD",
  "manager": "chro@swifter.io", "rating": 8, "businessDivision": "HR",
  "vendor": "accounts@kestrelhr.com",
  "description": "3-year subscription for 4,200 seats including payroll + benefits modules.",
  "effectiveDate": "2026-07-01", "endDate": "2029-06-30", "duration": "36 months", "termType": "auto_renew",
  "contractValue": 1620000, "paymentStructure": "monthly", "paymentTerm": "Net 30",
  "contractSecurity": "no",
  "documents": [{"name": "KestrelHR-Order-Form.pdf", "url": "https://files/kestrel-order.pdf", "type": "application/pdf", "size": "96000"}],
  "approvalGroups": [{"name": "CHRO+CFO", "approvers": ["chro@swifter.io","cfo@swifter.io"], "approvalLevel": 2, "amount": 2000000}]
}
```

### B. MSA — Kestrel HR
```json
{
  "name": "Kestrel HR MSA", "type": "SaaS", "currency": "USD", "rating": 8,
  "msaId": "MSA-KESTREL-009", "vendor": "accounts@kestrelhr.com",
  "effectiveDate": "2026-06-15", "endDate": "2031-06-14", "duration": "60 months",
  "contractValue": 3500000, "paymentStructure": "monthly", "paymentTerm": "Net 30",
  "contractSecurity": "no"
}
```

### C. Flow — Upload Document (role: manager)
```json
{
  "endpoint": "POST /contract/manager/contracts/CON-HRS-09/documents",
  "documentType": "DPA",
  "files": [{"name": "Kestrel-DPA-Signed.pdf", "url": "https://files/kestrel-dpa.pdf", "type": "application/pdf", "size": "212000"}]
}
```

---

## Sample 10 — Catering Master Schedule (flow: Milestone approval)

### A. Contract
```json
{
  "name": "Corporate Cafeteria Operations FY27", "relationship": "msa_project",
  "type": "Hospitality Services", "category": "Facilities", "currency": "USD",
  "manager": "facilities.lead@swifter.io", "rating": 6, "businessDivision": "Facilities",
  "vendor": "biz@thymeandtable.com",
  "description": "Daily breakfast + lunch service across 3 campuses, ~1,800 covers/day.",
  "effectiveDate": "2026-07-01", "endDate": "2027-06-30", "duration": "12 months",
  "deliverables": [{"name": "Onboarding + menu validation", "dueDate": "2026-07-31"}],
  "contractValue": 2100000, "paymentStructure": "milestone", "paymentTerm": "Net 30",
  "milestones": [
    {"name": "Mobilization", "amount": 200000, "dueDate": "2026-07-05"},
    {"name": "Q1 service", "amount": 525000, "dueDate": "2026-09-30"},
    {"name": "Q2 service", "amount": 525000, "dueDate": "2026-12-31"},
    {"name": "Q3 service", "amount": 525000, "dueDate": "2027-03-31"},
    {"name": "Q4 service", "amount": 325000, "dueDate": "2027-06-30"}
  ],
  "contractSecurity": "no",
  "approvalGroups": [{"name": "Facilities Director", "approvers": ["fac.dir@swifter.io"], "approvalLevel": 1, "amount": 2500000}]
}
```

### B. MSA — Thyme & Table
```json
{
  "name": "Thyme & Table MSA", "type": "Catering Services", "currency": "USD", "rating": 7,
  "msaId": "MSA-THYME-010", "vendor": "biz@thymeandtable.com",
  "effectiveDate": "2026-06-01", "endDate": "2029-05-31", "duration": "36 months",
  "contractValue": 7000000, "paymentStructure": "milestone", "paymentTerm": "Net 30",
  "contractSecurity": "no"
}
```

### C. Flow — Approve Milestone (role: manager)
```json
{
  "endpoint": "POST /contract/manager/contracts/CON-CAF-10/milestones/MS-Q1/approve",
  "milestoneId": "MS-Q1",
  "action": "approve",
  "comment": "Q1 cover counts verified vs. badge swipes; quality survey 4.6/5. Release payment of $525,000."
}
```

---

## Flow coverage matrix

| # | Flow                  | Role     |
|---|-----------------------|----------|
| 1 | RFI                   | vendor   |
| 2 | Deliverable submit    | vendor   |
| 3 | Change order/proposal | vendor   |
| 4 | Amendment             | manager  |
| 5 | Invoice               | vendor   |
| 6 | Claim                 | vendor   |
| 7 | Approval action       | approver |
| 8 | NCR                   | approver |
| 9 | Document upload       | manager  |
| 10| Milestone approval    | manager  |

Personnel/team management (PUT `/manager/contracts/{id}/personnel`) is exercised inline in each contract's `personnel` and `internalTeam` arrays.
