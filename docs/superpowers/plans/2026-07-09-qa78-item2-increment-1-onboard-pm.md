# QA #78 Item 2 — Increment 1: Onboard-by-Email PM Assignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a CM/PL (contract owner) or Company Admin assign a brand-new vendor project manager to a live contract by entering their email, from the contract detail page.

**Architecture:** Add one method to the existing `contractManagerApi` factory that POSTs to the already-backed onboard endpoint; add a small Forge-based dialog (mirroring `AddApproverDialog`); render its trigger button on `ContractDetailPage` behind role + contract-status gating. No new routes or state containers.

**Tech Stack:** React 18, TypeScript, @tanstack/react-query, @adexdsamson/forge, shadcn/ui, Vitest (unit), Playwright (e2e).

## Global Constraints

- Verify gate before every commit: `npx tsc -b` AND `npm run lint` must pass (NOT `tsc --noEmit`).
- Cancel / non-submit buttons MUST have `type="button"` — shadcn `Button` defaults to `type="submit"` and will otherwise submit the Forge form.
- API base URL and auth are handled by `@/lib/axiosInstance`; endpoint paths are relative and start with `/contract/...`.
- The manager PM onboard endpoint is `POST /contract/manager/contracts/{contractId}/project-manager`, body `{ email }`, returns `201`; `409` when the email is already a PM for the vendor.
- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Scope is regular contracts only (MSA is a later pass). "Pick existing PM" is Increment 2 and is NOT in this plan.

## File Structure

- **Modify** `src/pages/ContractManagementPage/api/contractManagerApi.ts` — add `onboardProjectManager` method to the `createContractManagerApi` object (next to `approveProjectManagerAssignment`, ~line 934).
- **Create** `src/pages/ContractManagementPage/components/AssignProjectManagerDialog.tsx` — email-only assign dialog.
- **Modify** `src/pages/ContractManagementPage/ContractDetailPage.tsx` — gating booleans + trigger button (near the take-over banner, ~line 577).
- **Create** `src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm-api.unit.spec.ts` — Vitest unit test for the API method.
- **Create** `src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm.spec.ts` — Playwright e2e for the button gating + submit.

---

### Task 1: `onboardProjectManager` API method

**Files:**
- Modify: `src/pages/ContractManagementPage/api/contractManagerApi.ts` (add method ~line 934, after `approveProjectManagerAssignment`)
- Test: `src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm-api.unit.spec.ts`

**Interfaces:**
- Consumes: `createContractManagerApi(client)` factory, `MANAGER_CONTRACTS_PREFIX` (`/contract/manager/contracts`), `ApiResponse` type (already imported in the file).
- Produces: `onboardProjectManager(contractId: string, payload: { email: string }) => Promise<ApiResponse<{ message: string }>>`.

- [ ] **Step 1: Write the failing unit test**

Create `src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm-api.unit.spec.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { createContractManagerApi } from "../api/contractManagerApi";

describe("qa78 item2 assign-pm api (unit)", () => {
  it("onboardProjectManager posts the email to the manager project-manager endpoint", async () => {
    const post = vi.fn().mockResolvedValue({ data: { message: "ok" } });
    const api = createContractManagerApi({
      get: vi.fn(),
      post,
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    });

    await api.onboardProjectManager("c1", { email: "pm@example.com" });

    expect(post).toHaveBeenCalledWith({
      url: "/contract/manager/contracts/c1/project-manager",
      payload: { email: "pm@example.com" },
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm-api.unit.spec.ts`
Expected: FAIL — `api.onboardProjectManager is not a function`.

- [ ] **Step 3: Add the method**

In `contractManagerApi.ts`, immediately after the `approveProjectManagerAssignment` method (which ends ~line 934), add:

```ts
    onboardProjectManager: async (
      contractId: string,
      payload: { email: string },
    ) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/project-manager`,
        payload,
      });
      return res as ApiResponse<{ message: string }>;
    },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm-api.unit.spec.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Verify build + lint**

Run: `npx tsc -b && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/ContractManagementPage/api/contractManagerApi.ts \
  src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm-api.unit.spec.ts
git commit -m "feat(qa78): onboardProjectManager api method (Item 2 Inc 1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Assign-PM dialog + contract-detail wiring

**Files:**
- Create: `src/pages/ContractManagementPage/components/AssignProjectManagerDialog.tsx`
- Modify: `src/pages/ContractManagementPage/ContractDetailPage.tsx` (gating ~after line 293; trigger ~after line 577)
- Test: `src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm.spec.ts`

**Interfaces:**
- Consumes: `contractManagerApi.onboardProjectManager` (Task 1); `AssignProjectManagerDialog` props `{ contractId: string; hasExistingPm?: boolean; invalidateQueryKey: unknown[]; trigger: React.ReactNode }`.
- Produces: default-exported `AssignProjectManagerDialog` React component.

- [ ] **Step 1: Create the dialog component**

Create `src/pages/ContractManagementPage/components/AssignProjectManagerDialog.tsx`:

```tsx
import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import { TextInput } from "@/components/layouts/FormInputs";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";
import { contractManagerApi } from "../api/contractManagerApi";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AssignPmFormValues = { email: string };

