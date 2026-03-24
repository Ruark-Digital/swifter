## Problem statement

The Create MSA wizard currently does not submit to the backend and uses a mix of hardcoded options and non-API-compatible form values (notably documents). This causes Create MSA to be a UI-only flow. The goal is to integrate Create MSA with documented APIs, ensure only valid payload fields are sent, and implement dependent field visibility so the UI matches expected business logic without changing layout.

## Architecture overview

The Create MSA wizard remains a single Forge form owned by the CreateMSADialog component. Read-only metadata required for select fields is fetched via React Query using the existing /api abstraction (getRequest). Submission is handled by a React Query mutation (postRequest) that posts a pruned payload (empty values omitted) to the documented create endpoint. Field dependency logic is implemented within step components using react-hook-form watchers so visibility reacts to controlling values in real time.

## Component breakdown

Modified:
- CreateMSADialog: add mutation, build payload, prune empty values, handle draft vs publish, reset on success, invalidate MSA list and stats queries.
- Step 1 (Basic Info): replace hardcoded MSA type options with API-driven contract type options; keep Business Division from existing API; placeholders updated.
- Step 3 (Timeline): replace hardcoded term type options with API-driven term types; placeholders updated.
- Step 5 (Value & Payments): replace hardcoded payment term options with API-driven payment terms; milestones visible only when paymentStructure === "milestone".
- Step 6 (Compliance & Security): security fields visible only when contractSecurity === "yes".
- Step 7 (Documents): upload documents so the form holds API-ready file objects ({name,url,type,size}) rather than raw File objects.

Unchanged:
- Wizard step layout and visual structure.
- Step navigation controls and validation model (incremental validation can be extended only where required by the create endpoint).

## Data & state model

Form state:
- CreateMsaFormData remains the single source of truth and is manipulated via Forge/Forger.

Meta state:
- Contract types: fetched with getRequest and mapped to select options.
- Payment terms: fetched with getRequest and mapped to select options.
- Term types: fetched with getRequest and mapped to select options.
- Personnel/approvers: already fetched in Step 8.

Payload rules:
- The payload is constructed from CreateMsaFormData in CreateMSADialog.
- Empty values are removed recursively before submit: undefined, null, empty strings, whitespace-only strings, empty arrays, empty objects.
- paymentStructure !== "milestone" forces milestone payload omission regardless of previous values.
- contractSecurity !== "yes" forces insurance/security payload omission regardless of previous values.

## Error handling & edge cases

- Metadata fetch failure: form renders, but submit is blocked if required API-driven options are unavailable for required fields.
- Upload failure: failed uploads are not included in payload; the user receives an error and can retry/remove files.
- Draft vs publish: both use the same payload builder; status differs. Validation is kept consistent with the documented create schema.
- Outside-close behavior is not changed as part of this feature unless explicitly requested.

## Testing strategy

- Unit-level: add payload builder tests to ensure pruning and conditional omission rules work as intended.
- Playwright: add a Create MSA happy-path test that asserts the POST body does not contain empty keys and that dependent sections show/hide correctly.
- Regression: ensure MSA list and stats tests continue to pass.

## Out of scope

- Edit MSA flows.
- Backend schema or endpoint changes.
- UI redesigns beyond placeholder text updates and dependent field visibility.

