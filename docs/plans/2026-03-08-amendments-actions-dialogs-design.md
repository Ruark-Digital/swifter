# Amendments actions & dialogs (Vendor + Manager)

## Scope

Implement role-based actions inside the Amendment Details sheet:

- Vendor: “Reject Amendment” and “Accept Amendment” bottom actions with dialogs matching provided designs and calling vendor status API.
- Manager: “Assign Approval” bottom action opening the “Send for Approval” dialog matching provided designs, sourcing personnel from the personnel API, and calling manager “add approvers” API.

## UI/UX requirements (from Figma screenshots)

### Vendor bottom actions

- Render two sticky bottom buttons in the amendment details sheet for vendor users:
  - Left: “Reject Amendment” (outline/neutral).
  - Right: “Accept Amendment” (primary).

### Vendor dialogs

- Accept Amendment dialog:
  - Title: “Submission Rejected!” (design text) replaced with acceptance copy? Implementation will match screenshot_6354_60794’s layout and button styling, while the action will be “accepted”.
  - Buttons: “Close” and “View Details”.
  - Triggered by the vendor “Accept Amendment” button.

- Reject Amendment dialog:
  - Title: “Reject Review”.
  - Prompt: “Why are you rejecting this deliverable?”
  - Textarea placeholder: “Duration”.
  - Buttons: “Back” and “Reject Review”.
  - Triggered by vendor “Reject Amendment” button.

Note: Reject reason input is captured in UI but not sent to API because the documented schema for the vendor status endpoint only accepts `status`.

### Manager bottom action

- Render a bottom “Assign Approval” button in the amendment details sheet for manager users (only when “Action needed” section is shown in the design).
- Clicking opens the “Send for Approval” dialog.

### Assign Approval dialog (Manager)

Two states:

- Empty state: shows header, group select, empty table container, and footer buttons.
- Populated state: shows table rows, assigned approvers chips section, and footer buttons.

Data source:

- Personnel list is loaded from the personnel API.

Group select:

- Rendered as per design but treated as UI-only until a group-backed schema is available.

Assigned approvers:

- Maintain a selection of user IDs.
- Render chips with remove icon, and allow removing from selection.

## Data sources & APIs

### Vendor actions

- Update vendor status:
  - Endpoint: `PATCH /contract/vendor/contracts/{contractId}/amendment/{amendmentId}/status` (UI uses the app’s `/contract/vendor/...` route prefix consistent with existing list basePath).
  - Body: `{ "status": "accepted" | "rejected" }`

### Manager actions

- Load personnel:
  - Endpoint: `GET /contract/manager/personnel`
  - Response: list of personnel users (the codebase already consumes this endpoint).

- Assign approvers to amendment:
  - Endpoint: `POST /manager/contracts/{contractId}/amendments/{amendmentId}/approvers`
  - Body (`AddApproversDTO`): `{ "userIds": string[] }`

Implementation will use the app’s `/contract/manager/contracts/...` route prefix consistent with other manager contract routes.

## Data refresh

After vendor accept/reject or manager assign approvers:

- Invalidate/refetch the amendments list and stats queries for the current `contractId` and `basePath`.
- Refetch the open amendment details query so the sheet UI updates immediately.

## Out of scope

- Persisting reject reason for amendments (no documented API field).
- Real “approver group” semantics for the assign approval dialog (no documented schema).