const AssignProjectManagerDialog: React.FC<{
  contractId: string;
  hasExistingPm?: boolean;
  invalidateQueryKey: unknown[];
  trigger: React.ReactNode;
}> = ({ contractId, hasExistingPm, invalidateQueryKey, trigger }) => {
  const [open, setOpen] = React.useState(false);
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset } = useForge<AssignPmFormValues>({
    defaultValues: { email: "" },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["onboard-project-manager", contractId],
    mutationFn: (email: string) =>
      contractManagerApi.onboardProjectManager(contractId, { email }),
    onSuccess: async () => {
      toastHandler.success(
        "Project Manager",
        "Project manager onboarded and assigned successfully",
      );
      await queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
      reset();
      setOpen(false);
    },
    onError: (error: ApiResponseError) => {
      if (error.response?.status === 409) {
        toastHandler.error(
          "Assign Project Manager",
          "This person is already a project manager for this vendor — select them from the list instead.",
        );
        return;
      }
      toastHandler.error("Assign Project Manager", error);
    },
  });

  const handleSubmit = async (data: AssignPmFormValues) => {
    const email = data.email?.trim() ?? "";
    if (!EMAIL_RE.test(email)) {
      toastHandler.error("Assign Project Manager", "Enter a valid email address");
      return;
    }
    await mutateAsync(email);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-full max-w-lg gap-0 overflow-hidden rounded-2xl border-0 p-0">
        <Forge control={control} onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 pb-2 pt-6">
            <div className="text-lg font-semibold text-[#0F0F0F] dark:text-slate-100">
              {hasExistingPm ? "Change Project Manager" : "Assign Project Manager"}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Invite a new vendor project manager by email. They receive an
              onboarding invite and are assigned to this contract.
            </p>
          </div>

          <div className="space-y-4 px-6 pb-4 pt-2">
            <Forger
              name="email"
              label="Project Manager Email"
              placeholder="pm@example.com"
              component={TextInput}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[#E5E7EB] dark:border-slate-700 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-4"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-xl bg-[#2A4467] px-4 text-white"
              disabled={isPending}
            >
              {isPending ? "Assigning..." : hasExistingPm ? "Change PM" : "Assign PM"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default AssignProjectManagerDialog;
```

- [ ] **Step 2: Import the dialog in `ContractDetailPage.tsx`**

Add with the other component imports near the top of the file:

```tsx
import AssignProjectManagerDialog from "./components/AssignProjectManagerDialog";
```

- [ ] **Step 3: Add gating booleans in `ContractDetailPage.tsx`**

Immediately after the `takeOverRequesterName` declaration (~line 293), add:

```tsx
  const isLiveContract =
    contractData?.status === "active" || contractData?.status === "publish";
  const canAssignPm =
    ((isManager && isContractOwner) || isCompanyAdmin) &&
    isLiveContract &&
    !takeOverPending;
  const hasAssignedPm = Boolean(contractData?.projectManager?.user?._id);
```

- [ ] **Step 4: Render the trigger button**

Immediately after the `canApproveTakeOver` block (the take-over banner, ends ~line 603), add:

```tsx
      {canAssignPm && (
        <div className="flex items-center justify-end">
          <AssignProjectManagerDialog
            contractId={id ?? ""}
            hasExistingPm={hasAssignedPm}
            invalidateQueryKey={queryKey}
            trigger={
              <Button
                variant="default"
                className="bg-[#2A4467] hover:bg-[#2A4467]/90"
              >
                {hasAssignedPm ? "Change PM" : "Assign PM"}
              </Button>
            }
          />
        </div>
      )}
```

- [ ] **Step 5: Write the failing e2e test**

Create `src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm.spec.ts`:

```ts
import { test, expect, Page } from "@playwright/test";

type SeedRole = "vendor" | "contract_manager";

async function seedAuth(page: Page, role: SeedRole) {
  const now = new Date().toISOString();
  const auth = {
    state: {
      user: {
        _id: "test-user",
        email: "test@swiftpro.com",
        name: "Test User",
        role: { _id: "role-1", name: role, __v: 0 },
        companyId: { name: "Test Co", _id: "company-1" },
        currency: "CAD",
        createdAt: now,
        updatedAt: now,
        status: "active",
        module: {
          contractManagement: true,
          _id: "m-1",
          companyId: "company-1",
          solicitationManagement: true,
          evaluationsManagement: true,
          vendorManagement: true,
          reportsAnalytics: true,
          vendorsQA: true,
          generalUpdatesNotifications: true,
          addendumManagement: true,
          myActions: true,
          createdAt: now,
          updatedAt: now,
          __v: 0,
        },
        isAi: false,
        isDeleted: false,
        contactEmail: "test@swiftpro.com",
      },
      token: "test-token",
      refresh: null,
      authorities: [],
    },
    version: 0,
  };
  await page.addInitScript((raw: string) => {
    window.localStorage.setItem("auth", raw);
  }, JSON.stringify(auth));
}

const CONTRACT_ID = "c-item2-1";

function contractDetailPayload() {
  return {
    status: 200,
    message: "ok",
    data: {
      _id: CONTRACT_ID,
      contractId: "CT-ITEM2-1",
      title: "Assign PM Contract",
      status: "publish",
      owner: true,
      currency: "CAD",
    },
  };
}

test.describe("QA #78 Item 2 Inc 1 - assign PM by email", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      }),
    );
    await page.route(`**/contract/manager/contracts/${CONTRACT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(contractDetailPayload()),
      }),
    );
  });

  test("CM owner can assign a PM by email", async ({ page }) => {
    await seedAuth(page, "contract_manager");

    let onboardPayload: unknown = null;
    await page.route("**/contract/manager/contracts/*/project-manager", (route) => {
      onboardPayload = route.request().postDataJSON();
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ status: 201, message: "ok", data: {} }),
      });
    });

    await page.goto(`/dashboard/contract-management/${CONTRACT_ID}`, {
      waitUntil: "commit",
    });

    const assignButton = page.getByRole("button", { name: /^Assign PM$/i });
    await expect(assignButton).toBeVisible({ timeout: 30000 });
    await assignButton.click();

    await page.getByPlaceholder("pm@example.com").fill("newpm@example.com");
    await page.getByRole("button", { name: /^Assign PM$/i }).last().click();

    await expect.poll(() => onboardPayload).not.toBeNull();
    expect(onboardPayload).toMatchObject({ email: "newpm@example.com" });
  });

  test("vendor does not see the Assign PM button", async ({ page }) => {
    await seedAuth(page, "vendor");
    await page.goto(`/dashboard/contract-management/${CONTRACT_ID}`, {
      waitUntil: "commit",
    });
    await expect(page.getByText(/Assign PM Contract/i)).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByRole("button", { name: /^Assign PM$/i }),
    ).toHaveCount(0);
  });
});
```

- [ ] **Step 6: Run the e2e test to verify the "assign" test drives the flow**

Run: `npx playwright test src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm.spec.ts`
Expected: both tests PASS. (If the dev server is not auto-started by the Playwright config, start it first with `npm run dev` in a separate shell.)

- [ ] **Step 7: Verify build + lint**

Run: `npx tsc -b && npm run lint`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/ContractManagementPage/components/AssignProjectManagerDialog.tsx \
  src/pages/ContractManagementPage/ContractDetailPage.tsx \
  src/pages/ContractManagementPage/__tests__/qa78-item2-assign-pm.spec.ts
git commit -m "feat(qa78): assign PM by email on contract detail (Item 2 Inc 1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Manual verification (after both tasks)

Live as CM (`adediran.dbs+cm@gmail.com`) or Company Admin on `localhost:5173`:
1. Open an **active/published** contract you own → "Assign PM" (or "Change PM" if one exists) is visible.
2. Open a **draft / terminated** contract → button is absent.
3. On a contract with a **pending take-over** request → button is absent (only the take-over banner shows).
4. Click Assign PM → enter a new email → submit → success toast, dialog closes, PM reflected after refetch.
5. Enter an email that already belongs to a vendor PM → the "already a project manager… select them from the list instead" toast appears.

## Self-review notes

- Spec coverage: §A entry/gating → Task 2 Steps 3–4; §B API (Inc 1 method) → Task 1; §C dialog (email mode) → Task 2 Step 1; testing → Task 1 unit + Task 2 e2e. Increment 2 items (list/assign-existing, toggle) intentionally excluded.
- No placeholders: all steps contain full code/commands.
- Type consistency: `onboardProjectManager(contractId, { email })` signature identical in Task 1 (definition), the unit test, the dialog mutation, and the e2e payload assertion.
