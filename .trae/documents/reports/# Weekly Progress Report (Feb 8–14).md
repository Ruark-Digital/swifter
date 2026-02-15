**Report**

**Key Deliverables**
- Added an “Edit Contract” experience that opens in a side panel, allowing managers to update contract details without leaving the page.
- Made the Edit option available from both the Documents tab and the Overview tab for quick access in common workflows.
- Ensured the edit panel pre-fills with the current contract information, so users can review and adjust what’s already there.

**User Experience Improvements**
- Kept the look and feel consistent with existing create flows, including step-by-step guidance and clear action buttons.
- Added convenient shortcuts: Ctrl+S to save changes and Escape to cancel, improving efficiency for power users.
- Provided clear success feedback (“Contract updated successfully”) and silent refresh of the contract details.

**Reliability & Testing**
- Introduced automated end-to-end checks that simulate editing a contract, confirm the right information is sent, and verify that the interface responds correctly.
- Implemented robust error handling with a visible message and a “Retry” option, helping users recover quickly from temporary issues.

**Standards & Compliance**
- Followed existing project rules for how the app talks to the backend and how forms are managed.
- Kept accessibility behaviors such as focus management and descriptive labels intact.
- Ensured changes pass type checks and linting, producing no new warnings.

**Outcome**
- Contract editing is now streamlined and accessible from key places in the contract details view, with a reliable and consistent experience supported by automated checks.


Project module:
	Creation: Create a new project
	View: View all project and a single project
	Update: Update project status

Contract module:
	Creation: Create new contract based on project, standalone and msa project
	View: View created contract, filtering and single contract view

Contract manager
Setting up change for vendor and managers
Setting up claim for managers
Setting up change/claim comments
Setting up LEM



Vendor/User and Approver
Contract Details
Contract change
Contract claim
Invoice
Lem

Contract creation update- accommodate the latest fix based on ui design
Amendment implementation, for vendor, approvers, users and managers

Contracts Rfi for contractor, vendor, users and approver
Approver on contract manager tab


Actionlog for contract manager
Contract ncr for contractor, contract manager, approver and users
Contract deliverable for contract manager
