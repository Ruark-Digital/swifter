# Front-End API Integration Guide

This guide is written for front-end developers integrating with the SwiftPro Contract API.

It documents:
- environment and base URLs
- authentication and role behavior
- request/response and error formats
- rate limiting
- practical integration patterns
- complete route catalogs (manager, vendor, user, approver, collaboration)

---

## Table of Contents

- [1) Environment Setup](#1-environment-setup)
- [2) Base URL Configuration](#2-base-url-configuration)
- [3) Authentication and Authorization](#3-authentication-and-authorization)
- [4) Headers, Content Types, and HTTP Methods](#4-headers-content-types-and-http-methods)
- [5) Standard Response and Error Shapes](#5-standard-response-and-error-shapes)
- [6) Query, Params, and Body Patterns](#6-query-params-and-body-patterns)
- [7) Practical Front-End Integration Patterns](#7-practical-front-end-integration-patterns)
- [8) Endpoint Catalog: Manager](#8-endpoint-catalog-manager)
- [9) Endpoint Catalog: Vendor](#9-endpoint-catalog-vendor)
- [10) Endpoint Catalog: User (View-Only)](#10-endpoint-catalog-user-view-only)
- [11) Endpoint Catalog: Approver](#11-endpoint-catalog-approver)
- [12) Endpoint Catalog: Collaboration](#12-endpoint-catalog-collaboration)
- [13) Swagger/OpenAPI Source of Truth](#13-swaggeropenapi-source-of-truth)
- [14) Front-End Troubleshooting Checklist](#14-front-end-troubleshooting-checklist)

---

## 1) Environment Setup

Use your front-end environment file to configure the API host.

```bash
# Example (.env.local)
VITE_API_BASE_URL=https://your-host/api/v1/contract
```

In development, you may use:

```bash
VITE_API_BASE_URL=http://localhost:10000/api/v1/dev/contract
```

---

## 2) Base URL Configuration

The backend exposes two equivalent API bases:

| Environment | Base URL |
|---|---|
| Dev-style prefix | `/api/v1/dev/contract` |
| Standard prefix | `/api/v1/contract` |

Swagger UI:
- `/api/v1/dev/contract/docs`
- `/api/v1/dev/contract/docs.json`

---

## 3) Authentication and Authorization

All API routes are behind authentication middleware.

### Required Auth Header

```http
Authorization: Bearer <jwt_token>
```

### Role Model

- `/manager/*`: authenticated users with route-level role checks
- `/vendor/*`: must be `vendor`
- `/user/*`: must be `view_only`
- `/approver/*`: must be `approver`

### Role-based Access Behavior

- `401` when token is missing/invalid/expired
- `403` when role is not allowed for that route

---

## 4) Headers, Content Types, and HTTP Methods

### Standard Headers

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | `Bearer <token>` |
| Content-Type | For body routes | `application/json` |

### Supported Methods in API

- `GET`, `POST`, `PUT`, `PATCH`, `DELETE`

### Body Types

- JSON for most endpoints
- multipart/form-data for upload endpoints (collab upload)

---

## 5) Standard Response and Error Shapes

### Success Response Pattern

Most endpoints return:

```json
{
  "status": "success",
  "message": "Human-readable message",
  "data": {}
}
```

Some endpoints may return:

```json
{
  "message": "Human-readable message",
  "data": {}
}
```

### Error Response Pattern

Development-style responses may include stack traces.

```json
{
  "status": "error",
  "message": "Validation Error - field - message"
}
```

Common status codes:

| Status | Meaning |
|---|---|
| 400 | Bad request |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found |
| 406 | Invalid cast/type |
| 409 | Duplicate or conflict |
| 422 | Validation error |
| 429 | Rate or domain guard |
| 500 | Server error |

---

## 6) Query, Params, and Body Patterns

### Common Query Params

| Param | Type | Usage |
|---|---|---|
| page | number | Pagination page |
| limit | number | Pagination page size |
| status | string | Status filtering |
| title | string | Search by title |
| type | string | Contract model type (`Contract`, `MsaContract`) |
| startDate / endDate | string/date | Date filtering |
| range | string | Dashboard ranges (`YTD`, `90`, `60`, `30`, `7`) |

### Common Path Params

| Param | Meaning |
|---|---|
| contractId | Contract identifier |
| dataId | Contract/MSA identifier for create operations |
| changeId, claimId, rfiId, ncrId | Domain resource identifiers |
| amendmentId, invoiceId, lemId, rateSheetId | Domain sub-resource identifiers |
| commentId, holdBackId, savingId | Nested resource identifiers |

### Common Body DTO Patterns

| Pattern | Typical Fields |
|---|---|
| Approval | `status`, `comment` |
| Comment | `content`, `files[]` |
| Reply | `parentCommentId`, `content`, `files[]` |
| Create/Update Contract | title, description, category, relationship, rating, dates, vendor, personnel, approvers, insurance |

---

## 7) Practical Front-End Integration Patterns

### 7.1 API Client Wrapper (TypeScript)

```ts
type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiOptions = {
  method?: ApiMethod;
  token: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest<T>(path: string, opts: ApiOptions): Promise<T> {
  const method = opts.method ?? "GET";
  const url = new URL(`${API_BASE}${path}`);
  if (opts.query) {
    Object.entries(opts.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  const isMultipart = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.token}`,
    ...(isMultipart ? {} : { "Content-Type": "application/json" }),
    ...(opts.headers ?? {})
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: opts.body ? (isMultipart ? (opts.body as FormData) : JSON.stringify(opts.body)) : undefined
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}
```

### 7.2 Pagination Pattern

```ts
const resp = await apiRequest<{ data: { total: number; page: number; items: any[] } }>(
  "/manager/contracts",
  {
    token,
    query: { page: 1, limit: 20, status: "active" }
  }
);
```

### 7.3 Approval Action Pattern

```ts
await apiRequest("/manager/contracts/123/changes/CH-1/approve", {
  method: "POST",
  token,
  body: {
    status: "approved",
    comment: "Looks good"
  }
});
```

### 7.4 Comment + Reply Pattern

```ts
await apiRequest("/manager/contracts/123/claims/CL-1/comments", {
  method: "POST",
  token,
  body: { content: "Please attach updated invoice." }
});

