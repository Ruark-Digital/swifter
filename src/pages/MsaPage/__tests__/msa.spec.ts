import { test, expect, Page } from "@playwright/test";

type SeedRole =
  | "vendor"
  | "procurement"
  | "contract_manager"
  | "approver"
  | "view_only"
  | "project_manager"
  | "company_admin";

async function seedAuth(page: Page, role: SeedRole) {
  await page.addInitScript((roleName) => {
    const auth = {
      state: {
        user: {
          _id: "test-user",
          email: "test@swiftpro.com",
          name: "Test User",
          role: { _id: "role-1", name: roleName, __v: 0 },
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
          contactEmail: "test@swiftpro.com",
          ...(roleName === "project_manager"
            ? { projectmanagerId: "pm-1" }
            : {}),
        },
        token: "test-token",
        refresh: null,
        authorities: [],
      },
      version: 0,
    };

    window.localStorage.setItem("auth", JSON.stringify(auth));
  }, role);
}

test.describe("MSA Page (stats)", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/msa-contracts/stats")) {
        if (url.includes("/contract/manager/")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              message: "MSA contract stats fetched successfully",
              data: {
                all: 10,
                active: 3,
                draft: 2,
                suspended: 1,
                expired: 1,
                terminated: 1,
                pending: 2,
                linked: 4,
              },
            }),
          });
          return;
        }

        if (url.includes("/contract/user/")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              message: "User MSA stats fetched successfully",
              data: { all: 99, active: 98, draft: 97, expired: 96 },
            }),
          });
          return;
        }

        if (url.includes("/contract/vendor/")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              message: "Vendor MSA stats fetched successfully",
              data: { all: 7, active: 5, draft: 1, expired: 1 },
            }),
          });
          return;
        }
      }

      const sampleContracts = [
        {
          _id: "msa-1",
          title: "MSA Pending",
          msaContractId: "MSA-PENDING",
          contractValue: 1000,
          status: "Pending Approval",
          createdAt: "2026-04-24T11:28:01.584Z",
          vendor: { name: "Vendor A", email: "vendor@example.com", id: "v-1" },
          projectManager: { name: "PM One" },
          creator: {
            _id: "u-1",
            name: "Test User",
            email: "test@swiftpro.com",
          },
        },
        {
          _id: "msa-2",
          title: "MSA Active",
          msaContractId: "MSA-ACTIVE",
          contractValue: 2000,
          status: "Active",
          createdAt: "2026-04-24T11:28:01.584Z",
          vendor: { name: "Vendor B", email: "vendorb@example.com", id: "v-2" },
          projectManager: { name: "PM Two" },
          creator: {
            _id: "u-1",
            name: "Test User",
            email: "test@swiftpro.com",
          },
        },
      ];

      if (url.includes("/msa-contracts/me")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok", data: { contracts: [] } }),
        });
        return;
      }

      if (url.includes("/msa-contracts")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { contracts: sampleContracts, totalContracts: 2 },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", data: [] }),
      });
    });
  });

  test("renders manager MSA stats from API", async ({ page }) => {
    await seedAuth(page, "contract_manager");

    const statsResponse = page.waitForResponse(
      (res) => res.url().includes("msa-contracts/stats") && res.status() === 200,
      { timeout: 30000 },
    );

    await page.goto("/dashboard/msa", { waitUntil: "domcontentloaded" });
    const statsRes = await statsResponse;
    const statsJson = await statsRes.json();
    expect(statsJson?.data?.all).toBe(10);

    await expect(page.locator('[data-testid="msa-stats-all"]')).toContainText(
      "10",
    );
    await expect(
      page.locator('[data-testid="msa-stats-active"]'),
    ).toContainText("3");
    await expect(page.locator('[data-testid="msa-stats-draft"]')).toContainText(
      "2",
    );
    await expect(
      page.locator('[data-testid="msa-stats-suspended"]'),
    ).toContainText("1");
    await expect(
      page.locator('[data-testid="msa-stats-expired"]'),
    ).toContainText("1");
    await expect(
      page.locator('[data-testid="msa-stats-terminated"]'),
    ).toContainText("1");
    await expect(
      page.locator('[data-testid="msa-stats-pending"]'),
    ).toContainText("2");
    await expect(
      page.locator('[data-testid="msa-stats-linked"]'),
    ).toContainText("4");
  });

  test('filters "Pending Approval" status via stats card using pending_approval token', async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");

    await page.goto("/dashboard/msa", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("MSA Pending", { exact: true })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("MSA Active", { exact: true })).toBeVisible({
      timeout: 30000,
    });

    await page.locator('[data-testid="msa-stats-pending"]').click();

    await expect(page.getByText("MSA Pending", { exact: true })).toBeVisible();
    await expect(page.getByText("MSA Active", { exact: true })).toHaveCount(0);
  });

  test("shows project manager in Vendor column and contractValue in Value column", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");

    await page.goto("/dashboard/msa", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("PM One", { exact: true })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("PM Two", { exact: true })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("$1,000", { exact: true })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("$2,000", { exact: true })).toBeVisible({
      timeout: 30000,
    });
  });

  test("vendor does not call manager MSA stats endpoint", async ({ page }) => {
    await seedAuth(page, "vendor");

    const requests: string[] = [];
    page.on("request", (req) => {
      requests.push(req.url());
    });

    await page.goto("/dashboard/msa", { waitUntil: "domcontentloaded" });

    expect(
      requests.some((u) => u.includes("/contract/manager/msa-contracts/stats")),
    ).toBe(false);
    await expect(page.locator('[data-testid="msa-stats-all"]')).toContainText(
      "7",
      { timeout: 30000 },
    );
    await expect(
      page.locator('[data-testid="msa-stats-active"]'),
    ).toContainText("5");
  });

  test("project manager uses vendor MSA stats endpoint", async ({ page }) => {
    test.setTimeout(60_000);
    await seedAuth(page, "project_manager");

    await page.goto("/dashboard/msa", { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-testid="msa-stats-all"]')).toContainText(
      "7",
      {
        timeout: 30000,
      },
    );
    await expect(
      page.locator('[data-testid="msa-stats-active"]'),
    ).toContainText("5");
  });

  test("project manager My MSA tab uses the vendor MSA /me endpoint", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await seedAuth(page, "project_manager");

    const requests: string[] = [];
    page.on("request", (req) => {
      requests.push(req.url());
    });

    await page.goto("/dashboard/msa", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="msa-stats-all"]')).toContainText(
      "7",
      { timeout: 30000 },
    );

    // My MSA is now wired to the vendor PM /me endpoint...
    expect(
      requests.some((u) =>
        u.includes("/contract/vendor/msa-contracts/me"),
      ),
    ).toBe(true);
    // ...and NOT the manager /me endpoint (which is manager-only).
    expect(
      requests.some((u) =>
        u.includes("/contract/manager/msa-contracts/me"),
      ),
    ).toBe(false);
  });

  test("company admin calls manager MSA stats endpoint (not user endpoint)", async ({
    page,
  }) => {
    await seedAuth(page, "company_admin");

    const requests: string[] = [];
    page.on("request", (req) => {
      requests.push(req.url());
    });

    await page.goto("/dashboard/msa", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="msa-stats-all"]')).toContainText(
      "10",
      { timeout: 30000 },
    );

    expect(
      requests.some((u) => u.includes("/contract/manager/msa-contracts/stats")),
    ).toBe(true);
    expect(
      requests.some((u) => u.includes("/contract/user/msa-contracts/stats")),
    ).toBe(false);
    expect(
      requests.some((u) => u.includes("/contract/manager/msa-contracts/me")),
    ).toBe(false);
  });

  test("approver cannot see create MSA button", async ({ page }) => {
    await seedAuth(page, "approver");

    await page.goto("/dashboard/msa", { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-testid="create-msa-button"]')).toHaveCount(
      0,
    );
  });

  test("company admin sees only the MSA table, no My MSA tab (QA #266)", async ({
    page,
  }) => {
    await seedAuth(page, "company_admin");

    await page.goto("/dashboard/msa", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("MSA Pending", { exact: true })).toBeVisible({
      timeout: 30000,
    });

    await expect(page.getByRole("tab", { name: "My MSA" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "All MSA" })).toHaveCount(0);
  });
});

