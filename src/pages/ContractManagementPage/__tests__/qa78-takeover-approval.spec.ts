import { test, expect, Page } from "@playwright/test";

type SeedRole =
  | "vendor"
  | "procurement"
  | "contract_manager"
  | "approver"
  | "view_only"
  | "project_manager";

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

  const authRaw = JSON.stringify(auth);
  await page.addInitScript((raw: string) => {
    window.localStorage.setItem("auth", raw);
  }, authRaw);
}

const CONTRACT_ID = "c-takeover-1";

function contractDetailPayload() {
  return {
    status: 200,
    message: "ok",
    data: {
      _id: CONTRACT_ID,
      contractId: "CT-TAKEOVER-1",
      title: "Takeover Contract",
      status: "publish",
      owner: true,
      currency: "CAD",
      projectManager: {
        status: "pending",
        user: {
          name: "requester@swiftpro.com",
          user: {
            name: "Requesting PM",
          },
        },
      },
    },
  };
}

test.describe("QA #78 Increment 2 - CM/PL take-over approval", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("CM/PL sees take-over request section and can approve/reject", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");

    await page.route(
      `**/contract/manager/contracts/${CONTRACT_ID}`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(contractDetailPayload()),
        }),
    );

    let approvalPayload: unknown = null;
    await page.route("**/project-manager/approval", (route) => {
      approvalPayload = route.request().postDataJSON();
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", data: {} }),
      });
    });

    await page.goto(`/dashboard/contract-management/${CONTRACT_ID}`, {
      waitUntil: "commit",
    });

    await expect(
      page.getByText(/Take-over request from Requesting PM/i),
    ).toBeVisible({ timeout: 30000 });

    const approveButton = page.getByRole("button", {
      name: /^Approve$/i,
    });
    const rejectButton = page.getByRole("button", {
      name: /^Reject$/i,
    });
    await expect(approveButton).toBeVisible();
    await expect(rejectButton).toBeVisible();

    // Reject requires a reason: opens a dialog, submit is disabled until filled.
    await rejectButton.click();
    const dialogSubmit = page.getByRole("button", { name: /^Reject$/i }).last();
    await expect(dialogSubmit).toBeDisabled();

    await page
      .getByPlaceholder(/reason/i)
      .fill("Not qualified for this contract");
    await expect(dialogSubmit).toBeEnabled();

    // Close the reject dialog without submitting, then exercise Approve.
    await page.keyboard.press("Escape");

    await approveButton.click();
    // Approve path in this flow submits directly (no reason required).
    await expect.poll(() => approvalPayload).not.toBeNull();
    expect(approvalPayload).toMatchObject({ action: "approved" });
  });
});
