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

function buildContractData(overrides?: Record<string, unknown>) {
  return {
    contractFormationStage: {
      draft: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
      review: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
      approval: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
      execution: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
    },
    _id: "c-error-1",
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
      contract: "c-error-1",
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
    ...overrides,
  };
}

async function setupContractDetailRoutes(
  page: Page,
  contractId: string,
  data: ReturnType<typeof buildContractData>,
  putStatus = 200,
  putBody: ReturnType<typeof buildContractData> | null = null,
) {
  await page.route(`**/contract/manager/contracts/${contractId}**`, async (route) => {
    if (route.request().method().toUpperCase() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data }),
      });
      return;
    }
    if (route.request().method().toUpperCase() === "PUT") {
      const body = route.request().postDataJSON();
      return route.fulfill({
        status: putStatus,
        contentType: "application/json",
        body: JSON.stringify({
          status: putStatus,
          message: putStatus === 200 ? "updated" : "Something went wrong",
          data: putStatus === 200 ? { ...body, _id: contractId } : null,
        }),
      });
    }
    await route.fulfill({ status: 404 });
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
  await page.route("**/procurement/solicitations/vendors", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", data: [] }),
    });
  });
  await page.route("**/api/v1/contracts/projects", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", results: [] }),
    });
  });
  await page.route("**/api/v1/**", async (route) => {
    const passthrough = [
      `/contract/manager/contracts/${contractId}`,
      "/contract/manager/types",
      "/contract/manager/payment-terms",
      "/contract/manager/terms",
      "/contract/manager/personnel",
      "/contract/manager/awarded-solicitation",
    ];
    if (passthrough.some((p) => route.request().url().includes(p))) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", data: [] }),
    });
  });
}

test.describe("Edit Contract — Error Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("reproduces 'Failed to update contract' error when PUT returns 500", async ({ page }) => {
    test.setTimeout(120000);
    const contractId = "c-error-500";
    const data = buildContractData({ _id: contractId });
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.stack || err.message));

    await setupContractDetailRoutes(page, contractId, data, 500);

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await expect(page.getByRole("heading", { name: "Original Title" })).toBeVisible({ timeout: 30000 });

    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => (b.textContent || "").trim() === "Edit Contract");
      (btn as HTMLButtonElement | undefined)?.click();
    });

    await expect(page.getByTestId("edit-contract-sheet")).toBeVisible({ timeout: 30000 });
    const sheet = page.getByTestId("edit-contract-sheet");

    const putReq = page.waitForRequest(
      (req) => req.method() === "PUT" && req.url().includes("/contract/manager/contracts"),
      { timeout: 30000 },
    );

    const nameInput = sheet.getByTestId("contract-name-input");
    await expect(nameInput).toBeVisible({ timeout: 10000 });

    await sheet.getByRole("button", { name: "Continue" }).click();
    await sheet.getByRole("button", { name: "Save Changes" }).click();
    await putReq;

    await expect(page.getByText("Failed to update contract")).toBeVisible({ timeout: 30000 });

    expect(errors.join("\n")).toBe("");
  });

  test("renders step 2 (contract team) after clicking Continue from step 1", async ({ page }) => {
    test.setTimeout(120000);
    const contractId = "c-error-stage";
    const data = buildContractData({ _id: contractId });
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.stack || err.message));

    await setupContractDetailRoutes(page, contractId, data, 200);

    await page.goto(`/dashboard/contract-management/${contractId}`);
    await expect(page.getByRole("heading", { name: "Original Title" })).toBeVisible({ timeout: 30000 });

    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => (b.textContent || "").trim() === "Edit Contract");
      (btn as HTMLButtonElement | undefined)?.click();
    });

    await expect(page.getByTestId("edit-contract-sheet")).toBeVisible({ timeout: 30000 });
    const sheet = page.getByTestId("edit-contract-sheet");
    await expect(sheet.getByText("Step 1 of 8: Basic Information")).toBeVisible({ timeout: 10000 });

    await sheet.getByRole("button", { name: "Continue" }).click();
    await expect(sheet.getByText(/Step 2/)).toBeVisible({ timeout: 10000 });

    await expect(sheet.getByText(/Manager/)).toBeVisible({ timeout: 10000 });

    expect(errors.join("\n")).toBe("");
  });

  test("captures PUT payload when error occurs and asserts formation-stage dates are sent", async ({ page }) => {
    test.setTimeout(120000);
    const contractId = "c-error-payload";
    const data = buildContractData({ _id: contractId });
    const errors: string[] = [];
    let capturedPutPayload: Record<string, unknown> | null = null;
    page.on("pageerror", (err) => errors.push(err.stack || err.message));

    await page.route(`**/contract/manager/contracts/${contractId}**`, async (route) => {
      if (route.request().method().toUpperCase() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data }),
        });
        return;
      }
      if (route.request().method().toUpperCase() === "PUT") {
        capturedPutPayload = route.request().postDataJSON();
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: 500, message: "Something went wrong", data: null }),
        });
      }
      await route.fulfill({ status: 404 });
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
    await page.route("**/procurement/solicitations/vendors", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
    await page.route("**/api/v1/contracts/projects", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", results: [] }),
      });
    });
    await page.route("**/api/v1/**", async (route) => {
      const passthrough = [
        `/contract/manager/contracts/${contractId}`,
        "/contract/manager/types",
        "/contract/manager/payment-terms",
        "/contract/manager/terms",
        "/contract/manager/personnel",
        "/contract/manager/awarded-solicitation",
      ];
      if (passthrough.some((p) => route.request().url().includes(p))) {
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
    await expect(page.getByRole("heading", { name: "Original Title" })).toBeVisible({ timeout: 30000 });

    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => (b.textContent || "").trim() === "Edit Contract");
      (btn as HTMLButtonElement | undefined)?.click();
    });

    await expect(page.getByTestId("edit-contract-sheet")).toBeVisible({ timeout: 30000 });
    const sheet = page.getByTestId("edit-contract-sheet");

    const nameInput = sheet.getByTestId("contract-name-input");
    await expect(nameInput).toBeVisible({ timeout: 10000 });

    await sheet.getByRole("button", { name: "Continue" }).click();
    await sheet.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Failed to update contract")).toBeVisible({ timeout: 30000 });

    expect(capturedPutPayload).toBeTruthy();
    expect(capturedPutPayload!.title).toBe("Original Title");
    expect(capturedPutPayload!.contractRelationship).toBe("project");
    expect(capturedPutPayload!.businessDivision).toBe("BD");
    expect(capturedPutPayload!.projectId).toBe("p1");
    expect(capturedPutPayload!.status).toBe("draft");
    expect(capturedPutPayload!.contractFormationStage).toBeTruthy();

    const cf = capturedPutPayload!.contractFormationStage as Record<string, { startDate?: string; endDate?: string }>;
    expect(cf.draft).toBeTruthy();
    expect(cf.review).toBeTruthy();
    expect(cf.approval).toBeTruthy();
    expect(cf.execution).toBeTruthy();

    expect(errors.join("\n")).toBe("");
  });
});
