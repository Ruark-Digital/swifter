import { test, expect, Page } from "@playwright/test";

type SeedRole =
  | "vendor"
  | "procurement"
  | "contract_manager"
  | "approver"
  | "view_only";

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

async function mockContractManagerEndpoints(page: Page) {
  await page.route("**/contract/manager/contracts/stats", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 200,
        message: "ok",
        data: {
          all: 0,
          draft: 0,
          pending_approval: 0,
          active: 0,
          completed: 0,
          suspended: 0,
          expired: 0,
          terminated: 0,
        },
      }),
    });
  });

  const fulfillEmptyContractsList = async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 200,
        message: "ok",
        data: { contracts: [], totalContracts: 0 },
      }),
    });
  };

  await page.route(
    "**/contract/manager/contracts/me",
    fulfillEmptyContractsList,
  );
  await page.route(
    "**/contract/manager/contracts/me?**",
    fulfillEmptyContractsList,
  );

  await page.route(
    "**/contract/manager/contracts?**",
    fulfillEmptyContractsList,
  );
  await page.route("**/contract/manager/contracts", fulfillEmptyContractsList);

  await page.route("**/contract/manager/contracts/**", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ status: 404, message: "not found" }),
    });
  });

  await page.route("**/contract/manager/**", async (route) => {
    await route.abort();
  });
}

async function mockCreateContractMeta(page: Page) {
  await page.route("**/contract/manager/types**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", data: [] }),
    });
  });

  await page.route("**/contract/manager/payment-terms**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", data: [] }),
    });
  });

  await page.route("**/contract/manager/terms**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", data: [] }),
    });
  });

  await page.route(
    "**/contract/manager/awarded-solicitation**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    },
  );

  await page.route("**/contract/manager/projects?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", data: [] }),
    });
  });

  await page.route("**/contract/manager/business-division**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: { docs: [], totalDocs: 0, page: 1, limit: 1000, totalPages: 1 },
      }),
    });
  });

  await page.route(
    "**/procurement/solicitations/meta/categories**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    },
  );
}

async function mockApproverEndpoints(page: Page) {
  await page.route("**/contract/approver/contracts/stats**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 200,
        message: "ok",
        data: {
          all: 0,
          draft: 0,
          pending_approval: 0,
          active: 0,
          completed: 0,
          suspended: 0,
          expired: 0,
          terminated: 0,
        },
      }),
    });
  });

  await page.route("**/contract/approver/contracts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 200,
        message: "ok",
        data: {
          contracts: [],
          totalContracts: 0,
        },
      }),
    });
  });
}

async function mockVendorEndpoints(page: Page) {
  await page.route("**/contract/vendor/contracts/stats**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: {
          all: 0,
          active: 0,
          completed: 0,
          cancelled: 0,
          suspended: 0,
          expired: 0,
        },
      }),
    });
  });

  await page.route("**/contract/vendor/contracts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "ok",
        data: { contracts: [], totalContracts: 0 },
      }),
    });
  });
}