test.describe("MSA Detail (project manager approval)", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();

      if (
        url.includes("/contract/vendor/msa-contracts/msa-1") &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              _id: "msa-1",
              title: "MSA One",
              msaContractId: "MSA-001",
              status: "pending_approval",
              currency: "CAD",
              rating: 5,
              internalTeam: [],
              vendorPersonnel: [],
              files: [],
              approvers: [],
              currentApprovalLevel: 1,
              projectManager: { status: "pending", user: { _id: "pm-1" } },
            },
          }),
        });
        return;
      }

      if (
        url.includes("/contract/vendor/msa-contracts/msa-1/approve") &&
        route.request().method() === "POST"
      ) {
        const body = route.request().postDataJSON() as any;
        expect(body.action).toBe("approved");
        expect(body.comment).toBe("LGTM");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", data: [] }),
      });
    });
  });

  test("shows approval buttons and calls vendor approval endpoint", async ({
    page,
  }) => {
    await seedAuth(page, "project_manager");

    await page.goto("/dashboard/msa/msa-1");

    await expect(
      page.getByRole("button", { name: "Approve Contract" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Approve Contract" }).click();

    await page.getByPlaceholder("Add a comment (optional)").fill("LGTM");

    const approveReq = page.waitForRequest(
      (req) =>
        req.url().includes("/contract/vendor/msa-contracts/msa-1/approve") &&
        req.method() === "POST",
      { timeout: 15000 },
    );

    await page.getByRole("button", { name: "Approve" }).click();
    await approveReq;
  });

  test("project manager sees vendor tab set (no Analytics/KPI/Action Log)", async ({
    page,
  }) => {
    await seedAuth(page, "project_manager");

    await page.goto("/dashboard/msa/msa-1");

    await expect(page.getByRole("tab", { name: "Analytics" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "KPI" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Action Log" })).toHaveCount(0);
  });
});

test.describe("MSA Amendments (workflow)", () => {
  test.setTimeout(120000);

  test("project manager can accept an amendment from detail sheet", async ({
    page,
  }) => {
    await seedAuth(page, "project_manager");

    const msaId = "msa-1";
    const amendmentId = "amendment-1";

    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      const pathname = new URL(url).pathname;

      if (
        pathname.endsWith(`/contract/vendor/msa-contracts/${msaId}`) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              _id: msaId,
              title: "MSA One",
              msaContractId: "MSA-001",
              status: "active",
              currency: "CAD",
              rating: 5,
              internalTeam: [],
              vendorPersonnel: [],
              files: [],
              approvers: [],
              currentApprovalLevel: 1,
              projectManager: { status: "approved", user: { _id: "pm-1" } },
            },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/vendor/msa-contracts/${msaId}/amendment/stats`,
        ) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { all: 1, pending: 1, accepted: 0, rejected: 0 },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(`/contract/vendor/msa-contracts/${msaId}/amendment`) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: [
              {
                _id: amendmentId,
                amendmentId: "AM-1",
                title: "Time Impact Amendment",
                status: "pending",
                vendorStatus: "pending",
              },
            ],
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/vendor/msa-contracts/${msaId}/amendment/${amendmentId}`,
        ) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              _id: amendmentId,
              contractRef: msaId,
              contractRefModel: "MsaContract",
              approverStatus: "pending",
              vendorStatus: "pending",
              assignApprover: false,
              amendmentId: "AM-1",
              company: "company-1",
              status: "pending",
              title: "Time Impact Amendment",
              impact: "time",
              description: "Test amendment",
              changes: [],
              submittedBy: { _id: "user-1", email: "submitter@test.com" },
              files: [],
              approvers: [],
              statusHistory: [],
              __v: 0,
            },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/vendor/msa-contracts/${msaId}/amendment/${amendmentId}/status`,
        ) &&
        route.request().method() === "PATCH"
      ) {
        const body = route.request().postDataJSON() as any;
        expect(body.status).toBe("accepted");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", data: [] }),
      });
    });

    await page.goto(`/dashboard/msa/${msaId}`);
    await page.getByRole("tab", { name: "Amendments" }).click();
    await expect(page.getByTestId("amendments-table")).toBeVisible({
      timeout: 30000,
    });

    await page.getByRole("button", { name: "View" }).first().click();
    await expect(page.getByText("Amendment Details")).toBeVisible({
      timeout: 30000,
    });

    await page.getByRole("button", { name: "Accept Amendment" }).click();
  });

  test("approver can approve an amendment after assignment (MSA)", async ({
    page,
  }) => {
    await seedAuth(page, "approver");

    const msaId = "msa-2";
    const amendmentId = "amendment-2";

    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      const pathname = new URL(url).pathname;

      if (
        pathname.endsWith(`/contract/approver/msa-contracts/${msaId}`) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              _id: msaId,
              title: "MSA Two",
              msaContractId: "MSA-002",
              status: "active",
              currency: "CAD",
              rating: 5,
              internalTeam: [],
              vendorPersonnel: [],
              files: [],
              approvers: [],
              currentApprovalLevel: 1,
            },
          }),
        });
        return;
      }

      if (
        url.includes(
          `/contract/approver/msa-contracts/${msaId}/amendment/stats`,
        ) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { all: 1, pending: 1, accepted: 0, rejected: 0 },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/approver/msa-contracts/${msaId}/amendment`,
        ) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: [
              {
                _id: amendmentId,
                amendmentId: "AM-2",
                title: "Assigned Amendment",
                status: "pending",
                vendorStatus: "accepted",
              },
            ],
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/approver/msa-contracts/${msaId}/amendment/${amendmentId}`,
        ) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              _id: amendmentId,
              contractRef: msaId,
              contractRefModel: "MsaContract",
              approverStatus: "pending",
              vendorStatus: "accepted",
              assignApprover: true,
              amendmentId: "AM-2",
              company: "company-1",
              status: "pending",
              title: "Assigned Amendment",
              impact: "time",
              description: "Test amendment",
              changes: [],
              submittedBy: { _id: "user-1", email: "submitter@test.com" },
              files: [],
              approvers: [
                {
                  _id: "ap-1",
                  user: [],
                  amount: 0,
                  group: "5",
                  levelStatus: "pending",
                  completedAt: null,
                },
              ],
              statusHistory: [],
              __v: 0,
            },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/approver/msa-contracts/${msaId}/amendment/${amendmentId}/approve/status`,
        ) &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok", data: { status: true } }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/approver/msa-contracts/${msaId}/amendment/${amendmentId}/approve`,
        ) &&
        route.request().method() === "POST"
      ) {
        const body = route.request().postDataJSON() as any;
        expect(body.action).toBe("approved");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "ok" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", data: [] }),
      });
    });

    await page.goto(`/dashboard/msa/${msaId}`);
    await page.getByRole("tab", { name: "Amendments" }).click();
    await expect(page.getByTestId("amendments-table")).toBeVisible({
      timeout: 30000,
    });

    await page.getByRole("button", { name: "View" }).first().click();
    await expect(page.getByText("Amendment Details")).toBeVisible({
      timeout: 30000,
    });

    await page.getByRole("button", { name: "Approve" }).click();
  });
});