await apiRequest("/manager/contracts/123/claims/CL-1/comments/C-1/reply", {
  method: "POST",
  token,
  body: { parentCommentId: "C-1", content: "Uploaded." }
});
```

### 7.5 Upload Pattern (multipart)

```ts
const fd = new FormData();
fd.append("file", fileInput.files![0]);
await apiRequest("/manager/collab/upload", {
  method: "POST",
  token,
  body: fd
});
```

---

## 8) Endpoint Catalog: Manager

Base prefix: `/manager`

### 8.1 Manager Core (Projects/Business/Contract Utilities)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/manager/projects` | Bearer + role | Unlinked project list for contract linkage |
| GET | `/manager/projects/stats` | Bearer + role | Project stats |
| GET | `/manager/projects/:projectId` | Bearer + role | Project detail |
| PATCH | `/manager/projects/:projectId/complete` | Bearer + role | Mark project complete |
| POST | `/manager/business-division` | Bearer + role | Create business division |
| GET | `/manager/business-division` | Bearer + role | List divisions |
| GET | `/manager/business-division/stats` | Bearer + role | Division stats |
| GET | `/manager/business-division/:divisionId` | Bearer + role | Division detail |

### 8.2 Manager Contract Routes

| Method | Path |
|---|---|
| GET | `/manager/projects` |
| GET | `/manager/types` |
| GET | `/manager/payment-terms` |
| GET | `/manager/terms` |
| GET | `/manager/awarded-solicitation` |
| GET | `/manager/personnel` |
| GET | `/manager/personnel/contract/:contractId` |
| GET | `/manager/msa-contract` |
| GET | `/manager/contracts/stats` |
| POST | `/manager/contracts` |
| GET | `/manager/contracts` |
| GET | `/manager/contracts/me` |
| GET | `/manager/contracts/:contractId` |
| PUT | `/manager/contracts/:contractId` |
| GET | `/manager/contracts/:contractId/compliance` |
| POST | `/manager/contracts/:contractId/compliance/:type/:typeId/approve` |
| GET | `/manager/contracts/:contractId/kpis` |
| GET | `/manager/contracts/:contractId/kpis/:kpiId` |
| POST | `/manager/contracts/:contractId/kpis/:kpiId` |
| GET | `/manager/contracts/:contractId/reports/stats` |
| GET | `/manager/contracts/:contractId/reports` |
| GET | `/manager/contracts/:contractId/reports/:reportId` |
| GET | `/manager/contracts/:contractId/logs` |
| GET | `/manager/contracts/:contractId/logs/:logId` |
| GET | `/manager/contracts/:contractId/clauses` |
| GET | `/manager/contracts/:contractId/lems` |
| GET | `/manager/contracts/:contractId/lems/:lemId` |
| GET | `/manager/contracts/:contractId/lems/:lemId/approve/status` |
| POST | `/manager/contracts/:contractId/lems/:lemId/approve` |
| GET | `/manager/contracts/:contractId/ratesheets` |
| GET | `/manager/contracts/:contractId/lems/:lemId/ratesheet` |
| GET | `/manager/contracts/:contractId/ratesheets/:rateSheetId` |
| POST | `/manager/:contractId/ratesheets` |
| GET | `/manager/contracts/:contractId/ratesheets/:rateSheetId/approve/status` |
| POST | `/manager/contracts/:contractId/ratesheets/:rateSheetId/approve` |
| POST | `/manager/contracts/:contractId/payment-holdbacks` |
| GET | `/manager/contracts/:contractId/payment-holdbacks` |
| GET | `/manager/contracts/payment-holdbacks/:holdBackId` |
| POST | `/manager/contracts/:contractId/payment-savings` |
| GET | `/manager/contracts/:contractId/payment-savings` |
| GET | `/manager/contracts/payment-savings/:savingId` |
| GET | `/manager/contracts/:contractId/changes/stats` |
| GET | `/manager/contracts/:contractId/approvers` |
| GET | `/manager/contracts/:contractId/approvers/:approverId` |
| GET | `/manager/contracts/:contractId/changes` |
| GET | `/manager/contracts/:contractId/changes/:changeId` |
| POST | `/manager/contracts/:dataId/change/:type` |
| POST | `/manager/contracts/:contractId/changes/:changeId/approve` |
| GET | `/manager/contracts/:contractId/changes/:changeId/approve/status` |
| GET | `/manager/contracts/:contractId/changes/:changeId/approvers` |
| POST | `/manager/contracts/:contractId/claims/:claimId/approve` |
| GET | `/manager/contracts/:contractId/claims/:claimId/approve/status` |
| GET | `/manager/contracts/:contractId/changes/:changeId/comments` |
| POST | `/manager/contracts/:contractId/changes/:changeId/comments` |
| POST | `/manager/contracts/:contractId/changes/:changeId/comments/:commentId/reply` |
| GET | `/manager/contracts/:contractId/claims/stats` |
| GET | `/manager/contracts/:contractId/claims` |
| GET | `/manager/contracts/:contractId/claims/:claimId` |
| GET | `/manager/contracts/:contractId/claims/:claimId/comments` |
| POST | `/manager/contracts/:contractId/claims/:claimId/comments` |
| POST | `/manager/contracts/:contractId/claims/:claimId/comments/:commentId/reply` |
| GET | `/manager/contracts/:contractId/claims/:claimId/approvers` |
| POST | `/manager/contracts/:contractId/claims/:claimId/approvers` |
| GET | `/manager/contracts/:contractId/deliverables/stats` |
| GET | `/manager/contracts/:contractId/deliverables` |
| GET | `/manager/contracts/:contractId/deliverables/:deliverableId` |
| POST | `/manager/contracts/:contractId/deliverables/:deliverableId/approve` |
| GET | `/manager/contracts/:contractId/deliverables/:deliverableId/approve/status` |
| GET | `/manager/contracts/:contractId/invoice/stats` |
| GET | `/manager/contracts/:contractId/invoice` |
| GET | `/manager/contracts/invoice/:invoiceId` |
| POST | `/manager/contracts/:contractId/invoice/:invoiceId/approve` |
| GET | `/manager/contracts/:contractId/amendments/stats` |
| GET | `/manager/contracts/:contractId/amendments` |
| POST | `/manager/contracts/:contractId/amendments` |
| GET | `/manager/contracts/:contractId/amendments/:amendmentId` |
| POST | `/manager/contracts/:contractId/amendments/:amendmentId/approvers` |
| POST | `/manager/contracts/:contractId/amendments/:amendmentId/approve` |
| POST | `/manager/contracts/:dataId/rfis` |
| GET | `/manager/contracts/:contractId/ncrs/stats` |
| GET | `/manager/contracts/:contractId/ncrs` |
| GET | `/manager/contracts/:contractId/ncrs/:ncrId` |
| GET | `/manager/contracts/:contractId/rfis/stats` |
| GET | `/manager/contracts/:contractId/rfis` |
| GET | `/manager/contracts/:contractId/rfis/:rfiId` |
| GET | `/manager/contracts/:contractId/rfis/:rfiId/response` |
| POST | `/manager/contracts/:dataId/rfis/:rfiId/response` |
| GET | `/manager/contracts/:contractId/rfis/:rfiId/comment` |
| POST | `/manager/contracts/:contractId/rfis/:rfiId/comment` |
| POST | `/manager/contracts/:contractId/rfis/:rfiId/comment/:commentId/reply` |
| GET | `/manager/contracts/:contractId/dashboard/financial-statement` |
| GET | `/manager/contracts/:contractId/dashboard/deliverable-status` |
| GET | `/manager/contracts/:contractId/dashboard/activities` |
| GET | `/manager/contracts/:contractId/dashboard/delivery-summary` |
| GET | `/manager/contracts/:contractId/dashboard/attachment` |
| GET | `/manager/contracts/:contractId/dashboard/vendor-kpi` |
| GET | `/manager/contracts/:contractId/dashboard/overview` |
| GET | `/manager/contracts/:contractId/dashboard/alerts` |
| GET | `/manager/contracts/:contractId/dashboard/clause-legal-analysis` |
| GET | `/manager/contracts/dashboard/vendor-summary` |
| GET | `/manager/contracts/dashboard/renewals` |
| GET | `/manager/contracts/dashboard/clause-intelligence` |
| GET | `/manager/contracts/dashboard/cards/total` |
| GET | `/manager/contracts/dashboard/cards/ytd` |
| GET | `/manager/contracts/dashboard/action-logs` |
| GET | `/manager/contracts/dashboard/general-updates` |
| GET | `/manager/contracts/dashboard/cycle-time` |
| GET | `/manager/contracts/dashboard/invoice-status` |
| GET | `/manager/contracts/dashboard/committed-vs-actual` |
| GET | `/manager/contracts/dashboard/vendor-contract-value` |
| GET | `/manager/contracts/dashboard/project-contract-value` |
| GET | `/manager/contracts/dashboard/risk-distribution` |
| GET | `/manager/contracts/dashboard/change-order-impact` |
| GET | `/manager/contracts/dashboard/category-value` |
| GET | `/manager/contracts/dashboard/compliance-status` |
| GET | `/manager/contracts/dashboard/contract-status` |