test.describe("Contract Management Page (roles)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("renders procurement/manager view with actions and tabs", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");
    await mockContractManagerEndpoints(page);

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });

    await expect(
      page.getByRole("heading", { name: "Contracts", level: 2 }),
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Export")).toBeVisible({ timeout: 30000 });
    await expect(
      page.locator('[data-testid="create-contracts-button"]'),
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("tab", { name: "All Contracts" })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole("tab", { name: "My Contracts" })).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.locator('[data-testid="contracts-stats-all"]'),
    ).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="contracts-table"]')).toBeVisible({
      timeout: 30000,
    });
  });

  test("paginates contracts list using page and limit params", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");
    await mockContractManagerEndpoints(page);

    const requests: Array<{ page?: string; limit?: string }> = [];

    await page.unroute("**/contract/manager/contracts?**");
    await page.unroute("**/contract/manager/contracts");
    const fulfillPaginatedList = async (route: any) => {
      const url = new URL(route.request().url());
      const pageParam = url.searchParams.get("page") ?? undefined;
      const limitParam = url.searchParams.get("limit") ?? undefined;
      requests.push({ page: pageParam, limit: limitParam });

      const currentPage = Number(pageParam ?? "1");
      const contracts =
        currentPage === 1
          ? Array.from({ length: 10 }).map((_, index) => ({
              _id: `c-${index + 1}`,
              contractId: `COND${index + 1}`,
              title: `Contract Page 1 - ${index + 1}`,
              status: "draft",
              createdAt: "2026-04-24T11:28:01.584Z",
              creator: {
                _id: "u-1",
                name: "Test User",
                email: "test@swiftpro.com",
              },
            }))
          : [
              {
                _id: "c-11",
                contractId: "COND11",
                title: "Contract Page 2 - 11",
                status: "draft",
                createdAt: "2026-04-24T11:28:01.584Z",
                creator: {
                  _id: "u-1",
                  name: "Test User",
                  email: "test@swiftpro.com",
                },
              },
              {
                _id: "c-12",
                contractId: "COND12",
                title: "Contract Page 2 - 12",
                status: "draft",
                createdAt: "2026-04-24T11:28:01.584Z",
                creator: {
                  _id: "u-1",
                  name: "Test User",
                  email: "test@swiftpro.com",
                },
              },
            ];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: {
            contracts,
            totalContracts: 12,
          },
        }),
      });
    };
    await page.route("**/contract/manager/contracts?**", fulfillPaginatedList);
    await page.route("**/contract/manager/contracts", fulfillPaginatedList);

    const listResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/contract/manager/contracts") &&
        !res.url().includes("/stats") &&
        res.status() === 200,
      { timeout: 30000 },
    );

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });
    const listJson = (await listResponsePromise).json() as Promise<any>;
    expect(((await listJson)?.data?.contracts ?? []).length).toBeGreaterThan(0);

    await expect(
      page.getByRole("link", { name: "Contract Page 1 - 1", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Contract Page 2 - 11", exact: true }),
    ).toHaveCount(0);

    await page.click('[data-testid="next-page"]');
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("link", { name: "Contract Page 2 - 11", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Contract Page 1 - 1", exact: true }),
    ).toHaveCount(0);

    expect(requests.length).toBeGreaterThanOrEqual(2);
    expect(requests[0]).toEqual({ page: "1", limit: "10" });
    expect(requests[requests.length - 1]).toEqual({ page: "2", limit: "10" });
  });

  test("uses Project Manager name in Vendor column", async ({ page }) => {
    await seedAuth(page, "contract_manager");
    await mockContractManagerEndpoints(page);

    await page.unroute("**/contract/manager/contracts?**");
    await page.unroute("**/contract/manager/contracts");
    const fulfillContracts = async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: {
            contracts: [
              {
                _id: "c-1",
                contractId: "COND2234",
                title: "Test Contract",
                contractRelationship: "project",
                contractValue: 6000000,
                status: "pending_approval",
                createdAt: "2026-04-23T16:09:13.442Z",
                projectManager: { name: "adediran.dbs+pm@gmail.com" },
              },
            ],
            totalContracts: 1,
          },
        }),
      });
    };
    await page.route("**/contract/manager/contracts?**", fulfillContracts);
    await page.route("**/contract/manager/contracts", fulfillContracts);

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });

    await expect(page.locator('[data-testid="search-input"]')).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.locator("table").getByText("adediran.dbs+pm@gmail.com", {
        exact: true,
      }),
    ).toBeVisible({ timeout: 30000 });
  });

  test("create contract keeps draft on outside close, resets on cancel/close", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");
    await mockContractManagerEndpoints(page);
    await mockCreateContractMeta(page);

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });

    await expect(
      page.getByRole("heading", { name: "Contract Management" }),
    ).toBeVisible({ timeout: 30000 });

    await page
      .getByRole("button", { name: "Create Contracts" })
      .click({ timeout: 30000 });
    await expect(
      page.locator('[data-testid="create-contract-sheet"]'),
    ).toBeVisible();

    const createDialog = page.getByRole("dialog", { name: "Create Contract" });
    const contractNameInput = createDialog
      .locator('input[placeholder="Enter Title"]')
      .first();
    await contractNameInput.fill("My Draft Contract");

    await page.mouse.click(1, 1);

    await page.getByRole("button", { name: "Create Contracts" }).click();
    await expect(
      page.locator('[data-testid="create-contract-sheet"]'),
    ).toBeVisible();
    await expect(contractNameInput).toHaveValue("My Draft Contract");

    await page.getByRole("button", { name: "Cancel" }).click();

    await page.getByRole("button", { name: "Create Contracts" }).click();
    await expect(
      page.locator('[data-testid="create-contract-sheet"]'),
    ).toBeVisible();
    await expect(contractNameInput).toHaveValue("");

    await page.getByRole("button", { name: "Close" }).click();
  });

  test("save as draft works after selecting approval group", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await seedAuth(page, "contract_manager");
    await mockContractManagerEndpoints(page);
    await mockCreateContractMeta(page);

    await page.route("**/contract/manager/types**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: [{ _id: "type-1", name: "Fixed Price" }],
        }),
      });
    });

    await page.route(
      "**/procurement/solicitations/meta/categories**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [{ _id: "cat-1", name: "Construction" }],
          }),
        });
      },
    );

    await page.route(
      "**/contract/manager/business-division**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              docs: [{ _id: "div-1", name: "Division A", location: "HQ" }],
              totalDocs: 1,
              page: 1,
              limit: 1000,
              totalPages: 1,
            },
          }),
        });
      },
    );

    await page.route("**/contract/manager/personnel**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: [
            {
              _id: "approver-1",
              email: "approver1@swiftpro.com",
              role: [{ _id: "role-approver", name: "approver", __v: 0 }],
              firstName: "Alice",
              lastName: "Approver",
              status: "active",
              statusOrder: "1",
            },
          ],
        }),
      });
    });

    await page.route("**/upload", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ message: "method not allowed" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: [
            {
              _id: "doc-1",
              name: "test.pdf",
              url: "https://example.com/test.pdf",
              type: "application/pdf",
              size: "1 KB",
              originalName: "test.pdf",
              fileName: "test.pdf",
            },
          ],
        }),
      });
    });

    await page.unroute("**/contract/manager/contracts?**");
    await page.unroute("**/contract/manager/contracts");
    const fulfillContracts = async (route: any) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: { _id: "contract-1", title: "My Draft Contract" },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: { contracts: [], totalContracts: 0 },
        }),
      });
    };
    await page.route("**/contract/manager/contracts?**", fulfillContracts);
    await page.route("**/contract/manager/contracts", fulfillContracts);

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });

    await page
      .getByRole("button", { name: "Create Contracts" })
      .click({ timeout: 60000 });
    await expect(
      page.locator('[data-testid="create-contract-sheet"]'),
    ).toBeVisible();

    const createDialog = page.getByRole("dialog", { name: "Create Contract" });
    const contractNameInput = createDialog
      .locator('input[placeholder="Enter Title"]')
      .first();
    await contractNameInput.fill("My Draft Contract");

    await createDialog
      .locator('[role="combobox"]')
      .filter({ hasText: "Enter Contract Relationship" })
      .first()
      .click();
    await page.getByRole("option", { name: "Stand-Alone Contract" }).click();

    await createDialog
      .locator('[role="combobox"]')
      .filter({ hasText: "Fixed Price/Lump Sum" })
      .first()
      .click();
    await page.getByRole("option", { name: "Fixed Price" }).click();

    await createDialog
      .locator('[role="combobox"]')
      .filter({ hasText: "Legal" })
      .first()
      .click();
    await page.getByText("Construction").click();

    await createDialog.getByRole("combobox", { name: "Currency" }).click();
    await page.getByPlaceholder("Search currency...").fill("CAD");
    await page
      .getByText(/^CAD\b/)
      .first()
      .click();

    const ratingBlock = page
      .locator("div")
      .filter({ hasText: "Complexity Rating (1-10)" })
      .first();
    await ratingBlock.getByText("5", { exact: true }).click();

    await createDialog
      .locator('textarea[placeholder="Enter Detail"]')
      .first()
      .fill("Draft contract description");

    await createDialog
      .locator('[role="combobox"]')
      .filter({ hasText: "Select Division" })
      .first()
      .click();
    await page.getByRole("option", { name: "Division A" }).click();

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Contract Effective Date")).toBeVisible();
    await expect(page.getByText("Step 3 of 9: Timeline")).toBeVisible();

    await createDialog
      .getByText("Contract Effective Date")
      .locator("xpath=following-sibling::button[1]")
      .click();
    await page.getByRole("button", { name: /Today/ }).click();
    await page.keyboard.press("Escape");

    await createDialog
      .getByRole("button", { name: "End Date" })
      .first()
      .click();
    await page.getByRole("button", { name: /Today/ }).click();
    await page.keyboard.press("Escape");

    const documentsStep = page.getByText("Step 7 of 9: Documents");
    for (let i = 0; i < 10; i += 1) {
      if ((await documentsStep.count()) > 0) break;
      await page.getByRole("button", { name: "Continue" }).click();
    }
    await expect(documentsStep).toBeVisible();

    const fileInput = createDialog.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "test.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 test"),
    });

    await createDialog.getByRole("button", { name: "Upload Files" }).click();
    await expect(
      createDialog.getByText("All files uploaded successfully"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Continue" }).click();

    const groupNameInput = page.getByPlaceholder("Group 1");
    await expect(groupNameInput).toBeVisible();
    await groupNameInput.fill("Group A");

    await page.locator('label[for="approval-0-1"]').click();

    const reqPromise = page.waitForRequest(
      (req) =>
        req.method() === "POST" &&
        req.url().includes("/contract/manager/contracts"),
    );

    await page.getByRole("button", { name: "Save as Draft" }).click();

    const req = await reqPromise;
    const payload = req.postDataJSON() as any;

    expect(payload.status).toBe("draft");
    expect(payload.approvers ?? []).toEqual([]);

    await expect(
      page.locator('[data-testid="create-contract-sheet"]'),
    ).toHaveCount(0);
  });

  test("renders vendor view and does not call manager endpoints", async ({
    page,
  }) => {
    await seedAuth(page, "vendor");
    await mockVendorEndpoints(page);

    let managerRequests = 0;
    await page.route("**/contract/manager/contracts**", async (route) => {
      managerRequests += 1;
      await route.abort();
    });

    const statsResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/contract/vendor/contracts/stats") &&
        res.status() === 200,
      { timeout: 15000 },
    );
    const listResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/contract/vendor/contracts") &&
        !res.url().includes("/stats") &&
        res.status() === 200,
      { timeout: 15000 },
    );

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });
    await statsResponse;
    await listResponse;

    await expect(
      page.locator('[data-testid="vendor-contracts-table"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="vendor-empty-state"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="create-contracts-button"]'),
    ).toHaveCount(0);
    await expect(page.getByText("Export")).toHaveCount(0);
    expect(managerRequests).toBe(0);
  });

  test("renders approver view and uses approver endpoints", async ({
    page,
  }) => {
    await seedAuth(page, "approver");
    await mockApproverEndpoints(page);

    let managerRequests = 0;
    await page.route("**/contract/manager/contracts**", async (route) => {
      managerRequests += 1;
      await route.abort();
    });

    const statsResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/contract/approver/contracts/stats") &&
        res.status() === 200,
      { timeout: 15000 },
    );
    const listResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/contract/approver/contracts") &&
        !res.url().includes("/stats") &&
        res.status() === 200,
      { timeout: 15000 },
    );

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });
    await statsResponse;
    await listResponse;

    await expect(
      page.locator('[data-testid="contracts-stats-all"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="contracts-table"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="create-contracts-button"]'),
    ).toHaveCount(0);
    expect(managerRequests).toBe(0);
  });

  test("renders view-only mode and hides create/export actions", async ({
    page,
  }) => {
    await seedAuth(page, "view_only");
    await mockContractManagerEndpoints(page);

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });

    await expect(
      page.getByRole("heading", { name: "Contract Management" }),
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Read-only")).toBeVisible({ timeout: 30000 });
    await expect(
      page.locator('[data-testid="create-contracts-button"]'),
    ).toHaveCount(0);
    await expect(page.getByText("Export")).toHaveCount(0);
    await expect(page.locator('[data-testid="search-input"]')).toBeDisabled();
    await expect(
      page.locator('[data-testid="create-contract-cta"]'),
    ).toHaveCount(0);
    await expect(page.locator('[data-testid="contracts-table"]')).toBeVisible({
      timeout: 30000,
    });
  });

  test("review step shows labels (not ids) for vendor/type/category/payment term", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await seedAuth(page, "contract_manager");

    await mockContractManagerEndpoints(page);

    await page.route("**/contract/manager/personnel**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });

    await page.route(
      "**/contract/manager/contracts/vendor/**/project-managers**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data: [] }),
        });
      },
    );

    const typesPayload = { _id: "t1", name: "Fixed Price" };
    const categoriesPayload = { _id: "c1", name: "Legal" };
    const paymentTermPayload = { _id: "pt1", name: "Net 30" };
    const vendorPayload = {
      _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      name: "Acme Vendor",
      email: "vendor@acme.com",
    };

    const routeWithSecondCallDocs = async (
      urlGlob: string,
      item: any,
      opts?: { wrapSecondCallInData?: boolean },
    ) => {
      let calls = 0;
      await page.route(urlGlob, async (route) => {
        calls += 1;
        const body =
          calls === 1
            ? { status: 200, message: "ok", data: [item] }
            : opts?.wrapSecondCallInData
              ? { status: 200, message: "ok", data: { docs: [item] } }
              : { status: 200, message: "ok", data: { docs: [item] } };

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });
    };

    await routeWithSecondCallDocs("**/contract/manager/types**", typesPayload, {
      wrapSecondCallInData: true,
    });
    await routeWithSecondCallDocs(
      "**/procurement/solicitations/meta/categories**",
      categoriesPayload,
      { wrapSecondCallInData: true },
    );
    await routeWithSecondCallDocs(
      "**/contract/manager/payment-terms**",
      paymentTermPayload,
      { wrapSecondCallInData: true },
    );
    await routeWithSecondCallDocs(
      "**/procurement/solicitations/vendors**",
      vendorPayload,
      { wrapSecondCallInData: true },
    );

    await page.route("**/contract/manager/terms**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
    await page.route(
      "**/contract/manager/awarded-solicitation**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data: [] }),
        });
      },
    );
    await page.route("**/contract/manager/projects?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
    await page.route(
      "**/contract/manager/business-division**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              docs: [{ _id: "bd1", name: "Ontario" }],
              totalDocs: 1,
              page: 1,
              limit: 1000,
              totalPages: 1,
            },
          }),
        });
      },
    );

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });

    await page
      .getByRole("button", { name: "Create Contracts" })
      .click({ timeout: 60000 });

    const createDialog = page.locator('[data-testid="create-contract-sheet"]');
    await expect(createDialog).toBeVisible();
    await expect(
      page.getByText("Step 1 of 9: Basic Information"),
    ).toBeVisible();

    await createDialog.getByTestId("contract-name-input").fill("Test Contract");

    await createDialog
      .getByText("Contract Relationship")
      .locator("..")
      .getByRole("combobox")
      .first()
      .click();
    await page.getByRole("option", { name: "Stand-Alone Contract" }).click();

    await createDialog
      .getByText("Contract Type")
      .locator("..")
      .getByRole("combobox")
      .first()
      .click();
    await page.getByRole("option", { name: "Fixed Price" }).click();

    await createDialog.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Legal" }).click();

    await createDialog.getByRole("combobox", { name: "Currency" }).click();
    await page.getByPlaceholder("Search currency...").fill("CAD");
    await page
      .getByText(/^CAD\b/)
      .first()
      .click();

    await createDialog.getByText("5", { exact: true }).click();

    await createDialog
      .getByTestId("description-input")
      .fill("A test description");

    await createDialog
      .getByText("Business Division")
      .locator("..")
      .getByRole("combobox")
      .first()
      .click();
    await page.getByRole("option", { name: "Ontario" }).click();

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Step 2 of 9: Contract Team")).toBeVisible({
      timeout: 30000,
    });
    await page
      .getByRole("button", { name: "Select vendor or type email" })
      .click();
    await page.getByRole("option", { name: "Acme Vendor" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Step 3 of 9: Timeline")).toBeVisible({
      timeout: 30000,
    });

    await createDialog
      .getByText("Contract Effective Date")
      .locator("xpath=following-sibling::button[1]")
      .click();
    await page.getByRole("button", { name: /Today/ }).click();
    await page.keyboard.press("Escape");

    await createDialog
      .getByRole("button", { name: "End Date" })
      .first()
      .click();
    await page.getByRole("button", { name: /Today/ }).click();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Step 4 of 9: Deliverables")).toBeVisible({
      timeout: 30000,
    });
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByText("Step 5 of 9: Contract Value & Payments"),
    ).toBeVisible({ timeout: 30000 });
    await createDialog.getByPlaceholder("Enter Amount").first().fill("1000");
    await createDialog
      .getByText("Payment Structure")
      .locator("..")
      .getByRole("combobox")
      .first()
      .click();
    await page.getByRole("option", { name: "Monthly" }).click();
    await createDialog
      .getByText("Payment Term")
      .locator("..")
      .getByRole("combobox")
      .first()
      .click();
    await page.getByRole("option", { name: "Net 30" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByText("Step 6 of 9: Compliance & Security"),
    ).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Step 7 of 9: Documents")).toBeVisible({
      timeout: 30000,
    });
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByText("Step 8 of 9: Configure Approval Level"),
    ).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.locator("p", { hasText: "Send for Approval" }),
    ).toBeVisible({
      timeout: 30000,
    });
    await page.getByRole("button", { name: "Send for Approval" }).click();

    await expect(page.getByText("Step 9 of 9: Review & Publish")).toBeVisible({
      timeout: 30000,
    });

    await expect(page.getByText("Fixed Price")).toBeVisible();
    await expect(page.getByText("Legal")).toBeVisible();

    await page.getByRole("button", { name: "2. Contract Team" }).click();
    await expect(page.getByText("Acme Vendor")).toBeVisible();

    await page
      .getByRole("button", { name: "3. Contract Value & Payments" })
      .click();
    await expect(page.getByText("Net 30")).toBeVisible();

    await expect(page.getByText("t1")).toHaveCount(0);
    await expect(page.getByText("c1")).toHaveCount(0);
    await expect(page.getByText("aaaaaaaaaaaaaaaaaaaaaaaa")).toHaveCount(0);
    await expect(page.getByText("pt1")).toHaveCount(0);
  });

  test("cannot continue when payment structure is milestone and amount/due date are missing", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await seedAuth(page, "contract_manager");
    await mockContractManagerEndpoints(page);

    const typesPayload = { _id: "t1", name: "Fixed Price" };
    const categoriesPayload = { _id: "c1", name: "Legal" };
    const paymentTermPayload = { _id: "pt1", name: "Net 30" };

    await page.route("**/contract/manager/types**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: [typesPayload],
        }),
      });
    });
    await page.route(
      "**/procurement/solicitations/meta/categories**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: [categoriesPayload],
          }),
        });
      },
    );
    await page.route("**/contract/manager/payment-terms**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          data: [paymentTermPayload],
        }),
      });
    });
    await page.route("**/contract/manager/terms**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
    await page.route(
      "**/contract/manager/awarded-solicitation**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: 200, message: "ok", data: [] }),
        });
      },
    );
    await page.route("**/contract/manager/projects?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
    await page.route(
      "**/contract/manager/business-division**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              docs: [{ _id: "bd1", name: "Ontario" }],
              totalDocs: 1,
              page: 1,
              limit: 1000,
              totalPages: 1,
            },
          }),
        });
      },
    );

    await page.goto("/dashboard/contract-management", { waitUntil: "commit" });
    await page
      .getByRole("button", { name: "Create Contracts" })
      .click({ timeout: 60000 });

    const createDialog = page.locator('[data-testid="create-contract-sheet"]');
    await expect(
      page.getByText("Step 1 of 9: Basic Information"),
    ).toBeVisible();

    await createDialog.getByTestId("contract-name-input").fill("Test Contract");
    await createDialog
      .getByText("Contract Relationship")
      .locator("..")
      .getByRole("combobox")
      .first()
      .click();
    await page.getByRole("option", { name: "Stand-Alone Contract" }).click();

    await createDialog
      .getByText("Contract Type")
      .locator("..")
      .getByRole("combobox")
      .first()
      .click();
    await page.getByRole("option", { name: "Fixed Price" }).click();

    await createDialog.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Legal" }).click();

    await createDialog.getByRole("combobox", { name: "Currency" }).click();
    await page.getByPlaceholder("Search currency...").fill("CAD");
    await page
      .getByText(/^CAD\b/)
      .first()
      .click();

    await createDialog.getByText("5", { exact: true }).click();
    await createDialog
      .getByTestId("description-input")
      .fill("A test description");

    await createDialog
      .getByText("Business Division")
      .locator("..")
      .getByRole("combobox")
      .first()
      .click();
    await page.getByRole("option", { name: "Ontario" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Step 2 of 9: Contract Team")).toBeVisible({
      timeout: 30000,
    });
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Step 3 of 9: Timeline")).toBeVisible({
      timeout: 30000,
    });
    await createDialog
      .getByText("Contract Effective Date")
      .locator("xpath=following-sibling::button[1]")
      .click();
    await page.getByRole("button", { name: /Today/ }).click();
    await page.keyboard.press("Escape");
    await createDialog
      .getByRole("button", { name: "End Date" })
      .first()
      .click();
    await page.getByRole("button", { name: /Today/ }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Step 4 of 9: Deliverables")).toBeVisible({
      timeout: 30000,
    });
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByText("Step 5 of 9: Contract Value & Payments"),
    ).toBeVisible({
      timeout: 30000,
    });

    await createDialog.getByPlaceholder("Enter Amount").first().fill("1000");
    await createDialog
      .getByText("Payment Structure")
      .locator("..")
      .getByRole("combobox")
      .first()
      .click();
    await page.getByRole("option", { name: "Milestone" }).click();

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByText("Step 6 of 9: Compliance & Security"),
    ).toHaveCount(0);
    await expect(page.getByText("Milestone amount is required")).toBeVisible();
    await expect(
      page.getByText("Milestone due date is required"),
    ).toBeVisible();
  });
});
