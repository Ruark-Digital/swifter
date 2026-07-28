import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import ProfileInformation from "../components/ProfileInformation";
import type { UserRole } from "@/types";

const getRequestMock = vi.fn();
const userRoleMock = vi.fn();

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: (...args: unknown[]) => getRequestMock(...args),
  putRequest: vi.fn(),
  postRequest: vi.fn(),
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/store/authSlice", () => ({
  useUser: () => ({ _id: "u1", name: "Finch Monica", avatar: "" }),
  useSetUser: () => vi.fn(),
}));

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({ userRole: userRoleMock() }),
}));

const renderFor = (role: UserRole) => {
  userRoleMock.mockReturnValue(role);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileInformation />
    </QueryClientProvider>,
  );
};

const mockUser = (role: unknown) => {
  getRequestMock.mockResolvedValue({
    data: {
      data: {
        user: {
          _id: "u1",
          name: "Finch Monica",
          email: "cm1@example.com",
          role,
          phone: "0803000000",
          department: "Procurement",
        },
      },
    },
  });
};

describe("ProfileInformation role field visibility (QA #280)", () => {
  beforeEach(() => {
    mockUser({ name: "contract_manager" });
  });

  afterEach(() => {
    getRequestMock.mockReset();
    userRoleMock.mockReset();
  });

  // QA #280 hit contract_manager first, but project_manager, approver and
  // view_only were missing from every list too — none of them may render an
  // empty form again.
  test.each<UserRole>([
    "contract_manager",
    "project_manager",
    "approver",
    "view_only",
  ])("%s sees the standard editable profile fields", async (role) => {
    renderFor(role);

    await waitFor(() => expect(screen.getByText("Name")).toBeInTheDocument());
    expect(screen.getByText("Email Address")).toBeInTheDocument();
    expect(screen.getByText("Phone Number")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
  });

  test("contract_manager does not get the vendor/company-only fields", async () => {
    renderFor("contract_manager");

    await waitFor(() => expect(screen.getByText("Name")).toBeInTheDocument());
    expect(screen.queryByText("Company Name")).toBeNull();
    expect(screen.queryByText("Business Type")).toBeNull();
    expect(screen.queryByText("Location")).toBeNull();
    expect(screen.queryByText("Website")).toBeNull();
    expect(screen.queryByText("Category")).toBeNull();
  });

  test("existing roles keep their fields after the slug rekey", async () => {
    renderFor("company_admin");

    await waitFor(() => expect(screen.getByText("Name")).toBeInTheDocument());
    expect(screen.getByText("Company Name")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.getByText("Email Address")).toBeInTheDocument();
  });

  test("vendor keeps its vendor-specific fields", async () => {
    renderFor("vendor");

    await waitFor(() =>
      expect(screen.getByText("Business Type")).toBeInTheDocument(),
    );
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.queryByText("Department")).toBeNull();
  });

  // `/users/me` returns `role` as an object for some accounts and a bare slug
  // string for others — reading `.name` unconditionally blanked the field.
  test("populates Role when the API returns a bare slug string", async () => {
    mockUser("view_only");
    renderFor("view_only");

    await waitFor(() =>
      expect(screen.getByDisplayValue("view_only")).toBeInTheDocument(),
    );
  });

  test("populates Role when the API returns a populated object", async () => {
    mockUser({ name: "contract_manager" });
    renderFor("contract_manager");

    await waitFor(() =>
      expect(screen.getByDisplayValue("contract_manager")).toBeInTheDocument(),
    );
  });

  test("falls back to the resolved active role when the API omits role", async () => {
    mockUser(undefined);
    renderFor("approver");

    await waitFor(() =>
      expect(screen.getByDisplayValue("approver")).toBeInTheDocument(),
    );
  });

  test("no role renders an empty profile form", async () => {
    const roles: UserRole[] = [
      "super_admin",
      "company_admin",
      "procurement",
      "contract_manager",
      "evaluator",
      "approver",
      "project_manager",
      "view_only",
      "vendor",
    ];

    for (const role of roles) {
      const { unmount } = renderFor(role);
      await waitFor(() =>
        expect(screen.getByText("Email Address")).toBeInTheDocument(),
      );
      expect(screen.getByText("Name")).toBeInTheDocument();
      unmount();
    }
  });
});
