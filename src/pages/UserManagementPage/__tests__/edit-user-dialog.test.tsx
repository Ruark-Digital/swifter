import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import EditUserDialog from "../components/EditUserDialog";

const getRequestMock = vi.fn();
const putRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: (...args: unknown[]) => getRequestMock(...args),
  putRequest: (...args: unknown[]) => putRequestMock(...args),
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("EditUserDialog", () => {
  beforeEach(() => {
    getRequestMock.mockImplementation(({ url }: { url: string }) => {
      if (url === "/users/user-1") {
        return Promise.resolve({
          data: {
            data: {
              user: {
                _id: "user-1",
                name: "Adediran Adeola Approver",
                email: "adediran@example.com",
                role: "approver",
                phone: "09032465789",
                department: "Science",
              },
            },
          },
        });
      }

      if (url === "/onboarding/roles") {
        return Promise.resolve({
          data: {
            data: [
              { _id: "role-1", name: "approver" },
              { _id: "role-2", name: "view_only" },
            ],
          },
        });
      }

      return Promise.reject(new Error(`Unexpected url: ${url}`));
    });

    putRequestMock.mockReset();
  });

  afterEach(() => {
    getRequestMock.mockReset();
  });

  it("renders fetched user details without crashing", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <EditUserDialog open onOpenChange={vi.fn()} userId="user-1" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Edit User")).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Adediran Adeola Approver")).toBeInTheDocument();
    expect(screen.getByDisplayValue("adediran@example.com")).toBeInTheDocument();
  });
});