### 8.3 Manager MSA Routes

| Method | Path |
|---|---|
| GET | `/manager/msa-contract/stats` |
| GET | `/manager/msa-contract` |
| GET | `/manager/msa-contract/me` |
| POST | `/manager/msa-contract` |
| PUT | `/manager/msa-contract/:contractId` |
| GET | `/manager/msa-contract/:contractId` |
| GET | `/manager/msa-contract/:contractId/linked-contract` |
| POST | `/manager/msa-contract/:contractId/payment-holdbacks` |
| GET | `/manager/msa-contract/:contractId/payment-holdbacks` |
| GET | `/manager/msa-contract/payment-holdbacks/:holdBackId` |
| POST | `/manager/msa-contract/:contractId/payment-savings` |
| GET | `/manager/msa-contract/:contractId/payment-savings` |
| GET | `/manager/msa-contract/payment-savings/:savingId` |
| GET | `/manager/msa-contract/:contractId/kpis` |
| GET | `/manager/msa-contract/:contractId/kpis/:kpiId` |
| POST | `/manager/msa-contract/:contractId/kpis/:kpiId` |
| GET | `/manager/msa-contract/:contractId/compliance` |
| POST | `/manager/msa-contract/:contractId/compliance/:type/:typeId/approve` |
| GET | `/manager/msa-contract/:contractId/changes/stats` |
| GET | `/manager/msa-contract/:contractId/changes` |
| GET | `/manager/msa-contract/:contractId/changes/:changeId` |
| POST | `/manager/msa-contract/:dataId/change/:type` |
| POST | `/manager/msa-contract/:contractId/changes/:changeId/approve` |
| GET | `/manager/msa-contract/:contractId/changes/:changeId/approve/status` |
| GET | `/manager/msa-contract/:contractId/changes/:changeId/approvers` |
| GET | `/manager/msa-contract/:contractId/claims/stats` |
| GET | `/manager/msa-contract/:contractId/claims` |
| GET | `/manager/msa-contract/:contractId/claims/:claimId` |
| GET | `/manager/msa-contract/:contractId/claims/:claimId/comments` |
| POST | `/manager/msa-contract/:contractId/claims/:claimId/comments` |
| POST | `/manager/msa-contract/:contractId/claims/:claimId/comments/:commentId/reply` |
| POST | `/manager/msa-contract/:contractId/claims/:claimId/approve` |
| GET | `/manager/msa-contract/:contractId/claims/:claimId/approve/status` |
| GET | `/manager/msa-contract/:contractId/claims/:claimId/approvers` |
| POST | `/manager/msa-contract/:contractId/claims/:claimId/approvers` |
| GET | `/manager/msa-contract/:contractId/rfi/stats` |
| POST | `/manager/msa-contract/:dataId/rfi` |
| POST | `/manager/msa-contract/:dataId/rfi/:rfiId/response` |
| GET | `/manager/msa-contract/:contractId/rfi` |
| GET | `/manager/msa-contract/:contractId/rfi/:rfiId` |
| GET | `/manager/msa-contract/:contractId/rfi/:rfiId/response` |
| GET | `/manager/msa-contract/:contractId/rfi/:rfiId/comment` |
| POST | `/manager/msa-contract/:contractId/rfi/:rfiId/comment` |
| POST | `/manager/msa-contract/:contractId/rfi/:rfiId/comment/:commentId/reply` |
| GET | `/manager/msa-contract/:contractId/invoice/stats` |
| GET | `/manager/msa-contract/:contractId/invoice` |
| GET | `/manager/msa-contract/:contractId/invoice/:invoiceId` |
| POST | `/manager/msa-contract/:contractId/amendments` |
| GET | `/manager/msa-contract/:contractId/amendments/:amendmentId` |
| POST | `/manager/msa-contract/:contractId/amendments/:amendmentId/approvers` |
| POST | `/manager/msa-contract/:contractId/amendments/:amendmentId/approve` |
| GET | `/manager/msa-contract/:contractId/clauses` |

