# SwiftPro eProcurement Portal — QA Contract

**Platform:** SwiftPro Web Application (React + Vite)
**Dev Server:** `http://localhost:5173`
**QA Contract Version:** 2.1.0
**Last Updated:** 2026-04-30

---

## 1. Auth Flow

### Login Process
1. Navigate to `http://localhost:5173`
2. If redirected to `/login`, use credentials from Section 2
3. Fill `input[name=email]` and `input[name=password]`
4. Click `button[type=submit]`
5. Expect redirect to `/dashboard` on success

### Login Form Validation
- **Email field:** `input[name=email]` — required, must be valid email format
- **Password field:** `input[name=password]` — required, minimum 1 character
- **Submit button:** `button[type=submit]`

### Post-Login Navigation
- Successful login redirects to `/dashboard`
- Failed login shows error message (verify `[role=alert]` or `.text-error`)

---

## 2. Test Credentials

| User Type | Email | Password | Accessible Pages (Role + Module Driven) |
|-----------|-------|----------|----------------------------------------|
| **Super Admin** | admin@swiftpro.com | @swift_alg | Companies, Subscription, Admin Management, Communication Management, System Log, Portal Settings, Profile, Dashboard |
| **Company Admin** | adediran.dbs@gmail.com | password | Solicitation Management, Contract Management, MSA, Business Divisions, User Management, Vendor Management, Evaluation, Profile, Dashboard |
| **Procurement Lead** | adediran.dbs+pl@gmail.com | password | Solicitation Management, Evaluation Management, Projects, Contract Management, MSA, Vendor Management, Profile, Dashboard |
| **Procurement Lead 2** | adediran.dbs+pl2@gmail.com | password | Solicitation Management, Evaluation Management, Projects, Contract Management, MSA, Vendor Management, Profile, Dashboard |
| **Evaluator** | adediran.dbs+ev1@gmail.com | password | My Evaluation, Profile, Dashboard |
| **Contract Manager** | adediran.dbs+cm@gmail.com | password | Projects, Contract Management, MSA, Vendor Management, Profile, Dashboard |
| **Project Manager** | adediran.dbs+pm@gmail.com | password | Contract Management, MSA, Profile |
| **Vendor 1 (Alabian Academy)** | shsimag079@ingam.top | password | Invitations, Solicitation Management, Contract Management, MSA, Profile, Dashboard |
| **Vendor 2 (Wisdom Software Agency)** | vopahepet@2200freefonts.com | password | Invitations, Solicitation Management, Contract Management, MSA, Profile, Dashboard |
| **Vendor 3 (Zentrova Technology)** | s0vtuqct7t@wnbaldwy.com | password | Invitations, Solicitation Management, Contract Management, MSA, Profile, Dashboard |
| **Approver 1** | adediran.dbs+approver@gmail.com | password | Contract Management, MSA, Profile, Dashboard |
| **Approver 2** | adediran.dbs+apr@gmail.com | password | Contract Management, MSA, Profile, Dashboard |
| **View User** | adexdsamson@gmail.com | password | Contract Management, MSA, Profile |

---

## 3. Role-Based Access Control

**Important:** Company creation is restricted to Super Admin users only. The `useUserRole` hook exposes all role-based permissions listed below.

### Permission Definitions

| Permission | Description |
|------------|-------------|
| `canManageUsers` | Can manage users (Company Admin, Super Admin) |
| `canManageCompanies` | Can create/delete companies (Super Admin only) |
| `canEvaluate` | Can perform evaluations (Evaluator, Company Admin, Super Admin) |
| `canSubmitProposals` | Can submit vendor proposals (Vendor only) |
| `canManageSolicitations` | Can manage solicitations (Procurement, Company Admin, Super Admin) |
| `isAdmin` | Has admin privileges (Company Admin, Super Admin) |
| `isManager` | Is a manager role (Contract Manager, Procurement) |
| `isEvaluator` | Is an Evaluator role |
| `isVendor` | Is a Vendor role |
| `isApprover` | Is an Approver role |
| `isProjectManager` | Is a Project Manager role |
| `isViewOnly` | Has view-only access |
| `isProcurement` | Is a Procurement role |
| `isSuperAdmin` | Is a Super Admin |
| `isCompanyAdmin` | Is a Company Admin |

