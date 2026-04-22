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
  });

  test("updates contract via PUT and shows success", async ({ page }) => {
    test.setTimeout(120000);
    const contractId = "c-123";
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.stack || err.message));

    await page.route(`**/contract/manager/contracts/${contractId}**`, async (route) => {
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
              status: "draft",
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
      expect(body.businessDivision).toBe("BD");
      expect(body.projectId).toBe("p1");
      expect(body.solicitationId).toBe("s1");
      expect(body.contractPaymentTerm).toBe("pt1");
      expect(body.paymentTerm).toBe("Net 30");
      expect(body.contractTermType).toBe("tt1");
      expect(body.termType).toBe("Fixed");
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

    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      const passthrough = [
        `/contract/manager/contracts/${contractId}`,
        "/contract/manager/types",
        "/contract/manager/payment-terms",
        "/contract/manager/terms",
        "/contract/manager/personnel",
        "/contract/manager/awarded-solicitation",
      ];
      if (passthrough.some((p) => url.includes(p))) {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.goto(`/dashboard/contract-management/${contractId}`);
    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
    await expect(
      page.getByRole("heading", { name: "Original Title" }),
    ).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find(
        (b) => (b.textContent || "").trim() === "Edit Contract",
      ) as HTMLButtonElement | undefined;
      btn?.click();
    });
    await expect(page.getByTestId("edit-contract-sheet")).toBeVisible({
      timeout: 30000,
    });
    const sheet = page.getByTestId("edit-contract-sheet");

    const putReq = page.waitForRequest(
      (req) =>
        req.method() === "PUT" &&
        req.url().includes("/contract/manager/contracts"),
      { timeout: 30000 },
    );

    const nameInput = sheet.getByTestId("contract-name-input");
    await nameInput.fill("Edited Title");
    await expect(nameInput).toHaveValue("Edited Title");
    await sheet.getByRole("button", { name: "Continue" }).click();
    await sheet.getByRole("button", { name: "Save Changes" }).click();
    await putReq;

    await expect(page.getByText("Contract updated successfully")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByTestId("edit-contract-sheet")).toBeHidden({ timeout: 5000 });
  });
});
