# Non-Technical Implementation Reports — Apr 15

## Project Manager (PM) Onboarding

### Overview
- A new onboarding experience was added specifically for a vendor’s Project Manager, matching the look and feel of the existing vendor onboarding flow.
- The PM onboarding is accessed through a secure invite link and guides the user to complete their registration.

### What Users Will See
- A dedicated “Project Manager Registration” screen with SwiftPro branding.
- A simple, single-page registration form (not multi-step).

### Registration Form Fields
- Name
- Email address (pre-filled from the invite link and not editable)
- Phone number
- Password
- Confirm password

### Invite Link Behavior
- The onboarding screen reads encrypted information from the invite link.
- If the link contains PM details (like email/name), those values are automatically filled into the form.
- The implementation supports multiple possible name/email field formats from the invite payload (e.g., `email`, `emailAddress`, `primaryEmail`, or `firstName + lastName`).

### Validation & User Feedback
- The form checks that required fields are provided and that passwords match.
- Clear messages are shown when:
  - The invite link is invalid or corrupted
  - The user misses required fields or enters invalid data
  - Registration fails due to a backend error
- On successful registration, the user is redirected to the login page.

### System Integration
- A new public route was added for PM onboarding: `/pm-onboarding/:encodedData`
- Submitting the PM onboarding form sends the registration details to: `/onboarding/pm-accept`

### Files Added/Updated
- Added: [PmOnboardingPage.tsx](file:///c:/Users/USER/Documents/GitHub/swifter/src/pages/OnboardingPage/PmOnboardingPage.tsx)
- Added: [PmOnboardingForm.tsx](file:///c:/Users/USER/Documents/GitHub/swifter/src/pages/OnboardingPage/components/PmOnboardingForm.tsx)
- Updated route config: [index.tsx](file:///c:/Users/USER/Documents/GitHub/swifter/src/routes/index.tsx#L104-L111)

---

## Amendment File Upload: File Size Fix
- Fixed the issue where uploaded amendment files were sending a “size” value in a text format like “6.78 KB”, which caused the backend to reject the request.
- Updated the amendment file upload flow so the file size is always sent as a proper number (in bytes), matching what the backend validation expects.
- Added a reusable helper that converts size text (KB/MB/GB/TB) into a numeric value, so this logic can be reused elsewhere without duplicating it.
- Ensured the system still has a safe fallback: if a converted size isn’t available, it uses the file’s actual size directly from the uploaded file.
- Result: the amendment submission should no longer fail due to the file size validation error.

---

## Analytics Tab Filters

### Summary
We improved the Analytics section of the Contract Details page so that the “YTD”, “90 days”, “60 days”, and “7 days” options work as real filters for each chart.

### What Was Added / Improved
- The time-range labels (“YTD”, “90 days”, “60 days”, “7 days”) in the Analytics tab are now clickable filter buttons instead of static text.
- Each chart has its own independent filter:
  - Changing the time range on the **Activities** chart only updates the Activities chart.
  - Changing the time range on the **Deliverable Summary** chart only updates the Deliverable Summary chart.
- The selected range is visually highlighted so users can clearly see which filter is active for each chart.

### How It Works (In Plain Terms)
- When a user clicks one of the filter options, the system requests updated data for that specific chart and refreshes it.
- The system uses the correct time-range values expected by the backend (for example: YTD, 90, 60, 7).

### Validation
- Automated tests were added to confirm:
  - The initial load uses “YTD”.
  - Clicking “90 days” updates only the Activities chart’s data request.
  - Clicking “7 days” updates only the Deliverable Summary chart’s data request.
  - The two charts remain independent (one does not trigger an update for the other).

---

## Project Manager Access

### Objective
- Ensure users with the **Project Manager** role can **only access the Contract module** (including MSA) and **Profile**, and cannot access other modules available to vendors or other roles.

### What Was Implemented

#### 1) New “Project Manager” role support
- The system now recognizes **Project Manager** as a supported user role, so it can be handled consistently across the app.

#### 2) Restricted menu for Project Managers
- When logged in as a Project Manager, the left-side menu shows only:
  - **Contract Management** (including **MSA**)
  - **Profile**
- Vendor-only items such as **Invitations** and other non-contract modules are not shown.

#### 3) Hard restriction on page access (not just hiding the menu)
- Even if a Project Manager manually types or opens a link to a restricted area (e.g., solicitation pages, vendor management, evaluations, etc.), the system automatically **redirects them back to Contract Management**.
- This ensures access control is enforced, not just “hidden” in the UI.

#### 4) Contract module behavior aligned for Project Managers
Within the Contract module only, Project Managers were set up to behave in the appropriate “vendor-like” way where required by the contract workflows:
- They can view and interact with contract content permitted in that module.
- Contract pages and contract tabs load correctly under this role.
- Contract actions that are intended for vendor-side participation inside contracts (e.g., applicable requests/submissions) are available where the system expects them.

#### 5) Internal consistency updates
- Supporting configurations were updated so the Project Manager role works cleanly across navigation, dashboards, and contract screens without breaking existing roles.

### Outcome
- **Project Managers can access only the Contract module (including MSA) and Profile.**
- **All other modules remain inaccessible**, including by direct URL access.
- Contract-related pages and actions function correctly under the Project Manager role.

---

## Executive Summary

### Overview
- This release focused on improving accuracy, clarity, and reliability in Contract Management workflows and reporting.
- The goal was to reduce user confusion, prevent incorrect data from being shown or saved, and ensure key actions are available to the right roles.

### Key Improvements Delivered
- **Clearer “Review & Publish” contract summary**
  - Fixed an issue where the final review screen could display internal system IDs instead of human-readable names for key fields like Contract Type, Category, Vendor, and Payment Term.
  - Result: stakeholders reviewing a contract see understandable labels, reducing errors and back-and-forth during approval.
- **More reliable contract editing (data retention on save)**
  - Improved how existing contract data is pre-filled and retained during the Edit Contract flow, especially for important linked fields (e.g., Business Division, Solicitation, Payment Term, Term Type, Vendor/Project references).
  - Result: users can edit a contract without losing previously selected values unintentionally.
- **Deliverables status accuracy**
  - Fixed deliverables so items that are not submitted no longer appear as “Under Review” by default and instead show “Pending.”
  - Result: deliverables dashboards and tables now reflect the true state of work, reducing misinterpretation.
- **Invoice action availability for Contract Managers**
  - Fixed a scenario where Contract Managers could not see “Approve” / “Reject” invoice actions even when an invoice was pending, due to inconsistent status fields coming from the system.
  - Result: Contract Managers can act on pending invoices as expected, reducing processing delays.
- **Improved dashboard number readability**
  - Updated high-value financial metrics (e.g., Total Contract Value) to display using compact notation (e.g., “12.5M” instead of “12500000”).
  - Result: executive dashboards are easier to read at a glance.

### Quality Assurance
- Added automated regression tests for the above areas to prevent the same issues from reappearing in future releases.
- Verified the critical flows with Playwright end-to-end tests specific to Contract Management roles and scenarios.

### Notes / Known Repository Health Items
- The codebase currently reports broader lint/build issues unrelated to these specific fixes (existing technical debt). These do not invalidate the implemented functional fixes but should be tracked separately as a stabilization effort.