### Role Permissions Matrix

| Role | canManageUsers | canManageCompanies | canEvaluate | canSubmitProposals | canManageSolicitations | isAdmin |
|------|---------------|-------------------|-------------|-------------------|----------------------|---------|
| Super Admin | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Company Admin | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Contract Manager | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| Procurement Lead | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No |
| Evaluator | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Vendor | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| Approver | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| View User | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

### Role Type Flags

| Role | isSuperAdmin | isCompanyAdmin | isAdmin | isManager | isEvaluator | isVendor | isApprover | isProjectManager | isProcurement | isViewOnly |
|------|-------------|---------------|---------|-----------|-------------|----------|------------|-----------------|--------------|------------|
| Super Admin | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Company Admin | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Contract Manager | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Procurement Lead | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Evaluator | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vendor | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approver | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View User | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 4. Navigation Structure

### Sidebar Navigation (Role-Based)

The sidebar uses `getNavigationForRole(role, currentPath, modules)` from `src/lib/navigation.ts`. Navigation items are conditionally shown based on user role and module flags.

**Super Admin Navigation:**
```
├── Dashboard (/)
├── Companies (/dashboard/companies) — Super Admin only
├── Subscription (/dashboard/subscription)
├── Admin Management (/dashboard/admin-management)
├── Communication Management (/dashboard/communication-management)
├── System Log (/dashboard/system-log)
├── Portal Settings (/dashboard/portal-settings)
├── Profile (/dashboard/profile)
```

**Company Admin Navigation:**
```
├── Dashboard
├── Solicitation Management
│   ├── All Solicitations
│   ├── Draft Solicitations
│   └── My Solicitations
├── Contract Management
├── MSA
├── Business Divisions
├── User Management
├── Vendor Management
├── Evaluation
├── Profile
```

**Contract Manager Navigation:**
```
├── Dashboard
├── Projects
├── Contract Management
├── MSA
├── Vendor Management
├── Profile
```

**Procurement Lead Navigation:**
```
├── Dashboard
├── Solicitation Management
│   ├── All Solicitations
│   ├── Draft Solicitations
│   └── My Solicitations
├── Evaluation Management
├── Projects
├── Contract Management
├── MSA
├── Vendor Management
├── Profile
```

**Evaluator Navigation:**
```
├── Dashboard
├── My Evaluation
├── Profile
```

**Vendor Navigation:**
```
├── Dashboard
├── Invitations
├── Solicitation Management
├── Contract Management
├── MSA
├── Profile
```

**Approver Navigation:**
```
├── Dashboard
├── Contract Management
├── MSA
├── Profile
```

**View User Navigation:**
```
├── Dashboard
├── Contract Management
├── MSA
├── Profile
```

### Top Navigation
- Profile dropdown (top-right): User profile, role badge, logout
- Breadcrumb navigation on inner pages

---

## 5. Feature Access Rules

| Feature / Screen | Roles | Notes |
|-----------------|-------|-------|
| Dashboard | All authenticated | Auto-redirect after login |
| Companies List | Super Admin only | Accessed via sidebar |
| Create Company | Super Admin only | From Companies page |
| Solicitation Management | Procurement, Company Admin, Super Admin | Full access |
| Contract Management | Varies by role | Contract Manager, Approver, Vendor, Project Manager, Company Admin, Super Admin |
| MSA | Varies by role | All roles except View User |
| User Management | Company Admin, Super Admin | Full access |
| Vendor Management | Company Admin, Contract Manager, Procurement Lead | Role-based access |
| Evaluation | Evaluator, Company Admin, Super Admin | canEvaluate permission |
| Projects | Contract Manager, Procurement Lead, Project Manager | Role-based access |
| Business Divisions | Company Admin, Super Admin | Full access |
| Admin Management | Super Admin only | System administration |
| Portal Settings | Super Admin only | System configuration |
| System Log | Super Admin only | Audit logging |
| Communication Management | Super Admin only | System communications |
| Subscription | Super Admin only | Subscription management |

---

## 6. Known UI Element Identifiers

### Login Page
| Element | Selector |
|---------|----------|
| Email input | `input[name=email]` |
| Password input | `input[name=password]` |
| Submit button | `button[type=submit]` |
| Error message | `[role=alert]`, `.text-error` |

