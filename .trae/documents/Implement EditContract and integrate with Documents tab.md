**Overview**
- Add a reusable EditContract component that mirrors CreateContractSheet’s multi-step Forge form, validation, and submission, but pre-fills from contract detail and updates via PUT.
- Wire it into DocumentsTabContent with local state (editingContractId) and conditional rendering so clicking Edit Contract opens instantly without page reload.
- Extend ContractDetailPage to pass contractId to DocumentsTabContent.
- Add tests using Playwright to mock API, simulate edits, assert request payload, and verify toast/onUpdated behavior.

**Code Changes**
- Create components/EditContract.tsx under pages/contractmanagementpage/components.
  - Imports: Dialog primitives, Button, Forge/useForge, yupResolver, yup, react-query hooks, axios wrapper (getRequest/putRequest), useToastHandler, useUserQueryKey, existing step components (Step1BasicInfo, Step2ContractTeam, Step3ValuePayments, Step4Timeline, Step5Deliverables, Step6ComplianceSecurity, Step4Form, Step7ApprovalLevel, Step6ReviewPublish).
  - Reuse the same schema and defaultValues as CreateContractSheet (copy or refactor into a shared helper if available); set mode="onChange" to match validation behavior.
  - Fetch full contract by contractId using contractManagerApi.getContract; map ContractDetail → CreateContractFormData and reset the form when data loads.
  - Build update payload using the same transformation logic as CreateContractSheet (prefer extracting shared helpers to avoid duplication, otherwise mirror behavior exactly): dates formatting, numbers normalization, files mapping, approvers and insurance structures, contractFormationStage, relationship mapping, etc.
  - useMutation with putRequest to /contract/manager/contracts/:contractId; on success show toast "Contract updated successfully", call onUpdated(result.data.data), and close the dialog.
  - Keep DialogContent sizing, headings, step counter, and navigation identical; change DialogTitle to "Edit Contract" and the primary action to "Save Changes".
  - Implement keyboard shortcuts: Ctrl+S triggers save; Escape closes.
  - Preserve accessibility: aria-labels on action buttons; rely on Dialog focus trapping.

- Update layouts/DocumentsTabContent.tsx
  - Add Props contractId?: string and onUpdated?: (contract: ContractDetail) => void.
  - Local state: editingContractId: string | null.
  - Replace the Edit Contract button with logic: on click set editingContractId = contractId; conditionally render <EditContract open onOpenChange, contractId={editingContractId!} onUpdated={...} /> when editingContractId !== null.
  - On onUpdated: silently invalidate contract detail query (useQueryClient.invalidateQueries for ["contract-manager-contracts"]) and show toast "Contract updated successfully"; set editingContractId back to null.
  - Export the Edit component as a named export (export { EditContract } from components path) and also export it from this layout if needed per requirement.

- Update ContractDetailPage.tsx
  - Pass contractId to DocumentsTabContent: <DocumentsTabContent files={contract.files} contractId={contract._id} />.

**Form Data Mapping**
- Create a mapping function from ContractDetail → CreateContractFormData:
  - Basic info: title → name, description, category, businessDivision, contractType → type (id), contractRelationship → relationship, project/ms a mapping.
  - Team: vendorPersonnel/internalTeam → personnel/internalTeamMeta shapes expected by Forge form.
  - Timeline & dates: startDate, endDate, duration, formation stage dates.
  - Payments: contractValue, contingency, holdBack, payment terms/structure; milestones/deliverables mapping.
  - Documents: files → documents with name/url/type/size.
  - Approval groups: derive approvers list if available to pre-fill groups (if not present, leave defaults).

**API Usage**
- Use contractManagerApi.getContract(contractId) via useQuery with useUserQueryKey.
- For update, use putRequest({ url: `/contract/manager/contracts/${contractId}`, payload }) without calling axiosInstance directly.
- Do not send undefined fields; remove them before PUT to match CreateContractSheet behavior.

**Error Handling**
- Mirror CreateContractSheet’s toasts: onError show toastHandler.error with the ApiResponseError.
- If network fails or concurrent edit conflict, keep dialog open, show red inline banner (use the same banner styling used elsewhere in detail page), and provide a "Retry" button that re-runs mutation.

**Keyboard & Accessibility**
- Add keydown listener while dialog is open: Ctrl+S → submit current values; Escape → close. Ensure buttons have aria-labels. Dialog handles focus-trap.

**Tests**
- Add Playwright spec under src/pages/ContractManagementPage/__tests__/edit-contract.spec.ts:
  - Seed auth.
  - Route GET /contract/manager/contracts/:id to return a full ContractDetail fixture.
  - Route PUT /contract/manager/contracts/:id: capture request body, assert normalized payload fields (title, dates, payment structures, files etc.), then respond with updated contract object.
  - Navigate to /dashboard/contract-management/:id, open Documents tab, click Edit Contract, change a field (e.g., title), press Ctrl+S; expect toast "Contract updated successfully" and dialog closed; optionally assert query invalidation by checking updated title appears.

**Quality & Conventions**
- Follow existing component structure, import paths, Tailwind classes, and react-query usage.
- No direct axiosInstance usage; only getRequest/putRequest.
- Avoid duplicate transformation code by extracting common helpers where practical; otherwise maintain parity to prevent warnings.
- Type-check against existing types.ts ContractDetail, infer CreateContractFormData from schema.

Please confirm this plan. Once approved, I will implement the component, integration, and tests, and verify everything passes lint/types and existing hooks without warnings.