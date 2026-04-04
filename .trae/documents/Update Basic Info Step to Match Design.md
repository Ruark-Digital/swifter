I will update `Step1BasicInfo.tsx` to match the provided Figma designs (`Frame 36893` and `Empty State`).

### 1. Reorder and Refactor Fields

I will rearrange and update the form fields in `src/pages/ContractManagementPage/components/Step1BasicInfo.tsx` to align with the visual layout:

* **Contract Name**: Stays at the top.

* **Contract Relationship**: This logic needs to be enhanced to match the "Link to MSA" and "Link to Project & MSA" flows shown in the screenshots.

  * **New Logic**: The design shows dynamic fields based on relationship type.

  * If "Link to Project": Show "Select Project" and "Select Awarded Solicitation".

  * If "Link to MSA": Show "Select MSA Category" and "Select MSA".

  * If "Link to Project & MSA": Show "Select MSA Category", "Select MSA", "Select Project", and "Select Awarded Solicitation".

* **Row 1 (Two Columns)**: "Contract Type" and "Category".

* **Contract ID/Number**: Full width below the 2-column rows.

* **Complexity Rating**: Stays as implemented.

* **Description**: Stays at the bottom.

### 2. Update Field Labels & Placeholders

I will ensure all labels and placeholders match the screenshots (e.g., "Select Solicititaion" -> "Select Solicitation").

### 3. Styling Adjustments

I will ensure the layout uses the grid system correctly to match the 2-column sections shown in the design.

This plan addresses the discrepancies between the current implementation and the visual requirements.
