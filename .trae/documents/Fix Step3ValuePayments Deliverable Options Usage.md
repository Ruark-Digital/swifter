I will fix the unused `deliverableOptions` error in `Step3ValuePayments.tsx` by correctly implementing the deliverables dropdown within the milestones loop.

### 1. Update `Step3ValuePayments.tsx`
I will modify `src/pages/ContractManagementPage/components/Step3ValuePayments.tsx` to:
*   **Remove** the standalone `selectedDeliverable` field which is no longer needed.
*   **Insert** the `Forger` component for `milestones.${index}.deliverable` inside the mapping loop, passing `options={deliverableOptions}`.
*   **Update** the `milestones.${index}.name` field to include the `label="Milestone Name"` prop.

This will ensure `deliverableOptions` is used, resolving the build error, and completing the UI requirement to have deliverables selectable per milestone.
