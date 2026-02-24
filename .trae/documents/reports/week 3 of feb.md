**Weekly Changes Report**

- Dual‑Role Change Management
  - The Change Management tab now serves both vendors and contract managers in a single, consistent interface.
  - Vendors can create Change Requests, Directives, and Proposals; managers can also create Change Orders.
  - The “Create Change” button is visible for both roles, with behavior tailored to the current user type.
  - Shared stats, filters, tabs, and table display remain consistent for everyone.

- Payment Summary Alignment
  - Shared payment information (amounts, status, and dates) is always visible for all users.
  - Manager‑specific actions (such as updating savings or releasing holdback) remain available and unchanged in function.
  - Unified loading and empty states ensure a smoother experience across roles.

- File Upload Experience
  - Drag‑and‑drop uploads for change requests support common formats (PDF, DOC/DOCX, XLS/XLSX, ZIP, PNG, JPEG).
  - Files are uploaded on submission; clear indicators show upload readiness and progress.

- Design Consistency
  - UI updates match the Figma reference precisely (spacing, colors, typography, and component styling).
  - No layout changes beyond what the design specifies.

- Data and API Compliance
  - All data fetching and submission follow the documented API schemas.
  - Requests use the existing API layer and conventions; no direct low‑level HTTP calls or ad‑hoc data shapes.
  - Where documentation lacks schemas, those features were intentionally not implemented to avoid guessing.

- Reliability and Performance
  - Role‑aware caching and query keys reduce duplicate requests and keep views responsive.
  - Consistent loading states prevent flickers and confusing transitions when switching tabs or filters.

- Quality Checks
  - Static analysis (linting) ran successfully with no new errors in updated areas.
  - Role‑based query invalidation works as expected after submitting changes.

- User Impact
  - Vendors can initiate change workflows directly without switching views or roles.
  - Contract managers retain full functionality with clearer separation of shared vs. role‑specific actions.
  - Overall experience is more consistent, reducing training and support needs.