### Dashboard
| Element | Selector |
|---------|----------|
| Dashboard cards | `.card`, `[role=button]` |
| Sidebar toggle | `button[aria-label="Toggle sidebar"]` |
| Sidebar links | `nav a`, `[data-sidebar-link]` |

### Generic List Pages
| Element | Selector |
|---------|----------|
| Add/Create button | `button:has-text("Add")`, `button:has-text("Create")` |
| Search input | `input[placeholder*="Search"]`, `input[type="search"]` |
| Table rows | `table tbody tr`, `[role="row"]` |
| Pagination | `[role=navigation] button` |

### Forms
| Element | Selector |
|---------|----------|
| Text input | `input[name={fieldName}]`, `input[id={fieldId}]` |
| Select dropdown | `select[name={fieldName}]` |
| Checkbox | `input[type=checkbox][name={fieldName}]` |
| Submit button | `button[type=submit]` |
| Cancel button | `button[type=button]:has-text("Cancel")` |

### Dialogs/Modals
| Element | Selector |
|---------|----------|
| Dialog container | `[role=dialog]`, `.dialog` |
| Close button | `button[aria-label="Close"]`, `.close-btn` |

---

## 7. Browser Testing Setup

### Prerequisites
1. Vite dev server must be running on `http://localhost:5173`
2. Backend API must be accessible at configured port
3. Database should be seeded with test data

### Test Session Flow
1. Open browser at `http://localhost:5173`
2. If login page → use appropriate credentials from Section 2
3. Navigate via sidebar/UI elements only (no direct URL entry except for initial navigation)
4. Perform functional tests
5. Check console for JS errors
6. Check network for failed requests

### Switching User Types (Critical)
Use this process whenever verifying role-based UI/action differences.

1. Logout via the Profile menu (top-right) if available
2. If logout is unavailable/stuck: clear local storage keys `auth` and `persist:root`, then refresh
3. Login as the next user type (Section 2)
4. Confirm the role label matches the logged-in user (top-right header)

### Selector Priority (Most to Least Preferred)
1. ARIA role: `getByRole('button', { name: 'Submit' })`
2. Label: `getByLabel('Email')`
3. Text: `getByText('Add Expense')`
4. Test ID: `getByTestId('submit-btn')`
5. CSS: `button[type=submit]` — last resort only

---

## 8. Cross-User Testing Process (Role Regression)

Run this checklist across user types to validate permissions, navigation, and action gating.

### A. Baseline Checks (All Roles)
1. Login succeeds and redirects to `/dashboard`
2. Sidebar shows only allowed modules for the role (Section 4)
3. Profile header displays correct role label
4. No console errors and no failed network requests during basic navigation

### B. Contract Compliance & Security Workflow (Contract)
This validates the Compliance & Security tab workflow across Contract Manager (CM), Vendor, Project Manager (PM), Approver, and View User.

**Key Rules**
- Policy and Security are gated separately.
- Vendor/PM can submit each category only when its status is `pending` or `rejected`.
- After a submit, the category is locked until CM approves or rejects.
- Only `contract_manager` can approve/reject. Approver role should not have approve/reject controls here.

**Contract Manager (CM)**
1. Login as Contract Manager
2. Navigate: Sidebar → Contract Management → open any contract detail
3. Go to `Compliance & Security` tab
4. Confirm `Approve` and `Reject` are visible
5. Switch between `Insurance Coverage` (Policy) and `Contract Security` (Security)
6. Approve or reject each category and confirm UI updates after refresh/reload

**Vendor**
1. Login as Vendor
2. Navigate: Sidebar → Contract Management → open an assigned contract detail
3. Go to `Compliance & Security` tab
4. For each category (Policy/Security):
   - If status is `pending` or `rejected`, confirm the relevant `Submit Policies` / `Submit Security` button is visible
   - If status is `submitted` or `approved`, confirm the submit button is not visible
5. Submit a category and confirm that category’s submit button is no longer visible after refresh/reload
6. If CM rejects the category, confirm Vendor can submit again (resubmit-after-reject)

**Project Manager (PM)**
1. Login as Project Manager
2. Navigate to the same contract detail → `Compliance & Security` tab
3. Confirm PM follows the same submit rules as Vendor for Policy and Security

