# SwiftPro REST API Documentation

**Version:** 2.3.0  
**Description:** SwiftPro REST API docs for dev server — primarily for integration and testing.

---

## Servers

| Environment | URL |
|---|---|
| Local | `http://localhost:10001/api/v1/contract` |
| Development | `https://dev.swiftpro.tech/api/v1/dev/contract` |

---

## Authentication

All endpoints require a **Bearer JWT** token via the `Authorization` header.

```
Authorization: Bearer <jwt>
```

---

## Table of Contents

1. [Approver — Contract](#1-approver--contract)
2. [Approver — Dashboard (Portfolio)](#2-approver--dashboard-portfolio)
3. [Approver — MSA Contract](#3-approver--msa-contract)
4. [Business Division](#4-business-division)
5. [Project](#5-project)
6. [Contract Manager — Contract](#6-contract-manager--contract)
7. [Contract Manager — MSA Contract](#7-contract-manager--msa-contract)
8. [Vendor — Contract](#8-vendor--contract)
9. [Vendor — MSA Contract](#9-vendor--msa-contract)
10. [View-Only User — Contract](#10-view-only-user--contract)
11. [View-Only User — MSA Contract](#11-view-only-user--msa-contract)
12. [Collaboration (WebSocket)](#12-collaboration-websocket)
13. [Common Schemas](#13-common-schemas)

---

## 1. Approver — Contract

### 1.1 List Contracts
`GET /approver/contracts`

Returns a paginated, filterable list of contracts for the authenticated approver's company.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page |
| `status` | string | — | Filter by contract status |
| `category` | string | — | Filter by contract category |
| `date` | date | — | Filter by date (YYYY-MM-DD) |

**Responses:** `200 OK` · `401 Unauthorized` · `403 Forbidden` · `500 Server Error`

---

### 1.2 Get Contract by ID
`GET /approver/contracts/{contractId}`

Returns detailed information for a specific contract.

**Path Parameters:** `contractId` (required)

**Responses:** `200 OK` · `401` · `403` · `404 Not Found` · `500`

---

### 1.3 Get Contract Statistics
`GET /approver/contracts/stats`

Returns contract statistics for the authenticated approver's company.

**Responses:** `200 OK`

---

### 1.4 Get Contract Personnel
`GET /approver/contracts/{contractId}/personnel`

Returns users in the company eligible for contract-related roles.

**Roles Required:** `company_admin`, `contract_manager`

**Responses:** `200 OK` · `401` · `403` · `500`

---

### 1.5 Check Contract Approval Status
`GET /approver/contracts/{contractId}/approve/status`

Checks whether the current user can approve the contract at the current level.

**Response (200):**
```json
{ "data": { "status": true } }
```

---

### 1.6 Approve or Reject a Contract
`POST /approver/contracts/{contractId}/approve`

Submit an approval action for the contract.

**Request Body:**
```json
{
  "action": "approved" | "rejected",
  "comment": "string"
}
```

**Responses:** `200 OK`

---

### 1.7 Contract Dashboard

| Endpoint | Description |
|---|---|
| `GET /approver/contracts/{contractId}/dashboard/overview` | Contract overview card metrics |
| `GET /approver/contracts/{contractId}/dashboard/alerts` | Contract monitoring alerts |
| `GET /approver/contracts/{contractId}/dashboard/financial-statement` | Financial statement |
| `GET /approver/contracts/{contractId}/dashboard/deliverable-status` | Deliverable status chart |
| `GET /approver/contracts/{contractId}/dashboard/activities` | Activity chart (range: YTD, 90, 60, 30, 7) |
| `GET /approver/contracts/{contractId}/dashboard/delivery-summary` | Delivery performance summary |
| `GET /approver/contracts/{contractId}/dashboard/vendor-kpi` | Vendor KPI chart |
| `GET /approver/contracts/{contractId}/dashboard/attachment` | Amendment and policy counts |
| `GET /approver/contracts/{contractId}/dashboard/clause-legal-analysis` | Clause/legal analysis |

**Common Query Parameter:** `type` — `Contract` (default) or `MsaContract`

---

### 1.8 Holdbacks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/payment-holdbacks` | List holdbacks for a contract |
| `GET` | `/approver/contracts/payment-holdbacks/{holdBackId}` | Get holdback details |

---

### 1.9 Savings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/payment-savings` | List savings for a contract |
| `GET` | `/approver/contracts/payment-savings/{savingId}` | Get saving details |

---

### 1.10 LEMs (Labour, Equipment & Materials)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/lems` | List LEMs (paginated) |
| `GET` | `/approver/contracts/{contractId}/lems/{lemId}` | Get LEM details |
| `GET` | `/approver/contracts/{contractId}/lems/{lemId}/approve/status` | Check LEM approval status |
| `POST` | `/approver/contracts/{contractId}/lems/{lemId}/approve` | Approve or reject a LEM |
| `GET` | `/approver/contracts/{contractId}/lems/{lemId}/ratesheet` | Get rate sheet for a LEM |
| `GET` | `/approver/contracts/{contractId}/ratesheets` | List rate sheets |
| `GET` | `/approver/contracts/{contractId}/ratesheets/{rateSheetId}` | Get rate sheet details |

---

### 1.11 Contract Changes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/changes/stats` | Change statistics |
| `GET` | `/approver/contracts/{contractId}/changes` | List changes (paginated) |
| `GET` | `/approver/contracts/{contractId}/changes/{changeId}` | Get change details |
| `GET` | `/approver/contracts/{contractId}/changes/{changeId}/comment` | Get change comments |
| `POST` | `/approver/contracts/{contractId}/changes/{changeId}/comment` | Add comment to a change |
| `POST` | `/approver/contracts/changes/{changeId}/comment/{commentId}/reply` | Reply to a comment |
| `GET` | `/approver/contracts/{contractId}/changes/{changeId}/approve/status` | Check change approval status |
| `POST` | `/approver/contracts/{contractId}/changes/{changeId}/approve` | Approve or reject a change |

---

### 1.12 Contract Deliverables

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/deliverables/stats` | Deliverable statistics |
| `GET` | `/approver/contracts/{contractId}/deliverables` | List deliverables |
| `GET` | `/approver/contracts/{contractId}/deliverables/{deliverableId}` | Get deliverable details |
| `GET` | `/approver/contracts/{contractId}/deliverables/{deliverableId}/approve/status` | Check deliverable approval status |
| `POST` | `/approver/contracts/{contractId}/deliverables/{deliverableId}/approve` | Approve or reject a deliverable |

---

### 1.13 RFIs (Requests for Information)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/rfi/stats` | RFI statistics (all, issue, receive) |
| `GET` | `/approver/contracts/{contractId}/rfi` | List RFIs (paginated) |
| `POST` | `/approver/contracts/{dataId}/rfi` | Create a new RFI |
| `GET` | `/approver/contracts/{contractId}/rfi/{rfiId}` | Get RFI details |
| `GET` | `/approver/contracts/{contractId}/rfi/{rfiId}/response` | Get RFI responses |
| `POST` | `/approver/contracts/{dataId}/rfi/{rfiId}/response` | Create RFI response |
| `GET` | `/approver/contracts/{contractId}/rfi/{rfiId}/comment` | Get RFI comments |
| `POST` | `/approver/contracts/{contractId}/rfi/{rfiId}/comment` | Add comment to RFI |
| `POST` | `/approver/contracts/rfi/{rfiId}/comment/{commentId}/reply` | Reply to RFI comment |

---

### 1.14 NCRs (Non-Conformance Reports)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/ncrs/stats` | NCR statistics |
| `GET` | `/approver/contracts/{contractId}/ncrs` | List NCRs (paginated) |
| `POST` | `/approver/contracts/{contractId}/ncrs` | Create a new NCR |
| `GET` | `/approver/contracts/{contractId}/ncrs/{ncrId}` | Get NCR details |
| `POST` | `/approver/contracts/{contractId}/ncrs/{ncrId}/capa` | Create NCR CAPA |
| `PATCH` | `/approver/contracts/{contractId}/ncrs/{ncrId}/capa/{capaId}/approve` | Approve NCR CAPA |
| `PATCH` | `/approver/contracts/{contractId}/ncrs/{ncrId}/close` | Close NCR |

---

### 1.15 Claims

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/claim/stats` | Claim statistics |
| `GET` | `/approver/contracts/{contractId}/claim` | List claims (paginated) |
| `GET` | `/approver/contracts/{contractId}/claim/{claimId}` | Get claim details |
| `GET` | `/approver/contracts/{contractId}/claim/{claimId}/comment` | Get claim comments |
| `POST` | `/approver/contracts/{contractId}/claim/{claimId}/comment` | Add comment to claim |
| `POST` | `/approver/contracts/claim/{claimId}/comment/{commentId}/reply` | Reply to claim comment |
| `POST` | `/approver/contracts/{contractId}/claim/{claimId}/approve` | Approve or reject a claim |

---

### 1.16 Invoices

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/invoice/stats` | Invoice statistics |
| `GET` | `/approver/contracts/{contractId}/invoice` | List invoices (paginated) |
| `GET` | `/approver/contracts/{contractId}/invoice/{invoiceId}` | Get invoice details |
| `GET` | `/approver/contracts/{contractId}/invoice/{invoiceId}/approve/status` | Check invoice approval status |
| `POST` | `/approver/contracts/{contractId}/invoice/{invoiceId}/approve` | Approve or reject invoice |

---

### 1.17 Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/reports/stats` | Report count |
| `GET` | `/approver/contracts/{contractId}/reports` | List vendor reports |
| `GET` | `/approver/contracts/{contractId}/reports/{reportId}` | Get report detail |

---

### 1.18 Amendments

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/contracts/{contractId}/amendment/stats` | Amendment statistics |
| `GET` | `/approver/contracts/{contractId}/amendment` | List amendments |
| `GET` | `/approver/contracts/{contractId}/amendment/{amendmentId}` | Get amendment details |
| `GET` | `/approver/contracts/{contractId}/amendment/{amendmentId}/approve/status` | Check amendment approval status |
| `POST` | `/approver/contracts/{contractId}/amendment/{amendmentId}/approve` | Approve or reject amendment |

---

### 1.19 Compliance
`GET /approver/contracts/{contractId}/compliance`

Returns compliance summary, policy list, and security list for a contract.

**Responses:** `200 OK` · `401` · `404` · `500`

---

## 2. Approver — Dashboard (Portfolio)

All portfolio dashboard endpoints accept a `type` query parameter: `Contract` (default) or `MsaContract`.

### Overview Cards

| Endpoint | Description |
|---|---|
| `GET /approver/contracts/dashboard/cards/total` | Total contract metrics. Optional `vendorId` filter. |
| `GET /approver/contracts/dashboard/cards/ytd` | Year-to-date contract metrics |

### Charts & Analytics

| Endpoint | Description |
|---|---|
| `GET /approver/contracts/dashboard/vendor-summary` | Vendor performance summary |
| `GET /approver/contracts/dashboard/renewals` | Renewals and expiry timeline |
| `GET /approver/contracts/dashboard/clause-intelligence` | Clause intelligence analysis |
| `GET /approver/contracts/dashboard/action-logs` | Recent action logs. Optional `vendorId` filter. |
| `GET /approver/contracts/dashboard/general-updates` | General updates feed |
| `GET /approver/contracts/dashboard/cycle-time` | Cycle time per workflow stage |
| `GET /approver/contracts/dashboard/invoice-status` | Invoice status counts. `range` param (default: 30) |
| `GET /approver/contracts/dashboard/committed-vs-actual` | Committed vs actual spend |
| `GET /approver/contracts/dashboard/vendor-contract-value` | Contract value by vendor |
| `GET /approver/contracts/dashboard/project-contract-value` | Contract value by project |
| `GET /approver/contracts/dashboard/risk-distribution` | Risk distribution breakdown |
| `GET /approver/contracts/dashboard/changes-order-impact` | Change order cost/time impact |
| `GET /approver/contracts/dashboard/category-value` | Contract value by category |
| `GET /approver/contracts/dashboard/compliance-status` | Compliance status summary |
| `GET /approver/contracts/dashboard/contract-status` | Contract status distribution |

---

## 3. Approver — MSA Contract

### 3.1 Core CRUD

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/msa-contract/stats` | MSA contract statistics |
| `GET` | `/approver/msa-contract` | List MSA contracts (paginated) |
| `GET` | `/approver/msa-contract/{contractId}` | Get MSA contract details |
| `GET` | `/approver/msa-contract/{contractId}/approve/status` | Check approval status |
| `POST` | `/approver/msa-contract/{contractId}/approve` | Approve or reject MSA contract |

### 3.2 Holdbacks & Savings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/approver/msa-contract/{contractId}/payment-holdbacks` | List holdbacks |
| `GET` | `/approver/msa-contract/payment-holdbacks/{holdBackId}` | Get holdback details |
| `GET` | `/approver/msa-contract/{contractId}/payment-savings` | List savings |
| `GET` | `/approver/msa-contract/payment-savings/{savingId}` | Get saving details |

### 3.3 Changes, Claims, RFIs, Invoices, Amendments, Compliance

These mirror the standard contract endpoints under `/approver/msa-contract/{contractId}/...`. Refer to section 1 for parameter and response details.

| Resource | Base Path |
|---|---|
| Changes | `/approver/msa-contract/{contractId}/changes/...` |
| Claims | `/approver/msa-contract/{contractId}/claim/...` |
| RFIs | `/approver/msa-contract/{contractId}/rfi/...` |
| Invoices | `/approver/msa-contract/{contractId}/invoice/...` |
| Amendments | `/approver/msa-contract/{contractId}/amendment/...` |
| Compliance | `/approver/msa-contract/{contractId}/compliance` |

---

## 4. Business Division

**Roles Required:** `contract_manager`, `procurement`

### 4.1 Create Business Division
`POST /manager/business-division`

**Request Body:**
```json
{
  "name": "string",
  "location": "string"
}
```

**Response (201):**
```json
{
  "data": {
    "_id": "string",
    "name": "string",
    "location": "string",
    "company": "string"
  }
}
```

---

### 4.2 List Business Divisions
`GET /manager/business-division`

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Page size |
| `search` | string | — | Search by name or location |

**Response includes:** `_id`, `name`, `location`, `totalProjects`, `totalContracts`, `totalProjectValue`, `totalContractValue`

---

### 4.3 Get Business Division Stats
`GET /manager/business-division/stats`

Returns `totalDivisions`.

---

### 4.4 Get Business Division by ID
`GET /manager/business-division/{divisionId}`

**Responses:** `200 OK` · `404 Not Found`

---

## 5. Project

**Roles:** `view_only`, `approver`, `company_admin`, `contract_manager`, `procurement`

### 5.1 Create Project
`POST /manager/projects`

**Roles Required:** `procurement`, `contract_manager`

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Project name |
| `category` | string | ✅ | Project domain/category |
| `description` | string | ✅ | Project scope |
| `budget` | number | ✅ | Allocated budget |
| `allowMultiple` | boolean | ✅ | Allow multiple contracts |
| `businessDivision` | string | — | Business division ID |
| `startDate` | date | — | ISO 8601 start date |
| `endDate` | date | — | ISO 8601 end date |
| `files` | array | — | File metadata objects |

**Responses:** `201 Created` · `401` · `403` · `409 Duplicate` · `422 Validation Error` · `500`

---

### 5.2 List Projects
`GET /manager/projects`

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `name` | string | Partial name match |
| `status` | string | `active` · `completed` · `cancelled` |
| `date` | date | Filter by `startDate >= date` |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Page size (default: 10) |

---

### 5.3 Get Project Statistics
`GET /manager/projects/stats`

**Response:**
```json
{
  "data": { "all": 42, "active": 18, "completed": 20, "cancelled": 4 }
}
```

---

### 5.4 Get Project by ID
`GET /manager/projects/{projectId}`

---

### 5.5 List Project Contracts
`GET /manager/projects/{projectId}/contracts`

---

### 5.6 Mark Project as Complete
`PATCH /manager/projects/{projectId}/complete`

**Roles Required:** `procurement`, `contract_manager`

---

## 6. Contract Manager — Contract

### 6.1 Reference / Lookup Endpoints

| Endpoint | Description |
|---|---|
| `GET /manager/types` | List contract types |
| `GET /manager/payment-terms` | List contract payment terms |
| `GET /manager/terms` | List contract term types |
| `GET /manager/awarded-solicitation` | List awarded vendors without contracts |
| `GET /manager/personnel` | List eligible contract personnel |
| `GET /manager/personnel/contract/{contractId}` | List personnel by contract |

---

### 6.2 Create Contract
`POST /manager/contracts`

**Roles Required:** `procurement`, `contract_manager`

**Required Fields:**

| Field | Type | Description |
|---|---|---|
| `title` | string | Contract title |
| `description` | string | Contract description |
| `category` | string | Contract category |
| `timezone` | string | Timezone string |
| `contractType` | string | Contract type ID |
| `contractRelationship` | string | `standalone` · `project` · `msa_project` |
| `rating` | number | 1–10 |

**Optional Fields (selection):**

| Field | Type | Description |
|---|---|---|
| `projectId` | string | Required when relationship is `project` |
| `msaContractId` | string | Required when relationship is `msa_project` |
| `solicitationId` | string | Awarded solicitation link |
| `businessDivision` | string | Business division ID |
| `vendor` | string | Vendor ObjectId or email |
| `status` | string | `draft` or `publish` (default: `publish`) |
| `currency` | string | Default: CAD |
| `contractAmount` | number | Total contract amount |
| `holdBack` | number | Holdback amount |
| `paymentStructure` | string | `Monthly` · `Milestone` · `Progress Draw` |
| `startDate` | datetime | Contract start date |
| `endDate` | datetime | Contract end date |
| `duration` | number | Duration in days |
| `visibility` | string | `public` or `private` (default: `private`) |
| `personnel` | array | `{ name, role, email, phone }` |
| `internalTeam` | array | Array of user IDs |
| `deliverables` | array | `{ name, dueDate }` |
| `milestone` | array | `{ amount, dueDate, name, deliverable }` |
| `insurance` | object | Insurance and security details |
| `files` | array | `{ name, url, type, size }` |
| `approvers` | array | Approval levels `{ user[], groupName, level, amount }` |
| `signatories` | array | Array of user IDs |
| `contractFormationStage` | object | `{ draft, review, approval, execution }` stage dates |

**Responses:** `201 Created` · `401` · `403` · `422 Validation Error` · `500`

---

### 6.3 List Contracts
`GET /manager/contracts`

Returns all contracts for the authenticated manager's company.

---

### 6.4 List My Contracts
`GET /manager/contracts/me`

**Role Required:** `contract_manager`

**Query Parameters:** `page`, `limit`, `status`, `category`, `date`

---

### 6.5 Get Contract Details
`GET /manager/contracts/{contractId}`

**Responses:** `200 OK` · `401` · `403` · `404` · `500`

---

### 6.6 Get Contract Statistics
`GET /manager/contracts/stats`

**Response:**
```json
{
  "data": {
    "all": 0, "active": 0, "draft": 0, "completed": 0,
    "pending": 0, "cancelled": 0, "suspended": 0, "expired": 0
  }
}
```

---

### 6.7 Get Vendor Project Managers
`GET /manager/contracts/vendor/{vendorId}/project-managers`

Returns project managers for a given vendor (by ID, vendorId, email, or name).

---

### 6.8 Contract Approvers

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/approvers` | List approvers with summary |
| `GET` | `/manager/contracts/{contractId}/approvers/{approverId}` | Get approver detail and actions |

**Approver Summary Fields:** `approverId`, `name`, `email`, `role`, `approvalLevel`, `assignedApprovals`, `status`

---

### 6.9 Contract KPIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/kpis` | List KPI dashboard rows |
| `GET` | `/manager/contracts/{contractId}/kpis/{kpiId}` | Get KPI detail with history |
| `POST` | `/manager/contracts/{contractId}/kpis/{kpiId}` | Submit KPI values |

**KPI Submission Body (ContractKPIDTO):**
```json
{
  "timestampDelivery": 0,
  "scheduleConfirm": 0,
  "mileStoneLog": 0,
  "inspectionReport": 0,
  "NCRLog": 0,
  "QADocs": 0,
  "timestampComLog": 0,
  "complianceTracking": 0,
  "invoiceContract": 0,
  "twoWay": 0,
  "issueResolution": 0
}
```

---

### 6.10 Compliance

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/compliance` | Get compliance details |
| `POST` | `/manager/contracts/{contractId}/compliance/approve` | Approve/reject compliance item |

---

### 6.11 Clause Library
`GET /manager/contracts/{contractId}/clauses`

Returns clause library data including risk ratings, section summaries, and redline comparisons.

**Response includes:**
- `analysisReady` — whether clause analysis is complete
- `sectionSummariesReady` — whether AI summaries are generated
- `contract` — core metadata
- `summary` — `{ total, high, medium, low }` risk counts
- `overallRiskLevel` — `high` · `medium` · `low` · `none`
- `sections` — array of 17 canonical contract sections, each with `clauses[]`

---

### 6.12 Contract Changes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/changes/stats` | Change statistics |
| `GET` | `/manager/contracts/{contractId}/changes` | List changes |
| `GET` | `/manager/contracts/{contractId}/changes/{changeId}` | Get change details |
| `POST` | `/manager/contracts/{dataId}/change/{type}` | Request a change (`type`: `Contract` or `MsaContract`) |
| `POST` | `/manager/contracts/{contractId}/changes/{changeId}/approve` | Approve/reject change (Manager) |
| `GET` | `/manager/contracts/{contractId}/changes/{changeId}/approve/status` | Check manager approval status |
| `GET` | `/manager/contracts/{contractId}/changes/{changeId}/approvers` | List change approvers |
| `GET` | `/manager/contracts/{contractId}/changes/{changeId}/comments` | Get change comments |
| `POST` | `/manager/contracts/{contractId}/changes/{changeId}/comments` | Add comment |
| `POST` | `/manager/contracts/{contractId}/changes/{changeId}/comments/{commentId}/reply` | Reply to comment |

**Change Request Body (Manager):**
```json
{
  "title": "string",
  "description": "string",
  "proposalCategory": "string",
  "urgency": "low" | "medium" | "high",
  "type": "directive" | "proposal",
  "files": [{ "name": "", "url": "", "type": "", "size": 0 }]
}
```

---

### 6.13 Contract Claims

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/claims/stats` | Claim statistics |
| `GET` | `/manager/contracts/{contractId}/claims` | List claims |
| `POST` | `/manager/contracts/{contractId}/claims` | Create a claim |
| `GET` | `/manager/contracts/{contractId}/claims/{claimId}` | Get claim details |
| `POST` | `/manager/contracts/{contractId}/claims/{claimId}/approve` | Approve/reject claim (Manager) |
| `GET` | `/manager/contracts/{contractId}/claims/{claimId}/approve/status` | Check manager approval status |
| `GET` | `/manager/contracts/{contractId}/claims/{claimId}/approvers` | List approvers |
| `POST` | `/manager/contracts/{contractId}/claims/{claimId}/approvers` | Send claim to approvers |
| `GET` | `/manager/contracts/{contractId}/claims/{claimId}/comments` | Get comments |
| `POST` | `/manager/contracts/{contractId}/claims/{claimId}/comments` | Add comment |
| `POST` | `/manager/contracts/{contractId}/claims/{claimId}/comments/{commentId}/reply` | Reply to comment |

**Claim Body:**
```json
{
  "title": "string",
  "type": "string",
  "impact": "time" | "cost" | "time_cost",
  "time": 0,
  "cost": 0,
  "description": "string",
  "files": []
}
```

---

### 6.14 Contract Deliverables

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/deliverables/stats` | Deliverable statistics |
| `GET` | `/manager/contracts/{contractId}/deliverables` | List deliverables |
| `GET` | `/manager/contracts/{contractId}/deliverables/{deliverableId}` | Get deliverable details |
| `POST` | `/manager/contracts/{contractId}/deliverables/{deliverableId}/approve` | Approve/reject (Manager) |
| `GET` | `/manager/contracts/{contractId}/deliverables/{deliverableId}/approve/status` | Check manager status |

---

### 6.15 Contract Invoices

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/invoice/stats` | Invoice statistics |
| `GET` | `/manager/contracts/{contractId}/invoice` | List invoices |
| `GET` | `/manager/contracts/invoice/{invoiceId}` | Get invoice details |
| `POST` | `/manager/contracts/{contractId}/invoice/{invoiceId}/approve` | Approve/reject invoice (Manager) |

---

### 6.16 Contract Amendments

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/amendments/stats` | Amendment statistics |
| `GET` | `/manager/contracts/{contractId}/amendments` | List amendments |
| `POST` | `/manager/contracts/{contractId}/amendments` | Create amendment |
| `GET` | `/manager/contracts/{contractId}/amendments/{amendmentId}` | Get amendment details |
| `POST` | `/manager/contracts/{contractId}/amendments/{amendmentId}/approvers` | Add approvers |
| `POST` | `/manager/contracts/{contractId}/amendments/{amendmentId}/approve` | Approve/reject amendment |

**Amendment Body:**
```json
{
  "title": "string",
  "description": "string",
  "clause": "string",
  "others": "string",
  "changes": [{ "field": "time" | "cost" | "time_cost" | "others", "value": "string" }],
  "files": []
}
```

---

### 6.17 RFIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/rfis/stats` | RFI statistics |
| `GET` | `/manager/contracts/{contractId}/rfis` | List RFIs |
| `POST` | `/manager/contracts/{dataId}/rfis` | Create RFI |
| `GET` | `/manager/contracts/{contractId}/rfis/{rfiId}` | Get RFI details |
| `GET` | `/manager/contracts/{contractId}/rfis/{rfiId}/response` | Get RFI responses |
| `POST` | `/manager/contracts/{dataId}/rfis/{rfiId}/response` | Create RFI response |
| `GET` | `/manager/contracts/{contractId}/rfis/{rfiId}/comment` | Get RFI comments |
| `POST` | `/manager/contracts/{contractId}/rfis/{rfiId}/comment` | Add comment |
| `POST` | `/manager/contracts/{contractId}/rfis/{rfiId}/comment/{commentId}/reply` | Reply to comment |

**RFI Body:**
```json
{
  "title": "string",
  "description": "string",
  "deadline": "datetime",
  "responder": "userId",
  "files": []
}
```

---

### 6.18 NCRs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/ncrs/stats` | NCR statistics |
| `GET` | `/manager/contracts/{contractId}/ncrs` | List NCRs |
| `GET` | `/manager/contracts/{contractId}/ncrs/{ncrId}` | Get NCR details |

---

### 6.19 LEMs & Rate Sheets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/lems` | List LEMs |
| `GET` | `/manager/contracts/{contractId}/lems/{lemId}` | Get LEM details |
| `POST` | `/manager/contracts/{contractId}/lems/{lemId}/approve` | Approve/reject LEM |
| `GET` | `/manager/contracts/{contractId}/lems/{lemId}/approve/status` | Check manager status |
| `GET` | `/manager/contracts/{contractId}/lems/{lemId}/ratesheet` | Get LEM rate sheet |
| `GET` | `/manager/contracts/{contractId}/ratesheets` | List rate sheets |
| `GET` | `/manager/contracts/{contractId}/ratesheets/{rateSheetId}` | Get rate sheet |
| `POST` | `/manager/contracts/{contractId}/ratesheets/{rateSheetId}/approve` | Approve/reject rate sheet |
| `GET` | `/manager/contracts/{contractId}/ratesheets/{rateSheetId}/approve/status` | Check manager status |

---

### 6.20 Holdbacks & Savings

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/manager/contracts/{contractId}/payment-holdbacks` | Create holdback |
| `GET` | `/manager/contracts/{contractId}/payment-holdbacks` | List holdbacks |
| `GET` | `/manager/contracts/payment-holdbacks/{holdBackId}` | Get holdback details |
| `POST` | `/manager/contracts/{contractId}/payment-savings` | Create saving |
| `GET` | `/manager/contracts/{contractId}/payment-savings` | List savings |
| `GET` | `/manager/contracts/payment-savings/{savingId}` | Get saving details |

---

### 6.21 Reports & Logs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/contracts/{contractId}/reports/stats` | Report count |
| `GET` | `/manager/contracts/{contractId}/reports` | List vendor reports |
| `GET` | `/manager/contracts/{contractId}/reports/{reportId}` | Get report detail |
| `GET` | `/manager/contracts/{contractId}/logs` | List action logs |
| `GET` | `/manager/contracts/{contractId}/logs/{logId}` | Get log detail |

---

### 6.22 Contract Manager Dashboard

| Endpoint | Description |
|---|---|
| `GET /manager/contracts/{contractId}/dashboard/financial-statement` | Financial overview |
| `GET /manager/contracts/{contractId}/dashboard/deliverable-status` | Deliverable status chart |
| `GET /manager/contracts/{contractId}/dashboard/activities` | Activity chart |
| `GET /manager/contracts/{contractId}/dashboard/delivery-summary` | Delivery performance |
| `GET /manager/contracts/{contractId}/dashboard/attachment` | Amendment and policy counts |
| `GET /manager/contracts/{contractId}/dashboard/vendor-kpi` | Vendor KPI |
| `GET /manager/contracts/{contractId}/dashboard/overview` | Overview card metrics |
| `GET /manager/contracts/{contractId}/dashboard/alerts` | Monitoring alerts |
| `GET /manager/contracts/{contractId}/dashboard/clause-legal-analysis` | Clause legal analysis |

**Portfolio Dashboard (same as Approver, under `/manager/contracts/dashboard/...`):**

| Endpoint | Description |
|---|---|
| `/manager/contracts/dashboard/vendor-summary` | Vendor performance table |
| `/manager/contracts/dashboard/renewals` | Renewals and expiry timeline |
| `/manager/contracts/dashboard/clause-intelligence` | Clause intelligence |
| `/manager/contracts/dashboard/cards/total` | Total contract card |
| `/manager/contracts/dashboard/cards/ytd` | YTD contract card |
| `/manager/contracts/dashboard/action-logs` | Recent action logs |
| `/manager/contracts/dashboard/general-updates` | General updates feed |
| `/manager/contracts/dashboard/cycle-time` | Cycle time per stage |
| `/manager/contracts/dashboard/invoice-status` | Invoice status counts |
| `/manager/contracts/dashboard/committed-vs-actual` | Committed vs actual spend |
| `/manager/contracts/dashboard/vendor-contract-value` | Value by vendor |
| `/manager/contracts/dashboard/project-contract-value` | Value by project |
| `/manager/contracts/dashboard/risk-distribution` | Risk distribution |
| `/manager/contracts/dashboard/change-order-impact` | Change order impact |
| `/manager/contracts/dashboard/category-value` | Value by category |
| `/manager/contracts/dashboard/compliance-status` | Compliance status |
| `/manager/contracts/dashboard/contract-status` | Contract status distribution |

---

## 7. Contract Manager — MSA Contract

### 7.1 Core CRUD

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manager/msa-contract/stats` | MSA statistics |
| `GET` | `/manager/msa-contract` | List MSA contracts |
| `POST` | `/manager/msa-contract` | Create MSA contract |
| `GET` | `/manager/msa-contract/me` | List my MSA contracts |
| `GET` | `/manager/msa-contract/{contractId}` | Get MSA contract details |
| `PUT` | `/manager/msa-contract/{contractId}` | Update MSA contract |
| `GET` | `/manager/msa-contract/{contractId}/linked-contract` | Get linked standard contract |

**Create MSA Contract — Required Fields:**

| Field | Type | Description |
|---|---|---|
| `title` | string | MSA title |
| `msaType` | string | MSA type ID |
| `description` | string | Description |
| `rating` | number | 1–10 |
| `businessDivision` | string | Business division ID |

**Optional fields** follow the same pattern as standard contracts (vendor, personnel, insurance, deliverables, milestones, approvers, signatories, etc.)

---

### 7.2 MSA Sub-resources

All MSA sub-resources follow the same structure as contract sub-resources. Replace `/manager/contracts/` with `/manager/msa-contract/`.

| Resource | Available Operations |
|---|---|
| KPIs | List, Get detail, Submit values |
| Compliance | Get details, Approve/reject |
| Changes | Stats, List, Get, Create, Approve, Comments |
| Claims | Stats, List, Create, Get, Approve, Comments, Send to approvers |
| RFIs | Stats, List, Create, Get, Response, Comments |
| Invoices | Stats, List, Get |
| Amendments | Stats, List, Create, Get, Add approvers, Approve |
| Holdbacks | Create, List, Get |
| Savings | Create, List, Get |
| Clause Library | Get clause analysis |

---

## 8. Vendor — Contract

### 8.1 Contract Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vendor/contracts/stats` | Vendor contract statistics |
| `GET` | `/vendor/contracts` | List vendor contracts (`contractType = Contract`) |
| `GET` | `/vendor/contracts/me` | List contracts as project manager |
| `GET` | `/vendor/contracts/{contractId}` | Get contract details |
| `GET` | `/vendor/contracts/{contractId}/personnel` | List contract personnel |

---

### 8.2 Contract Actions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/vendor/contracts/{contractId}/approve` | Approve or reject a contract |
| `POST` | `/vendor/contracts/{contractId}/project-managers/{projectManagerId}/assign` | Assign project manager |

**Approve Body:**
```json
{ "action": "approved" | "rejected", "comment": "string" }
```

---

### 8.3 Vendor Dashboard

| Endpoint | Description |
|---|---|
| `GET /vendor/contracts/dashboard/cards/total` | Dashboard total contract card |
| `GET /vendor/contracts/dashboard/action-logs` | Recent action logs |
| `GET /vendor/contracts/dashboard/general-updates` | General updates feed |

---

### 8.4 Compliance

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vendor/contracts/{contractId}/compliance` | Get compliance details |
| `PATCH` | `/vendor/contracts/{contractId}/compliance` | Update compliance item (files, description) |

**Compliance Patch Body:**
```json
{
  "description": "string",
  "type": "policy" | "security",
  "files": []
}
```

---

### 8.5 LEMs & Rate Sheets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vendor/contracts/{contractId}/lems` | List LEMs |
| `POST` | `/vendor/contracts/{contractId}/lems` | Create a LEM |
| `GET` | `/vendor/contracts/{contractId}/lems/{lemId}` | Get LEM details |
| `GET` | `/vendor/contracts/{contractId}/lems/{lemId}/ratesheet` | Get LEM rate sheet |
| `GET` | `/vendor/contracts/{contractId}/ratesheets` | List rate sheets |
| `POST` | `/vendor/contracts/{contractId}/ratesheets` | Create rate sheet |
| `GET` | `/vendor/contracts/{contractId}/ratesheets/{rateSheetId}` | Get rate sheet details |
| `PUT` | `/vendor/contracts/{contractId}/ratesheets/{rateSheetId}` | Update rate sheet (resets to pending) |

**LEM Body:**
```json
{
  "title": "string",
  "description": "string",
  "amount": 0,
  "files": []
}
```

---

### 8.6 KPIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vendor/contracts/{contractId}/kpis` | List contract KPIs |
| `GET` | `/vendor/contracts/{contractId}/kpis/{kpiId}` | Get KPI details |

---

### 8.7 Deliverables

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vendor/contracts/{contractId}/deliverables/stats` | Deliverable statistics |
| `GET` | `/vendor/contracts/{contractId}/deliverables` | List deliverables |
| `GET` | `/vendor/contracts/{contractId}/deliverables/{deliverableId}` | Get deliverable details |
| `POST` | `/vendor/contracts/{contractId}/deliverables/{deliverableId}/submit` | Submit a deliverable |

**Submit Body:**
```json
{
  "description": "string",
  "responders": ["userId"],
  "files": []
}
```

---

### 8.8 Invoices

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vendor/contracts/{contractId}/invoice/stats` | Invoice statistics |
| `POST` | `/vendor/contracts/{contractId}/invoice` | Create invoice |
| `GET` | `/vendor/contracts/{contractId}/invoice` | List invoices |
| `GET` | `/vendor/contracts/{contractId}/invoice/{invoiceId}` | Get invoice details |

**Invoice Body (required fields):**
```json
{
  "title": "string",
  "description": "string",
  "type": "progress draw" | "monthly payment" | "milestone payment" | "holdback",
  "taxCode": "HST" | "GST" | "PST/QST" | "Others",
  "status": "active" | "draft",
  "fileType": "manual" | "file",
  "taxValue": 0,
  "amount": 0
}
```

---

### 8.9 Changes, Claims, RFIs, NCRs, Amendments, Reports

These follow the same pattern as other roles. The vendor can also **create** certain resources:

| Resource | Create? | Notes |
|---|---|---|
| Changes | ✅ `POST` | Types: `request`, `directive`, `proposal` |
| Claims | ✅ `POST` | Full claim lifecycle |
| RFIs | ✅ `POST` | Issue and respond to RFIs |
| NCRs | ✅ `POST` | Create NCRs and CAPAs |
| Amendments | ❌ Read-only | Can update `status` via `PATCH /.../amendment/{amendmentId}/status` |
| Reports | ✅ `POST` | Submit vendor reports |
| Holdbacks | ❌ Read-only | — |
| Savings | ❌ Read-only | — |

**Amendment Vendor Status Update:**
```
PATCH /vendor/contracts/{contractId}/amendment/{amendmentId}/status
Body: { "status": "accepted" | "rejected" }
```

---

## 9. Vendor — MSA Contract

Mirrors the standard vendor contract endpoints. Replace `/vendor/contracts/` with `/vendor/msa-contract/`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vendor/msa-contract/stats` | MSA contract statistics |
| `GET` | `/vendor/msa-contract` | List vendor MSA contracts (`contractType = MsaContract`) |
| `GET` | `/vendor/msa-contract/{contractId}` | Get MSA contract details |
| `POST` | `/vendor/msa-contract/{contractId}/approve` | Approve/reject as project manager |
| `POST` | `/vendor/msa-contract/{contractId}/project-managers/{projectManagerId}/assign` | Assign project manager |
| `GET` | `/vendor/msa-contract/{contractId}/compliance` | Get compliance |
| `PATCH` | `/vendor/msa-contract/{contractId}/compliance` | Update compliance |

Sub-resources (Claims, RFIs, Invoices, Amendments, etc.) follow the same structure as `/vendor/msa-contract/{contractId}/...`

---

## 10. View-Only User — Contract

All endpoints are **read-only** (`GET` only). No creation or approval actions.

### 10.1 Core

| Endpoint | Description |
|---|---|
| `GET /user/contracts/stats` | Contract statistics |
| `GET /user/contracts` | List contracts |
| `GET /user/contracts/{contractId}` | Get contract details |
| `GET /user/contracts/{contractId}/compliance` | Compliance details |

### 10.2 Sub-resources (Read-Only)

| Resource | Endpoints |
|---|---|
| Changes | Stats, List, Get, Comments |
| Claims | Stats, List, Get, Comments |
| RFIs | Stats, List, Get, Comments, Responses |
| NCRs | Stats, List, Get |
| Invoices | Stats, List, Get |
| LEMs | List, Get |
| Rate Sheets | List, Get (by ID, by LEM) |
| Deliverables | Stats, List, Get, Approval status |
| Amendments | Stats, List, Get |
| Reports | Stats, List, Get |

---

## 11. View-Only User — MSA Contract

Mirrors the View-Only contract endpoints under `/user/msa-contract/...`

| Resource | Available |
|---|---|
| MSA Contracts | Stats, List, Get |
| Changes | Stats, List, Get, Comments |
| Claims | Stats, List, Get |
| RFIs | Stats, List, Get, Comments |
| Invoices | Stats, List, Get |
| Amendments | Stats, List, Get |
| Compliance | Get |
| Holdbacks | List, Get |
| Savings | List, Get |

---

## 12. Collaboration (WebSocket)

`GET /collab` — Upgrades to WebSocket for real-time collaborative document editing.

### Connection

```
wss://dev.swiftpro.tech/collab?doc=<document-id>&token=<jwt>
```

**Authentication (choose one):**
- Header: `Authorization: Bearer <jwt>` *(preferred)*
- Query: `?token=<jwt>` *(fallback)*

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `doc` | ✅ | Document room identifier (e.g., `contract-25-015`) |
| `token` | — | JWT fallback when Authorization header unavailable |

### Protocol Details

| Property | Value |
|---|---|
| Transport | Binary (Yjs sync protocol) |
| Protocols | `y-protocols/sync`, `y-protocols/awareness` |
| Max frame size | 1 MB |

### Connection Lifecycle

1. Open WebSocket connection to `/collab?doc=<id>`
2. Provide JWT via header or query param
3. Receive initial sync state from server (`sync_step_1`)
4. Exchange binary sync and awareness frames bidirectionally
5. Handle close codes and reconnect client-side as needed

### Close Codes

| Code | Trigger | Description |
|---|---|---|
| `1009` | Message too large | Payload exceeded 1 MB |
| `1011` | Persistence error | Server-side update persistence failed |
| `401` | Unauthorized | JWT/session/tenant validation failed |
| `403` | HTTPS required | Non-HTTPS traffic rejected in production |

---

## 13. Common Schemas

### Contract Status Values
`draft` · `pending_approval` · `active` · `completed` · `cancelled` · `expired` · `terminated`

### Contract Relationship Types
`standalone` · `project` · `msa_project`

### Contract Payment Structures
`Monthly` · `Milestone` · `Progress Draw`

### Approval Action
```json
{ "action": "approved" | "rejected", "comment": "string" }
```

### File Object
```json
{ "name": "string", "url": "string (uri)", "type": "string", "size": 0 }
```

### Approver Level Object
```json
{
  "user": ["userId"],
  "groupName": "string",
  "level": 1,
  "amount": 0
}
```

### Financial Statement
```json
{
  "originalContractValue": 0,
  "changeOrders": { "count": 0, "value": 0 },
  "pendingChangeOrders": 0,
  "savingsRealized": { "value": 0, "percentage": 0 },
  "percentageIncrease": 0,
  "holdbackAmount": 0,
  "releasedHoldback": 0,
  "currentContractValue": 0,
  "billedTillDate": 0,
  "remaining": 0,
  "currency": "CAD"
}
```

### Standard Error Responses

| Status | Schema | Example Message |
|---|---|---|
| `400` | BadRequest | `"Bad request"` |
| `401` | AuthenticatedError | `"User not authenticated"` |
| `403` | AuthorizeError | `"Unauthorized"` |
| `404` | NotFoundError | `"Not Found"` |
| `409` | DuplicateError | `"Duplicate entry"` |
| `422` | ValidationError | `"Validation failed"` |
| `500` | ServerError | `"Internal server error"` |

---

*Documentation generated from SwiftPro OpenAPI 3.0.0 spec, version 2.3.0.*