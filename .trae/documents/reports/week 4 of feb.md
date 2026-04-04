**Weekly Report**

- Implemented approver access check on Contract Details
  - Added approve-status fetch before showing Approve/Reject actions
  - Buttons appear only when the approver is authorized and status is pending
  - After approval/rejection, the approve-status is re-fetched to reflect changes immediately

- Strengthened role-based access on Contract Management
  - Company Admin set to read-only for list interactions and row actions
  - Create Contracts hidden for Company Admin
  - Export remains available to Company Admin as a non-destructive action
  - Approver and View-Only behaviors remain consistent

- Improved user experience around contract approvals
  - Clear gating: actions only visible when relevant and permitted
  - Reduced confusion by hiding actions under “N/A” authorization states
  - Immediate feedback loop via status refresh after actions

**Impact**
- Reduces unauthorized actions and errors by enforcing role permissions
- Creates a predictable approval experience with accurate, up-to-date status
- Aligns UI behavior with documented approval workflows

**Open Items**
- Broader read-only treatment for Company Admin inside contract detail sub-features (if desired)
- Consistent status string handling across all approval subflows (changes, invoices, lems, etc.) if required

**Next Week (Proposed)**
- Extend read-only rules to other tabs/components for Company Admin where edits exist
- Add visual indicators explaining why actions are hidden (e.g., “No approval permission”) for clarity
- Instrument analytics to track approval interactions and visibility conditions

**Risks/Dependencies**
- Backend status format alignment is essential; ensure approve-status returns the expected values
- Any change to role definitions should be mirrored in UI gating to avoid mismatch