test.describe("MSA Detail (linked contracts)", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();

      if (
        url.includes("/contract/manager/msa-contracts/msa-1") &&
        !url.includes("/linked-contract") &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              _id: "msa-1",
              title: "MSA One",
              msaContractId: "MSA-001",
              status: "pending_approval",
              currency: "CAD",
              rating: 5,
              internalTeam: [],
              vendorPersonnel: [],
              files: [],
              approvers: [],
              currentApprovalLevel: 1,
              businessDivision: {
                _id: "div-1",
                name: "Engineering",
                location: "",
              },
              msaType: { _id: "type-1", name: "Master Service Agreement" },
              description: "MSA description",
              createdAt: "2026-04-30T10:43:12.296Z",
              updatedAt: "2026-04-30T10:43:12.296Z",
              creator: {
                _id: "u-1",
                name: "Test User",
                email: "test@swiftpro.com",
              },
            },
          }),
        });
        return;
      }

      if (
        url.includes("/contract/manager/msa-contracts/msa-1/linked-contract") &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "Linked contract fetched successfully",
            data: {
              _id: "linked-1",
              title: "Linked Contract One",
              contractId: "LC-001",
              company: { _id: "c-1", name: "Dispatch" },
              contractRelationship: "msa_project",
              currency: "CAD",
              contractValue: 68000000,
              datePublished: "2026-04-30T10:43:12.296Z",
              endDate: "2026-06-30T00:00:00.000Z",
              status: "pending_approval",
            },
          }),
        });
        return;
      }

      if (
        url.includes("/contract/manager/contracts/linked-1") &&
        route.request().method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            message: "ok",
            data: { _id: "linked-1", title: "Linked Contract One" },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", data: [] }),
      });
    });
  });

  test("fetches and shows linked contract on Linked Contracts tab", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");

    await page.goto("/dashboard/msa/msa-1", { waitUntil: "domcontentloaded" });

    await page
      .getByRole("tab", { name: "Linked Contracts", exact: true })
      .click();

    await expect(
      page.getByText("Linked Contract One", { exact: true }),
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("LC-001", { exact: true })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("Dispatch", { exact: true })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText(/\$68,000,000/)).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByLabel("Linked Contracts").getByText("pending_approval", {
        exact: true,
      }),
    ).toBeVisible({ timeout: 30000 });
  });

  test("linked contract actions navigates to contract detail page", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");

    await page.goto("/dashboard/msa/msa-1", { waitUntil: "domcontentloaded" });
    await page
      .getByRole("tab", { name: "Linked Contracts", exact: true })
      .click();

    await page
      .getByLabel("Linked Contracts")
      .getByRole("link", { name: "View Contract", exact: true })
      .first()
      .click();

    await expect(page).toHaveURL(/\/dashboard\/contract-management\/linked-1/, {
      timeout: 30000,
    });
  });
});

