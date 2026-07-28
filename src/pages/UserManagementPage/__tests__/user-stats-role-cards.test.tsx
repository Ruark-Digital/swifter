import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import UserStats from "../components/UserStats";
import type { Modules } from "@/types";

const getRequestMock = vi.fn();
const useUserMock = vi.fn();

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: (...args: unknown[]) => getRequestMock(...args),
}));

vi.mock("@/store/authSlice", () => ({
  useUser: () => useUserMock(),
}));

const modules = (overrides: Partial<Modules>): Modules =>
  ({
    solicitationManagement: true,
    contractManagement: true,
    ...overrides,
  }) as Modules;

const renderStats = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UserStats />
    </QueryClientProvider>,
  );
};

describe("UserStats role breakdown cards (QA #282)", () => {
  beforeEach(() => {
    getRequestMock.mockResolvedValue({
      data: {
        data: {
          allUsers: 7,
          activeUsers: 7,
          suspendedUsers: 0,
          inactiveUsers: 0,
          admins: 2,
          procurementLeads: 2,
          evaluators: 1,
        },
      },
    });
  });

  afterEach(() => {
    getRequestMock.mockReset();
    useUserMock.mockReset();
  });

  it("hides Admins/Procurement Leads/Evaluators when the CLM module is on", async () => {
    useUserMock.mockReturnValue({
      module: modules({ contractManagement: true }),
    });

    renderStats();

    await waitFor(() => expect(screen.getByText("All Users")).toBeTruthy());
    expect(screen.queryByText("Admins")).toBeNull();
    expect(screen.queryByText("Procurement Leads")).toBeNull();
    expect(screen.queryByText("Evaluators")).toBeNull();
  });

  it("shows them for a solicitation-only company", async () => {
    useUserMock.mockReturnValue({
      module: modules({ contractManagement: false }),
    });

    renderStats();

    await waitFor(() => expect(screen.getByText("Admins")).toBeTruthy());
    expect(screen.getByText("Procurement Leads")).toBeTruthy();
    expect(screen.getByText("Evaluators")).toBeTruthy();
  });

  it("handles the object-shaped module payload", async () => {
    useUserMock.mockReturnValue({
      module: {
        solicitationManagement: { enabled: true },
        contractManagement: { enabled: false },
      } as unknown as Modules,
    });

    renderStats();

    await waitFor(() => expect(screen.getByText("Admins")).toBeTruthy());
  });
});
