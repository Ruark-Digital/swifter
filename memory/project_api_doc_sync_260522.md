---
name: project_api_doc_sync_260522
description: API docs sync 2026-05-22 — swagger.json replaced with docs.json, MD updated with 9 new/changed endpoints
metadata:
  type: project
---

On 2026-05-22 the upstream `docs.json` (740KB) replaced the old `swagger.json` (727KB) and `docs/API_DOCUMENTATION_PHASE_2.md` was updated to match.

**Why:** Backend shipped new routes and one path fix in v2.3.0 but the docs were stale.

**Changes applied:**

### Path fix
- `GET /manager/contracts/invoice/{invoiceId}` → `GET /manager/contracts/{contractId}/invoice/{invoiceId}` (section 8)

### New personnel endpoints (one per role prefix)
- `GET /manager/msa-contracts/{contractId}/personnel` (section 5)
- `GET /approver/msa-contracts/{contractId}/personnel` (section 23)
- `GET /vendor/msa-contracts/{contractId}/personnel` (section 26)
- `GET /user/contracts/{contractId}/personnel` — also fixed singular→plural typo from `/user/contract/` (section 29)
- `GET /user/msa-contracts/{contractId}/personnel` (section 29)

### New Contract Export section (section 31)
- `GET /contract-export/{contractId}/entities` — returns entity keys that have data
- `POST /contract-export/{contractId}/download` — streams PDF or DOCX; body: `{ exportType, type, entity[] }`
- Valid `entity` keys: `invoice`, `change`, `amendment`, `approvers`, `complaince` (sic), `deliverable`, `kpi`, `lem`, `rfi`, `ncr`, `claim`, `clause`

### New File Utilities section (section 32)
- `GET /file/versions/{docName}` — version history for a stored file

### Schema change (not in MD — file-comment only)
- `POST /file-comment/{fileId}` body gained a new optional `location` field

**How to apply:** When generating or checking contract-related code that calls invoice detail or personnel endpoints, use the corrected paths above.