---

## 9) Endpoint Catalog: Vendor

Base prefix: `/vendor`

### 9.1 Vendor Contract

Base prefix: `/vendor/contracts`

Includes:
- portfolio cards + activity dashboards
- contract list and detail
- compliance updates
- LEM/ratesheet create and update
- change, claim, RFI, NCR, report, invoice, amendment flows

See route source for complete list:
- `src/route/vendor/vendor.contract.route.ts`

### 9.2 Vendor MSA Contract

Base prefix: `/vendor/msa-contract`

Includes:
- stats, list, detail
- compliance updates
- claim, RFI, invoice, amendment, payment holdback/saving routes

See route source for complete list:
- `src/route/vendor/vendor.msaContract.route.ts`

---

## 10) Endpoint Catalog: User (View-Only)

Base prefix: `/user`

### 10.1 User Contract

Base prefix: `/user/contracts`

Read-focused routes:
- stats, list, detail
- change, claim, RFI, deliverable, report, invoice, NCR, LEM/ratesheet, compliance, amendment

See:
- `src/route/user/user.contract.route.ts`

### 10.2 User MSA Contract

Base prefix: `/user/msa-contract`

Read-focused routes for MSA:
- stats, list, detail
- change, claim, RFI, invoice
- payment holdbacks/savings
- compliance and amendment

