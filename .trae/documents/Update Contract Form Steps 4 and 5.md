I will implement the requested changes to the "Create Contract" form, focusing on Step 4 (Deliverables) and Step 5 (Value & Payments).

### 1. Update Schema (`CreateContractSheet.tsx`)
I will update the `yup` schema and `defaultValues` to include a `deliverable` field within the `milestones` array. This allows linking a milestone to a specific deliverable.

### 2. Update Step 4 (`Step5Deliverables.tsx`)
I will modify the "Remove Deliverable" button to only appear for items after the first one (`index > 0`), ensuring at least one deliverable input always remains.

### 3. Update Step 5 (`Step3ValuePayments.tsx`)
I will refactor the milestones section:
*   **Populate Options**: Use `useWatch` to retrieve the list of `deliverables` created in Step 4 and map them to select options.
*   **Milestone Name**: Ensure the milestone name input has a visible label ("Milestone Name").
*   **Select Deliverable**:
    *   Remove the standalone "Select Deliverable" field.
    *   Add a "Select Deliverable" field *inside* the milestone loop.
    *   Position it below the "Amount" and "Due Date" fields as requested.
