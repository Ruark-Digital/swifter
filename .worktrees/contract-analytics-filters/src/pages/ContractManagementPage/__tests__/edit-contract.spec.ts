import { test, expect, Page } from "@playwright/test";

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    const auth = {
      state: {
        user: {
          _id: "test-user",
          email: "admin@swiftpro.com",
          name: "Test User",
          role: { _id: "role-1", name: "contract_manager", __v: 0 },
          companyId: { name: "Test Co", _id: "company-1" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0,
          },
          isAi: false,
          isDeleted: false,
          contactEmail: "admin@swiftpro.com",
        },
        token: "test-token",
        refresh: null,
        authorities: [],
      },
      version: 0,
    };
    window.localStorage.setItem("auth", JSON.stringify(auth));
  });
}

test.describe("Edit Contract", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/contract/manager/contracts/")) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("updates contract via PUT and shows success", async ({ page }) => {
    const contractId = "c-123";

    await page.route(`**/contract/manager/contracts/${contractId}`, async (route) => {
      if (route.request().method().toUpperCase() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: {
              contractFormationStage: {
                draft: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
                review: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
                approval: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
                execution: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
              },
              _id: contractId,
              company: "company-1",
              project: { _id: "p1", name: "P1" },
              solicitation: "s1",
              vendor: { _id: "v1", name: "Vendor" },
              vendorPersonnel: [],
              creator: { _id: "u1", name: "User", email: "u@e.com" },
              contractType: { _id: "type1", name: "Monthly" },
              contractTerm: "Fixed",
              internalTeam: [],
              managers: [],
              businessDivision: "BD",
              rating: 5,
              title: "Original Title",
              contractRelationship: "project",
              contractId: "X-1",
              description: "Desc",
              jobTitle: "Manager",
              category: "Cat",
              visibility: "private",
              currency: "USD",
              contractValue: 1000,
              contigency: "10%",
              holdBack: 5,
              holdBackBank: 0,
              paymentTerms: "Net 30",
              paymentStructure: "Monthly",
              insurance: {
                _id: "ins1",
                contract: contractId,
                contractSecurity: false,
                contractSecurityType: [],
                expiryDate: new Date().toISOString(),
                policy: [],
                __v: 0,
              },
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString(),
              duration: 30,
              deliverables: [],
              files: [],
              currentApprovalLevel: 0,
              approvers: [],
              status: "publish",
              datePublished: new Date().toISOString(),
              timezone: "UTC",
              isDeleted: false,
              milestone: [],
              signatories: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              __v: 0,
              holdBackReleased: 0,
              savingAmount: 0,
            },
          }),
        });
        return;
      }
      // PUT assertion
      const body = route.request().postDataJSON();
      expect(body.title).toBe("Edited Title");
      expect(body.contractRelationship).toBe("project");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "updated",
          data: { ...body, _id: contractId },
        }),
      });
    });

    await page.route("**/contract/manager/types", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [{ _id: "type1", name: "Monthly" }] }),
      });
    });
    await page.route("**/contract/manager/payment-terms", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [{ _id: "pt1", name: "Net 30" }] }),
      });
    });
    await page.route("**/contract/manager/terms", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [{ _id: "tt1", name: "Fixed" }] }),
      });
    });
    await page.route("**/contract/manager/personnel", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
    await page.route("**/contract/manager/awarded-solicitation", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await page.getByRole("tab", { name: "Documents" }).click();
    await page.getByRole("button", { name: "Edit Contract" }).click();
    await expect(page.getByTestId("edit-contract-sheet")).toBeVisible();

    // Change title field: relies on Step1BasicInfo input name="name"
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill("Edited Title");
    // Ctrl+S to save
    await page.keyboard.press("Control+S");

    await expect(page.getByText("Contract updated successfully")).toBeVisible();
    await expect(page.getByTestId("edit-contract-sheet")).toBeHidden({ timeout: 5000 });
  });
});