See:
- `src/route/user/user.msaContract.route.ts`

---

## 11) Endpoint Catalog: Approver

Base prefix: `/approver`

### 11.1 Approver Contract

Base prefix: `/approver/contracts`

Includes approval actions for:
- contract-level approval
- change, claim, deliverable, invoice, amendment
- plus read endpoints for holdbacks/savings, RFI/NCR/reports/compliance

See:
- `src/route/approver/approver.contract.route.ts`

### 11.2 Approver MSA Contract

Base prefix: `/approver/msa-contract`

Includes equivalent approval and read flows for MSA contract lifecycle.

See:
- `src/route/approver/approver.msaContract.route.ts`

---

## 12) Endpoint Catalog: Collaboration

Base prefix: `/manager/collab`

| Method | Path | Description |
|---|---|---|
| GET | `/manager/collab/:doc/versions` | Get document version history |
| POST | `/manager/collab/:doc/versions/:versionId/revert` | Revert to a historical version |
| GET | `/manager/collab/metrics` | Collaboration metrics |
| POST | `/manager/collab/upload` | File upload for collaborative workflows |

WebSocket documentation is available in:
- `schemas.docs.yaml` (WebSocket API section)

---

## 13) Swagger/OpenAPI Source of Truth

Use Swagger for full operation-level details (schemas, examples, roles):

