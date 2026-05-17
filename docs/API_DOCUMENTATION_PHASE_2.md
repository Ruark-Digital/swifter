# SwiftPro REST API — Developer Reference

**Version:** 2.3.0

***

## Base URLs

| Environment | URL                                             |
| ----------- | ----------------------------------------------- |
| Local       | `http://localhost:10001/api/v1/contract`        |
| Development | `https://dev.swiftpro.tech/api/v1/dev/contract` |

***

## Authentication

All endpoints require a JWT Bearer token in the request header:

```
Authorization: Bearer <your_token>
```

***

## Roles

| Role               | Who it's for                       |
| ------------------ | ---------------------------------- |
| `contract_manager` | Creates and manages contracts      |
| `procurement`      | Similar to contract\_manager       |
| `company_admin`    | Company-level administrator        |
| `approver`         | Reviews and approves/rejects items |
| `view_only`        | Read-only access to all data       |
| `vendor`           | External vendor (contractor)       |

***

## Common Response Codes

| Code  | Meaning                            |
| ----- | ---------------------------------- |
| `200` | OK                                 |
| `201` | Created                            |
| `400` | Bad request / invalid input        |
| `401` | Not authenticated                  |
| `403` | Authenticated but lacks permission |
| `404` | Resource not found                 |
| `409` | Duplicate entry                    |
| `422` | Validation failed                  |
| `500` | Server error                       |

***

## Table of Contents