**Approver**
1. Login as Approver
2. Navigate: Sidebar → Contract Management → open the same contract detail
3. Go to `Compliance & Security` tab
4. Confirm `Approve` / `Reject` are not visible

**View User**
1. Login as View User
2. Navigate: Sidebar → Contract Management → open any contract detail
3. Go to `Compliance & Security` tab
4. Confirm submit and approve/reject actions are not visible

### B. Contract Management + Amendments Workflow (Contract vs MSA)
This validates the amendment workflow across Contract Manager, Vendor/PM, and Approver.

**Contract Manager**
1. Navigate: Sidebar → Contract Management
2. Open any contract detail
3. Go to `Amendments` tab
4. Create an amendment (if available)
5. Open the amendment detail sheet (`View`)
6. Confirm `Assign Approval` is only visible when:
   - Vendor/PM has accepted the amendment
   - Amendment impact includes time (e.g., `time` or `time_cost`)

**Vendor**
1. Navigate: Sidebar → Contract Management
2. Open an assigned contract detail
3. Go to `Amendments` tab → open amendment detail (`View`)
4. Confirm `Accept Amendment` / `Reject Amendment` are visible when vendor status is pending
5. Accept or reject and confirm status updates in the detail sheet

**Project Manager**
1. Navigate: Sidebar → Contract Management or MSA (depending on assignment)
2. Open contract/MSA detail → `Amendments` tab → open amendment detail (`View`)
3. Confirm `Accept Amendment` / `Reject Amendment` are available (same behavior as Vendor)

**Approver**
1. Navigate: Sidebar → Contract Management or MSA
2. Open contract/MSA detail → `Amendments` tab → open amendment detail (`View`)
3. Confirm `Approve` / `Reject` are only visible when:
   - The amendment has been assigned to approvers
   - The approver is eligible (approve status check passes)

**View User**
1. Navigate: Sidebar → Contract Management or MSA
2. Open any detail page
3. Confirm action buttons (create/approve/reject/assign) are not present

### C. Admin / Procurement / Evaluation Checks
These are quick sanity checks that role-based navigation and core pages load.

**Super Admin**
1. Navigate: Sidebar → Companies → verify list loads
2. Verify admin-only pages are visible (Subscription, Admin Management, Portal Settings)

**Company Admin**
1. Navigate: Sidebar → User Management → verify list loads
2. Navigate: Sidebar → Vendor Management → verify list loads

**Procurement Lead**
1. Navigate: Sidebar → Solicitation Management → All Solicitations
2. Navigate: Sidebar → Evaluation Management

**Evaluator**
1. Navigate: Sidebar → My Evaluation
2. Confirm evaluator-only pages load without permission errors

---

## 9. Test Scenarios by Feature

### Login Feature
1. Navigate to `/login`
2. Fill invalid email → expect validation error
3. Fill valid email + wrong password → expect auth error
4. Fill valid credentials → expect redirect to `/dashboard`

### Companies Feature (Super Admin Only)
1. Login as `admin@swiftpro.com` / `@swift_alg`
2. Navigate: Sidebar → Companies
3. Verify companies list renders
4. Click "Create Company" button
5. Verify create company dialog opens
6. Note: Contract Manager and Company Admin CANNOT access this page

### Contract Management Feature
1. Login as `adediran.dbs+cm@gmail.com` / `password`
2. Navigate: Sidebar → Contract Management
3. Verify contracts list renders
4. Click to view contract details

### Solicitation Feature (Procurement Lead)
1. Login as `adediran.dbs+pl@gmail.com` / `password`
2. Navigate: Sidebar → Solicitation Management → All
3. Verify solicitation list renders
4. Click on a solicitation to view details

### Vendor Proposal Feature
1. Login as `shsimag079@ingam.top` / `password`
2. Navigate: Sidebar → Solicitation Management
3. Verify vendor can view solicitations
4. Verify canSubmitProposals permission works

### Evaluation Feature
1. Login as `adediran.dbs+ev1@gmail.com` / `password`
2. Navigate: Sidebar → My Evaluation
3. Verify evaluator can access evaluation module
4. Note: canEvaluate permission required

---

**End of QA Contract**