test.describe("MSA Detail (deliverables)", () => {
  test.setTimeout(120_000);

  test("uses assigned contract id for deliverables requests", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");

    const msaId = "msa-1";
    const assignedContractId = "linked-1";
    const requests: string[] = [];
    page.on("request", (req) => requests.push(req.url()));

    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      const pathname = new URL(url).pathname;

      if (pathname.endsWith(`/contract/manager/msa-contracts/${msaId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              _id: msaId,
              title: "MSA One",
              msaContractId: "MSA-001",
              status: "active",
              currency: "CAD",
              rating: 5,
              internalTeam: [],
              vendorPersonnel: [],
              files: [],
              approvers: [],
              currentApprovalLevel: 1,
              assignContract: [
                { _id: assignedContractId, name: "Linked Contract One" },
              ],
            },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/manager/contracts/${assignedContractId}/deliverables/stats`,
        )
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { total: 1, submitted: 0, pending: 1, late: 0 },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/manager/contracts/${assignedContractId}/deliverables`,
        )
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: [
              {
                deliverableId: "DEL-1",
                title: "Deliverable One",
                date: "2025-01-10",
                submissionStatus: "pending",
                status: "pending",
                kpi: {
                  kpi: 1,
                  kpiDays: 1,
                  kpiText: "1 day early",
                  kpiStatus: "early",
                },
              },
            ],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", data: [] }),
      });
    });

    await page.goto(`/dashboard/msa/${msaId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("tab", { name: "Deliverables", exact: true }).click();

    await expect(page.getByRole("cell", { name: "DEL-1" })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole("cell", { name: "1 day early" })).toBeVisible({
      timeout: 30000,
    });

    expect(
      requests.some((u) =>
        u.includes(`/contract/manager/contracts/${msaId}/deliverables`),
      ),
    ).toBe(false);
  });

  test("falls back to linked-contract endpoint when assignContract is missing", async ({
    page,
  }) => {
    await seedAuth(page, "contract_manager");

    const msaId = "msa-2";
    const linkedContractId = "linked-2";
    const requests: string[] = [];
    page.on("request", (req) => requests.push(req.url()));

    await page.route("**/api/v1/**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;

      if (pathname.endsWith(`/contract/manager/msa-contracts/${msaId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              _id: msaId,
              title: "MSA Two",
              msaContractId: "MSA-002",
              status: "active",
              currency: "CAD",
              rating: 5,
              internalTeam: [],
              vendorPersonnel: [],
              files: [],
              approvers: [],
              currentApprovalLevel: 1,
            },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/manager/msa-contracts/${msaId}/linked-contract`,
        )
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: {
              _id: linkedContractId,
              title: "Linked Contract Two",
              contractId: "LC-002",
            },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/manager/contracts/${linkedContractId}/deliverables/stats`,
        )
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: { total: 1, submitted: 0, pending: 1, late: 0 },
          }),
        });
        return;
      }

      if (
        pathname.endsWith(
          `/contract/manager/contracts/${linkedContractId}/deliverables`,
        )
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "ok",
            data: [
              {
                deliverableId: "DEL-2",
                title: "Deliverable Two",
                date: "2025-02-10",
                submissionStatus: "pending",
                status: "pending",
                kpi: { kpi: 0, kpiDays: 0, kpiText: "—", kpiStatus: "none" },
              },
            ],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", data: [] }),
      });
    });

    await page.goto(`/dashboard/msa/${msaId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("tab", { name: "Deliverables", exact: true }).click();

    await expect(page.getByRole("cell", { name: "DEL-2" })).toBeVisible({
      timeout: 30000,
    });

    expect(
      requests.some((u) =>
        u.includes(`/contract/manager/contracts/${msaId}/deliverables`),
      ),
    ).toBe(false);
    expect(
      requests.some((u) =>
        u.includes(`/contract/manager/msa-contracts/${msaId}/linked-contract`),
      ),
    ).toBe(true);
  });
});