1. [Projects](#1-projects)
2. [Business Divisions](#2-business-divisions)
3. [Reference / Lookup Data](#3-reference--lookup-data)
4. [Manager — Contracts](#4-manager--contracts)
5. [Manager — MSA Contracts](#5-manager--msa-contracts)
6. [Manager — Contract Changes](#6-manager--contract-changes)
7. [Manager — Contract Claims](#7-manager--contract-claims)
8. [Manager — Contract Invoices](#8-manager--contract-invoices)
9. [Manager — Contract Deliverables](#9-manager--contract-deliverables)
10. [Manager — Contract RFIs](#10-manager--contract-rfis)
11. [Manager — Contract NCRs](#11-manager--contract-ncrs)
12. [Manager — Contract LEMs](#12-manager--contract-lems)
13. [Manager — Rate Sheets](#13-manager--rate-sheets)
14. [Manager — Contract Amendments](#14-manager--contract-amendments)
15. [Manager — Contract Compliance](#15-manager--contract-compliance)
16. [Manager — Contract KPIs](#16-manager--contract-kpis)
17. [Manager — Holdbacks & Savings](#17-manager--holdbacks--savings)
18. [Manager — Contract Approvers](#18-manager--contract-approvers)
19. [Manager — Reports & Logs](#19-manager--reports--logs)
20. [Manager — Dashboards (Contract-level)](#20-manager--dashboards-contract-level)
21. [Manager — Dashboards (Portfolio-level)](#21-manager--dashboards-portfolio-level)
22. [Approver — Contracts & MSA Contracts](#22-approver--contracts--msa-contracts)
23. [Approver — Contract Sub-Resources](#23-approver--contract-sub-resources)
24. [Approver — Dashboards](#24-approver--dashboards)
25. [Vendor — Contracts & MSA Contracts](#25-vendor--contracts--msa-contracts)
26. [Vendor — Contract Sub-Resources](#26-vendor--contract-sub-resources)
27. [Vendor — Dashboard](#27-vendor--dashboard)
28. [View-Only — Contracts & MSA Contracts](#28-view-only--contracts--msa-contracts)
29. [View-Only — Contract Sub-Resources](#29-view-only--contract-sub-resources)
30. [Collaboration (WebSocket)](#30-collaboration-websocket)

***

## 1. Projects

Projects group related contracts under a single initiative.

### Endpoints at a Glance

| Method  | Path                                      | Description               | Roles                             |
| ------- | ----------------------------------------- | ------------------------- | --------------------------------- |
| `GET`   | `/manager/projects`                       | List all projects         | All                               |
| `GET`   | `/manager/projects/stats`                 | Count by status           | All                               |
| `GET`   | `/manager/projects/{projectId}`           | Get project detail        | All                               |
| `POST`  | `/manager/projects`                       | Create a project          | `contract_manager`, `procurement` |
| `GET`   | `/manager/projects/{projectId}/contracts` | List contracts in project | All                               |
| `PATCH` | `/manager/projects/{projectId}/complete`  | Mark project complete     | `contract_manager`, `procurement` |

***

### GET `/manager/projects` — List Projects

**Query Parameters:**

| Param    | Type    | Default | Description                        |
| -------- | ------- | ------- | ---------------------------------- |
| `name`   | string  | —       | Partial name search                |
| `date`   | date    | —       | Filter: `startDate >= date`        |
| `status` | enum    | —       | `active`, `completed`, `cancelled` |
| `page`   | integer | 1       | Page number                        |
| `limit`  | integer | 10      | Results per page                   |

**Sample Response:**

```json
{
  "status": 200,
  "message": "Projects fetched successfully",
  "data": [
    {
      "_id": "671c2f0d9f4e2b0012345678",
      "name": "School Renovation",
      "category": "Education",
      "status": "active",
      "budget": 1200000,
      "allowMultiple": true
    }
  ]
}
```

***

### GET `/manager/projects/stats` — Project Statistics

Returns: `{ all, active, completed, cancelled }`

***

### POST `/manager/projects` — Create Project

**Request Body:**

| Field              | Type    | Required | Description                   |
| ------------------ | ------- | -------- | ----------------------------- |
| `name`             | string  | ✅        | Project name                  |
| `category`         | string  | ✅        | Domain (e.g., "Education")    |
| `description`      | string  | ✅        | Scope details                 |
| `budget`           | number  | ✅        | Allocated budget              |
| `allowMultiple`    | boolean | ✅        | Allow multiple contracts      |
| `businessDivision` | string  | <br />   | Division ID                   |
| `startDate`        | date    | <br />   | ISO 8601 (e.g., `2026-01-15`) |
| `endDate`          | date    | <br />   | ISO 8601                      |
| `files`            | array   | <br />   | `[{ name, url, type, size }]` |

***

## 2. Business Divisions

Divisions allow you to organise contracts and projects by department or location.

### Endpoints at a Glance

| Method | Path                                      | Description          | Roles                             |
| ------ | ----------------------------------------- | -------------------- | --------------------------------- |
| `GET`  | `/manager/business-division`              | List divisions       | All                               |
| `GET`  | `/manager/business-division/stats`        | Total division count | All                               |
| `GET`  | `/manager/business-division/{divisionId}` | Get division detail  | All                               |
| `POST` | `/manager/business-division`              | Create a division    | `contract_manager`, `procurement` |

***

### GET `/manager/business-division` — List Divisions

**Query Parameters:** `page`, `limit`, `search`

**Response fields per division:** `_id`, `name`, `location`, `totalProjects`, `totalContracts`, `totalProjectValue`, `totalContractValue`

***

### POST `/manager/business-division` — Create Division

| Field      | Required | Description     |
| ---------- | -------- | --------------- |
| `name`     | ✅        | Division name   |
| `location` | ✅        | Location string |

***

## 3. Reference / Lookup Data

These endpoints return lookup data used when creating contracts.

### Endpoints at a Glance

| Method | Path                                                    | Description                       | Roles                               |
| ------ | ------------------------------------------------------- | --------------------------------- | ----------------------------------- |
| `GET`  | `/manager/types`                                        | List contract types               | `contract_manager`, `company_admin` |
| `GET`  | `/manager/payment-terms`                                | List payment terms                | All                                 |
| `GET`  | `/manager/terms`                                        | List term types                   | All                                 |
| `GET`  | `/manager/awarded-solicitation`                         | Awarded vendors without contracts | `procurement`, `contract_manager`   |
| `GET`  | `/manager/personnel`                                    | List eligible personnel           | `procurement`, `contract_manager`   |
| `GET`  | `/manager/personnel/contract/{contractId}`              | Personnel for a contract          | `contract_manager`, `company_admin` |
| `GET`  | `/manager/contracts/vendor/{vendorId}/project-managers` | Project managers for a vendor     | `contract_manager`, `company_admin` |

Each lookup returns an array of `{ _id, name, description }` objects.

***

## 4. Manager — Contracts

### Endpoints at a Glance

| Method | Path                              | Description         | Roles                             |
| ------ | --------------------------------- | ------------------- | --------------------------------- |
| `GET`  | `/manager/contracts/stats`        | Count by status     | All                               |
| `GET`  | `/manager/contracts`              | List all contracts  | All                               |
| `GET`  | `/manager/contracts/me`           | List my contracts   | `contract_manager`                |
| `GET`  | `/manager/contracts/{contractId}` | Get contract detail | All                               |
| `GET`  | `/manager/contracts/{contractId}/clauses` | Get contract clause library | All |
| `POST` | `/manager/contracts`              | Create contract     | `procurement`, `contract_manager` |
| `PUT`  | `/manager/contracts/{contractId}` | Update contract     | `procurement`, `contract_manager` |

***

### GET `/manager/contracts/stats` — Contract Statistics

Returns: `{ all, active, draft, completed, pending, cancelled, suspended, expired }`

***

### GET `/manager/contracts` — List Contracts

**Query Parameters:** `page`, `limit`, `status`, `category`, `date`

***

### POST/PUT `/manager/contracts` — Create or Update Contract

Both endpoints use the same request body structure.

**Required fields:** `title`, `description`, `category`, `timezone`, `contractType`, `contractRelationship`, `rating`

**Full Request Body:**

| Field                    | Type        | Required | Description                                                                 |
| ------------------------ | ----------- | -------- | --------------------------------------------------------------------------- |
| `title`                  | string      | ✅        | Contract title                                                              |
| `description`            | string      | ✅        | Summary of scope                                                            |
| `category`               | string      | ✅        | e.g. "Construction", "IT"                                                   |
| `timezone`               | string      | ✅        | e.g. `America/Toronto`                                                      |
| `contractType`           | string (ID) | ✅        | Type ID from `/manager/types`                                               |
| `contractRelationship`   | enum        | ✅        | `standalone` \| `project` \| `msa_project`                                  |
| `rating`                 | number      | ✅        | 1–10                                                                        |
| `status`                 | enum        | <br />   | `draft` \| `publish` (default: `publish`)                                   |
| `projectId`              | string      | <br />   | Required when relationship is `project`                                     |
| `msaContractId`          | string      | <br />   | Required when relationship is `msa_project`                                 |
| `solicitationId`         | string      | <br />   | Link to awarded solicitation                                                |
| `businessDivision`       | string      | <br />   | Division ID                                                                 |
| `currency`               | string      | <br />   | Default: `CAD`                                                              |
| `contractPaymentTerm`    | string (ID) | <br />   | From `/manager/payment-terms`                                               |
| `contractTermType`       | string (ID) | <br />   | From `/manager/terms`                                                       |
| `contractId`             | string      | <br />   | Optional external/custom ID                                                 |
| `jobTitle`               | string      | <br />   | <br />                                                                      |
| `vendor`                 | string      | <br />   | Vendor ObjectId or email                                                    |
| `personnel`              | array       | <br />   | `[{ name, role, email, phone }]`                                            |
| `internalTeam`           | array       | <br />   | List of internal user IDs                                                   |
| `visibility`             | enum        | <br />   | `public` \| `private` (default: `private`)                                  |
| `contractAmount`         | number      | <br />   | <br />                                                                      |
| `contigency`             | string      | <br />   | e.g. `"10%"`                                                                |
| `holdBack`               | number      | <br />   | <br />                                                                      |
| `paymentTerm`            | string      | <br />   | <br />                                                                      |
| `paymentStructure`       | enum        | <br />   | `Monthly` \| `Milestone` \| `Progress Draw`                                 |
| `startDate`              | date-time   | <br />   | <br />                                                                      |
| `endDate`                | date-time   | <br />   | <br />                                                                      |
| `duration`               | number      | <br />   | Duration in days                                                            |
| `termType`               | string      | <br />   | <br />                                                                      |
| `contractFormationStage` | object      | <br />   | `{ draft, review, approval, execution }` each with `{ startDate, endDate }` |
| `deliverables`           | array       | <br />   | `[{ name, dueDate }]`                                                       |
| `milestone`              | array       | <br />   | `[{ name, amount, dueDate, deliverable }]`                                  |
| `insurance`              | object      | <br />   | See Insurance schema below                                                  |
| `files`                  | array       | <br />   | `[{ name, url, type, size }]`                                               |
| `approvaers`             | array       | <br />   | `[{ user[], groupName, levelName (1–5), amount }]` — note legacy typo field |
| `approvers`              | array       | <br />   | `[{ user[], groupName, level, amount }]`                                    |
| `signatories`            | array       | <br />   | List of user IDs                                                            |

**Insurance object:**

| Field | Type | Details |
| --- | --- | --- |
| `contractSecurity` | `boolean` |  |
| `contractSecurityType` | `array<object>` | items properties: securityType, amount, dueDate |
| `expiryDate` | `string (date-time)` |  |
| `insurance` | `string` |  |
| `policy` | `array<object>` | items properties: policyName, limit |

***

### GET `/manager/contracts/{contractId}` — Contract Detail

**Sample Response:**

```json
{
  "status": 200,
  "message": "Contract fetched successfully",
  "data": {
    "_id": "66c2f22e9f4e2b0012345678",
    "contractId": "CTR-2026-001",
    "title": "Bridge Inspection",
    "status": "active",
    "holdBackReleased": 15000,
    "savingAmount": 4500,
    "vendor": { "_id": "...", "name": "..." },
    "internalTeam": [ ... ],
    "approvers": [ ... ]
  }
}
```

***

## 5. Manager — MSA Contracts

MSA (Master Services Agreement) contracts are umbrella contracts that can have linked sub-contracts.

### Endpoints at a Glance

| Method | Path                                                 | Description             | Roles                                              |
| ------ | ---------------------------------------------------- | ----------------------- | -------------------------------------------------- |
| `GET`  | `/manager/msa-contract/stats`                        | Count MSA contracts     | `contract_manager`, `procurement`, `company_admin` |
| `GET`  | `/manager/msa-contract`                              | List MSA contracts      | `contract_manager`, `procurement`, `company_admin` |
| `GET`  | `/manager/msa-contract/me`                           | List my MSA contracts   | `contract_manager`, `procurement`, `company_admin` |
| `GET`  | `/manager/msa-contract/{contractId}`                 | Get MSA contract detail | `contract_manager`, `procurement`, `company_admin` |
| `POST` | `/manager/msa-contract`                              | Create MSA contract     | `contract_manager`, `procurement`, `company_admin` |
| `PUT`  | `/manager/msa-contract/{contractId}`                 | Update MSA contract     | `contract_manager`, `procurement`, `company_admin` |
| `GET`  | `/manager/msa-contract/{contractId}/linked-contract` | Get linked sub-contract | `contract_manager`, `procurement`, `company_admin` |
| `GET`  | `/manager/msa-contract/{contractId}/clauses`         | Get clause library      | `contract_manager`, `procurement`, `company_admin` |
| `GET`  | `/manager/msa-contracts/{contractId}/amendments`      | List amendments         | `contract_manager`, `procurement`, `company_admin` |
| `GET`  | `/manager/msa-contracts/{contractId}/amendments/stats`| Amendment statistics    | `contract_manager`, `procurement`, `company_admin` |

***

### MSA Contract Sub-Resource Endpoints (from Swagger)

#### Amendments

| Method | Path                                                              | Description                      |
| ------ | ----------------------------------------------------------------- | -------------------------------- |
| `GET`  | `/manager/msa-contracts/{contractId}/amendments`                  | List amendments                  |
| `GET`  | `/manager/msa-contracts/{contractId}/amendments/stats`            | Get amendment statistics         |
| `POST` | `/manager/msa-contract/{contractId}/amendments`                   | Create amendment                 |
| `GET`  | `/manager/msa-contract/{contractId}/amendments/{amendmentId}`      | Get amendment details            |
| `PUT`  | `/manager/msa-contract/{contractId}/amendments/{amendmentId}`      | Edit amendment                   |
| `POST` | `/manager/msa-contract/{contractId}/amendments/{amendmentId}/approve`   | Approve/Reject amendment     |
| `POST` | `/manager/msa-contract/{contractId}/amendments/{amendmentId}/approvers` | Add approvers to amendment   |

#### Changes

| Method | Path                                                                   | Description                                      |
| ------ | ---------------------------------------------------------------------- | ------------------------------------------------ |
| `GET`  | `/manager/msa-contract/{contractId}/changes/stats`                     | Get MSA contract change statistics               |
| `GET`  | `/manager/msa-contract/{contractId}/changes`                           | List MSA contract changes                        |
| `GET`  | `/manager/msa-contract/{contractId}/changes/{changeId}`                | Get an MSA contract change                       |
| `PUT`  | `/manager/msa-contract/{contractId}/changes/{changeId}`                | Edit a rejected MSA contract change (Manager)    |
| `POST` | `/manager/msa-contract/{contractId}/changes/{changeId}/approve`        | Approve or reject an MSA contract change (Manager) |
| `GET`  | `/manager/msa-contract/{contractId}/changes/{changeId}/approve/status` | Check manager approval status for an MSA contract change |
| `GET`  | `/manager/msa-contract/{contractId}/changes/{changeId}/approvers`      | Get MSA contract change approvers                |
| `POST` | `/manager/msa-contract/{contractId}/changes/{changeId}/approvers`      | Assign multi-level approvers to an MSA contract change |
| `POST` | `/manager/msa-contract/{dataId}/change/{type}`                         | Request an MSA contract change                   |

#### Claims

| Method | Path                                                                                 | Description                                   |
| ------ | ------------------------------------------------------------------------------------ | --------------------------------------------- |
| `GET`  | `/manager/msa-contract/{contractId}/claims/stats`                                    | Get MSA contract claim statistics            |
| `GET`  | `/manager/msa-contract/{contractId}/claims`                                          | List MSA contract claims                     |
| `GET`  | `/manager/msa-contract/{contractId}/claims/{claimId}`                                | Get an MSA contract claim                    |
| `PUT`  | `/manager/msa-contract/{contractId}/claims/{claimId}`                                | Edit an MSA contract claim                   |
| `POST` | `/manager/msa-contract/{contractId}/claims/{claimId}/approve`                        | Approve or reject an MSA contract claim (Manager) |
| `GET`  | `/manager/msa-contract/{contractId}/claims/{claimId}/approve/status`                 | Check manager approval status for an MSA contract claim |
| `GET`  | `/manager/msa-contract/{contractId}/claims/{claimId}/approvers`                      | Get MSA contract claim approvers             |
| `POST` | `/manager/msa-contract/{contractId}/claims/{claimId}/approvers`                      | Send MSA contract claim to approvers         |
| `GET`  | `/manager/msa-contract/{contractId}/claims/{claimId}/comments`                       | Get MSA contract claim comments              |
| `POST` | `/manager/msa-contract/{contractId}/claims/{claimId}/comments`                       | Add a comment to an MSA contract claim       |
| `POST` | `/manager/msa-contract/{contractId}/claims/{claimId}/comments/{commentId}/reply`     | Reply to an MSA contract claim comment       |

#### Compliance

| Method | Path                                                         | Description                                   |
| ------ | ------------------------------------------------------------ | --------------------------------------------- |
| `GET`  | `/manager/msa-contract/{contractId}/compliance`              | Get MSA contract compliance details           |
| `POST` | `/manager/msa-contract/{contractId}/compliance/{type}/approve` | Approve or reject an MSA contract compliance item |

#### Invoices

| Method | Path                                                     | Description                        |
| ------ | -------------------------------------------------------- | ---------------------------------- |
| `GET`  | `/manager/msa-contract/{contractId}/invoice`             | List MSA contract invoices         |
| `GET`  | `/manager/msa-contract/{contractId}/invoice/{invoiceId}` | Get MSA contract invoice details   |
| `POST` | `/manager/msa-contracts/{contractId}/invoice/{invoiceId}/approve` | Approve or reject a contract invoice (Manager) |
| `GET`  | `/manager/msa-contract/{contractId}/invoice/stats`       | Get MSA contract invoice statistics |

#### KPIs

| Method | Path                                                 | Description                         |
| ------ | ---------------------------------------------------- | ----------------------------------- |
| `GET`  | `/manager/msa-contract/{contractId}/kpis`            | List MSA contract KPI dashboard rows |
| `GET`  | `/manager/msa-contract/{contractId}/kpis/{kpiId}`    | Get KPI detail                      |
| `POST` | `/manager/msa-contract/{contractId}/kpis/{kpiId}`    | Submit KPI values                   |

#### Holdbacks & Savings

| Method | Path                                                       | Description              |
| ------ | ---------------------------------------------------------- | ------------------------ |
| `GET`  | `/manager/msa-contract/{contractId}/payment-holdbacks`     | List holdbacks           |
| `POST` | `/manager/msa-contract/{contractId}/payment-holdbacks`     | Create a new holdback    |
| `GET`  | `/manager/msa-contract/payment-holdbacks/{holdBackId}`     | Get holdback details     |
| `GET`  | `/manager/msa-contract/{contractId}/payment-savings`       | List savings             |
| `POST` | `/manager/msa-contract/{contractId}/payment-savings`       | Create a new saving      |
| `GET`  | `/manager/msa-contract/payment-savings/{savingId}`         | Get saving details       |

#### RFIs

| Method | Path                                                                 | Description                   |
| ------ | -------------------------------------------------------------------- | ----------------------------- |
| `GET`  | `/manager/msa-contract/{contractId}/rfi`                             | List contract RFIs            |
| `GET`  | `/manager/msa-contract/{contractId}/rfi/stats`                       | Get MSA contract RFI statistics |
| `GET`  | `/manager/msa-contract/{contractId}/rfi/{rfiId}`                     | Get a specific RFI            |
| `GET`  | `/manager/msa-contract/{contractId}/rfi/{rfiId}/response`            | Get RFI responses             |
| `GET`  | `/manager/msa-contract/{contractId}/rfi/{rfiId}/comment`             | Get contract RFI comments     |
| `POST` | `/manager/msa-contract/{contractId}/rfi/{rfiId}/comment`             | Add a comment to a contract RFI |
| `POST` | `/manager/msa-contract/{contractId}/rfi/{rfiId}/comment/{commentId}/reply` | Reply to a contract RFI comment |
| `POST` | `/manager/msa-contract/{dataId}/rfi`                                 | Create a new RFI issue        |
| `POST` | `/manager/msa-contract/{dataId}/rfi/{rfiId}/response`                | Create RFI response           |

#### Approvers

| Method | Path                                                        | Description                    |
| ------ | ----------------------------------------------------------- | ------------------------------ |
| `GET`  | `/manager/msa-contract/{contractId}/approvers`              | Get MSA contract approvers     |
| `GET`  | `/manager/msa-contract/{contractId}/approvers/{approverId}` | Get MSA contract approver details |

### POST `/manager/msa-contract` — Create MSA Contract

**Required fields:** `title`, `msaType`, `description`, `rating`, `businessDivision`

| Field                    | Type          | Required | Description                                    |
| ------------------------ | ------------- | -------- | ---------------------------------------------- |
| `title`                  | string        | ✅        | MSA title                                      |
| `msaType`                | string        | ✅        | Type identifier                                |
| `description`            | string        | ✅        | Scope summary                                  |
| `rating`                 | number (1–10) | ✅        | <br />                                         |
| `businessDivision`       | string (ID)   | ✅        | Division ID                                    |
| `status`                 | enum          | <br />   | `draft` \| `publish`                           |
| `timezone`               | string        | <br />   | <br />                                         |
| `msaContractId`          | string        | <br />   | Custom external ID                             |
| `currency`               | string        | <br />   | <br />                                         |
| `vendor`                 | string        | <br />   | Vendor ID or email                             |
| `projectManager`         | string        | <br />   | PM user ID                                     |
| `personnel`              | array         | <br />   | `[{ name, role, email, phone }]`               |
| `internalTeam`           | array         | <br />   | User IDs                                       |
| `visibility`             | enum          | <br />   | `public` \| `private`                          |
| `contractAmount`         | number        | <br />   | <br />                                         |
| `holdBack`               | number        | <br />   | <br />                                         |
| `paymentStructure`       | enum          | <br />   | `Monthly` \| `Milestone` \| `Progress Draw`    |
| `milestone`              | array         | <br />   | `[{ name, amount, dueDate, deliverable }]`     |
| `startDate` / `endDate`  | date          | <br />   | <br />                                         |
| `duration`               | number        | <br />   | <br />                                         |
| `contractFormationStage` | object        | <br />   | `{ draft, review, approval, execution }`       |
| `deliverables`           | array         | <br />   | `[{ name, dueDate }]`                          |
| `insurance`              | object        | <br />   | Same structure as contract insurance           |
| `files`                  | array         | <br />   | `[{ name, url, type, size }]`                  |
| `approvers`              | array         | <br />   | `[{ user[], groupName, level (1–5), amount }]` |
| `signatories`            | array         | <br />   | User IDs                                       |

***

## 6. Manager — Contract Changes

Contract changes capture requests, directives, proposals, and change orders.

### Endpoints at a Glance

| Method | Path                                                                            | Description               | Roles                             |
| ------ | ------------------------------------------------------------------------------- | ------------------------- | --------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/changes/stats`                                 | Change counts by type     | All                               |
| `GET`  | `/manager/contracts/{contractId}/changes`                                       | List changes              | All                               |
| `GET`  | `/manager/contracts/{contractId}/changes/{changeId}`                            | Get change detail         | All                               |
| `POST` | `/manager/contracts/{dataId}/change/{type}`                                     | Create a change           | `contract_manager`, `procurement` |
| `PUT`  | `/manager/contracts/{contractId}/changes/{changeId}`                            | Re-submit rejected change | `contract_manager`, `procurement` |
| `POST` | `/manager/contracts/{contractId}/changes/{changeId}/approve`                    | Manager approve/reject    | `contract_manager`, `procurement` |
| `GET`  | `/manager/contracts/{contractId}/changes/{changeId}/approve/status`             | Check approval status     | `contract_manager`, `procurement` |
| `GET`  | `/manager/contracts/{contractId}/changes/{changeId}/approvers`                  | List approvers            | All                               |
| `POST` | `/manager/contracts/{contractId}/changes/{changeId}/approvers`                  | Assign approvers          | `contract_manager`, `procurement` |
| `GET`  | `/manager/contracts/{contractId}/changes/{changeId}/comments`                   | List comments             | All                               |
| `POST` | `/manager/contracts/{contractId}/changes/{changeId}/comments`                   | Add comment               | `contract_manager`, `procurement` |
| `POST` | `/manager/contracts/{contractId}/changes/{changeId}/comments/{commentId}/reply` | Reply to comment          | `contract_manager`, `procurement` |

> **MSA equivalents:** Same pattern under `/manager/msa-contract/{contractId}/changes/...`

***

### POST `/manager/contracts/{dataId}/change/{type}` — Create Change

`{type}` is either `Contract` or `MsaContract`.

| Field              | Type   | Required | Description                         |
| ------------------ | ------ | -------- | ----------------------------------- |
| `title`            | string | ✅        | <br />                              |
| `description`      | string | ✅        | <br />                              |
| `type`             | enum   | ✅        | `directive` \| `proposal` (manager) |
| `proposalCategory` | string | <br />   | <br />                              |
| `urgency`          | enum   | <br />   | `low` \| `medium` \| `high`         |
| `files`            | array  | <br />   | `[{ name, url, type, size }]`       |

***

### POST `/manager/contracts/{contractId}/changes/{changeId}/approve` — Approve or Reject

```json
{
  "action": "approved",   // or "rejected"
  "comment": "Reviewed and approved"
}
```

***

### POST `/manager/contracts/{contractId}/changes/{changeId}/approvers` — Assign Approvers

```json
{
  "userIds": ["userId1", "userId2"]
}
```

> Can only be called after the manager has approved. Also used to re-assign after a rejection.

***

### GET `/manager/contracts/{contractId}/changes/stats` — Change Statistics

Returns: `{ all, request, order, directive, proposal }`

***

## 7. Manager — Contract Claims

Claims are formal requests for time or cost adjustments.

### Endpoints at a Glance

| Method | Path                                                                          | Description            | Roles                               |
| ------ | ----------------------------------------------------------------------------- | ---------------------- | ----------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/claims/stats`                                | Claim counts           | All                                 |
| `GET`  | `/manager/contracts/{contractId}/claims`                                      | List claims            | All                                 |
| `GET`  | `/manager/contracts/{contractId}/claims/{claimId}`                            | Get claim detail       | All                                 |
| `PUT`  | `/manager/contracts/{contractId}/claims/{claimId}`                            | Edit a contract claim  | `contract_manager`, `company_admin` |
| `POST` | `/manager/contracts/{contractId}/claims`                                      | Create claim           | `contract_manager`, `company_admin` |
| `POST` | `/manager/contracts/{contractId}/claims/{claimId}/approve`                    | Manager approve/reject | `contract_manager`, `procurement`   |
| `GET`  | `/manager/contracts/{contractId}/claims/{claimId}/approve/status`             | Check approval status  | `contract_manager`, `procurement`   |
| `GET`  | `/manager/contracts/{contractId}/claims/{claimId}/approvers`                  | List approvers         | All                                 |
| `POST` | `/manager/contracts/{contractId}/claims/{claimId}/approvers`                  | Send to approvers      | `contract_manager`, `procurement`   |
| `GET`  | `/manager/contracts/{contractId}/claims/{claimId}/comments`                   | List comments          | All                                 |
| `POST` | `/manager/contracts/{contractId}/claims/{claimId}/comments`                   | Add comment            | `contract_manager`, `procurement`   |
| `POST` | `/manager/contracts/{contractId}/claims/{claimId}/comments/{commentId}/reply` | Reply to comment       | `contract_manager`, `procurement`   |

> **MSA equivalents:** Same pattern under `/manager/msa-contract/{contractId}/claims/...`

***

### POST `/manager/contracts/{contractId}/claims` — Create Claim

| Field         | Type   | Required | Description                     |
| ------------- | ------ | -------- | ------------------------------- |
| `title`       | string | ✅        | <br />                          |
| `type`        | string | ✅        | Claim category                  |
| `impact`      | enum   | ✅        | `time` \| `cost` \| `time_cost` |
| `description` | string | ✅        | <br />                          |
| `time`        | number | <br />   | Time impact (days)              |
| `cost`        | number | <br />   | Cost impact                     |
| `files`       | array  | <br />   | `[{ name, url, type, size }]`   |

***

### GET `/manager/contracts/{contractId}/claims/stats` — Claim Statistics

Returns: `{ total, pending, approved, rejected, dispute }`

***

## 8. Manager — Contract Invoices

Invoices are created by vendors and approved by managers/approvers.

### Endpoints at a Glance

| Method | Path                                                          | Description            | Roles                             |
| ------ | ------------------------------------------------------------- | ---------------------- | --------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/invoice/stats`               | Invoice counts         | All                               |
| `GET`  | `/manager/contracts/{contractId}/invoice`                     | List invoices          | All                               |
| `GET`  | `/manager/contracts/invoice/{invoiceId}`                      | Get invoice detail     | All                               |
| `POST` | `/manager/contracts/{contractId}/invoice/{invoiceId}/approve` | Manager approve/reject | `contract_manager`, `procurement` |

**Query params for list:** `invoiceId`, `page`, `limit`

***

## 9. Manager — Contract Deliverables

Deliverables are submitted by vendors and reviewed by managers and approvers.

### Endpoints at a Glance

| Method | Path                                                                          | Description            | Roles                             |
| ------ | ----------------------------------------------------------------------------- | ---------------------- | --------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/deliverables/stats`                          | Deliverable counts     | All                               |
| `GET`  | `/manager/contracts/{contractId}/deliverables`                                | List deliverables      | All                               |
| `GET`  | `/manager/contracts/{contractId}/deliverables/{deliverableId}`                | Get deliverable detail | All                               |
| `POST` | `/manager/contracts/{contractId}/deliverables/{deliverableId}/approve`        | Manager approve/reject | `contract_manager`, `procurement` |
| `GET`  | `/manager/contracts/{contractId}/deliverables/{deliverableId}/approve/status` | Check approval status  | `contract_manager`, `procurement` |

***

### GET `/manager/contracts/{contractId}/deliverables` — Deliverable List Item Fields

Each deliverable in the list returns:

| Field              | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `deliverableId`    | Human-readable ID (e.g., `DEL-2026-001`)                          |
| `title`            | Deliverable name                                                  |
| `status`           | `pending` \| `approved` \| `rejected` \| `under_review` \| `late` |
| `date`             | Due date                                                          |
| `submissionStatus` | `pending` \| `late` \| `submitted`                                |
| `kpi.kpi`          | KPI score                                                         |
| `kpi.kpiDays`      | Days early (positive) or late (negative)                          |
| `kpi.kpiText`      | Human text e.g. `"3 days early"`                                  |
| `kpi.kpiStatus`    | `due_in` \| `late` \| `early` \| `none`                           |

***

### GET `/manager/contracts/{contractId}/deliverables/stats`

Returns: `{ total, submitted, pending, late, approved, rejected, under_review }`

***

## 10. Manager — Contract RFIs

RFIs (Requests for Information) are questions issued to or received from a contract party.

### Endpoints at a Glance

| Method | Path                                                                     | Description       | Roles                                              |
| ------ | ------------------------------------------------------------------------ | ----------------- | -------------------------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/rfis/stats`                             | RFI counts        | `contract_manager`, `procurement`, `company_admin` |
| `GET`  | `/manager/contracts/{contractId}/rfis`                                   | List RFIs         | All                                                |
| `GET`  | `/manager/contracts/{contractId}/rfis/{rfiId}`                           | Get RFI detail    | All                                                |
| `POST` | `/manager/contracts/{dataId}/rfis`                                       | Create RFI        | `contract_manager`, `procurement`                  |
| `GET`  | `/manager/contracts/{contractId}/rfis/{rfiId}/response`                  | Get RFI responses | All                                                |
| `POST` | `/manager/contracts/{dataId}/rfis/{rfiId}/response`                      | Submit response   | All                                                |
| `GET`  | `/manager/contracts/{contractId}/rfis/{rfiId}/comment`                   | Get comments      | All                                                |
| `POST` | `/manager/contracts/{contractId}/rfis/{rfiId}/comment`                   | Add comment       | `contract_manager`, `procurement`                  |
| `POST` | `/manager/contracts/{contractId}/rfis/{rfiId}/comment/{commentId}/reply` | Reply to comment  | `contract_manager`, `procurement`                  |

> **MSA equivalents:** Same pattern under `/manager/msa-contract/{contractId}/rfi/...`

***

### GET `/manager/contracts/{contractId}/rfis/stats`

Returns: `{ all, issue, receive }`

***

### POST `/manager/contracts/{dataId}/rfis` — Create RFI

| Field         | Type      | Required | Description                   |
| ------------- | --------- | -------- | ----------------------------- |
| `title`       | string    | <br />   | <br />                        |
| `description` | string    | <br />   | <br />                        |
| `deadline`    | date-time | <br />   | <br />                        |
| `responder`   | string    | <br />   | User ID of responder          |
| `files`       | array     | <br />   | `[{ name, url, type, size }]` |

***

## 11. Manager — Contract NCRs

NCRs (Non-Conformance Reports) document quality or compliance issues.

### Endpoints at a Glance

| Method | Path                                           | Description    | Roles |
| ------ | ---------------------------------------------- | -------------- | ----- |
| `GET`  | `/manager/contracts/{contractId}/ncrs/stats`   | NCR counts     | All   |
| `GET`  | `/manager/contracts/{contractId}/ncrs`         | List NCRs      | All   |
| `GET`  | `/manager/contracts/{contractId}/ncrs/{ncrId}` | Get NCR detail | All   |

**Query params for list:** `title`, `ncrId`, `page`, `limit`

***

### GET `/manager/contracts/{contractId}/ncrs/stats`

Returns: `{ total, issue, receive }`

***

### NCR Detail Fields

| Field         | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `ncrId`       | Human-readable ID (e.g., `NCR-1738741200000`)              |
| `title`       | Issue title                                                |
| `description` | Details                                                    |
| `status`      | `pending` \| `approved` \| `rejected`                      |
| `submittedBy` | `{ _id, name, email }`                                     |
| `responders`  | `[{ user, status, actionedAt }]`                           |
| `capa`        | Corrective/Preventive Actions: `[{ capaId, title, user }]` |
| `files`       | Attached files                                             |

***

## 12. Manager — Contract LEMs

LEMs (Labour, Equipment, Materials) are time-and-materials records submitted by vendors.

### Endpoints at a Glance

| Method | Path                                                          | Description                   | Roles                             |
| ------ | ------------------------------------------------------------- | ----------------------------- | --------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/lems`                        | List LEMs                     | All                               |
| `GET`  | `/manager/contracts/{contractId}/lems/{lemId}`                | Get LEM detail                | All                               |
| `GET`  | `/manager/contracts/{contractId}/lems/{lemId}/approve/status` | Check manager approval status | `contract_manager`, `procurement` |
| `POST` | `/manager/contracts/{contractId}/lems/{lemId}/approve`        | Manager approve/reject        | `contract_manager`, `procurement` |

**Query params for list:** `lemId`, `title`, `page`, `limit`

***

## 13. Manager — Rate Sheets

Rate sheets define billable rates for LEM entries.

### Endpoints at a Glance

| Method | Path                                                                      | Description               | Roles                               |
| ------ | ------------------------------------------------------------------------- | ------------------------- | ----------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/ratesheets`                              | List rate sheets          | All                                 |
| `POST` | `/manager/contracts/{contractId}/ratesheets`                              | Create a rate sheet       | All                                 |
| `GET`  | `/manager/contracts/{contractId}/ratesheets/{rateSheetId}`                | Get rate sheet detail     | `contract_manager`, `company_admin` |
| `GET`  | `/manager/contracts/{contractId}/lems/{lemId}/ratesheet`                  | Get rate sheet for a LEM  | All                                 |
| `GET`  | `/manager/contracts/{contractId}/ratesheets/{rateSheetId}/approve/status` | Check manager approval    | `contract_manager`, `procurement`   |
| `POST` | `/manager/contracts/{contractId}/ratesheets/{rateSheetId}/approve`        | Approve/reject rate sheet | `contract_manager`, `procurement`   |

***

## 14. Manager — Contract Amendments

Amendments are formal contract modifications requiring vendor acknowledgement.

### Endpoints at a Glance

| Method | Path                                                                 | Description            | Roles                             |
| ------ | -------------------------------------------------------------------- | ---------------------- | --------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/amendments/stats`                   | Amendment counts       | `contract_manager`, `procurement` |
| `GET`  | `/manager/contracts/{contractId}/amendments`                         | List amendments        | `contract_manager`, `procurement` |
| `GET`  | `/manager/contracts/{contractId}/amendments/{amendmentId}`           | Get amendment detail   | `contract_manager`, `procurement` |
| `POST` | `/manager/contracts/{contractId}/amendments`                         | Create amendment       | `contract_manager`, `procurement` |
| `PUT`  | `/manager/contracts/{contractId}/amendments/{amendmentId}`           | Edit pending amendment | `contract_manager`, `procurement` |
| `POST` | `/manager/contracts/{contractId}/amendments/{amendmentId}/approvers` | Add approvers          | `contract_manager`, `procurement` |
| `POST` | `/manager/contracts/{contractId}/amendments/{amendmentId}/approve`   | Approve/reject         | `contract_manager`, `procurement` |

> **MSA equivalents:** Same pattern under `/manager/msa-contract/{contractId}/amendments/...`

***

### POST `/manager/contracts/{contractId}/amendments` — Create Amendment

| Field         | Type   | Required | Description                   | <br /> | <br />       | <br />               |
| ------------- | ------ | -------- | ----------------------------- | ------ | ------------ | -------------------- |
| `title`       | string | ✅        | <br />                        | <br /> | <br />       | <br />               |
| `description` | string | ✅        | <br />                        | <br /> | <br />       | <br />               |
| `changes`     | array  | ✅        | \`\[{ field: "time"           | "cost" | "time\_cost" | "others", value }]\` |
| `clause`      | string | <br />   | Clause reference              | <br /> | <br />       | <br />               |
| `others`      | string | <br />   | Additional notes              | <br /> | <br />       | <br />               |
| `files`       | array  | <br />   | `[{ name, url, type, size }]` | <br /> | <br />       | <br />               |

***

## 15. Manager — Contract Compliance

Compliance tracks insurance policies and contract security submissions.

### Endpoints at a Glance

| Method | Path                                                        | Description               | Roles                                              |
| ------ | ----------------------------------------------------------- | ------------------------- | -------------------------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/compliance`                | Get compliance details    | All                                                |
| `POST` | `/manager/contracts/{contractId}/compliance/{type}/approve` | Approve/reject compliance | `contract_manager`, `procurement`, `company_admin` |

`{type}` is `policy` or `security`.

> **MSA equivalents:** Same pattern under `/manager/msa-contract/{contractId}/compliance/...`

***

### Compliance Detail Response

```json
{
  "details": {
    "coverage": 100,
    "security": true,
    "expDate": "2027-01-20T00:00:00.000Z",
    "insuranceStatus": "approved",
    "securityStatus": "pending"
  },
  "policy": [ ... ],
  "security": [ ... ]
}
```

***

## 16. Manager — Contract KPIs

KPIs score vendor performance across 11 categories.

### Endpoints at a Glance

| Method | Path                                           | Description              | Roles                             |
| ------ | ---------------------------------------------- | ------------------------ | --------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/kpis`         | List KPI rows            | `contract_manager`, `procurement` |
| `GET`  | `/manager/contracts/{contractId}/kpis/{kpiId}` | Get KPI detail + history | `contract_manager`, `procurement` |
| `POST` | `/manager/contracts/{contractId}/kpis/{kpiId}` | Submit KPI values        | `contract_manager`, `procurement` |

> **MSA equivalents:** Same pattern under `/manager/msa-contract/{contractId}/kpis/...`

***

### POST `/manager/contracts/{contractId}/kpis/{kpiId}` — Submit KPI Values

| Field                | Description                 |
| -------------------- | --------------------------- |
| `timestampDelivery`  | On-time delivery score      |
| `scheduleConfirm`    | Schedule confirmation score |
| `mileStoneLog`       | Milestone logging score     |
| `inspectionReport`   | Inspection report score     |
| `NCRLog`             | NCR log score               |
| `QADocs`             | QA documentation score      |
| `timestampComLog`    | Communication log score     |
| `complianceTracking` | Compliance tracking score   |
| `invoiceContract`    | Invoice accuracy score      |
| `twoWay`             | Two-way communication score |
| `issueResolution`    | Issue resolution score      |

All values are numbers (0–100).

***

## 17. Manager — Holdbacks & Savings

### Holdbacks

| Method | Path                                                | Description         | Roles                             |
| ------ | --------------------------------------------------- | ------------------- | --------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/payment-holdbacks` | List holdbacks      | All                               |
| `GET`  | `/manager/contracts/payment-holdbacks/{holdBackId}` | Get holdback detail | All                               |
| `POST` | `/manager/contracts/{contractId}/payment-holdbacks` | Create holdback     | `contract_manager`, `procurement` |

> **MSA equivalents:** Same pattern under `/manager/msa-contract/{contractId}/payment-holdbacks/...`

**Holdback Request Body:**

| Field         | Type   | Description                   |
| ------------- | ------ | ----------------------------- |
| `amount`      | number | <br />                        |
| `type`        | enum   | `partial` \| `full`           |
| `invoiceId`   | string | Associated invoice            |
| `description` | string | <br />                        |
| `files`       | array  | `[{ name, url, type, size }]` |

***

### Savings

| Method | Path                                              | Description       | Roles                             |
| ------ | ------------------------------------------------- | ----------------- | --------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/payment-savings` | List savings      | All                               |
| `GET`  | `/manager/contracts/payment-savings/{savingId}`   | Get saving detail | All                               |
| `POST` | `/manager/contracts/{contractId}/payment-savings` | Create saving     | `contract_manager`, `procurement` |

> **MSA equivalents:** Same pattern under `/manager/msa-contract/{contractId}/payment-savings/...`

**Saving Request Body:**

| Field         | Type   | Description                   |
| ------------- | ------ | ----------------------------- |
| `amount`      | number | <br />                        |
| `title`       | string | <br />                        |
| `category`    | string | <br />                        |
| `description` | string | <br />                        |
| `files`       | array  | `[{ name, url, type, size }]` |

***

## 18. Manager — Contract Approvers

### Endpoints at a Glance

| Method | Path                                                     | Description                         | Roles |
| ------ | -------------------------------------------------------- | ----------------------------------- | ----- |
| `GET`  | `/manager/contracts/{contractId}/approvers`              | List approvers with summary         | All   |
| `GET`  | `/manager/contracts/{contractId}/approvers/{approverId}` | Approver detail with action history | All   |

> **MSA equivalents:** Same pattern under `/manager/msa-contract/{contractId}/approvers/...`

***

### Approver Summary Fields

| Field                     | Description              |
| ------------------------- | ------------------------ |
| `approverId`              | User ID                  |
| `name` / `email` / `role` | Identity                 |
| `approvalLevel`           | Approval tier (1–5)      |
| `assignedApprovals`       | e.g. `"2/3"` completed   |
| `status`                  | `Completed` \| `Pending` |

***

### Approver Detail

Returns the approver's profile plus a list of every action they've taken (change, invoice, LEM, claim, etc.), including `status`, `comment`, `contractDetailRefModel`, and `approvedDate`.

***

## 19. Manager — Reports & Logs

### Vendor Reports

| Method | Path                                                 | Description       | Roles                             |
| ------ | ---------------------------------------------------- | ----------------- | --------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/reports/stats`      | Report count      | `contract_manager`, `procurement` |
| `GET`  | `/manager/contracts/{contractId}/reports`            | List reports      | `contract_manager`, `procurement` |
| `GET`  | `/manager/contracts/{contractId}/reports/{reportId}` | Get report detail | `contract_manager`, `procurement` |

**Query params for list:** `reportId`, `title`, `page`, `limit`

***

### Action Logs

| Method | Path                                           | Description      | Roles                                              |
| ------ | ---------------------------------------------- | ---------------- | -------------------------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/logs`         | List action logs | `contract_manager`, `procurement`, `company_admin` |
| `GET`  | `/manager/contracts/{contractId}/logs/{logId}` | Get log detail   | `contract_manager`, `procurement`, `company_admin` |

**Query params for list:** `logId`, `module`, `page`, `limit`

***

## 20. Manager — Dashboards (Contract-level)

These endpoints power the per-contract dashboard panels.

| Method | Path                                                              | Description                                   |
| ------ | ----------------------------------------------------------------- | --------------------------------------------- |
| `GET`  | `/manager/contracts/{contractId}/dashboard/overview`              | Risk, compliance, rating, budget, KPI summary |
| `GET`  | `/manager/contracts/{contractId}/dashboard/financial-statement`   | Full financial breakdown                      |
| `GET`  | `/manager/contracts/{contractId}/dashboard/deliverable-status`    | Deliverable counts by status                  |
| `GET`  | `/manager/contracts/{contractId}/dashboard/activities`            | Activity trends over time                     |
| `GET`  | `/manager/contracts/{contractId}/dashboard/delivery-summary`      | Delivery performance                          |
| `GET`  | `/manager/contracts/{contractId}/dashboard/vendor-kpi`            | KPI scores over time                          |
| `GET`  | `/manager/contracts/{contractId}/dashboard/attachment`            | Amendment and policy counts                   |
| `GET`  | `/manager/contracts/{contractId}/dashboard/alerts`                | Overdue items and insurance warnings          |
| `GET`  | `/manager/contracts/{contractId}/dashboard/clause-legal-analysis` | Clause risk analysis                          |

All accept `?type=Contract` or `?type=MsaContract`. Activity and delivery endpoints also accept `?range=YTD|90|60|30|7`.

***

### Financial Statement Response

```json
{
  "originalContractValue": 2500000,
  "changeOrders": { "count": 3, "value": 180000 },
  "pendingChangeOrders": 45000,
  "savingsRealized": { "value": 120000, "percentage": 4.8 },
  "holdbackAmount": 90000,
  "releasedHoldback": 30000,
  "currentContractValue": 2680000,
  "billedTillDate": 1250000,
  "remaining": 1430000,
  "currency": "CAD"
}
```

***

## 21. Manager — Dashboards (Portfolio-level)

These endpoints power the main portfolio dashboard.

| Method | Path                                                  | Description                          |
| ------ | ----------------------------------------------------- | ------------------------------------ |
| `GET`  | `/manager/contracts/dashboard/cards/total`            | All-time contract card metrics       |
| `GET`  | `/manager/contracts/dashboard/cards/ytd`              | Year-to-date card metrics            |
| `GET`  | `/manager/contracts/dashboard/action-logs`            | Recent activity across all contracts |
| `GET`  | `/manager/contracts/dashboard/general-updates`        | General updates feed                 |
| `GET`  | `/manager/contracts/dashboard/cycle-time`             | Avg time per workflow stage          |
| `GET`  | `/manager/contracts/dashboard/invoice-status`         | Invoice status counts                |
| `GET`  | `/manager/contracts/dashboard/committed-vs-actual`    | Spend comparison                     |
| `GET`  | `/manager/contracts/dashboard/vendor-contract-value`  | Spend breakdown by vendor            |
| `GET`  | `/manager/contracts/dashboard/project-contract-value` | Spend breakdown by project           |
| `GET`  | `/manager/contracts/dashboard/risk-distribution`      | Contracts by risk tier               |
| `GET`  | `/manager/contracts/dashboard/change-order-impact`    | Change order cost impact             |
| `GET`  | `/manager/contracts/dashboard/category-value`         | Spend breakdown by category          |
| `GET`  | `/manager/contracts/dashboard/compliance-status`      | Insurance and security compliance    |
| `GET`  | `/manager/contracts/dashboard/contract-status`        | Contracts by status                  |
| `GET`  | `/manager/contracts/dashboard/vendor-summary`         | Vendor performance table             |
| `GET`  | `/manager/contracts/dashboard/renewals`               | Upcoming renewals and expiry         |
| `GET`  | `/manager/contracts/dashboard/clause-intelligence`    | Clause risk patterns                 |

**Common query params:** `type=Contract|MsaContract`, `range=YTD|90|60|30|7`, `vendorId` (optional filter)

***

## 22. Approver — Contracts & MSA Contracts

Approvers can view and act on contracts, MSA contracts, and all related sub-resources.

### Contract Endpoints

| Method | Path                                              | Description                |
| ------ | ------------------------------------------------- | -------------------------- |
| `GET`  | `/approver/contracts/stats`                       | Contract counts            |
| `GET`  | `/approver/contracts`                             | List contracts             |
| `GET`  | `/approver/contracts/{contractId}`                | Contract detail            |
| `GET`  | `/approver/contracts/{contractId}/approve/status` | Can current user approve?  |
| `POST` | `/approver/contracts/{contractId}/approve`        | Approve or reject contract |
| `GET`  | `/approver/contracts/{contractId}/personnel`      | Personnel list             |

### MSA Contract Endpoints

| Method | Path                                                    | Description               |
| ------ | ------------------------------------------------------- | ------------------------- |
| `GET`  | `/approver/msa-contract/stats`                          | MSA contract counts       |
| `GET`  | `/approver/msa-contract`                                | List MSA contracts        |
| `GET`  | `/approver/msa-contract/{contractId}`                   | MSA contract detail       |
| `GET`  | `/approver/msa-contract/{contractId}/approve/status`    | Can current user approve? |
| `POST` | `/approver/msa-contract/{contractId}/approve`           | Approve or reject         |
| `GET`  | `/approver/msa-contract/{contractId}/payment-holdbacks` | List holdbacks            |
| `GET`  | `/approver/msa-contract/{contractId}/payment-savings`   | List savings              |
| `GET`  | `/approver/msa-contract/{contractId}/compliance`        | Compliance details        |

***

### POST `/approver/contracts/{contractId}/approve` — Approver Approval Action

```json
{
  "action": "approved",  // or "rejected"
  "comment": "Looks good"
}
```

***

## 23. Approver — Contract Sub-Resources

Approvers have read/write access to sub-resources.

### Contract Sub-Resource Endpoints (from Swagger)

#### Amendments

| Method | Path                                                                      | Description                                 |
| ------ | ------------------------------------------------------------------------- | ------------------------------------------- |
| `GET`  | `/approver/contracts/{contractId}/amendment`                              | List contract amendments                    |
| `GET`  | `/approver/contracts/{contractId}/amendment/stats`                        | Get contract amendment statistics           |
| `GET`  | `/approver/contracts/{contractId}/amendment/{amendmentId}`                | Get contract amendment details              |
| `POST` | `/approver/contracts/{contractId}/amendment/{amendmentId}/approve`        | Approve or reject a contract amendment      |
| `GET`  | `/approver/contracts/{contractId}/amendment/{amendmentId}/approve/status` | Check if contract amendment can be approved |

#### Changes

| Method | Path                                                                  | Description                                |
| ------ | --------------------------------------------------------------------- | ------------------------------------------ |
| `GET`  | `/approver/contracts/{contractId}/changes`                            | List contract changes                      |
| `GET`  | `/approver/contracts/{contractId}/changes/stats`                      | Get contract change statistics             |
| `GET`  | `/approver/contracts/{contractId}/changes/{changeId}`                 | Get a contract change by ID                |
| `POST` | `/approver/contracts/{contractId}/changes/{changeId}/approve`         | Approve or reject a contract change        |
| `GET`  | `/approver/contracts/{contractId}/changes/{changeId}/approve/status`  | Check if contract change can be approved   |
| `GET`  | `/approver/contracts/{contractId}/changes/{changeId}/comment`         | Get comments for a contract change         |
| `POST` | `/approver/contracts/{contractId}/changes/{changeId}/comment`         | Add a comment to a contract change         |
| `POST` | `/approver/contracts/changes/{changeId}/comment/{commentId}/reply`    | Reply to a contract change comment         |

#### Claims

| Method | Path                                                               | Description                            |
| ------ | ------------------------------------------------------------------ | -------------------------------------- |
| `GET`  | `/approver/contracts/{contractId}/claims`                           | List contract claims                   |
| `GET`  | `/approver/contracts/{contractId}/claims/stats`                     | Get contract claim statistics          |
| `GET`  | `/approver/contracts/{contractId}/claims/{claimId}`                 | Get a contract claim by ID             |
| `POST` | `/approver/contracts/{contractId}/claims/{claimId}/approve`         | Approve or reject a contract claim     |
| `GET`  | `/approver/contracts/{contractId}/claims/{claimId}/comment`         | Get comments for a contract claim      |
| `POST` | `/approver/contracts/{contractId}/claims/{claimId}/comment`         | Add a comment to a contract claim      |
| `POST` | `/approver/contracts/claims/{claimId}/comment/{commentId}/reply`    | Reply to a contract claim comment      |

#### Compliance

| Method | Path                                             | Description                   |
| ------ | ------------------------------------------------ | ----------------------------- |
| `GET`  | `/approver/contracts/{contractId}/compliance`    | Get contract compliance details |

#### Deliverables

| Method | Path                                                                             | Description                          |
| ------ | -------------------------------------------------------------------------------- | ------------------------------------ |
| `GET`  | `/approver/contracts/{contractId}/deliverables`                                  | List contract deliverables           |
| `GET`  | `/approver/contracts/{contractId}/deliverables/stats`                            | Get contract deliverable statistics  |
| `GET`  | `/approver/contracts/{contractId}/deliverables/{deliverableId}`                  | Get contract deliverable details     |
| `POST` | `/approver/contracts/{contractId}/deliverables/{deliverableId}/approve`          | Approve or reject a contract deliverable |
| `GET`  | `/approver/contracts/{contractId}/deliverables/{deliverableId}/approve/status`   | Check deliverable approval status    |

#### Invoices

| Method | Path                                                                   | Description                               |
| ------ | ---------------------------------------------------------------------- | ----------------------------------------- |
| `GET`  | `/approver/contracts/{contractId}/invoice`                             | List contract invoices                    |
| `GET`  | `/approver/contracts/{contractId}/invoice/stats`                       | Get contract invoice statistics           |
| `GET`  | `/approver/contracts/{contractId}/invoice/{invoiceId}`                 | Get contract invoice details              |
| `POST` | `/approver/contracts/{contractId}/invoice/{invoiceId}/approve`         | Approve or reject a contract invoice      |
| `GET`  | `/approver/contracts/{contractId}/invoice/{invoiceId}/approve/status`  | Check if contract invoice can be approved |

#### LEMs & Rate Sheets

| Method | Path                                                         | Description                   |
| ------ | ------------------------------------------------------------ | ----------------------------- |
| `GET`  | `/approver/contracts/{contractId}/lems`                      | List contract LEMs            |
| `GET`  | `/approver/contracts/{contractId}/lems/{lemId}`              | Get contract LEM details      |
| `POST` | `/approver/contracts/{contractId}/lems/{lemId}/approve`      | Approve or reject a LEM       |
| `GET`  | `/approver/contracts/{contractId}/lems/{lemId}/approve/status` | Check LEM approval status   |
| `GET`  | `/approver/contracts/{contractId}/lems/{lemId}/ratesheet`    | Get rate sheet for a LEM      |
| `GET`  | `/approver/contracts/{contractId}/ratesheets`                | List contract rate sheets     |
| `GET`  | `/approver/contracts/{contractId}/ratesheets/{rateSheetId}`  | Get rate sheet for detail     |

#### NCRs

| Method  | Path                                                             | Description               |
| ------- | ---------------------------------------------------------------- | ------------------------- |
| `GET`   | `/approver/contracts/{contractId}/ncrs`                          | List contract NCRs        |
| `GET`   | `/approver/contracts/{contractId}/ncrs/stats`                    | Get contract NCR statistics |
| `GET`   | `/approver/contracts/{contractId}/ncrs/{ncrId}`                  | Get contract NCR detail   |
| `POST`  | `/approver/contracts/{contractId}/ncrs`                          | Create a contract NCR     |
| `POST`  | `/approver/contracts/{contractId}/ncrs/{ncrId}/capa`             | Create NCR CAPA           |
| `PATCH` | `/approver/contracts/{contractId}/ncrs/{ncrId}/capa/{capaId}/approve` | Approve NCR CAPA      |
| `PATCH` | `/approver/contracts/{contractId}/ncrs/{ncrId}/close`            | Close NCR                 |

#### RFIs

| Method | Path                                                           | Description                     |
| ------ | -------------------------------------------------------------- | ------------------------------- |
| `GET`  | `/approver/contracts/{contractId}/rfi`                         | List contract RFIs              |
| `GET`  | `/approver/contracts/{contractId}/rfi/stats`                   | Get contract RFI statistics     |
| `GET`  | `/approver/contracts/{contractId}/rfi/{rfiId}`                 | Get a specific RFI              |
| `GET`  | `/approver/contracts/{contractId}/rfi/{rfiId}/response`        | Get RFI responses               |
| `GET`  | `/approver/contracts/{contractId}/rfi/{rfiId}/comment`         | Get contract RFI comments       |
| `POST` | `/approver/contracts/{contractId}/rfi/{rfiId}/comment`         | Add a comment to a contract RFI |
| `POST` | `/approver/contracts/rfi/{rfiId}/comment/{commentId}/reply`    | Reply to a contract RFI comment |
| `POST` | `/approver/contracts/{dataId}/rfi`                             | Create a new RFI issue          |
| `POST` | `/approver/contracts/{dataId}/rfi/{rfiId}/response`            | Create RFI response             |

#### Reports

| Method | Path                                            | Description                 |
| ------ | ----------------------------------------------- | --------------------------- |
| `GET`  | `/approver/contracts/{contractId}/reports`      | List contract vendor reports |
| `GET`  | `/approver/contracts/{contractId}/reports/stats`| Get contract report count   |
| `GET`  | `/approver/contracts/{contractId}/reports/{reportId}` | Get contract report detail |

#### Holdbacks & Savings

| Method | Path                                                   | Description          |
| ------ | ------------------------------------------------------ | -------------------- |
| `GET`  | `/approver/contracts/{contractId}/payment-holdbacks`   | List holdbacks       |
| `GET`  | `/approver/contracts/payment-holdbacks/{holdBackId}`   | Get holdback details |
| `GET`  | `/approver/contracts/{contractId}/payment-savings`     | List savings         |
| `GET`  | `/approver/contracts/payment-savings/{savingId}`       | Get saving details   |

### MSA Contract Sub-Resource Endpoints (from Swagger)

| Method | Path                                                       | Description |
| ------ | ---------------------------------------------------------- | ----------- |
| `GET`  | `/approver/msa-contract/{contractId}/amendment`            | List MSA contract amendments |
| `GET`  | `/approver/msa-contract/{contractId}/amendment/stats`      | Get MSA contract amendment statistics |
| `GET`  | `/approver/msa-contract/{contractId}/amendment/{amendmentId}` | Get MSA contract amendment details |
| `POST` | `/approver/msa-contract/{contractId}/amendment/{amendmentId}/approve` | Approve or reject an MSA contract amendment |
| `GET`  | `/approver/msa-contract/{contractId}/amendment/{amendmentId}/approve/status` | Check if MSA contract amendment can be approved |
| `GET`  | `/approver/msa-contract/{contractId}/changes`             | List MSA contract changes |
| `GET`  | `/approver/msa-contract/{contractId}/changes/stats`        | Get MSA contract change statistics |
| `GET`  | `/approver/msa-contract/{contractId}/changes/{changeId}`   | Get an MSA contract change by ID |
| `POST` | `/approver/msa-contract/{contractId}/changes/{changeId}/approve` | Approve or reject an MSA contract change |
| `GET`  | `/approver/msa-contract/{contractId}/changes/{changeId}/approve/status` | Check if MSA contract change can be approved |
| `GET`  | `/approver/msa-contract/{contractId}/changes/{changeId}/comment` | Get comments for an MSA contract change |
| `POST` | `/approver/msa-contract/{contractId}/changes/{changeId}/comment` | Add a comment to an MSA contract change |
| `POST` | `/approver/msa-contract/changes/{changeId}/comment/{commentId}/reply` | Reply to an MSA contract change comment |
| `GET`  | `/approver/msa-contract/{contractId}/claims`                | List MSA contract claims |
| `GET`  | `/approver/msa-contract/{contractId}/claims/stats`          | Get MSA contract claim statistics |
| `GET`  | `/approver/msa-contract/{contractId}/claims/{claimId}`      | Get an MSA contract claim by ID |
| `POST` | `/approver/msa-contract/{contractId}/claims/{claimId}/approve` | Approve or reject an MSA contract claim |
| `GET`  | `/approver/msa-contract/{contractId}/claims/{claimId}/comment` | Get comments for an MSA contract claim |
| `POST` | `/approver/msa-contract/{contractId}/claims/{claimId}/comment` | Add a comment to an MSA contract claim |
| `POST` | `/approver/msa-contract/claims/{claimId}/comment/{commentId}/reply` | Reply to an MSA contract claim comment |
| `GET`  | `/approver/msa-contract/{contractId}/invoice`              | List MSA contract invoices |
| `GET`  | `/approver/msa-contract/{contractId}/invoice/stats`        | Get MSA contract invoice statistics |
| `GET`  | `/approver/msa-contract/{contractId}/invoice/{invoiceId}`  | Get MSA contract invoice details |
| `POST` | `/approver/msa-contract/{contractId}/invoice/{invoiceId}/approve` | Approve or reject an MSA contract invoice |
| `GET`  | `/approver/msa-contract/{contractId}/invoice/{invoiceId}/approve/status` | Check if MSA contract invoice can be approved |
| `GET`  | `/approver/msa-contract/{contractId}/compliance`           | Get MSA contract compliance details |
| `GET`  | `/approver/msa-contract/{contractId}/payment-holdbacks`    | List holdbacks |
| `GET`  | `/approver/msa-contract/payment-holdbacks/{holdBackId}`    | Get holdback details |
| `GET`  | `/approver/msa-contract/{contractId}/payment-savings`      | List savings |
| `GET`  | `/approver/msa-contract/payment-savings/{savingId}`        | Get saving details |
| `GET`  | `/approver/msa-contract/{contractId}/rfi`                  | List contract RFIs |
| `GET`  | `/approver/msa-contract/{contractId}/rfi/stats`            | Get MSA contract RFI statistics |
| `GET`  | `/approver/msa-contract/{contractId}/rfi/{rfiId}`          | Get a specific RFI |
| `GET`  | `/approver/msa-contract/{contractId}/rfi/{rfiId}/response` | Get RFI responses |
| `GET`  | `/approver/msa-contract/{contractId}/rfi/{rfiId}/comment`  | Get contract RFI comments |
| `POST` | `/approver/msa-contract/{contractId}/rfi/{rfiId}/comment`  | Add a comment to a contract RFI |
| `POST` | `/approver/msa-contract/{contractId}/rfi/{rfiId}/comment/{commentId}/reply` | Reply to a contract RFI comment |
| `POST` | `/approver/msa-contract/{dataId}/rfi`                      | Create a new RFI issue |
| `POST` | `/approver/msa-contract/{dataId}/rfi/{rfiId}/response`     | Create RFI response |

***

## 24. Approver — Dashboards

### Contract-level Dashboard (per contract)

| Method | Path                                                               | Description           |
| ------ | ------------------------------------------------------------------ | --------------------- |
| `GET`  | `/approver/contracts/{contractId}/dashboard/overview`              | Contract overview     |
| `GET`  | `/approver/contracts/{contractId}/dashboard/financial-statement`   | Financial breakdown   |
| `GET`  | `/approver/contracts/{contractId}/dashboard/deliverable-status`    | Deliverable counts    |
| `GET`  | `/approver/contracts/{contractId}/dashboard/activities`            | Activity trends       |
| `GET`  | `/approver/contracts/{contractId}/dashboard/delivery-summary`      | Delivery performance  |
| `GET`  | `/approver/contracts/{contractId}/dashboard/vendor-kpi`            | KPI scores            |
| `GET`  | `/approver/contracts/{contractId}/dashboard/attachment`            | Amendments + policies |
| `GET`  | `/approver/contracts/{contractId}/dashboard/alerts`                | Overdue items         |
| `GET`  | `/approver/contracts/{contractId}/dashboard/clause-legal-analysis` | Clause analysis       |

### Portfolio-level Dashboard

| Method | Path                                                   | Description         |
| ------ | ------------------------------------------------------ | ------------------- |
| `GET`  | `/approver/contracts/dashboard/cards/total`            | Total card metrics  |
| `GET`  | `/approver/contracts/dashboard/cards/ytd`              | YTD card metrics    |
| `GET`  | `/approver/contracts/dashboard/action-logs`            | Activity feed       |
| `GET`  | `/approver/contracts/dashboard/general-updates`        | General updates     |
| `GET`  | `/approver/contracts/dashboard/cycle-time`             | Stage cycle times   |
| `GET`  | `/approver/contracts/dashboard/invoice-status`         | Invoice counts      |
| `GET`  | `/approver/contracts/dashboard/committed-vs-actual`    | Spend comparison    |
| `GET`  | `/approver/contracts/dashboard/vendor-contract-value`  | By vendor           |
| `GET`  | `/approver/contracts/dashboard/project-contract-value` | By project          |
| `GET`  | `/approver/contracts/dashboard/risk-distribution`      | Risk tiers          |
| `GET`  | `/approver/contracts/dashboard/changes-order-impact`   | Change order impact |
| `GET`  | `/approver/contracts/dashboard/category-value`         | By category         |
| `GET`  | `/approver/contracts/dashboard/compliance-status`      | Compliance          |
| `GET`  | `/approver/contracts/dashboard/contract-status`        | Status distribution |
| `GET`  | `/approver/contracts/dashboard/vendor-summary`         | Vendor performance  |
| `GET`  | `/approver/contracts/dashboard/renewals`               | Renewal timeline    |
| `GET`  | `/approver/contracts/dashboard/clause-intelligence`    | Clause patterns     |

All accept `?type=Contract|MsaContract`.

***

## 25. Vendor — Contracts & MSA Contracts

### Contract Endpoints

| Method  | Path                                                                        | Description               |
| ------- | --------------------------------------------------------------------------- | ------------------------- |
| `GET`   | `/vendor/contracts/stats`                                                   | Contract counts           |
| `GET`   | `/vendor/contracts`                                                         | List contracts            |
| `GET`   | `/vendor/contracts/me`                                                      | My contracts (as PM)      |
| `GET`   | `/vendor/contracts/{contractId}`                                            | Contract detail           |
| `POST`  | `/vendor/contracts/{contractId}/approve`                                    | Accept or reject contract |
| `POST`  | `/vendor/contracts/{contractId}/project-managers/{projectManagerId}/assign` | Assign PM to contract     |
| `GET`   | `/vendor/contracts/{contractId}/personnel`                                  | Personnel list            |
| `GET`   | `/vendor/contracts/{contractId}/payment-holdbacks`                          | List holdbacks            |
| `GET`   | `/vendor/contracts/payment-holdbacks/{holdBackId}`                          | Holdback detail           |
| `GET`   | `/vendor/contracts/{contractId}/kpis`                                       | List KPIs                 |
| `GET`   | `/vendor/contracts/{contractId}/kpis/{kpiId}`                               | KPI detail                |
| `GET`   | `/vendor/contracts/{contractId}/compliance`                                 | Compliance details        |
| `PATCH` | `/vendor/contracts/{contractId}/compliance`                                 | Update compliance item    |

### MSA Contract Endpoints

| Method  | Path                                                                           | Description         |
| ------- | ------------------------------------------------------------------------------ | ------------------- |
| `GET`   | `/vendor/msa-contract/stats`                                                   | MSA contract counts |
| `GET`   | `/vendor/msa-contract`                                                         | List MSA contracts  |
| `GET`   | `/vendor/msa-contract/{contractId}`                                            | MSA contract detail |
| `POST`  | `/vendor/msa-contract/{contractId}/approve`                                    | Accept or reject    |
| `POST`  | `/vendor/msa-contract/{contractId}/project-managers/{projectManagerId}/assign` | Assign PM           |
| `GET`   | `/vendor/msa-contract/{contractId}/payment-holdbacks`                          | List holdbacks      |
| `GET`   | `/vendor/msa-contract/payment-holdbacks/{holdBackId}`                          | Holdback detail     |
| `GET`   | `/vendor/msa-contract/{contractId}/compliance`                                 | Compliance details  |
| `PATCH` | `/vendor/msa-contract/{contractId}/compliance`                                 | Update compliance   |

***

### PATCH `/vendor/contracts/{contractId}/compliance` — Update Compliance Item

```json
{
  "description": "Updated insurance details",
  "type": "policy",       // or "security"
  "files": [{ "name": "cert.pdf", "url": "...", "type": "application/pdf", "size": "204800" }]
}
```

> MSA equivalent: `PATCH /vendor/msa-contract/{contractId}/compliance`

***

## 26. Vendor — Contract Sub-Resources

Vendors can create and manage their own activity on contracts.

### Contract Sub-Resources (from Swagger)

#### LEMs

| Method | Path                                               | Description              |
| ------ | -------------------------------------------------- | ------------------------ |
| `GET`  | `/vendor/contracts/{contractId}/lems`              | List contract LEMs       |
| `POST` | `/vendor/contracts/{contractId}/lems`              | Create a LEM             |
| `GET`  | `/vendor/contracts/{contractId}/lems/{lemId}`      | Get contract LEM details |
| `PUT`  | `/vendor/contracts/{contractId}/lems/{lemId}`      | Edit an existing LEM     |
| `GET`  | `/vendor/contracts/{contractId}/lems/{lemId}/ratesheet` | Get rate sheet for a LEM |

**Create LEM body:** `{ title, description, amount, files }`

#### Rate Sheets

| Method | Path                                                     | Description              |
| ------ | -------------------------------------------------------- | ------------------------ |
| `GET`  | `/vendor/contracts/{contractId}/ratesheets`              | List contract rate sheets |
| `POST` | `/vendor/contracts/{contractId}/ratesheets`              | Create a rate sheet      |
| `GET`  | `/vendor/contracts/{contractId}/ratesheets/{rateSheetId}`| Get rate sheet for detail |
| `PUT`  | `/vendor/contracts/{contractId}/ratesheets/{rateSheetId}`| Update a rate sheet      |

#### Changes

| Method | Path                                                             | Description                      |
| ------ | ---------------------------------------------------------------- | -------------------------------- |
| `GET`  | `/vendor/contracts/{contractId}/changes`                         | List contract changes            |
| `POST` | `/vendor/contracts/{contractId}/changes`                         | Request a contract change        |
| `GET`  | `/vendor/contracts/{contractId}/changes/stats`                   | Get contract change statistics   |
| `GET`  | `/vendor/contracts/{contractId}/changes/{changeId}`              | Get contract change details      |
| `PUT`  | `/vendor/contracts/{contractId}/changes/{changeId}`              | Edit a rejected contract change  |
| `GET`  | `/vendor/contracts/{contractId}/changes/{changeId}/comment`      | Get contract change comments     |
| `POST` | `/vendor/contracts/{contractId}/changes/{changeId}/comment`      | Add a comment to a contract change |
| `POST` | `/vendor/contracts/changes/{changeId}/comment/{commentId}/reply` | Reply to a contract change comment |

#### Claims

| Method | Path                                                             | Description                      |
| ------ | ---------------------------------------------------------------- | -------------------------------- |
| `GET`  | `/vendor/contracts/{contractId}/claims`                           | List contract claims             |
| `POST` | `/vendor/contracts/{contractId}/claims`                           | Create a contract claim          |
| `GET`  | `/vendor/contracts/{contractId}/claims/stats`                     | Get contract claim statistics    |
| `GET`  | `/vendor/contracts/{contractId}/claims/{claimId}`                 | Get contract claim details       |
| `PUT`  | `/vendor/contracts/{contractId}/claims/{claimId}`                 | Edit a contract claim            |
| `GET`  | `/vendor/contracts/{contractId}/claims/{claimId}/comment`         | Get contract claim comments      |
| `POST` | `/vendor/contracts/{contractId}/claims/{claimId}/comment`         | Add a comment to a contract claim |
| `POST` | `/vendor/contracts/{contractId}/claims/{claimId}/comment/{commentId}/reply` | Reply to a contract claim comment |

#### Invoices

| Method | Path                                                   | Description                     |
| ------ | ------------------------------------------------------ | ------------------------------- |
| `GET`  | `/vendor/contracts/{contractId}/invoice`               | List contract invoices          |
| `POST` | `/vendor/contracts/{contractId}/invoice`               | Create a new contract invoice   |
| `GET`  | `/vendor/contracts/{contractId}/invoice/stats`         | Get contract invoice statistics |
| `GET`  | `/vendor/contracts/{contractId}/invoice/{invoiceId}`   | Get contract invoice details    |
| `PUT`  | `/vendor/contracts/{contractId}/invoice/{invoiceId}`   | Update a contract invoice       |

**Create invoice required fields:** `title`, `description`, `type`, `taxCode`, `status`, `fileType`

**Invoice types:** `progress draw` | `monthly payment` | `milestone payment` | `holdback`

**Tax codes:** `HST` | `GST` | `PST/QST` | `Others`

#### Deliverables

| Method | Path                                                               | Description                    |
| ------ | ------------------------------------------------------------------ | ------------------------------ |
| `GET`  | `/vendor/contracts/{contractId}/deliverables`                      | List contract deliverables     |
| `GET`  | `/vendor/contracts/{contractId}/deliverables/stats`                | Get contract deliverable statistics |
| `GET`  | `/vendor/contracts/{contractId}/deliverables/{deliverableId}`      | Get contract deliverable details |
| `POST` | `/vendor/contracts/{contractId}/deliverables/{deliverableId}/submit` | Submit a contract deliverable |

**Submit body:** `{ description, responders[], files[] }`

#### RFIs

| Method | Path                                                           | Description                     |
| ------ | -------------------------------------------------------------- | ------------------------------- |
| `GET`  | `/vendor/contracts/{contractId}/rfi`                           | List contract RFIs              |
| `GET`  | `/vendor/contracts/{contractId}/rfi/stats`                     | Get contract RFI statistics     |
| `GET`  | `/vendor/contracts/{contractId}/rfi/{rfiId}`                   | Get a specific RFI              |
| `GET`  | `/vendor/contracts/{contractId}/rfi/{rfiId}/response`          | Get RFI responses               |
| `GET`  | `/vendor/contracts/{contractId}/rfi/{rfiId}/comment`           | Get contract RFI comments       |
| `POST` | `/vendor/contracts/{contractId}/rfi/{rfiId}/comment`           | Add a comment to a contract RFI |
| `POST` | `/vendor/contracts/rfi/{rfiId}/comment/{commentId}/reply`      | Reply to a contract RFI comment |
| `POST` | `/vendor/contracts/{dataId}/rfi`                               | Create a new RFI issue          |
| `POST` | `/vendor/contracts/{dataId}/rfi/{rfiId}/response`              | Create RFI response             |

#### NCRs

| Method  | Path                                                             | Description                 |
| ------- | ---------------------------------------------------------------- | --------------------------- |
| `GET`   | `/vendor/contracts/{contractId}/ncrs`                            | List contract NCRs          |
| `POST`  | `/vendor/contracts/{contractId}/ncrs`                            | Create a contract NCR       |
| `GET`   | `/vendor/contracts/{contractId}/ncrs/stats`                      | Get contract NCR statistics |
| `GET`   | `/vendor/contracts/{contractId}/ncrs/{ncrId}`                    | Get contract NCR details    |
| `POST`  | `/vendor/contracts/{contractId}/ncrs/{ncrId}/capa`               | Create NCR CAPA             |
| `PATCH` | `/vendor/contracts/{contractId}/ncrs/{ncrId}/capa/{capaId}/approve` | Approve NCR CAPA        |
| `PATCH` | `/vendor/contracts/{contractId}/ncrs/{ncrId}/close`              | Close NCR                   |

#### Amendments

| Method | Path                                                                   | Description                           |
| ------ | ---------------------------------------------------------------------- | ------------------------------------- |
| `GET`  | `/vendor/contracts/{contractId}/amendment`                              | List contract amendments              |
| `GET`  | `/vendor/contracts/{contractId}/amendment/stats`                        | Get contract amendment statistics     |
| `GET`  | `/vendor/contracts/{contractId}/amendment/{amendmentId}`                | Get contract amendment details        |
| `PATCH` | `/vendor/contracts/{contractId}/amendment/{amendmentId}/status`         | Update contract amendment vendor status |

**Patch body:** `{ "status": "accepted" }` or `{ "status": "rejected" }`

#### Reports

| Method | Path                                                      | Description                 |
| ------ | --------------------------------------------------------- | --------------------------- |
| `GET`  | `/vendor/contracts/{contractId}/reports`                  | List contract vendor reports |
| `POST` | `/vendor/contracts/{contractId}/reports`                  | Create a new contract report |
| `GET`  | `/vendor/contracts/{contractId}/reports/stats`            | Get contract report count    |
| `GET`  | `/vendor/contracts/{contractId}/reports/{reportId}`       | Get contract report detail   |

**Submit report body:** `{ title, description, files[] }`

### MSA Contract Sub-Resources (from Swagger)

| Method | Path                                                            | Description |
| ------ | --------------------------------------------------------------- | ----------- |
| `GET`  | `/vendor/msa-contract/{contractId}/amendment`                   | List MSA contract amendments |
| `GET`  | `/vendor/msa-contract/{contractId}/amendment/stats`             | Get MSA contract amendment statistics |
| `GET`  | `/vendor/msa-contract/{contractId}/amendment/{amendmentId}`     | Get MSA contract amendment details |
| `PATCH` | `/vendor/msa-contract/{contractId}/amendment/{amendmentId}/status` | Update MSA contract amendment vendor status |
| `GET`  | `/vendor/msa-contract/{contractId}/claims`                       | List MSA contract claims |
| `POST` | `/vendor/msa-contract/{contractId}/claims`                       | Create an MSA contract claim |
| `GET`  | `/vendor/msa-contract/{contractId}/claims/stats`                 | Get MSA contract claim statistics |
| `GET`  | `/vendor/msa-contract/{contractId}/claims/{claimId}`             | Get MSA contract claim details |
| `PUT`  | `/vendor/msa-contract/{contractId}/claims/{claimId}`             | Edit an MSA contract claim |
| `GET`  | `/vendor/msa-contract/{contractId}/claims/{claimId}/comment`     | Get MSA contract claim comments |
| `POST` | `/vendor/msa-contract/{contractId}/claims/{claimId}/comment`     | Add a comment to an MSA contract claim |
| `POST` | `/vendor/msa-contract/{contractId}/claims/{claimId}/comment/{commentId}/reply` | Reply to an MSA contract claim comment |
| `GET`  | `/vendor/msa-contract/{contractId}/invoice`                     | List MSA contract invoices |
| `POST` | `/vendor/msa-contract/{contractId}/invoice`                     | Create a new MSA contract invoice |
| `GET`  | `/vendor/msa-contract/{contractId}/invoice/stats`               | Get MSA contract invoice statistics |
| `GET`  | `/vendor/msa-contract/{contractId}/invoice/{invoiceId}`         | Get MSA contract invoice details |
| `PUT`  | `/vendor/msa-contract/{contractId}/invoice/{invoiceId}`         | Update an MSA contract invoice |
| `PUT`  | `/vendor/msa-contract/{contractId}/changes/{changeId}`          | Edit a rejected MSA contract change |
| `GET`  | `/vendor/msa-contract/{contractId}/rfi`                         | List contract RFIs |
| `GET`  | `/vendor/msa-contract/{contractId}/rfi/stats`                   | Get MSA contract RFI statistics |
| `GET`  | `/vendor/msa-contract/{contractId}/rfi/{rfiId}`                 | Get a specific RFI |
| `GET`  | `/vendor/msa-contract/{contractId}/rfi/{rfiId}/response`        | Get RFI responses |
| `GET`  | `/vendor/msa-contract/{contractId}/rfi/{rfiId}/comment`         | Get contract RFI comments |
| `POST` | `/vendor/msa-contract/{contractId}/rfi/{rfiId}/comment`         | Add a comment to a contract RFI |
| `POST` | `/vendor/msa-contract/{contractId}/rfi/{rfiId}/comment/{commentId}/reply` | Reply to a contract RFI comment |
| `POST` | `/vendor/msa-contract/{dataId}/rfi`                             | Create a new RFI issue |
| `POST` | `/vendor/msa-contract/{dataId}/rfi/{rfiId}/response`            | Create RFI response |

***

## 27. Vendor — Dashboard

| Method | Path                                          | Description           |
| ------ | --------------------------------------------- | --------------------- |
| `GET`  | `/vendor/contracts/dashboard/cards/total`     | Contract card metrics |
| `GET`  | `/vendor/contracts/dashboard/action-logs`     | Recent actions        |
| `GET`  | `/vendor/contracts/dashboard/general-updates` | Updates feed          |

All accept `?type=Contract|MsaContract`.

***

## 28. View-Only — Contracts & MSA Contracts

View-only users have read access to all data but cannot create or approve anything.

### Contracts

| Method | Path                           | Description     |
| ------ | ------------------------------ | --------------- |
| `GET`  | `/user/contracts/stats`        | Contract counts |
| `GET`  | `/user/contracts`              | List contracts  |
| `GET`  | `/user/contracts/{contractId}` | Contract detail |

### MSA Contracts

| Method | Path                                                | Description         |
| ------ | --------------------------------------------------- | ------------------- |
| `GET`  | `/user/msa-contract/stats`                          | MSA contract counts |
| `GET`  | `/user/msa-contract`                                | List MSA contracts  |
| `GET`  | `/user/msa-contract/{contractId}`                   | MSA contract detail |
| `GET`  | `/user/msa-contract/{contractId}/compliance`        | Compliance details  |

***

## 29. View-Only — Contract Sub-Resources

Read-only access to all sub-resources under `/user/...`.

### Contract Sub-Resources (from Swagger)

| Method | Path                                                                 | Description |
| ------ | -------------------------------------------------------------------- | ----------- |
| `GET`  | `/user/contracts/{contractId}/amendment`                             | List contract amendments |
| `GET`  | `/user/contracts/{contractId}/amendment/stats`                       | Get contract amendment statistics |
| `GET`  | `/user/contracts/{contractId}/amendment/{amendmentId}`               | Get contract amendment details |
| `GET`  | `/user/contracts/{contractId}/changes`                               | List contract changes |
| `GET`  | `/user/contracts/{contractId}/changes/stats`                         | Get contract change statistics |
| `GET`  | `/user/contracts/{contractId}/changes/{changeId}`                    | Get contract change details |
| `GET`  | `/user/contracts/{contractId}/changes/{changeId}/comment`            | Get contract change comments |
| `GET`  | `/user/contracts/{contractId}/claims`                                 | List contract claims |
| `GET`  | `/user/contracts/{contractId}/claims/stats`                           | Get contract claim statistics |
| `GET`  | `/user/contracts/{contractId}/claims/{claimId}`                       | Get contract claim details |
| `GET`  | `/user/contracts/{contractId}/claims/{claimId}/comment`               | Get contract claim comments |
| `GET`  | `/user/contracts/{contractId}/compliance`                            | Get contract compliance details |
| `GET`  | `/user/contracts/{contractId}/deliverables`                          | List contract deliverables |
| `GET`  | `/user/contracts/{contractId}/deliverables/stats`                    | Get contract deliverable statistics |
| `GET`  | `/user/contracts/{contractId}/deliverables/{deliverableId}`          | Get contract deliverable details |
| `GET`  | `/user/contracts/{contractId}/deliverables/{deliverableId}/approve/status` | Check manager approval status for a deliverable |
| `GET`  | `/user/contracts/{contractId}/invoice`                               | List contract invoices |
| `GET`  | `/user/contracts/{contractId}/invoice/stats`                         | Get contract invoice statistics |
| `GET`  | `/user/contracts/{contractId}/invoice/{invoiceId}`                   | Get contract invoice details |
| `GET`  | `/user/contracts/{contractId}/lems`                                  | List contract LEMs |
| `GET`  | `/user/contracts/{contractId}/lems/{lemId}`                          | Get contract LEM details |
| `GET`  | `/user/contracts/{contractId}/lems/{lemId}/ratesheet`                | Get rate sheet for a LEM |
| `GET`  | `/user/contracts/{contractId}/ncrs`                                  | List contract NCRs |
| `GET`  | `/user/contracts/{contractId}/ncrs/stats`                            | Get contract NCR statistics |
| `GET`  | `/user/contracts/{contractId}/ncrs/{ncrId}`                          | Get contract NCR details |
| `GET`  | `/user/contracts/{contractId}/ratesheets`                            | List contract rate sheets |
| `GET`  | `/user/contracts/{contractId}/ratesheets/{rateSheetId}`              | Get rate sheet for detail |
| `GET`  | `/user/contracts/{contractId}/reports`                               | List contract vendor reports |
| `GET`  | `/user/contracts/{contractId}/reports/stats`                         | Get contract report count |
| `GET`  | `/user/contracts/{contractId}/reports/{reportId}`                    | Get contract report detail |
| `GET`  | `/user/contracts/{contractId}/rfi`                                   | List contract RFIs |
| `GET`  | `/user/contracts/{contractId}/rfi/stats`                             | Get contract RFI statistics |
| `GET`  | `/user/contracts/{contractId}/rfi/{rfiId}/comment`                   | Get contract RFI comments |
| `GET`  | `/user/contracts/rfi/{rfiId}`                                        | Get a specific RFI |

### MSA Contract Sub-Resources (from Swagger)

| Method | Path                                                                 | Description |
| ------ | -------------------------------------------------------------------- | ----------- |
| `GET`  | `/user/msa-contract/{contractId}/amendment`                          | List MSA contract amendments |
| `GET`  | `/user/msa-contract/{contractId}/amendment/stats`                    | Get MSA contract amendment statistics |
| `GET`  | `/user/msa-contract/{contractId}/amendment/{amendmentId}`            | Get MSA contract amendment details |
| `GET`  | `/user/msa-contract/{contractId}/changes`                            | List MSA contract changes |
| `GET`  | `/user/msa-contract/{contractId}/changes/stats`                      | Get MSA contract change statistics |
| `GET`  | `/user/msa-contract/{contractId}/changes/{changeId}`                 | Get MSA contract change details |
| `GET`  | `/user/msa-contract/{contractId}/changes/{changeId}/comment`         | Get MSA contract change comments |
| `GET`  | `/user/msa-contract/{contractId}/claims`                              | List MSA contract claims |
| `GET`  | `/user/msa-contract/{contractId}/claims/stats`                        | Get MSA contract claim statistics |
| `GET`  | `/user/msa-contract/{contractId}/claims/{claimId}`                    | Get MSA contract claim details |
| `GET`  | `/user/msa-contract/{contractId}/compliance`                         | Get MSA contract compliance details |
| `GET`  | `/user/msa-contract/{contractId}/invoice`                            | List MSA contract invoices |
| `GET`  | `/user/msa-contract/{contractId}/invoice/stats`                      | Get MSA contract invoice statistics |
| `GET`  | `/user/msa-contract/{contractId}/invoice/{invoiceId}`                | Get MSA contract invoice details |
| `GET`  | `/user/msa-contract/{contractId}/rfi`                                | List contract RFIs |
| `GET`  | `/user/msa-contract/{contractId}/rfi/stats`                          | Get MSA contract RFI statistics |
| `GET`  | `/user/msa-contract/{contractId}/rfi/{rfiId}`                        | Get a specific RFI |
| `GET`  | `/user/msa-contract/{contractId}/rfi/{rfiId}/comment`                | Get contract RFI comments |

***

## 30. Collaboration (WebSocket)

Real-time collaborative editing powered by the [Yjs CRDT](https://yjs.dev/) protocol.

### Endpoint

| Method | Path     | Description                                |
| ------ | -------- | ------------------------------------------ |
| `GET`  | `/collab` | WebSocket handshake for collaborative editing |

### Connection

```
wss://dev.swiftpro.tech/collab?doc=<document-id>&token=<jwt>
```

| Parameter | Required | Description                                              |
| --------- | -------- | -------------------------------------------------------- |
| `doc`     | ✅        | Document room identifier (e.g., `contract-25-015`)       |
| `token`   | Optional | JWT fallback if you can't set the `Authorization` header |

**Preferred auth header:** `Authorization: Bearer <jwt>`

***

### Protocol Details

| Detail         | Value                                          |
| -------------- | ---------------------------------------------- |
| Frame format   | Binary (Yjs sync protocol)                     |
| Protocols      | `y-protocols/sync` and `y-protocols/awareness` |
| Max frame size | 1 MB                                           |

***

### WebSocket Lifecycle

1. **Connect** — open `wss://…/collab?doc=…` with auth
2. **Sync Step 1** — server sends initial document state
3. **Bidirectional sync** — exchange binary Yjs update frames
4. **Awareness** — broadcast cursor/presence updates
5. **Disconnect** — handle close codes and reconnect as needed

***

### Close Codes

| Code   | Trigger           | Meaning                                     |
| ------ | ----------------- | ------------------------------------------- |
| `1009` | Message too large | Payload exceeded 1 MB                       |
| `1011` | Persistence error | Server failed to save update                |
| `401`  | Unauthorized      | JWT/session validation failed               |
| `403`  | HTTPS required    | Non-HTTPS connection rejected in production |

***

### Example (JavaScript)

```javascript
const ws = new WebSocket(
  'wss://dev.swiftpro.tech/collab?doc=contract-25-015',
  { headers: { Authorization: 'Bearer <token>' } }
);

// Integrate with a Yjs provider (e.g., y-websocket)
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();
const provider = new WebsocketProvider(
  'wss://dev.swiftpro.tech',
  'contract-25-015',
  ydoc,
  { params: { token: '<jwt>' } }
);
```

***

## 31. Schemas

Schemas are derived from `swagger.json`.

### AddApproversDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `userIds` | `array<string>` |  |  |

### ApiResponseAwardedVendorList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `array<AwardedVendorItem>` |  | items properties: solicitationId, solicitationName, vendor |
| `message` | `string` |  | example: Awarded solicitation vendors fetched successfully |
| `status` | `number` |  | example: 200 |

### ApiResponseContract

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `Contract` |  | $ref: Contract |
| `message` | `string` |  | example: Contract fetched successfully |
| `status` | `number` |  | example: 200 |

### ApiResponseContractCompliance

- Type: `object`
- Required: `status`, `message`, `data`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `object` | ? | properties: details, policy, security |
| `message` | `string` | ? | example: Contract compliance fetched successfully |
| `status` | `number` | ? | example: 200 |

### ApiResponseContractList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `array<Contract>` |  | items properties: _id, title, description, category, contractRelationship, status, deliverables, files, signatories, approver, createdAt, updatedAt, company, project, vendor, creator, contractType, currency, ratePerHour, totalAmount, startDate, endDate |
| `message` | `string` |  | example: Project contracts fetched successfully |
| `status` | `number` |  | example: 200 |

### ApiResponseContractPaymentTermList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `array<ContractPaymentTerm>` |  | items properties: _id, name, description |
| `message` | `string` |  | example: Contract payment terms fetched successfully |
| `status` | `number` |  | example: 200 |

### ApiResponseContractServiceDetail

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `ContractServiceDetail` |  | $ref: ContractServiceDetail |
| `message` | `string` |  | example: Contract fetched successfully |
| `status` | `integer` |  | example: 200 |

### ApiResponseContractServiceList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `object` |  | properties: contracts, totalContracts |
| `message` | `string` |  | example: Contracts fetched successfully |
| `status` | `integer` |  | example: 200 |

### ApiResponseContractTermTypeList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `array<ContractTermType>` |  | items properties: _id, name, description |
| `message` | `string` |  | example: Contract terms fetched successfully |
| `status` | `number` |  | example: 200 |

### ApiResponseContractTypeList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `array<ContractType>` |  | items properties: _id, name, description |
| `message` | `string` |  | example: Contract types fetched successfully |
| `status` | `number` |  | example: 200 |

### ApiResponseMsaContractServiceDetail

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `MsaContractServiceDetail` |  | $ref: MsaContractServiceDetail |
| `message` | `string` |  | example: MSA contract fetched successfully |
| `status` | `integer` |  | example: 200 |

### ApiResponseMsaContractServiceList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `object` |  | properties: contracts, totalContracts |
| `message` | `string` |  | example: MSA contracts fetched successfully |
| `status` | `integer` |  | example: 200 |

### ApiResponseProject

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `Project` |  | $ref: Project |
| `message` | `string` |  | example: Project created successfully |
| `status` | `number` |  | example: 201 |

### ApiResponseProjectList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `array<Project>` |  | items properties: _id, company, businessDivision, creator, name, category, description, startDate, endDate, budget, status, allowMultiple, createdAt, updatedAt |
| `message` | `string` |  | example: Projects fetched successfully |
| `status` | `number` |  | example: 200 |

### ApiResponseProjectStats

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `ProjectStats` |  | $ref: ProjectStats |
| `message` | `string` |  | example: Project stats fetched successfully |
| `status` | `number` |  | example: 200 |

### ApiResponseUserList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `array<UserBasic>` |  | items properties: _id, name, email |
| `message` | `string` |  | example: Contract personnel fetched successfully |
| `status` | `number` |  | example: 200 |

### ApiResponseVendorContractServiceList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `object` |  | properties: contractType, contracts, totalContracts |
| `message` | `string` |  | example: Contracts fetched successfully |
| `status` | `integer` |  | example: 200 |

### ApiResponseVendorMsaContractServiceList

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `data` | `object` |  | properties: contractType, contracts, totalContracts |
| `message` | `string` |  | example: MSA contracts fetched successfully |
| `status` | `integer` |  | example: 200 |

### ApprovalActionDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `action` | `string` |  | enum: approved, rejected |
| `comment` | `string` |  |  |

### AuthenticatedError

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `message` | `string` |  | example: User not authenticated |
| `status` | `number` |  | example: 401 |

### AuthorizeError

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `message` | `string` |  | example: Unauthorized |
| `status` | `number` |  | example: 403 |

### AwardedVendorItem

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `solicitationId` | `string` |  |  |
| `solicitationName` | `string` |  |  |
| `vendor` | `object` |  | properties: _id, name, email |

### BadRequest

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `message` | `string` |  | example: Bad request |
| `status` | `number` |  | example: 400 |

### BadRequestError

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `message` | `string` |  | example: Bad request |
| `status` | `number` |  | example: 400 |

### CollabWebSocketConnection

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `authHeader` | `string` |  | example: Authorization: Bearer <jwt> |
| `endpoint` | `string` |  | example: wss://dev.swiftpro.tech/collab?doc=contract-123&token=<jwt> |
| `frameFormat` | `string` |  | example: binary (Yjs sync protocol) |
| `optionalQuery` | `object` |  | properties: token |
| `path` | `string` |  | example: /collab |
| `requiredQuery` | `object` |  | properties: doc |

### CollabWebSocketErrorCode

- Type: `object`
- Required: `closeCode`, `trigger`, `description`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `closeCode` | `integer` | ? |  |
| `description` | `string` | ? |  |
| `trigger` | `string` | ? |  |

### CollabWebSocketLifecycleEvent

- Type: `object`
- Required: `event`, `source`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `closeCode` | `integer` |  | nullable |
| `event` | `string` | ? | enum: connect, sync_step_1, sync_update, awareness_update, message_too_large, unauthorized, disconnect, error |
| `reason` | `string` |  | nullable |
| `source` | `string` | ? | enum: server, client |

### CollabWebSocketMessageEnvelope

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `direction` | `string` |  | enum: client_to_server, server_to_client |
| `encoding` | `string` |  | enum: varuint-prefixed-binary |
| `payload` | `string (byte)` |  | Raw binary payload |
| `protocol` | `string` |  | enum: y-sync, y-awareness |
| `typeCode` | `integer` |  | First varuint in the frame indicating sync or awareness channel |

### CollabWebSocketUsageGuide

- Type: `object`
- Required: `step`, `instruction`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `instruction` | `string` | ? |  |
| `step` | `integer` | ? |  |

### Contract

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `approver` | `array<string>` |  |  |
| `category` | `string` |  |  |
| `company` | `string` |  |  |
| `contractRelationship` | `string` |  | enum: standalone, project, msa_project |
| `contractType` | `string` |  | enum: hourly, fixed, milestone |
| `createdAt` | `string (date-time)` |  |  |
| `creator` | `string` |  |  |
| `currency` | `string` |  | example: USD |
| `deliverables` | `array<object>` |  | items properties: name, dueDate |
| `description` | `string` |  |  |
| `endDate` | `string (date-time)` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `project` | `string` |  |  |
| `ratePerHour` | `number` |  |  |
| `signatories` | `array<string>` |  |  |
| `startDate` | `string (date-time)` |  |  |
| `status` | `string` |  | enum: draft, pending_approval, active, completed, cancelled, expired, terminated |
| `title` | `string` |  |  |
| `totalAmount` | `number` |  |  |
| `updatedAt` | `string (date-time)` |  |  |
| `vendor` | `string` |  |  |

### ContractAmendmentDTO

- Type: `object`
- Required: `title`, `description`, `changes`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `changes` | `array<object>` | ? | items properties: field, value |
| `clause` | `string` |  |  |
| `description` | `string` | ? |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `others` | `string` |  |  |
| `title` | `string` | ? |  |

### ContractApproverAssignedApproval

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `completed` | `number` |  |  |
| `total` | `number` |  |  |

### ContractApproverContractInfo

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `contractId` | `string` |  |  |
| `contractValue` | `number` |  | nullable |
| `createdAt` | `string (date-time)` |  |  |
| `currency` | `string` |  | nullable |
| `endDate` | `string (date-time)` |  | nullable |
| `startDate` | `string (date-time)` |  | nullable |
| `status` | `string` |  |  |
| `title` | `string` |  |  |
| `type` | `string` |  | enum: Contract |

### ContractApproverDetail

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `approver` | `object` |  | properties: _id, name, email |
| `assignedApproval` | `ContractApproverAssignedApproval` |  | $ref: ContractApproverAssignedApproval |
| `contract` | `ContractApproverContractInfo` |  | $ref: ContractApproverContractInfo |
| `items` | `object` |  | properties: project, changes, claims, invoices, lems, amendments |
| `models` | `object` |  | properties: project, change, claim, invoice, lem, amendment |
| `status` | `string` |  | enum: pending, completed |
| `submissionDate` | `string (date-time)` |  |  |

### ContractApproverItem

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `actionedAt` | `string (date-time)` |  | nullable |
| `amount` | `number` |  | nullable |
| `comment` | `string` |  | nullable |
| `completedAt` | `string (date-time)` |  | nullable |
| `group` | `string` |  | nullable |
| `level` | `number` |  | nullable |
| `refCode` | `string` |  | nullable |
| `refId` | `string` |  |  |
| `refType` | `string` |  | enum: contract, change, claim, invoice, lem, amendment |
| `status` | `string` |  | enum: pending, approved, rejected |
| `title` | `string` |  |  |

### ContractApproverModelSummary

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `actionedAt` | `string (date-time)` |  | nullable |
| `assigned` | `number` |  |  |
| `comment` | `string` |  | nullable |
| `completed` | `number` |  |  |
| `status` | `string` |  | enum: pending, approved, rejected |

### ContractApproverSummary

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `approvalLevels` | `array<number>` |  | example: [1, 2] |
| `approvedCount` | `number` |  | example: 2 |
| `approverId` | `string` |  | example: 66d21a05b3f6cd1a4b0e1122 |
| `assignedApprovals` | `string` |  | example: 2/3 |
| `email` | `string` |  | example: alex.manager@example.com |
| `hasAssignments` | `boolean` |  | example: True |
| `name` | `string` |  | example: Alex Manager |
| `pendingCount` | `number` |  | example: 1 |
| `rejectedCount` | `number` |  | example: 0 |
| `role` | `string` |  | Comma-separated approver groups this user belongs to ? example: contract_manager, procurement |
| `status` | `string` |  | enum: Not Assigned, Pending, Partially Approved, Approved, Rejected ? example: Pending |
| `totalAssignments` | `number` |  | example: 3 |
| `totalCount` | `number` |  | example: 3 |
| `userRef` | `string` |  | enum: User, Invite |

### ContractChange

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `proposalCategory` | `string` |  |  |
| `title` | `string` |  |  |
| `urgency` | `string` |  | enum: low, medium, high |

### ContractChangeApprover

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `amount` | `number` |  |  |
| `completedAt` | `string (date-time)` |  |  |
| `group` | `string` |  |  |
| `level` | `number` |  |  |
| `levelStatus` | `string` |  | enum: pending, approved, rejected |
| `user` | `array<object>` |  | items properties: _id, user, status, comment, actionedAt |

### ContractChangeCommentDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `content` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |

### ContractChangeDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `proposalCategory` | `string` |  |  |
| `title` | `string` |  |  |
| `type` | `string` |  | enum: request, directive, proposal, order |
| `urgency` | `string` |  | enum: low, medium, high |

### ContractChangeManagerDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `proposalCategory` | `string` |  |  |
| `title` | `string` |  |  |
| `type` | `string` |  | enum: directive, proposal |
| `urgency` | `string` |  | enum: low, medium, high |

### ContractChangeReplyDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `content` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `parentCommentId` | `string` |  |  |

### ContractChangeVendorDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `proposalCategory` | `string` |  |  |
| `title` | `string` |  |  |
| `type` | `string` |  | enum: request, proposal |
| `urgency` | `string` |  | enum: low, medium, high |

### ContractClaimDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `approvers` | `array<ContractChangeApprover>` |  | items properties: _id, level, amount, group, levelStatus, completedAt, user |
| `claimId` | `string` |  |  |
| `cost` | `number` |  |  |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `impact` | `string` |  | enum: time, cost, time_cost |
| `manager` | `object` |  | properties: status, comment |
| `status` | `string` |  | enum: under review, approved, rejected, dispute |
| `time` | `number` |  |  |
| `title` | `string` |  |  |
| `type` | `string` |  |  |

### ContractCommentDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `children` | `array<ContractCommentDTO>` |  | items properties: _id, contract, commentRef, commentRefModel, company, user, replyTo, parent, content, files, children, createdAt, updatedAt |
| `commentRef` | `string` |  |  |
| `commentRefModel` | `string` |  |  |
| `company` | `string` |  |  |
| `content` | `string` |  |  |
| `contract` | `string` |  |  |
| `createdAt` | `string (date-time)` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size, uploadedAt |
| `parent` | `string` |  |  |
| `replyTo` | `object` |  | properties: _id, name, email |
| `updatedAt` | `string (date-time)` |  |  |
| `user` | `object` |  | properties: _id, name, email, role |

### ContractComplianceDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `type` | `string` |  | enum: policy, security |

### ContractComplianceDetails

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `coverage` | `number` |  |  |
| `expDate` | `string (date-time)` |  | nullable |
| `policyStatus` | `ContractComplianceSubmission` |  | $ref: ContractComplianceSubmission |
| `security` | `boolean` |  |  |
| `securityStatus` | `ContractComplianceSubmission` |  | $ref: ContractComplianceSubmission |
| `securityType` | `number` |  |  |

### ContractComplianceFile

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `name` | `string` |  |  |
| `size` | `string` |  |  |
| `type` | `string` |  |  |
| `uploadedAt` | `string (date-time)` |  |  |
| `url` | `string` |  |  |

### ContractComplianceManagerAction

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `actionedAt` | `string (date-time)` |  | nullable |
| `comment` | `string` |  | nullable |
| `status` | `string` |  | enum: pending, approved, rejected |
| `user` | `string` |  |  |

### ContractCompliancePolicyItem

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `policyId` | `string` |  |  |
| `policyName` | `string` |  |  |
| `value` | `number` |  |  |

### ContractComplianceResponseData

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `details` | `ContractComplianceDetails` |  | $ref: ContractComplianceDetails |
| `policy` | `array<ContractCompliancePolicyItem>` |  | items properties: policyId, policyName, value |
| `security` | `array<ContractComplianceSecurityTypeItem>` |  | items properties: securityTypeId, securityType, securityTypeRef, amount, dueDate |

### ContractComplianceSecurityTypeItem

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `amount` | `number` |  |  |
| `dueDate` | `string (date-time)` |  |  |
| `securityType` | `string` |  |  |
| `securityTypeId` | `string` |  |  |
| `securityTypeRef` | `string` |  | nullable |

### ContractComplianceSubmission

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  | nullable |
| `files` | `array<ContractComplianceFile>` |  | items properties: name, url, type, size, uploadedAt |
| `manager` | `ContractComplianceManagerAction` |  | $ref: ContractComplianceManagerAction |
| `status` | `string` |  | enum: pending, approved, rejected, submitted |
| `submissionDate` | `string (date-time)` |  | nullable |
| `type` | `string` |  | enum: policy, contractSecurity |

### ContractDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `approver` | `array<string>` |  |  |
| `category` | `string` |  |  |
| `company` | `string` |  |  |
| `contractRelationship` | `string` |  | enum: standalone, project, msa_project |
| `contractType` | `string` |  | enum: hourly, fixed, milestone |
| `createdAt` | `string (date-time)` |  |  |
| `creator` | `string` |  |  |
| `currency` | `string` |  | example: USD |
| `deliverables` | `array<object>` |  | items properties: name, dueDate |
| `description` | `string` |  |  |
| `endDate` | `string (date-time)` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `project` | `string` |  |  |
| `ratePerHour` | `number` |  |  |
| `signatories` | `array<string>` |  |  |
| `startDate` | `string (date-time)` |  |  |
| `status` | `string` |  | enum: draft, pending_approval, active, completed, cancelled, expired, terminated |
| `title` | `string` |  |  |
| `totalAmount` | `number` |  |  |
| `updatedAt` | `string (date-time)` |  |  |
| `vendor` | `string` |  |  |

### ContractDeliverableDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `responders` | `array<string>` |  |  |

### ContractHoldBackDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `amount` | `number` |  |  |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `invoiceId` | `string` |  |  |
| `type` | `string` |  | enum: partial, full |

### ContractInvoiceDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `amount` | `number` |  |  |
| `approvers` | `array<ContractChangeApprover>` |  | items properties: _id, level, amount, group, levelStatus, completedAt, user |
| `description` | `string` |  |  |
| `fileType` | `string` |  | enum: manual, file |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `invoiceId` | `string` |  |  |
| `items` | `array<object>` |  | items properties: component, description, quantity, unitOfmeasurement, unitPrice, subItems |
| `lem` | `string` |  |  |
| `manager` | `object` |  | properties: status, comment |
| `status` | `string` |  | enum: active, draft, pending, approved, rejected |
| `taxCode` | `string` |  | enum: HST, GST, PST/QST, Others |
| `taxValue` | `number` |  |  |
| `title` | `string` |  |  |
| `type` | `string` |  | enum: progress draw, monthly payment, milestone payment, holdback |

### ContractKPIDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `NCRLog` | `number` |  |  |
| `QADocs` | `number` |  |  |
| `complianceTracking` | `number` |  |  |
| `inspectionReport` | `number` |  |  |
| `invoiceContract` | `number` |  |  |
| `issueResolution` | `number` |  |  |
| `mileStoneLog` | `number` |  |  |
| `scheduleConfirm` | `number` |  |  |
| `timestampComLog` | `number` |  |  |
| `timestampDelivery` | `number` |  |  |
| `twoWay` | `number` |  |  |

### ContractLemDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `amount` | `number` |  |  |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `title` | `string` |  |  |

### ContractNCRCAPADTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `responder` | `string` |  |  |
| `timeline` | `string` |  |  |
| `title` | `string` |  |  |

### ContractNCRDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `responder` | `string` |  |  |
| `title` | `string` |  |  |

### ContractNcrDetail

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  | example: 66fbd4c09f4e2b0012345678 |
| `capa` | `array<object>` |  | items properties: _id, capaId, title, user |
| `description` | `string` |  | example: Observed hairline cracks in slab section A. |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `ncrId` | `string` |  | example: NCR-1738741200000 |
| `responders` | `array<ContractNcrResponder>` |  | items properties: user, status, actionedAt |
| `status` | `string` |  | enum: pending, approved, rejected ? example: pending |
| `submittedBy` | `object` |  | properties: _id, name, email |
| `title` | `string` |  | example: Concrete surface cracks |

### ContractNcrResponder

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `actionedAt` | `string (date-time)` |  | example: 2026-02-08T12:00:00.000Z |
| `status` | `string` |  | enum: pending, replied ? example: pending |
| `user` | `string` |  | example: 66d21a05b3f6cd1a4b0e1122 |

### ContractNcrSummary

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  | example: 66fbd4c09f4e2b0012345678 |
| `ncrId` | `string` |  | example: NCR-1738741200000 |
| `status` | `string` |  | enum: pending, approved, rejected ? example: pending |
| `title` | `string` |  | example: Concrete surface cracks |

### ContractPaymentTerm

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `description` | `string` |  |  |
| `name` | `string` |  |  |

### ContractReportDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `title` | `string` |  |  |

### ContractRfiDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `deadline` | `string (date-time)` |  |  |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `responder` | `string` |  |  |
| `title` | `string` |  |  |

### ContractRfiResponseDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |

### ContractSavingDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `amount` | `number` |  |  |
| `category` | `string` |  |  |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `title` | `string` |  |  |

### ContractServiceApprover

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `email` | `string` |  | nullable |
| `id` | `string` |  | nullable |
| `name` | `string` |  | nullable |
| `phone` | `string` |  | nullable |

### ContractServiceDetail

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `approvers` | `array<ContractServiceApprover>` |  | items properties: id, name, email, phone |
| `assignContract` | `array<object>` |  | items properties: _id, name |
| `company` | `object` |  | nullable ? properties: _id, name |
| `contigency` | `string` |  | nullable |
| `contractId` | `string` |  | nullable |
| `contractRelationship` | `string` |  | enum: standalone, project, msa_project |
| `creator` | `object` |  | nullable ? properties: _id, name, email |
| `description` | `string` |  | nullable |
| `endDate` | `string (date-time)` |  | nullable |
| `holdBackReleased` | `number` |  | example: 15000 |
| `internalTeam` | `array<ContractServicePerson>` |  | items properties: id, name, email, role, phone |
| `projectManager` | `object` |  | nullable ? properties: user, status, actionedAt |
| `savingAmount` | `number` |  | example: 4500 |
| `startDate` | `string (date-time)` |  | nullable |
| `status` | `string` |  |  |
| `title` | `string` |  |  |
| `vendor` | `object` |  | nullable ? properties: _id, name |

### ContractServiceListItem

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  | example: 66c2f22e9f4e2b0012345678 |
| `contractId` | `string` |  | nullable ? example: CTR-2026-001 |
| `contractRelationship` | `string` |  | enum: standalone, project, msa_project ? nullable |
| `contractValue` | `number` |  | nullable ? example: 125000 |
| `createdAt` | `string (date-time)` |  |  |
| `endDate` | `string (date-time)` |  | nullable |
| `projectManager` | `object` |  | nullable ? properties: name |
| `startDate` | `string (date-time)` |  | nullable |
| `status` | `string` |  | example: active |
| `title` | `string` |  | example: Bridge Inspection |

### ContractServicePerson

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `email` | `string` |  | nullable |
| `id` | `string` |  | nullable |
| `name` | `string` |  | nullable |
| `phone` | `string` |  | nullable |
| `role` | `string` |  | nullable |

### ContractTermType

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `description` | `string` |  |  |
| `name` | `string` |  |  |

### ContractType

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `description` | `string` |  |  |
| `name` | `string` |  |  |

### CreateContractInput

- Type: `object`
- Required: `title`, `description`, `category`, `timezone`, `contractType`, `contractRelationship`, `rating`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `approvaers` | `array<object>` |  | items properties: user, groupName, levelName, amount |
| `approvers` | `array<object>` |  | items properties: user, groupName, level, amount |
| `businessDivision` | `string` |  | Business division ID |
| `category` | `string` | ? |  |
| `contigency` | `string` |  |  |
| `contractAmount` | `number` |  |  |
| `contractFormationStage` | `object` |  | properties: draft, review, approval, execution |
| `contractId` | `string` |  | Optional external ID |
| `contractPaymentTerm` | `string` |  | Contract payment term ID |
| `contractRelationship` | `string` | ? | enum: standalone, project, msa_project |
| `contractTermType` | `string` |  | Contract term type ID |
| `contractType` | `string` | ? | Contract type ID |
| `currency` | `string` |  | contracct currency - default CAD |
| `deliverable` | `object` |  | properties: name, dueDate |
| `deliverables` | `array<object>` |  | items properties: name, dueDate |
| `description` | `string` | ? |  |
| `duration` | `number` |  |  |
| `endDate` | `string (date-time)` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `holdBack` | `number` |  |  |
| `insurance` | `object` |  | properties: insurance, contractSecurity, contractSecurityType, expiryDate, policy |
| `internalTeam` | `array<string>` |  | List of internal user IDs |
| `jobTitle` | `string` |  |  |
| `milestone` | `array<object>` |  | items properties: amount, dueDate, name, deliverable |
| `msaContractId` | `string` |  | MSA Contract ID when contractRelationship is 'msa_project' |
| `paymentStructure` | `string` |  | enum: Monthly, Milestone, Progress Draw ? Payment arrangement for the contract |
| `paymentTerm` | `string` |  |  |
| `personnel` | `array<object>` |  | items properties: name, role, email, phone |
| `projectId` | `string` |  | Project ID when contractRelationship is 'project' |
| `rating` | `number` | ? |  |
| `signatories` | `array<string>` |  |  |
| `solicitationId` | `string` |  | Link to an awarded solicitation |
| `startDate` | `string (date-time)` |  |  |
| `status` | `string` |  | enum: draft, publish ? Contract status on creation (default publish) |
| `termType` | `string` |  |  |
| `timezone` | `string` | ? |  |
| `title` | `string` | ? |  |
| `vendor` | `string` |  | Vendor ObjectId or email |
| `visibility` | `string` |  | enum: public, private |

### CreateMsaContractInput

- Type: `object`
- Required: `title`, `msaType`, `description`, `rating`, `businessDivision`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `approvers` | `array<object>` |  | items properties: user, groupName, level, amount |
| `businessDivision` | `string` | ? |  |
| `contigency` | `string` |  |  |
| `contractAmount` | `number` |  |  |
| `contractFormationStage` | `object` |  | properties: draft, review, approval, execution |
| `currency` | `string` |  |  |
| `deliverables` | `array<object>` |  | items properties: name, dueDate |
| `description` | `string` | ? |  |
| `duration` | `number` |  |  |
| `endDate` | `string (date)` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `holdBack` | `number` |  |  |
| `insurance` | `object` |  | properties: insurance, contractSecurity, contractSecurityType, expiryDate, policy |
| `internalTeam` | `array<string>` |  |  |
| `jobTitle` | `string` |  |  |
| `milestone` | `array<object>` |  | items properties: amount, dueDate, name, deliverable |
| `msaContractId` | `string` |  |  |
| `msaType` | `string` | ? |  |
| `paymentStructure` | `string` |  | enum: Monthly, Milestone, Progress Draw |
| `paymentTerm` | `string` |  |  |
| `personnel` | `array<object>` |  | items properties: name, role, email, phone |
| `projectManager` | `string` |  |  |
| `rating` | `number` | ? |  |
| `signatories` | `array<string>` |  |  |
| `startDate` | `string (date)` |  |  |
| `status` | `string` |  | enum: draft, publish |
| `termType` | `string` |  |  |
| `timezone` | `string` |  |  |
| `title` | `string` | ? |  |
| `vendor` | `string` |  |  |
| `visibility` | `string` |  | enum: public, private |

### CreateProjectInput

- Type: `object`
- Required: `name`, `category`, `description`, `budget`, `allowMultiple`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `allowMultiple` | `boolean` | ? | Whether multiple contracts are allowed under this project ? example: True |
| `budget` | `number` | ? | Allocated budget for the project ? example: 1200000 |
| `businessDivision` | `string` |  | Optional business division or department ? example: Education |
| `category` | `string` | ? | Project category or domain ? example: Education |
| `description` | `string` | ? | Detailed explanation of the project scope ? example: Renovation of central school blocks |
| `endDate` | `string (date)` |  | Optional end date (ISO 8601) ? example: 2026-09-30 |
| `files` | `array<object>` |  | Optional list of associated file metadata ? items properties: name, url, type, size |
| `name` | `string` | ? | Project name ? example: School Renovation |
| `startDate` | `string (date)` |  | Optional start date (ISO 8601) ? example: 2026-01-15 |

### DuplicateError

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `message` | `string` |  | example: Duplicate entry |
| `status` | `number` |  | example: 409 |

### ErrorResponse

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `message` | `string` |  | example: Something went wrong |
| `status` | `string` |  | example: error |

### FinancialStatement

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `billedTillDate` | `number` |  |  |
| `changeOrders` | `object` |  | properties: count, value |
| `currency` | `string` |  |  |
| `currentContractValue` | `number` |  |  |
| `holdbackAmount` | `number` |  |  |
| `originalContractValue` | `number` |  |  |
| `pendingChangeOrders` | `number` |  |  |
| `percentageIncrease` | `number` |  |  |
| `releasedHoldback` | `number` |  |  |
| `remaining` | `number` |  |  |
| `savingsRealized` | `object` |  | properties: value, percentage |

### IContract

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `approver` | `array<string>` |  |  |
| `category` | `string` |  |  |
| `company` | `string` |  |  |
| `contractRelationship` | `string` |  | enum: standalone, project, msa_project |
| `contractType` | `string` |  | enum: hourly, fixed, milestone |
| `createdAt` | `string (date-time)` |  |  |
| `creator` | `string` |  |  |
| `currency` | `string` |  | example: USD |
| `deliverables` | `array<object>` |  | items properties: name, dueDate |
| `description` | `string` |  |  |
| `endDate` | `string (date-time)` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `project` | `string` |  |  |
| `ratePerHour` | `number` |  |  |
| `signatories` | `array<string>` |  |  |
| `startDate` | `string (date-time)` |  |  |
| `status` | `string` |  | enum: draft, pending_approval, active, completed, cancelled, expired, terminated |
| `title` | `string` |  |  |
| `totalAmount` | `number` |  |  |
| `updatedAt` | `string (date-time)` |  |  |
| `vendor` | `string` |  |  |

### IContractChange

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `proposalCategory` | `string` |  |  |
| `title` | `string` |  |  |
| `type` | `string` |  | enum: request, directive, proposal, order |
| `urgency` | `string` |  | enum: low, medium, high |

### IContractClaim

- Type: `object`
- Required: `title`, `type`, `impact`, `description`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `cost` | `number` |  |  |
| `description` | `string` | ? |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `impact` | `string` | ? | enum: time, cost, time_cost |
| `time` | `number` |  |  |
| `title` | `string` | ? |  |
| `type` | `string` | ? |  |

### IContractInvoice

- Type: `object`
- Required: `title`, `description`, `type`, `taxCode`, `status`, `fileType`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `amount` | `number` |  |  |
| `description` | `string` | ? |  |
| `fileType` | `string` | ? | enum: manual, file |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `items` | `array<object>` |  | items properties: component, description, quantity, unitOfmeasurement, unitPrice, subItems |
| `lem` | `string` |  |  |
| `status` | `string` | ? | enum: active, draft |
| `taxCode` | `string` | ? | enum: HST, GST, PST/QST, Others |
| `taxValue` | `number` |  |  |
| `title` | `string` | ? |  |
| `type` | `string` | ? | enum: progress draw, monthly payment, milestone payment, holdback |

### MsaContractApproverAssignedApproval

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `completed` | `number` |  |  |
| `total` | `number` |  |  |

### MsaContractApproverContractInfo

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `contractId` | `string` |  | msaContractId or internal contractId |
| `contractValue` | `number` |  | nullable |
| `createdAt` | `string (date-time)` |  |  |
| `currency` | `string` |  | nullable |
| `endDate` | `string (date-time)` |  | nullable |
| `startDate` | `string (date-time)` |  | nullable |
| `status` | `string` |  |  |
| `title` | `string` |  |  |
| `type` | `string` |  | enum: MsaContract |

### MsaContractApproverDetails

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `approver` | `object` |  | properties: _id, name, email |
| `assignedApproval` | `MsaContractApproverAssignedApproval` |  | $ref: MsaContractApproverAssignedApproval |
| `contract` | `MsaContractApproverContractInfo` |  | $ref: MsaContractApproverContractInfo |
| `items` | `object` |  | properties: project, changes, claims, invoices, lems, amendments |
| `models` | `object` |  | properties: project, change, claim, invoice, lem, amendment |
| `status` | `string` |  | enum: pending, completed |
| `submissionDate` | `string (date-time)` |  |  |

### MsaContractApproverItem

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `actionedAt` | `string (date-time)` |  | nullable |
| `amount` | `number` |  | nullable |
| `comment` | `string` |  | nullable |
| `completedAt` | `string (date-time)` |  | nullable |
| `group` | `string` |  | nullable |
| `level` | `number` |  | nullable |
| `refCode` | `string` |  | nullable ? Human-readable reference code (e.g. changeId, claimId, invoiceId) |
| `refId` | `string` |  |  |
| `refType` | `string` |  | enum: contract, change, claim, invoice, lem, amendment |
| `status` | `string` |  | enum: pending, approved, rejected |
| `title` | `string` |  |  |

### MsaContractApproverModelSummary

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `actionedAt` | `string (date-time)` |  | nullable |
| `assigned` | `number` |  |  |
| `comment` | `string` |  | nullable |
| `completed` | `number` |  |  |
| `status` | `string` |  | enum: pending, approved, rejected |

### MsaContractApproverSummary

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `approvalLevels` | `array<number>` |  | Sorted approval levels this user participates in |
| `approvedCount` | `number` |  |  |
| `approverId` | `string` |  | Approver user/invite ID |
| `assignedApprovals` | `string` |  | Approved/total assignments string ? example: 2/5 |
| `email` | `string (email)` |  |  |
| `hasAssignments` | `boolean` |  |  |
| `name` | `string` |  |  |
| `pendingCount` | `number` |  |  |
| `rejectedCount` | `number` |  |  |
| `role` | `string` |  | Comma-separated approver groups/roles this user belongs to |
| `status` | `string` |  | enum: Not Assigned, Pending, Partially Approved, Approved, Rejected |
| `totalAssignments` | `number` |  | How many times this user appears across groups/levels |
| `totalCount` | `number` |  |  |
| `userRef` | `string` |  | enum: User, Invite |

### MsaContractServiceApprover

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `email` | `string` |  | nullable |
| `id` | `string` |  | nullable |
| `name` | `string` |  | nullable |
| `phone` | `string` |  | nullable |

### MsaContractServiceDetail

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `approvers` | `array<MsaContractServiceApprover>` |  | items properties: id, name, email, phone |
| `assignContract` | `array<object>` |  | items properties: _id, name |
| `company` | `object` |  | nullable ? properties: _id, name |
| `contigency` | `string` |  | nullable |
| `contractRelationship` | `string` |  | enum: standalone, project, msa_project ? nullable |
| `creator` | `object` |  | nullable ? properties: _id, name, email |
| `description` | `string` |  | nullable |
| `endDate` | `string (date-time)` |  | nullable |
| `holdBackReleased` | `number` |  | example: 15000 |
| `internalTeam` | `array<MsaContractServicePerson>` |  | items properties: id, name, email, role, phone |
| `msaContractId` | `string` |  | nullable |
| `msaType` | `object` |  | nullable ? properties: _id, name |
| `projectManager` | `object` |  | nullable ? properties: user, status, actionedAt |
| `savingAmount` | `number` |  | example: 4500 |
| `startDate` | `string (date-time)` |  | nullable |
| `status` | `string` |  |  |
| `title` | `string` |  |  |
| `vendor` | `object` |  | nullable ? properties: _id, name |

### MsaContractServiceListItem

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  | example: 66c2f22e9f4e2b0012345678 |
| `contractRelationship` | `string` |  | enum: standalone, project, msa_project ? nullable |
| `contractValue` | `number` |  | nullable ? example: 250000 |
| `createdAt` | `string (date-time)` |  |  |
| `endDate` | `string (date-time)` |  | nullable |
| `msaContractId` | `string` |  | nullable ? example: MSA-2026-001 |
| `projectManager` | `object` |  | nullable ? properties: name |
| `startDate` | `string (date-time)` |  | nullable |
| `status` | `string` |  | example: active |
| `title` | `string` |  | example: Master Services Agreement |

### MsaContractServicePerson

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `email` | `string` |  | nullable |
| `id` | `string` |  | nullable |
| `name` | `string` |  | nullable |
| `phone` | `string` |  | nullable |
| `role` | `string` |  | nullable |

### NotFoundError

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `message` | `string` |  | example: Not Found |
| `status` | `number` |  | example: 404 |

### Project

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `allowMultiple` | `boolean` |  |  |
| `budget` | `number` |  |  |
| `businessDivision` | `string` |  |  |
| `category` | `string` |  |  |
| `company` | `string` |  |  |
| `createdAt` | `string (date-time)` |  |  |
| `creator` | `string` |  |  |
| `description` | `string` |  |  |
| `endDate` | `string (date-time)` |  |  |
| `name` | `string` |  |  |
| `startDate` | `string (date-time)` |  |  |
| `status` | `string` |  | enum: active, completed, cancelled |
| `updatedAt` | `string (date-time)` |  |  |

### ProjectStats

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `active` | `number` |  |  |
| `all` | `number` |  |  |
| `cancelled` | `number` |  |  |
| `completed` | `number` |  |  |

### RateSheetDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `amount` | `number` |  |  |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `sheetId` | `string` |  |  |
| `status` | `string` |  |  |
| `title` | `string` |  |  |

### SendApproverDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `userIds` | `array<string>` |  |  |

### ServerError

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `message` | `string` |  | example: Internal server error |
| `status` | `number` |  | example: 500 |

### UpdateContractClaimDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `cost` | `number` |  |  |
| `description` | `string` |  |  |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `impact` | `string` |  | enum: time, cost, time_cost |
| `time` | `number` |  |  |
| `title` | `string` |  |  |
| `type` | `string` |  |  |

### UpdateContractInvoiceDTO

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `amount` | `number` |  | nullable |
| `description` | `string` |  | example: Updated invoice description |
| `fileType` | `string` |  | enum: manual, file |
| `files` | `array<object>` |  | items properties: name, url, type, size |
| `items` | `array<object>` |  | items properties: component, description, quantity, unitOfmeasurement, unitPrice, subItems |
| `lem` | `string` |  | nullable |
| `status` | `string` |  | enum: active, draft |
| `taxCode` | `string` |  | enum: HST, GST, PST/QST, Others |
| `taxValue` | `number` |  | nullable |
| `title` | `string` |  | example: Progress Draw |
| `type` | `string` |  | enum: progress draw, monthly payment, milestone payment, holdback |

### UserBasic

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `_id` | `string` |  |  |
| `email` | `string` |  |  |
| `name` | `string` |  |  |

### ValidationError

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `message` | `string` |  | example: Validation failed |
| `status` | `number` |  | example: 422 |

### VendorContractServiceListItem

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `contractId` | `string` |  | nullable ? example: CTR-2026-001 |
| `contractRelationship` | `string` |  | enum: standalone, project, msa_project ? nullable |
| `contractType` | `string` |  | enum: Contract ? example: Contract |
| `contractValue` | `number` |  | nullable ? example: 125000 |
| `createdAt` | `string (date-time)` |  |  |
| `endDate` | `string (date-time)` |  | nullable |
| `id` | `string` |  | example: 66c2f22e9f4e2b0012345678 |
| `projectManager` | `object` |  | nullable ? properties: name |
| `startDate` | `string (date-time)` |  | nullable |
| `status` | `string` |  | example: active |
| `title` | `string` |  | example: Bridge Inspection |

### VendorMsaContractServiceListItem

- Type: `object`

| Field | Type | Required | Details |
| --- | --- | --- | --- |
| `contractRelationship` | `string` |  | enum: standalone, project, msa_project ? nullable |
| `contractType` | `string` |  | enum: MsaContract ? example: MsaContract |
| `contractValue` | `number` |  | nullable ? example: 250000 |
| `createdAt` | `string (date-time)` |  |  |
| `endDate` | `string (date-time)` |  | nullable |
| `id` | `string` |  | example: 66c2f22e9f4e2b0012345678 |
| `msaContractId` | `string` |  | nullable ? example: MSA-2026-001 |
| `projectManager` | `object` |  | nullable ? properties: name |
| `startDate` | `string (date-time)` |  | nullable |
| `status` | `string` |  | example: active |
| `title` | `string` |  | example: Master Services Agreement |


*End of SwiftPro API Reference v2.3.0*