- UI: `/api/v1/dev/contract/docs`
- JSON: `/api/v1/dev/contract/docs.json`

Primary annotated route files:
- `src/route/manager/contract.routes.ts`
- `src/route/manager/msaContract.routes.ts`
- `src/route/vendor/vendor.contract.route.ts`
- `src/route/vendor/vendor.msaContract.route.ts`
- `src/route/user/user.contract.route.ts`
- `src/route/user/user.msaContract.route.ts`
- `src/route/approver/approver.contract.route.ts`
- `src/route/approver/approver.msaContract.route.ts`

---

## 14) Front-End Troubleshooting Checklist

- Verify token exists and starts with `Bearer`.
- Verify you are using correct role route prefix (`/manager`, `/vendor`, `/user`, `/approver`).
- Confirm path uses expected singular/plural style (`rfi` vs `rfis`, `claim` vs `claims`) for that actor group.
- Ensure required path IDs are populated before navigation.
- Send JSON `Content-Type` for non-multipart requests.
- Use defensive handling for both response shapes:
  - `{ status, message, data }`
  - `{ message, data }`
- Handle `429` with UI retry/backoff.

---

## Appendix: Common Request Examples

### A) List contracts (manager)

```bash
curl -X GET \
  "$API_BASE/manager/contracts?page=1&limit=10&status=active" \
  -H "Authorization: Bearer $TOKEN"
```

### B) Create contract (manager)

```bash
curl -X POST "$API_BASE/manager/contracts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bridge Inspection",
    "description": "Routine inspection",
    "category": "Infrastructure",
    "timezone": "America/Toronto",
    "contractType": "671c2f0d9f4e2b0012345678",
    "contractRelationship": "standalone",
    "rating": 8
  }'
```

### C) Approve claim (manager)

```bash
curl -X POST "$API_BASE/manager/contracts/CONTRACT_ID/claims/CLAIM_ID/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "approved", "comment": "Approved after review" }'
```

### D) Add comment

```bash
curl -X POST "$API_BASE/manager/contracts/CONTRACT_ID/claims/CLAIM_ID/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "content": "Please attach revised estimate." }'
```

### E) Upload file (collab)

```bash
curl -X POST "$API_BASE/manager/collab/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./document.pdf"
```

